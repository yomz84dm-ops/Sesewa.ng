const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

// Version: 1.0.2 - Self-contained Marketplace API
const app = express();
const allowedOrigins = [
  "https://your-frontend.example.com",
  "https://www.your-frontend.example.com"
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no Origin header), block untrusted browser origins
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"), false);
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root POST handler and auth catch-all for blocking functions
app.post("/", (req, res) => {
  console.log(`[DEBUG] Function root POST caught`);
  res.status(200).json({}); 
});

// API health check
app.get("/api/health", (req, res) => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  const isLoaded = !!key;
  console.log("[HEALTH] Health check requested");
  res.json({ status: "ok", secret_detected: isLoaded, service: "Ṣe Ṣe Wá Marketplace API" });
});

// Paystack Integration
app.post("/api/paystack/initialize", async (req, res) => {
  try {
    const { email, amount, metadata } = req.body;
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

// Final catch-all for POST requests
app.post("*", (req, res) => {
  console.log(`[DEBUG] Function catch-all POST caught request to: ${req.path}`);
  res.status(200).json({});
});

// Export the function as 'api'
exports.api = onRequest({ 
  region: "us-central1", 
  memory: "256MiB",
  invoker: "public",
  secrets: ["PAYSTACK_SECRET_KEY"]
}, app);
