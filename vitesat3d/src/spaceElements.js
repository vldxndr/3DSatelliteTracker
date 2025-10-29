import * as THREE from 'three';

export function createMoon() {

    const moonGeometry = new THREE.SphereGeometry(0.1737, 64, 64);
    const moonTexture = new THREE.TextureLoader().load('./8k_moon.jpg');
    const moonMaterial = new THREE.MeshStandardMaterial({
        map: moonTexture,
        emissive: 0x00578a,
        emissiveIntensity: 0.15,
    });
    return new THREE.Mesh(moonGeometry, moonMaterial);
}

export function createSpace() {
    const spaceGeometry = new THREE.SphereGeometry(100, 64, 64);
    const spaceTexture = new THREE.TextureLoader().load('./8k_stars.jpg');
    const spaceMaterial = new THREE.MeshBasicMaterial({
        map: spaceTexture,
        side: THREE.BackSide
    })
    return new THREE.Mesh(spaceGeometry, spaceMaterial)
}

