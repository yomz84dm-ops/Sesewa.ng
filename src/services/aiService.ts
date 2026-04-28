import { Type } from "@google/genai";
import axios from "axios";

export interface PriceEstimation {
  minPrice: number;
  maxPrice: number;
  currency: string;
  reasoning: string;
  factors: string[];
  partsNeeded?: string[];
  marketNotes: string;
}

export async function getPriceEstimation(
  task: string,
  location: string,
  country: string,
  currency: string,
  language: string = "English"
): Promise<PriceEstimation> {
  try {
    const prompt = `
      You are the Global Ṣe Ṣe Wá Pricing Expert for the Pan-African Handyman Marketplace.
      Analyze the following task: "${task}" in the location: "${location}, ${country}".
      Provide a fair market price range in ${currency}.
      - Account for the specific cost of living, logistics, and supply chain in "${location}, ${country}".
      - Provide reasoning in "${language}".
    `;

    const response = await axios.post("/api/ai/generate", {
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
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

    return JSON.parse(response.data.text || "{}");
  } catch (error: any) {
    console.error("Price Estimation Error:", error.response?.data || error.message);
    throw error;
  }
}
