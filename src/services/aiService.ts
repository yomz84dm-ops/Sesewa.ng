import { GoogleGenAI, Type } from "@google/genai";

// Standard initialization - using a safe accessor for Vite
const getApiKey = () => {
  try {
    // @ts-ignore - process.env might be defined by Vite 'define'
    return process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "";
  } catch (e) {
    return import.meta.env.VITE_GEMINI_API_KEY || "";
  }
};

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    const key = getApiKey();
    if (!key) {
      console.warn("GEMINI_API_KEY is not configured. AI features will be disabled.");
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
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
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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

  return JSON.parse(response.text);
}
