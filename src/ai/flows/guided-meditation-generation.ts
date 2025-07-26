
'use server';

/**
 * @fileOverview Generates reflection questions for a guided meditation on a bible verse.
 *
 * - generateMeditationQuestions - A function that generates the questions.
 */

import { ai, getModel } from '../genkit';
import type { MeditationQuestionsInput, MeditationQuestionsOutput } from '@/lib/types';
import { MeditationQuestionsInputSchema, MeditationQuestionsOutputSchema } from '@/lib/types';


export async function generateMeditationQuestions(input: MeditationQuestionsInput): Promise<MeditationQuestionsOutput> {
  return generateMeditationQuestionsFlow(input);
}

const systemPrompts: Record<string, string> = {
    pt: "Você é um conselheiro espiritual gentil e sábio. Seu objetivo é ajudar o usuário a meditar na Palavra de Deus. Crie 3 perguntas abertas e reflexivas baseadas no versículo fornecido, para ajudar o usuário a aplicar esta verdade em sua vida hoje. Responda em português.",
    en: "You are a gentle and wise spiritual counselor. Your goal is to help the user meditate on God's Word. Create 3 open-ended, reflective questions based on the provided verse to help the user apply this truth to their life today. Respond in English.",
    es: "Eres un consejero espiritual amable y sabio. Tu objetivo es ayudar al usuario a meditar en la Palabra de Dios. Crea 3 preguntas abiertas y reflexivas basadas en el versículo proporcionado, para ayudar al usuario a aplicar esta verdad en su vida hoy. Responde en español.",
    zh: "你是一位温柔而智慧的属灵顾问。你的目标是帮助用户默想神的话语。根据所提供的经文，创建3个开放式、反思性的问题，以帮助用户将这个真理应用到今天的生活中。用中文回答。",
    ja: "あなたは優しく賢明な霊的カウンセラーです。あなたの目標は、ユーザーが神の言葉を黙想するのを助けることです。提供された聖句に基づいて、ユーザーがこの真理を今日の生活に適用するのを助けるための、3つの自由回答形式の思索的な質問を作成してください。日本語で応答してください。"
};

const generateMeditationQuestionsFlow = ai.defineFlow(
  {
    name: 'generateMeditationQuestionsFlow',
    inputSchema: MeditationQuestionsInputSchema,
    outputSchema: MeditationQuestionsOutputSchema,
  },
  async (input) => {
    
    const systemPrompt = systemPrompts[input.language || 'pt'] || systemPrompts.pt;

    const llmResponse = await ai.generate({
      system: systemPrompt,
      prompt: `Versículo: "${input.bible_verse}"`,
      model: getModel(input.model),
      output: {
        schema: MeditationQuestionsOutputSchema,
      },
      config: {
        temperature: 0.8,
      },
    });

    return llmResponse.output!;
  }
);
