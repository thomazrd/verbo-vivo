
'use server';

/**
 * @fileOverview Generates suggestions for the "My Armor" feature.
 *
 * - suggestWeaponsForBattle - Generates a full set of 7 verses for a given spiritual battle.
 * - getBibleWeaponSuggestion - Generates 3 relevant verse suggestions for a given battle.
 */

import { ai, getModel } from '../genkit';
import { z } from 'zod';
import { ArmorSuggestionInputSchema, ArmorSuggestionOutputSchema, ArmorWeaponSchema } from '@/lib/types';
import type { ArmorSuggestionInput, ArmorSuggestionOutput } from '@/lib/types';

export async function suggestWeaponsForBattle(input: ArmorSuggestionInput): Promise<ArmorSuggestionOutput> {
  return suggestWeaponsFlow(input);
}

export async function getBibleWeaponSuggestion(input: ArmorSuggestionInput): Promise<ArmorSuggestionOutput> {
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
      inputSchema: ArmorSuggestionInputSchema,
      outputSchema: ArmorSuggestionOutputSchema,
    },
    async (input) => {
        const prompt = ai.definePrompt({
            name: 'getSingleWeaponSuggestionPrompt',
            input: { schema: ArmorSuggestionInputSchema },
            output: { schema: ArmorSuggestionOutputSchema },
            system: `Para um soldado lutando contra '{{battle}}', sugira 3 versículos bíblicos relevantes como objetos JSON. Cada objeto deve ter os campos: verseReference, verseText, e bibleVersion ('NVI').`,
            prompt: `Batalha: "{{battle}}"`,
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
      
      // The prompt asks for 3 but the schema expects 7, so we just return the 3 in the expected wrapper
      return output;
    }
  );

