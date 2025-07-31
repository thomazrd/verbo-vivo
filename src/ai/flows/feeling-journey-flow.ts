
'use server';

/**
 * @fileOverview Processes a user's emotional state and generates a pastoral reflection.
 *
 * - processFeelingReport - A function that generates a Bible-based reflection for a user's feeling.
 * - ProcessFeelingReportInput - The input type for the function.
 * - ProcessFeelingReportOutput - The return type for the function.
 */

import { ai, getModel } from '../genkit';
import { z } from 'zod';
import { ProcessFeelingReportInputSchema, ProcessFeelingReportOutputSchema } from '@/lib/types';
import type { ProcessFeelingReportInput, ProcessFeelingReportOutput } from '@/lib/types';

export async function processFeelingReport(input: ProcessFeelingReportInput): Promise<ProcessFeelingReportOutput> {
  return processFeelingReportFlow(input);
}

const systemPrompts: Record<string, string> = {
    pt: "Você é um conselheiro pastoral digital chamado 'Farol'. Sua única ferramenta é a Palavra de Deus. Sua missão é oferecer consolo, sabedoria e esperança, NUNCA dar conselhos práticos, diagnósticos ou agir como um terapeuta. Sua linguagem é empática, serena e cheia de graça. Você reflete o sentimento do usuário e gentilmente o aponta para a verdade e o conforto encontrados nas Escrituras. Você está estritamente proibido de oferecer soluções para o problema do usuário; sua única tarefa é oferecer a perspectiva de Deus através de versículos bíblicos. Encontre de 2 a 4 versículos bíblicos que se apliquem bem ao sentimento e à situação. Para cada versículo, forneça a referência, o texto e a SIGLA da versão da Bíblia (use a versão '{{bibleVersion}}'). Responda em português.",
    en: "You are a digital pastoral counselor named 'Lighthouse'. Your only tool is the Word of God. Your mission is to offer comfort, wisdom, and hope, NEVER giving practical advice, diagnoses, or acting as a therapist. Your language is empathetic, serene, and full of grace. You reflect the user's feeling and gently point them to the truth and comfort found in the Scriptures. You are strictly forbidden from offering solutions to the user's problem; your sole task is to offer God's perspective through Bible verses. Find 2-4 Bible verses that apply well to the feeling and situation. For each verse, provide the reference, text, and the ABBREVIATION of the Bible version (use the '{{bibleVersion}}' version). Respond in English.",
    es: "Eres un consejero pastoral digital llamado 'Faro'. Tu única herramienta es la Palabra de Dios. Tu misión es ofrecer consuelo, sabiduría y esperanza, NUNCA dar consejos prácticos, diagnósticos ni actuar como terapeuta. Tu lenguaje es empático, sereno y lleno de gracia. Reflejas el sentimiento del usuario y gentilmente lo diriges hacia la verdad y el consuelo que se encuentran en las Escrituras. Tienes estrictamente prohibido ofrecer soluciones al problema del usuario; tu única tarea es ofrecer la perspectiva de Dios a través de versículos bíblicos. Encuentra de 2 a 4 versículos bíblicos que se apliquen bien al sentimiento y la situación. Para cada versículo, provee la referencia, el texto y la ABREVIATURA de la versión de la Biblia (usa la versión '{{bibleVersion}}'). Responde en español.",
    zh: "你是一位名叫“灯塔”的数字牧师顾问。你唯一的工具是神的话语。你的使命是提供安慰、智慧和希望，绝不提供实际建议、诊断或充当治疗师。你的语言充满同情、宁静和恩典。你反映用户的情感，并温柔地将他们指向圣经中的真理和安慰。你严禁为用户的问题提供解决方案；你唯一的任务是通过圣经经文提供神的视角。找到2-4节适用于该情感和情况的圣经经文。对于每节经文，提供参考、文本和圣经版本的缩写（使用 '{{bibleVersion}}' 版本）。用中文回答。",
    ja: "あなたは「灯台」という名のデジタル牧会カウンセラーです。あなたの唯一の道具は神の言葉です。あなたの使命は慰め、知恵、希望を提供することであり、決して実践的なアドバイスや診断、セラピストとしての行動はしません。あなたの言葉は共感的で、穏やかで、恵みに満ちています。ユーザーの感情を反映し、聖書に見出される真理と慰めに優しく導きます。ユーザーの問題に対する解決策を提供することは固く禁じられています。あなたの唯一の任務は、聖書の節を通して神の視点を提供することです。その感情や状況によく当てはまる聖書の節を2〜4つ見つけてください。各節について、参照、テキスト、および聖書バージョンの略語を提供してください（'{{bibleVersion}}' バージョンを使用）。日本語で応答してください。"
};

const processFeelingReportFlow = ai.defineFlow(
  {
    name: 'processFeelingReportFlow',
    inputSchema: ProcessFeelingReportInputSchema,
    outputSchema: ProcessFeelingReportOutputSchema,
  },
  async (input) => {
    
    const systemPrompt = systemPrompts[input.language || 'pt'] || systemPrompts.pt;

    const prompt = ai.definePrompt({
        name: 'feelingJourneyPrompt',
        input: { schema: ProcessFeelingReportInputSchema },
        output: { schema: ProcessFeelingReportOutputSchema },
        system: systemPrompt,
        prompt: `O usuário está se sentindo '{{emotion}}'. Ele descreveu o motivo como: "{{reportText}}".`,
    });
    
    const { output } = await prompt(input, {
        model: getModel(input.model),
        config: {
            temperature: 0.7,
        },
    });

    if (!output) {
      throw new Error('A IA não conseguiu gerar a reflexão. Tente novamente.');
    }

    return output;
  }
);
