import * as THREE from 'three';


export function createLights() {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(10, 5, 20);

    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);

    return {directionalLight, ambientLight};
}