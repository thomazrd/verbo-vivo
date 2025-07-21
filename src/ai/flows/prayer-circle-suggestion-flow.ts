
'use server';

/**
 * @fileOverview Suggests verses for a prayer circle based on its title and description.
 * 
 * - getPrayerCircleSuggestions - A function that handles the suggestion process.
 */

import { ai } from '../genkit';
import { z } from 'zod';

const PrayerCircleSuggestionInputSchema = z.object({
    title: z.string().describe("The title of the prayer circle."),
    description: z.string().optional().describe("The description of the prayer circle."),
});

const PrayerCircleSuggestionOutputSchema = z.object({
  suggestions: z.array(z.object({
      verse: z.string().describe("The full Bible reference (e.g., 'Isaiah 41:10')."),
      text: z.string().describe("The full text of the verse."),
      justification: z.string().describe("A short, compassionate explanation of why this verse is relevant to the user's prayer request."),
  })).length(3),
});

type PrayerCircleSuggestionInput = z.infer<typeof PrayerCircleSuggestionInputSchema>;
type PrayerCircleSuggestionOutput = z.infer<typeof PrayerCircleSuggestionOutputSchema>;

export async function getPrayerCircleSuggestions(input: PrayerCircleSuggestionInput): Promise<PrayerCircleSuggestionOutput> {
  return prayerCircleSuggestionFlow(input);
}


const prayerCircleSuggestionFlow = ai.defineFlow(
  {
    name: 'prayerCircleSuggestionFlow',
    inputSchema: PrayerCircleSuggestionInputSchema,
    outputSchema: PrayerCircleSuggestionOutputSchema,
  },
  async (input) => {
    
    const prompt = ai.definePrompt({
      name: 'prayerCircleSuggestionPrompt',
      input: { schema: PrayerCircleSuggestionInputSchema },
      output: { schema: PrayerCircleSuggestionOutputSchema },
      system: `You are a compassionate and wise Bible scholar. Your task is to suggest 3 relevant Bible verses for a prayer request. For each verse, provide the reference, the full text, and a short, empathetic justification explaining why it's a good choice for the user's situation. Respond in Brazilian Portuguese.`,
      prompt: `O pedido de oração tem o título "{{title}}" e a seguinte descrição: "{{description}}". Sugira 3 versículos com base nisso.`,
    });

    const { output } = await prompt(input);

    if (!output) {
      throw new Error('A IA não conseguiu gerar sugestões. Tente novamente.');
    }

    return output;
  }
);
