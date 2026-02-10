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

// --- KONFIGURACIJA ---
// Naudojame tavo turimą raktą.
const API_KEY = process.env.GOOGLE_SEARCH_API_KEY || process.env.GEMINI_API_KEY;

// --- GEMINI PAIEŠKOS LOGIKA 🧠 ---
async function findSmartEmailWithGemini(companyName: string): Promise<{ email: string | null, source: string }> {
  if (!API_KEY) {
    console.warn("Nėra API rakto - praleidžiama AI paieška.");
    return { email: null, source: 'NONE' };
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    // Naudojame modelį, kuris palaiko įrankius (Flash yra greičiausias ir pigiausias)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      // model: "gemini-2.0-flash", // Galima bandyti ir naujesnį jei veikia
    });

    // Promptas be "Tools" (nes Search Grounding kartais reikalauja specifinės versijos),
    // bet prašome AI elgtis kaip tyrėjui. 
    // Jei turi mokamą planą, galima naudoti 'tools: [{googleSearch: {}}]'.
    // Bet kol kas darome paprastai - AI žinios + logika.
    
    const prompt = `
      Task: Find the official driver recruitment email for a transport company named "${companyName}" (Lithuania/Europe).
      
      Instructions:
      1. Analyze the company name. If it's a major carrier (Girteka, Hegelmann, Manvesta, Vlantana, Finejas, etc.), return their known driver recruitment email.
      2. If unknown, predict the most likely format (e.g., drivers@domain.com, karjera@domain.com).
      3. Return ONLY a JSON object: {"email": "found_email@address.com", "confidence": "HIGH" | "LOW"}.
      4. If you have absolutely no clue, return {"email": null}.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Išvalome JSON
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
        const data = JSON.parse(jsonString);
        if (data.email) {
            const source = data.confidence === 'HIGH' ? 'AI_SMART_SEARCH' : 'AI_PREDICTION';
            return { email: data.email, source };
        }
    } catch (e) {
        console.error("Failed to parse AI JSON", text);
    }

  } catch (error) {
    console.error("Gemini Search Error:", error);
  }

  return { email: null, source: 'NONE' };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // --- Sanitarija ---
    const requesterId = body.requesterId;
    const driverName = (body.driverName || '').trim();
    const targetCompany = (body.targetCompany || '').trim();
    // ... kiti laukai ...
    const birthDate = body.birthDate || null;
    const startDate = body.startDate || null;
    const endDate = body.endDate || null;
    let targetEmail = body.targetEmail ? body.targetEmail.trim() : null;
    const isCurrentEmployer = body.isCurrentEmployer || false;
    const requesterCompanyName = body.requesterCompanyName || '';

    // --- Dublikatų Patikra (Standartinė) ---
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

    if (activeDuplicate) return NextResponse.json({ success: true, isDuplicate: true, message: 'Active request exists' });


    // --- 🚀 PAGRINDINĖ LOGIKA: ATMINTIS + AI ---
    let emailSource = 'USER';
    let status = 'PENDING';

    if (!targetEmail) {
       // 1. ŽINGSNIS: ATMINTIS (Directory) 🧠
       // Pirmiausia tikriname, gal jau žinome šią įmonę iš anksčiau?
       const dirId = targetCompany.toLowerCase().replace(/[^a-z0-9]/g, '');
       const dirDoc = await db.collection('company_directory').doc(dirId).get();
       
       if (dirDoc.exists && dirDoc.data()?.email) {
         // Valio! Radome savo "užrašų knygutėje"
         targetEmail = dirDoc.data()?.email;
         emailSource = 'DIRECTORY'; 
       } else {
         // 2. ŽINGSNIS: AI SEARCH (Gemini) 🕵️‍♂️
         // Jei atmintyje nėra - siunčiame AI
         const result = await findSmartEmailWithGemini(targetCompany);
         
         if (result.email) {
           targetEmail = result.email;
           emailSource = result.source;
           
           // Jei AI pasitiki savimi (HIGH confidence) - IŠSAUGOME Į ATMINTĮ ATEIČIAI!
           if (result.source === 'AI_SMART_SEARCH') {
             await db.collection('company_directory').doc(dirId).set({
                name: targetCompany,
                email: result.email,
                updatedAt: new Date().toISOString(),
                source: 'AI_LEARNED'
             }, { merge: true });
           }

           status = 'PENDING';
         } else {
           // 3. ŽINGSNIS: ADMIN (Rankinis) 🚨
           targetEmail = null;
           emailSource = 'NONE';
           status = 'New'; // Raudona Adminui
         }
       }
    }

    // --- Išsaugojimas ---
    const token = crypto.randomBytes(32).toString('hex');
    const newRequest = {
      requesterId, requesterCompanyName, driverName, birthDate, targetCompany,
      targetEmail, emailSource, startDate, endDate, isCurrentEmployer,
      status, token, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('verification_requests').add(newRequest);

    return NextResponse.json({ success: true, id: docRef.id, token, status });

  } catch (error: any) {
    console.error('[API ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}