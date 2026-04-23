const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

// This is a completely self-contained Express app for Firebase.
// No external bundles, no resolution errors.
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// API health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
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

// Export the function as 'api'
exports.api = onRequest({ 
  region: "us-central1", 
  memory: "256MiB",
  invoker: "public" 
}, app);
