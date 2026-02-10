import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { GoogleGenerativeAI } from '@google/generative-ai'; 
import crypto from 'crypto';

// --- INIT FIREBASE ---
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

// --- SAUGI AI PAIEŠKA (Su 'try/catch') ---
async function findEmailSafe(companyName: string) {
  console.log(`[AI START] Ieškoma: ${companyName}`);
  
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_SEARCH_API_KEY;
  if (!apiKey) {
    console.error("[AI ERROR] Nėra API rakto .env faile!");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Naudojame "flash" modelį, nes jis greičiausias
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Find the official driver recruitment email for transport company "${companyName}" in Lithuania. Return ONLY JSON: {"email": "example@com"}. If not found, return {"email": null}.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    
    // Išvalome JSON
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) return null;
    
    const jsonText = text.substring(firstBrace, lastBrace + 1);
    const data = JSON.parse(jsonText);
    
    console.log(`[AI SUCCESS] Rasta: ${data.email}`);
    return data.email;

  } catch (error) {
    console.error("[AI FAILED] AI paieška nepavyko, bet tęsiame be el. pašto.", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[API] Gauta nauja užklausa...");
    const body = await request.json();
    
    const requesterId = body.requesterId;
    const driverName = body.driverName || '';
    const targetCompany = body.targetCompany || '';
    let targetEmail = body.targetEmail || null;

    // --- DUBLIKATŲ PATIKRA ---
    const snapshot = await db.collection('verification_requests')
      .where('requesterId', '==', requesterId)
      .get();
      
    const activeDuplicate = snapshot.docs.find(doc => {
      const data = doc.data();
      const isActive = data.status === 'PENDING' || data.status === 'COMPLETED' || data.status === 'NEW';
      if (!isActive) return false;
      const created = new Date(data.createdAt);
      if ((new Date().getTime() - created.getTime()) / (1000 * 3600 * 24) > 30) return false;
      return (data.driverName || '').toLowerCase() === driverName.toLowerCase() && 
             (data.targetCompany || '').toLowerCase() === targetCompany.toLowerCase();
    });

    if (activeDuplicate) {
        return NextResponse.json({ success: true, isDuplicate: true, message: 'Active request exists' });
    }

    // --- LOGIKA ---
    let emailSource = 'USER';
    let status = 'PENDING'; // Pagal nutylėjimą

    if (!targetEmail) {
       // Bandome surasti su AI
       const aiEmail = await findEmailSafe(targetCompany);
       
       if (aiEmail) {
         targetEmail = aiEmail;
         emailSource = 'AI_GEMINI';
         status = 'PENDING'; // Žalia/Geltona (Geras adresas)
       } else {
         // SVARBUS PATAISYMAS: 
         // Jei neradome el. pašto, statusas turi būti 'NEW' (Didžiosiomis!), kad Adminas matytų.
         targetEmail = null; 
         emailSource = 'NONE';
         status = 'NEW'; // <--- ČIA BUVO KLAIDA ("New" vs "NEW")
       }
    } else {
        // Jei vartotojas pats įvedė el. paštą
        status = 'PENDING';
    }

    // --- IŠSAUGOJIMAS ---
    const newRequest = {
      requesterId, 
      driverName, 
      targetCompany,
      targetEmail, 
      emailSource,
      status, // Dabar čia bus arba 'PENDING', arba 'NEW'
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
    console.log("[API] Išsaugota! ID:", docRef.id, "Status:", status);

    return NextResponse.json({ success: true, id: docRef.id });

  } catch (error: any) {
    console.error('[CRITICAL API ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
