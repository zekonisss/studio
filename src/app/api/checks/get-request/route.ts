
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
    if (!adminDb) {
        console.error("Firebase Admin not initialized.");
        return NextResponse.json({ success: false, error: 'Serverio konfigūracijos klaida.' }, { status: 500 });
    }

    const { searchParams } = req.nextUrl;
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ success: false, error: 'Trūksta patvirtinimo rakto.' }, { status: 400 });
    }

    try {
        const requestsRef = adminDb.collection('verification_requests');
        const q = requestsRef.where('token', '==', token).limit(1);
        const snapshot = await q.get();

        if (snapshot.empty) {
            return NextResponse.json({ success: false, error: 'Patvirtinimo nuoroda negaliojanti arba pasenusi.' }, { status: 404 });
        }

        const requestDoc = snapshot.docs[0];
        const requestData = requestDoc.data();

        if (requestData.status !== 'PENDING' && requestData.status !== 'RESEARCH') {
             return NextResponse.json({ success: false, error: 'Ši užklausa jau buvo apdorota.' }, { status: 410 });
        }

        // Fetch requester's company name
        let requesterCompany = requestData.requesterCompanyName || 'Nežinoma įmonė';
        if (requestData.requesterId) {
            const userRef = adminDb.collection('users').doc(requestData.requesterId);
            const userDoc = await userRef.get();
            if (userDoc.exists) { 
                const userData = userDoc.data();
                requesterCompany = userData?.companyName || requesterCompany;
            }
        }
        
        const responseData = {
          driverName: requestData.driverName,
          driverBirthDate: requestData.driverBirthDate || null,
          requesterCompany: requesterCompany,
          startDate: requestData.startDate || null,
          endDate: requestData.endDate || null,
          isCurrentEmployer: requestData.isCurrentEmployer || false
        };

        return NextResponse.json(responseData, { status: 200 });

    } catch (error: any) {
        console.error('Error fetching verification request:', error);
        return NextResponse.json({ success: false, error: error.message || 'Įvyko vidinė serverio klaida.' }, { status: 500 });
    }
}

    