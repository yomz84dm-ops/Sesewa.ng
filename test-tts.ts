import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();
const key = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: key });

async function test() {
  try {
     const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Say cheerfully: Hello world` }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
        }
      });
      console.log('Success:', !!response);
  } catch (err: any) {
      console.error('Error:', err.message);
  }
}
test();
