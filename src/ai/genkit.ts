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
 * Usa o modelo definido na variável de ambiente GEMINI_MODEL.
 * Se não estiver definido, o padrão é 'gemini-1.5-flash'.
 * @returns {ModelReference<any>} A referência do modelo Genkit.
 */
export function getModel(): ModelReference<any> {
  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  return googleAI.model(modelName);
}
