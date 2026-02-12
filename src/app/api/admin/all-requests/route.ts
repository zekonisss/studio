
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// Force this route to be dynamically rendered and not cached
export const dynamic = 'force-dynamic';

/**
 * Safely converts a Firestore Timestamp or an ISO string to a Date object.
 * @param dateValue The value to convert.
 * @returns A Date object. Returns epoch time if conversion fails.
 */
const toDate = (dateValue: any): Date => {
    if (dateValue?.toDate) { // Check if it's a Firestore Timestamp
        return dateValue.toDate();
    }
    if (typeof dateValue === 'string') {
        const d = new Date(dateValue);
        if (!isNaN(d.getTime())) {
            return d;
        }
    }
    // Return a default "invalid" date if conversion fails
    return new Date(0);
}

export async function GET() {
  console.log("⚡ [ADMIN API] Initiating fetch for 'verification_requests' (Live)...");

  if (!adminDb) {
    console.error("❌ [API ADMIN ERROR] Firebase Admin DB is not initialized.");
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, max-age=0');

    const collectionRef = adminDb.collection('verification_requests');
    const snapshot = await collectionRef.get();

    console.log(`⚡ [ADMIN API] Found ${snapshot.size} documents in 'verification_requests'.`);

    if (snapshot.empty) {
      return NextResponse.json([], { headers });
    }

    const requests = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt).toISOString(),
        updatedAt: data.updatedAt ? toDate(data.updatedAt).toISOString() : null,
      } as any; // Cast to any to simplify sorting function typing
    });

    // Enhanced sorting logic
    requests.sort((a: any, b: any) => {
      const priorityStatuses = ['NEW', 'New', 'RESEARCH', 'Researching', 'PENDING'];
      const aIsPriority = priorityStatuses.includes(a.status);
      const bIsPriority = priorityStatuses.includes(b.status);

      if (aIsPriority && !bIsPriority) return -1; // a comes first
      if (!aIsPriority && bIsPriority) return 1;  // b comes first

      // If both are priority or both are not, sort by date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(requests, { headers });

  } catch (error: any) {
    console.error('❌ [API ADMIN CRITICAL ERROR] Failed to fetch or process requests:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
