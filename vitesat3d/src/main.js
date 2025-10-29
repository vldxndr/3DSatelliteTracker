import * as THREE from 'three';
import * as satellite from 'satellite.js';


import { scene, camera, renderer } from './scene.js'
import { createEarth } from './earth.js';
import { createMoon, createSpace } from './spaceElements.js';
import { createOrbitControls } from './orbitControls.js';
import { createLights } from './lights.js';
import { updateDateTime } from './date.js';
import { createSatMeshes, fetchSats } from './sphereSats.js';


const EARTH_RADIUS = 0.6371; // km

// --- UI helpers: show / hide the info box ---
function showSatInfo(info) {
  const infoBox = document.getElementById("satInfoBox");
  const satName = document.getElementById("satName");
  const satId = document.getElementById("satId");
  const satImage = document.getElementById("satImage");

  if (!infoBox || !satName || !satId) return;

  satName.textContent = info.name ?? "Unknown";
  satId.textContent = `NORAD ID: ${info.id ?? "N/A"}`;

  if (satImage) {
    if (info.image) {
      satImage.src = info.image;
      satImage.style.display = "block";
    } else {
      satImage.style.display = "none";
    }
  }

  // show UI and allow clicks in it
  infoBox.classList.add("visible");
  infoBox.style.pointerEvents = "auto";
}

function hideSatInfo() {
  const infoBox = document.getElementById("satInfoBox");
  const satImage = document.getElementById("satImage");
  if (!infoBox) return;

  infoBox.classList.remove("visible");
  // prevent UI from catching pointer events while hidden
  infoBox.style.pointerEvents = "none";

  // clean up image a little after the fade (optional)
  if (satImage) {
    setTimeout(() => { satImage.style.display = "none"; }, 300);
  }
}



const earth = createEarth();
// Rotate Earth texture 90° east
earth.rotation.y = Math.PI / 1.5;

const moon = createMoon();
const space = createSpace();
const controls = createOrbitControls();
const { directionalLight, ambientLight } = createLights();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedSat = null;


scene.add(earth);
scene.add(moon);
scene.add(space);
scene.add(directionalLight);
scene.add(ambientLight);

function selectSatellite(clickedObject) {
  // Deselect old
  if (selectedSat && selectedSat !== clickedObject) {
    selectedSat.material.color.setHex(0xff0000);
  }

  // If clicking same one again, toggle off
  if (selectedSat === clickedObject) {
    clickedObject.material.color.setHex(0xff0000);
    selectedSat = null;
    hideSatInfo();
    return;
  }

  // Highlight new one
  clickedObject.material.color.setHex(0x00ffff);
  selectedSat = clickedObject;

  // Update info box
  showSatInfo(clickedObject.userData.satInfo);

  // Smoothly move camera near satellite
  const satPos = clickedObject.position.clone();
  camera.position.lerp(satPos.multiplyScalar(2), 0.2);
  controls.target.copy(clickedObject.position);
}


moon.position.x = 38.4;

let satObjects = [];

(async () => {
  const satData = await fetchSats();
  const { satMeshes, satObjects: createdObjects } = await createSatMeshes(satData);

  satObjects = createdObjects; // save for animation

  for (const { mesh } of satObjects) {
    scene.add(mesh);
  }

  console.log("Loaded satellites:", satObjects.length);
})();

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    // Hide info box
    hideSatInfo();

    // Deselect satellite
    if (selectedSat) {
      selectedSat.material.color.setHex(0xff0000);
      selectedSat = null;
    }

    // Smoothly shift camera focus back to Earth
    const targetPosition = new THREE.Vector3(0, 0, 2); // a bit above Earth for a nice view
    const startPos = camera.position.clone();
    const duration = 1000; // 1 second
    const startTime = performance.now();

    function animateCamera(time) {
      const elapsed = time - startTime;
      const t = Math.min(elapsed / duration, 1);

      camera.position.lerpVectors(startPos, targetPosition, t);
      controls.target.lerp(new THREE.Vector3(0, 0, 0), t * 0.1); // gradually re-center on Earth
      controls.update();

      if (t < 1) requestAnimationFrame(animateCamera);
    }

    requestAnimationFrame(animateCamera);
  }
});



// === SEARCH FUNCTIONALITY ===
const searchInput = document.getElementById("satSearch");
const searchBtn = document.getElementById("searchBtn");

searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return;

  const foundSat = satObjects.find(obj =>
    obj.mesh.userData.satInfo.name.toLowerCase().includes(query)
  );

  if (foundSat) {
    selectSatellite(foundSat.mesh);
  } else {
    alert("No satellite found matching that name.");
  }
});


searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});

function animate() {
  requestAnimationFrame(animate);

  const now = new Date();
  const gmst = satellite.gstime(now);

  for (const { mesh, satrec } of satObjects) {
    const positionEci = satellite.propagate(satrec, now);
    if (!positionEci?.position) continue;

    const positionGd = satellite.eciToGeodetic(positionEci.position, gmst);

    const r = EARTH_RADIUS + (positionGd.height / 6371);
    const x = r * Math.cos(positionGd.latitude) * Math.cos(positionGd.longitude);
    const y = r * Math.sin(positionGd.latitude);
    const z = r * Math.cos(positionGd.latitude) * Math.sin(positionGd.longitude);

    mesh.position.set(x, y, z);
  }

  renderer.render(scene, camera);
  controls.update();
}

window.addEventListener('click', onMouseClick, false);

function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length === 0) {
    if (selectedSat) {
      selectedSat.material.color.setHex(0xff0000);
      selectedSat = null;
      hideSatInfo();
    }
    return;
  }

  const clickedObject = intersects[0].object;
  if (clickedObject.userData?.satInfo) {
    selectSatellite(clickedObject);
  }
}

updateDateTime();
setInterval(updateDateTime, 1000);
animate();