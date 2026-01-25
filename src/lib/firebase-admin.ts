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
      console.error("❌ Inicializacijos klaida:", e.message);
    }
  }
}

// Naudojame oficialią getFirestore funkciją su bazės ID
export const adminDb = typeof window === 'undefined' 
  ? getFirestore(admin.app(), "drivercheck") 
  : null as any;