import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Patikriname, ar vartotojas prisijungęs (jei reikia)
    // Šioje vietoje galime naudoti session check, bet kol kas paliekame paprastai

    const body = await request.json();
    const { driverName, targetCompany, requesterId, targetEmail } = body;

    // 2. Validacija
    if (!driverName || !targetCompany || !requesterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // 3. Sukuriame unikalų tokeną
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // 4. Paruošiame duomenis
    const newRequest = {
      driverName,
      targetCompany,
      requesterId,
      targetEmail: targetEmail || null, // Gali būti null, jei neradome
      status: 'NEW', // Pradinis statusas
      token,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailStatus: 'PENDING',
      history: [
        {
          action: 'CREATED',
          timestamp: new Date(),
          details: 'Užklausa sukurta per paiešką',
        },
      ],
    };

    // 5. Įrašome į Firestore "verification_requests"
    const docRef = await adminDb.collection('verification_requests').add(newRequest);

    // ---------------------------------------------------------
    // 🔍 ČIA YRA TAVO MAGIŠKA NUORODA (CONSOLE LOG)
    // ---------------------------------------------------------
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const debugLink = `${baseUrl}/verify?token=${token}`;
    
    console.log('\n🔵 [EMAIL PREVIEW] Spausk čia, kad pamatytum įmonės vaizdą:');
    console.log(debugLink);
    console.log('------------------------------------------------------\n');
    // ---------------------------------------------------------

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: 'Request created successfully' 
    });

  } catch (error: any) {
    console.error('Error creating request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}