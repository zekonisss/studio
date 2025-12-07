'use server';
import { genkit } from 'genkit';
import { configureGenkit } from 'genkit/init';
import { googleAI } from '@genkit-ai/google-genai';

configureGenkit({
  plugins: [
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export const ai = genkit;
