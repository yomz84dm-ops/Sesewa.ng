import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// This function creates the Express app without starting the server.
// This is safe for both local development and Firebase Functions analysis.
export async function createApi() {
  const app = express();
  app.use(express.json());
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
