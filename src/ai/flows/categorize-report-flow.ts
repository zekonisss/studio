
'use server';
/**
 * @fileOverview A temporary utility to list available AI models.
 * - categorizeReport - Temporarily repurposed to list models.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI, listModels } from '@genkit-ai/google-genai';


const CategorizeReportInputSchema = z.object({
  comment: z.string().describe('The textual comment describing the incident. This comment may be in various languages.'),
});
export type CategorizeReportInput = z.infer<typeof CategorizeReportInputSchema>;

const CategorizeReportOutputSchema = z.object({
  categoryId: z.string(),
  suggestedTags: z.array(z.string()),
});
export type CategorizeReportOutput = z.infer<typeof CategorizeReportOutputSchema>;

export async function categorizeReport(input: CategorizeReportInput): Promise<CategorizeReportOutput> {
    console.log('Fetching available models...');
    try {
        const models = await listModels();
        console.log('Available models:', JSON.stringify(models, null, 2));
    } catch (error) {
        console.error('Error listing models:', error);
    }

    // Return a dummy response to satisfy the type signature
    return {
        categoryId: 'debug_mode',
        suggestedTags: [],
    };
}
