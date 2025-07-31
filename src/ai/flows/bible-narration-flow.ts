
'use server';

/**
 * @fileOverview Generates audio narration for a given bible chapter.
 *
 * - narrateChapter - A function that generates the audio.
 */

import { ai, getModel } from '../genkit';
import { z } from 'zod';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

const NarrationInputSchema = z.object({
  textToNarrate: z.string().describe('The full text of the Bible chapter to be narrated.'),
  model: z.string().optional().describe("The AI model to use, e.g. 'gemini-1.5-pro'."),
  language: z.string().optional().describe('The language code for the response (e.g., "pt", "en").'),
});

const NarrationOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio as a base64 encoded data URI.'),
});

export type NarrateChapterInput = z.infer<typeof NarrationInputSchema>;
export type NarrateChapterOutput = z.infer<typeof NarrationOutputSchema>;

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

export async function narrateChapter(input: NarrateChapterInput): Promise<NarrationOutputSchema> {
  const narrationFlow = ai.defineFlow(
    {
      name: 'narrateChapterFlow',
      inputSchema: NarrationInputSchema,
      outputSchema: NarrationOutputSchema,
    },
    async (flowInput) => {
      const { media } = await ai.generate({
        model: googleAI.model('tts-1'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: flowInput.textToNarrate,
      });

      if (!media?.url) {
        throw new Error('No media returned from the TTS model.');
      }

      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );

      const wavBase64 = await toWav(audioBuffer);

      return {
        audioDataUri: 'data:audio/wav;base64,' + wavBase64,
      };
    }
  );
  
  return narrationFlow(input);
}
