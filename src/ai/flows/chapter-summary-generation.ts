
'use server';

/**
 * @fileOverview Generates an explanation for a given chapter of the Bible.
 *
 * - generateChapterSummary - A function that generates the explanation.
 */

import { ai, getModel } from '../genkit';
import { z } from 'zod';
import { ChapterSummaryInputSchema, ChapterSummaryOutputSchema } from '@/lib/types';
import type { ChapterSummaryInput, ChapterSummaryOutput } from '@/lib/types';

export async function generateChapterSummary(input: ChapterSummaryInput): Promise<ChapterSummaryOutput> {
  const summaryText = await generateChapterSummaryFlow(input);
  return { summary: summaryText };
}

const systemPrompts: Record<string, string> = {
    pt: "Você é um professor de Bíblia com o dom de explicar textos complexos de forma simples e clara. Sua tarefa é fornecer uma explicação do capítulo bíblico fornecido em português que seja fácil para um jovem de 15 anos entender. A explicação deve ser concisa, ter no máximo dois parágrafos, e capturar os principais eventos, temas e ensinamentos do capítulo. Use uma linguagem acessível e evite jargões teológicos complexos.",
    en: "You are a Bible teacher gifted in explaining complex texts simply and clearly. Your task is to provide an explanation of the provided Bible chapter in English that a 15-year-old can easily understand. The explanation must be concise, have a maximum of two paragraphs, and capture the main events, themes, and teachings of the chapter. Use accessible language and avoid complex theological jargon.",
    es: "Eres un profesor de Biblia con el don de explicar textos complejos de forma simple y clara. Tu tarea es proporcionar una explicación del capítulo bíblico proporcionado en español que un joven de 15 años pueda entender fácilmente. La explicación debe ser concisa, tener un máximo de dos párrafos y capturar los principales eventos, temas y enseñanzas del capítulo. Usa un lenguaje accesible y evita la jerga teológica compleja.",
    zh: "你是一位圣经教师，善于用简单明了的方式解释复杂的经文。你的任务是用中文对所提供的圣经章节进行教学性解释，使得一个15岁的青少年能够轻松理解。解释必须简洁，最多两个段落，并抓住章节的主要事件、主题和教导。请使用通俗易懂的语言，避免复杂的术语。",
    ja: "あなたは複雑なテキストを単純明快に説明する才能に恵まれた聖書教師です。あなたの仕事は、提供された聖書の章について、15歳の若者が容易に理解できるような日本語での説明を提供することです。説明は簡潔で、最大2つの段落で、章の主要な出来事、テーマ、教えを捉える必要があります。難解な神学用語は避け、分かりやすい言葉を使用してください。"
};

const generateChapterSummaryFlow = ai.defineFlow(
  {
    name: 'generateChapterSummaryFlow',
    inputSchema: ChapterSummaryInputSchema,
    outputSchema: z.string(),
  },
  async ({ chapterText, language, model }) => {
    
    const systemPrompt = systemPrompts[language] || systemPrompts.pt;

    const llmResponse = await ai.generate({
      system: systemPrompt,
      prompt: `Aqui está o texto do capítulo. Por favor, gere a explicação com base nele:\n\n${chapterText}`,
      model: getModel(model),
      config: {
        temperature: 0.3,
      },
    });
    
    const output = llmResponse.text;

    if (!output) {
      throw new Error("A IA não conseguiu gerar uma explicação para o capítulo.");
    }
    
    return output;
  }
);
