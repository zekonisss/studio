
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    if (!adminDb) {
        return NextResponse.json({ success: false, error: 'Serverio konfigūracijos klaida.' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { token, newEmail } = body;

        if (!token || !newEmail || !newEmail.includes('@')) {
            return NextResponse.json({ success: false, error: 'Trūksta būtinų duomenų arba neteisingas el. pašto formatas.' }, { status: 400 });
        }

        const requestsRef = adminDb.collection('verification_requests');
        const q = requestsRef.where('token', '==', token).limit(1);
        const snapshot = await q.get();

        if (snapshot.empty) {
            return NextResponse.json({ success: false, error: 'Patvirtinimo nuoroda negaliojanti arba pasenusi.' }, { status: 404 });
        }

        const requestDoc = snapshot.docs[0];
        const requestData = requestDoc.data();

        // Update the original request
        await requestDoc.ref.update({
            targetEmail: newEmail,
            delegatedAt: Timestamp.now(),
            status: 'PENDING', // Reset status so it can be sent again
            emailStatus: 'PENDING',
        });
        
        // Log the new contact info to the catalog
        const normalizedCompany = (requestData.targetCompany || 'unknown').toLowerCase().trim().replace(/[\s\W]+/g, '-');
        const contactsRef = adminDb.collection('company_contacts_catalog').doc(normalizedCompany);
        await contactsRef.set({
            companyName: requestData.targetCompany,
            email: newEmail,
            source: 'USER_FEEDBACK',
            updatedAt: Timestamp.now()
        }, { merge: true });

        console.log(`[DELEGATION] User corrected email for company '${requestData.targetCompany}' to '${newEmail}'.`);
        
        return NextResponse.json({ success: true, message: "Užklausa sėkmingai persiųsta nauju adresu." });

    } catch (error: any) {
        console.error('Error delegating verification request:', error);
        return NextResponse.json({ success: false, error: error.message || 'Įvyko vidinė serverio klaida.' }, { status: 500 });
    }
}
