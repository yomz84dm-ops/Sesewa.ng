import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Define a rate limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." }
});

let aiInstance: GoogleGenAI | null = null;
const getAIClient = (): GoogleGenAI => {
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

// This function creates the Express app without starting the server.
export async function createApi() {
  const app = express();
  
  // Security middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Turn off CSP locally to avoid breaking Vite/inline scripts
    crossOriginEmbedderPolicy: false // Allows loading external images
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cors());

  // Apply rate limiter specifically to the paystack API endpoints
  app.use("/api/paystack/", apiLimiter);

  // Request logger for debugging
  app.use((req, res, next) => {
    if (req.method === 'POST') {
      console.log(`[DEBUG] POST ${req.path}`);
    }
    next();
  });

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.set('trust proxy', true);

  // AI Routes
  
  app.get("/api/gemini/debug", (req, res) => {
    let key1 = process.env.GEMINI_API_KEY;
    res.json({
      key_length: key1?.length,
      key_start: key1 ? key1.substring(0, 5) : null,
      key_end: key1 ? key1.substring(key1.length - 5) : null
    });
  });

  app.post("/api/gemini/match-handymen", async (req, res) => {
    try {
      const { query, handymen } = req.body;
      const prompt = `
        User Query: "${query}"
        Available Professionals:
        ${JSON.stringify(handymen.map((h: any) => ({ id: h.id, name: h.name, category: h.category, description: h.description })))}
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
    } catch (error: any) {
      console.error("Match Handymen Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/refine-description", async (req, res) => {
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
    } catch (error: any) {
      console.error("Refine Description Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/summarize-reviews", async (req, res) => {
    try {
      const { reviews } = req.body;
      if (!reviews || reviews.length === 0) return res.json({ result: "No reviews yet to summarize." });
      const prompt = `Summarize these reviews into 3 concise sentences: ${JSON.stringify(reviews.map((r: any) => r.comment))}`;
      const response = await getAIClient().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are a helpful review analyst for Ṣe Ṣe Wá. Summarize user feedback accurately and concisely."
        }
      });
      res.json({ result: response.text || "Unable to summarize." });
    } catch (error: any) {
      console.error("Summarize Reviews Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/analyze-image", async (req, res) => {
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
    } catch (error: any) {
      console.error("Analyze Image Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history = [], currentLanguage = 'English' } = req.body;
      const response = await getAIClient().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history.map((msg: any) => ({
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
    } catch (error: any) {
      console.error("HandyPadi Chat Error:", error.message);
      res.status(500).json({ error: error.message, result: "I'm having trouble connecting to the HandyPadi AI right now. Please try again later." });
    }
  });

  app.post("/api/gemini/translate", async (req, res) => {
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
    } catch (error: any) {
      console.error("Translate Error:", error.message);
      res.status(500).json({ error: error.message, result: req.body.text });
    }
  });

  app.post("/api/gemini/speak-welcome", async (req, res) => {
    console.log("[DEBUG] Received request for /api/gemini/speak-welcome");
    try {
      const { text } = req.body;
      console.log("[DEBUG] Generating TTS for text:", text);
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
      console.log("[DEBUG] Gemini Response received");
      const audioData = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
      console.log("[DEBUG] Audio data extracted:", audioData ? "Yes (length: " + audioData.length + ")" : "No");
      res.json({ audioData: audioData || null });
    } catch (error: any) {
      console.error("Speak Welcome Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/price-estimation", async (req, res) => {
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
    } catch (error: any) {
      console.error("Price Estimation Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // PAYSTACK Integration
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

  app.post("/api/paystack/initialize", async (req, res) => {
    try {
      const { email, amount, metadata } = req.body;
      
      if (!PAYSTACK_SECRET) {
        return res.status(500).json({ error: "Paystack secret key not configured" });
      }

      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,
          amount: amount * 100,
          metadata,
          callback_url: `${req.protocol}://${req.get('host')}/api/paystack/callback`
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json"
          }
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error("Paystack initialization error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to initialize payment" });
    }
  });

  app.get("/api/paystack/verify/:reference", async (req, res) => {
    try {
      const { reference } = req.params;

      if (!PAYSTACK_SECRET) {
        return res.status(500).json({ error: "Paystack secret key not configured" });
      }

      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`
          }
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error("Paystack verification error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  createApi().then(async (app) => {
    // In dev mode, we also mount the Vite middleware
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      // In production (Cloud Run), we serve static files from /dist
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath, {
        maxAge: '1y', // Cache static assets for 1 year
        etag: true,
      }));
      app.get('*', (req, res) => {
        // Do not cache the index.html so users always get the latest bundle
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }).catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
