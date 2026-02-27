# 3D Satellite Tracker

A real-time 3D satellite tracking visualizer running in the browser. Watch 2,000+ active satellites orbit Earth live, click any one to pull up detailed information, and search by name.

---

## Demo

> Hosted on Render — first load after inactivity may take ~30 seconds to wake up.

---

## What It Does

- Renders 2,000+ active satellites in real-time over a 3D Earth
- Satellite positions are computed every frame from live orbital data using the SGP4 propagation model
- Click any satellite to see its full profile: name, NORAD ID, operational status, country of origin (with flag), launch date, launch site, purpose, orbital period, inclination, apogee, and perigee
- Satellites are automatically categorized by purpose — Communications, Navigation, Weather, Earth Observation, Space Station, and more
- Search any satellite by name and the camera flies to it
- Press `Escape` to deselect and return to Earth view

---

## How It Works

The backend fetches the full active satellite catalog from CelesTrak on startup — around 14,500 satellites with their TLE (Two-Line Element) orbital data, plus a separate metadata catalog covering launch info, ownership, and orbital parameters. There is no database; data comes directly from CelesTrak's public API and is cached for the duration of the session.

The frontend receives 2,000 of those satellites, already enriched with metadata, and renders them using Three.js as a single instanced mesh for performance. Every animation frame, satellite.js runs SGP4 propagation on each satellite's TLE set to compute its exact real-world position.

---

## Controls

| Action | Control |
|---|---|
| Rotate | Click + drag |
| Zoom | Scroll wheel |
| Select satellite | Click on it |
| Deselect / reset camera | `Escape` |
| Search | Search bar — bottom left |

---

## Tech Stack

| | |
|---|---|
| 3D rendering | [Three.js](https://threejs.org/) |
| Orbital mechanics | [satellite.js](https://github.com/shashwatak/satellite-js) — SGP4 propagation |
| Frontend | [Vite](https://vitejs.dev/) |
| Backend | [Express](https://expressjs.com/) |
| TLE data | [CelesTrak](https://celestrak.org/) — active satellite group |
| Satellite metadata | [CelesTrak satcat](https://celestrak.org/pub/satcat.csv) |
| Hosting | [Render](https://render.com) |

---

## Running Locally

```bash
git clone https://github.com/vldxndr/3DSatelliteTracker.git
cd 3DSatelliteTracker
npm install
```

Start the backend:
```bash
node server.js
```

Start the frontend in a second terminal:
```bash
npm run dev
```

Open `http://localhost:5173`.

---

## Data Sources

- **Orbital elements** — [CelesTrak active satellites](https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=TLE)
- **Satellite metadata** — [CelesTrak satcat](https://celestrak.org/pub/satcat.csv)
- **Earth texture** — 8K NASA day map
- **Moon & star textures** — Solar System Scope
