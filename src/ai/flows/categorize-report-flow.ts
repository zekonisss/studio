'use server';
/**
 * @fileOverview Analyzes an incident comment to categorize it and suggest relevant tags.
 * - categorizeReport - Function to categorize a report comment and suggest tags.
 * - CategorizeReportInput - Input type for the categorizeReport function.
 * - CategorizeReportOutput - Output type for the categorizeReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { detailedReportCategories } from '@/lib/constants';

const allCategoryObjects = detailedReportCategories.map(cat => ({ id: cat.id, nameKey: cat.nameKey, tags: cat.tags }));
const allCategoryIds = allCategoryObjects.map(cat => cat.id);

// Create a mapping of categoryId to its available tag keys for the prompt
const categoryTagKeysMap = allCategoryObjects.reduce((acc, cat) => {
  acc[cat.id] = cat.tags;
  return acc;
}, {} as Record<string, string[]>);

// Generate descriptions for the prompt, including available tag *keys* for each category
const categoryDescriptionsForPrompt = allCategoryObjects.map(cat => {
    const englishNameApproximation = cat.nameKey.replace('categories.', '').replace(/_/g, ' ');
    const availableTagKeys = cat.tags.length > 0 ? `available tag keys: ${cat.tags.join(', ')}` : 'no specific tag keys for this category';
    return `${cat.id} ("${englishNameApproximation}" - ${availableTagKeys})`;
}).join('; \n');


const CategorizeReportInputSchema = z.object({
  comment: z.string().describe('The textual comment describing the incident. This comment may be in various languages.'),
});
export type CategorizeReportInput = z.infer<typeof CategorizeReportInputSchema>;

const CategorizeReportOutputSchema = z.object({
  categoryId: z.string().describe(`The most relevant category ID from the following list: ${allCategoryIds.join(', ')}. Choose only one. If unsure, select 'other_category'.`),
  suggestedTags: z.array(z.string()).describe('A list of relevant tag KEYS for the incident, chosen ONLY from the tag KEYS available for the selected categoryId. If no tag keys are relevant or available for the chosen category, or if the category is "other_category", return an empty array.'),
});
export type CategorizeReportOutput = z.infer<typeof CategorizeReportOutputSchema>;

export async function categorizeReport(input: CategorizeReportInput): Promise<CategorizeReportOutput> {
  if (!input.comment || input.comment.trim() === "") {
    return { categoryId: 'other_category', suggestedTags: [] };
  }
  return categorizeReportFlow(input);
}

const prompt = ai.definePrompt({
    name: 'categorizeReportPrompt',
    inputSchema: CategorizeReportInputSchema,
    outputSchema: CategorizeReportOutputSchema,
    prompt: `You are an expert assistant for a logistics and transportation company, specializing in categorizing driver incident reports.
Analyze the provided incident comment, which may be in various languages (e.g., Lithuanian, Russian, English, Latvian, Polish, Estonian).
Based on the comment, your task is to:

1.  Select the MOST appropriate 'categoryId'. The categoryId MUST be one of the following values:
    ${allCategoryIds.join('\n    ')}
    Here are descriptions for each categoryId to help you choose:
    ${categoryDescriptionsForPrompt}

    If the comment is vague, unclear, or doesn't fit well into any specific category, you MUST choose 'other_category'.

2.  Based on the selected 'categoryId' AND the content of the comment, suggest a list of 'suggestedTags'.
    Tags MUST be selected ONLY from the "available tag keys" associated with the chosen categoryId (as listed above).
    If the chosen categoryId is 'other_category', or if it has no specific tag keys, or if none of its tag keys are relevant to the comment, return an empty array for 'suggestedTags'.

Incident Comment:
"{{{comment}}}"

Consider the primary subject and severity of the incident. If multiple issues are mentioned, prioritize the most significant one.
For example, if a comment states "Driver was caught stealing fuel and was also very rude to staff", "fuel_theft" is likely the primary category.

Return your answer in the specified JSON format.
Ensure 'categoryId' is exactly one of the allowed IDs.
Ensure 'suggestedTags' only contains tag KEYS valid for the chosen 'categoryId'.
`,
});


const categorizeReportFlow = ai.defineFlow(
  {
    name: 'categorizeReportFlow',
    inputSchema: CategorizeReportInputSchema,
    outputSchema: CategorizeReportOutputSchema,
  },
  async (input) => {
    
    const response = await ai.generate({
        model: 'gemini-1.5-flash-latest',
        prompt: (await prompt.render(input)).prompt,
        output: { schema: CategorizeReportOutputSchema },
    });
    
    const output = response.output;

    if (!output) {
      return { categoryId: 'other_category', suggestedTags: [] };
    }

    let finalCategoryId = output.categoryId;
    let finalTags: string[] = [];

    // Validate categoryId
    const selectedCategoryDetails = categoryTagKeysMap[finalCategoryId];
    if (!selectedCategoryDetails) {
      finalCategoryId = 'other_category'; 
    }
    
    // If category is 'other_category', tags should be empty
    if (finalCategoryId === 'other_category') {
        finalTags = [];
    } else if (selectedCategoryDetails && output.suggestedTags) {
      // Validate suggestedTags - ensure they belong to the selected category
      finalTags = output.suggestedTags.filter(tagKey => selectedCategoryDetails.includes(tagKey));
    }

    return { categoryId: finalCategoryId, suggestedTags: finalTags };
  }
);
