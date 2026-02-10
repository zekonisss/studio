import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

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
        const snapshot = await adminDb.collection('verification_requests')
            .where('requesterId', '==', requesterId)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        if (snapshot.empty) {
            return NextResponse.json([], { status: 200 });
        }

        const requests = snapshot.docs.map(doc => {
            const data = doc.data();
            const responseData = data.response ? {
                workedHere: data.response.workedHere,
                wouldRehire: data.response.wouldRehire,
                comment: data.response.comment,
            } : null;

            return {
                id: doc.id,
                driverName: data.driverName,
                targetCompany: data.targetCompany,
                status: data.status,
                createdAt: data.createdAt.toDate().toISOString(),
                response: responseData,
            };
        });

        return NextResponse.json(requests, { status: 200 });

    } catch (error: any) {
        console.error('Error fetching my-requests:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
