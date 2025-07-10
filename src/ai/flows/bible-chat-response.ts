'use server';

/**
 * @fileOverview An AI agent that provides Bible-based responses to user messages.
 *
 * - bibleChatResponse - A function that handles the chat response process.
 */

import { ai } from '../genkit';
import { z } from 'zod';
import type { BibleChatResponseInput, BibleChatResponseOutput } from '@/lib/types';
import { BibleChatResponseInputSchema } from '@/lib/types';


export async function bibleChatResponse(input: BibleChatResponseInput): Promise<BibleChatResponseOutput> {
  return bibleChatResponseFlow(input);
}

const bibleChatResponseFlow = ai.defineFlow(
  {
    name: 'bibleChatResponseFlow',
    inputSchema: BibleChatResponseInputSchema,
    outputSchema: z.string(),
  },
  async (prompt) => {
    const llmResponse = await ai.generate({
      prompt: `Você é um assistente de IA compassivo e experiente, com um profundo conhecimento da Bíblia. Responda à pergunta do usuário de forma solidária, contextual e biblicamente sólida. Use os seguintes versículos bíblicos como referência principal em sua resposta. Incorpore os versículos de forma natural na conversa, explicando sua relevância para a pergunta do usuário.

Pergunta do usuário: "${prompt.user_question}"

Versículos de referência:
${prompt.bible_verses.join('\n')}

Sua resposta deve ser útil, encorajadora e apontar para a sabedoria encontrada nas Escrituras.`,
      model: 'googleai/gemini-1.5-flash',
      config: {
        temperature: 0.7,
      },
    });

    return llmResponse.text;
  }
);
