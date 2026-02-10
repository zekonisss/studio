import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { GoogleGenerativeAI } from '@google/generative-ai'; 
import crypto from 'crypto';

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// --- SAUGI AI PAIEŠKA ---
async function findEmailSafe(companyName: string) {
  console.log(`[AI START] Searching for: ${companyName}`);
  
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_SEARCH_API_KEY;
  if (!apiKey) {
    console.error("[AI SKIP] No API Key found.");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Find the official driver recruitment email for transport company "${companyName}" in Lithuania. Return ONLY JSON: {"email": "example@com"}. If not found, return {"email": null}.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    
    // Bandome ištraukti JSON
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) return null;
    
    const jsonText = text.substring(firstBrace, lastBrace + 1);
    const data = JSON.parse(jsonText);
    
    console.log(`[AI SUCCESS] Found: ${data.email}`);
    return data.email;

  } catch (error) {
    console.error("[AI FAILED] AI search failed, proceeding without email.", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[API] Processing new request...");
    const body = await request.json();
    
    const requesterId = body.requesterId;
    const driverName = body.driverName || '';
    const targetCompany = body.targetCompany || '';
    let targetEmail = body.targetEmail || null;

    // --- DUPLICATE CHECK ---
    const snapshot = await db.collection('verification_requests')
      .where('requesterId', '==', requesterId)
      .get();
      
    const activeDuplicate = snapshot.docs.find(doc => {
      const data = doc.data();
      const isActive = data.status === 'PENDING' || data.status === 'COMPLETED';
      if (!isActive) return false;
      const created = new Date(data.createdAt);
      if ((new Date().getTime() - created.getTime()) / (1000 * 3600 * 24) > 30) return false;
      return (data.driverName || '').toLowerCase() === driverName.toLowerCase() && 
             (data.targetCompany || '').toLowerCase() === targetCompany.toLowerCase();
    });

    if (activeDuplicate) {
        return NextResponse.json({ success: true, isDuplicate: true, message: 'Request exists' });
    }

    // --- AI LOGIC ---
    let emailSource = 'USER';
    let status = 'PENDING';

    if (!targetEmail) {
       const aiEmail = await findEmailSafe(targetCompany);
       if (aiEmail) {
         targetEmail = aiEmail;
         emailSource = 'AI_GEMINI';
       } else {
         targetEmail = null; 
         emailSource = 'NONE';
         status = 'New'; // Mark for Admin review
       }
    }

    // --- SAVE TO DB ---
    const newRequest = {
      requesterId, 
      driverName, 
      targetCompany,
      targetEmail, 
      emailSource,
      status,
      requesterCompanyName: body.requesterCompanyName || '',
      birthDate: body.birthDate || null,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      isCurrentEmployer: body.isCurrentEmployer || false,
      token: crypto.randomBytes(32).toString('hex'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('verification_requests').add(newRequest);
    console.log("[API] Request saved with ID:", docRef.id);

    return NextResponse.json({ success: true, id: docRef.id });

  } catch (error: any) {
    console.error('[CRITICAL API ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
