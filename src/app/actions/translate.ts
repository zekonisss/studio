'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Translates text to a target language using a professional logistics context.
 * @param text The text to translate.
 * @param targetLanguage The target language code (e.g., 'en', 'pl', 'et').
 * @returns The translated text, or the original text on error.
 */
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!text || !targetLanguage) {
    return text;
  }
  
  // Convert language code to full name for better AI understanding
  const langMap: Record<string, string> = {
    en: 'English',
    pl: 'Polish',
    ru: 'Russian',
    lv: 'Latvian',
    et: 'Estonian',
    lt: 'Lithuanian'
  };

  const targetLanguageFullName = langMap[targetLanguage] || targetLanguage;

  try {
    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      config: { temperature: 0.1 },
      prompt: `You are a professional translator for the logistics and transportation industry. Translate the following text into ${targetLanguageFullName}. 
      Keep the tone formal, objective, and factual. 
      Do not add any explanations, introductory phrases, or markdown. Just return the raw translated text.
      
      Text to translate:
      "${text}"
      `,
    });

    return response.text.trim();
  } catch (error) {
    console.error(`Translation error to ${targetLanguage}:`, error);
    // On error, return the original text so the UI doesn't break
    return text;
  }
}
