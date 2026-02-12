import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { VerificationRequest } from '@/types';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// PRIVERČIAME NECACHINTI
export const dynamic = 'force-dynamic'; 

const toDate = (dateValue: any): Date => {
    if (dateValue?.toDate) return dateValue.toDate();
    if (typeof dateValue === 'string') {
        const d = new Date(dateValue);
        if (!isNaN(d.getTime())) return d;
    }
    return new Date(0); 
}

export async function GET() {
  console.log("⚡ [ADMIN API] Bandoma gauti užklausas..."); // <--- LOG 1

  if (!adminDb) {
    console.error("❌ [ADMIN API] Nėra adminDb ryšio!");
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, max-age=0');

    // 1. Tikriname kolekcijos pavadinimą
    const collectionRef = adminDb.collection('verification_requests');
    const snapshot = await collectionRef.get();

    console.log(`⚡ [ADMIN API] Rasta dokumentų DB: ${snapshot.size}`); // <--- LOG 2 (Svarbiausias!)

    if (snapshot.empty) {
      console.warn("⚠️ [ADMIN API] Kolekcija tuščia!");
      return NextResponse.json([], { headers });
    }

    const requests = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      // Atspausdiname kiekvieno ID ir Statusą terminale
      console.log(`📄 Doc: ${doc.id} | Status: ${data.status} | Email: ${data.targetEmail}`);
      
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt).toISOString(),
        updatedAt: data.updatedAt ? toDate(data.updatedAt).toISOString() : null,
      } as any;
    });

    // Rūšiavimas
    requests.sort((a: any, b: any) => {
      // Prioritetiniai statusai
      const priority = ['NEW', 'New', 'RESEARCH', 'Researching', 'Action Needed'];
      const aPrio = priority.includes(a.status);
      const bPrio = priority.includes(b.status);

      if (aPrio && !bPrio) return -1;
      if (!aPrio && bPrio) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(requests, { headers });

  } catch (error: any) {
    console.error('❌ [API ADMIN ERROR] Klaida:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
