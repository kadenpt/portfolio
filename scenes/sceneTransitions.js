import * as THREE from 'three';
import { setupAboutMeScene } from './aboutMeScene.js';
import { setupProjectsScene } from './projectsScene.js';
import { setupExperienceScene } from './experienceScene.js';

// Track the last camera look-at target so we can smoothly interpolate orientation
const defaultCameraTarget = new THREE.Vector3(2, 0, 0);

/**
 * Clears the current scene (removes all objects except lights)
 */
export function clearCurrentScene(scene, hoverStates) {
  const objectsToRemove = [];
  scene.traverse((child) => {
    if (child !== scene && child.type !== 'AmbientLight' && child.type !== 'DirectionalLight') {
      objectsToRemove.push(child);
    }
  });
  
  objectsToRemove.forEach((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
    scene.remove(obj);
  });
  
  // Reset hover states
  if (hoverStates) {
    hoverStates.hoveredTable = null;
    hoverStates.hoveredShelfVinyls = false;
    hoverStates.hoveredTopVinyl = null;
  }
}


/**
 * Animates camera to a target position and smoothly rotates it to look at a target point.
 * Returns a Promise that resolves when animation completes.
 */
export function animateCameraToPosition(camera, targetPosition, targetLookAt, duration = 2000) {
  return new Promise((resolve) => {
    const startPosition = camera.position.clone();
    const startTime = performance.now();

    // Starting look-at: use any stored target, otherwise derive from current direction
    const startTarget =
      camera.userData.lookTarget instanceof THREE.Vector3
        ? camera.userData.lookTarget.clone()
        : camera.position.clone().add(
            camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(10)
          );
    const endTarget = targetLookAt.clone();
    const currentTarget = new THREE.Vector3();
    
    function animate() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-in-out)
      const ease = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      // Interpolate camera position
      camera.position.lerpVectors(startPosition, targetPosition, ease);

      // Interpolate look-at target
      currentTarget.lerpVectors(startTarget, endTarget, ease);
      camera.lookAt(currentTarget);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        camera.userData.lookTarget = endTarget.clone();
        resolve();
      }
    }
    
    animate();
  });
}

/**
 * Animates only the camera position (no orientation changes).
 * Useful for moving straight up/down without changing where the camera is looking.
 */
function animateCameraPositionOnly(camera, targetPosition, duration = 2000) {
  return new Promise((resolve) => {
    const startPosition = camera.position.clone();
    const lookTarget =
      camera.userData.lookTarget instanceof THREE.Vector3
        ? camera.userData.lookTarget
        : defaultCameraTarget;
    const startTime = performance.now();

    function animate() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-in-out)
      const ease = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Interpolate camera position only
      camera.position.lerpVectors(startPosition, targetPosition, ease);
      camera.lookAt(lookTarget);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }

    animate();
  });
}
/**
 * Transitions to the About Me scene
 * First zooms into the disc, then transitions to the new scene seamlessly
 */
export function transitionToAboutMeScene(scene, camera, hoverStates, isTransitioning, table) {
  if (isTransitioning.value) return;
  isTransitioning.value = true;
  
  // Get the spinning disc from the table
  const spinningDisc = table.userData.spinningDisc;
  
  // Get the disc's world position
  const discWorldPosition = new THREE.Vector3();
  spinningDisc.getWorldPosition(discWorldPosition);
  
  // First phase: Zoom into the disc, looking straight down
  // Position camera directly above the disc, looking straight down
  const zoomPosition = new THREE.Vector3(discWorldPosition.x, discWorldPosition.y + 1, discWorldPosition.z);
  const zoomLookAt = discWorldPosition.clone(); // Look at the disc center
  
  // Animate camera to zoom into disc
  animateCameraToPosition(camera, zoomPosition, zoomLookAt, 1600).then(() => {
    // After zoom completes, clear scene and setup new scene
    clearCurrentScene(scene, hoverStates);
    setupAboutMeScene(scene, camera, controls, animateCameraToPosition);
    
    // Reset transition flag after new scene animation completes
    setTimeout(() => {
      isTransitioning.value = false;
    }, 2000);
  });
}

export function transitionToProjectsScene(scene, camera, hoverStates, isTransitioning) {
  if (isTransitioning.value) return;
  isTransitioning.value = true;
  
  clearCurrentScene(scene, hoverStates);
  setupProjectsScene(scene, camera, animateCameraToPosition);
  
  // Reset transition flag after animation completes
  setTimeout(() => {
    isTransitioning.value = false;
  }, 2000);
}

export function transitionToExperienceScene(scene, camera, hoverStates, isTransitioning, shelf, table) {
  if (isTransitioning.value) return;
  isTransitioning.value = true;

  // Get shelf, top vinyl and shelf disc from the shelf group
  const topVinyl = shelf && shelf.userData ? shelf.userData.topVinyl : null;
  const shelfDisc = shelf && shelf.userData ? shelf.userData.shelfDisc : null;

  if (!topVinyl || !shelfDisc) {
    // Fallback: no special animation, behave like before
    clearCurrentScene(scene, hoverStates);
    setupExperienceScene(scene, camera, controls, animateCameraToPosition);
    setTimeout(() => {
      isTransitioning.value = false;
    }, 2000);
    return;
  }

  // World positions
  const startPosition = camera.position.clone();
  const shelfWorldPos = new THREE.Vector3();
  shelf.getWorldPosition(shelfWorldPos);

  const shelfDiscWorldPos = new THREE.Vector3();
  shelfDisc.getWorldPosition(shelfDiscWorldPos);

  // Phase 1: move up from the *current* camera position (no lateral jump),
  // while slowly rotating so the camera ends up looking straight down at the shelf.
  const phase1Position = new THREE.Vector3(
    startPosition.x,
    startPosition.y + 15,
    startPosition.z
  );
  const phase1LookAt = shelfWorldPos.clone();

  // Phase 2: then zoom straight down from above the shelf disc.
  // Smoothly transition both position and look-at to match the Experience scene's expected view.
  const phase2OffsetY = 4.0;
  const phase2Position = new THREE.Vector3(
    shelfDiscWorldPos.x + 2, // slight offset so we favor the right side of the disc
    shelfDiscWorldPos.y + phase2OffsetY,
    shelfDiscWorldPos.z - 2
  );
  // Look slightly below the disc center to face more downwards
  const phase2LookAt = new THREE.Vector3(
    shelfDiscWorldPos.x,
    shelfDiscWorldPos.y - 0.5,
    shelfDiscWorldPos.z
  );

  // Run phase 1 (position + look-at to shelf), then phase 2 (position + look-at to disc), then switch scene
  animateCameraToPosition(camera, phase1Position, phase1LookAt, 1600)
    .then(() => {
      return animateCameraToPosition(camera, phase2Position, phase2LookAt, 1400);
    })
    .then(() => {
      // Capture the disc transform and final camera state before clearing the scene
      const entryDiscPosition = shelfDiscWorldPos.clone();
      const entryDiscQuaternion = new THREE.Quaternion();
      shelfDisc.getWorldQuaternion(entryDiscQuaternion);
      
      // Ensure camera's look target is set to match Phase 2's final look-at
      camera.userData.lookTarget = phase2LookAt.clone();

      clearCurrentScene(scene, hoverStates);
      setupExperienceScene(scene, camera, animateCameraToPosition, {
        entryDiscPosition,
        entryDiscQuaternion,
      });

      // No extra camera move here; we already finished the zoom.
      isTransitioning.value = false;
    });
}

