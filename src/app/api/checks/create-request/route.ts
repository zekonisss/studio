import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import crypto from 'crypto';

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // --- 1. SANITIZATION (Fixing "undefined" error) ---
    // Firestore crashes on 'undefined'. We MUST convert missing fields to 'null'.
    const requesterId = body.requesterId;
    const driverName = (body.driverName || '').trim();
    const targetCompany = (body.targetCompany || '').trim();
    const birthDate = body.birthDate || null; // Fix: undefined -> null
    const startDate = body.startDate || null; // Fix: undefined -> null
    const endDate = body.endDate || null;     // Fix: undefined -> null
    const targetEmail = body.targetEmail ? body.targetEmail.trim() : null;
    const isCurrentEmployer = body.isCurrentEmployer || false;
    const requesterCompanyName = body.requesterCompanyName || '';

    // Basic Validation
    if (!requesterId || !driverName || !targetCompany) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // --- 2. DUPLICATE DETECTION (Case-Insensitive) ---
    // Fetch user's requests to compare in memory (avoids complex Firestore indexes)
    const snapshot = await db.collection('verification_requests')
      .where('requesterId', '==', requesterId)
      .get();

    const newDriverLower = driverName.toLowerCase();
    const newCompanyLower = targetCompany.toLowerCase();

    const activeDuplicate = snapshot.docs.find(doc => {
      const data = doc.data();
      
      // Check A: Is it active? (Ignore 'NEW' or 'EXPIRED' - allow retrying those)
      const isActive = data.status === 'PENDING' || data.status === 'COMPLETED';
      if (!isActive) return false;

      // Check B: Time window (30 days)
      const created = new Date(data.createdAt);
      const now = new Date();
      const diffDays = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
      if (diffDays > 30) return false;

      // Check C: Data Match (Normalized)
      const existingDriver = (data.driverName || '').trim().toLowerCase();
      const existingCompany = (data.targetCompany || '').trim().toLowerCase();
      
      // If birthDate is provided in both, it must match.
      // If birthDate is missing in one, rely on Name + Company.
      let birthMatch = true;
      if (birthDate && data.birthDate) {
          birthMatch = birthDate === data.birthDate;
      }

      return existingDriver === newDriverLower && 
             existingCompany === newCompanyLower && 
             birthMatch;
    });

    if (activeDuplicate) {
      console.log(`[DUPLICATE BLOCKED] Found existing request: ${activeDuplicate.id}`);
      return NextResponse.json({ 
        success: true, 
        id: activeDuplicate.id, 
        token: activeDuplicate.data().token,
        message: 'Active request already exists',
        isDuplicate: true 
      });
    }

    // --- 3. SMART EMAIL DISCOVERY ---
    let finalEmail = targetEmail;
    let emailSource = 'USER';
    let initialStatus = 'PENDING';

    if (!finalEmail) {
       // A. Check Directory
       // Normalize company ID for lookup (e.g. "UAB Manvesta" -> "manvesta")
       const directoryId = targetCompany.toLowerCase().replace(/[^a-z0-9]/g, ''); 
       const directoryDoc = await db.collection('company_directory').doc(directoryId).get();
       
       if (directoryDoc.exists && directoryDoc.data()?.email) {
         finalEmail = directoryDoc.data()?.email;
         emailSource = 'DIRECTORY';
       } else {
         // B. Smart Guess (Mock)
         // Assuming format info@... for now.
         finalEmail = `info@${directoryId}.lt`; 
         emailSource = 'AI_GUESS';
       }
    }

    // --- 4. CREATE REQUEST ---
    const token = crypto.randomBytes(32).toString('hex');
    
    const newRequest = {
      requesterId,
      requesterCompanyName,
      driverName,     // Sanitized
      birthDate,      // Sanitized (null if empty)
      targetCompany,  // Sanitized
      targetEmail: finalEmail,
      emailSource,
      startDate,      // Sanitized
      endDate,        // Sanitized
      isCurrentEmployer,
      status: initialStatus,
      token,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('verification_requests').add(newRequest);
    console.log(`[CREATED] New request ID: ${docRef.id}`);

    return NextResponse.json({ success: true, id: docRef.id, token });

  } catch (error: any) {
    console.error('[API ERROR] Create Request Failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
