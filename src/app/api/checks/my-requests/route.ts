import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
    if (!adminDb) {
        return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    const { searchParams } = req.nextUrl;
    const requesterId = searchParams.get('requesterId');

    if (!requesterId) {
        return NextResponse.json({ error: 'Requester ID is required' }, { status: 400 });
    }

    try {
        // Remove .orderBy() to avoid needing a composite index. We'll sort in memory.
        const snapshot = await adminDb.collection('verification_requests')
            .where('requesterId', '==', requesterId)
            .get();

        if (snapshot.empty) {
            return NextResponse.json([], { status: 200 });
        }

        // Map and then sort in memory
        const requests = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data
            };
        });

        // Sort by createdAt timestamp (Newest first)
        requests.sort((a, b) => {
            const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
        });
        
        // Take the latest 20 and map to a serializable format for JSON
        const finalRequests = requests.slice(0, 20).map(req => {
            const { createdAt, ...rest } = req;
            const responseData = req.response ? {
                workedHere: req.response.workedHere,
                wouldRehire: req.response.wouldRehire,
                comment: req.response.comment,
            } : null;

            return {
                ...rest,
                id: req.id,
                driverName: req.driverName,
                targetCompany: req.targetCompany,
                status: req.status,
                response: responseData,
                createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : new Date().toISOString(),
            };
        });


        return NextResponse.json(finalRequests, { status: 200 });

    } catch (error: any) {
        console.error('[API ERROR] My-Requests failed:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
