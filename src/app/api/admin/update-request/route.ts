import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function PATCH(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const { requestId, newEmail } = await request.json();

    if (!requestId || !newEmail) {
      return NextResponse.json({ error: 'Missing requestId or newEmail' }, { status: 400 });
    }

    const requestRef = adminDb.collection('verification_requests').doc(requestId);
    const docSnap = await requestRef.get();

    if (!docSnap.exists) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    await requestRef.update({
      targetEmail: newEmail,
      status: 'PENDING',
      emailSource: 'ADMIN_FIX',
      updatedAt: Timestamp.now(),
    });

    // Mock resending email
    const docData = docSnap.data();
    console.log(`[ADMIN ACTION] Email for request ID ${requestId} (Driver: ${docData?.driverName}) resent to new address: ${newEmail}`);

    return NextResponse.json({ success: true, message: 'Request updated and queued for resending.' });

  } catch (error: any) {
    console.error('[API ADMIN ERROR] Updating request failed:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
