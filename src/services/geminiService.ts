import { GoogleGenAI, Type, Modality } from "@google/genai";

const getAi = () => {
  const key = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || import.meta.env.VITE_GEMINI_API_KEY || '';
  return new GoogleGenAI({ apiKey: key });
};

export const geminiService = {
  /**
   * 1. Smart Matching & Semantic Search
   * Matches a user's natural language query against a list of handymen.
   */
  async matchHandymen(query: string, handymen: any[]) {
    const ai = getAi();
    const model = "gemini-3-flash-preview";
    const prompt = `
      User Query: "${query}"
      
      Available Professionals:
      ${JSON.stringify(handymen.map(h => ({ id: h.id, name: h.name, category: h.category, description: h.description })))}
      
      Based on the user's query, identify the top 3 most relevant professionals. 
      Return only their IDs in a JSON array.
    `;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
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
   * Helps a user refine their job description based on initial input.
   */
  async refineJobDescription(initialDescription: string) {
    const ai = getAi();
    const model = "gemini-3-flash-preview";
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

    try {
      const response = await ai.models.generateContent({
        model,
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
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Refine Description Error:", error);
      return null;
    }
  },

  /**
   * 3. Review Summarization
   * Summarizes reviews for a specific professional.
   */
  async summarizeReviews(reviews: any[]) {
    if (reviews.length === 0) return "No reviews yet to summarize.";
    
    const ai = getAi();
    const model = "gemini-3-flash-preview";
    const prompt = `
      Summarize the following reviews for a professional handyman into a concise "Pro Insights" paragraph (max 3 sentences). 
      Focus on consistent strengths and any recurring issues mentioned.
      
      Reviews:
      ${JSON.stringify(reviews.map(r => r.comment))}
    `;

    try {
      const response = await ai.models.generateContent({
        model,
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
   * Analyzes an image to identify the problem and suggest a category.
   */
  async analyzeIssueImage(base64Image: string, mimeType: string) {
    const ai = getAi();
    const model = "gemini-3-flash-preview";
    const prompt = "Analyze this image of a household problem. What is the likely issue and what category of professional (e.g., Plumber, Electrician, Carpenter) is best suited to fix it? Provide a brief explanation.";

    try {
      const response = await ai.models.generateContent({
        model,
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
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Image Analysis Error:", error);
      return null;
    }
  },

  /**
   * 5. Automated Chat Support (HandyPadi)
   * General Q&A about the platform.
   */
  async handyPadiChat(message: string, history: any[], currentLanguage: string = 'English') {
    const ai = getAi();
    const model = "gemini-3-flash-preview";
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction: `You are HandyPadi, the AI assistant for Ṣe Ṣe Wá, a handyman marketplace in Nigeria. 
        The user's preferred language is ${currentLanguage}. 
        Respond in ${currentLanguage} if possible, or use a natural mix of English and ${currentLanguage} (like Pidgin) if appropriate.
        Help users find pros, explain the escrow system, and answer general questions about the platform. 
        Be helpful, professional, and concise.`
      }
    });

    try {
      const response = await chat.sendMessage({ message });
      return response.text;
    } catch (error) {
      console.error("HandyPadi Error:", error);
      return "I'm having trouble connecting right now. Please try again later.";
    }
  },

  /**
   * 6. Real-time Translation
   * Translates text into the target language.
   */
  async translateText(text: string, targetLanguage: string) {
    const ai = getAi();
    const model = "gemini-3-flash-preview";
    const prompt = `Translate the following text into ${targetLanguage}. 
    Maintain the original tone and intent. If the text is already in ${targetLanguage}, return it as is.
    
    Text: "${text}"
    
    Return only the translated text.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      return response.text;
    } catch (error) {
      console.error("Translation Error:", error);
      return text;
    }
  },

  /**
   * 7. Voice Welcome (TTS)
   * Generates a voice welcome message in the target language.
   */
  async speakWelcome(language: string) {
    const ai = getAi();
    const ttsModel = "gemini-2.5-flash-preview-tts";
    const translationModel = "gemini-3-flash-preview";
    
    const originalText = `Welcome to Ṣe Ṣe Wá HandyPadi, your trusted partner for all home services in Nigeria. How can we help you today?`;
    
    try {
      // Step 1: Translate the text first using a text model with a more forceful prompt
      const translationPrompt = `You are a professional translator. Translate the following message into the ${language} language. 
      IMPORTANT: 
      1. Do NOT return English. 
      2. Keep the brand name "Ṣe Ṣe Wá HandyPadi" exactly as it is.
      3. Translate all other words into natural, spoken ${language}.
      4. Return ONLY the translated text.
      
      Message to translate: "${originalText}"`;
      
      const translationResponse = await ai.models.generateContent({
        model: translationModel,
        contents: translationPrompt
      });
      
      const translatedText = translationResponse.text?.trim() || originalText;
      console.log(`Translated welcome message for ${language}:`, translatedText);

      // Step 2: Use the translated text for TTS with a more natural voice
      const response = await ai.models.generateContent({
        model: ttsModel,
        contents: [{ parts: [{ text: `Say this cheerfully and naturally: ${translatedText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' }, // Zephyr is often more natural
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
