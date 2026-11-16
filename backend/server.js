import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import connectDB from "./config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import verificationRoutes from "./routes/verification.routes.js";
import lotRoutes from "./routes/lot.routes.js";
import buyerRoutes from "./routes/buyer.routes.js";
import buyerDemandRoutes from "./routes/buyerDemand.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import marketNewsRoutes from "./routes/marketNews.routes.js";
import purchaseRequestRoutes from "./routes/purchaseRequest.routes.js";
import offerRoutes from "./routes/offer.routes.js";
import logisticsRoutes from "./routes/logistics.routes.js";
dotenv.config();
import orderRoutes from "./routes/order.routes.js";
import grievanceRoutes from "./routes/grievance.routes.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mandiCacheFile = path.join(__dirname, "data", "mandi-cache.json");

const mandiHistoryFile = path.join(
  __dirname,
  "data",
  "mandi-history.json"
);

let mandiHistory = {};

if (fs.existsSync(mandiHistoryFile)) {
  try {
    mandiHistory = JSON.parse(
      fs.readFileSync(mandiHistoryFile, "utf-8")
    );
  } catch {
    mandiHistory = {};
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());
app.use(express.json());

// ========================================
// AUTH ROUTES
// ========================================

app.use("/api/auth", authRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/buyers", buyerRoutes);
app.use("/api/buyer-demands", buyerDemandRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/lots", lotRoutes);
app.use("/api/market-news", marketNewsRoutes);
app.use("/api/purchase-requests", purchaseRequestRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/logistics", logisticsRoutes);
app.use("/api/grievances", grievanceRoutes);
// ========================================
// MANDI CACHE
// ========================================

let mandiCache = null;
let mandiCacheTime = 0;

const CACHE_DURATION = 10 * 60 * 1000;

// ========================================
// NORMALIZE MANDI DATA
// ========================================
// Government API uses:
// min_price, max_price, modal_price, arrival_date
//
// Frontend uses:
// minPrice, maxPrice, modalPrice, arrivalDate
//
// This function converts Government API data
// into the format already expected by frontend.

function normalizeMandiData(data) {
  return {
    ...data,

    records: Array.isArray(data?.records)
      ? data.records.map((item) => ({
          ...item,

          commodity: item.commodity || "",
          market: item.market || "",
          variety: item.variety || "",
          grade: item.grade || "",
          district: item.district || "",
          state: item.state || "",

          minPrice: item.minPrice ?? item.min_price ?? null,

          maxPrice: item.maxPrice ?? item.max_price ?? null,

          modalPrice: item.modalPrice ?? item.modal_price ?? null,

          arrivalDate:
            item.arrivalDate ??
            item.arrival_date ??
            item.arrival_date_time ??
            "",
        }))
      : [],
  };
}

function addPriceHistory(data) {
  const records = data.records.map((item) => {
    const key =
      `${item.commodity}-${item.market}`.toLowerCase();

    const current = Number(item.modalPrice || 0);
    const previous = Number(mandiHistory[key]?.modalPrice || 0);

    const change =
      previous > 0
        ? ((current - previous) / previous) * 100
        : null;

    return {
      ...item,
      previousModalPrice: previous || null,
      change,
      type:
        change === null
          ? null
          : change > 0
          ? "up"
          : change < 0
          ? "down"
          : "same",
    };
  });

  records.forEach((item) => {
    const key =
      `${item.commodity}-${item.market}`.toLowerCase();

    mandiHistory[key] = {
      modalPrice: Number(item.modalPrice),
      updatedAt: new Date().toISOString(),
    };
  });

  fs.writeFileSync(
    mandiHistoryFile,
    JSON.stringify(mandiHistory, null, 2)
  );

  return {
    ...data,
    records,
  };
}
// ========================================
// CROP IMAGE CACHE
// ========================================

const cropImageCache = new Map();

// ========================================
// CLEAN CROP NAME
// ========================================

function cleanCropName(crop) {
  return String(crop || "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[-_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// ========================================
// LOCAL CROP IMAGE MAP
// ========================================
// IMPORTANT:
// These paths point to images available from
// your frontend public/images/crops folder.
//
// No random Wikimedia image is used.

function getLocalCropImage(crop) {
  const name = cleanCropName(crop);

  const imageMap = {
    // Cereals
    wheat: "/images/crops/wheat.jpg",

    rice: "/images/crops/rice.jpg",
    paddy: "/images/crops/rice.jpg",

    maize: "/images/crops/maize.jpg",
    corn: "/images/crops/maize.jpg",

    // Pulses
    chickpea: "/images/crops/chickpea.jpg",
    gram: "/images/crops/chickpea.jpg",
    "bengal gram": "/images/crops/chickpea.jpg",

    // Vegetables
    tomato: "/images/crops/tomato.jpg",

    cauliflower: "/images/crops/cauliflower.jpg",

    ashgourd: "/images/crops/ashgourd.jpg",

    cucumber: "/images/crops/cucumber.jpg",
    kheera: "/images/crops/cucumber.jpg",

    "cluster beans": "/images/crops/cluster-beans.jpg",

    "green avare": "/images/crops/green-avare.jpg",
    "green avare w": "/images/crops/green-avare.jpg",

    // Fruits
    banana: "/images/crops/banana.jpg",

    lemon: "/images/crops/lemon.jpg",

    // Others
    cotton: "/images/crops/cotton.jpg",

    turmeric: "/images/crops/turmeric.jpeg",

    drumstick: "/images/crops/drumstick.jpg",
    moringa: "/images/crops/drumstick.jpg",
  };

  for (const [key, image] of Object.entries(imageMap)) {
    if (name.includes(key)) {
      return image;
    }
  }

  // Unknown crop
  return "/images/crops/default.jpg";
}

// ========================================
// CROP IMAGE API
// ========================================

app.get("/api/crop-image", async (req, res) => {
  try {
    const crop = String(req.query.crop || "").trim();

    // Validate crop name
    if (!crop) {
      return res.status(400).json({
        success: false,
        message: "Crop name is required",
      });
    }

    const cacheKey = cleanCropName(crop);

    // ========================================
    // RETURN CACHED IMAGE
    // ========================================

    if (cropImageCache.has(cacheKey)) {
      return res.json({
        success: true,
        crop,
        image: cropImageCache.get(cacheKey),
        source: "cache",
      });
    }

    // ========================================
    // LOCAL IMAGE ONLY
    // ========================================

    const localImage = getLocalCropImage(crop);

    cropImageCache.set(cacheKey, localImage);

    // ========================================
    // RETURN LOCAL / DEFAULT IMAGE
    // ========================================

    if (localImage !== "/images/crops/default.jpg") {
      return res.json({
        success: true,
        crop,
        image: localImage,
        source: "local",
      });
    }

    // ========================================
    // UNKNOWN CROP
    // ========================================

    return res.json({
      success: true,
      crop,
      image: "/images/crops/default.jpg",
      source: "fallback",
    });
  } catch (error) {
    console.error("❌ Crop image error:", error);

    return res.json({
      success: true,
      crop: req.query.crop || "",
      image: "/images/crops/default.jpg",
      source: "fallback",
    });
  }
});

// ========================================
// MANDI PRICES API
// ========================================

app.get("/api/mandi-prices", async (req, res) => {
  try {
    // ========================================
    // 1. RETURN RAM CACHE
    // ========================================

    const requestedLimit = Number(req.query.limit) || 20;

if (
  mandiCache &&
  Array.isArray(mandiCache.records) &&
  mandiCache.records.length >= requestedLimit &&
  Date.now() - mandiCacheTime < CACHE_DURATION
) {
  console.log(
    `✅ Returning RAM cached mandi data (${requestedLimit} records)`
  );

  return res.json({
    ...mandiCache,
    records: mandiCache.records.slice(
      0,
      requestedLimit
    ),
  });
}

    // ========================================
    // 2. CHECK API KEY
    // ========================================

    const apiKey = process.env.DATA_GOV_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "DATA_GOV_API_KEY is missing in .env",
      });
    }

    // ========================================
    // 3. GOVERNMENT API
    // ========================================

    const apiUrl =
      "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070" +
      `?api-key=${encodeURIComponent(apiKey.trim())}` +
      "&format=json" +
      `&limit=${requestedLimit}`;

    console.log("🌾 Calling Government Mandi API...");

    console.log("📌 Requested limit:", requestedLimit);

    const response = await fetch(apiUrl);

    const text = await response.text();

    console.log("Government API status:", response.status);

    // ========================================
    // 4. GOVERNMENT API ERROR
    // ========================================

    if (!response.ok) {
      console.error("❌ Government API response:", text);

      // ----------------------------------------
      // RAM CACHE
      // ----------------------------------------

      if (
        mandiCache &&
        Array.isArray(mandiCache.records) &&
        mandiCache.records.length > 0
      ) {
        console.log("⚠️ Returning RAM cached mandi data");

        return res.json(mandiCache);
      }

      // ----------------------------------------
      // FILE CACHE
      // ----------------------------------------

      if (fs.existsSync(mandiCacheFile)) {
        try {
          const cachedData = JSON.parse(
            fs.readFileSync(mandiCacheFile, "utf-8"),
          );

          const normalizedCache = normalizeMandiData(cachedData);

          if (
            Array.isArray(normalizedCache.records) &&
            normalizedCache.records.length > 0
          ) {
            console.log("⚠️ Government API unavailable.");

            console.log("📦 Returning previous mandi data from file cache.");

            mandiCache = normalizedCache;

            mandiCacheTime = Date.now();

            return res.json(normalizedCache);
          }
        } catch (cacheError) {
          console.error("❌ Failed to read mandi cache:", cacheError.message);
        }
      }

      // ----------------------------------------
      // NO CACHE AVAILABLE
      // ----------------------------------------

      return res.status(500).json({
        success: false,
        message: "Government API request failed",
        governmentStatus: response.status,
        details: text,
      });
    }

    // ========================================
    // 5. PARSE GOVERNMENT RESPONSE
    // ========================================

    const data = JSON.parse(text);

    if (!Array.isArray(data?.records)) {
      throw new Error("Government API returned no records");
    }

    // ========================================
    // 6. NORMALIZE DATA
    // ========================================

    const normalizedData = addPriceHistory(
  normalizeMandiData(data)
);

    // ========================================
    // 7. SAVE RAM CACHE
    // ========================================

    mandiCache = normalizedData;

    mandiCacheTime = Date.now();

    // ========================================
    // 8. SAVE FILE CACHE
    // ========================================

    fs.writeFileSync(
      mandiCacheFile,
      JSON.stringify(normalizedData, null, 2),
      "utf-8",
    );

    console.log("✅ Fresh mandi data saved:", normalizedData.records.length);

    console.log("💾 Cache file:", mandiCacheFile);

    // ========================================
    // 9. RETURN DATA
    // ========================================

    return res.json(normalizedData);
  } catch (error) {
    console.error("❌ Mandi API error:", error);

    // ========================================
    // RAM CACHE FALLBACK
    // ========================================

    if (
      mandiCache &&
      Array.isArray(mandiCache.records) &&
      mandiCache.records.length > 0
    ) {
      console.log("⚠️ Returning RAM cached mandi data after error");

      return res.json(mandiCache);
    }

    // ========================================
    // FILE CACHE FALLBACK
    // ========================================

    if (fs.existsSync(mandiCacheFile)) {
      try {
        const cachedData = JSON.parse(fs.readFileSync(mandiCacheFile, "utf-8"));

        const normalizedCache = normalizeMandiData(cachedData);

        if (
          Array.isArray(normalizedCache.records) &&
          normalizedCache.records.length > 0
        ) {
          console.log("⚠️ Returning file cached mandi data after error");

          mandiCache = normalizedCache;

          mandiCacheTime = Date.now();

          return res.json(normalizedCache);
        }
      } catch (cacheError) {
        console.error("❌ Failed to read mandi cache:", cacheError.message);
      }
    }

    // ========================================
    // NO CACHE AVAILABLE
    // ========================================

    return res.status(500).json({
      success: false,
      message: "Unable to fetch mandi prices",
      error: error.message,
    });
  }
});

// ========================================
// HOME / HEALTH
// ========================================

app.get("/", (req, res) => {
  res.json({
    message: "Bharat Fasal API is running 🌾",
  });
});

// ========================================
// CONNECT TO DATABASE
// ========================================

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🌾 Bharat Fasal API running on http://localhost:${PORT}`);

    console.log(
      `🔐 DATA_GOV_API_KEY: ${
        process.env.DATA_GOV_API_KEY ? "loaded" : "missing"
      }`,
    );
  });
};

startServer();
