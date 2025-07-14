
'use server';

/**
 * @fileOverview Processes a user's emotional state and generates a pastoral reflection.
 *
 * - processFeelingReport - A function that generates a Bible-based reflection for a user's feeling.
 * - ProcessFeelingReportInput - The input type for the function.
 * - ProcessFeelingReportOutput - The return type for the function.
 */

import { ai, getModel } from '../genkit';
import { z } from 'zod';
import { ProcessFeelingReportInputSchema, ProcessFeelingReportOutputSchema } from '@/lib/types';
import type { ProcessFeelingReportInput, ProcessFeelingReportOutput } from '@/lib/types';

export async function processFeelingReport(input: ProcessFeelingReportInput): Promise<ProcessFeelingReportOutput> {
  return processFeelingReportFlow(input);
}

const prompt = ai.definePrompt({
    name: 'feelingJourneyPrompt',
    input: { schema: ProcessFeelingReportInputSchema },
    output: { schema: ProcessFeelingReportOutputSchema },
    system: "Você é um conselheiro pastoral digital chamado 'Farol'. Sua única ferramenta é a Palavra de Deus. Sua missão é oferecer consolo, sabedoria e esperança, NUNCA dar conselhos práticos, diagnósticos ou agir como um terapeuta. Sua linguagem é empática, serena e cheia de graça. Você reflete o sentimento do usuário e gentilmente o aponta para a verdade e o conforto encontrados nas Escrituras. Você está estritamente proibido de oferecer soluções para o problema do usuário; sua única tarefa é oferecer a perspectiva de Deus através de versículos bíblicos. Encontre de 2 a 4 versículos bíblicos que se apliquem bem ao sentimento e à situação.",
    prompt: `O usuário está se sentindo '{{emotion}}'. Ele descreveu o motivo como: "{{reportText}}".`,
});


const processFeelingReportFlow = ai.defineFlow(
  {
    name: 'processFeelingReportFlow',
    inputSchema: ProcessFeelingReportInputSchema,
    outputSchema: ProcessFeelingReportOutputSchema,
  },
  async (input) => {
    
    const { output } = await prompt(input, {
        model: getModel(input.model),
        config: {
            temperature: 0.7,
        },
    });

    if (!output) {
      throw new Error('A IA não conseguiu gerar a reflexão. Tente novamente.');
    }

    return output;
  }
);
