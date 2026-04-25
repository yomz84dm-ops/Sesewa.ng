import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenAI, Type, Modality } from "@google/genai";

dotenv.config();

// Standard AI Models
const PREVIEW_TEXT_MODEL = "gemini-3-flash-preview";
const PREVIEW_TTS_MODEL = "gemini-3.1-flash-tts-preview";

// This function creates the Express app without starting the server.
export async function createApi() {
  const app = express();
  app.use(express.json({ limit: '10mb' })); // Increase limit for images
  app.use(cors());

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Paystack Integration
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

  // --- Gemini AI Proxy Support ---
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const getAiInstance = () => {
    if (!GEMINI_KEY) return null;
    return new GoogleGenAI(GEMINI_KEY);
  };

  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { prompt, config, model: modelOverride, contents } = req.body;
      const ai = getAiInstance();
      if (!ai) return res.status(500).json({ error: "Gemini API key not configured on server" });

      const modelName = modelOverride || PREVIEW_TEXT_MODEL;
      const model = ai.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent(contents || prompt);
      const response = await result.response;
      const text = response.text();
      
      res.json({ text });
    } catch (error: any) {
      console.error("AI Proxy Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history, systemInstruction } = req.body;
      const ai = getAiInstance();
      if (!ai) return res.status(500).json({ error: "Gemini API key not configured on server" });

      const model = ai.getGenerativeModel({ 
        model: PREVIEW_TEXT_MODEL,
        systemInstruction: systemInstruction || "You are a helpful assistant."
      });

      const chat = model.startChat({
        history: history || [],
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();

      res.json({ text });
    } catch (error: any) {
      console.error("AI Chat Proxy Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/speak", async (req, res) => {
    try {
      const { text, model: modelOverride } = req.body;
      const ai = getAiInstance();
      if (!ai) return res.status(500).json({ error: "Gemini API key not configured on server" });

      const modelName = modelOverride || PREVIEW_TTS_MODEL;
      const model = ai.getGenerativeModel({ model: modelName });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["audio"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const response = await result.response;
      const audioPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      const base64Audio = audioPart?.inlineData?.data;
      
      res.json({ audio: base64Audio });
    } catch (error: any) {
      console.error("AI TTS Proxy Error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  return app;
}

// Development and Cloud Run mode
// FUNCTIONS_EMULATOR and FIREBASE_CONFIG are specific to the Function environment.
// GCLOUD_PROJECT can be present in both, so we use it as a fallback but prioritize the others.
const isFunctionEnv = process.env.FUNCTIONS_EMULATOR || process.env.FIREBASE_CONFIG;

if (!isFunctionEnv && process.env.NODE_ENV !== "test") {
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
      const path = await import("path");
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    const PORT = parseInt(process.env.PORT || "3000", 10);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}
