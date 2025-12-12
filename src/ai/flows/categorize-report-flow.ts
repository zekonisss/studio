
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
    if (!input.comment || input.comment.trim() === "") {
        return { categoryId: 'other_category', suggestedTags: [] };
    }
    
    const llmResponse = await ai.generate({
        model: 'gemini-1.5-flash',
        prompt: `You are a strict and precise assistant for a professional logistics company. Your MAIN task is to successfully assign the provided comment to EXACTLY ONE of the specified categories.

Comments can be in various languages (e.g., Lithuanian, Russian, English). You must analyze them and select the MOST ACCURATE 'categoryId'.

Rules:
1.  **Category Selection (Mandatory):** Choose ONLY ONE 'categoryId' from this list:
    ${allCategoryIds.join('\n    ')}

2.  **Priority:** You must select a specific category if at least one phrase in the comment matches any of the described offenses (e.g., alcohol consumption, accident, theft, indiscipline).

3.  **Category Descriptions (Your guide):**
    ${categoryDescriptionsForPrompt}

4.  **When to choose 'other_category':** You must choose 'other_category' ONLY if:
    a) The comment is **completely meaningless** or
    b) The comment does not describe **any** offense or incident at all.
    **Never** suggest 'other_category' if there is at least a minimal match to another category.

5.  **Tags:** Select the most appropriate 'suggestedTags' ONLY from the allowed tags of the chosen 'categoryId'. If 'other_category' is selected, return an empty array.

Incident Comment:
"{{{comment}}}"

Return the response only in the specified JSON format.

YOU MUST SELECT THE MOST ACCURATE CATEGORY.`,
        output: { schema: CategorizeReportOutputSchema },
        config: {
          temperature: 0,
        },
    });

    const output = llmResponse.output();

    if (!output) {
      return { categoryId: 'other_category', suggestedTags: [] };
    }

    let finalCategoryId = output.categoryId;
    let finalTags: string[] = [];

    const isValidCategory = allCategoryIds.includes(finalCategoryId);

    if (!isValidCategory) {
      finalCategoryId = 'other_category';
    }
    
    if (finalCategoryId !== 'other_category' && output.suggestedTags) {
      const allowedTagsForCategory = categoryTagKeysMap[finalCategoryId] || [];
      finalTags = output.suggestedTags.filter(tagKey => allowedTagsForCategory.includes(tagKey));
    }

    return { categoryId: finalCategoryId, suggestedTags: finalTags };
}
