import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore'; // Importuojame tipą

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
  // LOG 1: Start
  console.log("⚡ [ADMIN API] Bandoma gauti užklausas (Live)...");

  if (!adminDb) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, max-age=0');

    const collectionRef = adminDb.collection('verification_requests');
    const snapshot = await collectionRef.get();

    // LOG 2: Kiek radome?
    console.log(`⚡ [ADMIN API] Rasta dokumentų DB: ${snapshot.size}`);

    if (snapshot.empty) {
      return NextResponse.json([], { headers });
    }

    // Čia pridedame tipą (doc: QueryDocumentSnapshot)
    const requests = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt).toISOString(),
        updatedAt: data.updatedAt ? toDate(data.updatedAt).toISOString() : null,
      } as any;
    });

    // Rūšiavimas su tipais (a: any, b: any)
    requests.sort((a: any, b: any) => {
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
