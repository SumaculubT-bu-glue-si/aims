import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

let ai: any = null;

if (!isBrowser) {
  // Server-side: Full Genkit functionality
  try {
    ai = genkit({
      plugins: [
        googleAI({
          apiKey: process.env.GOOGLE_AI_API_KEY || '',
        }),
      ],
      enableTracingAndMetrics: false,
      logLevel: 'info',
    });
  } catch (error) {
    console.error('Genkit initialization failed on server:', error);
  }
} else {
  // Browser-side: Mock AI functions
  ai = {
    definePrompt: (config: any) => {
      return {
        name: config.name,
        input: config.input,
        output: config.output,
        run: async (input: any) => {
          console.warn('AI feature not available in browser environment');
          return { text: 'AI feature not available in browser. Please use server-side functionality.' };
        }
      };
    },
    run: async (prompt: any, input: any) => {
      console.warn('AI feature not available in browser environment');
      return { text: 'AI feature not available in browser. Please use server-side functionality.' };
    },
    generateText: async (prompt: any) => {
      console.warn('AI feature not available in browser environment');
      return { text: 'AI feature not available in browser. Please use server-side functionality.' };
    }
  };
}

export { ai };
