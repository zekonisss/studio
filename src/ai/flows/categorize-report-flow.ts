
'use server';
/**
 * @fileOverview Analyzes an incident comment to categorize it and suggest relevant tags.
 * - categorizeReport - Function to categorize a report comment and suggest tags.
 * - CategorizeReportInput - Input type for the categorizeReport function.
 * - CategorizeReportOutput - Output type for the categorizeReport function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { detailedReportCategories } from '@/lib/constants';

// Initialize genkit AI tool
const ai = genkit({
  plugins: [googleAI()],
});

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
    let description = `${cat.id} ("${englishNameApproximation}" - ${availableTagKeys})`;
    if (cat.id === 'discipline') {
      description += ' - IMPORTANT: This category also includes being drunk at work (use tag: neblaivus_darbo_metu).';
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
  return categorizeReportFlow(input);
}

const categorizeReportFlow = ai.defineFlow(
  {
    name: 'categorizeReportFlow',
    inputSchema: CategorizeReportInputSchema,
    outputSchema: CategorizeReportOutputSchema,
  },
  async (input) => {
    
    const prompt = `Jūs esate griežtas ir tikslus profesionalios logistikos įmonės asistentas. Jūsų PAGRINDINĖ užduotis yra sėkmingai priskirti pateiktą komentarą TIKSLIAI VIENAI iš nurodytų kategorijų.

Komentarai gali būti įvairiomis kalbomis (pvz., lietuvių, rusų, anglų). Privalote juos išanalizuoti ir parinkti TIKSLIAUSIĄ 'categoryId'.

Taisyklės:
1.  **Kategorijos Parinkimas (Privalomas):** Pasirinkite TIK VIENĄ 'categoryId' iš šio sąrašo:
    ${allCategoryIds.join('\n    ')}

2.  **Prioritetas:** Privalote parinkti konkrečią kategoriją, jei bent viena frazė komentare atitinka bet kurį iš aprašytų nusižengimų (pvz., alkoholio vartojimas, avarija, vagystė, nedisciplina).

3.  **Kategorijos Aprašymai (Jūsų vadovas):**
    ${categoryDescriptionsForPrompt}

4.  **Kada rinktis 'other_category':** Jūs privalote rinktis 'other_category' TIK tuo atveju, jei:
    a) Komentaras yra **visiškai beprasmis** arba
    b) Komentaras visiškai neaprašo **jokio** nusižengimo ar incidento.
    **Niekada** nesiūlykite 'other_category', jei yra bent minimalus atitikimas kitai kategorijai.

5.  **Žymos (Tags):** Parinkite tinkamiausias 'suggestedTags' TIK iš pasirinktos 'categoryId' leistinų žymų. Jei 'other_category' pasirinkta, grąžinkite tuščią masyvą.

Incidento Komentaras:
"{{{comment}}}"

Grąžinkite atsakymą tik nurodytu JSON formatu.

PRIVALOTE PARINKTI TIKSLIAUSIĄ KATEGORIJĄ.`;

    const llmResponse = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: [
            { text: prompt },
            { data: { comment: input.comment } }
        ],
        output: { schema: CategorizeReportOutputSchema },
        config: {
          temperature: 0,
        },
    });
    
    const output = llmResponse.output;

    if (!output) {
      return { categoryId: 'other_category', suggestedTags: [] };
    }

    let finalCategoryId = output.categoryId;
    let finalTags: string[] = [];

    // Validate that the categoryId returned by the AI is one of the allowed ones.
    const isValidCategory = allCategoryIds.includes(finalCategoryId);

    if (!isValidCategory) {
      // If the AI hallucinates a category, default to 'other_category'.
      finalCategoryId = 'other_category';
    }
    
    // If category is valid and not 'other_category', filter the tags.
    if (finalCategoryId !== 'other_category' && output.suggestedTags) {
      const allowedTagsForCategory = categoryTagKeysMap[finalCategoryId] || [];
      // Filter out any tags that are not valid for the chosen category.
      finalTags = output.suggestedTags.filter(tagKey => allowedTagsForCategory.includes(tagKey));
    }

    return { categoryId: finalCategoryId, suggestedTags: finalTags };
  }
);
