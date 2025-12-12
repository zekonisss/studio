
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
import { googleAI } from '@genkit-ai/google-genai';

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
    const result = await categorizeReportFlow(input);
    
    // Validate the response
    const validCategoryId = allCategoryIds.includes(result.categoryId) ? result.categoryId : 'other_category';
    const validTags = result.suggestedTags.filter(tag => 
        categoryTagKeysMap[validCategoryId]?.includes(tag)
    );

    return {
        categoryId: validCategoryId,
        suggestedTags: validTags
    };
}


const prompt = ai.definePrompt({
  name: 'categorizeReportPrompt',
  input: {schema: CategorizeReportInputSchema},
  output: {schema: CategorizeReportOutputSchema},
  prompt: `
      You are an expert system for categorizing driver incident reports for a logistics company. 
      Your task is to analyze the user's comment and assign the most appropriate category and suggest relevant tags.

      RULES:
      1.  Analyze the provided comment: {{{comment}}}
      2.  You MUST choose exactly one category from the following list.
      3.  The chosen category MUST be one of these exact IDs: ${allCategoryIds.join(', ')}.
      4.  Here are descriptions for each category to help you decide:
          ${categoryDescriptionsForPrompt}
      5.  Based on the chosen category, you can suggest one or more tags.
      6.  Suggested tags MUST be chosen ONLY from the 'available tag keys' for that specific category.
      7.  If no specific tag fits, you can suggest the "kita_tag".
      8.  If you are absolutely unsure, use the "other_category".
      9.  Your final output must be a JSON object with 'categoryId' and 'suggestedTags'.
  `,
  model: googleAI.model('gemini-1.5-pro'),
  config: {
    temperature: 0,
  }
});


const categorizeReportFlow = ai.defineFlow(
  {
    name: 'categorizeReportFlow',
    inputSchema: CategorizeReportInputSchema,
    outputSchema: CategorizeReportOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    
    const output = llmResponse.output();
    
    if (!output) {
      console.error("AI did not return a valid structured response.");
      return { categoryId: 'other_category', suggestedTags: [] };
    }

    return output;
  }
);
