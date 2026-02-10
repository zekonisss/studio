
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
        const { driverName, driverBirthDate, driverId, targetEmail, targetCompany, requesterId, startDate, endDate, isCurrentEmployer } = body;

        if (!driverName || !targetCompany || !driverBirthDate) {
            return NextResponse.json({ success: false, error: 'Trūksta būtinų duomenų (vairuotojo vardo, gimimo datos arba įmonės pavadinimo).' }, { status: 400 });
        }
        
        // --- 1. DUBLIKATŲ PATIKRA (Anti-Spam) ---
        const duplicateSnapshot = await adminDb.collection('verification_requests')
          .where('requesterId', '==', requesterId)
          .where('targetCompany', '==', targetCompany)
          .where('driverName', '==', driverName)
          .where('driverBirthDate', '==', driverBirthDate)
          .get();

        if (!duplicateSnapshot.empty) {
            const activeDuplicate = duplicateSnapshot.docs.find(doc => {
              const data = doc.data();
              if (!data.createdAt || !data.createdAt.toDate) return false;

              const created = data.createdAt.toDate();
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - created.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              
              return diffDays < 30; 
            });

            if (activeDuplicate) {
              console.log(`[DUPLICATE BLOCKED] Request already exists for ${driverName} at ${targetCompany}`);
              return NextResponse.json({ 
                success: true, 
                id: activeDuplicate.id, 
                token: activeDuplicate.data().token,
                message: 'Active request already exists for this driver/company within the last 30 days.',
                isDuplicate: true
              });
            }
        }


        const requestData: any = {
            driverName,
            driverBirthDate,
            driverId: driverId || null,
            targetCompany,
            status: 'PENDING', // Default status
            createdAt: Timestamp.now(),
            requesterId: requesterId || 'mock-user-id',
            startDate: startDate || null,
            endDate: endDate || null,
            isCurrentEmployer: isCurrentEmployer || false,
        };
        
        // Smart email logic: if no email, mark for research
        if (!targetEmail || targetEmail.trim() === '') {
            requestData.status = 'RESEARCH'; 
            requestData.targetEmail = null;
            
            await adminDb.collection('verification_requests').add(requestData);
            
            return NextResponse.json({ 
                success: true, 
                message: "Užklausa priimta. Mūsų komanda suras kontaktą ir išsiųs užklausą." 
            });
        }
        
        // If email IS provided, proceed with token generation
        requestData.targetEmail = targetEmail;
        const token = crypto.randomBytes(32).toString('hex');
        requestData.token = token;
        await adminDb.collection('verification_requests').add(requestData);

        const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify?token=${token}`;
        console.log(`[EMAIL MOCK] To: ${targetEmail}, Link: ${verificationLink}`);

        return NextResponse.json({ 
          success: true, 
          message: 'Užklausa išsiųsta! Buvęs darbdavys gavo patikros nuorodą.',
          debugLink: verificationLink 
        });

    } catch (error: any) {
        console.error('Error creating verification request:', error);
        return NextResponse.json({ success: false, error: error.message || 'Įvyko vidinė serverio klaida kuriant užklausą.' }, { status: 500 });
    }
}
