import * as THREE from 'three';
import * as satellite from 'satellite.js';

import { scene, camera, renderer } from './scene.js';
import { createEarth } from './earth.js';
import { createMoon, createSpace } from './spaceElements.js';
import { createOrbitControls } from './orbitControls.js';
import { createLights } from './lights.js';
import { updateDateTime } from './date.js';
import { createSatMeshes, fetchSats, EARTH_RADIUS } from './sphereSats.js';

// ─── Scene setup ─────────────────────────────────────────────────────────────
const earth = createEarth();
earth.rotation.y = Math.PI / 1.5;

const moon  = createMoon();
const space = createSpace();
const controls = createOrbitControls();
const { directionalLight, ambientLight } = createLights();

moon.position.x = 38.4;

scene.add(earth, moon, space, directionalLight, ambientLight);

// ─── Owner code → flag + name ────────────────────────────────────────────────
const OWNER_FLAGS = {
  // Countries
  'US':    { flag: '🇺🇸', name: 'United States' },
  'CIS':   { flag: '🇷🇺', name: 'Russia' },
  'PRC':   { flag: '🇨🇳', name: 'China' },
  'FR':    { flag: '🇫🇷', name: 'France' },
  'UK':    { flag: '🇬🇧', name: 'United Kingdom' },
  'JPN':   { flag: '🇯🇵', name: 'Japan' },
  'IND':   { flag: '🇮🇳', name: 'India' },
  'ISR':   { flag: '🇮🇱', name: 'Israel' },
  'BRAZ':  { flag: '🇧🇷', name: 'Brazil' },
  'IRAN':  { flag: '🇮🇷', name: 'Iran' },
  'ARGN':  { flag: '🇦🇷', name: 'Argentina' },
  'AUS':   { flag: '🇦🇺', name: 'Australia' },
  'CA':    { flag: '🇨🇦', name: 'Canada' },
  'GER':   { flag: '🇩🇪', name: 'Germany' },
  'IT':    { flag: '🇮🇹', name: 'Italy' },
  'NETH':  { flag: '🇳🇱', name: 'Netherlands' },
  'SPN':   { flag: '🇪🇸', name: 'Spain' },
  'SWED':  { flag: '🇸🇪', name: 'Sweden' },
  'NOR':   { flag: '🇳🇴', name: 'Norway' },
  'TURK':  { flag: '🇹🇷', name: 'Turkey' },
  'UAE':   { flag: '🇦🇪', name: 'UAE' },
  'SAUD':  { flag: '🇸🇦', name: 'Saudi Arabia' },
  'SING':  { flag: '🇸🇬', name: 'Singapore' },
  'KOR':   { flag: '🇰🇷', name: 'South Korea' },
  'NKOR':  { flag: '🇰🇵', name: 'North Korea' },
  'PAKI':  { flag: '🇵🇰', name: 'Pakistan' },
  'THAI':  { flag: '🇹🇭', name: 'Thailand' },
  'TAIWN': { flag: '🇹🇼', name: 'Taiwan' },
  'INDO':  { flag: '🇮🇩', name: 'Indonesia' },
  'MALA':  { flag: '🇲🇾', name: 'Malaysia' },
  'MEX':   { flag: '🇲🇽', name: 'Mexico' },
  'UKR':   { flag: '🇺🇦', name: 'Ukraine' },
  'POL':   { flag: '🇵🇱', name: 'Poland' },
  'BUL':   { flag: '🇧🇬', name: 'Bulgaria' },
  'CZE':   { flag: '🇨🇿', name: 'Czech Republic' },
  'HUNG':  { flag: '🇭🇺', name: 'Hungary' },
  'ROM':   { flag: '🇷🇴', name: 'Romania' },
  'DEN':   { flag: '🇩🇰', name: 'Denmark' },
  'FIN':   { flag: '🇫🇮', name: 'Finland' },
  'GREC':  { flag: '🇬🇷', name: 'Greece' },
  'POR':   { flag: '🇵🇹', name: 'Portugal' },
  'BELG':  { flag: '🇧🇪', name: 'Belgium' },
  'SWTZ':  { flag: '🇨🇭', name: 'Switzerland' },
  'LUXE':  { flag: '🇱🇺', name: 'Luxembourg' },
  'AZER':  { flag: '🇦🇿', name: 'Azerbaijan' },
  'BELA':  { flag: '🇧🇾', name: 'Belarus' },
  'ALG':   { flag: '🇩🇿', name: 'Algeria' },
  'EGYP':  { flag: '🇪🇬', name: 'Egypt' },
  'NIG':   { flag: '🇳🇬', name: 'Nigeria' },
  'SAFR':  { flag: '🇿🇦', name: 'South Africa' },
  'CHLE':  { flag: '🇨🇱', name: 'Chile' },
  'COL':   { flag: '🇨🇴', name: 'Colombia' },
  'VENZ':  { flag: '🇻🇪', name: 'Venezuela' },
  'BOL':   { flag: '🇧🇴', name: 'Bolivia' },
  'ECU':   { flag: '🇪🇨', name: 'Ecuador' },
  'PERU':  { flag: '🇵🇪', name: 'Peru' },
  'URY':   { flag: '🇺🇾', name: 'Uruguay' },
  'RP':    { flag: '🇵🇭', name: 'Philippines' },
  'VTNM':  { flag: '🇻🇳', name: 'Vietnam' },
  'LAOS':  { flag: '🇱🇦', name: 'Laos' },
  'MNG':   { flag: '🇲🇳', name: 'Mongolia' },
  'SLNK':  { flag: '🇱🇰', name: 'Sri Lanka' },
  'SVN':   { flag: '🇸🇮', name: 'Slovenia' },
  'LTU':   { flag: '🇱🇹', name: 'Lithuania' },
  'ROC':   { flag: '🇹🇼', name: 'Taiwan' },
  'SVK':   { flag: '🇸🇰', name: 'Slovakia' },
  'ASTRL': { flag: '🇦🇺', name: 'Australia' },
  'GRCE':  { flag: '🇬🇷', name: 'Greece' },
  // Multi-national / organizations
  'ESA':   { flag: '🇪🇺', name: 'ESA' },
  'EUME':  { flag: '🇪🇺', name: 'EUMETSAT' },
  'EUTE':  { flag: '🇪🇺', name: 'Eutelsat' },
  'SES':   { flag: '🇱🇺', name: 'SES' },
  'INTL':  { flag: '🌍', name: 'International' },
  'ISS':   { flag: '🌍', name: 'ISS Consortium' },
  'NATO':  { flag: '🌍', name: 'NATO' },
  'IM':    { flag: '🌍', name: 'Inmarsat' },
  'IRID':  { flag: '🌍', name: 'Iridium' },
  'ITSO':  { flag: '🌍', name: 'Intelsat' },
  'O3B':   { flag: '🌍', name: 'O3b Networks' },
  'AB':    { flag: '🌍', name: 'Arab Sat' },
  'TMMC':  { flag: '🌍', name: 'Turksat' },
};

// ─── UI helpers ──────────────────────────────────────────────────────────────
function setText(id, value, suffix = "") {
  const el = document.getElementById(id);
  if (el) el.textContent = value != null ? `${value}${suffix}` : "—";
}

function showSatInfo(info) {
  const infoBox = document.getElementById("satInfoBox");
  if (!infoBox) return;

  setText("satName",        info.name);
  setText("satId",          info.id != null ? `NORAD ID: ${info.id}` : "NORAD ID: N/A");
  setText("satStatus",      info.status);
  setText("satType",        info.objectType);
  setText("satPurpose",     info.purpose);
  const ownerEntry = OWNER_FLAGS[info.owner];
  const ownerText  = ownerEntry
    ? `${ownerEntry.flag} ${ownerEntry.name}`
    : (info.owner ?? null);
  setText("satOwner", ownerText);
  setText("satLaunchDate",  info.launchDate);
  setText("satLaunchSite",  info.launchSite);
  setText("satPeriod",      info.period,       " min");
  setText("satInclination", info.inclination,  "°");
  setText("satApogee",      info.apogee,       " km");
  setText("satPerigee",     info.perigee,      " km");

  infoBox.classList.add("visible");
  infoBox.style.pointerEvents = "auto";
}

function hideSatInfo() {
  const infoBox = document.getElementById("satInfoBox");
  if (!infoBox) return;
  infoBox.classList.remove("visible");
  infoBox.style.pointerEvents = "none";
}

// ─── Satellite state ─────────────────────────────────────────────────────────
let instancedMesh = null;
let satObjects    = [];
let selectedIdx   = null;

const DEFAULT_COLOR  = new THREE.Color(0xffd700);
const SELECTED_COLOR = new THREE.Color(0x00ffff);

function selectSatellite(idx) {
  if (selectedIdx !== null) {
    instancedMesh.setColorAt(selectedIdx, DEFAULT_COLOR);
  }

  // Toggle off if clicking the same one
  if (selectedIdx === idx) {
    selectedIdx = null;
    instancedMesh.instanceColor.needsUpdate = true;
    hideSatInfo();
    return;
  }

  instancedMesh.setColorAt(idx, SELECTED_COLOR);
  selectedIdx = idx;
  instancedMesh.instanceColor.needsUpdate = true;

  showSatInfo(satObjects[idx].satInfo);

  // Animate camera toward the satellite
  const mat    = new THREE.Matrix4();
  instancedMesh.getMatrixAt(idx, mat);
  const satPos    = new THREE.Vector3().setFromMatrixPosition(mat);
  const startPos  = camera.position.clone();
  const targetPos = satPos.clone().multiplyScalar(2);
  const startTime = performance.now();
  const duration  = 800;

  function animateToSat(time) {
    const t = Math.min((time - startTime) / duration, 1);
    camera.position.lerpVectors(startPos, targetPos, t);
    controls.target.copy(satPos);
    controls.update();
    if (t < 1) requestAnimationFrame(animateToSat);
  }
  requestAnimationFrame(animateToSat);
}

// ─── Load satellites ──────────────────────────────────────────────────────────
(async () => {
  const satData = await fetchSats();
  const result  = createSatMeshes(satData);

  instancedMesh = result.instancedMesh;
  satObjects    = result.satObjects;

  scene.add(instancedMesh);
  console.log("Loaded satellites:", satObjects.length);
})();

// ─── Keyboard ────────────────────────────────────────────────────────────────
window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  if (selectedIdx !== null) {
    instancedMesh.setColorAt(selectedIdx, DEFAULT_COLOR);
    instancedMesh.instanceColor.needsUpdate = true;
    selectedIdx = null;
  }
  hideSatInfo();

  const startPos    = camera.position.clone();
  const targetPos   = new THREE.Vector3(0, 0, 2);
  const startTime   = performance.now();
  const duration    = 1000;

  function animateBack(time) {
    const t = Math.min((time - startTime) / duration, 1);
    camera.position.lerpVectors(startPos, targetPos, t);
    controls.target.lerp(new THREE.Vector3(0, 0, 0), t * 0.1);
    controls.update();
    if (t < 1) requestAnimationFrame(animateBack);
  }
  requestAnimationFrame(animateBack);
});

// ─── Search ──────────────────────────────────────────────────────────────────
const searchInput = document.getElementById("satSearch");
const searchBtn   = document.getElementById("searchBtn");

searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return;

  const found = satObjects.find(obj =>
    obj.satInfo.name.toLowerCase().includes(query)
  );

  if (found) {
    selectSatellite(found.idx);
  } else {
    alert("No satellite found matching that name.");
  }
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

// ─── Click detection ─────────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse     = new THREE.Vector2();

window.addEventListener("click", (event) => {
  if (!instancedMesh) return;

  mouse.x =  (event.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(instancedMesh);

  if (intersects.length === 0 || intersects[0].instanceId === undefined) {
    if (selectedIdx !== null) {
      instancedMesh.setColorAt(selectedIdx, DEFAULT_COLOR);
      instancedMesh.instanceColor.needsUpdate = true;
      selectedIdx = null;
      hideSatInfo();
    }
    return;
  }

  selectSatellite(intersects[0].instanceId);
});

// ─── Animation loop ──────────────────────────────────────────────────────────
const matrix = new THREE.Matrix4();

function animate() {
  requestAnimationFrame(animate);

  if (instancedMesh && satObjects.length > 0) {
    const now  = new Date();
    const gmst = satellite.gstime(now);

    for (const { idx, satrec } of satObjects) {
      const positionEci = satellite.propagate(satrec, now);
      if (!positionEci?.position) continue;

      const positionGd = satellite.eciToGeodetic(positionEci.position, gmst);
      const r = EARTH_RADIUS + (positionGd.height / 6371);
      const x = r * Math.cos(positionGd.latitude) * Math.cos(positionGd.longitude);
      const y = r * Math.sin(positionGd.latitude);
      const z = r * Math.cos(positionGd.latitude) * Math.sin(positionGd.longitude);

      matrix.setPosition(x, y, z);
      instancedMesh.setMatrixAt(idx, matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
  }

  renderer.render(scene, camera);
  controls.update();
}

updateDateTime();
setInterval(updateDateTime, 1000);
animate();
