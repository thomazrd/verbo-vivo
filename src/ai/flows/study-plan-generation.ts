'use server';

/**
 * @fileOverview Generates a 7-day bible study plan based on a given topic.
 *
 * - generateStudyPlan - A function that generates the study plan.
 */

import { ai, getModel } from '../genkit';
import type { StudyPlanInput, StudyPlanOutput } from '@/lib/types';
import { StudyPlanInputSchema, StudyPlanOutputSchema } from '@/lib/types';

export { type StudyPlanOutput };

export async function generateStudyPlan(input: StudyPlanInput): Promise<StudyPlanOutput> {
  return generateStudyPlanFlow(input);
}

const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: StudyPlanInputSchema,
    outputSchema: StudyPlanOutputSchema,
  },
  async (prompt) => {
    const llmResponse = await ai.generate({
      prompt: `Crie um plano de estudo bíblico de 7 dias sobre o tópico: "${prompt.topic}".
      Para cada dia, forneça uma referência de versículo e uma breve descrição ou tarefa de reflexão (cerca de 1-2 frases).
      O título do plano deve ser "Plano de Estudo sobre '${prompt.topic}'".`,
      model: getModel(),
      output: {
        schema: StudyPlanOutputSchema,
      },
      config: {
        temperature: 0.5,
      },
    });

    return llmResponse.output!;
  }
);
