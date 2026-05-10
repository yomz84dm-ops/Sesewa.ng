const API_URL = import.meta.env.VITE_API_URL || '/api'; 
const translationCache: Record<string, string> = {};

export const geminiService = {
  async matchHandymen(query: string, handymen: any[]) {
    try {
      const response = await fetch(`${API_URL}/ai/match-handymen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, handymen })
      });
      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    } catch (error) {
      console.error("Smart Matching Error:", error);
      return [];
    }
  },

  async refineJobDescription(initialDescription: string) {
    try {
      const response = await fetch(`${API_URL}/ai/refine-description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialDescription })
      });
      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    } catch (error) {
      console.error("Refine Description Error:", error);
      return null;
    }
  },

  async summarizeReviews(reviews: any[]) {
    if (reviews.length === 0) return "No reviews yet to summarize.";
    try {
      const response = await fetch(`${API_URL}/ai/summarize-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews })
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      return data.result || "Unable to summarize.";
    } catch (error) {
      console.error("Review Summarization Error:", error);
      return "Unable to summarize reviews.";
    }
  },

  async analyzeIssueImage(base64Image: string, mimeType: string) {
    try {
      const response = await fetch(`${API_URL}/ai/analyze-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image, mimeType })
      });
      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    } catch (error) {
      console.error("Image Analysis Error:", error);
      return null;
    }
  },

  async handyPadiChat(message: string, history: any[] = [], currentLanguage: string = 'English') {
    try {
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, currentLanguage })
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      return data.result || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("HandyPadi Chat Error:", error);
      return "I'm having trouble connecting to the HandyPadi AI right now. Please try again later.";
    }
  },

  async translateText(text: string, targetLanguage: string) {
    if (!text) return "";
    const langLower = targetLanguage.toLowerCase();
    if (langLower === 'english' || langLower === 'en') return text;
    
    const cacheKey = `${text}_${targetLanguage}`;
    if (translationCache[cacheKey]) return translationCache[cacheKey];

    try {
      const response = await fetch(`${API_URL}/ai/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLanguage })
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      const resultText = data.result || text;
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
      let translatedText = await this.translateText(welcomeText, language);
      
      const response = await fetch(`${API_URL}/ai/speak-welcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: translatedText })
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      return data.audioData || null;
    } catch (error) {
      console.error("Voice Welcome Error:", error);
      return null;
    }
  }
};
