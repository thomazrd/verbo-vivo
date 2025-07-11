'use server';

/**
 * @fileOverview Generates reflection questions for a guided meditation on a bible verse.
 *
 * - generateMeditationQuestions - A function that generates the questions.
 */

import { ai, getModel } from '../genkit';
import type { MeditationQuestionsInput, MeditationQuestionsOutput } from '@/lib/types';
import { MeditationQuestionsInputSchema, MeditationQuestionsOutputSchema } from '@/lib/types';


export async function generateMeditationQuestions(input: MeditationQuestionsInput): Promise<MeditationQuestionsOutput> {
  return generateMeditationQuestionsFlow(input);
}

const generateMeditationQuestionsFlow = ai.defineFlow(
  {
    name: 'generateMeditationQuestionsFlow',
    inputSchema: MeditationQuestionsInputSchema,
    outputSchema: MeditationQuestionsOutputSchema,
  },
  async (prompt) => {
    const llmResponse = await ai.generate({
      prompt: `Você é um conselheiro espiritual gentil e sábio. Seu objetivo é ajudar o usuário a meditar na Palavra de Deus. Crie 3 perguntas abertas e reflexivas baseadas no versículo fornecido, para ajudar o usuário a aplicar esta verdade em sua vida hoje.

Versículo: "${prompt.bible_verse}"`,
      model: getModel(),
      output: {
        schema: MeditationQuestionsOutputSchema,
      },
      config: {
        temperature: 0.8,
      },
    });

    return llmResponse.output!;
  }
);
