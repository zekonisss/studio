
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import crypto from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
    if (!adminDb) {
        console.error("Firebase Admin not initialized.");
        return NextResponse.json({ success: false, error: 'Serverio konfigūracijos klaida.' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { driverName, driverId, targetEmail, targetCompany, requesterId } = body;

        if (!driverName || !targetEmail || !targetCompany) {
            return NextResponse.json({ success: false, error: 'Trūksta būtinų duomenų (vairuotojo vardo, el. pašto arba įmonės pavadinimo).' }, { status: 400 });
        }

        const token = crypto.randomBytes(32).toString('hex');

        const requestData = {
            token,
            driverName,
            driverId: driverId || null, // Can be null if not provided
            targetEmail,
            targetCompany,
            status: 'PENDING',
            createdAt: Timestamp.now(), // Use Firestore Timestamp for consistency
            requesterId: requesterId || 'mock-user-id', // Use provided or mock
        };

        await adminDb.collection('verification_requests').add(requestData);

        // Simulate Email Sending as requested
        const verificationLink = `http://localhost:3000/verify?token=${token}`;
        console.log(`[EMAIL MOCK] To: ${targetEmail}, Link: ${verificationLink}`);

        return NextResponse.json({ 
          success: true, 
          message: 'Užklausa sėkmingai sukurta.',
          debugLink: verificationLink 
        });

    } catch (error: any) {
        console.error('Error creating verification request:', error);
        return NextResponse.json({ success: false, error: error.message || 'Įvyko vidinė serverio klaida kuriant užklausą.' }, { status: 500 });
    }
}
