import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { VerificationRequest } from '@/types';

// --- SVARBU: Ši eilutė priverčia serverį visada imti naujausius duomenis ---
export const dynamic = 'force-dynamic'; 

// Helper to convert Firestore Timestamps or ISO strings to Date objects
const toDate = (dateValue: any): Date => {
    if (dateValue?.toDate) { 
        return dateValue.toDate();
    }
    if (typeof dateValue === 'string') {
        const d = new Date(dateValue);
        if (!isNaN(d.getTime())) {
            return d;
        }
    }
    return new Date(0); 
}

export async function GET() {
  if (!adminDb) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    // Išjungiame kešavimą ugniasienės lygyje (papildoma apsauga)
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, max-age=0');

    const snapshot = await adminDb.collection('verification_requests').get();

    if (snapshot.empty) {
      return NextResponse.json([], { headers });
    }

    const requests: VerificationRequest[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt).toISOString(),
        updatedAt: data.updatedAt ? toDate(data.updatedAt).toISOString() : null,
      } as any;
    });

    // Rūšiavimas: 'NEW' ir 'RESEARCH' viršuje, tada pagal datą
    requests.sort((a, b) => {
      const isAPriority = a.status === 'NEW' || a.status === 'RESEARCH';
      const isBPriority = b.status === 'NEW' || b.status === 'RESEARCH';

      if (isAPriority && !isBPriority) {
        return -1; // a comes first
      }
      if (!isAPriority && isBPriority) {
        return 1; // b comes first
      }

      // If both are priority (or both are not), sort by date descending
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(requests, { headers });

  } catch (error: any) {
    console.error('[API ADMIN ERROR] Fetching all requests failed:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
