
'use server';

/**
 * @fileOverview Generates suggestions for the "My Armor" feature.
 *
 * - suggestWeaponsForBattle - Generates a full set of 7 verses for a given spiritual battle.
 * - getBibleWeaponSuggestion - Generates 3 relevant verse suggestions for a given battle.
 */

import { ai, getModel } from '../genkit';
import { z } from 'zod';

const ArmorWeaponSchema = z.object({
    verseReference: z.string(),
    verseText: z.string(),
    bibleVersion: z.string(),
});

// Input for a single weapon suggestion now accepts existing verses to avoid repetition
const SingleWeaponSuggestionInputSchema = z.object({
  battle: z.string().describe('The spiritual battle the user is facing (e.g., "Anxiety", "Fear").'),
  model: z.string().optional().describe("The AI model to use, e.g. 'gemini-1.5-pro'."),
  language: z.string().optional().describe('The language code for the response (e.g., "pt", "en").'),
  existingVerses: z.array(ArmorWeaponSchema).optional().describe('An array of verses already suggested to avoid repetition.'),
});
export type SingleWeaponSuggestionInput = z.infer<typeof SingleWeaponSuggestionInputSchema>;


const ArmorSuggestionInputSchema = z.object({
  battle: z.string().describe('The spiritual battle the user is facing (e.g., "Anxiety", "Fear").'),
  model: z.string().optional().describe("The AI model to use, e.g. 'gemini-1.5-pro'."),
  language: z.string().optional().describe('The language code for the response (e.g., "pt", "en").'),
});
export type ArmorSuggestionInput = z.infer<typeof ArmorSuggestionInputSchema>;

const ArmorSuggestionOutputSchema = z.object({
    weapons: z.array(ArmorWeaponSchema).describe('An array of bible verses to be used as spiritual weapons.'),
});
export type ArmorSuggestionOutput = z.infer<typeof ArmorSuggestionOutputSchema>;


export async function suggestWeaponsForBattle(input: ArmorSuggestionInput): Promise<ArmorSuggestionOutput> {
  return suggestWeaponsFlow(input);
}

export async function getBibleWeaponSuggestion(input: SingleWeaponSuggestionInput): Promise<ArmorSuggestionOutput> {
    return getSingleWeaponSuggestionFlow(input);
}

const suggestWeaponsFlow = ai.defineFlow(
  {
    name: 'suggestWeaponsForBattleFlow',
    inputSchema: ArmorSuggestionInputSchema,
    outputSchema: ArmorSuggestionOutputSchema,
  },
  async (input) => {
    
    const prompt = ai.definePrompt({
      name: 'suggestWeaponsPrompt',
      input: { schema: ArmorSuggestionInputSchema },
      output: { schema: ArmorSuggestionOutputSchema },
      system: `Você é um teólogo e estrategista espiritual. Para a batalha contra '{{battle}}', crie uma lista de 7 objetos JSON, cada um representando uma arma bíblica eficaz. Para cada um, forneça a referência canônica, o texto completo e a versão da Bíblia (NVI).`,
      prompt: `Batalha: "{{battle}}"`,
    });

    const { output } = await prompt(input, {
        model: getModel(input.model),
        config: {
            temperature: 0.8,
        },
    });

    if (!output) {
      throw new Error('A IA não conseguiu gerar as armas. Tente novamente.');
    }
    return output;
  }
);


const getSingleWeaponSuggestionFlow = ai.defineFlow(
    {
      name: 'getBibleWeaponSuggestionFlow',
      inputSchema: SingleWeaponSuggestionInputSchema,
      outputSchema: ArmorSuggestionOutputSchema,
    },
    async (input) => {
        const prompt = ai.definePrompt({
            name: 'getSingleWeaponSuggestionPrompt',
            input: { schema: SingleWeaponSuggestionInputSchema },
            output: { schema: ArmorSuggestionOutputSchema },
            system: `Para um soldado lutando contra '{{battle}}', sugira 3 versículos bíblicos com MÁXIMA RELEVÂNCIA para o tema. Cada objeto JSON deve ter os campos: verseReference, verseText, e bibleVersion ('NVI'). Se uma lista de versículos existentes for fornecida, NÃO repita NENHUM deles.`,
            prompt: `
Batalha: "{{battle}}"

{{#if existingVerses}}
Versículos já sugeridos (não repita estes):
{{#each existingVerses}}
- {{this.verseReference}}
{{/each}}
{{/if}}
`,
        });

      const { output } = await prompt(input, {
        model: getModel(input.model),
        config: {
            temperature: 0.7,
        },
      });

      if (!output) {
        throw new Error('A IA não conseguiu gerar sugestões. Tente novamente.');
      }
      
      return output;
    }
  );
