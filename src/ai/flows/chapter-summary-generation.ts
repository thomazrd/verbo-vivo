'use server';

/**
 * @fileOverview Generates a summary for a given chapter of the Bible.
 *
 * - generateChapterSummary - A function that generates the summary.
 */

import { ai } from '../genkit';
import { ChapterSummaryInputSchema, ChapterSummaryOutputSchema } from '@/lib/types';
import type { ChapterSummaryInput, ChapterSummaryOutput } from '@/lib/types';

export async function generateChapterSummary(input: ChapterSummaryInput): Promise<ChapterSummaryOutput> {
  return generateChapterSummaryFlow(input);
}

const generateChapterSummaryFlow = ai.defineFlow(
  {
    name: 'generateChapterSummaryFlow',
    inputSchema: ChapterSummaryInputSchema,
    outputSchema: ChapterSummaryOutputSchema,
  },
  async (prompt) => {
    const llmResponse = await ai.generate({
      prompt: `Você é um teólogo e professor de Bíblia. Sua tarefa é fornecer um resumo conciso e claro do capítulo bíblico a seguir. O resumo deve capturar os principais eventos, personagens, temas e ensinamentos do capítulo. O tom deve ser informativo e acessível para um leitor leigo.

Texto do Capítulo:
---
${prompt.chapterText}
---

Por favor, gere o resumo do capítulo.`,
      model: 'googleai/gemini-1.5-flash',
      output: {
        schema: ChapterSummaryOutputSchema,
      },
      config: {
        temperature: 0.3,
      },
    });

    return llmResponse.output!;
  }
);
