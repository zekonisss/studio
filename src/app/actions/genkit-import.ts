'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { detailedReportCategories } from '@/lib/constants';

// 1. Define the Zod schema for the expected output.
const categoryIds = detailedReportCategories.map(c => c.id) as [string, ...string[]];
export const ImportCleanSchema = z.object({
  categoryId: z.enum(categoryIds).describe("The most appropriate category ID for the incident."),
  sanitizedText: z.string().describe("A neutral, professional, and concise summary of the incident in Lithuanian."),
  birthYear: z.string().optional().describe("The driver's year of birth, ONLY if found within the original text body."),
  isValid: z.boolean().describe("Set to false if the text is not about a specific driver incident (e.g., a complaint about a manager, salary, or company policy)."),
  rejectionReason: z.string().optional().describe("If isValid is false, a brief reason in Lithuanian explaining why."),
});

export type CleanImportResult = z.infer<typeof ImportCleanSchema>;

// 2. Create the exported server action.
export async function cleanImportRecord(input: { text: string; recordDate?: string }): Promise<CleanImportResult> {
  
  const defaultErrorResponse: CleanImportResult = {
    isValid: false,
    rejectionReason: "AI analizės klaida, reikalinga rankinė peržiūra.",
    sanitizedText: input.text,
    categoryId: 'other_category',
  };

  if (!input.text || input.text.trim().length < 10) {
    return {
      isValid: false,
      rejectionReason: "Tekstas per trumpas arba jo nėra.",
      sanitizedText: input.text,
      categoryId: 'other_category',
    };
  }

  try {
    const analysisPrompt = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      output: { schema: ImportCleanSchema },
      config: { temperature: 0.1 },
      prompt: `
        Tu esi Duomenų Atitikties Pareigūnas, atsakingas už senų duomenų bazės įrašų valymą.
        Tavo užduotis yra:
        1.  **VALIDUOTI:** Griežtai atmesti tekstus, kurie yra skundai apie vadybininkus, įmonės politiką, atlyginimą ar kitus panašius dalykus, nesusijusius su konkrečiu vairuotojo incidentu. Palik TIK tuos įrašus, kurie aprašo vairuotojo veiksmus. Jei tekstas netinkamas, nustatyk 'isValid' į 'false' ir 'rejectionReason' lauke trumpai paaiškink kodėl (pvz., "Skundas apie įmonės valdymą, o ne vairuotoją").
        2.  **IŠVALYTI:** Jei įrašas tinkamas ('isValid' yra 'true'), išvalyk jį: pašalink keiksmažodžius, emocijas, asmenines nuomones. Perrašyk tekstą neutraliai, profesionaliai ir trumpai. Tai bus 'sanitizedText'.
        3.  **EKSTRAHUOTI GIMIMO METUS:** Atidžiai peržiūrėk TIK originalų komentarą ('text' lauke). Ieškok gimimo metų (pvz., "gim. 1985", "85-ųjų", "gimęs 90-aisiais", "1991 m."). Jei randi, įrašyk 4 skaitmenų metus į 'birthYear' lauką. Jei nerandi, palik lauką tuščią. Svarbu: 'recordDate' yra incidento data, ne gimimo metai.
        4.  **KATEGORIZUOTI:** Priskirk TIK vieną tinkamiausią kategorijos ID iš šio sąrašo: ${categoryIds.join(', ')}.

        Originalus tekstas: "${input.text}"
        Įrašo data (incidento data): ${input.recordDate || 'Nenurodyta'}

        Atsakyk TIK JSON formatu pagal nurodytą schemą.
      `,
    });

    const result = analysisPrompt.output;
    if (!result) {
        return defaultErrorResponse;
    }
    
    return result;

  } catch (error) {
    console.error("Error in cleanImportRecord AI action:", error);
    return defaultErrorResponse;
  }
}
