'use server';
/**
 * @fileOverview A report categorization AI agent.
 *
 * - categorizeReport - A function that handles the report categorization process.
 * - CategorizeReportInput - The input type for the categorizeReport function.
 * - CategorizeReportOutput - The return type for the categorizeReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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

export async function categorizeReport(
  input: CategorizeReportInput
): Promise<CategorizeReportOutput> {
  const validatedInput = CategorizeReportInputSchema.parse(input);

  const prompt = `You are an expert system for a transportation company. Your task is to categorize a report about a driver's incident based on the provided comment.
  Your output MUST be a valid JSON object.

  You MUST select ONE of the following category IDs that best fits the incident:
  - fuel_theft
  - driving_safety
  - behavior
  - discipline
  - technical_damage
  - legal_reputation
  - other_category

  Additionally, you can suggest ZERO or MORE of the following tags based on the comment's content. Only use tags from this list:
  - kuro_vagyste
  - krovinio_vagyste
  - imones_turto_vagyste
  - avaringumas
  - pavojingas_vairavimas
  - dazni_ket_pazeidimai
  - grasinimai_agresija
  - netinkamas_elgesys_kolegu_atzvilgiu
  - psichotropiniu_medziagu_vartojimas
  - konfliktiskas_asmuo
  - neblaivus_darbo_metu
  - neatvykimas_i_darba_be_pateisinamos_priezasties
  - neatsakingas_poziuris_i_darba
  - techninis_neatsakingumas
  - rizika_saugumui_ar_kroviniui
  - dazni_transporto_priemones_pazeidimai
  - buvo_teisinis_procesas_darbo_gincas
  - pakenkta_imones_reputacijai
  - neteiseta_veikla_itariama
  - kita_tag

  The final output MUST be a valid JSON object matching this schema: {"categoryId": "string", "suggestedTags": ["string", "string"]}.
  If no specific tags apply, return an empty array for suggestedTags.

  Here is the comment to analyze:
  "${validatedInput.comment}"
  `;

  const result = await ai.generate({
    model: "gemini-1.5-flash",
    prompt: prompt,
    output: {
      format: 'json',
      schema: CategorizeReportOutputSchema
    }
  });

  const output = result.output;
  if (!output) {
    throw new Error("AI did not return a valid response.");
  }

  return CategorizeReportOutputSchema.parse(output);
}
