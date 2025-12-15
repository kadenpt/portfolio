import * as THREE from 'three';
import { createVinyl } from './Vinyl.js';

export const createShelf = () => {
  // Bottom panel
  const shelfGroup = new THREE.Group();
  const shelfBottomGeometry = new THREE.BoxGeometry(10, 1, 10);
  const shelfBottomMaterial = new THREE.MeshStandardMaterial({ color: 0x592C0C });
  const shelfBottom = new THREE.Mesh(shelfBottomGeometry, shelfBottomMaterial);
  shelfBottom.position.set(0, 0, 0);

  // Left panel
  const shelfLeftGeometry = new THREE.BoxGeometry(0.5, 10, 10);
  const shelfLeftMaterial = new THREE.MeshStandardMaterial({ color: 0x592C0C });
  const shelfLeft = new THREE.Mesh(shelfLeftGeometry, shelfLeftMaterial);
  shelfLeft.position.set(-4.75, 5, 0);

  // Right panel
  const shelfRightGeometry = new THREE.BoxGeometry(0.5, 10, 10);
  const shelfRightMaterial = new THREE.MeshStandardMaterial({ color: 0x592C0C });
  const shelfRight = new THREE.Mesh(shelfRightGeometry, shelfRightMaterial);
  shelfRight.position.set(4.75, 5, 0);

  // Back panel
  const shelfBackGeometry = new THREE.BoxGeometry(10, 10, 0.5);
  const shelfBackMaterial = new THREE.MeshStandardMaterial({ color: 0x592C0C });
  const shelfBack = new THREE.Mesh(shelfBackGeometry, shelfBackMaterial);
  shelfBack.position.set(0, 5, -4.75);

  // Middle shelf
  const shelfMiddleGeometry = new THREE.BoxGeometry(10, 0.5, 10);
  const shelfMiddleMaterial = new THREE.MeshStandardMaterial({ color: 0x592C0C });
  const shelfMiddle = new THREE.Mesh(shelfMiddleGeometry, shelfMiddleMaterial);
  shelfMiddle.position.set(0, 5, 0);

  // Shelf top
  const shelfTopGeometry = new THREE.BoxGeometry(10, 0.5, 10);
  const shelfTopMaterial = new THREE.MeshStandardMaterial({ color: 0x592C0C });
  const shelfTop = new THREE.Mesh(shelfTopGeometry, shelfTopMaterial);
  shelfTop.position.set(0, 10, 0);

  // Add vinyls
  const vinyls = [
    {'color': '#ffffff', 'topShelf': true},
    {'color': "#1C3DED", 'topShelf': true},
    {'color': '#ffffff', 'topShelf': true},
    {'color': '#105E58', 'topShelf': true},
    {'color': '#5E102E', 'topShelf': true},
    {'color': '#F511ED', 'topShelf': true},
    {'color': '#F5C011', 'topShelf': true},
    {'color': '#1E0B38', 'topShelf': true},
    {'color': '#8D0C9C', 'topShelf': true},
    {'color': '#4D8030', 'topShelf': true},
    {'color': '#2B052B', 'topShelf': true},
    {'color': '#9E1643', 'topShelf': true},
  ]

  let xpos = -4.25
  for (let i = 0; i < vinyls.length; i++) {
      shelfGroup.add(createVinyl(vinyls[i].color, true, xpos + (i * 0.5), 7));
  }

  // Bottom vinyls
  const bottomVinyls = [
    {'color': '#1C3DED', 'topShelf': false},
    {'color': '#105E58', 'topShelf': false},
    {'color': '#5E102E', 'topShelf': false},
    {'color': '#F511ED', 'topShelf': false},
    {'color': '#F5C011', 'topShelf': false},
    {'color': '#1E0B38', 'topShelf': false},
    {'color': '#8D0C9C', 'topShelf': false},
    {'color': '#4D8030', 'topShelf': false},
    {'color': '#2B052B', 'topShelf': false},
    {'color': '#9E1643', 'topShelf': false},
    {'color': '#9E4F16', 'topShelf': false},
    {'color': '#2E5952', 'topShelf': false},
  ]

  xpos = -4.25
  for (let i = 0; i < bottomVinyls.length; i++) {
    shelfGroup.add(createVinyl(bottomVinyls[i].color, bottomVinyls[i].topShelf, xpos + (i * 0.5), 2.5));
  }

  // Add vinyl on top of shelf
  const topVinylGeometry = new THREE.BoxGeometry(5, 0.25, 5);
  const topVinylMaterial = new THREE.MeshStandardMaterial({ color: '#12E5C3' });
  const topVinyl = new THREE.Mesh(topVinylGeometry, topVinylMaterial);
  topVinyl.position.set(-1, 10.25, 1);
  topVinyl.rotation.y = Math.PI / 4;
  shelfGroup.add(topVinyl);

  const edges = new THREE.EdgesGeometry(topVinylGeometry);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
  topVinyl.add(line);

  // Create text texture for the vinyl
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 512;
  
  // Set background to match vinyl color
  context.fillStyle = '#12E5C3';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw text
  context.fillStyle = '#000000';
  context.font = 'bold 80px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('KADEN', canvas.width / 2, canvas.height / 2 - 40);
  context.fillText('PRIMORAC', canvas.width / 2, canvas.height / 2 + 40);
  
  // Create texture from canvas
  const textTexture = new THREE.CanvasTexture(canvas);
  textTexture.needsUpdate = true;
  
  // Create a plane for the text on top of the vinyl
  const textPlaneGeometry = new THREE.PlaneGeometry(4.5, 4.5);
  const textPlaneMaterial = new THREE.MeshStandardMaterial({ 
    map: textTexture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const textPlane = new THREE.Mesh(textPlaneGeometry, textPlaneMaterial);
  textPlane.position.set(-1, 10.4, 1); // Slightly above the vinyl
  textPlane.rotation.x = -Math.PI / 2;
  textPlane.rotation.z = Math.PI / 4;
  shelfGroup.add(textPlane);

  // Create spinning disc
  const spinningDiscGeometry = new THREE.RingGeometry(0.75, 2.5, 32);
  const spinningDiscMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x000000, 
    specular: 0xffffff,
    side: THREE.DoubleSide,
    shininess: 100,
  });
  const spinningDisc = new THREE.Mesh(spinningDiscGeometry, spinningDiscMaterial);
  spinningDisc.position.set(1, 10.3, -1);
  spinningDisc.rotation.x = Math.PI / 2;

  // Add shadows
  shelfBack.castShadow = true;
  shelfLeft.castShadow = true;

  shelfGroup.add(spinningDisc);
  shelfGroup.add(shelfBottom);
  shelfGroup.add(shelfLeft);
  shelfGroup.add(shelfRight);
  shelfGroup.add(shelfBack);
  shelfGroup.add(shelfMiddle);
  shelfGroup.add(shelfTop);
  shelfGroup.position.set(-15, 0, -0.5);

  return shelfGroup;
};