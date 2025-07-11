'use server';

/**
 * @fileOverview Generates an explanation for a given chapter of the Bible.
 *
 * - generateChapterSummary - A function that generates the explanation.
 */

import { ai, getModel } from '../genkit';
import { z } from 'zod';
import { ChapterSummaryInputSchema } from '@/lib/types';
import type { ChapterSummaryInput, ChapterSummaryOutput } from '@/lib/types';

export async function generateChapterSummary(input: ChapterSummaryInput): Promise<ChapterSummaryOutput> {
  const summaryText = await generateChapterSummaryFlow(input);
  return { summary: summaryText };
}

const systemPrompts: Record<string, string> = {
    pt: "Você é um professor de Bíblia com o dom de explicar textos complexos de forma simples e clara. Sua tarefa é fornecer uma explicação didática do capítulo bíblico fornecido em português. A explicação deve capturar os principais eventos, temas e ensinamentos do capítulo, em um tom informativo e acessível para um leitor leigo. Evite jargões teológicos complexos.",
    en: "You are a Bible teacher gifted in explaining complex texts simply and clearly. Your task is to provide a didactic explanation of the provided Bible chapter in English. The explanation should capture the main events, themes, and teachings of the chapter in an informative and accessible tone for a lay reader. Avoid complex theological jargon.",
    es: "Eres un profesor de Biblia con el don de explicar textos complejos de forma simple y clara. Tu tarea es proporcionar una explicación didáctica del capítulo bíblico proporcionado en español. La explicación debe capturar los principales eventos, temas y enseñanzas del capítulo, en un tono informativo y accesible para un lector laico. Evita la jerga teológica compleja.",
    zh: "你是一位圣经教师，善于用简单明了的方式解释复杂的经文。你的任务是用中文对所提供的圣经章节进行教学性解释。解释应抓住章节的主要事件、主题和教导，以一种信息丰富、易于非专业读者理解的语气呈现。避免使用复杂的术语。",
    ja: "あなたは複雑なテキストを単純明快に説明する才能に恵まれた聖書教師です。あなたの仕事は、提供された聖書の章について、日本語で教訓的な説明を提供することです。説明は、一般の読者にとって有益で分かりやすいトーンで、章の主要な出来事、テーマ、教えを捉える必要があります。複雑な神学用語は避けてください。"
};

const generateChapterSummaryFlow = ai.defineFlow(
  {
    name: 'generateChapterSummaryFlow',
    inputSchema: ChapterSummaryInputSchema,
    outputSchema: z.string(),
  },
  async ({ chapterText, language }) => {
    
    const systemPrompt = systemPrompts[language] || systemPrompts.pt;

    const llmResponse = await ai.generate({
      system: systemPrompt,
      prompt: `Aqui está o texto do capítulo. Por favor, gere a explicação com base nele:\n\n${chapterText}`,
      model: getModel(),
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
