import * as THREE from 'three';
import { createShelf } from '../components/Shelf.js';

/**
 * Sets up the Experience scene
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {THREE.PerspectiveCamera} camera - The camera
 * @param {Function} animateCameraToPosition - helper for smooth camera moves
 * @param {Object} [entryState] - optional data to seamlessly match the previous scene
 * @param {THREE.Vector3} [entryState.entryDiscPosition]
 * @param {THREE.Quaternion} [entryState.entryDiscQuaternion]
 */
export function setupExperienceScene(
  scene,
  camera,
  animateCameraToPosition,
  entryState
) {
  // Set background to match the brown tabletop color so the disc view feels continuous
  scene.background = new THREE.Color(0x592C0C);
  
  // Add a simple ground plane matching the initial scene floor color
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x0F1B5C,
    roughness: 0.8,
    metalness: 0.2
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // If we arrived here from zooming into the shelf disc, recreate a matching
  // shelf setup so the first frame of this scene looks identical to the last
  // frame of the previous scene.
  if (entryState && entryState.entryDiscPosition) {
    // Create a fresh shelf, then align it so its spinning disc matches entryDiscPosition.
    const shelf = createShelf();
    scene.add(shelf);

    const shelfDisc = shelf.userData.shelfDisc;
    if (shelfDisc) {
      const currentDiscWorldPos = new THREE.Vector3();
      shelfDisc.getWorldPosition(currentDiscWorldPos);

      // Offset the entire shelf so the disc centers line up
      const offset = entryState.entryDiscPosition.clone().sub(currentDiscWorldPos);
      shelf.position.add(offset);
    }

    // Important: do NOT move the camera here.
    // The camera already ended up in the correct position and orientation from the transition,
    // so we keep it as-is for a seamless cut.
    // Ensure the camera is looking at the stored target to prevent any abrupt changes
    if (camera.userData.lookTarget instanceof THREE.Vector3) {
      camera.lookAt(camera.userData.lookTarget);
    }
    return;
  }
  
  // Fallback behavior (if we didn't come from the shelf disc transition)
  const targetPosition = new THREE.Vector3(10, 8, 15);
  const targetLookAt = new THREE.Vector3(0, 2.5, 0);
  animateCameraToPosition(camera, targetPosition, targetLookAt);
}

