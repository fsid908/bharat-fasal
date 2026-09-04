import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY;

const MANDI_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";

const MANDI_API_URL = `https://api.data.gov.in/resource/${MANDI_RESOURCE_ID}`;

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  }),
);

app.use(express.json());

// =====================================================
// CACHE
// =====================================================

let mandiCache = null;
let mandiCacheTime = 0;

const CACHE_DURATION = 5 * 60 * 1000;

// =====================================================
// HELPERS
// =====================================================

function cleanCropName(crop) {
  return String(crop || "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[-_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function toNumber(value) {
  const number = Number(String(value || "").replace(/,/g, ""));

  return Number.isFinite(number) ? number : null;
}

function normalizeMandiRecord(record) {
  return {
    state: record.state || "",
    district: record.district || "",
    market: record.market || "",
    commodity: record.commodity || "",
    variety: record.variety || "",
    grade: record.grade || "",

    arrivalDate: record.arrival_date || "",

    minPrice: toNumber(record.min_price),
    maxPrice: toNumber(record.max_price),
    modalPrice: toNumber(record.modal_price),
  };
}

// =====================================================
// FETCH WITH TIMEOUT
// =====================================================

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

// =====================================================
// CROP IMAGE MAP
// =====================================================

const cropImageCache = new Map();

function getLocalCropImage(crop) {
  const name = cleanCropName(crop);

  const imageMap = {
    wheat: "/images/crops/wheat.jpg",
    rice: "/images/crops/rice.jpg",
    paddy: "/images/crops/rice.jpg",
    tomato: "/images/crops/tomato.jpeg",
    cotton: "/images/crops/cotton.jpg",
    chickpea: "/images/crops/chickpea.jpg",
    turmeric: "/images/crops/turmeric.jpeg",
  };

  for (const [key, image] of Object.entries(imageMap)) {
    if (name.includes(key)) {
      return image;
    }
  }

  return "/images/crops/default.jpg";
}

// =====================================================
// CROP IMAGE API
// =====================================================

app.get("/api/crop-image", async (req, res) => {
  try {
    const crop = String(req.query.crop || "").trim();

    if (!crop) {
      return res.status(400).json({
        success: false,
        message: "Crop name is required",
      });
    }

    const cacheKey = cleanCropName(crop);

    // CACHE
    if (cropImageCache.has(cacheKey)) {
      return res.json({
        success: true,
        crop,
        image: cropImageCache.get(cacheKey),
        source: "cache",
      });
    }

    // LOCAL IMAGE
    const localImage = getLocalCropImage(crop);

    if (localImage !== "/images/crops/default.jpg") {
      cropImageCache.set(cacheKey, localImage);

      return res.json({
        success: true,
        crop,
        image: localImage,
        source: "local",
      });
    }

    // WIKIMEDIA FALLBACK
    const searchQuery = encodeURIComponent(`${crop} crop agriculture`);

    const wikiUrl =
      "https://commons.wikimedia.org/w/api.php" +
      "?action=query" +
      "&generator=search" +
      `&gsrsearch=${searchQuery}` +
      "&gsrnamespace=6" +
      "&gsrlimit=5" +
      "&prop=imageinfo" +
      "&iiprop=url" +
      "&iiurlwidth=600" +
      "&format=json" +
      "&origin=*";

    const response = await fetchWithTimeout(wikiUrl, {}, 8000);

    if (response.ok) {
      const data = await response.json();

      const pages = data?.query?.pages ? Object.values(data.query.pages) : [];

      const imagePage = pages.find(
        (page) => page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url,
      );

      const imageUrl =
        imagePage?.imageinfo?.[0]?.thumburl || imagePage?.imageinfo?.[0]?.url;

      if (imageUrl) {
        cropImageCache.set(cacheKey, imageUrl);

        return res.json({
          success: true,
          crop,
          image: imageUrl,
          source: "wikimedia",
        });
      }
    }

    // FALLBACK
    const fallback = "/images/crops/default.jpg";

    cropImageCache.set(cacheKey, fallback);

    return res.json({
      success: true,
      crop,
      image: fallback,
      source: "fallback",
    });
  } catch (error) {
    console.error("Crop image error:", error.message);

    return res.json({
      success: true,
      crop: req.query.crop || "",
      image: "/images/crops/default.jpg",
      source: "fallback",
    });
  }
});

// =====================================================
// MANDI PRICES API
// =====================================================

app.get("/api/mandi-prices", async (req, res) => {
  try {
    // API KEY CHECK
    if (!DATA_GOV_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "DATA_GOV_API_KEY is missing in .env",
      });
    }

    // LIMIT
    const requestedLimit = Number(req.query.limit || 20);

    const limit = Math.min(Math.max(requestedLimit, 1), 100);

    // CACHE
    if (mandiCache && Date.now() - mandiCacheTime < CACHE_DURATION) {
      console.log("Returning cached mandi data");

      return res.json({
        ...mandiCache,
        cached: true,
      });
    }

    // GOVERNMENT API REQUEST
    const params = new URLSearchParams();

    params.set("api-key", DATA_GOV_API_KEY);

    params.set("format", "json");

    params.set("offset", "0");

    params.set("limit", "100");

    const apiUrl = `${MANDI_API_URL}?${params.toString()}`;

    console.log("======================================");

    console.log("Calling Government Mandi API...");

    console.log("======================================");

    const response = await fetchWithTimeout(
      apiUrl,
      {
        headers: {
          Accept: "application/json",
        },
      },
      15000,
    );

    const text = await response.text();

    console.log("Government API status:", response.status);

    // GOVERNMENT API ERROR
    if (!response.ok) {
      console.error("======================================");

      console.error("GOVERNMENT API ERROR");

      console.error("Status:", response.status);

      console.error("Response:", text);

      console.error("======================================");

      return res.status(502).json({
        success: false,
        message: "Government API request failed",
        governmentStatus: response.status,
        details: text,
      });
    }

    // PARSE RESPONSE
    let data;

    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error("Government API returned invalid JSON");
    }

    if (!Array.isArray(data?.records)) {
      throw new Error("Government API returned no records");
    }

    console.log("Records received:", data.records.length);

    // =================================================
    // SORT BY ARRIVAL DATE
    // =================================================

    const sortedRecords = [...data.records].sort((a, b) => {
      const dateA = String(a.arrival_date || "");

      const dateB = String(b.arrival_date || "");

      return dateB.localeCompare(dateA);
    });

    // =================================================
    // LATEST REPORTING DATE
    // =================================================

    const latestReportingDate = sortedRecords[0]?.arrival_date || "";

    console.log("Latest reporting date:", latestReportingDate);

    // =================================================
    // ONLY LATEST DATE RECORDS
    // =================================================

    const latestRecords = latestReportingDate
      ? sortedRecords.filter(
          (record) =>
            String(record.arrival_date || "") === String(latestReportingDate),
        )
      : sortedRecords;

    // =================================================
    // NORMALIZE
    // =================================================

    const records = latestRecords
      .map(normalizeMandiRecord)
      .filter(
        (record) =>
          record.commodity && record.market && record.modalPrice !== null,
      )
      .slice(0, limit);

    // =================================================
    // RESULT
    // =================================================

    const result = {
      success: true,

      source: "Government of India - data.gov.in / AGMARKNET",

      resourceId: MANDI_RESOURCE_ID,

      fetchedAt: new Date().toISOString(),

      latestReportingDate,

      count: records.length,

      records,
    };

    // SAVE CACHE
    mandiCache = result;

    mandiCacheTime = Date.now();

    console.log(`Fresh mandi data saved: ${records.length} records`);

    console.log("Latest reporting date:", latestReportingDate);

    // SEND RESPONSE
    return res.json(result);
  } catch (error) {
    console.error("Mandi API error:", error.message);

    // STALE CACHE
    if (mandiCache) {
      console.log("Returning stale cached data");

      return res.json({
        ...mandiCache,
        cached: true,
        stale: true,
      });
    }

    return res.status(503).json({
      success: false,
      message: "Unable to fetch mandi prices",
      error: error.message,
    });
  }
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,

    message: "Bharat Fasal API is running 🌾",

    services: {
      mandiPrices: "/api/mandi-prices",

      cropImage: "/api/crop-image",
    },
  });
});

// =====================================================
// SERVER
// =====================================================

app.listen(PORT, () => {
  console.log(`🌾 Bharat Fasal API running on http://localhost:${PORT}`);
});
