import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: key });

async function test() {
  try {
     const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Hello"
      });
      console.log('gemini-3-flash-preview Success:', response.text);
  } catch (err: any) {
      console.error('gemini-3-flash-preview Error:', err.message);
  }
}
test();
