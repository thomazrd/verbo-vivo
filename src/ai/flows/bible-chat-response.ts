
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

const systemPrompts: Record<string, string> = {
    pt: "Você é um assistente de IA compassivo e experiente, com um profundo conhecimento da Bíblia. Sua tarefa é responder à pergunta do usuário de forma clara e acolhedora em português.",
    en: "You are a compassionate and knowledgeable AI assistant with a deep understanding of the Bible. Your task is to answer the user's question clearly and warmly in English.",
    es: "Eres un asistente de IA compasivo y experto, con un profundo conocimiento de la Biblia. Tu tarea es responder a la pregunta del usuario de forma clara y acogedora en español.",
    zh: "你是一位富有同情心和知识渊博的人工智能助手，对圣经有深刻的理解。你的任务是用中文清晰而热情地回答用户的问题。",
    ja: "あなたは聖書を深く理解している、思いやりのある知識豊富なAIアシスタントです。あなたの仕事は、ユーザーの質問に日本語で明確かつ温かく答えることです。"
};

const bibleChatResponseFlow = ai.defineFlow(
  {
    name: 'bibleChatResponseFlow',
    inputSchema: BibleChatResponseInputSchema,
    outputSchema: BibleChatResponseOutputSchema,
  },
  async (input) => {
    
    const systemPrompt = systemPrompts[input.language || 'pt'] || systemPrompts.pt;

    const prompt = `Regras importantes:
1.  **Resposta Principal**: Elabore uma resposta solidária, contextual e biblicamente sólida na propriedade "response".
    - **Estruture o texto em parágrafos curtos e bem definidos** para facilitar a leitura.
    - **Use formatação Markdown** (como **negrito** para destacar ideias importantes e listas com marcadores para organizar os pontos) para melhorar a legibilidade.
2.  **Citação de Versículos**: Identifique de 1 a 3 versículos BÍBLICOS RELEVANTES que fundamentam sua resposta. Para cada um, forneça a referência (ex: "João 3:16") e o texto completo na propriedade "verses". NÃO inclua os versículos na sua resposta principal.
3.  **Base Bíblica**: Use os versículos de referência fornecidos como a fonte primária, se eles forem relevantes para a pergunta. Caso contrário, encontre outros mais adequados.

Pergunta do usuário: "${input.user_question}"

Versículos de referência (use se aplicável):
${input.bible_verses.join('\n')}
`;
    
    const llmResponse = await ai.generate({
      system: systemPrompt,
      prompt,
      model: getModel(input.model),
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
