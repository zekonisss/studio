
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import crypto from 'crypto';

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

// --- 1. TOP LIETUVOS TRANSPORTO ĮMONIŲ (VAIRUOTOJŲ SKYRIAI) ---
// Atnaujinta pagal vartotojo pastabas: naudojame 'drivers@', 'vairuotojai@'.
const TOP_COMPANIES_DB: Record<string, string> = {
  // Didysis trejetas + kiti lyderiai
  'girteka': 'career@girteka.eu', // Girteka dažnai naudoja bendrą portalą, bet šis veikia
  'hegelmann': 'vairuotojai@hegelmann.com',
  'manvesta': 'drivers@manvesta.lt', // ✅ Patvirtinta
  'vlantana': 'vairuotojai@vlantana.lt',
  'finėjas': 'drivers@finejas.lt', // ✅ Pataisyta pagal tavo info
  'finejas': 'drivers@finejas.lt',
  'baltic transline': 'drivers@baltictransline.lt', // ✅ Patvirtinta
  'transimeksa': 'drivers@transimeksa.com',
  'transtira': 'vairuotojai@transtira.lt',
  'integre': 'vairuotojai@integre.lt',
  'integre trans': 'vairuotojai@integre.lt',
  'bleiras': 'vairuotojai@bleiras.lt',
  'cargo go': 'vairuotojai@cargogo.eu',
  'hoptrans': 'vairuotojai@hoptrans.lt',
  'gvidonas': 'vairuotojai@gvidonas.lt',
  'a. griciaus': 'vairuotojai@agriciaus.lt',
  'kreiss': 'driver@kreiss.lv',
  'dinotrans': 'drivers@dinotrans.lt',
  'avero': 'transport@avero.lt'
};

// --- 2. GOOGLE SEARCH KONFIGŪRACIJA ---
// Įsitikink, kad šie raktai yra tavo .env faile!
const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY; 
const GOOGLE_SEARCH_CX = process.env.GOOGLE_SEARCH_CX; 

// --- 3. PAGALBINĖS FUNKCIJOS ---

async function findRealEmail(companyName: string): Promise<{ email: string | null, source: string }> {
  const cleanName = companyName.toLowerCase().trim();
  
  // A. Tikriname Statinį Top Sąrašą (Greičiausia ir Tiksliausia)
  const knownKey = Object.keys(TOP_COMPANIES_DB).find(key => cleanName.includes(key));
  if (knownKey) {
    return { email: TOP_COMPANIES_DB[knownKey], source: 'TOP_LIST' };
  }

  // B. Google Search (Mažesnėms įmonėms)
  if (GOOGLE_API_KEY && GOOGLE_SEARCH_CX) {
    try {
      console.log(`[GOOGLE SEARCH] Searching for: ${companyName}`);
      // Ieškome specifiškai vairuotojų kontaktų
      const query = `"${companyName}" vairuotojų atranka drivers recruitment email`;
      const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_CX}&q=${encodeURIComponent(query)}`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.items) {
        const textBlob = data.items.map((i: any) => i.snippet + ' ' + i.title).join(' ');
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
        const found = textBlob.match(emailRegex);

        if (found && found.length > 0) {
          // Reitinguojame: drivers/vairuotojai > info
          const priorityEmail = found.find((e: string) => 
            e.includes('driver') || 
            e.includes('vairuotoj') || 
            e.includes('transport')
          );
          
          if (priorityEmail) {
            return { email: priorityEmail.toLowerCase(), source: 'GOOGLE_API_HIGH' };
          }
          
          // Jei radome tik info@ - grąžiname, bet pažymime kaip žemesnį prioritetą (ADMINAS galės patikrinti)
          return { email: found[0].toLowerCase(), source: 'GOOGLE_API_LOW' };
        }
      }
    } catch (error) {
      console.error('Google Search Error:', error);
    }
  }

  // C. Nieko neradome
  return { email: null, source: 'NONE' };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // --- Sanitarija ---
    const requesterId = body.requesterId;
    const driverName = (body.driverName || '').trim();
    const targetCompany = (body.targetCompany || '').trim();
    const birthDate = body.birthDate || null;
    const startDate = body.startDate || null;
    const endDate = body.endDate || null;
    let targetEmail = body.targetEmail ? body.targetEmail.trim() : null;
    const isCurrentEmployer = body.isCurrentEmployer || false;
    const requesterCompanyName = body.requesterCompanyName || '';

    // --- Dublikatų Patikra ---
    const snapshot = await db.collection('verification_requests')
      .where('requesterId', '==', requesterId)
      .get();

    const activeDuplicate = snapshot.docs.find(doc => {
      const data = doc.data();
      const isActive = data.status === 'PENDING' || data.status === 'COMPLETED';
      if (!isActive) return false;
      const created = new Date(data.createdAt);
      const now = new Date();
      if ((now.getTime() - created.getTime()) / (1000 * 3600 * 24) > 30) return false;
      
      // Griežtas tikrinimas
      const sameDriver = (data.driverName || '').toLowerCase() === driverName.toLowerCase();
      const sameCompany = (data.targetCompany || '').toLowerCase() === targetCompany.toLowerCase();
      // Jei nurodyta gimimo data, ji irgi turi sutapti
      const sameBirth = birthDate && data.birthDate ? birthDate === data.birthDate : true;

      return sameDriver && sameCompany && sameBirth;
    });

    if (activeDuplicate) {
      return NextResponse.json({ success: true, isDuplicate: true, message: 'Active request exists' });
    }

    // --- EL. PAŠTO LOGIKA 🧠 ---
    let emailSource = 'USER';
    let status = 'PENDING';

    if (!targetEmail) {
       // 1. Ieškome Directory (Atmintis)
       const dirId = targetCompany.toLowerCase().replace(/[^a-z0-9]/g, '');
       const dirDoc = await db.collection('company_directory').doc(dirId).get();
       
       if (dirDoc.exists && dirDoc.data()?.email) {
         targetEmail = dirDoc.data()?.email;
         emailSource = 'DIRECTORY'; 
       } else {
         // 2. Ieškome Realiai (Top List + Google)
         const result = await findRealEmail(targetCompany);
         
         if (result.email) {
           targetEmail = result.email;
           emailSource = result.source;
           
           // Jei AI rado tik silpną (pvz info@) per Google -> Siunčiam Adminui peržiūrėti
           if (result.source === 'GOOGLE_API_LOW') {
             status = 'New'; // Raudona Adminui
           } else {
             status = 'PENDING'; // Stiprus kontaktas -> Siunčiam
           }

         } else {
           // 3. Neradome nieko -> Adminui
           targetEmail = null;
           emailSource = 'NONE';
           status = 'New'; // Raudona zona Adminui
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
