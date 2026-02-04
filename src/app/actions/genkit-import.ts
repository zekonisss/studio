'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { detailedReportCategories } from '@/lib/constants';

// Define the Zod schema internally as requested to avoid client-side bundling issues.
const categoryIds = detailedReportCategories.map(c => c.id) as [string, ...string[]];
const ImportCleanSchema = z.object({
  categoryId: z.enum(categoryIds).describe("The most appropriate category ID for the incident."),
  sanitizedText: z.string().describe("The rewritten, neutral description of the incident in Lithuanian."),
  birthYear: z.string().optional().describe("The driver's 4-digit year of birth, ONLY if found within the text body."),
  isValid: z.boolean().describe("Set to false if the text is not about a specific driver incident (e.g., a complaint about a manager, salary, or company policy)."),
  rejectionReason: z.string().optional().describe("If isValid is false, a brief reason in Lithuanian explaining why."),
});

// Export the inferred TypeScript type for use in other server components if needed.
export type CleanImportResult = z.infer<typeof ImportCleanSchema>;

/**
 * Cleans, validates, and structures a raw text record about a driver incident using an AI model.
 */
export async function cleanImportRecord(input: { text: string; recordDate?: string }): Promise<CleanImportResult> {
  // Immediately return if the input text is empty or too short.
  if (!input.text || input.text.trim().length < 10) {
    return {
      isValid: false,
      rejectionReason: "Tekstas per trumpas arba jo nėra.",
      sanitizedText: input.text,
      categoryId: 'other_category',
    };
  }

  // Define a default error response for use in the catch block.
  const defaultErrorResponse: CleanImportResult = {
    isValid: false,
    rejectionReason: "AI analizės klaida, reikalinga rankinė peržiūra.",
    sanitizedText: input.text,
    categoryId: 'other_category',
  };

  try {
    // Call the Genkit AI model with the specific prompt and rules.
    const analysisPrompt = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      output: { schema: ImportCleanSchema },
      config: { temperature: 0.1 },
      prompt: `
        Role: Data Compliance Officer for a Driver Registry.
        Task: Clean and structure raw driver incident data.
        
        INPUT:
        - Text: "${input.text}"
        - Record Date: ${input.recordDate || 'Not specified'} (This is the INCIDENT date, NOT birth date).

        RULES:
        1. **Manager Filter:** If the text attacks a manager/owner (e.g., 'manager didn't pay'), mark isValid: false. Only process DRIVER faults.
        2. **Sanitization:** Rewrite text to professional Lithuanian. Remove all profanity/slang. Translate from Russian/English if needed. (e.g., 'vagia salerka' -> 'Kuro pasisavinimas'). This becomes 'sanitizedText'.
        3. **Birth Year:** Look for birth years (e.g., '1985', 'gim. 90') INSIDE the text. If found, extract to 'birthYear'. Do NOT use Record Date as birth year.
        4. **Category:** Assign a valid category ID from this list: ${categoryIds.join(', ')}.

        Respond ONLY with a JSON object that matches the requested schema.
      `,
    });

    const result = analysisPrompt.output;
    
    // If the model output is empty or doesn't match the schema, return the default error.
    if (!result) {
        return defaultErrorResponse;
    }
    
    return result;

  } catch (error) {
    console.error("Error in cleanImportRecord AI action:", error);
    return defaultErrorResponse;
  }
}
