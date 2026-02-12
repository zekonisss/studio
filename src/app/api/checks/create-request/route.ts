
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

/**
 * Uses Gemini AI to find a public email address for a given company.
 * @param companyName The name of the company to search for.
 * @returns A string containing the email address or null if not found.
 */
async function findCompanyEmail(companyName: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("🔴 Gemini API key is missing. Cannot perform AI email lookup.");
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{ googleSearchRetrieval: {} }],
  });

  const prompt = `Use Google Search to find the OFFICIAL driver recruitment email for '${companyName}'. Visit their careers/vairuotojams page. Look for emails like 'driver@', 'personalas@'. Do NOT guess. If you cannot verify the email on the web, return 'null'.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Clean the response from any potential markdown or extra characters
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

    // 1. Validation
    if (!driverName || !targetCompany || !requesterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // 2. Email Discovery Logic
    let finalEmail: string | null = targetEmail || null;
    let emailSource: 'USER' | 'AI_GEMINI' | 'NONE' = targetEmail ? 'USER' : 'NONE';

    if (!finalEmail) {
      console.log(`🤖 AI is searching for an email for company: "${targetCompany}"...`);
      finalEmail = await findCompanyEmail(targetCompany);
      console.log("♊ Gemini AI found email:", finalEmail);
      if(finalEmail) {
          emailSource = 'AI_GEMINI';
      }
    }

    // 3. Set Status based on email availability
    // If no email is found by user or AI, it needs manual research by an admin.
    const status = finalEmail ? 'PENDING' : 'RESEARCH';

    // 4. Prepare data for Firestore
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

    // 5. Save to Firestore
    const docRef = await adminDb.collection('verification_requests').add(newRequest);

    // 6. CRITICAL: Debug log for the verification link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const debugLink = `${baseUrl}/verify?token=${token}`;
    
    console.log('\n🔵 [EMAIL PREVIEW] Click here to see what the company sees:');
    console.log(debugLink);
    console.log('------------------------------------------------------\n');

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: 'Request created successfully',
      debugLink: debugLink // For easier debugging
    });

  } catch (error: any) {
    console.error('❌ Error creating verification request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
