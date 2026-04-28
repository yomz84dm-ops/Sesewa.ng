import { GoogleGenAI, Type, Modality } from "@google/genai";

const getAPIKey = () => {
  return (
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) ||
    (import.meta as any).env?.GEMINI_API_KEY ||
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    ""
  );
};

const ai = new GoogleGenAI({ 
  apiKey: getAPIKey()
});

const translationCache: Record<string, string> = {};

export const geminiService = {
  /**
   * 1. Smart Matching & Semantic Search
   */
  async matchHandymen(query: string, handymen: any[]) {
    try {
      const prompt = `
        User Query: "${query}"
        Available Professionals:
        ${JSON.stringify(handymen.map((h: any) => ({ id: h.id, name: h.name, category: h.category, description: h.description })))}
        Identify the top 3 most relevant professionals. Return only their IDs in a JSON array.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      return JSON.parse(response.text || "[]");
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
      const prompt = `
        The user wants to request a handyman service with this initial description: "${initialDescription}"
        Act as a helpful assistant. If the description is vague, ask 2-3 clarifying questions.
        If it's good, provide a professional detailed version.
        Return ONLY valid JSON: {"isRefined": boolean, "content": string}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
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
      return JSON.parse(response.text || "null");
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
      const prompt = `Summarize these reviews into 3 concise sentences: ${JSON.stringify(reviews.map((r: any) => r.comment))}`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      return response.text || "Unable to summarize.";
    } catch (error) {
      console.error("Review Summarization Error:", error);
      return "Unable to summarize reviews.";
    }
  },

  /**
   * 4. Image Analysis (Multimodal)
   */
  async analyzeIssueImage(base64Image: string, mimeType: string) {
    try {
      const prompt = "Analyze this image of a household problem. What is the likely issue and what category of professional (e.g., Plumber, Electrician, Carpenter) is best suited to fix it? Provide a brief explanation.";

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: base64Image, mimeType } },
              { text: prompt }
            ]
          }
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
      return JSON.parse(response.text || "null");
    } catch (error) {
      console.error("Image Analysis Error:", error);
      return null;
    }
  },

  /**
   * 5. HandyPadi Chat (General Help)
   */
  async handyPadiChat(message: string, history: any[] = [], currentLanguage: string = 'English') {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history.map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          })),
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: `You are HandyPadi, the AI assistant for Ṣe Ṣe Wá, a handyman marketplace in Nigeria. 
            The user's preferred language is ${currentLanguage}. 
            Respond in ${currentLanguage} if possible, or use a natural mix of English and ${currentLanguage} (like Pidgin) if appropriate.
            Help users find pros, explain the escrow system, and answer general questions about the platform. 
            Be helpful, professional, and concise.`
        }
      });
      return response.text || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("HandyPadi Error:", error);
      return "I'm having trouble connecting to the HandyPadi AI right now. Please try again later.";
    }
  },

  /**
   * 6. Localization/Translation Helper
   */
  async translateText(text: string, targetLanguage: string) {
    if (!text) return "";
    const langLower = targetLanguage.toLowerCase();
    if (langLower === 'english' || langLower === 'en') return text;
    
    const cacheKey = `${text}_${targetLanguage}`;
    if (translationCache[cacheKey]) return translationCache[cacheKey];

    try {
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
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      const resultText = response.text || text;
      translationCache[cacheKey] = resultText;
      return resultText;
    } catch (error) {
      console.error("Translation Error:", error);
      return text;
    }
  },

  async speakWelcome(language: string) {
    try {
      const welcomeText = `Welcome to Ṣe Ṣe Wá HandyPadi, your trusted partner for all home services in Nigeria. How can we help you today?`;
      let translatedText = await geminiService.translateText(welcomeText, language);
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: translatedText }] }],
        config: {
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are HandyPadi, the AI assistant for Ṣe Ṣe Wá, a handyman marketplace in Nigeria.`
        }
      });

      const audioData = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      return audioData || null;
    } catch (error) {
      console.error("Voice Welcome Error:", error);
      return null;
    }
  }
};
;
