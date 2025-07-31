
'use server';

/**
 * @fileOverview Processes a user's confession and generates a response of forgiveness.
 *
 * - processConfession - A function that generates a Bible-based response for a user's confession.
 */

import { ai, getModel } from '../genkit';
import { z } from 'zod';
import { BibleVerse } from '@/lib/types';

const BaseAiInputSchema = z.object({
    model: z.string().optional().describe("The AI model to use, e.g. 'gemini-1.5-pro'."),
    language: z.string().optional().describe('The language code for the response (e.g., "pt", "en").'),
});

const ConfessionInputSchema = BaseAiInputSchema.extend({
  confessionText: z.string().describe("The user's transcribed confession."),
  bibleVersion: z.string().optional().describe('The preferred Bible version (e.g., "NVI", "ACF").'),
});

const ForgivenessVerseSchema = z.object({
  reference: z.string().describe("The Bible reference for the verse of forgiveness (e.g., '1 João 1:9')."),
  text: z.string().describe("The full text of the verse."),
  bibleVersion: z.string().describe("The Bible version of the verse text."),
});

const ConfessionOutputSchema = z.object({
  responseText: z.string().describe("A compassionate, pastoral reflection based on the confession and the provided verses. It should not contain the verses themselves, only refer to them if needed."),
  verses: z.array(ForgivenessVerseSchema).min(2).max(3).describe("An array containing 2 to 3 powerful verses of forgiveness that are relevant to the confession."),
});

export type ProcessConfessionInput = z.infer<typeof ConfessionInputSchema>;
export type ProcessConfessionOutput = z.infer<typeof ConfessionOutputSchema>;


export async function processConfession(input: ProcessConfessionInput): Promise<ProcessConfessionOutput> {
  return processConfessionFlow(input);
}

const systemPrompts: Record<string, string> = {
    pt: `Você é um conselheiro pastoral digital que ouve uma confissão. Sua missão é trazer a certeza do perdão através da Palavra de Deus.
    1.  **Encontre os Versículos**: Analise a confissão do usuário e encontre de 2 a 3 versículos que ofereçam a garantia do perdão para o pecado confessado. Seja específico. Se a pessoa confessou mentira, encontre versículos sobre verdade e perdão. Se confessou orgulho, versículos sobre humildade e graça. Use a versão da Bíblia '{{bibleVersion}}'. Coloque-os na propriedade 'verses', incluindo a versão.
    2.  **Escreva a Reflexão**: No campo 'responseText', escreva uma reflexão pastoral curta (2-3 parágrafos), compassiva e que utilize a mensagem dos versículos que você encontrou para trazer conforto. Comece com uma saudação acolhedora e termine com uma palavra de encorajamento. O foco é a graça e o perdão, não penitência.
    3.  **Linguagem**: Responda em Português.`,
    en: `You are a digital pastoral counselor listening to a confession. Your mission is to bring the assurance of forgiveness through God's Word.
    1.  **Find Verses**: Analyze the user's confession and find 2 to 3 verses that offer the guarantee of forgiveness for the confessed sin. Be specific. If they confessed lying, find verses about truth and forgiveness. If they confessed pride, verses about humility and grace. Use the '{{bibleVersion}}' Bible version. Place them in the 'verses' property, including the version.
    2.  **Write the Reflection**: In the 'responseText' field, write a short (2-3 paragraphs), compassionate pastoral reflection that uses the message of the verses you found to bring comfort. Start with a welcoming greeting and end with a word of encouragement. The focus is on grace and forgiveness, not penance.
    3.  **Language**: Respond in English.`
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
          responseText: "Sua confissão foi ouvida. A Palavra de Deus nos assegura que se confessarmos os nossos pecados, Ele é fiel e justo para nos perdoar e nos purificar de toda injustiça. O amor de Deus é maior que nosso erro, e em Cristo, há um novo começo disponível para você.",
          verses: [{
              reference: "1 João 1:9",
              text: "Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar os pecados e nos purificar de toda injustiça.",
              bibleVersion: input.bibleVersion || 'NVI',
          }, {
            reference: "Salmos 103:12",
            text: "Quanto está longe o Oriente do Ocidente, assim afasta de nós as nossas transgressões.",
            bibleVersion: input.bibleVersion || 'NVI',
          }]
      };
    }

    return llmResponse.output;
  }
);
