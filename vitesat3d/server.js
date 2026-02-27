import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());

// ─── Config ──────────────────────────────────────────────────────────────────
const SATELLITE_LIMIT       = 2000;                      // how many sats to serve
const TLE_CACHE_PATH        = path.resolve("./cache/tleCache.json");
const SATCAT_CACHE_PATH     = path.resolve("./cache/satcatCache.json");
const TLE_CACHE_LIFETIME    =  6 * 60 * 60 * 1000;      // 6 hours
const SATCAT_CACHE_LIFETIME =  7 * 24 * 60 * 60 * 1000; // 7 days

// ─── TLE (CelesTrak bulk download) ───────────────────────────────────────────
function parseTleText(text) {
  const lines = text.trim().split("\n").map(l => l.trim()).filter(Boolean);
  const sats = [];

  for (let i = 0; i < lines.length - 2; i += 3) {
    const name  = lines[i];
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];

    if (!line1.startsWith("1 ") || !line2.startsWith("2 ")) continue;

    const noradId = parseInt(line1.substring(2, 7).trim(), 10);
    sats.push({
      info: { satname: name.trim(), satid: noradId },
      tle:  `${line1}\n${line2}`,
    });
  }
  return sats;
}

async function getTLEs() {
  if (fs.existsSync(TLE_CACHE_PATH)) {
    try {
      const cached = JSON.parse(fs.readFileSync(TLE_CACHE_PATH, "utf8"));
      if (cached.timestamp && Date.now() - cached.timestamp < TLE_CACHE_LIFETIME) {
        console.log(`✅ Using cached TLE data (${cached.data.length} satellites)`);
        return cached.data;
      }
    } catch { /* corrupt, re-fetch */ }
  }

  console.log("🌍 Fetching TLE data from CelesTrak...");
  const res = await fetch("https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=TLE");
  if (!res.ok) throw new Error(`CelesTrak TLE fetch failed: ${res.status}`);

  const sats = parseTleText(await res.text());
  fs.writeFileSync(TLE_CACHE_PATH, JSON.stringify({ timestamp: Date.now(), data: sats }), "utf8");
  console.log(`💾 TLE data cached (${sats.length} satellites)`);
  return sats;
}

// ─── CelesTrak satcat (metadata) ─────────────────────────────────────────────
const STATUS_LABELS = {
  "+": "Operational",      "-": "Non-operational",
  "P": "Partially operational", "B": "Standby",
  "S": "Spare",            "X": "Extended mission",
  "D": "Decayed",          "?": "Unknown",
};

const OBJECT_TYPE_LABELS = {
  "PAY": "Payload", "R/B": "Rocket Body", "DEB": "Debris", "TBA": "Unknown",
};

function inferPurpose(name = "") {
  const n = name.toUpperCase();
  if (/STARLINK/.test(n))                                           return "Communications";
  if (/ONEWEB/.test(n))                                            return "Communications";
  if (/IRIDIUM/.test(n))                                           return "Communications";
  if (/INTELSAT|INMARSAT|SES-|ASTRA|EUTELSAT|VIASAT/.test(n))     return "Communications";
  if (/GPS|NAVSTAR/.test(n))                                       return "Navigation";
  if (/GLONASS/.test(n))                                           return "Navigation";
  if (/GALILEO/.test(n))                                           return "Navigation";
  if (/BEIDOU|COMPASS/.test(n))                                    return "Navigation";
  if (/NOAA|GOES|METEOSAT|METOP|FENG YUN|HIMAWARI|INSAT/.test(n)) return "Weather";
  if (/LANDSAT|SENTINEL|TERRA|AQUA|SPOT|WORLDVIEW|PLEIADES/.test(n)) return "Earth Observation";
  if (/ISS|ZARYA|ZVEZDA|TIANGONG|MIR/.test(n))                    return "Space Station";
  if (/HUBBLE|HST|JAMES WEBB|CHANDRA|SPITZER/.test(n))            return "Space Telescope";
  return null;
}

function parseSatcatCsv(csv) {
  const lines   = csv.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  const map     = {};

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < headers.length) continue;
    const entry = {};
    headers.forEach((h, idx) => { entry[h] = cols[idx]?.trim() ?? ""; });
    const id = String(entry.NORAD_CAT_ID);
    if (id) map[id] = entry;
  }
  return map;
}

async function getSatcat() {
  if (fs.existsSync(SATCAT_CACHE_PATH)) {
    try {
      const cached = JSON.parse(fs.readFileSync(SATCAT_CACHE_PATH, "utf8"));
      if (cached.timestamp && Date.now() - cached.timestamp < SATCAT_CACHE_LIFETIME) {
        console.log("✅ Using cached CelesTrak satcat");
        return cached.data;
      }
    } catch { /* re-fetch */ }
  }

  console.log("🌍 Fetching CelesTrak satcat...");
  const res = await fetch("https://celestrak.org/pub/satcat.csv");
  if (!res.ok) throw new Error(`CelesTrak satcat fetch failed: ${res.status}`);

  const map = parseSatcatCsv(await res.text());
  fs.writeFileSync(SATCAT_CACHE_PATH, JSON.stringify({ timestamp: Date.now(), data: map }), "utf8");
  console.log(`💾 CelesTrak satcat cached (${Object.keys(map).length} satellites)`);
  return map;
}

function enrichWithSatcat(sat, satcat) {
  const meta = satcat[String(sat.info?.satid)];
  if (!meta) return sat;

  const period      = parseFloat(meta.PERIOD);
  const inclination = parseFloat(meta.INCLINATION);
  const apogee      = parseInt(meta.APOGEE);
  const perigee     = parseInt(meta.PERIGEE);

  return {
    ...sat,
    celestrak: {
      status:      STATUS_LABELS[meta.OPS_STATUS_CODE]      ?? "Unknown",
      owner:       meta.OWNER       || null,
      launchDate:  meta.LAUNCH_DATE || null,
      launchSite:  meta.LAUNCH_SITE || null,
      period:      !isNaN(period)      ? Math.round(period * 10) / 10      : null,
      inclination: !isNaN(inclination) ? Math.round(inclination * 10) / 10 : null,
      apogee:      !isNaN(apogee)      ? apogee   : null,
      perigee:     !isNaN(perigee)     ? perigee  : null,
      objectType:  OBJECT_TYPE_LABELS[meta.OBJECT_TYPE] ?? meta.OBJECT_TYPE ?? null,
      purpose:     inferPurpose(sat.info?.satname ?? ""),
    },
  };
}

// ─── Route ────────────────────────────────────────────────────────────────────
app.get("/tle-first-1000", async (req, res) => {
  let tleData, satcat = {};

  try {
    const all = await getTLEs();
    tleData = all.slice(0, SATELLITE_LIMIT);
  } catch (e) {
    console.error("❌ TLE fetch failed:", e.message);
    return res.status(500).json({ error: "Failed to fetch satellite data" });
  }

  try {
    satcat = await getSatcat();
  } catch (e) {
    console.warn("⚠️  CelesTrak satcat unavailable:", e.message);
  }

  res.json(tleData.map(sat => enrichWithSatcat(sat, satcat)));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
