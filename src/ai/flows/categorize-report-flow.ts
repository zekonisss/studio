
'use server';
/**
 * @fileOverview A plant problem diagnosis AI agent.
 *
 * - categorizeReport - A function that handles the plant diagnosis process.
 * - CategorizeReportInput - The input type for the categorizeReport function.
 * - CategorizeReportOutput - The return type for the categorizeReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

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
  return categorizeReportFlow(input);
}

const prompt = ai.definePrompt(
  {
    name: 'categorizeReportPrompt',
    model: googleAI.model('gemini-1.5-pro'),
    input: {schema: CategorizeReportInputSchema},
    output: {schema: CategorizeReportOutputSchema},
    prompt: `You are an expert system for a transportation company. Your task is to categorize a report about a driver's incident based on the provided comment.

You MUST select ONE of the following category IDs that best fits the incident:
- fuel_theft (kuro vagyste, sukciavimas)
- driving_safety (pavojingas vairavimas, avarijos)
- behavior (agresija, konfliktai, girtumas)
- discipline (darbo drausmes pazeidimai, neatvykimas)
- technical_damage (transporto priemones gadinimas)
- legal_reputation (teisiniai gincai, imones reputacijos gadinimas)
- other_category (viskas, kas netinka prie auksciau isvardintu)

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

The final output MUST be a valid JSON object matching the output schema. Do not add any tags that are not in the provided list. If no specific tags apply, return an empty array for suggestedTags.

Here is the comment to analyze:
{{{comment}}}
`,
  },
);

const categorizeReportFlow = ai.defineFlow(
  {
    name: 'categorizeReportFlow',
    inputSchema: CategorizeReportInputSchema,
    outputSchema: CategorizeReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
