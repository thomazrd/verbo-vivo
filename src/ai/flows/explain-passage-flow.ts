
'use server';

/**
 * @fileOverview An AI agent that provides a clear explanation for a biblical passage.
 *
 * - explainPassage - A function that handles the explanation process.
 */

import { ai, getModel } from '../genkit';
import { z } from 'zod';

const ExplainPassageInputSchema = z.object({
  model: z.string().optional().describe("The AI model to use, e.g. 'gemini-1.5-pro'."),
  passage: z.string().describe("The biblical passage to be explained."),
});

const ExplainPassageOutputSchema = z.object({
  explanation: z.string().describe("A clear and concise explanation of the passage."),
});

export type ExplainPassageInput = z.infer<typeof ExplainPassageInputSchema>;
export type ExplainPassageOutput = z.infer<typeof ExplainPassageOutputSchema>;


export async function explainPassage(input: ExplainPassageInput): Promise<ExplainPassageOutput> {
  return explainPassageFlow(input);
}

const explainPassageFlow = ai.defineFlow(
  {
    name: 'explainPassageFlow',
    inputSchema: ExplainPassageInputSchema,
    outputSchema: ExplainPassageOutputSchema,
  },
  async ({ model, passage }) => {
    
    const prompt = `Você é um teólogo e professor de Bíblia. Sua tarefa é explicar o seguinte trecho bíblico de forma clara, concisa e fiel ao contexto. Evite jargões complexos e foque na mensagem principal do texto.

Trecho: "${passage}"`;
    
    const llmResponse = await ai.generate({
      prompt,
      model: getModel(model),
      output: {
        schema: ExplainPassageOutputSchema,
      },
      config: {
        temperature: 0.3,
      },
    });

    return llmResponse.output!;
  }
);

    