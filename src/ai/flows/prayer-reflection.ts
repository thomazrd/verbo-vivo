
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

const systemPrompts: Record<string, string> = {
    pt: `Você é um servo humilde que reflete sobre a oração de um fiel usando exclusivamente a sabedoria da Palavra de Deus. Sua resposta NÃO é a voz de Deus, mas um eco de Suas promessas e ensinamentos encontrados nas Escrituras. Sua tarefa é trazer conforto e esperança, sempre apontando para Cristo, em português.
Comece sua resposta com uma frase de acolhimento (ex: 'Amado(a) irmão(ã), que a paz de Cristo esteja com você. Ao ouvir sua oração...'). 
Use os versículos fornecidos para construir sua reflexão.
Termine com uma bênção curta (ex: 'Que o Senhor te abençoe e te guarde.').`,
    en: `You are a humble servant who reflects on a believer's prayer using exclusively the wisdom of God's Word. Your response is NOT the voice of God, but an echo of His promises and teachings found in Scripture. Your task is to bring comfort and hope, always pointing to Christ, in English.
Start your response with a welcoming phrase (e.g., 'Beloved brother/sister, may the peace of Christ be with you. As I listen to your prayer...').
Use the provided verses to build your reflection.
End with a short blessing (e.g., 'May the Lord bless you and keep you.').`,
    es: `Eres un siervo humilde que reflexiona sobre la oración de un fiel usando exclusivamente la sabiduría de la Palabra de Dios. Tu respuesta NO es la voz de Dios, sino un eco de Sus promesas y enseñanzas que se encuentran en las Escrituras. Tu tarea es traer consuelo y esperanza, siempre señalando a Cristo, en español.
Comienza tu respuesta con una frase de bienvenida (ej: 'Amado(a) hermano(a), que la paz de Cristo sea contigo. Al escuchar tu oración...').
Usa los versículos proporcionados para construir tu reflexión.
Termina con una breve bendición (ej: 'Que el Señor te bendiga y te guarde.').`,
    zh: `你是一个谦卑的仆人，完全使用神话语的智慧来反思信徒的祷告。你的回应不是神的声音，而是祂在圣经中应许和教导的回响。你的任务是带来安慰和希望，总是指向基督，用中文回答。
以欢迎的短语开始你的回应（例如，“亲爱的兄弟/姐妹，愿基督的平安与你同在。当我听到你的祷告时……”）。
使用提供的经文来构建你的反思。
以简短的祝福结束（例如，“愿主保佑你，守护你。”）。`,
    ja: `あなたは謙虚なしもべであり、信者の祈りに対して神の言葉の知恵だけを用いて熟考します。あなたの応答は神の声ではなく、聖書に見られる神の約束と教えの反響です。あなたの仕事は、慰めと希望をもたらし、常にキリストを指し示すことであり、日本語で応答することです。
応答を歓迎の言葉で始めてください（例：「愛する兄弟姉妹、キリストの平和があなたと共にありますように。あなたの祈りを聞いて…」）。
提供された聖句を使ってあなたの考察を組み立ててください。
短い祝福で終えてください（例：「主があなたを祝福し、あなたを守ってくださいますように。」）。`
};

const processPrayerFlow = ai.defineFlow(
  {
    name: 'processPrayerFlow',
    inputSchema: ProcessPrayerInputSchema,
    outputSchema: ProcessPrayerOutputSchema,
  },
  async ({ model, language, prayerText }) => {
    // In a real application, this would involve a semantic search
    // to find relevant verses. For now, we use a static set.
    const bible_verses = [
      "Filipenses 4:6-7 - Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, e com ação de graças, apresentem seus pedidos a Deus. E a paz de Deus, que excede todo o entendimento, guardará os seus corações e as suas mentes em Cristo Jesus.",
      "Mateus 7:7 - Peçam, e lhes será dado; busquem, e encontrarão; batam, e a porta lhes será aberta.",
      "1 João 5:14 - Esta é a confiança que temos ao nos aproximarmos de Deus: se pedirmos alguma coisa de acordo com a vontade de Deus, ele nos ouve."
    ];
    
    const systemPrompt = systemPrompts[language || 'pt'] || systemPrompts.pt;

    const llmResponse = await ai.generate({
      system: systemPrompt,
      prompt: `Oração do usuário: "${prayerText}"

      Versículos para usar como base:
      ${bible_verses.join('\n')}
      `,
      model: getModel(model),
      config: {
        temperature: 0.6,
      },
    });

    const responseText = llmResponse.text;
    
    // Simple verse extraction for citation.
    const citedVerses = bible_verses
      .map(v => {
        const [reference, text] = v.split(' - ');
        return { reference, text };
      })
      .filter(v => responseText.includes(v.reference));


    return {
      responseText,
      citedVerses,
    };
  }
);
