
'use server';

/**
 * @fileOverview An AI agent that provides a clear explanation for a biblical passage.
 *
 * - explainPassage - A function that handles the explanation process.
 */

import { ai, getModel } from '../genkit';
import { z } from 'zod';
import { ExplainPassageInputSchema, ExplainPassageOutputSchema } from '@/lib/types';
import type { ExplainPassageInput, ExplainPassageOutput } from '@/lib/types';


export async function explainPassage(input: ExplainPassageInput): Promise<ExplainPassageOutput> {
  return explainPassageFlow(input);
}

const systemPrompts: Record<string, string> = {
    pt: "Você é um teólogo e professor de Bíblia. Sua tarefa é explicar o seguinte trecho bíblico de forma clara, concisa e fiel ao contexto, em português. Evite jargões complexos e foque na mensagem principal do texto.",
    en: "You are a theologian and Bible teacher. Your task is to explain the following biblical passage clearly, concisely, and contextually in English. Avoid complex jargon and focus on the main message of the text.",
    es: "Eres un teólogo y profesor de Biblia. Tu tarea es explicar el siguiente pasaje bíblico de forma clara, concisa y fiel al contexto, en español. Evita la jerga compleja y céntrate en el mensaje principal del texto.",
    zh: "你是一位神学家和圣经教师。你的任务是用中文清晰、简洁、符合上下文地解释以下圣经段落。避免使用复杂的术语，专注于文本的主要信息。",
    ja: "あなたは神学者であり聖書教師です。あなたの仕事は、次の聖書の箇所を日本語で明確、簡潔、文脈に忠実に説明することです。複雑な専門用語を避け、テキストの主要なメッセージに焦点を当ててください。"
};

const explainPassageFlow = ai.defineFlow(
  {
    name: 'explainPassageFlow',
    inputSchema: ExplainPassageInputSchema,
    outputSchema: ExplainPassageOutputSchema,
  },
  async (input) => {
    
    const systemPrompt = systemPrompts[input.language || 'pt'] || systemPrompts.pt;
    
    const llmResponse = await ai.generate({
      system: systemPrompt,
      prompt: `Trecho: "${input.passage}"`,
      model: getModel(input.model),
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
