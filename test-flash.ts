import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: 'Hello!' }] }],
        config: {}
      });
      console.log("Success! Has text:", !!response.text);
  } catch (err: any) {
    console.error("Failed:", err.message, err);
  }
}
test();
