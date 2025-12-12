
'use server';
/**
 * @fileOverview Analyzes an incident comment to categorize it and suggest relevant tags.
 * - categorizeReport - Function to categorize a report comment and suggest tags.
 * - CategorizeReportInput - Input type for the categorizeReport function.
 * - CategorizeReportOutput - Output type for the categorizeReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { detailedReportCategories } from '@/lib/constants';
import { googleAI, listModels } from '@genkit-ai/google-genai';

const allCategoryObjects = detailedReportCategories.map(cat => ({ id: cat.id, nameKey: cat.nameKey, tags: cat.tags }));
const allCategoryIds = allCategoryObjects.map(cat => cat.id);

const categoryTagKeysMap = allCategoryObjects.reduce((acc, cat) => {
  acc[cat.id] = cat.tags;
  return acc;
}, {} as Record<string, string[]>);

const categoryDescriptionsForPrompt = allCategoryObjects.map(cat => {
    const englishNameApproximation = cat.nameKey.replace('categories.', '').replace(/_/g, ' ');
    const availableTagKeys = cat.tags.length > 0 ? `available tag keys: ${cat.tags.join(', ')}` : 'no specific tag keys for this category';
    let description = `${cat.id} ("${englishNameApproximation}" - ${availableTagKeys})`;
    if (cat.id === 'discipline') {
      description += ' - IMPORTANT: This category focuses strictly on attendance and work ethic (e.g., failure to show up, irresponsibility).';
    }
    return description;
}).join('; \n');


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
    
    // --- TEMPORARY DEBUGGING CODE TO LIST MODELS ---
    try {
        console.log('Attempting to list available models...');
        const models = await listModels();
        console.log('Available Google AI Models:', JSON.stringify(models, null, 2));
    } catch (e: any) {
        console.error('Error listing models:', e.message);
    }
    // --- END OF TEMPORARY CODE ---

    // Return a dummy response to avoid breaking the UI during debugging
    return { categoryId: 'other_category', suggestedTags: [] };
}
