import * as THREE from 'three';

/**
 * Sets up the Projects scene
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {THREE.PerspectiveCamera} camera - The camera
 * @param {OrbitControls} controls - The orbit controls
 */
export function setupProjectsScene(scene, camera, controls, animateCameraToPosition) {
  // Set background
  scene.background = new THREE.Color(0x2d1b4e);
  
  // Add a simple ground plane
  const groundGeometry = new THREE.PlaneGeometry(50, 50);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // TODO: Add your Projects scene content here
  
  // Update camera position for new scene
  const targetPosition = new THREE.Vector3(10, 8, 15);
  const targetLookAt = new THREE.Vector3(0, 2.5, 0);
  
  // Smooth camera transition
  animateCameraToPosition(camera, controls, targetPosition, targetLookAt);
}

