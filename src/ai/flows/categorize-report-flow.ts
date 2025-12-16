
'use server';
/** * @fileOverview A report categorization AI agent. * * - categorizeReport - A function that handles the report categorization process. * - CategorizeReportInput - The input type for the categorizeReport function. * - CategorizeReportOutput - The return type for the categorizeReport function. */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
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
      description += ' - IMPORTANT: This category strictly relates to unauthorized absence, lateness, or poor general work ethic, NOT substance abuse.';
    }
    return description;
}).join('; \n');


const CategorizeReportInputSchema = z.object({
  comment: z
    .string()
    .describe(
      'The textual comment describing the incident. This comment may be in various languages.'
    ),
});
export type CategorizeReportInput = z.infer<
  typeof CategorizeReportInputSchema
>;

const CategorizeReportOutputSchema = z.object({
  categoryId: z.string(),
  suggestedTags: z.array(z.string()),
});
export type CategorizeReportOutput = z.infer<
  typeof CategorizeReportOutputSchema
>;

const categorizePrompt = ai.definePrompt({
  name: 'categorizeReportPrompt',
  input: { schema: CategorizeReportInputSchema },
  output: { schema: CategorizeReportOutputSchema },
  model: 'googleai/gemini-1.5-flash-preview-0514',
  config: {
    temperature: 0.1,
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
  prompt: `Jūs esate griežtas ir tikslus profesionalios logistikos įmonės asistentas. Jūsų PAGRINDINĖ užduotis yra sėkmingai priskirti pateiktą komentarą TIKSLIAI VIENAI iš nurodytų kategorijų. Jūs neturite teisės atsisakyti kategorizavimo.

Komentarai gali būti įvairiomis kalbomis (pvz., lietuvių, rusų, anglų). Privalote juos išanalizuoti ir parinkti TIKSLIAUSIĄ 'categoryId'.

Taisyklės:
1.  **Kategorijos Parinkimas (PRIEŠTAUKAVIMO NĖRA):** Pasirinkite TIK VIENĄ 'categoryId' iš šio sąrašo:
    ${allCategoryIds.join('\n    ')}

2.  **Prioritetas:** Privalote parinkti konkrečią kategoriją, jei bent viena frazė komentare atitinka bet kurį iš aprašytų nusižengimų (pvz., "alkoholis" turi vesti į 'behavior', "avarija" – į 'driving_safety').

3.  **Kategorijos Aprašymai (Jūsų vadovas):**
    ${categoryDescriptionsForPrompt}

4.  **Kada rinktis 'other_category':** Rinkitės 'other_category' TIK ir TIK tuo atveju, jei komentaras yra visiškai beprasmis, visiškai tuščias arba neaprašo **jokio** įvykio.
    **Jei aprašomas bet koks nusižengimas, PRIVALOTE parinkti geriausiai atitinkančią kategoriją.**

5.  **Žymos (Tags):** Parinkite tinkamiausias 'suggestedTags' TIK iš pasirinktos 'categoryId' leistinų žymų. Jei 'other_category' pasirinkta, grąžinkite tuščią masyvą.

Incidento Komentaras:
"{{{comment}}}"

Grąžinkite atsakymą tik nurodytu JSON formatu.

PRIVALOTE VADOVAUTIS TIK GRIEŽTAIS NURODYMAIS IR PARINKTI SPECIFIŠKĄ KATEGORIJĄ.`
});


const categorizeFlow = ai.defineFlow(
    {
      name: 'categorizeReportFlow',
      inputSchema: CategorizeReportInputSchema,
      outputSchema: CategorizeReportOutputSchema,
    },
    async (flowInput) => {
        const llmResponse = await categorizePrompt(flowInput);
        const output = llmResponse.output;

        if (!output) {
            throw new Error("AI did not return a valid response. Check API Key status.");
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
);
  
export async function categorizeReport(
  input: CategorizeReportInput
): Promise<CategorizeReportOutput> {
  const validatedInput = CategorizeReportInputSchema.parse(input);
  
  if (!validatedInput.comment || validatedInput.comment.trim() === "") {
    return { categoryId: 'other_category', suggestedTags: [] };
  }

  return await categorizeFlow(validatedInput);
}
