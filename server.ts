import dotenv from "dotenv";
dotenv.config(); // Must be first to load process.env

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import axios, { AxiosError } from "axios";
import path from "path";
import crypto from "crypto";
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const PAYSTACK_BASE_URL = "https://api.paystack.co";
/** Helper to get secret key, ensuring we always pull the latest env value */
const getPaystackSecret = () => process.env.PAYSTACK_SECRET_KEY || "";

/**
 * Validates that the Paystack secret key is configured.
 */
const paystackAuthMiddleware = (_req: Request, res: Response, next: NextFunction) => {
  const secret = getPaystackSecret();
  if (!secret) {
    return res.status(500).json({ error: "Paystack secret key not configured" });
  }
  next();
};

// This function creates the Express app without starting the server.
export async function createApi() {
  const app = express();
  app.set('trust proxy', true); // Required for accurate req.protocol behind proxies
  // We use the verify option to capture the raw body buffer, which is required for Paystack signature verification
  app.use(express.json({ 
    limit: '5mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(cors());

  // Request logger for debugging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.method === 'POST') {
      console.log(`[DEBUG] POST ${req.path}`);
      console.log(`[DEBUG] Headers: ${JSON.stringify(req.headers)}`);
      console.log(`[DEBUG] Body: ${JSON.stringify(req.body)}`);
    }
    next();
  });

  // API health check
  app.get("/api/health", (_req: Request, res: Response) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const isSecretLoaded = !!secretKey;
    console.log(`[HEALTH] Secret loaded: ${isSecretLoaded}`);
    if (secretKey) {
      console.log(`[HEALTH] Secret length: ${secretKey.length} chars`);
    }
    res.status(200).json({ status: "ok", secret_detected: isSecretLoaded, timestamp: new Date().toISOString() });
  });

  // Protect all Paystack routes with configuration validation
  app.use("/api/paystack", paystackAuthMiddleware);

  // Root POST handler (e.g. for Firebase Auth blocking functions)
  app.post("/", (req, res, next) => {
    if (req.path !== '/') return next();
    res.status(200).json({ message: "Root POST endpoint active" }); 
  });

  // Paystack Integration
  app.post("/api/paystack/initialize", async (req: Request, res: Response) => {
    try {
      const { email, amount, metadata, cancel_url, recaptchaToken } = req.body;

      if (!email || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: "Email and amount are required" });
      }

      if (!recaptchaToken) {
        return res.status(400).json({ error: "ReCAPTCHA token is required" });
      }

      // Verify ReCAPTCHA with Google
      const recaptchaResponse = await axios.post(
        "https://www.google.com/recaptcha/api/siteverify",
        new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY || "",
          response: recaptchaToken
        }).toString(),
        { 
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 10000 
        }
      );

      const { success, score, hostname } = recaptchaResponse.data;

      if (!success) {
        return res.status(400).json({ error: "ReCAPTCHA verification failed. Please try again." });
      }

      // reCAPTCHA v3 score check: Reject requests with a low human-probability score
      // Note: reCAPTCHA v2 tokens do not have a score property.
      if (score !== undefined && score < 0.5) {
        console.warn(`[RECAPTCHA] Low score detected: ${score} for ${email}`);
        return res.status(403).json({ error: "Bot activity detected. Please try again." });
      }

      // Extra security: Verify the hostname to prevent token reuse on unauthorized domains (Domain Lock)
      const allowedHostnames = (process.env.ALLOWED_HOSTNAMES || "localhost")
        .split(",")
        .map(h => h.trim());
      
      if (hostname && !allowedHostnames.includes(hostname)) {
        console.error(`[RECAPTCHA] Security Alert: Received token from unauthorized hostname: ${hostname}`);
        return res.status(403).json({ error: "Unauthorized request origin." });
      }

      // Abuse Prevention: Rate limit initialization attempts per user or email
      const limitKey = metadata?.userId || email;
      const now = Date.now();
      const windowMs = 15 * 60 * 1000; // 15 minute window
      const maxAttempts = 5;

      const attemptRef = admin.firestore().collection("paymentAttempts").doc(String(limitKey));
      const attemptDoc = await attemptRef.get();
      const timestamps: number[] = attemptDoc.exists ? (attemptDoc.data()?.timestamps || []) : [];
      
      // Filter to keep only attempts within the current window
      const recentAttempts = timestamps.filter(ts => ts > now - windowMs);

      if (recentAttempts.length >= maxAttempts) {
        return res.status(429).json({ 
          error: "Too many payment attempts. Please wait 15 minutes before trying again." 
        });
      }
      
      const secret = getPaystackSecret();
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        {
          email,
          amount: Math.round(amount * 100), // Fix floating point precision
          metadata,
          callback_url: `${req.protocol}://${req.get('host')}/api/paystack/callback`,
          cancel_url: cancel_url || `${req.protocol}://${req.get('host')}/`
        },
        {
          headers: {
            Authorization: `Bearer ${secret}`,
            "Content-Type": "application/json"
          },
          timeout: 10000
        }
      );

      // Record the successful initialization attempt to the sliding window
      await attemptRef.set({
        timestamps: [...recentAttempts, now]
      }, { merge: true });

      res.status(200).json(response.data);
    } catch (error) {
      const err = error as AxiosError;
      console.error("Paystack initialization error:", err.response?.data || err.message);
      res.status(500).json({ error: "Failed to initialize payment" });
    }
  });

  // Paystack Callback: Redirect user back to the frontend after payment
  app.get("/api/paystack/callback", (req: Request, res: Response) => {
    const { reference } = req.query;
    if (!reference || typeof reference !== 'string') return res.redirect("/");
    res.redirect(`/?reference=${reference}`);
  });

  // Paystack Webhook: Receives real-time payment updates from Paystack
  app.post("/api/paystack/webhook", async (req: Request, res: Response) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers["x-paystack-signature"] as string;

    if (!secret || !signature) {
      console.error("[WEBHOOK] Missing secret or signature");
      return res.sendStatus(400);
    }

    // Verify Paystack signature using the raw body buffer
    const hash = crypto
      .createHmac("sha512", secret)
      .update((req as any).rawBody)
      .digest("hex");

    if (hash !== signature) {
      console.warn("[WEBHOOK] Invalid signature detected");
      return res.sendStatus(401);
    }

    const event = req.body;

    // Log non-success events for auditing bank declines or other failures
    if (event.event !== "charge.success") {
      console.log(`[WEBHOOK] Received event: ${event.event}. Gateway response: ${event.data?.gateway_response || 'No reason provided'}`);
    }

    if (event.event === "charge.success") {
      const { metadata } = event.data;
      const userId = metadata?.userId;
      const creditsToAdd = metadata?.creditsToAdd;

      if (userId && creditsToAdd) {
        try {
          const userRef = admin.firestore().collection("users").doc(userId);
          await admin.firestore().runTransaction(async (t) => {
            const doc = await t.get(userRef);
            const currentCredits = doc.exists ? (doc.data()?.credits || 0) : 0;
            t.update(userRef, { credits: currentCredits + Number(creditsToAdd) });
          });
          console.log(`[WEBHOOK] Successfully added ${creditsToAdd} credits to user ${userId}`);
        } catch (error) {
          console.error("[WEBHOOK] Firestore transaction failed:", error);
        }
      }
    }

    res.sendStatus(200); // Always respond 200 to Paystack within 2 seconds
  });

  app.get("/api/paystack/verify/:reference", async (req: Request, res: Response) => {
    try {
      const { reference } = req.params;
      if (!reference) {
        return res.status(400).json({ error: "Reference is required" });
      }
      if (!/^[A-Za-z0-9_-]{6,100}$/.test(reference)) {
        return res.status(400).json({ error: "Invalid reference format" });
      }
      const safeReference = encodeURIComponent(reference);
      const secret = getPaystackSecret();
      const response = await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/verify/${safeReference}`,
        {
          headers: { Authorization: `Bearer ${secret}` },
          timeout: 10000
        }
      );

      // Check if the bank declined the transaction
      const { status, gateway_response } = response.data.data;
      if (status === 'failed' || status === 'reversed') {
        console.warn(`[VERIFY] Transaction was not successful. Status: ${status}, Reason: ${gateway_response}`);
      }

      res.status(200).json(response.data);
    } catch (error) {
      const err = error as AxiosError;
      console.error("Paystack verification error:", err.response?.data || err.message);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // General catch-all for any other POST requests to handle potential blocking functions on any path
  if (process.env.NODE_ENV !== 'production') {
    app.post("*", (req, res) => {
      console.log(`[DEBUG] Unhandled POST to ${req.path}`);
      res.status(404).json({ error: "Route not found", path: req.path });
    });
  }

  return app;
}

// Development and Cloud Run mode
// We use an explicit environment variable set in our package.json scripts
// to determine if we should start the Express listener.
const shouldServe = process.env.NODE_SERVE === "true";
// K_SERVICE is set by Cloud Run. If present, we are definitely in production.
const isCloudRun = !!process.env.K_SERVICE;

if (shouldServe && process.env.NODE_ENV !== "test") {
  (async () => {
    try {
      const app = await createApi();
      
      // Only mount Vite middleware in local development
      if (process.env.NODE_ENV !== "production" && !isCloudRun) {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
      } else {
        // In production (Cloud Run), we serve static files from /dist
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (_req: Request, res: Response) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }

      const PORT = parseInt(process.env.PORT || "8080", 10);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    } catch (e) {
      console.error("[FATAL] Failed to start server:", e);
      process.exit(1);
    }
  })();
}

// Export for Firebase Cloud Functions
let appInstance: express.Application;
export const api = onRequest({ 
  region: "us-central1",
  secrets: ["PAYSTACK_SECRET_KEY", "RECAPTCHA_SECRET_KEY", "ALLOWED_HOSTNAMES", "TEST_MODE_SECRET"] 
}, async (req: Request, res: Response) => {
  if (!appInstance) {
    appInstance = await createApi();
  }
  return appInstance(req, res);
});
