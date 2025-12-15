import * as THREE from 'three';

/**
 * Sets up the About Me scene
 * Seamlessly continues from the brown disc view - same brown color facing downwards
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {THREE.PerspectiveCamera} camera - The camera
 * @param {OrbitControls} controls - The orbit controls
 */
export function setupAboutMeScene(scene, camera, controls, animateCameraToPosition) {
  // Set background to match the brown tabletop color (0x592C0C)
  scene.background = new THREE.Color(0x592C0C);
  
  // Create a large brown plane facing upwards (same color as tabletop)
  // This creates a seamless transition - the view stays brown facing down
  const brownPlaneGeometry = new THREE.PlaneGeometry(100, 100);
  const brownPlaneMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x592C0C,
    roughness: 0.2,
    metalness: 0.0
  });
  const brownPlane = new THREE.Mesh(brownPlaneGeometry, brownPlaneMaterial);
  brownPlane.rotation.x = -Math.PI / 2; // Face upward
  brownPlane.position.y = 0; // Position at y=0
  brownPlane.receiveShadow = true;
  scene.add(brownPlane);
  
  // Keep camera looking straight down at the brown surface
  const currentPosition = camera.position.clone();
  const targetLookAt = new THREE.Vector3(currentPosition.x, 0, currentPosition.z); 
  
  // Smooth camera transition (should already be in position, but ensure it's looking straight down)
  animateCameraToPosition(camera, controls, currentPosition, targetLookAt, 300);
  
  // TODO: Add your About Me scene content here
  // The scene starts with a brown surface facing downwards for seamless transition

  // Add image of myself
  const imageGeometry = new THREE.PlaneGeometry(1, 1);
  const textureLoader = new THREE.TextureLoader();
  
  // Load the texture with error handling
  // Path is relative to the HTML file (root of the project)
  const imageTexture = textureLoader.load(
    'images/me.jpeg',
    // onLoad callback
    (texture) => {
      console.log('Image loaded successfully');
    },
    // onProgress callback
    undefined,
    // onError callback
    (error) => {
      console.error('Error loading image:', error);
    }
  );
  
  const imageMaterial = new THREE.MeshBasicMaterial({ 
    map: imageTexture,
    side: THREE.DoubleSide,
    environmentMap: false
  });
  const image = new THREE.Mesh(imageGeometry, imageMaterial);
  // Rotate to face upward (toward camera looking down)
  // PlaneGeometry faces forward (Z+) by default, so rotate -90 degrees around X to face up
  image.rotation.x = -Math.PI / 2;
  
  // Add border around the image using 4 thin boxes (frame edges)
  const borderThickness = 0.1;
  const borderColor = 0xFFFFFF;
  const borderMaterial = new THREE.MeshBasicMaterial({ color: borderColor });
  
  // Create a border group to hold all border pieces
  const borderGroup = new THREE.Group();
  
  const topBorderGeometry = new THREE.BoxGeometry(1 + borderThickness * 2, borderThickness, 0.02);
  const topBorder = new THREE.Mesh(topBorderGeometry, borderMaterial);
  topBorder.position.set(0, 0.5 + borderThickness / 2, 0.01);
  borderGroup.add(topBorder);
  
  const bottomBorder = new THREE.Mesh(topBorderGeometry.clone(), borderMaterial);
  bottomBorder.position.set(0, -0.5 - borderThickness / 2, 0.01);
  borderGroup.add(bottomBorder);
  
  const leftBorderGeometry = new THREE.BoxGeometry(borderThickness, 1 + borderThickness * 2, 0.02);
  const leftBorder = new THREE.Mesh(leftBorderGeometry, borderMaterial);
  leftBorder.position.set(-0.5 - borderThickness / 2, 0, 0.01);
  borderGroup.add(leftBorder);
  
  const rightBorder = new THREE.Mesh(leftBorderGeometry.clone(), borderMaterial);
  rightBorder.position.set(0.5 + borderThickness / 2, 0, 0.01);
  borderGroup.add(rightBorder);
  
  image.add(borderGroup);
  
  // Final position for the image
  const finalPosition = new THREE.Vector3(-1, 0.1, 0);
  // Start position (off to the side, will slide in from the left)
  const startPosition = new THREE.Vector3(-6, 0.1, 0);
  image.position.copy(startPosition);
  
  // Store animation data
  image.userData.slideAnimation = {
    startPos: startPosition.clone(),
    endPos: finalPosition.clone(),
    startTime: performance.now(),
    duration: 1000, // 1 second
    isComplete: false
  };
  
  scene.add(image);
  
  // Animate the slide-in
  animateImageSlideIn(image);

  // Add text about myself
}

/**
 * Animates the image sliding into position
 */
function animateImageSlideIn(image) {
  const animData = image.userData.slideAnimation;
  if (!animData || animData.isComplete) return;
  
  function animate() {
    const elapsed = performance.now() - animData.startTime;
    const progress = Math.min(elapsed / animData.duration, 1);
    
    // Easing function (ease-out)
    const ease = 1 - Math.pow(1 - progress, 3);
    
    // Interpolate position
    image.position.lerpVectors(animData.startPos, animData.endPos, ease);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      animData.isComplete = true;
      image.position.copy(animData.endPos);
    }
  }
  
  animate();
}

