
'use server';

/**
 * @fileOverview An AI agent that provides Bible-based responses to user messages.
 *
 * - bibleChatResponse - A function that handles the chat response process.
 */

import { ai, getModel } from '../genkit';
import { z } from 'zod';
import type { BibleChatResponseInput, BibleChatResponseOutput } from '@/lib/types';
import { BibleChatResponseInputSchema, BibleChatResponseOutputSchema } from '@/lib/types';


export async function bibleChatResponse(input: BibleChatResponseInput): Promise<BibleChatResponseOutput> {
  return bibleChatResponseFlow(input);
}

const bibleChatResponseFlow = ai.defineFlow(
  {
    name: 'bibleChatResponseFlow',
    inputSchema: BibleChatResponseInputSchema,
    outputSchema: BibleChatResponseOutputSchema,
  },
  async ({ model, user_question, bible_verses }) => {
    
    const prompt = `Você é um assistente de IA compassivo e experiente, com um profundo conhecimento da Bíblia. Sua tarefa é responder à pergunta do usuário.

Regras importantes:
1.  **Resposta Principal**: Elabore uma resposta solidária, contextual e biblicamente sólida na propriedade "response". Use formatação Markdown (como **negrito**) para melhorar a legibilidade.
2.  **Citação de Versículos**: Identifique de 1 a 3 versículos BÍBLICOS RELEVANTES que fundamentam sua resposta. Para cada um, forneça a referência (ex: "João 3:16") e o texto completo na propriedade "verses". NÃO inclua os versículos na sua resposta principal.
3.  **Base Bíblica**: Use os versículos de referência fornecidos como a fonte primária, se eles forem relevantes para a pergunta. Caso contrário, encontre outros mais adequados.

Pergunta do usuário: "${user_question}"

Versículos de referência (use se aplicável):
${bible_verses.join('\n')}
`;
    
    const llmResponse = await ai.generate({
      prompt,
      model: getModel(model),
      output: {
        schema: BibleChatResponseOutputSchema,
      },
      config: {
        temperature: 0.7,
      },
    });

    return llmResponse.output!;
  }
);
