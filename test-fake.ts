import { GoogleGenAI } from '@google/genai';
try {
  const ai = new GoogleGenAI({ apiKey: 'fake_key_1234567890_that_is_bad_abcdef' });
  ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'Hi' }).then(console.log).catch((e: any) => console.log('Runtime Error:', e.message));
} catch(e: any) {
  console.log('Init Error:', e.message);
}
