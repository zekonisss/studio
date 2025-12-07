'use server';
import { genkit, configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

configureGenkit({
  plugins: [googleAI()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export { genkit as ai };
