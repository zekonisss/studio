import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const requesterId = searchParams.get('requesterId');

    if (!requesterId) {
      return NextResponse.json({ error: 'Missing requesterId' }, { status: 400 });
    }

    console.log(`[API] Fetching ALL requests for: ${requesterId}`);

    const snapshot = await adminDb.collection('verification_requests')
      .where('requesterId', '==', requesterId)
      .get();

    if (snapshot.empty) {
      return NextResponse.json([]);
    }

    const requests = snapshot.docs.map(doc => {
        const data = doc.data();
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
