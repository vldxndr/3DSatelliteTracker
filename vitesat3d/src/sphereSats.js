import * as THREE from 'three';
import * as satellite from 'satellite.js';

const EARTH_RADIUS = 0.6371;

export async function fetchSats() {
    try {
        const response = await fetch("http://localhost:3000/tle-first-1000");
        if (!response.ok) {
            throw new Error("Failed to fetch satellites");
        }
        const data = await response.json();
        console.log("Fetched satellites:", data.length);
        console.log("Fetched satellites example:", data[0]);
        return data;
    } catch (error) {
        console.error("Error fetching satellites:", error);
        return [];
    }
}

export async function createSatMeshes(satData) {
    const satMeshes = [];
    const satObjects = [];
    const now = new Date();
    const gmst = satellite.gstime(now);
  
    for (const sat of satData) {
      try {
        if (!sat.tle) continue;
  
        const lines = sat.tle.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        if (lines.length < 2) continue;
  
        const [line1, line2] = lines;
        const satrec = satellite.twoline2satrec(line1, line2);
        const positionEci = satellite.propagate(satrec, now);
        if (!positionEci?.position) continue;
  
        const positionGd = satellite.eciToGeodetic(positionEci.position, gmst);
  
        const r = EARTH_RADIUS + (positionGd.height / 6371);
        const x = r * Math.cos(positionGd.latitude) * Math.cos(positionGd.longitude);
        const y = r * Math.sin(positionGd.latitude);
        const z = r * Math.cos(positionGd.latitude) * Math.sin(positionGd.longitude);
  
        const geometry = new THREE.SphereGeometry(0.02, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
  
        mesh.userData = {
          satInfo: {
            name: sat.info?.satname || "Unknown",
            id: sat.info?.satid || "N/A"
          }
        };
  
        satMeshes.push(mesh);
        satObjects.push({ mesh, satrec }); // store satrec for motion updates
      } catch (err) {
        console.warn("Error processing sat:", err);
      }
    }
  
    return { satMeshes, satObjects };
  }
  
