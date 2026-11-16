import express from "express";

const router = express.Router();

const PIB_URL =
  "https://www.pib.gov.in/newsite/pmreleases.aspx?lang=2&mincode=27&reg=3";

const CACHE_TIME = 15 * 60 * 1000;

let newsCache = [];
let cacheTime = 0;

const clean = (text = "") =>
  text
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

function parsePIB(html) {
  const news = [];

  // PIB releases are inside list items and use Getrelease(relid)
  const blocks = html.match(/<li\b[^>]*>[\s\S]*?<\/li>/gi) || [];

  for (const block of blocks) {
    const idMatch = block.match(/Getrelease\s*\(\s*['"]?(\d+)['"]?\s*\)/i);

    if (!idMatch) continue;

    const id = idMatch[1];
    let text = clean(block);

    // Remove date from title
    text = text
      .replace(/\(\s*\d{1,2}[-/]\w+[-/]\d{4}\s*\)/gi, "")
      .replace(/\(\s*\d{1,2}\s+\w+\s+\d{4}\s*\)/gi, "")
      .trim();

    if (!text || text.length < 10) continue;

    if (news.some((item) => item.id === `pib-${id}`)) continue;

    const dateMatch = block.match(
      /(\d{1,2})[-/](\w+)[-/](\d{4})|(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i,
    );

    news.push({
      id: `pib-${id}`,
      title: text,
      link: `https://www.pib.gov.in/newsite/erelcontent.aspx?relid=${id}&reg=3&lang=2`,
      publishedAt: dateMatch ? dateMatch[0] : "",
      source: "PIB",
    });

    if (news.length === 6) break;
  }

  return news;
}

router.get("/", async (req, res) => {
  try {
    // Cache
    if (newsCache.length && Date.now() - cacheTime < CACHE_TIME) {
      return res.json({
        success: true,
        news: newsCache,
        cached: true,
      });
    }

    console.log("📰 Fetching PIB agriculture releases...");

    const response = await fetch(PIB_URL, {
      headers: {
        Accept: "text/html",
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      throw new Error(`PIB returned ${response.status}`);
    }

    const html = await response.text();
    const news = parsePIB(html);

    console.log("📰 PIB releases found:", news.length);

    if (!news.length) {
      throw new Error("No PIB agriculture releases found");
    }

    newsCache = news;
    cacheTime = Date.now();

    return res.json({
      success: true,
      news,
      cached: false,
    });
  } catch (error) {
    console.error("❌ Market news error:", error.message);

    if (newsCache.length) {
      return res.json({
        success: true,
        news: newsCache,
        cached: true,
        stale: true,
      });
    }

    return res.status(502).json({
      success: false,
      message: "Unable to fetch market news right now.",
      news: [],
    });
  }
});

export default router;
