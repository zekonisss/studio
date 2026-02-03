'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { detailedReportCategories } from '@/lib/constants';

const CategoryIdEnum = z.enum([
  ...detailedReportCategories.map(c => c.id) as [string, ...string[]]
]);

// NAUJAS IŠPLĖSTAS IŠVESTIES FORMATAS SU VALIDACIJA
const OutputSchema = z.object({
  isValid: z.boolean().describe("Is the comment valid and relevant for a professional driver report?"),
  rejectionReason: z.string().optional().describe("If invalid, a short, one-sentence reason in Lithuanian why it was rejected."),
  categoryId: CategoryIdEnum.optional().describe("If valid, the most appropriate category ID."),
  suggestedTags: z.array(z.string()).optional().describe("If valid, a list of suggested tags."),
});

// Funkcija dabar grąžina sudėtingesnį objektą
export async function categorizeReport(input: { comment: string }): Promise<z.infer<typeof OutputSchema>> {
  const defaultInvalid = { isValid: false, rejectionReason: "Komentaras per trumpas arba jo nėra." };
  const defaultError = { isValid: false, rejectionReason: "AI analizės klaida." };
  
  if (!input.comment || input.comment.trim().length < 10) {
    return defaultInvalid;
  }

  try {
    const result = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `
        Tu esi griežtas transporto sektoriaus analitikas. Tavo užduotis yra patikrinti ir sukategorizuoti vairuotojo elgesio aprašymą.
        Tekstas: "${input.comment}"

        Pirma, atlik VALIDACIJĄ. Komentaras yra NETINKAMAS, jei:
        - Jame yra asmeninės informacijos (telefono numeris, asmens kodas, adresas).
        - Tai bendrinio pobūdžio teigiama rekomendacija ("geras vairuotojas", "puikiai dirba").
        - Tekstas akivaizdžiai nesusijęs su vairuotojo profesine veikla.
        - Komentaras yra per trumpas arba beprasmis.
        
        Jei komentaras NETINKAMAS:
        - "isValid" nustatyk į 'false'.
        - "rejectionReason" lauke trumpai parašyk atmetimo priežastį lietuviškai (pvz., "Sudėtyje yra asmens duomenų" arba "Nespecifinis teigiamas atsiliepimas").

        Jei komentaras TINKAMAS:
        - "isValid" nustatyk į 'true'.
        - Atlik KATEGORIZACIJĄ. Priskirk vieną iš šių ID:
          ${detailedReportCategories.map(c => `- ${c.id} (${c.nameKey})`).join('\n')}
        - Griežtos priskyrimo taisyklės:
          1. Jei apie kuro vagystę/trūkumą -> fuel_theft.
          2. Jei apie policiją, avariją, KET -> driving_safety.
          3. Jei apie girtumą, agresiją -> behavior.
          4. Jei apie darbo drausmės pažeidimus (neatvykimą, pravaikštas) -> discipline.
          5. Jei niekas akivaizdžiai netinka -> other_category.
        - Pasiūlyk tinkamas žymas ("suggestedTags").
        
        Atsakyk TIK JSON formatu.
      `,
      output: { schema: OutputSchema },
      config: { temperature: 0 },
    });

    if (!result.output) {
      return defaultError;
    }

    console.log(">>> AI REZULTATAS:", result.output);
    return result.output;
    
  } catch (error: any) {
    console.error(">>> AI KLAIDA:", error.message);
    return defaultError;
  }
}
