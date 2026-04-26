import { GoogleGenAI, Type } from "@google/genai";

export interface PriceEstimation {
  minPrice: number;
  maxPrice: number;
  currency: string;
  reasoning: string;
  factors: string[];
  partsNeeded?: string[];
  marketNotes: string;
}

const getAi = () => {
  const key = process.env.GEMINI_API_KEY || "";
  if (!key || key.trim().length < 5) {
    console.warn("AI Service: GEMINI_API_KEY is missing or invalid.");
    return null;
  }
  return new GoogleGenAI({ apiKey: key.trim() });
};

const PREVIEW_TEXT_MODEL = "gemini-3-flash-preview";

export async function getPriceEstimation(
  task: string,
  location: string,
  country: string = "Nigeria",
  currency: string = "NGN",
  language: string = "English"
): Promise<PriceEstimation> {
  try {
    const ai = getAi();
    if (!ai) throw new Error("AI Service not configured.");

    const prompt = `
      You are the Global Ṣe Ṣe Wá Pricing Expert for the Pan-African Handyman Marketplace.
      Analyze the following task: "${task}" in the location: "${location}, ${country}".
      Provide a fair market price range in ${currency}.
      - Account for the specific cost of living, logistics, and supply chain in "${location}, ${country}".
      - Provide reasoning in "${language}".
    `;

    const response = await ai.models.generateContent({
      model: PREVIEW_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            minPrice: { type: Type.INTEGER },
            maxPrice: { type: Type.INTEGER },
            currency: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            factors: { type: Type.ARRAY, items: { type: Type.STRING } },
            partsNeeded: { type: Type.ARRAY, items: { type: Type.STRING } },
            marketNotes: { type: Type.STRING }
          },
          required: ["minPrice", "maxPrice", "currency", "reasoning", "factors", "marketNotes"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI returned empty response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Price Estimation Error:", error);
    throw error;
  }
}
