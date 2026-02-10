
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

        if (!token || !newEmail) {
            return NextResponse.json({ success: false, error: 'Trūksta būtinų duomenų (rakto arba naujo el. pašto).' }, { status: 400 });
        }

        // 1. Find the request by token
        const requestsRef = adminDb.collection('verification_requests');
        const q = requestsRef.where('token', '==', token).limit(1);
        const snapshot = await q.get();

        if (snapshot.empty) {
            return NextResponse.json({ success: false, error: 'Patvirtinimo nuoroda negaliojanti arba pasenusi.' }, { status: 404 });
        }

        const requestDoc = snapshot.docs[0];
        const requestData = requestDoc.data();
        const originalEmail = requestData.targetEmail;

        const batch = adminDb.batch();

        // 2. Update the original request's email and add an audit trail
        batch.update(requestDoc.ref, {
            originalEmail: originalEmail, // Save the old email for auditing
            targetEmail: newEmail,
            delegatedAt: Timestamp.now(),
        });
        
        // 3. Log the new contact information for future use
        const contactsRef = adminDb.collection('company_contacts').doc(); // Auto-generate ID
        batch.set(contactsRef, {
            companyName: requestData.targetCompany,
            email: newEmail,
            source: 'delegation',
            addedAt: Timestamp.now(),
            driverNameContext: requestData.driverName, // Add context
        });
        
        await batch.commit();

        // 4. Mock resending the email (in a real scenario, you'd call your email service here)
        const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify?token=${token}`; // Token remains the same
        console.log(`[EMAIL DELEGATED] Forwarding request for driver '${requestData.driverName}' to new email '${newEmail}'. Link: ${verificationLink}`);
        
        return NextResponse.json({ success: true, message: "Užklausa persiųsta." });

    } catch (error: any) {
        console.error('Error delegating verification request:', error);
        return NextResponse.json({ success: false, error: error.message || 'Įvyko vidinė serverio klaida persiunčiant užklausą.' }, { status: 500 });
    }
}
