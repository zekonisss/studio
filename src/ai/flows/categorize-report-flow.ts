'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { detailedReportCategories } from '@/lib/constants';

// Griežtas ID sąrašas iš tavo constants.ts
const CategoryIdEnum = z.enum([
  ...detailedReportCategories.map(c => c.id) as [string, ...string[]]
]);

const OutputSchema = z.object({
  categoryId: CategoryIdEnum,
  suggestedTags: z.array(z.string()).optional(),
});

export async function categorizeReport(input: { comment: string }) {
  if (!input.comment || input.comment.trim().length < 5) {
    return { categoryId: 'other_category', suggestedTags: [] };
  }

  try {
    const result = await ai.generate({
      // Naudojame tavo nuotraukoje matytą modelį
      model: googleAI.model('gemini-2.5-flash'), 
      prompt: `
        Tu esi vairuotojų saugumo analitikas. Išanalizuok šį tekstą: "${input.comment}"

        Privalai priskirti vieną iš šių ID:
        ${detailedReportCategories.map(c => `- ${c.id} (${c.nameKey})`).join('\n')}

        Griežtos taisyklės:
        1. Jei tekstas apie kuro vagystę/trūkumą -> fuel_theft.
        2. Jei tekstas apie policiją, avariją, sustabdymą -> driving_safety.
        3. Jei tekstas apie girtumą, agresiją -> behavior.
        4. Jei niekas netinka -> other_category.
        
        Atsakyk TIK JSON formatu.
      `,
      output: { schema: OutputSchema },
      config: { temperature: 0 },
    });

    if (!result.output) {
      return { categoryId: 'other_category', suggestedTags: [] };
    }

    // Spausdiname rezultatą terminale (image_fc4928.png vietoje)
    console.log(">>> AI ATPAŽINO:", result.output.categoryId);

    return result.output;
  } catch (error: any) {
    // Jei gemini-2.5-flash visgi neveikia, terminale pamatysi šį užrašą:
    console.error(">>> AI KLAIDA:", error.message);
    
    // Grąžiname default, kad programa nesustotų
    return { categoryId: 'other_category', suggestedTags: [] };
  }
}