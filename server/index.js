let mandiCache = null;
let mandiCacheTime = 0;

const CACHE_DURATION = 10 * 60 * 1000;

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());


// ==========================================
// HOME
// ==========================================

app.get('/api/mandi-prices', async (req, res) => {
  try {
    // Return cached data if available
    if (
      mandiCache &&
      Date.now() - cacheTime < CACHE_DURATION
    ) {
      console.log("✅ Returning cached mandi data");

      return res.json(mandiCache);
    }

    const apiKey = process.env.DATA_GOV_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "DATA_GOV_API_KEY is missing in .env"
      });
    }

    const apiUrl =
      "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070" +
      `?api-key=${encodeURIComponent(apiKey)}` +
      "&format=json" +
      "&limit=20";

    console.log("🌾 Calling Government API...");

    const response = await fetch(apiUrl);

    const text = await response.text();

    console.log(
      "Government API status:",
      response.status
    );

    if (!response.ok) {

      // If rate limited but old cache exists
      if (mandiCache) {
        console.log(
          "⚠️ Government API unavailable. Returning old cache."
        );

        return res.json(mandiCache);
      }

      return res.status(500).json({
        success: false,
        message: "Government API request failed",
        governmentStatus: response.status,
        details: text
      });
    }

    const data = JSON.parse(text);

    // Save fresh data
    mandiCache = data;
    cacheTime = Date.now();

    console.log(
      "✅ Fresh mandi data saved:",
      data.records?.length || 0
    );

    return res.json(data);

  } catch (error) {

    console.error(
      "❌ Mandi API error:",
      error
    );

    // Fallback to cache
    if (mandiCache) {
      console.log(
        "⚠️ Returning cached data after error"
      );

      return res.json(mandiCache);
    }

    return res.status(500).json({
      success: false,
      message: "Unable to fetch mandi prices",
      error: error.message
    });
  }
});


// ==========================================
// SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(
    `Bharat Fasal API running on http://localhost:${PORT}`
  );
});