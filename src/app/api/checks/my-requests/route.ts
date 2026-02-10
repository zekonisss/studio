import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// 1. Initialize Firebase Admin (Standard)
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requesterId = searchParams.get('requesterId');

    if (!requesterId) {
      return NextResponse.json({ error: 'Missing requesterId' }, { status: 400 });
    }

    console.log(`[API] Fetching ALL requests for: ${requesterId}`);

    // 2. Fetch ALL requests for this user (No complex ordering to avoid Index errors)
    const snapshot = await db.collection('verification_requests')
      .where('requesterId', '==', requesterId)
      .get();

    if (snapshot.empty) {
      return NextResponse.json([]);
    }

    // 3. Map and Sort in Memory (Newest First)
    // REMOVED: .filter(req => req.targetEmail) - We want to see EVERYTHING.
    const requests = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamps to ISO strings for serialization
        const serializedData = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
        return serializedData;
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return NextResponse.json(requests);

  } catch (error: any) {
    console.error('[API ERROR] My-Requests failed:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
