import * as THREE from 'three';

/**
 * Creates a reusable table component with 4 corner legs and a rectangular top
 * @param {Object} options - Configuration options
 * @param {THREE.Vector3} options.position - Position of the table (default: 0, 0, 0)
 * @param {number} options.tableWidth - Width of the tabletop (default: 8)
 * @param {number} options.tableDepth - Depth of the tabletop (default: 8)
 * @param {number} options.tableHeight - Thickness of the tabletop (default: 0.2)
 * @param {number} options.legHeight - Height of each leg (default: 1)
 * @param {number} options.legSize - Size of each leg block (default: 1)
 * @param {number} options.legColor - Color of the legs (default: 0x8B4513 - brown)
 * @param {number} options.tabletopColor - Color of the tabletop (default: 0xD2691E - light brown)
 * @returns {THREE.Group} A group containing all table parts
 */
export function createTable(options = {}) {
  const {
    position = new THREE.Vector3(0, 0, 0),
    tableWidth = 8,
    tableDepth = 8,
    tableHeight = 0.5,
    legHeight = 1,
    legSize = 1,
    legColor = 0x592C0C,
    tabletopColor = 0x592C0C
  } = options;

  const tableGroup = new THREE.Group();

  // Create table legs (4 corner blocks, each 1x1x1)
  const legGeometry = new THREE.BoxGeometry(legSize, legHeight, legSize);
  const legMaterial = new THREE.MeshStandardMaterial({ 
    color: legColor,
    roughness: 0.2,
    metalness: 0.0
  });

  // Calculate corner positions based on table dimensions
  const halfWidth = tableWidth / 2 - 0.5;
  const halfDepth = tableDepth / 2 - 0.5;
  const legY = legHeight / 2;

  // Position legs at corners: front-left, front-right, back-left, back-right
  const legPositions = [
    [-halfWidth, legY, -halfDepth],  // front-left
    [halfWidth, legY, -halfDepth],   // front-right
    [-halfWidth, legY, halfDepth],   // back-left
    [halfWidth, legY, halfDepth]     // back-right
  ];

  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(x, y, z);
    leg.castShadow = true; 
    leg.receiveShadow = true; 
    tableGroup.add(leg);
  });

  // Create tabletop (rectangular prism on top)
  const tabletopGeometry = new THREE.BoxGeometry(tableWidth, tableHeight, tableDepth);
  const tabletopMaterial = new THREE.MeshStandardMaterial({ 
    color: tabletopColor,
    roughness: 0.2,
    metalness: 0.0
  });
  const tabletop = new THREE.Mesh(tabletopGeometry, tabletopMaterial);
  
  // Position tabletop on top of legs
  // Leg center is at legY (legHeight/2), leg top is at legHeight, tabletop center should be at legHeight + tableHeight/2
  tabletop.position.set(0, legHeight + tableHeight / 2, 0);
  tabletop.castShadow = true; // Tabletop casts shadows
  tabletop.receiveShadow = true; // Tabletop receives shadows
  tableGroup.add(tabletop);

  // Create spinning disc
  const spinningDiscGeometry = new THREE.RingGeometry(1, 3, 32);
  const spinningDiscMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x000000,
    side: THREE.DoubleSide
  });
  const spinningDisc = new THREE.Mesh(spinningDiscGeometry, spinningDiscMaterial);
  spinningDisc.castShadow = true;
  spinningDisc.receiveShadow = true;
  tableGroup.add(spinningDisc);
  spinningDisc.rotation.x = Math.PI / 2;
  spinningDisc.position.set(0, legHeight + tableHeight / 2 + 0.35, 0);

  // Disc arm holder
  const discArmHolderGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const discArmHolderMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    roughness: 0.2,
    metalness: 0.0
  });
  const discArmHolder = new THREE.Mesh(discArmHolderGeometry, discArmHolderMaterial);
  discArmHolder.castShadow = true;
  discArmHolder.receiveShadow = true;
  discArmHolder.position.set(-3.5, legHeight + tableHeight / 2 + 0.35, 0);
  tableGroup.add(discArmHolder);

  // Disc arm
  const discArmGeometry = new THREE.BoxGeometry(2, 0.1, 0.1);
  const discArmMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    roughness: 0.2,
    metalness: 0.0
  });
  const discArm = new THREE.Mesh(discArmGeometry, discArmMaterial);
  discArm.castShadow = true;
  discArm.receiveShadow = true;
  discArm.position.set(-2.5, legHeight + tableHeight / 2 + 0.6, 0);
  tableGroup.add(discArm);

  // Translucent cover adjusted up right
  const translucentCoverGeometry = new THREE.BoxGeometry(8, 8, 0.1);
  const translucentCoverMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    opacity: 0.7,
    transparent: true,
  });
  const translucentCover = new THREE.Mesh(translucentCoverGeometry, translucentCoverMaterial);
  translucentCover.castShadow = true;
  translucentCover.receiveShadow = true;
  translucentCover.position.set(0, 5.5, -4);
  tableGroup.add(translucentCover);

  const translucentCoverSlideGeometry = new THREE.BoxGeometry(0.5, 8, 0.1);
  const translucentCoverSide = new THREE.Mesh(translucentCoverSlideGeometry, translucentCoverMaterial);
  translucentCoverSide.position.set(-4, 5.5, -3.7);
  translucentCoverSide.rotation.y = Math.PI / 2;
  tableGroup.add(translucentCoverSide);

  const translucentCoverSlide2 = new THREE.Mesh(translucentCoverSlideGeometry, translucentCoverMaterial);
  translucentCoverSlide2.position.set(4, 5.5, -3.7);
  translucentCoverSlide2.rotation.y = Math.PI / 2;
  tableGroup.add(translucentCoverSlide2);

  const translucentCoverTopGeometry = new THREE.BoxGeometry(8, 0.1, 0.5);
  const translucentCoverTop = new THREE.Mesh(translucentCoverTopGeometry, translucentCoverMaterial);
  translucentCoverTop.position.set(0, 9.5, -3.75);
  tableGroup.add(translucentCoverTop);


  // Apply position to the entire group
  tableGroup.position.copy(position);

  // Store reference to spinning disc on the group for easy access
  tableGroup.userData.spinningDisc = spinningDisc;

  return tableGroup;
}
