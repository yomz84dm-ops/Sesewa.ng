const API_URL = import.meta.env.VITE_API_URL || '/api';

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
    const response = await fetch(`${API_URL}/gemini/price-estimation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, location, country, currency, language })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error("Price Estimation Error:", error);
    throw error;
  }
}
