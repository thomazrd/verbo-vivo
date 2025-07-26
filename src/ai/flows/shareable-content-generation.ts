
'use server';

/**
 * @fileOverview Generates shareable, personalized, and didactic biblical content.
 *
 * - generateShareableContent - A function that handles the content generation process.
 */

import { ai, getModel } from '../genkit';
import { z } from 'zod';
import { GenerateShareableContentInputSchema, GenerateShareableContentOutputSchema } from '@/lib/types';
import type { GenerateShareableContentInput, GenerateShareableContentOutput } from '@/lib/types';

export async function generateShareableContent(input: GenerateShareableContentInput): Promise<GenerateShareableContentOutput> {
  return generateShareableContentFlow(input);
}

const systemPrompts: Record<string, string> = {
    pt: `Você é um escritor cristão e guia espiritual com um dom especial para criar jornadas de reflexão. Sua missão é criar uma mensagem em português que sirva como uma instrução gentil e amorosa para alguém que está passando por dificuldades. A linguagem deve ser universal e acolhedora, livre de jargão religioso, como se você fosse um amigo sábio e compassivo. Seu objetivo é guiar a pessoa através de versículos bíblicos, oferecendo esperança e uma nova perspectiva. Para cada versículo, a explicação deve agir como uma instrução de como a pessoa pode aplicar essa verdade em sua vida agora. Conclua com uma pergunta suave que convide à reflexão, não à resposta. Retorne o conteúdo exclusivamente no formato JSON especificado. Encontre de 2 a 3 versículos que se apliquem bem à dificuldade descrita.
{{#if recipientName}}
Comece o campo "opening" com uma saudação pessoal, como "Prezado(a) {{recipientName}},".
{{/if}}
`,
    en: `You are a Christian writer and spiritual guide with a special gift for creating reflective journeys. Your mission is to create a message in English that serves as a gentle and loving instruction for someone going through difficulties. The language should be universal and welcoming, free of religious jargon, as if you were a wise and compassionate friend. Your goal is to guide the person through biblical verses, offering hope and a new perspective. For each verse, the explanation should act as an instruction on how the person can apply this truth in their life now. Conclude with a gentle question that invites reflection, not an answer. Return the content exclusively in the specified JSON format. Find 2-3 verses that apply well to the described difficulty.
{{#if recipientName}}
Start the "opening" field with a personal greeting, like "Dear {{recipientName}},".
{{/if}}
`,
    es: `Eres un escritor cristiano y guía espiritual con un don especial para crear viajes de reflexión. Tu misión es crear un mensaje en español que sirva como una instrucción amable y amorosa para alguien que atraviesa dificultades. El lenguaje debe ser universal y acogedor, libre de jerga religiosa, como si fueras un amigo sabio y compasivo. Tu objetivo es guiar a la persona a través de versículos bíblicos, ofreciendo esperanza y una nueva perspectiva. Para cada versículo, la explicación debe actuar como una instrucción sobre cómo la persona puede aplicar esta verdad en su vida ahora. Concluye con una pregunta suave que invite a la reflexión, no a una respuesta. Devuelve el contenido exclusivamente en el formato JSON especificado. Encuentra de 2 a 3 versículos que se apliquen bien a la dificultad descrita.
{{#if recipientName}}
Comienza el campo "opening" con un saludo personal, como "Estimado(a) {{recipientName}},".
{{/if}}
`,
    zh: `你是一位基督徒作家和属灵导师，拥有创造反思之旅的特殊天赋。你的任务是用中文创作一条信息，作为给经历困难之人的温柔而充满爱意的指引。语言应普遍且热情，不含宗教术语，就像你是一位智慧而富有同情心的朋友。你的目标是通过圣经经文引导人们，提供希望和新的视角。对于每节经文，解释应作为指导，告诉人们如何将这一真理应用于当下的生活。以一个温和的问题结束，邀请反思，而非回答。仅以指定的JSON格式返回内容。找到2-3节与所描述的困难非常匹配的经文。
{{#if recipientName}}
在"opening"字段以个人问候开始，例如“亲爱的{{recipientName}}，”
{{/if}}
`,
    ja: `あなたは、反省的な旅を創り出す特別な才能を持つクリスチャンライターであり、スピリチュアルガイドです。あなたの使命は、困難を経験している人のための、優しく愛情深い指導となる日本語のメッセージを作成することです。言葉遣いは普遍的で、宗教的な専門用語を使わず、賢明で思いやりのある友人のように、歓迎するものであるべきです。あなたの目標は、聖書の節を通してその人を導き、希望と新しい視点を提供することです。各節について、その人が今、この真理を自分の人生にどのように適用できるかの指示として説明を機能させてください。答えを求めず、反省を促す優しい質問で締めくくってください。指定されたJSON形式でのみコンテンツを返してください。記述された困難によく当てはまる2〜3の聖句を見つけてください。
{{#if recipientName}}
「opening」フィールドを、「親愛なる{{recipientName}}様」のような個人的な挨拶で始めてください。
{{/if}}
`
};

const generateShareableContentFlow = ai.defineFlow(
  {
    name: 'generateShareableContentFlow',
    inputSchema: GenerateShareableContentInputSchema,
    outputSchema: GenerateShareableContentOutputSchema,
  },
  async (input) => {
    
    const systemPrompt = systemPrompts[input.language || 'pt'] || systemPrompts.pt;

    const prompt = ai.definePrompt({
        name: 'shareableContentPrompt',
        input: { schema: GenerateShareableContentInputSchema },
        output: { schema: GenerateShareableContentOutputSchema },
        system: systemPrompt,
        prompt: `Use a seguinte situação como base para a sua mensagem. Não inclua a descrição do problema no texto que você gerar.

Situação: "{{problemDescription}}"`,
    });
    
    const { output } = await prompt(input, {
        model: getModel(input.model),
        config: {
            temperature: 0.7,
        },
    });

    if (!output) {
      throw new Error('A IA não conseguiu gerar o conteúdo. Tente novamente com uma descrição diferente.');
    }

    return output;
  }
);
