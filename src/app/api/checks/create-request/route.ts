
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

const KNOWN_COMPANIES: Record<string, string> = {
  'manvesta': 'driver@manvesta.lt',
  'girteka': 'drivers@girteka.eu',
  'vlantana': 'cv@vlantana.lt',
  'kreiss': 'driver@kreiss.lv',
  'finejas': 'vairuotojai@finejas.lt'
};

/**
 * Finds a company's email using a hybrid strategy: first a dictionary lookup, then AI fallback.
 * @param companyName The name of the company to search for.
 * @returns A string containing the email address or null if not found.
 */
async function findCompanyEmail(companyName: string): Promise<string | null> {
  // Step 1: Normalization and Dictionary Check
  const normalizedCompanyName = companyName.toLowerCase().replace(/uab|ab|mb/g, '').replace(/\s+/g, '');
  for (const key in KNOWN_COMPANIES) {
    if (normalizedCompanyName.includes(key)) {
      const foundEmail = KNOWN_COMPANIES[key];
      console.log(`📚 Found in Known List: ${foundEmail}`);
      return foundEmail;
    }
  }

  // Step 2: AI Fallback
  const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("🔴 Gemini API key is missing. Cannot perform AI email lookup.");
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const prompt = `Find the public email for transport company '${companyName}' (Europe). Priority: 1. Driver recruitment (driver@, vairuotojams@). 2. HR (cv@, personalas@). 3. General (info@). Return ONLY the email. If absolutely not found, return 'null'.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    const cleanedText = text.replace(/`/g, "").replace(/json/g, "").trim();

    if (cleanedText.toLowerCase() === 'null' || !cleanedText.includes('@')) {
      return null;
    }
    return cleanedText;
  } catch (error) {
    console.error("❌ Error calling Gemini AI for email lookup:", error);
    return null;
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { driverName, targetCompany, requesterId, targetEmail, driverBirthDate, startDate, endDate, isCurrentEmployer } = body;

    if (!driverName || !targetCompany || !requesterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    let finalEmail: string | null = targetEmail || null;
    let emailSource: 'USER' | 'AI_GEMINI' | 'DICTIONARY' | 'NONE' = targetEmail ? 'USER' : 'NONE';

    if (!finalEmail) {
      console.log(`🧠 Hybrid lookup for company: "${targetCompany}"...`);
      finalEmail = await findCompanyEmail(targetCompany);
      console.log("♊ Found email:", finalEmail);
      if(finalEmail) {
          // This source isn't perfect, but indicates a non-user source
          emailSource = 'AI_GEMINI'; 
      }
    }

    const status = finalEmail ? 'PENDING' : 'RESEARCH';
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const newRequest = {
      driverName,
      driverBirthDate: driverBirthDate || null,
      targetCompany,
      requesterId,
      startDate: startDate || null,
      endDate: endDate || null,
      isCurrentEmployer: isCurrentEmployer || false,
      targetEmail: finalEmail,
      emailSource,
      status, 
      token,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      emailStatus: finalEmail ? 'PENDING' : null,
      history: [
        {
          action: 'CREATED',
          timestamp: Timestamp.now(),
          details: `Užklausa sukurta. El. pašto šaltinis: ${emailSource}.`,
        },
      ],
    };

    const docRef = await adminDb.collection('verification_requests').add(newRequest);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const debugLink = `${baseUrl}/verify?token=${token}`;
    
    console.log('\n🔵 [EMAIL PREVIEW] Click here to see what the company sees:');
    console.log(debugLink);
    console.log('------------------------------------------------------\n');

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: 'Request created successfully',
      debugLink: debugLink
    });

  } catch (error: any) {
    console.error('❌ Error creating verification request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
