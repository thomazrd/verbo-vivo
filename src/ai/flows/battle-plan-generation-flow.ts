
'use server';

/**
 * @fileOverview Generates a battle plan based on a user's problem description.
 */

import { ai, getModel } from '../genkit';
import { GenerateBattlePlanInputSchema, GenerateBattlePlanOutputSchema, GenerateBattlePlanInput, GenerateBattlePlanOutput } from '@/lib/types';

export async function generateBattlePlan(input: GenerateBattlePlanInput): Promise<GenerateBattlePlanOutput> {
  return generateBattlePlanFlow(input);
}

const generateBattlePlanFlow = ai.defineFlow(
  {
    name: 'generateBattlePlanFlow',
    inputSchema: GenerateBattlePlanInputSchema,
    outputSchema: GenerateBattlePlanOutputSchema,
  },
  async (input) => {
    
    const languageMap: Record<string, string> = {
        pt: "Responda em Português do Brasil.",
        en: "Respond in English.",
        es: "Responda en Español.",
    };
    const languageInstruction = languageMap[input.language || 'pt'] || "Responda em Português do Brasil.";

    const prompt = ai.definePrompt({
      name: 'generateBattlePlanPrompt',
      input: { schema: GenerateBattlePlanInputSchema },
      output: { schema: GenerateBattlePlanOutputSchema },
      system: `Você é um Estrategista Espiritual e Pastor experiente. Sua missão é criar um "Plano de Batalha" bíblico, prático e sensível para ajudar um líder a guiar sua comunidade através de um problema específico.

REGRAS IMPORTANTES:
1.  **Analise o Problema:** Entenda profundamente a raiz espiritual do problema descrito pelo usuário.
2.  **Duração:** O plano deve ter entre 5 e 10 dias.
3.  **Título e Descrição:** Crie um título inspirador e uma descrição curta e encorajadora para o plano.
4.  **Missões Diárias:** Para cada dia, crie uma missão com um título claro.
5.  **Variedade de Missões:** Combine OBRIGATORIAMENTE diferentes tipos de missão para um plano equilibrado:
    *   **BIBLE_READING:** Essencial. O campo 'content.verse' DEVE conter uma referência bíblica clara (ex: "Efésios 6:10-18").
    *   **PRAYER_SANCTUARY:** Momentos de oração focada. O campo 'content.verse' deve ser nulo.
    *   **JOURNAL_ENTRY:** Reflexão escrita. O campo 'content.verse' deve ser nulo.
    *   **FEELING_JOURNEY:** Para processar emoções. O campo 'content.verse' deve ser nulo.
    *   **CONFESSION:** Para arrependimento e busca de perdão. O campo 'content.verse' deve ser nulo.
    *   **FAITH_CONFESSION:** Para declarar verdades bíblicas. O campo 'content.verse' deve ser nulo.
6.  **Notas do Líder (Opcional):** Se apropriado, adicione uma nota curta e pastoral para dar direção à missão do dia.
7.  **Fidelidade Bíblica:** Todas as sugestões devem ser estritamente fundamentadas em princípios bíblicos.
8.  **Linguagem:** ${languageInstruction}`,
      prompt: `O problema que a comunidade enfrenta é: "{{problemDescription}}"`,
    });

    const { output } = await prompt(input, {
        model: getModel(input.model),
        config: {
            temperature: 0.8,
        },
    });

    if (!output) {
      throw new Error('A IA não conseguiu gerar um plano de batalha. Tente novamente com uma descrição diferente.');
    }

    return output;
  }
);
