
'use server';

/**
 * @fileOverview An AI agent that provides Bible-based responses to user messages.
 *
 * - bibleChatResponse - A function that handles the chat response process.
 */

import { ai, getModel } from '../genkit';
import { z } from 'zod';
import type { BibleChatResponseInput, BibleChatResponseOutput, ChatHistoryItem } from '@/lib/types';
import { BibleChatResponseInputSchema, BibleChatResponseOutputSchema, ChatHistoryItemSchema } from '@/lib/types';


export async function bibleChatResponse(input: BibleChatResponseInput): Promise<BibleChatResponseOutput> {
  return bibleChatResponseFlow(input);
}

const systemPrompts: Record<string, string> = {
    pt: "Você é um assistente de IA compassivo e experiente, com um profundo conhecimento da Bíblia. Sua tarefa é responder à pergunta do usuário de forma clara e acolhedora em português, levando em consideração o histórico da conversa para manter o contexto.",
    en: "You are a compassionate and knowledgeable AI assistant with a deep understanding of the Bible. Your task is to answer the user's question clearly and warmly in English, taking into account the conversation history to maintain context.",
    es: "Eres un asistente de IA compasivo y experto, con un profundo conocimiento de la Biblia. Tu tarea es responder a la pregunta del usuario de forma clara y acogedora en español, teniendo en cuenta el historial de la conversación para mantener el contexto.",
    zh: "你是一位富有同情心和知识渊博的人工智能助手，对圣经有深刻的理解。你的任务是用中文清晰而热情地回答用户的问题，同时考虑对话历史以保持上下文。",
    ja: "あなたは聖書を深く理解している、思いやりのある知識豊富なAIアシスタントです。あなたの仕事は、ユーザーの質問に日本語で明確かつ温かく答えることであり、文脈を維持するために会話の履歴を考慮に入れます。"
};

const bibleChatResponseFlow = ai.defineFlow(
  {
    name: 'bibleChatResponseFlow',
    inputSchema: BibleChatResponseInputSchema,
    outputSchema: BibleChatResponseOutputSchema,
  },
  async (input) => {
    
    const systemPrompt = systemPrompts[input.language || 'pt'] || systemPrompts.pt;

    // Extract the abbreviation, e.g., "NVI (pt)" -> "NVI"
    const bibleVersionAbbrev = input.bible_version_name?.split(' ')[0] || 'NVI';

    const promptTemplate = `Regras importantes:
1.  **Resposta Principal**: Elabore uma resposta solidária, contextual e biblicamente sólida na propriedade "response".
    - **Considere o histórico da conversa** para fornecer uma resposta relevante e que não se repita.
    - **Estruture o texto em parágrafos curtos e bem definidos** para facilitar a leitura.
    - **Use formatação Markdown** (como **negrito** para destacar ideias importantes e listas com marcadores para organizar os pontos) para melhorar a legibilidade.
2.  **Citação de Versículos**: Identifique de 1 a 3 versículos BÍBLICOS RELEVANTES que fundamentam sua resposta. Para cada um, forneça a referência (ex: "João 3:16"), o texto completo e a sigla da versão da Bíblia (use a versão '${bibleVersionAbbrev}') no campo "bibleVersion". NÃO inclua os versículos na sua resposta principal.

{{#if history}}
Histórico da Conversa Anterior (para contexto):
{{#each history}}
{{#if (eq this.role 'user')}}
Usuário: {{this.parts.0.text}}
{{else}}
Modelo: {{this.parts.0.text}}
{{/if}}
{{/each}}
{{/if}}

Nova Pergunta do usuário: "{{user_question}}"
`;
    
    const prompt = ai.definePrompt({
      name: 'bibleChatPrompt',
      input: { schema: BibleChatResponseInputSchema },
      output: { schema: BibleChatResponseOutputSchema },
      system: systemPrompt,
      prompt: promptTemplate
    });

    const { output } = await prompt(input, {
        model: getModel(input.model),
        config: {
            temperature: 0.7,
        }
    });

    if (!output) {
      throw new Error("A IA não conseguiu gerar uma resposta.");
    }

    return output;
  }
);
