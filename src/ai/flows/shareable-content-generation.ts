
'use server';

/**
 * @fileOverview Generates shareable, personalized, and didactic biblical content.
 *
 * - generateShareableContent - A function that handles the content generation process.
 */

import { ai } from '../genkit';
import { z } from 'zod';
import { GenerateShareableContentInputSchema, GenerateShareableContentOutputSchema } from '@/lib/types';
import type { GenerateShareableContentInput, GenerateShareableContentOutput } from '@/lib/types';

export async function generateShareableContent(input: GenerateShareableContentInput): Promise<GenerateShareableContentOutput> {
  return generateShareableContentFlow(input);
}

const prompt = ai.definePrompt({
    name: 'shareableContentPrompt',
    input: { schema: GenerateShareableContentInputSchema },
    output: { schema: GenerateShareableContentOutputSchema },
    system: "Você é um escritor cristão com um dom especial para explicar as verdades da Bíblia de forma simples, amorosa e acolhedora para pessoas que podem estar feridas ou não conhecerem a Deus. Sua linguagem deve ser universal e livre de jargão religioso. O objetivo é oferecer esperança e luz, nunca julgar ou impor. Fale como um amigo sábio e compassivo que se importa genuinamente com a dor da pessoa. Retorne o conteúdo exclusivamente no formato JSON especificado. Para encontrar os versículos, busque na Bíblia por passagens que falem de esperança, conforto e força em meio à dificuldade descrita. Escolha de 2 a 3 versículos que se apliquem bem.",
    prompt: `Use a seguinte situação como base para a sua mensagem. Não inclua a descrição do problema no texto que você gerar.

Situação: "{{problemDescription}}"`,
    model: 'googleai/gemini-1.5-flash',
    config: {
        temperature: 0.7,
    },
});

const generateShareableContentFlow = ai.defineFlow(
  {
    name: 'generateShareableContentFlow',
    inputSchema: GenerateShareableContentInputSchema,
    outputSchema: GenerateShareableContentOutputSchema,
  },
  async (input) => {

    // For now, we'll let the model find the verses based on the system prompt.
    // In a future version, this could be a separate step involving a vector search.
    const { output } = await prompt(input);

    if (!output) {
      throw new Error('A IA não conseguiu gerar o conteúdo. Tente novamente com uma descrição diferente.');
    }

    return output;
  }
);
