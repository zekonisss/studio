'use server';
import 'server-only';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = rawKey ? rawKey.replace(/\\n/g, '\n') : undefined;

  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
      console.log("✅ Firebase Admin sėkmingai inicializuotas bazėje: drivercheck");
    } catch (e: any) {
      console.error("❌ Firebase Admin inicializacijos klaida:", e.message);
    }
  } else {
    // NAUJAS BLOKAS: Aiški klaida, jei trūksta kintamųjų
    console.error('\n\n🔴🔴🔴 KRITINĖ KLAIDA: Nerasti Firebase Admin prisijungimo duomenys! 🔴🔴🔴');
    console.error('Patikrinkite savo .env.local failą ir įsitikinkite, kad jame yra teisingai užpildyti šie kintamieji:');
    console.error('- FIREBASE_PROJECT_ID');
    console.error('- FIREBASE_CLIENT_EMAIL');
    console.error('- FIREBASE_PRIVATE_KEY');
    console.error('Po pakeitimų BŪTINAI perkraukite serverį (Ctrl+C ir npm run dev).\n\n');
  }
}

// Naudojame oficialią getFirestore funkciją su bazės ID
export const adminDb = admin.apps.length 
  ? getFirestore(admin.app(), "drivercheck") 
  : null as any;
