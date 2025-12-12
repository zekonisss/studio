import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY!,
      models: {
        "gemini-1.5-flash": {
          name: "gemini-1.5-flash",
        },
        "gemini-1.5-pro": {
          name: "gemini-1.5-pro",
        },
      },
    }),
  ],
});
