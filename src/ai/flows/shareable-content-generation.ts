
'use server';

/**
 * @fileOverview Generates shareable, personalized, and didactic biblical content.
 *
 * - generateShareableContent - A function that handles the content generation process.
 */

import { ai, getModel } from '../genkit';
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
    system: "Você é um escritor cristão e guia espiritual com um dom especial para criar jornadas de reflexão. Sua missão é criar uma mensagem que sirva como uma instrução gentil e amorosa para alguém que está passando por dificuldades. A linguagem deve ser universal e acolhedora, livre de jargão religioso, como se você fosse um amigo sábio e compassivo. Seu objetivo é guiar a pessoa através de versículos bíblicos, oferecendo esperança e uma nova perspectiva. Para cada versículo, a explicação deve agir como uma instrução de como a pessoa pode aplicar essa verdade em sua vida agora. Conclua com uma pergunta suave que convide à reflexão, não à resposta. Retorne o conteúdo exclusivamente no formato JSON especificado. Encontre de 2 a 3 versículos que se apliquem bem à dificuldade descrita.",
    prompt: `Use a seguinte situação como base para a sua mensagem. Não inclua a descrição do problema no texto que você gerar.

Situação: "{{problemDescription}}"`,
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
    const { output } = await prompt(input, {
        model: getModel(input.model),
        config: {
            temperature: 0.7,
        },
    });

    if (!output) {
      throw new Error('A IA não conseguiu gerar o conteúdo. Tente novamente com uma descrição diferente.');
    }

    return output;
  }
);
