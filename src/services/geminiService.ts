import { GoogleGenAI, Type, Modality } from "@google/genai";

const getAi = () => {
  const key = process.env.GEMINI_API_KEY || "";
  if (!key || key.trim().length < 5) {
    console.warn("AI Service: GEMINI_API_KEY is missing or invalid.");
    return null;
  }
  return new GoogleGenAI({ apiKey: key.trim() });
};

const PREVIEW_TEXT_MODEL = "gemini-3-flash-preview";
const PREVIEW_TTS_MODEL = "gemini-3.1-flash-tts-preview";

const translationCache: Record<string, string> = {};

export const geminiService = {
  /**
   * 1. Smart Matching & Semantic Search
   */
  async matchHandymen(query: string, handymen: any[]) {
    try {
      const ai = getAi();
      if (!ai) return [];
      
      const prompt = `
        User Query: "${query}"
        Available Professionals:
        ${JSON.stringify(handymen.map(h => ({ id: h.id, name: h.name, category: h.category, description: h.description })))}
        Identify the top 3 most relevant professionals. Return only their IDs in a JSON array.
      `;

      const response = await ai.models.generateContent({
        model: PREVIEW_TEXT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      
      const text = response.text;
      if (!text) return [];
      return JSON.parse(text);
    } catch (error) {
      console.error("Smart Matching Error:", error);
      return [];
    }
  },

  /**
   * 2. Job Description Assistant
   */
  async refineJobDescription(initialDescription: string) {
    try {
      const ai = getAi();
      if (!ai) return null;

      const prompt = `
        The user wants to request a handyman service with this initial description: "${initialDescription}"
        Act as a helpful assistant. If the description is vague, ask 2-3 clarifying questions.
        If it's good, provide a professional detailed version.
        Return ONLY valid JSON: {"isRefined": boolean, "content": string}
      `;

      const response = await ai.models.generateContent({
        model: PREVIEW_TEXT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isRefined: { type: Type.BOOLEAN },
              content: { type: Type.STRING }
            },
            required: ["isRefined", "content"]
          }
        }
      });
      
      const text = response.text;
      if (!text) return null;
      return JSON.parse(text);
    } catch (error) {
      console.error("Refine Description Error:", error);
      return null;
    }
  },

  /**
   * 3. Review Summarization
   */
  async summarizeReviews(reviews: any[]) {
    if (reviews.length === 0) return "No reviews yet to summarize.";
    try {
      const ai = getAi();
      if (!ai) return "AI not initialized";

      const prompt = `Summarize these reviews into 3 concise sentences: ${JSON.stringify(reviews.map(r => r.comment))}`;
      const response = await ai.models.generateContent({
        model: PREVIEW_TEXT_MODEL,
        contents: prompt
      });
      return response.text;
    } catch (error) {
      console.error("Review Summarization Error:", error);
      return "Unable to summarize reviews.";
    }
  },

  /**
   * 4. Image-based Issue Identification
   */
  async analyzeIssueImage(base64Image: string, mimeType: string) {
    try {
      const ai = getAi();
      if (!ai) return null;

      const prompt = "Analyze this image of a household problem. What is the likely issue and what category of professional (e.g., Plumber, Electrician, Carpenter) is best suited to fix it? Provide a brief explanation.";

      const response = await ai.models.generateContent({
        model: PREVIEW_TEXT_MODEL,
        contents: [
          { inlineData: { data: base64Image, mimeType } },
          { text: prompt }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              issue: { type: Type.STRING },
              suggestedCategory: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["issue", "suggestedCategory", "explanation"]
          }
        }
      });
      
      const text = response.text;
      if (!text) return null;
      return JSON.parse(text);
    } catch (error) {
      console.error("Image Analysis Error:", error);
      return null;
    }
  },

  /**
   * 5. HandyPadi Conversational AI
   */
  async handyPadiChat(message: string, history: any[] = [], currentLanguage: string = 'English') {
    try {
      const ai = getAi();
      if (!ai) return "I'm currently offline. Please ensure your GEMINI_API_KEY is configured in Settings.";

      const formattedHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const chat = ai.chats.create({
        model: PREVIEW_TEXT_MODEL,
        history: formattedHistory,
        config: {
          systemInstruction: `You are HandyPadi, the AI assistant for Ṣe Ṣe Wá, a handyman marketplace in Nigeria. 
          The user's preferred language is ${currentLanguage}. 
          Respond in ${currentLanguage} if possible, or use a natural mix of English and ${currentLanguage} (like Pidgin) if appropriate.
          Help users find pros, explain the escrow system, and answer general questions about the platform. 
          Be helpful, professional, and concise.`
        }
      });

      const response = await chat.sendMessage({ message });
      return response.text;
    } catch (error) {
      console.error("HandyPadi Error:", error);
      return "I'm having trouble connecting right now. (Error: " + (error instanceof Error ? error.message : 'Unknown') + ")";
    }
  },

  /**
   * 6. Real-time Translation
   */
  async translateText(text: string, targetLanguage: string): Promise<string> {
    if (!text) return "";
    const langLower = targetLanguage.toLowerCase();
    if (langLower === 'english' || langLower === 'en') return text;
    
    const cacheKey = `${text}:${langLower}`;
    if (translationCache[cacheKey]) return translationCache[cacheKey];

    try {
      const ai = getAi();
      if (!ai) return text;

      let prompt = "";
      if (langLower === 'pidgin') {
        prompt = `You are a professional translator specializing in Nigerian Pidgin English. 
        Translate the following message into natural, widely-understood Nigerian Pidgin.
        Maintain the helpful and friendly tone of the original brand.
        
        Original English: "${text}"
        
        Return ONLY the translated Pidgin text. Do not include any quotes, notes, or explanations.`;
      } else {
        prompt = `You are a professional translator. 
        Translate the following text into ${targetLanguage}. 
        Return ONLY the translated text. Do not include quotes, notes, or any other text.
        
        Text to translate: "${text}"`;
      }

      const response = await ai.models.generateContent({
        model: PREVIEW_TEXT_MODEL,
        contents: prompt
      });
      
      const result = response.text?.trim() || text;
      translationCache[cacheKey] = result;
      return result;
    } catch (error) {
      console.error("Translation Error:", error);
      return text;
    }
  },

  /**
   * 7. Voice Welcome (TTS)
   */
  async speakWelcome(language: string) {
    try {
      const ai = getAi();
      if (!ai) return null;

      const welcomeText = `Welcome to Ṣe Ṣe Wá HandyPadi, your trusted partner for all home services in Nigeria. How can we help you today?`;
      let translatedText = welcomeText;

      const langLower = language.toLowerCase();
      if (langLower !== 'en' && langLower !== 'english') {
        // Call the property directly on the object instead of using 'this' to avoid binding issues
        translatedText = await geminiService.translateText(welcomeText, language);
      }

      // If translation failed or returned empty, fallback to original
      if (!translatedText || translatedText.trim().length === 0) {
        console.warn("Translation returned empty, falling back to original English");
        translatedText = welcomeText;
      }

      console.log(`TTS Welcome for ${language}: "${translatedText}"`);

      // Simplified prompt for TTS - focus on the text to be spoken
      const response = await ai.models.generateContent({
        model: PREVIEW_TTS_MODEL,
        contents: [{ parts: [{ text: translatedText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioData) {
        console.warn("TTS model returned no audio data part");
      }
      return audioData;
    } catch (error) {
      console.error("Voice Welcome Error:", error);
      return null;
    }
  }
};
