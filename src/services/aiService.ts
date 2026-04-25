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
  urgency: string,
  country: string = "Nigeria"
): Promise<PriceEstimation> {
  const prompt = `
    Task: "${task}"
    Location: "${location}"
    Urgency: "${urgency}"
    Country: "${country}"

    As an expert Nigerian handyman advisor, estimate a fair price range (in NGN) for this task.
    Consider current inflation rates (2024-2025) and market realities in Nigeria.
    - Provide a minimum and maximum labor cost.
    - List technical factors that could influence the final quote.
    - Suggest potential parts that might need replacement.
    - Market Notes should be tailored to the business environment of ${country}.
    
    Return as JSON.
`;

  try {
    const response = await axios.post("/api/ai/generate", {
      prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.data.text;
    if (!text) {
      throw new Error("AI returned an empty response.");
    }
    
    try {
      const jsonMatch = text.match(/\{.*\}/s);
      return JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (e) {
      console.error("AI Service: Failed to parse JSON response", text);
      throw new Error("AI returned invalid JSON format.");
    }
  } catch (error: any) {
    console.error("Price Estimation Error:", error);
    throw new Error(error.response?.data?.error || error.message || "Failed to get price estimation");
  }
}
