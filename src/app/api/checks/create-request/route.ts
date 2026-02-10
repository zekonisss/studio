'use client';

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import crypto from 'crypto';

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

// --- KONFIGURACIJA: Kokie raktažodžiai mums svarbūs? ---
const HIGH_PRIORITY_PREFIXES = ['drivers', 'vairuotojai', 'atranka', 'karjera', 'cv', 'recruitment'];
const MEDIUM_PRIORITY_PREFIXES = ['personalas', 'hr', 'team', 'darbas'];
const LOW_PRIORITY_PREFIXES = ['info', 'admin', 'biuras', 'hello', 'contact'];

// --- AI PAIEŠKOS LOGIKA (Simuliuojama) ---
async function findSmartCompanyEmail(companyName: string): Promise<{ email: string | null, confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' }> {
  const cleanName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Čia būtų tikra užklausa į Google API (pvz., per SerpApi)
  // Query: `${companyName} vairuotojų atranka kontaktai`
  
  // 2. MOCK REZULTATAI (Kad matytum logiką veikime)
  // Įsivaizduokime, kad Google grąžino šiuos variantus:
  let foundEmails: string[] = [];

  if (cleanName.includes('manvesta')) foundEmails = ['info@manvesta.lt', 'drivers@manvesta.lt']; 
  else if (cleanName.includes('girteka')) foundEmails = ['career@girteka.eu'];
  else if (cleanName.includes('baltic')) foundEmails = ['info@baltictransline.lt']; // Tik info
  else foundEmails = []; // Nieko nerado

  // 3. REITINGAVIMAS (Smart Ranking)
  let bestEmail = null;
  let bestScore = 0;

  for (const email of foundEmails) {
    const prefix = email.split('@')[0].toLowerCase();
    let score = 0;

    if (HIGH_PRIORITY_PREFIXES.some(p => prefix.includes(p))) score = 100;
    else if (MEDIUM_PRIORITY_PREFIXES.some(p => prefix.includes(p))) score = 50;
    else if (LOW_PRIORITY_PREFIXES.some(p => prefix.includes(p))) score = 10;
    else score = 5; // Nežinomas (pvz. jonas@...)

    if (score > bestScore) {
      bestScore = score;
      bestEmail = email;
    }
  }

  // 4. SPRENDIMAS
  if (!bestEmail) return { email: null, confidence: 'NONE' };
  
  if (bestScore >= 50) return { email: bestEmail, confidence: 'HIGH' }; // Drivers/HR -> OK
  return { email: bestEmail, confidence: 'LOW' }; // Info -> Reikia patvirtinimo
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 1. Sanitarija
    const requesterId = body.requesterId;
    const driverName = (body.driverName || '').trim();
    const targetCompany = (body.targetCompany || '').trim();
    // ... kiti laukai (sanitize kaip anksčiau) ...
    const birthDate = body.birthDate || null;
    const startDate = body.startDate || null;
    const endDate = body.endDate || null;
    const targetEmail = body.targetEmail ? body.targetEmail.trim() : null;
    const isCurrentEmployer = body.isCurrentEmployer || false;
    const requesterCompanyName = body.requesterCompanyName || '';

    // 2. Dublikatų Patikra (Ta pati logika kaip anksčiau)
    const snapshot = await db.collection('verification_requests')
      .where('requesterId', '==', requesterId)
      .get();
    // ... čia įdėk tą pačią dublikatų logiką ... (sutrumpinta dėl aiškumo)
    const activeDuplicate = snapshot.docs.find(doc => {
       const data = doc.data();
       const isActive = data.status === 'PENDING' || data.status === 'COMPLETED';
       if (!isActive) return false;
       return (data.driverName || '').toLowerCase() === driverName.toLowerCase() && 
              (data.targetCompany || '').toLowerCase() === targetCompany.toLowerCase();
    });
    if (activeDuplicate) return NextResponse.json({ success: true, isDuplicate: true });


    // 3. EL. PAŠTO PAIEŠKA (AI SNAIPERIS) 🎯
    let finalEmail = targetEmail;
    let emailSource = 'USER';
    let status = 'PENDING';

    if (!finalEmail) {
       // A. Ieškome Directory (Atmintis - Aukščiausias prioritetas)
       const dirId = targetCompany.toLowerCase().replace(/[^a-z0-9]/g, '');
       const dirDoc = await db.collection('company_directory').doc(dirId).get();
       
       if (dirDoc.exists && dirDoc.data()?.email) {
         finalEmail = dirDoc.data()?.email;
         emailSource = 'DIRECTORY'; // ✅ Jau patikrintas
       } else {
         // B. Ieškome ONLINE su Reitingavimu
         const searchResult = await findSmartCompanyEmail(targetCompany);
         
         if (searchResult.confidence === 'HIGH') {
           // Radome 'drivers@' arba 'hr@' -> Siunčiam automatiškai!
           finalEmail = searchResult.email;
           emailSource = 'AI_HIGH_CONFIDENCE';
           status = 'PENDING';
         } else if (searchResult.confidence === 'LOW') {
           // Radome tik 'info@' -> Nesiunčiam, duodam Adminui
           // Bet išsaugome pasiūlymą, kad Adminui nereiktų ieškoti
           finalEmail = searchResult.email; // Išsaugom kaip "Draft"
           emailSource = 'AI_LOW_CONFIDENCE';
           status = 'New'; // 🔴 Raudona Adminui: "Radom tik info@, spręsk tu"
         } else {
           // Nieko neradome
           finalEmail = null;
           emailSource = 'NONE';
           status = 'New'; // 🔴 Raudona Adminui
         }
       }
    }

    // 4. Kuriame Užklausą
    const token = crypto.randomBytes(32).toString('hex');
    const newRequest = {
      requesterId,
      requesterCompanyName,
      driverName,
      birthDate,
      targetCompany,
      targetEmail: finalEmail,
      emailSource,
      startDate,
      endDate,
      isCurrentEmployer,
      status, 
      token,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('verification_requests').add(newRequest);

    return NextResponse.json({ success: true, id: docRef.id, token, status });

  } catch (error: any) {
    console.error('[API ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
