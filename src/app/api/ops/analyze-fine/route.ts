
import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

// Zod Schema for structured data extraction
const FineDataSchema = z.object({
  date: z.string().describe("The date of the fine in YYYY-MM-DD format."),
  time: z.string().describe("The time of the fine in HH:MM format."),
  amount: z.string().describe("The total fine amount, including currency (e.g., 150.00 EUR)."),
  location: z.string().describe("The specific location of the incident (City, Street or Road name)."),
  violation: z.string().describe("A short description of the violation (e.g., Speeding, Parking violation)."),
  licensePlate: z.string().optional().describe("The vehicle's license plate number, if found in the document."),
});

// Helper function to convert a file to a Base64 Data URI
async function fileToDataURI(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return `data:${file.type};base64,${buffer.toString('base64')}`;
}

export async function POST(req: NextRequest) {
  // Check if the API key is available
  if (!process.env.GOOGLE_GENAI_API_KEY && !process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'AI API key is not configured on the server.' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // Convert the file to a Data URI for the model
    const dataUri = await fileToDataURI(file);

    const prompt = `
      Analyze this traffic fine document. Your task is to act as a data extraction engine.
      Extract the following information and return it as a raw JSON object, conforming to the provided schema.
      Do not include any markdown, backticks, or explanatory text. Only the JSON object is allowed.
    `;
    
    // Generate content using the Genkit AI instance
    const { output } = await ai.generate({
      model: googleAI.model('gemini-1.5-flash-latest'),
      prompt: [
        { text: prompt },
        { media: { url: dataUri, contentType: file.type } }
      ],
      output: {
        schema: FineDataSchema,
      },
      config: {
        temperature: 0, // Set temperature to 0 for deterministic data extraction
      },
    });

    if (!output) {
      throw new Error('AI model failed to return structured data.');
    }

    return NextResponse.json(output);

  } catch (error: any) {
    console.error('Error in /api/ops/analyze-fine:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
