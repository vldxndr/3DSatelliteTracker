import express from "express";
import fetch from "node-fetch";
import satellites from "./public/satellites.json" assert { type: "json" };
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = 3000;
const API_KEY = process.env.N2YO_API_KEY;

app.use(cors());

const CACHE_PATH = path.resolve("./cache/satellitesCache.json");

// Helper: read cache file
function readCache() {
  if (fs.existsSync(CACHE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
    } catch (err) {
      console.warn("Cache corrupted, starting fresh:", err);
      return [];
    }
  }
  return [];
}

// Helper: write cache file
function writeCache(data) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2), "utf8");
}

app.get("/tle-first-1000", async (req, res) => {
  let cache = readCache();

  // Optional: expire cache after 24 hours
  const CACHE_LIFETIME = 24 * 60 * 60 * 1000; // 24 hours
  const cacheValid = cache.timestamp && (Date.now() - cache.timestamp < CACHE_LIFETIME);

  if (cacheValid && cache.data?.length > 0) {
    console.log("✅ Using cached satellite data");
    return res.json(cache.data);
  }

  console.log("🌍 Fetching fresh satellite data from N2YO...");

  const firstBatch = satellites.slice(0, 100); // you can change 100 -> 1000
  const results = [];

  for (const sat of firstBatch) {
    try {
      const response = await fetch(
        `https://api.n2yo.com/rest/v1/satellite/tle/${sat.id}&apiKey=${API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        results.push(data);
      } else {
        results.push({ id: sat.id, error: "Failed" });
      }

      await new Promise((r) => setTimeout(r, 200)); // avoid hitting rate limit
    } catch (err) {
      results.push({ id: sat.id, error: err.message });
    }
  }

  // Save cache
  cache = {
    timestamp: Date.now(),
    data: results,
  };
  writeCache(cache);

  console.log("💾 Cached satellite data");
  res.json(results);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
