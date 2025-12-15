import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene setup
import { setupInitialScene, setupLighting } from './scenes/initialScene.js';

// Interactions
import * as hoverEffects from './interactions/hoverEffects.js';
import * as interactionDetection from './interactions/interactionDetection.js';
import * as clickHandlers from './interactions/clickHandlers.js';

// Scene transitions
import { 
  transitionToAboutMeScene, 
  transitionToProjectsScene, 
  transitionToExperienceScene 
} from './scenes/sceneTransitions.js';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
camera.position.set(0, 15, 30);

const scene = new THREE.Scene();

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(-10, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();

const hoverStates = {
  hoveredTable: null,
  hoveredShelfVinyls: false,
  hoveredTopVinyl: null
};

const isTransitioning = { value: false };

// Raycaster for interaction detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Scene object references
let table, shelf, spinningDisc;

/**
 * Sets up the initial screen when first opening the tab
 */
function setupInitialScreen() {
  // Setup initial scene objects
  const sceneObjects = setupInitialScene(scene);
  table = sceneObjects.table;
  shelf = sceneObjects.shelf;
  spinningDisc = sceneObjects.spinningDisc;

  // Setup lighting
  setupLighting(scene);

  // Collect meshes for hover detection
  hoverEffects.collectTableMeshes(table);
  hoverEffects.collectVinylMeshes(shelf);

  // Setup interactions
  setupInteractions();

  // Start animation loop
  startAnimationLoop();
}

/**
 * Sets up interaction handlers (hover and click)
 */
function setupInteractions() {
  // Create bound transition functions
  const boundAboutMeTransition = () => transitionToAboutMeScene(scene, camera, controls, hoverStates, isTransitioning, table);
  const boundProjectsTransition = () => transitionToProjectsScene(scene, camera, controls, hoverStates, isTransitioning);
  const boundExperienceTransition = () => transitionToExperienceScene(scene, camera, controls, hoverStates, isTransitioning);

  // Create interaction handlers
  const onMouseMove = interactionDetection.createMouseMoveHandler(
    raycaster,
    mouse,
    camera,
    table,
    shelf,
    spinningDisc,
    hoverStates,
    hoverEffects
  );

  const onMouseClick = interactionDetection.createMouseClickHandler(
    raycaster,
    mouse,
    camera,
    table,
    shelf,
    spinningDisc,
    {
      onTableDiscClick: () => clickHandlers.onTableDiscClick(boundAboutMeTransition),
      onShelfVinylsClick: () => clickHandlers.onShelfVinylsClick(boundProjectsTransition),
      onTopVinylClick: () => clickHandlers.onTopVinylClick(boundExperienceTransition)
    }
  );

  // Attach event listeners
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onMouseClick);
}

/**
 * Animation loop
 */
function animate() {
  // Rotate the spinning disc
  if (spinningDisc) {
    spinningDisc.rotation.z += 0.01;
  }

  // Sync glow groups for hovered table (only the disc now)
  if (hoverStates.hoveredTable && hoverStates.hoveredTable.userData.glowGroups) {
    hoverStates.hoveredTable.userData.glowGroups.forEach(({ original, glow }) => {
      glow.position.copy(original.position);
      glow.rotation.copy(original.rotation);
      glow.scale.copy(original.scale);
    });
  }

  // Sync glow groups for all hovered shelf vinyls (with rotation)
  if (hoverStates.hoveredShelfVinyls) {
    const vinylMeshes = shelf.userData.vinylMeshes || [];
    vinylMeshes.forEach((vinylMesh) => {
      if (vinylMesh.userData.glowGroup) {
        const glow = vinylMesh.userData.glowGroup;
        glow.position.copy(vinylMesh.position);
        glow.rotation.copy(vinylMesh.rotation);
        glow.scale.copy(vinylMesh.scale);
      }
    });
  }

  // Sync glow group for hovered top vinyl
  if (hoverStates.hoveredTopVinyl && hoverStates.hoveredTopVinyl.userData.glowGroup) {
    const glow = hoverStates.hoveredTopVinyl.userData.glowGroup;
    glow.position.copy(hoverStates.hoveredTopVinyl.position);
    glow.rotation.copy(hoverStates.hoveredTopVinyl.rotation);
    glow.scale.copy(hoverStates.hoveredTopVinyl.scale);
  }

  // Sync glow group for shelf disc (part of top vinyl hover)
  const shelfDisc = shelf.userData.shelfDisc;
  if (hoverStates.hoveredTopVinyl && shelfDisc && shelfDisc.userData.glowGroup) {
    const glow = shelfDisc.userData.glowGroup;
    glow.position.copy(shelfDisc.position);
    glow.rotation.copy(shelfDisc.rotation);
    glow.scale.copy(shelfDisc.scale);
  }

  controls.update();
  renderer.render(scene, camera);
}

/**
 * Starts the animation loop
 */
function startAnimationLoop() {
  renderer.setAnimationLoop(animate);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

setupInitialScreen();
