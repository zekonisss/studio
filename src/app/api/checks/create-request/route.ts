import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import crypto from 'crypto';

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      requesterId, 
      driverName, 
      birthDate, 
      targetCompany, 
      targetEmail, 
      startDate, 
      endDate, 
      isCurrentEmployer,
      requesterCompanyName 
    } = body;

    // --- 1. GRIEŽTA DUBLIKATŲ PATIKRA (IN-MEMORY) ---
    // Paimame visas vartotojo užklausas (kad išvengtume indekso klaidų)
    const snapshot = await db.collection('verification_requests')
      .where('requesterId', '==', requesterId)
      .get();

    // Normalizuojame naujus duomenis palyginimui (mažosios raidės, be tarpų)
    const newDriverClean = driverName.trim().toLowerCase();
    const newCompanyClean = targetCompany.trim().toLowerCase();

    const activeDuplicate = snapshot.docs.find(doc => {
      const data = doc.data();
      
      // 1. Tikriname statusą (turi būti aktyvi užklausa)
      // Jei statusas 'PENDING' (Laukiama) arba 'COMPLETED' (Gauta) - tai dublikatas.
      // Jei statusas 'NEW' (Nerastas el. paštas/Ieškoma) - leidžiame kurti iš naujo, gal dabar rasim.
      const isActive = data.status === 'PENDING' || data.status === 'COMPLETED';
      if (!isActive) return false;

      // 2. Tikriname laiką (30 dienų)
      const created = new Date(data.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - created.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) return false;

      // 3. Tikriname duomenų sutapimą (Griežtai)
      const existingDriver = (data.driverName || '').trim().toLowerCase();
      const existingCompany = (data.targetCompany || '').trim().toLowerCase();
      const existingBirth = data.birthDate;

      const nameMatch = existingDriver === newDriverClean;
      const companyMatch = existingCompany === newCompanyClean;
      // Gimimo datą tikriname tik jei ji nurodyta abiejuose
      const birthMatch = birthDate ? (existingBirth === birthDate) : true;

      return nameMatch && companyMatch && birthMatch;
    });

    if (activeDuplicate) {
      console.log(`[DUPLICATE BLOCKED] Grąžinama sena užklausa ID: ${activeDuplicate.id}`);
      return NextResponse.json({ 
        success: true, 
        id: activeDuplicate.id, 
        token: activeDuplicate.data().token,
        message: 'Active request already exists',
        isDuplicate: true
      });
    }

    // --- 2. LOGIKA: El. Pašto Suradimas (Jei nėra) ---
    let finalEmail = targetEmail;
    let emailSource = 'USER';
    let initialStatus = 'PENDING'; // Pagal nutylėjimą - laukiama

    if (!finalEmail || finalEmail.trim() === '') {
       // A. Ieškome Directory
       const cleanCompanyId = targetCompany.trim().toLowerCase().replace(/\s+/g, '');
       const directoryDoc = await db.collection('company_directory').doc(cleanCompanyId).get();
       
       if (directoryDoc.exists && directoryDoc.data()?.email) {
         finalEmail = directoryDoc.data()?.email;
         emailSource = 'DIRECTORY';
         console.log(`[DIRECTORY] Found email for ${targetCompany}: ${finalEmail}`);
       } else {
         // B. AI Spėjimas (Kol kas "Mock")
         // Jei neradome el. pašto, užklausos statusas lieka 'NEW' (Ieškoma),
         // kad administratorius (Tu) matytų ir galėtų surasti,
         // ARBA bandome spėti.
         
         // Sprendimas: Bandom spėti info@, bet pažymim, kad tai spėjimas
         finalEmail = `info@${targetCompany.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}.lt`; 
         emailSource = 'AI_GUESS';
         // Statusą paliekame PENDING, nes vis tiek išsiųsime laišką
       }
    }

    // --- 3. NAUJOS UŽKLAUSOS KŪRIMAS ---
    const token = crypto.randomBytes(32).toString('hex');
    
    const newRequest = {
      requesterId,
      requesterCompanyName: requesterCompanyName || '',
      driverName,
      birthDate,
      targetCompany,
      targetEmail: finalEmail,
      emailSource,
      startDate,
      endDate: endDate || null,
      isCurrentEmployer: isCurrentEmployer || false,
      status: initialStatus,
      token,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('verification_requests').add(newRequest);
    console.log(`[CREATED] New request ID: ${docRef.id}`);

    return NextResponse.json({ success: true, id: docRef.id, token });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}