import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// ============================================================================
// ENVIRONMENT VARIABLE VALIDATION
// ============================================================================
const requiredEnvVars = ['GEMINI_API_KEY', 'PAYSTACK_SECRET_KEY', 'CORS_ORIGIN'];
const validateEnvironment = (): void => {
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(`\n❌ FATAL ERROR: Missing required environment variables:\n  - ${missing.join('\n  - ')}\n`);
    console.error('Please set these variables before starting the server.');
    process.exit(1);
  }
  
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || "";
  if (!geminiKey.startsWith("AIza")) {
    console.error(`\n❌ FATAL ERROR: Invalid GEMINI_API_KEY format. Must start with "AIza"\n`);
    process.exit(1);
  }
};

// Validate on startup
validateEnvironment();

// ============================================================================
// RATE LIMITERS
// ============================================================================

// General API rate limiter
const generalLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { error: "Too many requests, please try again later." }
});

// Strict rate limiter for expensive Paystack API endpoints
const paystackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests, please try again later." }
});

// Aggressive rate limiter for expensive AI endpoints (they call external APIs)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Conservative limit to prevent API cost abuse
  message: { error: "Too many AI requests. Please try again later." }
});

// ============================================================================
// AI CLIENT INITIALIZATION
// ============================================================================

let aiInstance: GoogleGenAI | null = null;

const getAIClient = (): GoogleGenAI => {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY?.trim() || "";
    if (!key || !key.startsWith("AIza")) {
      throw new Error("Invalid or missing GEMINI_API_KEY");
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

// ============================================================================
// EXPRESS APP FACTORY
// ============================================================================

// This function creates the Express app without starting the server.
export async function createApi() {
  const app = express();
  
  // ========================================================================
  // SECURITY MIDDLEWARES
  // ========================================================================
  
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        // More restrictive CSP - removed unsafe-inline and unsafe-eval
        "script-src": ["'self'"],
        "default-src": ["'self'"],
        "img-src": ["'self'", "https:", "data:", "blob:"],
        "style-src": ["'self'", "https:"],
        "connect-src": ["'self'", "https:", "wss:"],
        "frame-ancestors": ["'none'"], // Prevent clickjacking
        "form-action": ["'self'"],
        "base-uri": ["'self'"],
      },
    },
    xFrameOptions: { action: "deny" },
    crossOriginEmbedderPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    xssFilter: true,
  }));

  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        return res.status(403).json({ error: 'HTTPS required' });
      }
      next();
    });
  }

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ========================================================================
  // CORS CONFIGURATION
  // ========================================================================
  
  const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
    .map((origin) => {
      // Validate origins - only allow HTTPS in production
      if (process.env.NODE_ENV === 'production' && origin.startsWith('http://')) {
        console.warn(`⚠️  Warning: HTTP origin in production: ${origin}`);
      }
      return origin;
    });

  if (allowedOrigins.length === 0) {
    console.error("❌ No valid CORS origins configured");
    process.exit(1);
  }

  app.use(cors({
    origin: (origin, callback) => {
      // Allow non-browser or same-origin requests with no Origin header
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Apply rate limiters
  app.use(generalLimiter);
  app.use("/api/paystack/", paystackLimiter);
  app.use("/api/ai/", aiLimiter);

  // ========================================================================
  // REQUEST LOGGER (Development only)
  // ========================================================================
  
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      if (req.method === 'POST') {
        console.log(`[DEBUG] POST ${req.path}`);
      }
      next();
    });
  }

  // Trust proxy headers (for Cloud Run / load balancers)
  app.set('trust proxy', true);

  // ========================================================================
  // HEALTH CHECK ENDPOINT
  // ========================================================================
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ========================================================================
  // AI ENDPOINTS
  // ========================================================================

  // Endpoint: Match handymen based on user query
  app.post("/api/ai/match-handymen", async (req, res) => {
    try {
      const { query, handymen } = req.body;

      // Input validation
      if (!query || typeof query !== 'string' || query.length === 0) {
        return res.status(400).json({ error: "Invalid query parameter" });
      }
      if (query.length > 500) {
        return res.status(400).json({ error: "Query too long (max 500 chars)" });
      }
      if (!Array.isArray(handymen) || handymen.length === 0) {
        return res.status(400).json({ error: "Invalid handymen array" });
      }

      // Validate handymen data
      const validatedHandymen = handymen.slice(0, 50).map((h: any) => ({
        id: String(h.id).slice(0, 100),
        name: String(h.name).slice(0, 100),
        category: String(h.category).slice(0, 50),
        description: String(h.description).slice(0, 500)
      }));

      const prompt = `
        User Query: "${query}"
        Available Professionals:
        ${JSON.stringify(validatedHandymen)}
        Identify the top 3 most relevant professionals. Return only their IDs in a JSON array.
      `;

      const response = await getAIClient().models.generateContent({
        model: "gemini-2.0-flash",
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

      const result = JSON.parse(response.text || "[]");
      res.json(result);
    } catch (error: any) {
      console.error("Match Handymen Error:", error.message);
      res.status(500).json({ error: "Failed to match handymen" });
    }
  });

  // Endpoint: Refine job description
  app.post("/api/ai/refine-description", async (req, res) => {
    try {
      const { initialDescription } = req.body;

      // Input validation
      if (!initialDescription || typeof initialDescription !== 'string') {
        return res.status(400).json({ error: "Invalid description parameter" });
      }
      if (initialDescription.length === 0 || initialDescription.length > 1000) {
        return res.status(400).json({ error: "Description must be 1-1000 characters" });
      }

      const prompt = `
        The user wants to request a handyman service with this initial description: "${initialDescription}"
        Act as a helpful assistant. If the description is vague, ask 2-3 clarifying questions.
        If it's good, provide a professional detailed version.
        Return ONLY valid JSON: {"isRefined": boolean, "content": string}
      `;

      const response = await getAIClient().models.generateContent({
        model: "gemini-2.0-flash",
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

      const result = JSON.parse(response.text || "null");
      res.json(result);
    } catch (error: any) {
      console.error("Refine Description Error:", error.message);
      res.status(500).json({ error: "Failed to refine description" });
    }
  });

  // Endpoint: Summarize reviews
  app.post("/api/ai/summarize-reviews", async (req, res) => {
    try {
      const { reviews } = req.body;

      // Input validation
      if (!Array.isArray(reviews)) {
        return res.status(400).json({ error: "Invalid reviews parameter" });
      }
      if (reviews.length === 0) {
        return res.json({ result: "No reviews yet to summarize." });
      }
      if (reviews.length > 100) {
        return res.status(400).json({ error: "Too many reviews (max 100)" });
      }

      const reviewTexts = reviews
        .slice(0, 100)
        .map((r: any) => String(r.comment || "").slice(0, 500))
        .filter((text: string) => text.length > 0);

      const prompt = `Summarize these reviews into 3 concise sentences: ${JSON.stringify(reviewTexts)}`;

      const response = await getAIClient().models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are a helpful review analyst for Ṣe Ṣe Wá. Summarize user feedback accurately and concisely."
        }
      });

      res.json({ result: response.text || "Unable to summarize." });
    } catch (error: any) {
      console.error("Summarize Reviews Error:", error.message);
      res.status(500).json({ error: "Failed to summarize reviews" });
    }
  });

  // Endpoint: Analyze image for household issues
  app.post("/api/ai/analyze-image", async (req, res) => {
    try {
      const { base64Image, mimeType, language = "English" } = req.body;

      // Input validation
      if (!base64Image || typeof base64Image !== 'string') {
        return res.status(400).json({ error: "Invalid base64Image parameter" });
      }
      if (!mimeType || !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)) {
        return res.status(400).json({ error: "Invalid mimeType" });
      }
      if (base64Image.length > 5 * 1024 * 1024) { // 5MB limit
        return res.status(400).json({ error: "Image too large (max 5MB)" });
      }

      const prompt = `Analyze this image of a household problem. What is the likely issue and what category of professional (e.g., Plumber, Electrician, Carpenter) is best suited to fix it? 
        Provide your response in ${language}.
        Return ONLY valid JSON: {"issue": string, "suggestedCategory": string, "explanation": string}`;

      const response = await getAIClient().models.generateContent({
        model: "gemini-2.0-flash",
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

      const result = JSON.parse(response.text || "null");
      res.json(result);
    } catch (error: any) {
      console.error("Analyze Image Error:", error.message);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  // Endpoint: Chat with HandyPadi AI assistant
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history = [], currentLanguage = 'English' } = req.body;

      // Input validation
      if (!message || typeof message !== 'string' || message.length === 0) {
        return res.status(400).json({ error: "Invalid message parameter" });
      }
      if (message.length > 1000) {
        return res.status(400).json({ error: "Message too long (max 1000 chars)" });
      }
      if (!Array.isArray(history)) {
        return res.status(400).json({ error: "Invalid history parameter" });
      }
      if (history.length > 20) {
        return res.status(400).json({ error: "History too long (max 20 messages)" });
      }

      const validatedLanguage = String(currentLanguage).slice(0, 50);

      const response = await getAIClient().models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          ...history
            .slice(-10) // Only use last 10 messages
            .map((msg: any) => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: String(msg.text).slice(0, 500) }]
            })),
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: `You are HandyPadi, the AI assistant for Ṣe Ṣe Wá, a handyman marketplace in Nigeria. 
            The user's preferred language is ${validatedLanguage}. 
            Respond in ${validatedLanguage} if possible, or use a natural mix of English and ${validatedLanguage} (like Pidgin) if appropriate.
            Help users find pros, explain the escrow system, and answer general questions about the platform. 
            Be helpful, professional, and concise.`
        }
      });

      res.json({ result: response.text || "I'm sorry, I couldn't generate a response." });
    } catch (error: any) {
      console.error("HandyPadi Chat Error:", error.message);
      res.status(500).json({ 
        error: "Failed to process chat",
        result: "I'm having trouble connecting to the HandyPadi AI right now. Please try again later." 
      });
    }
  });

  // Endpoint: Translate text
  app.post("/api/ai/translate", async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;

      // Input validation
      if (!text || typeof text !== 'string' || text.length === 0) {
        return res.status(400).json({ error: "Invalid text parameter" });
      }
      if (text.length > 1000) {
        return res.status(400).json({ error: "Text too long (max 1000 chars)" });
      }
      if (!targetLanguage || typeof targetLanguage !== 'string') {
        return res.status(400).json({ error: "Invalid targetLanguage parameter" });
      }

      const validatedLanguage = String(targetLanguage).slice(0, 50);
      let prompt = "";

      if (validatedLanguage.toLowerCase() === 'pidgin') {
        prompt = `You are a professional translator specializing in Nigerian Pidgin English. 
        Translate the following message into natural, widely-understood Nigerian Pidgin.
        Maintain the helpful and friendly tone of the original brand.
        
        Original English: "${text}"
        
        Return ONLY the translated Pidgin text. Do not include any quotes, notes, or explanations.`;
      } else {
        prompt = `You are a professional translator. 
        Translate the following text into ${validatedLanguage}. 
        Return ONLY the translated text. Do not include quotes, notes, or any other text.
        
        Text to translate: "${text}"`;
      }

      const response = await getAIClient().models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are a professional translator for Ṣe Ṣe Wá. Localize content accurately for Nigerian audiences."
        }
      });

      res.json({ result: response.text || text });
    } catch (error: any) {
      console.error("Translate Error:", error.message);
      res.status(500).json({ error: "Failed to translate text", result: req.body.text });
    }
  });

  // Endpoint: Text-to-speech welcome message
  app.post("/api/ai/speak-welcome", async (req, res) => {
    try {
      const { text } = req.body;

      // Input validation
      if (!text || typeof text !== 'string' || text.length === 0) {
        return res.status(400).json({ error: "Invalid text parameter" });
      }
      if (text.length > 500) {
        return res.status(400).json({ error: "Text too long for TTS (max 500 chars)" });
      }

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

      const audioData = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
      res.json({ audioData: audioData || null });
    } catch (error: any) {
      console.error("Speak Welcome Error:", error.message);
      res.status(500).json({ error: "Failed to generate audio" });
    }
  });

  // Endpoint: Price estimation for tasks
  app.post("/api/ai/price-estimation", async (req, res) => {
    try {
      const { task, location, country, currency, language = "English" } = req.body;

      // Input validation
      if (!task || typeof task !== 'string' || task.length === 0) {
        return res.status(400).json({ error: "Invalid task parameter" });
      }
      if (task.length > 500) {
        return res.status(400).json({ error: "Task description too long (max 500 chars)" });
      }
      if (!location || typeof location !== 'string') {
        return res.status(400).json({ error: "Invalid location parameter" });
      }
      if (!country || typeof country !== 'string') {
        return res.status(400).json({ error: "Invalid country parameter" });
      }
      if (!currency || typeof currency !== 'string') {
        return res.status(400).json({ error: "Invalid currency parameter" });
      }

      const validatedLanguage = String(language).slice(0, 50);
      const validatedLocation = String(location).slice(0, 100);
      const validatedCountry = String(country).slice(0, 100);
      const validatedCurrency = String(currency).slice(0, 20);

      const prompt = `
        You are the Global Ṣe Ṣe Wá Pricing Expert for the Pan-African Handyman Marketplace.
        Analyze the following task: "${task}" in the location: "${validatedLocation}, ${validatedCountry}".
        Provide a fair market price range in ${validatedCurrency}.
        - Account for the specific cost of living, logistics, and supply chain in "${validatedLocation}, ${validatedCountry}".
        - Please formulate your reasoning, factors, partsNeeded, and marketNotes strictly in the "${validatedLanguage}" language.
      `;

      const response = await getAIClient().models.generateContent({
        model: "gemini-2.0-flash",
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

      const result = JSON.parse(response.text || "{}");
      res.json(result);
    } catch (error: any) {
      console.error("Price Estimation Error:", error.message);
      res.status(500).json({ error: "Failed to estimate price" });
    }
  });

  // ========================================================================
  // PAYSTACK PAYMENT INTEGRATION
  // ========================================================================

  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

  app.post("/api/paystack/initialize", async (req, res) => {
    try {
      const { email, amount, metadata } = req.body;

      // Input validation
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: "Invalid email address" });
      }
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      if (amount > 10000000) { // Prevent unreasonable amounts
        return res.status(400).json({ error: "Amount exceeds limit" });
      }

      if (!PAYSTACK_SECRET) {
        return res.status(500).json({ error: "Paystack configuration error" });
      }

      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email: email.slice(0, 255),
          amount: Math.floor(amount * 100), // Convert to kobo
          metadata: metadata || {},
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

      // Input validation
      if (!reference || typeof reference !== 'string' || reference.length === 0) {
        return res.status(400).json({ error: "Invalid reference" });
      }

      if (!PAYSTACK_SECRET) {
        return res.status(500).json({ error: "Paystack configuration error" });
      }

      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference.slice(0, 255))}`,
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

  // ========================================================================
  // ERROR HANDLING
  // ========================================================================

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

// ============================================================================
// SERVER STARTUP
// ============================================================================

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

    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n✅ Server running on http://0.0.0.0:${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  }).catch((err: Error) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });
}
