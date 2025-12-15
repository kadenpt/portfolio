import * as THREE from 'three';
import { createTable } from '../components/VinylPlayer.js';
import { createShelf } from '../components/Shelf.js';

/**
 * Sets up the initial scene when first opening the tab
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {Object} Object containing references to scene objects
 */
export function setupInitialScene(scene) {
  // Set background
  scene.background = new THREE.Color(0xfff0f0);

  // Create floor
  const floorGeometry = new THREE.PlaneGeometry(100, 100);
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x0F1B5C,
    roughness: 0.8,
    metalness: 0.2
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // Create table using the reusable component
  const table = createTable({
    position: new THREE.Vector3(0, 0, 0),
    tableWidth: 8,
    tableDepth: 8,
    legHeight: 1,
    legSize: 1
  });
  scene.add(table);

  // Create shelf using the reusable component
  const shelf = createShelf();
  scene.add(shelf);

  // Get reference to the spinning disc
  const spinningDisc = table.userData.spinningDisc;

  return {
    floor,
    table,
    shelf,
    spinningDisc
  };
}

/**
 * Sets up lighting for the scene
 * @param {THREE.Scene} scene - The Three.js scene
 */
export function setupLighting(scene) {
  // Ambient light for overall scene brightness
  const ambientLight = new THREE.AmbientLight(0xD4A477, 0.6);
  scene.add(ambientLight);

  // Directional light (simulating sunlight) from above and to the side
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(10, 15, 5);
  directionalLight.castShadow = true;

  // Shadow camera setup for better shadow quality
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;

  scene.add(directionalLight);

  return { ambientLight, directionalLight };
}

