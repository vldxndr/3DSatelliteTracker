import * as THREE from 'three';
import * as satellite from 'satellite.js';

export const EARTH_RADIUS = 0.6371;

export async function fetchSats() {
  try {
    const response = await fetch("/tle-first-1000");
    if (!response.ok) throw new Error("Failed to fetch satellites");
    const data = await response.json();
    console.log("Fetched satellites:", data.length);
    return data;
  } catch (error) {
    console.error("Error fetching satellites:", error);
    return [];
  }
}

export function createSatMeshes(satData) {
  const now  = new Date();
  const gmst = satellite.gstime(now);

  // Single instanced mesh = one draw call for all satellites
  const geometry     = new THREE.SphereGeometry(0.015, 6, 6);
  const material     = new THREE.MeshBasicMaterial();
  const instancedMesh = new THREE.InstancedMesh(geometry, material, satData.length);
  instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
    new Float32Array(satData.length * 3), 3
  );

  const defaultColor = new THREE.Color(0xffd700);
  const matrix       = new THREE.Matrix4();
  const satObjects   = [];

  for (const sat of satData) {
    try {
      if (!sat.tle) continue;

      const lines = sat.tle.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) continue;

      const satrec      = satellite.twoline2satrec(lines[0], lines[1]);
      const positionEci = satellite.propagate(satrec, now);
      if (!positionEci?.position) continue;

      const positionGd = satellite.eciToGeodetic(positionEci.position, gmst);
      const r = EARTH_RADIUS + (positionGd.height / 6371);
      const x = r * Math.cos(positionGd.latitude) * Math.cos(positionGd.longitude);
      const y = r * Math.sin(positionGd.latitude);
      const z = r * Math.cos(positionGd.latitude) * Math.sin(positionGd.longitude);

      const idx = satObjects.length;
      matrix.setPosition(x, y, z);
      instancedMesh.setMatrixAt(idx, matrix);
      instancedMesh.setColorAt(idx, defaultColor);

      satObjects.push({
        idx,
        satrec,
        satInfo: {
          name:        sat.info?.satname      ?? "Unknown",
          id:          sat.info?.satid        ?? "N/A",
          status:      sat.celestrak?.status      ?? null,
          owner:       sat.celestrak?.owner       ?? null,
          launchDate:  sat.celestrak?.launchDate  ?? null,
          launchSite:  sat.celestrak?.launchSite  ?? null,
          period:      sat.celestrak?.period      ?? null,
          inclination: sat.celestrak?.inclination ?? null,
          apogee:      sat.celestrak?.apogee      ?? null,
          perigee:     sat.celestrak?.perigee     ?? null,
          objectType:  sat.celestrak?.objectType  ?? null,
          purpose:     sat.celestrak?.purpose     ?? null,
        },
      });
    } catch {
      // skip malformed TLEs
    }
  }

  // Only render the satellites that parsed successfully
  instancedMesh.count = satObjects.length;
  instancedMesh.instanceMatrix.needsUpdate = true;
  instancedMesh.instanceColor.needsUpdate  = true;

  return { instancedMesh, satObjects };
}
