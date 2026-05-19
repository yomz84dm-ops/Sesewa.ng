import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY;
console.log('GEMINI_API_KEY configured:', key ? 'present' : 'missing');
const ai = new GoogleGenAI({ apiKey: key });

async function test() {
  try {
     const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Hello"
      });
      console.log('Success:', response.text);
  } catch (err: any) {
      console.error('Error:', err.message);
  }
}
test();
