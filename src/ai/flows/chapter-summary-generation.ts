'use server';

/**
 * @fileOverview Generates a summary for a given chapter of the Bible.
 *
 * - generateChapterSummary - A function that generates the summary.
 */

import { ai } from '../genkit';
import { ChapterSummaryInputSchema, ChapterSummaryOutputSchema } from '@/lib/types';
import type { ChapterSummaryInput, ChapterSummaryOutput } from '@/lib/types';

export async function generateChapterSummary(input: ChapterSummaryInput): Promise<ChapterSummaryOutput> {
  return generateChapterSummaryFlow(input);
}

const generateChapterSummaryFlow = ai.defineFlow(
  {
    name: 'generateChapterSummaryFlow',
    inputSchema: ChapterSummaryInputSchema,
    outputSchema: ChapterSummaryOutputSchema,
  },
  async (promptInput) => { // Renamed prompt to promptInput to avoid conflict with prompt variable for AI
    // TODO (Risco 3 Mitigação): Realizar testes de qualidade extensivos para os resumos gerados em cada idioma.
    // Pode ser necessário ajustar e refinar os prompts de sistema (basePrompts e requestLines)
    // para cada língua individualmente para garantir a precisão teológica e a clareza,
    // especialmente para 'zh' (Chinês) e 'ja' (Japonês).
    const getSystemPrompt = (language: string, chapterText: string): string => {
      const basePrompts: Record<string, string> = {
        pt: "Você é um teólogo e professor de Bíblia. Sua tarefa é fornecer um resumo conciso e claro do capítulo bíblico a seguir em português. O resumo deve capturar os principais eventos, personagens, temas e ensinamentos do capítulo, idealmente entre 3 e 5 frases. O tom deve ser informativo e acessível para um leitor leigo.",
        en: "You are a theologian and Bible teacher. Your task is to provide a concise and clear summary of the following Bible chapter in English. The summary should capture the main events, characters, themes, and teachings of the chapter, ideally in 3 to 5 sentences. The tone should be informative and accessible to a lay reader.",
        es: "Eres un teólogo y profesor de Biblia, con el don de explicar conceptos complejos de forma simple y clara. Tu tarea es leer el texto completo de un capítulo bíblico y generar un resumen conciso en español. El resumen debe tener entre 3 y 5 frases. Debe destacar los personajes principales, los eventos más importantes y el tema teológico central del capítulo.",
        zh: "你是一位神学家和圣经教师。你的任务是用中文对以下圣经章节提供一个简洁明了的总结。总结应抓住章节的主要事件、人物、主题和教导，最好在3到5句话之间。语气应具有信息性，易于非专业读者理解。",
        ja: "あなたは神学者であり聖書教師です。あなたの仕事は、以下の聖書の章について、簡潔かつ明確な要約を日本語で提供することです。要約は、章の主要な出来事、登場人物、テーマ、教えを捉え、理想的には3〜5文にまとめてください。トーンは情報提供型で、一般の読者にもわかりやすいものにしてください。"
      };

      const requestLines: Record<string, string> = {
        pt: "Por favor, gere o resumo do capítulo.",
        en: "Please generate the chapter summary.",
        es: "Por favor, genera el resumen del capítulo.",
        zh: "请生成章节摘要。",
        ja: "章の要約を生成してください。"
      };

      const selectedBasePrompt = basePrompts[language] || basePrompts.pt; // Fallback to Portuguese
      const selectedRequestLine = requestLines[language] || requestLines.pt; // Fallback to Portuguese

      return `${selectedBasePrompt}\n\nTexto do Capítulo:\n---\n${chapterText}\n---\n${selectedRequestLine}`;
    };

    const fullPrompt = getSystemPrompt(promptInput.language, promptInput.chapterText);

    const llmResponse = await ai.generate({
      prompt: fullPrompt,
      model: 'googleai/gemini-1.5-flash',
      output: {
        schema: ChapterSummaryOutputSchema,
      },
      config: {
        temperature: 0.3,
      },
    });

    return llmResponse.output!;
  }
);
