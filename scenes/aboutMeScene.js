import * as THREE from 'three';

/**
 * Sets up the About Me scene
 * Seamlessly continues from the brown disc view - same brown color facing downwards
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {THREE.PerspectiveCamera} camera - The camera
 */
export function setupAboutMeScene(scene, camera, animateCameraToPosition) {
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
  animateCameraToPosition(camera, currentPosition, targetLookAt, 300);
  
  // TODO: Add your About Me scene content here
  // The scene starts with a brown surface facing downwards for seamless transition

  // Add image of myself
  const imageGeometry = new THREE.PlaneGeometry(0.85, 1);
  const textureLoader = new THREE.TextureLoader();
  
  // Load the texture with error handling
  // Path is relative to the HTML file (root of the project)
  const imageTexture = textureLoader.load(
    'images/me.JPG',
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
  // Preserve the photo's natural colors (sRGB) and bypass tone mapping
  imageTexture.colorSpace = THREE.SRGBColorSpace;
  
  const imageMaterial = new THREE.MeshBasicMaterial({ 
    map: imageTexture,
    side: THREE.DoubleSide,
    environmentMap: false
  });
  imageMaterial.toneMapped = false;
  imageMaterial.color.set(0xffffff);
  const image = new THREE.Mesh(imageGeometry, imageMaterial);
  // Rotate to face upward (toward camera looking down)
  // PlaneGeometry faces forward (Z+) by default, so rotate -90 degrees around X to face up
  image.rotation.x = -Math.PI / 2;
  
  // Add border around the image using 4 thin boxes (frame edges)
  const borderThickness = 0.1;
  const imageWidth = 0.85;
  const imageHeight = 1;
  const borderColor = 0x0E3D1D;
  const borderMaterial = new THREE.MeshBasicMaterial({ color: borderColor });
  
  // Create a border group to hold all border pieces
  const borderGroup = new THREE.Group();
  
  const topBorderGeometry = new THREE.BoxGeometry(imageWidth + borderThickness * 2, borderThickness, 0.1);
  const topBorder = new THREE.Mesh(topBorderGeometry, borderMaterial);
  topBorder.position.set(0, imageHeight / 2 + borderThickness / 2, 0);
  borderGroup.add(topBorder);
  
  const bottomBorder = new THREE.Mesh(topBorderGeometry.clone(), borderMaterial);
  bottomBorder.position.set(0, -imageHeight / 2 - borderThickness / 2, 0);
  borderGroup.add(bottomBorder);
  
  const leftBorderGeometry = new THREE.BoxGeometry(borderThickness, imageHeight + borderThickness * 2, 0.1);
  const leftBorder = new THREE.Mesh(leftBorderGeometry, borderMaterial);
  leftBorder.position.set(-imageWidth / 2 - borderThickness / 2, 0, 0);
  borderGroup.add(leftBorder);
  
  const rightBorder = new THREE.Mesh(leftBorderGeometry.clone(), borderMaterial);
  rightBorder.position.set(imageWidth / 2 + borderThickness / 2, 0, 0);
  borderGroup.add(rightBorder);
  
  image.add(borderGroup);
  
  // Final position for the image
  const finalPosition = new THREE.Vector3(-0.75, 0.1, 0);
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
  image.castShadow = true;
  scene.add(image);

  // Create text texture for the vinyl
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 512;
  
  // Set background to match vinyl color
  context.fillStyle = '#FFFFFF';
  context.fillRect(1, 1, canvas.width - 2, canvas.height - 2);
  
  // Draw text
  context.fillStyle = '#000000';
  context.font = '24px EB Garamond';
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  // First line of text
  context.fillText("Hi! I'm Kaden. I'm a Computer Science student at", 20, 35);
  // Second line of text
  context.fillText('the University of British Columbia. I\'m interested', 20, 65);
  // Third line of text
  context.fillText('in software development, machine learning,', 20, 95);
  // Fourth line of text
  context.fillText('and artificial intelligence. I\'m currently working as', 20, 125);
  // Fifth line of text
  context.fillText('a Software Developer at IBM. Outside of work,', 20, 155);
  // Sixth line of text
  context.fillText('I enjoy surfing, hiking, and listening to music.', 20, 185);
  // Seventh line of text
  context.fillText('In this portfolio, you can find more about me', 20, 215);
  // Eighth line of text
  context.fillText('and my projects. Explore the site to learn more!', 20, 245);
  // Contact Info at Botton
  context.fillText('Contact me at kadenpt@gmail.com', 20, 490);

  // Create texture from canvas
  const textTexture = new THREE.CanvasTexture(canvas);
  textTexture.needsUpdate = true;
  
  // Create a plane for the text on top of the vinyl
  const textPlaneGeometry = new THREE.PlaneGeometry(1.25, 1.25);
  const textPlaneMaterial = new THREE.MeshStandardMaterial({ 
    map: textTexture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const textPlane = new THREE.Mesh(textPlaneGeometry, textPlaneMaterial);
  textPlane.rotation.x = -Math.PI / 2;
  
  // Add border around the text plane
  const textBorderThickness = 0.1;
  const textWidth = 1.25;
  const textHeight = 1.25;
  const textBorderColor = 0x0E3D1D;
  const textBorderMaterial = new THREE.MeshBasicMaterial({ color: textBorderColor });
  
  // Create a border group for the text plane
  const textBorderGroup = new THREE.Group();
  
  const textTopBorderGeometry = new THREE.BoxGeometry(textWidth + textBorderThickness * 2, textBorderThickness, 0.1);
  const textTopBorder = new THREE.Mesh(textTopBorderGeometry, textBorderMaterial);
  textTopBorder.position.set(0, textHeight / 2 + textBorderThickness / 2, 0);
  textBorderGroup.add(textTopBorder);
  
  const textBottomBorder = new THREE.Mesh(textTopBorderGeometry.clone(), textBorderMaterial);
  textBottomBorder.position.set(0, -textHeight / 2 - textBorderThickness / 2, 0);
  textBorderGroup.add(textBottomBorder);
  
  const textLeftBorderGeometry = new THREE.BoxGeometry(textBorderThickness, textHeight + textBorderThickness * 2, 0.1);
  const textLeftBorder = new THREE.Mesh(textLeftBorderGeometry, textBorderMaterial);
  textLeftBorder.position.set(-textWidth / 2 - textBorderThickness / 2, 0, 0);
  textBorderGroup.add(textLeftBorder);
  
  const textRightBorder = new THREE.Mesh(textLeftBorderGeometry.clone(), textBorderMaterial);
  textRightBorder.position.set(textWidth / 2 + textBorderThickness / 2, 0, 0);
  textBorderGroup.add(textRightBorder);
  
  textPlane.add(textBorderGroup);
  
  const finalTextPosition = new THREE.Vector3(0.75, 0.1, 0);
  const startTextPosition = new THREE.Vector3(6, 0.1, 0);
  textPlane.position.copy(startTextPosition);
  textPlane.userData.slideAnimation = {
    startPos: startTextPosition.clone(),
    endPos: finalTextPosition.clone(),
    startTime: performance.now(),
    duration: 1000, // 1 second
    isComplete: false
  };
  textPlane.castShadow = true;
  scene.add(textPlane);
  
  // Animate the slide-in
  animateImageSlideIn(image);
  animateTextSlideIn(textPlane);
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

function animateTextSlideIn(text) {
  const animData = text.userData.slideAnimation;
  if (!animData || animData.isComplete) return;
  
  function animate() {
    const elapsed = performance.now() - animData.startTime;
    const progress = Math.min(elapsed / animData.duration, 1);
    
    // Easing function (ease-out)
    const ease = 1 - Math.pow(1 - progress, 3);
    
    text.position.lerpVectors(animData.startPos, animData.endPos, ease);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      animData.isComplete = true;
      text.position.copy(animData.endPos);
    }
  }

  animate();
}
