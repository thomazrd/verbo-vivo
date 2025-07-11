
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {ModelReference} from 'genkit/model';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
});

/**
 * Gets the string reference for the Gemini model to be used.
 * Uses the model passed as an argument.
 * Defaults to 'gemini-1.5-flash' if not defined.
 * @returns {ModelReference<any>} The Genkit model reference.
 */
export function getModel(modelName?: string | null): ModelReference<any> {
  const name = modelName || 'gemini-1.5-flash';
  // Correct syntax for referencing a model in Genkit
  return `googleai/${name}` as ModelReference<any>;
}
