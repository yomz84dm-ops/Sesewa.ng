// Version: 1.0.3 - Self-contained Marketplace API
const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { GoogleGenAI, Type } = require("@google/genai");
require("dotenv").config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

let aiInstance = null;
const getAIClient = () => {
  if (!aiInstance) {
    let key = process.env.GEMINI_API_KEY?.trim() || "";
    if (!key || key === "your_gemini_api_key_here" || key === "MY_GEMINI_API_KEY" || !key.startsWith("AIza")) {
      key = process.env.VITE_GEMINI_API_KEY?.trim() || "";
    }
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
      key = key.slice(1, -1);
    }
    if (!key || !key.startsWith("AIza")) {
      console.warn("Invalid GEMINI_API_KEY. It looks like a placeholder was entered. Please enter a real Google AI Studio key starting with AIza.");
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

// AI Routes

app.post("/api/ai/match-handymen", async (req, res) => {
  try {
    const { query, handymen } = req.body;
    const prompt = `
      User Query: "${query}"
      Available Professionals:
      ${JSON.stringify(handymen.map(h => ({ id: h.id, name: h.name, category: h.category, description: h.description })))}
      Identify the top 3 most relevant professionals. Return only their IDs in a JSON array.
    `;
    const response = await getAIClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a professional matching expert for Ṣe Ṣe Wá. Identify the best pros based on user needs.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    res.json(JSON.parse(response.text || "[]"));
  } catch (error) {
    console.error("Match Handymen Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ai/refine-description", async (req, res) => {
  try {
    const { initialDescription } = req.body;
    const prompt = `
      The user wants to request a handyman service with this initial description: "${initialDescription}"
      Act as a helpful assistant. If the description is vague, ask 2-3 clarifying questions.
      If it's good, provide a professional detailed version.
      Return ONLY valid JSON: {"isRefined": boolean, "content": string}
    `;
    const response = await getAIClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a job description specialist for Ṣe Ṣe Wá. Help users articulate their needs effectively.",
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
    res.json(JSON.parse(response.text || "null"));
  } catch (error) {
    console.error("Refine Description Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ai/summarize-reviews", async (req, res) => {
  try {
    const { reviews } = req.body;
    if (!reviews || reviews.length === 0) return res.json({ result: "No reviews yet to summarize." });
    const prompt = `Summarize these reviews into 3 concise sentences: ${JSON.stringify(reviews.map(r => r.comment))}`;
    const response = await getAIClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a helpful review analyst for Ṣe Ṣe Wá. Summarize user feedback accurately and concisely."
      }
    });
    res.json({ result: response.text || "Unable to summarize." });
  } catch (error) {
    console.error("Summarize Reviews Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ai/analyze-image", async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;
    const prompt = "Analyze this image of a household problem. What is the likely issue and what category of professional (e.g., Plumber, Electrician, Carpenter) is best suited to fix it? Provide a brief explanation.";
    const response = await getAIClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: base64Image, mimeType } },
            { text: prompt }
          ]
        }
      ],
      config: {
        systemInstruction: "You are a technical household damage expert. Identify problems correctly from images.",
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
    res.json(JSON.parse(response.text || "null"));
  } catch (error) {
    console.error("Analyze Image Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history = [], currentLanguage = 'English' } = req.body;
    const response = await getAIClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `You are HandyPadi, the AI assistant for Ṣe Ṣe Wá, a handyman marketplace in Nigeria. 
          The user's preferred language is ${currentLanguage}. 
          Respond in ${currentLanguage} if possible, or use a natural mix of English and ${currentLanguage} (like Pidgin) if appropriate.
          Help users find pros, explain the escrow system, and answer general questions about the platform. 
          Be helpful, professional, and concise.`
      }
    });
    res.json({ result: response.text || "I'm sorry, I couldn't generate a response." });
  } catch (error) {
    console.error("HandyPadi Chat Error:", error.message);
    res.status(500).json({ error: error.message, result: "I'm having trouble connecting to the HandyPadi AI right now. Please try again later." });
  }
});

app.post("/api/ai/translate", async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    let prompt = "";
    if (targetLanguage.toLowerCase() === 'pidgin') {
      prompt = `You are a professional translator specializing in Nigerian Pidgin English. 
      Translate the following message into natural, widely-understood Nigerian Pidgin.
      Maintain the helpful and friendly tone of the original brand.
      
      Original English: "${text}"
      
      Return ONLY the translated Pidgin text. Do not include any quotes, notes, or explanations.`;
    } else {
      prompt = `You are a professional translator. 
      Translate the following text into ${targetLanguage}. 
      Return ONLY the translated text. Do not include quotes, notes, or any other text.
      
      Text to translate: "${text}"`;
    }
    const response = await getAIClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a professional translator for Ṣe Ṣe Wá. Localize content accurately for Nigerian audiences."
      }
    });
    res.json({ result: response.text || text });
  } catch (error) {
    console.error("Translate Error:", error.message);
    res.status(500).json({ error: error.message, result: req.body.text });
  }
});

app.post("/api/ai/speak-welcome", async (req, res) => {
  try {
    const { text } = req.body;
    const response = await getAIClient().models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say cheerfully: ${text}` }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      }
    });
    const audioData = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    res.json({ audioData: audioData || null });
  } catch (error) {
    console.error("Speak Welcome Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ai/price-estimation", async (req, res) => {
  try {
    const { task, location, country, currency, language = "English" } = req.body;
    const prompt = `
      You are the Global Ṣe Ṣe Wá Pricing Expert for the Pan-African Handyman Marketplace.
      Analyze the following task: "${task}" in the location: "${location}, ${country}".
      Provide a fair market price range in ${currency}.
      - Account for the specific cost of living, logistics, and supply chain in "${location}, ${country}".
      - Provide reasoning in "${language}".
    `;

    const response = await getAIClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are the Global Ṣe Ṣe Wá Pricing Expert. Provide fair and accurate market price estimates for handyman tasks in Nigeria.",
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

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    console.error("Price Estimation Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Root POST handler and auth catch-all for blocking functions
app.post("/", (req, res) => {
  console.log(`[DEBUG] Function root POST caught`);
  res.status(200).json({}); 
});

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Ṣe Ṣe Wá Marketplace API" });
});

// Paystack Integration - Initialize
app.post("/api/paystack/initialize", async (req, res) => {
  try {
    const { email, amount, metadata } = req.body;
    // Note: To use environment variables in Firebase Functions v2, 
    // it's recommended to set them up via `firebase functions:secrets:set PAYSTACK_SECRET_KEY`
    // or through the GCP Secret Manager. We fallback to process.env.
    const key = process.env.PAYSTACK_SECRET_KEY;
    
    if (!key) {
      console.error("PAYSTACK_SECRET_KEY is missing in environment variables");
      return res.status(500).json({ error: "Server Configuration Error" });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // amount in kobo
        metadata
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Paystack Init Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Payment initialization failed" });
  }
});

// Paystack Integration - Verify
app.get("/api/paystack/verify/:reference", async (req, res) => {
  try {
    const { reference } = req.params;
    const key = process.env.PAYSTACK_SECRET_KEY;

    if (!key) {
      return res.status(500).json({ error: "Paystack secret key not configured" });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${key}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Paystack verification error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

// Final catch-all for POST requests
app.post("*", (req, res) => {
  console.log(`[DEBUG] Function catch-all POST caught request to: ${req.path}`);
  res.status(200).json({});
});

// Export the function as 'api'
exports.api = onRequest({ 
  region: "us-central1", 
  memory: "256MiB",
  invoker: "public" 
}, app);
