'use server';

/**
 * @fileOverview Processes a user's prayer and generates a devotional reflection.
 *
 * - processPrayer - A function that finds relevant verses and generates a reflection.
 */

import { ai, getModel } from '../genkit';
import type { ProcessPrayerInput, ProcessPrayerOutput } from '@/lib/types';
import { ProcessPrayerInputSchema, ProcessPrayerOutputSchema } from '@/lib/types';

export async function processPrayer(input: ProcessPrayerInput): Promise<ProcessPrayerOutput> {
  return processPrayerFlow(input);
}

const processPrayerFlow = ai.defineFlow(
  {
    name: 'processPrayerFlow',
    inputSchema: ProcessPrayerInputSchema,
    outputSchema: ProcessPrayerOutputSchema,
  },
  async (prompt) => {
    // In a real application, this would involve a semantic search
    // to find relevant verses. For now, we use a static set.
    const bible_verses = [
      "Filipenses 4:6-7 - Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, e com ação de graças, apresentem seus pedidos a Deus. E a paz de Deus, que excede todo o entendimento, guardará os seus corações e as suas mentes em Cristo Jesus.",
      "Mateus 7:7 - Peçam, e lhes será dado; busquem, e encontrarão; batam, e a porta lhes será aberta.",
      "1 João 5:14 - Esta é a confiança que temos ao nos aproximarmos de Deus: se pedirmos alguma coisa de acordo com a vontade de Deus, ele nos ouve."
    ];

    const llmResponse = await ai.generate({
      prompt: `Você é um servo humilde que reflete sobre a oração de um fiel usando exclusivamente a sabedoria da Palavra de Deus. Sua resposta NÃO é a voz de Deus, mas um eco de Suas promessas e ensinamentos encontrados nas Escrituras. Sua tarefa é trazer conforto e esperança, sempre apontando para Cristo. 
      Comece sua resposta com uma frase de acolhimento (ex: 'Amado(a) irmão(ã), que a paz de Cristo esteja com você. Ao ouvir sua oração...'). 
      Use os versículos fornecidos para construir sua reflexão.
      Termine com uma bênção curta (ex: 'Que o Senhor te abençoe e te guarde.').

      Oração do usuário: "${prompt.prayerText}"

      Versículos para usar como base:
      ${bible_verses.join('\n')}
      `,
      model: getModel(),
      config: {
        temperature: 0.6,
      },
    });

    const responseText = llmResponse.text;
    
    // Simple verse extraction for citation.
    const citedVerses = bible_verses
      .map(v => v.split(' - ')[0])
      .filter(ref => responseText.includes(ref));

    return {
      responseText,
      citedVerses,
    };
  }
);
