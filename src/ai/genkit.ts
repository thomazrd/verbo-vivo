
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
 * Obtém a referência do modelo Gemini a ser usado.
 * Usa o modelo passado como argumento.
 * Se não for definido, o padrão é 'gemini-1.5-flash'.
 * @returns {ModelReference<any>} A referência do modelo Genkit.
 */
export function getModel(modelName?: string | null): ModelReference<any> {
  const name = modelName || 'gemini-1.5-flash';
  return googleAI.model(name);
}
