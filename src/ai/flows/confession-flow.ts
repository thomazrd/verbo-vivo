'use server';

/**
 * @fileOverview Processes a user's confession and generates a response of forgiveness.
 *
 * - processConfession - A function that generates a Bible-based response for a user's confession.
 */

import { ai, getModel } from '../genkit';
import { z } from 'zod';

const BaseAiInputSchema = z.object({
    model: z.string().optional().describe("The AI model to use, e.g. 'gemini-1.5-pro'."),
    language: z.string().optional().describe('The language code for the response (e.g., "pt", "en").'),
});

const ConfessionInputSchema = BaseAiInputSchema.extend({
  confessionText: z.string().describe("The user's transcribed confession."),
});

const ForgivenessVerseSchema = z.object({
  reference: z.string().describe("The Bible reference for the verse of forgiveness (e.g., '1 João 1:9')."),
  text: z.string().describe("The full text of the verse."),
});

const ConfessionOutputSchema = z.object({
  responseText: z.string().describe("A short, compassionate introductory phrase acknowledging the confession and pointing to God's grace."),
  verses: z.array(ForgivenessVerseSchema).length(1).describe("An array containing exactly ONE powerful verse of forgiveness that will be displayed prominently."),
});

export type ProcessConfessionInput = z.infer<typeof ConfessionInputSchema>;
export type ProcessConfessionOutput = z.infer<typeof ConfessionOutputSchema>;


export async function processConfession(input: ProcessConfessionInput): Promise<ProcessConfessionOutput> {
  return processConfessionFlow(input);
}

const systemPrompts: Record<string, string> = {
    pt: `Você é um conselheiro pastoral digital que ouve uma confissão. Sua única missão é trazer a certeza do perdão através da Palavra de Deus.
    1.  No campo 'responseText', escreva uma frase curta, acolhedora e que valide a coragem da confissão, como "Meu filho/filha, sua confissão foi ouvida. A Palavra de Deus nos assegura que...".
    2.  No campo 'verses', analise o conteúdo da confissão do usuário e encontre UM ÚNICO E PODEROSO versículo que garanta o perdão para o pecado confessado. Seja específico. Se a pessoa confessou mentira, encontre um versículo sobre verdade e perdão. Se confessou orgulho, um sobre humildade e graça. Priorize versículos como 1 João 1:9, Salmos 103:12, ou Isaías 1:18, mas escolha o mais relevante.
    3.  Seja direto, compassivo e foque exclusivamente na promessa do perdão. Não dê conselhos ou penitências. Apenas a graça. Responda em Português.`,
    en: `You are a digital pastoral counselor listening to a confession. Your sole mission is to bring the assurance of forgiveness through the Word of God.
    1. In the 'responseText' field, write a short, welcoming phrase that validates the courage of the confession, such as "My son/daughter, your confession has been heard. The Word of God assures us that...".
    2. In the 'verses' field, analyze the content of the user's confession and find ONE SINGLE, POWERFUL verse that guarantees forgiveness for the confessed sin. Be specific. If they confessed lying, find a verse about truth and forgiveness. If they confessed pride, one about humility and grace. Prioritize verses like 1 John 1:9, Psalm 103:12, or Isaiah 1:18, but choose the most relevant one.
    3. Be direct, compassionate, and focus exclusively on the promise of forgiveness. Do not give advice or penance. Only grace. Respond in English.`
};

const processConfessionFlow = ai.defineFlow(
  {
    name: 'processConfessionFlow',
    inputSchema: ConfessionInputSchema,
    outputSchema: ConfessionOutputSchema,
  },
  async (input) => {
    
    const systemPrompt = systemPrompts[input.language || 'pt'] || systemPrompts.pt;

    const llmResponse = await ai.generate({
      system: systemPrompt,
      prompt: `A confissão do usuário é: "${input.confessionText}"`,
      model: getModel(input.model),
      output: {
        schema: ConfessionOutputSchema,
      },
      config: {
        temperature: 0.5,
      },
    });

    if (!llmResponse.output) {
      // Fallback in case the AI fails
      return {
          responseText: "Sua confissão foi ouvida. A Palavra de Deus nos assegura que:",
          verses: [{
              reference: "1 João 1:9",
              text: "Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados e nos purificar de toda injustiça."
          }]
      };
    }

    return llmResponse.output;
  }
);
