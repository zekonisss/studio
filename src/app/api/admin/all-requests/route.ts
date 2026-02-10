import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { VerificationRequest } from '@/types';

// Helper to convert Firestore Timestamps or ISO strings to Date objects for sorting
const toDate = (dateValue: any): Date => {
    if (dateValue?.toDate) { // It's a Firestore Timestamp
        return dateValue.toDate();
    }
    if (typeof dateValue === 'string') {
        const d = new Date(dateValue);
        if (!isNaN(d.getTime())) {
            return d;
        }
    }
    // Fallback for invalid or missing dates
    return new Date(0); 
}

export async function GET() {
  if (!adminDb) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const snapshot = await adminDb.collection('verification_requests').get();

    if (snapshot.empty) {
      return NextResponse.json([]);
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

    // Custom sort: 'NEW' status on top, then by date descending
    requests.sort((a, b) => {
      if (a.status === 'NEW' && b.status !== 'NEW') {
        return -1; // a comes first
      }
      if (b.status === 'NEW' && a.status !== 'NEW') {
        return 1; // b comes first
      }
      // For items with the same status or neither is 'NEW', sort by date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(requests);

  } catch (error: any) {
    console.error('[API ADMIN ERROR] Fetching all requests failed:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
