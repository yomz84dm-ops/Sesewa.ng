import { GoogleGenAI, Type, Modality } from "@google/genai";

const getAi = () => {
  // In the AI Studio environment, process.env.GEMINI_API_KEY is the standard way to access the key.
  const key = process.env.GEMINI_API_KEY || "";
  
  if (!key || key.trim().length < 5) {
    console.warn("AI Service: GEMINI_API_KEY is missing, invalid, or empty. Current key length:", key?.length || 0);
    return null;
  }
  
  try {
    return new GoogleGenAI({ apiKey: key.trim() });
  } catch (e) {
    console.error("AI Service: Failed to initialize GoogleGenAI", e);
    return null;
  }
};

// Source of truth models from skill
const PREVIEW_TEXT_MODEL = "gemini-3-flash-preview";
const PREVIEW_TTS_MODEL = "gemini-3.1-flash-tts-preview";

export const geminiService = {
  /**
   * 1. Smart Matching & Semantic Search
   */
  async matchHandymen(query: string, handymen: any[]) {
    try {
      const ai = getAi();
      if (!ai) throw new Error("AI not initialized");
      
      const prompt = `
        User Query: "${query}"
        
        Available Professionals:
        ${JSON.stringify(handymen.map(h => ({ id: h.id, name: h.name, category: h.category, description: h.description })))}
        
        Based on the user's query, identify the top 3 most relevant professionals. 
        Return only their IDs in a JSON array.
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
      try {
        return JSON.parse(text);
      } catch (e) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      }
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
      if (!ai) throw new Error("AI not initialized");

      const prompt = `
        The user wants to request a handyman service with this initial description: "${initialDescription}"
        
        Act as a helpful assistant. If the description is vague, ask 2-3 clarifying questions to help them provide better details for the professional.
        If the description is already good, provide a more professional and detailed version of it.
        
        Return the response in JSON format:
        {
          "isRefined": boolean,
          "content": string (the refined description or the questions)
        }
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
      try {
        return JSON.parse(text);
      } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      }
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
      if (!ai) throw new Error("AI not initialized");

      const prompt = `
        Summarize the following reviews for a professional handyman into a concise "Pro Insights" paragraph (max 3 sentences). 
        Focus on consistent strengths and any recurring issues mentioned.
        
        Reviews:
        ${JSON.stringify(reviews.map(r => r.comment))}
      `;

      const response = await ai.models.generateContent({
        model: PREVIEW_TEXT_MODEL,
        contents: prompt
      });
      return response.text;
    } catch (error) {
      console.error("Review Summarization Error:", error);
      return "Unable to summarize reviews at this time.";
    }
  },

  /**
   * 4. Visual Diagnostics (Image Analysis)
   */
  async analyzeIssueImage(base64Image: string, mimeType: string) {
    try {
      const ai = getAi();
      if (!ai) throw new Error("AI not initialized");

      const prompt = "Analyze this image of a household problem. What is the likely issue and what category of professional (e.g., Plumber, Electrician, Carpenter) is best suited to fix it? Provide a brief explanation.";

      const response = await ai.models.generateContent({
        model: PREVIEW_TEXT_MODEL,
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType } },
            { text: prompt }
          ]
        },
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
      try {
        return JSON.parse(text);
      } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      }
    } catch (error) {
      console.error("Image Analysis Error:", error);
      return null;
    }
  },

  /**
   * 5. Automated Chat Support (HandyPadi)
   */
  async handyPadiChat(message: string, history: any[] = [], currentLanguage: string = 'English') {
    try {
      const ai = getAi();
      if (!ai) return "I'm currently offline. Please ensure your GEMINI_API_KEY is configured in Settings.";

      // format history for @google/genai
      const formattedHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const chat = ai.chats.create({
        model: PREVIEW_TEXT_MODEL,
        history: formattedHistory,
      });

      const response = await chat.sendMessage({ 
        message,
        config: {
          systemInstruction: `You are HandyPadi, the AI assistant for Ṣe Ṣe Wá, a handyman marketplace in Nigeria. 
          The user's preferred language is ${currentLanguage}. 
          Respond in ${currentLanguage} if possible, or use a natural mix of English and ${currentLanguage} (like Pidgin) if appropriate.
          Help users find pros, explain the escrow system, and answer general questions about the platform. 
          Be helpful, professional, and concise.`
        }
      });
      return response.text;
    } catch (error) {
      console.error("HandyPadi Error:", error);
      return "I'm having trouble connecting right now. (Error: " + (error instanceof Error ? error.message : 'Unknown') + ")";
    }
  },

  /**
   * 6. Real-time Translation
   */
  async translateText(text: string, targetLanguage: string) {
    try {
      const ai = getAi();
      if (!ai) return text;

      const prompt = `Translate the following text into ${targetLanguage}. 
      Maintain the original tone and intent. If the text is already in ${targetLanguage}, return it as is.
      
      Text: "${text}"
      
      Return only the translated text.`;

      const response = await ai.models.generateContent({
        model: PREVIEW_TEXT_MODEL,
        contents: prompt
      });
      return response.text || text;
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
      
      const originalText = `Welcome to Ṣe Ṣe Wá HandyPadi, your trusted partner for all home services in Nigeria. How can we help you today?`;
      
      // Step 1: Translate the text first
      const translationPrompt = `You are a professional translator. Translate the following message into the ${language} language. 
      IMPORTANT: 
      1. Do NOT return English. 
      2. Keep the brand name "Ṣe Ṣe Wá HandyPadi" exactly as it is.
      3. Translate all other words into natural, spoken ${language}.
      4. Return ONLY the translated text.
      
      Message to translate: "${originalText}"`;
      
      const translationResponse = await ai.models.generateContent({
        model: PREVIEW_TEXT_MODEL,
        contents: translationPrompt
      });
      
      const translatedText = translationResponse.text?.trim() || originalText;

      // Step 2: Use the translated text for TTS
      const response = await ai.models.generateContent({
        model: PREVIEW_TTS_MODEL,
        contents: [{ parts: [{ text: `Say this cheerfully and naturally: ${translatedText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return base64Audio;
    } catch (error) {
      console.error("Voice Welcome Error:", error);
      return null;
    }
  }
};
