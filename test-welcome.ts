import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: 'Say cheerfully: Hello!' }] }],
        config: {
          responseModalities: ["AUDIO" as Modality],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        }
      });
      console.log("Success! Has audio:", !!response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data);
  } catch (err: any) {
    console.error("Failed:", err.message, err);
  }
}
test();
