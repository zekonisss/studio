
'use server';
/**
 * @fileOverview Analyzes an incident comment to categorize it and suggest relevant tags.
 * - categorizeReport - Function to categorize a report comment and suggest tags.
 * - CategorizeReportInput - Input type for the categorizeReport function.
 * - CategorizeReportOutput - Output type for the categorizeReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { detailedReportCategories } from '@/types';

const allCategoryObjects = detailedReportCategories.map(cat => ({ id: cat.id, nameKey: cat.nameKey, tags: cat.tags }));
const allCategoryIds = allCategoryObjects.map(cat => cat.id);

const categoryDescriptionsForPrompt = allCategoryObjects.map(cat => {
    // For the prompt, it's better to use a human-readable name if possible,
    // rather than just the key. Here we'll simplify and use the key,
    // assuming the LLM can infer or we refine later if needed.
    // A more robust solution would load English translations here.
    const englishNameApproximation = cat.nameKey.replace('categories.', '').replace(/_/g, ' ');
    return `${cat.id} ("${englishNameApproximation}" - ${cat.tags.length > 0 ? `available tags: ${cat.tags.join(', ')}` : 'no specific tags for this category'})`;
}).join('; \n');


export const CategorizeReportInputSchema = z.object({
  comment: z.string().describe('The textual comment describing the incident. This comment may be in various languages.'),
});
export type CategorizeReportInput = z.infer<typeof CategorizeReportInputSchema>;

export const CategorizeReportOutputSchema = z.object({
  categoryId: z.string().describe(`The most relevant category ID from the following list: ${allCategoryIds.join(', ')}. Choose only one. If unsure, select 'other_category'.`),
  suggestedTags: z.array(z.string()).describe('A list of relevant tags for the incident, chosen ONLY from the tags available for the selected categoryId. If no tags are relevant or available for the chosen category, or if the category is "other_category", return an empty array.'),
});
export type CategorizeReportOutput = z.infer<typeof CategorizeReportOutputSchema>;

export async function categorizeReport(input: CategorizeReportInput): Promise<CategorizeReportOutput> {
  if (!input.comment || input.comment.trim() === "") {
    return { categoryId: 'other_category', suggestedTags: [] };
  }
  return categorizeReportFlow(input);
}

const categorizeReportPrompt = ai.definePrompt({
  name: 'categorizeReportPrompt',
  input: { schema: CategorizeReportInputSchema },
  output: { schema: CategorizeReportOutputSchema },
  prompt: `You are an expert assistant for a logistics and transportation company, specializing in categorizing driver incident reports.
Analyze the provided incident comment, which may be in various languages (e.g., Lithuanian, Russian, English, Latvian, Polish, Estonian).
Based on the comment, your task is to:

1.  Select the MOST appropriate 'categoryId'. The categoryId MUST be one of the following values:
    ${allCategoryIds.join('\n    ')}
    Here are descriptions for each categoryId to help you choose:
    ${categoryDescriptionsForPrompt}

    If the comment is vague, unclear, or doesn't fit well into any specific category, you MUST choose 'other_category'.

2.  Based on the selected 'categoryId' AND the content of the comment, suggest a list of 'suggestedTags'.
    Tags MUST be selected ONLY from the "available tags" associated with the chosen categoryId (as listed above).
    If the chosen categoryId is 'other_category', or if it has no specific tags, or if none of its tags are relevant to the comment, return an empty array for 'suggestedTags'.

Incident Comment:
"{{{comment}}}"

Consider the primary subject and severity of the incident. If multiple issues are mentioned, prioritize the most significant one.
For example, if a comment states "Driver was caught stealing fuel and was also very rude to staff", "fuel_theft" is likely the primary category.

Return your answer in the specified JSON format.
Ensure 'categoryId' is exactly one of the allowed IDs.
Ensure 'suggestedTags' only contains tags valid for the chosen 'categoryId'.
`,
});

const categorizeReportFlow = ai.defineFlow(
  {
    name: 'categorizeReportFlow',
    inputSchema: CategorizeReportInputSchema,
    outputSchema: CategorizeReportOutputSchema,
  },
  async (input) => {
    const { output } = await categorizeReportPrompt(input);

    if (!output) {
      return { categoryId: 'other_category', suggestedTags: [] };
    }

    let finalCategoryId = output.categoryId;
    let finalTags: string[] = [];

    // Validate categoryId
    const selectedCategory = allCategoryObjects.find(cat => cat.id === finalCategoryId);
    if (!selectedCategory) {
      finalCategoryId = 'other_category'; // Default if LLM hallucinates or provides invalid category
    }
    
    // If category is 'other_category', tags should be empty
    if (finalCategoryId === 'other_category') {
        finalTags = [];
    } else if (selectedCategory) {
      // Validate suggestedTags - ensure they belong to the selected category
      finalTags = output.suggestedTags.filter(tag => selectedCategory.tags.includes(tag));
    }

    return { categoryId: finalCategoryId, suggestedTags: finalTags };
  }
);
