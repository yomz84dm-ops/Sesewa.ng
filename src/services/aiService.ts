import { GoogleGenAI, Type } from "@google/genai";

// Standard initialization - using a safe accessor for Vite
const getApiKey = () => {
  // In the AI Studio environment, process.env.GEMINI_API_KEY is the standard way to access the key.
  // Vite's 'define' in vite.config.ts should make this available.
  return process.env.GEMINI_API_KEY || "";
};

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    const key = getApiKey();
    if (!key || key.trim().length < 5) {
      console.warn("GEMINI_API_KEY is not configured or invalid. AI features will be disabled.");
      return null;
    }
    try {
      aiInstance = new GoogleGenAI({ apiKey: key.trim() });
    } catch (e) {
      console.error("AI Service: Failed to initialize GoogleGenAI", e);
      return null;
    }
  }
  return aiInstance;
};

export interface PriceEstimation {
  minPrice: number;
  maxPrice: number;
  currency: string;
  reasoning: string;
  factors: string[];
  partsNeeded: string[];
  marketNotes: string;
}

const PREVIEW_TEXT_MODEL = "gemini-3-flash-preview";

export async function getPriceEstimation(
  task: string,
  location: string,
  country: string = "Nigeria",
  currency: string = "NGN",
  language: string = "English"
): Promise<PriceEstimation> {
  const prompt = `
    You are the Global Ṣe Ṣe Wá Pricing Expert for the Pan-African Handyman Marketplace.
    Analyze the following task: "${task}" in the location: "${location}, ${country}".
    Provide a fair market price range in ${currency}.
    
    IMPORTANT CONTEXT:
    - Account for the specific cost of living, logistics, and supply chain in "${location}, ${country}".
    - Account for local inflation and the typical availability of parts in that specific region.
    - Provide reasoning in "${language}".
    - The goal is to provide a baseline for fair negotiation between local professionals and customers.
    - Market Notes should be tailored to the business environment of ${country}.
`;

  const ai = getAI();
  if (!ai) {
    throw new Error("AI service is not initialized. Please check your GEMINI_API_KEY.");
  }

  const response = await ai.models.generateContent({
    model: PREVIEW_TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          minPrice: { type: Type.INTEGER, description: "Lower bound of the fair price range" },
          maxPrice: { type: Type.INTEGER, description: "Upper bound of the fair price range" },
          currency: { type: Type.STRING, description: "Currency code, always NGN" },
          reasoning: { type: Type.STRING, description: "Brief explanation of how the range was determined" },
          factors: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of things that could move the price up (e.g. emergency, special tools)" 
          },
          partsNeeded: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Common replacement parts needed for this task" 
          },
          marketNotes: { type: Type.STRING, description: "A disclaimer about expert premiums and market variations" }
        },
        required: ["minPrice", "maxPrice", "currency", "reasoning", "factors", "marketNotes"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("AI returned an empty response.");
  }
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("AI Service: Failed to parse JSON response", text);
    // Fallback: try to find JSON in the text if it's not pure JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("AI returned invalid JSON format.");
  }
}
