
'use server';

/**
 * @fileOverview Generates a 7-day bible study plan based on a given topic.
 *
 * - generateStudyPlan - A function that generates the study plan.
 */

import { ai, getModel } from '../genkit';
import type { StudyPlanInput, StudyPlanOutput } from '@/lib/types';
import { StudyPlanInputSchema, StudyPlanOutputSchema } from '@/lib/types';

export { type StudyPlanOutput };

export async function generateStudyPlan(input: StudyPlanInput): Promise<StudyPlanOutput> {
  return generateStudyPlanFlow(input);
}

const systemPrompts: Record<string, string> = {
    pt: "Sua tarefa é criar um plano de estudo bíblico de 7 dias sobre o tópico fornecido. Para cada dia, forneça uma referência de versículo e uma breve descrição ou tarefa de reflexão (cerca de 1-2 frases). O título do plano deve ser 'Plano de Estudo sobre [TÓPICO]'. Responda em português.",
    en: "Your task is to create a 7-day Bible study plan on the provided topic. For each day, provide a verse reference and a brief description or reflection task (about 1-2 sentences). The title of the plan should be 'Study Plan on [TOPIC]'. Respond in English.",
    es: "Tu tarea es crear un plan de estudio bíblico de 7 días sobre el tema proporcionado. Para cada día, proporciona una referencia de versículo y una breve descripción o tarea de reflexión (alrededor de 1-2 frases). El título del plan debe ser 'Plan de Estudio sobre [TEMA]'. Responde en español.",
    zh: "你的任务是就所提供的主题创建一个为期7天的圣经学习计划。每天提供一个经文参考和简短的描述或反思任务（约1-2句话）。计划的标题应为“关于[主题]的学习计划”。用中文回答。",
    ja: "あなたの仕事は、提供されたトピックに関する7日間の聖書研究計画を作成することです。各日について、聖句の参照と短い説明または考察の課題（約1〜2文）を提供してください。計画のタイトルは「[トピック]に関する研究計画」としてください。日本語で応答してください。"
};

const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: StudyPlanInputSchema,
    outputSchema: StudyPlanOutputSchema,
  },
  async (input) => {
    
    const systemPrompt = (systemPrompts[input.language || 'pt'] || systemPrompts.pt).replace('[TÓPICO]', input.topic);

    const llmResponse = await ai.generate({
      system: systemPrompt,
      prompt: `Tópico: "${input.topic}"`,
      model: getModel(input.model),
      output: {
        schema: StudyPlanOutputSchema,
      },
      config: {
        temperature: 0.5,
      },
    });

    return llmResponse.output!;
  }
);
