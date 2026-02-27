# 3D Satellite Tracker

A real-time 3D satellite tracking visualizer running in the browser. See 2,000+ active satellites orbiting Earth, click any one to get detailed information about it, and search by name.

---

## Features

- **Real-time orbital tracking** — satellite positions are computed every frame using SGP4 propagation
- **2,000+ active satellites** — pulled from CelesTrak's live catalog, refreshed every 6 hours
- **Satellite info panel** — click any satellite to see its name, NORAD ID, status, owner (with country flag), launch date, launch site, orbital period, inclination, apogee, and perigee
- **Purpose classification** — automatically labels satellites by function (Communications, Navigation, Weather, Earth Observation, Space Station, etc.)
- **Name search** — search for any satellite by name and jump to it
- **High-res textures** — 8K Earth, Moon, and star field
- **Performant rendering** — uses `THREE.InstancedMesh` for a single draw call across all satellites

---

## Tech Stack

| Layer | Tech |
|---|---|
| 3D rendering | [Three.js](https://threejs.org/) |
| Orbital mechanics | [satellite.js](https://github.com/shashwatak/satellite-js) (SGP4) |
| Frontend bundler | [Vite](https://vitejs.dev/) |
| Backend | [Express](https://expressjs.com/) + [node-fetch](https://github.com/node-fetch/node-fetch) |
| TLE data | [CelesTrak](https://celestrak.org/) — active satellite group |
| Satellite metadata | [CelesTrak satcat](https://celestrak.org/pub/satcat.csv) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A free [N2YO API key](https://www.n2yo.com/api/) *(optional — only needed if switching back to N2YO for TLE data)*

### Install

```bash
git clone https://github.com/vldxndr/3DSatelliteTracker.git
cd 3DSatelliteTracker
npm install
```

### Configure

Create a `.env` file in the root:

```
N2YO_API_KEY=your_key_here
```

### Run

Start the backend (port 3000):

```bash
node server.js
```

Start the frontend (port 5173):

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## How It Works

1. On startup the backend fetches the full active satellite TLE catalog from CelesTrak (~14,500 satellites) and caches it locally for 6 hours
2. It also fetches CelesTrak's satellite catalog (satcat) for metadata — owner, launch date, orbital parameters, etc. — cached for 7 days
3. The frontend requests the first 2,000 satellites from the backend, already enriched with metadata
4. Three.js renders them as a single `InstancedMesh` over a textured 3D Earth
5. Every animation frame, `satellite.js` propagates each satellite's TLE to its current real-world position using the SGP4 model

---

## Controls

| Action | Control |
|---|---|
| Rotate view | Click + drag |
| Zoom | Scroll wheel |
| Select satellite | Click on it |
| Deselect / reset camera | `Escape` |
| Search by name | Search bar (bottom left) |

---

## Data Sources

- **TLE orbital elements** — [CelesTrak active satellites](https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=TLE)
- **Satellite catalog metadata** — [CelesTrak satcat](https://celestrak.org/pub/satcat.csv)
- **Earth texture** — 8K NASA day map
- **Moon & star textures** — Solar System Scope
