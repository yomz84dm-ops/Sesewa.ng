import axios from "axios";

// Audio cache to save credits and improve responsiveness
const audioCache: Record<string, string> = {};

const WELCOME_MESSAGES: Record<string, string> = {
  'English': "Welcome! I am Ṣe Ṣe Wá HandyPadi. How can I help you find the right pro today?",
  'Yoruba': "E nle o! Emi ni Ṣe Ṣe Wá HandyPadi. Báwo ni mo ṣe le ràn yín lọ́wọ́ láti rí òṣìṣẹ́ tó tọ́ lónìí?",
  'Igbo': "Nnọọ! Abụ m Ṣe Ṣe Wá HandyPadi. Kedu otu m ga-esi nyere gị aka ịchọta ezigbo ọkachamara taa?",
  'Hausa': "Sannu da zuwa! Ni ne Ṣe Ṣe Wá HandyPadi. Ta yaya zan iya taimaka muku samun ƙwararren ma'aikaci a yau?",
  'Pidgin': "Wetin dey hapun! I be Ṣe Ṣe Wá HandyPadi. How I fit help you find correct person to do your work today?"
};

export const geminiService = {
  /**
   * Match a user's query against a list of handyman profiles
   */
  async matchHandymen(query: string, handymen: any[]) {
    try {
      const prompt = `
        User Query: "${query}"
        
        List of professionals: ${JSON.stringify(handymen.map(h => ({ id: h.id, category: h.category, skills: h.skills, bio: h.bio })))}
        
        Identify which professionals are the best match for the user's query. 
        Return only their IDs in a JSON array.
      `;

      const response = await axios.post("/api/ai/generate", {
        prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.data.text;
      if (!text) return [];
      try {
        // Look for JSON array in text
        const jsonMatch = text.match(/\[.*\]/s);
        return JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        console.error("JSON Parse Error in matchHandymen:", text);
        return [];
      }
    } catch (error) {
      console.error("Handyman Matching error:", error);
      return [];
    }
  },

  /**
   * Refine a messy job description into a structured one
   */
  async refineJobDescription(initialDescription: string) {
    try {
      const prompt = `
        The user wants to request a handyman service with this initial description: "${initialDescription}"
        
        Refine this into a structured task summary. Identify:
        1. The core service category (e.g., Plumbing, Electrical, Carpentry, Cleaning, Painting)
        2. A punchy, clear title
        3. A detailed, professional description
        
        Return as JSON with keys: category, title, refinedDescription.
      `;

      const response = await axios.post("/api/ai/generate", {
        prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.data.text;
      if (!text) return null;
      try {
        const jsonMatch = text.match(/\{.*\}/s);
        return JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        console.error("JSON Parse Error in refineJobDescription:", text);
        return null;
      }
    } catch (error) {
      console.error("Job Refinement error:", error);
      return null;
    }
  },

  /**
   * Generate "Pro Insights" from reviews
   */
  async summarizeReviews(reviews: any[]) {
    if (reviews.length === 0) return "No reviews yet to summarize.";
    
    try {
      const prompt = `
        Summarize the following reviews for a professional handyman into a concise "Pro Insights" paragraph (max 3 sentences). 
        Focus on consistent strengths and any recurring issues mentioned.
        
        Reviews:
        ${JSON.stringify(reviews.map(r => r.comment))}
      `;

      const response = await axios.post("/api/ai/generate", { prompt });
      return response.data.text;
    } catch (error) {
      console.error("Review Summarization Error:", error);
      return "Unable to summarize reviews at this time.";
    }
  },

  /**
   * Analyze an image of a household issue
   */
  async analyzeIssueImage(base64Image: string, mimeType: string) {
    try {
      const prompt = "Analyze this image of a household problem. What is the likely issue and what category of professional (e.g., Plumber, Electrician, Carpenter) is best suited to fix it? Provide a brief explanation.";

      const response = await axios.post("/api/ai/generate", {
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.data.text;
      if (!text) return null;
      try {
        const jsonMatch = text.match(/\{.*\}/s);
        return JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        console.error("JSON Parse Error in analyzeIssueImage:", text);
        return null;
      }
    } catch (error) {
      console.error("Image Analysis error:", error);
      return null;
    }
  },

  /**
   * HandyPadi Chat Assistant
   */
  async handyPadiChat(message: string, history: any[] = [], currentLanguage: string = 'English') {
    try {
      const response = await axios.post("/api/ai/chat", {
        message,
        history: history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        })),
        systemInstruction: `You are HandyPadi, the AI assistant for Ṣe Ṣe Wá, a handyman marketplace in Nigeria. 
          The user's preferred language is ${currentLanguage}. 
          Respond in ${currentLanguage} if possible, or use a natural mix of English and ${currentLanguage} (like Pidgin) if appropriate.
          Help users find pros, explain the escrow system, and answer general questions about the platform. 
          Be helpful, professional, and concise.`
      });
      return response.data.text;
    } catch (error) {
      console.error("HandyPadi Error:", error);
      return "I'm having trouble connecting right now. (Error: " + (error instanceof Error ? error.message : 'Unknown') + ")";
    }
  },

  /**
   * Multi-lingual Translation
   */
  async translateText(text: string, targetLanguage: string) {
    try {
      const prompt = `Translate the following text into ${targetLanguage}. 
      Maintain the original tone and intent. If the text is already in ${targetLanguage}, return it as is.
      
      Text: "${text}"
      
      Return only the translated text.`;

      const response = await axios.post("/api/ai/generate", { prompt });
      return response.data.text || text;
    } catch (error) {
      console.error("Translation Error:", error);
      return text;
    }
  },

  /**
   * Get voice introduction in preferred language
   */
  async getVoiceIntro(language: string) {
    if (audioCache[language]) return audioCache[language];

    try {
      const originalText = WELCOME_MESSAGES['English'];
      let translatedText = WELCOME_MESSAGES[language];
      
      if (!translatedText) {
        const translationPrompt = `Translate into ${language}. Keep brand "Ṣe Ṣe Wá HandyPadi". Return only translation: "${originalText}"`;
        const translationResponse = await axios.post("/api/ai/generate", { prompt: translationPrompt });
        translatedText = translationResponse.data.text?.trim() || originalText;
      }

      const response = await axios.post("/api/ai/speak", {
        text: `Say this cheerfully and naturally: ${translatedText}`
      });

      const base64Audio = response.data.audio;
      if (base64Audio) {
        audioCache[language] = base64Audio;
      }
      return base64Audio;
    } catch (error) {
      console.error("TTS Intro Error:", error);
      return null;
    }
  }
};
