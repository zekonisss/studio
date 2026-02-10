import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { GoogleGenerativeAI } from '@google/generative-ai'; 
import crypto from 'crypto';

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

/**
 * Safely searches for a company's recruitment email using the Google Generative AI API.
 * This function is designed to be crash-proof.
 * @param companyName The name of the company to search for.
 * @returns An email address string or null if not found or an error occurs.
 */
async function findEmailSafe(companyName: string): Promise<string | null> {
  console.log(`[AI START] Securely searching for: ${companyName}`);
  
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_SEARCH_API_KEY;
  if (!apiKey) {
    console.error("[AI SKIP] Gemini API Key is not configured. Cannot perform email lookup.");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Find the official driver recruitment or HR email for the transport company "${companyName}" based in Lithuania. Analyze their website for 'karjera', 'vairuotojams', 'contacts' pages. Prioritize emails like 'drivers@...', 'recruitment@...', 'cv@...'. If only a generic 'info@...' is found, return that. If no email is found, return null. Respond ONLY with a JSON object: {"email": "example@email.com" | null}.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    
    // Robust JSON parsing
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
        console.warn("[AI WARN] AI did not return a valid JSON object string.");
        return null;
    }
    
    const jsonText = text.substring(firstBrace, lastBrace + 1);
    const data = JSON.parse(jsonText);
    
    if (data && data.email && typeof data.email === 'string') {
        console.log(`[AI SUCCESS] Found email: ${data.email}`);
        return data.email;
    }

    console.log(`[AI INFO] No email found for ${companyName}.`);
    return null;

  } catch (error) {
    console.error("[AI FAILED] A critical error occurred during the AI email search. The function will return null, and the request will be marked for admin review.", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[API] Processing new verification request...");
    const body = await request.json();
    
    // --- 1. Sanitize Inputs ---
    const requesterId = body.requesterId;
    const driverName = body.driverName?.trim() || '';
    const targetCompany = body.targetCompany?.trim() || '';
    let targetEmail = body.targetEmail?.trim() || null;
    
    // --- 2. Duplicate Check ---
    const snapshot = await db.collection('verification_requests')
      .where('requesterId', '==', requesterId)
      .where('driverName', '==', driverName)
      .where('targetCompany', '==', targetCompany)
      .get();
      
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeDuplicate = snapshot.docs.find(doc => {
      const data = doc.data();
      const isActive = data.status === 'PENDING' || data.status === 'COMPLETED';
      const isRecent = new Date(data.createdAt) > thirtyDaysAgo;
      return isActive && isRecent;
    });

    if (activeDuplicate) {
        console.log(`[API INFO] Duplicate request found for driver '${driverName}' at '${targetCompany}'. Aborting.`);
        return NextResponse.json({ success: true, isDuplicate: true, message: 'An active request for this driver and company already exists.' });
    }

    // --- 3. Robust Email Logic ---
    let emailSource = 'USER';
    let status: 'PENDING' | 'New' = 'PENDING';

    if (!targetEmail) {
       const aiEmail = await findEmailSafe(targetCompany);
       if (aiEmail) {
         targetEmail = aiEmail;
         emailSource = 'AI_GEMINI';
         status = 'PENDING'; // Found an email, send it.
       } else {
         // This block now executes if AI fails, API key is missing, or no email is found.
         targetEmail = null; 
         emailSource = 'NONE';
         status = 'New'; // CRITICAL: Mark for Admin review.
         console.log(`[API WARN] No email found for '${targetCompany}'. Request marked as 'New' for admin review.`);
       }
    } else if (status !== 'New') {
        status = 'PENDING';
    }


    // --- 4. Save to Database ---
    const newRequest = {
      requesterId, 
      driverName, 
      targetCompany,
      targetEmail, // This will be null if not found
      emailSource,
      status, // Will be 'PENDING' or 'New'
      requesterCompanyName: body.requesterCompanyName || '',
      birthDate: body.birthDate || null,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      isCurrentEmployer: body.isCurrentEmployer || false,
      token: crypto.randomBytes(32).toString('hex'),
      createdAt: new Date().toISOString(), // Always a valid ISO string
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('verification_requests').add(newRequest);
    console.log(`[API SUCCESS] Request saved with ID: ${docRef.id}, Status: ${status}`);

    return NextResponse.json({ success: true, id: docRef.id });

  } catch (error: any) {
    console.error('[CRITICAL API ERROR] The create-request endpoint failed:', error);
    // Return a generic error to the client to avoid leaking implementation details.
    return NextResponse.json({ error: "An internal server error occurred while creating the request." }, { status: 500 });
  }
}
