import * as THREE from 'three';

export function createEarth() {
    
    const earthGeometry = new THREE.SphereGeometry(0.6371, 64, 64);
    const earthTexture = new THREE.TextureLoader().load('./8k_earth_daymap.jpg');
    const earthMaterial = new THREE.MeshStandardMaterial ({
        map: earthTexture,
        emissive: 0x00578a,
        emissiveIntensity: 0.15,
    });
    return new THREE.Mesh(earthGeometry, earthMaterial);
}