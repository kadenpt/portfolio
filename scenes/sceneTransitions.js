import * as THREE from 'three';
import { setupAboutMeScene } from './aboutMeScene.js';
import { setupProjectsScene } from './projectsScene.js';
import { setupExperienceScene } from './experienceScene.js';

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
 * Animates camera to a target position
 * Returns a Promise that resolves when animation completes
 */
export function animateCameraToPosition(camera, controls, targetPosition, targetLookAt, duration = 2000) {
  return new Promise((resolve) => {
    const startPosition = camera.position.clone();
    const startLookAt = controls.target.clone();
    const startTime = performance.now();
    
    function animate() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-in-out)
      const ease = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      // Interpolate camera position
      camera.position.lerpVectors(startPosition, targetPosition, ease);
      controls.target.lerpVectors(startLookAt, targetLookAt, ease);
      controls.update();
      
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
export function transitionToAboutMeScene(scene, camera, controls, hoverStates, isTransitioning, table) {
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
  animateCameraToPosition(camera, controls, zoomPosition, zoomLookAt, 1600).then(() => {
    // After zoom completes, clear scene and setup new scene
    clearCurrentScene(scene, hoverStates);
    setupAboutMeScene(scene, camera, controls, animateCameraToPosition);
    
    // Reset transition flag after new scene animation completes
    setTimeout(() => {
      isTransitioning.value = false;
    }, 2000);
  });
}

export function transitionToProjectsScene(scene, camera, controls, hoverStates, isTransitioning) {
  if (isTransitioning.value) return;
  isTransitioning.value = true;
  
  clearCurrentScene(scene, hoverStates);
  setupProjectsScene(scene, camera, controls, animateCameraToPosition);
  
  // Reset transition flag after animation completes
  setTimeout(() => {
    isTransitioning.value = false;
  }, 2000);
}

export function transitionToExperienceScene(scene, camera, controls, hoverStates, isTransitioning) {
  if (isTransitioning.value) return;
  isTransitioning.value = true;
  
  clearCurrentScene(scene, hoverStates);
  setupExperienceScene(scene, camera, controls, animateCameraToPosition);
  
  // Reset transition flag after animation completes
  setTimeout(() => {
    isTransitioning.value = false;
  }, 2000);
}

