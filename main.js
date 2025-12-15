import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createTable } from './components/VinylPlayer.js';
import { createShelf } from './components/Shelf.js';

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap // Soft shadows
document.body.appendChild(renderer.domElement)

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500)
camera.position.set(0, 15, 30)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0xFFFFFF)

// Add orbit controls - drag to look around, no keyboard movement
const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(-10, 0, 0) // Look at the center
controls.enableDamping = true // Smooth camera movement
controls.dampingFactor = 0.05
controls.update()

// Create floor
const floorGeometry = new THREE.PlaneGeometry(100, 100)
const floorMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x0F1B5C, // Light gray floor
  roughness: 0.8,
  metalness: 0.2
})
const floor = new THREE.Mesh(floorGeometry, floorMaterial)
floor.rotation.x = -Math.PI / 2 // Rotate to be horizontal
floor.position.y = 0
floor.receiveShadow = true // Floor receives shadows
scene.add(floor)

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

// Hover effect setup for vinyl player and shelf vinyls
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredTable = null;
let hoveredShelfVinyls = false;
let hoveredTopVinyl = null;

// Collect all meshes in the table group
function collectTableMeshes(group) {
  const meshes = [];
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshes.push(child);
      // Store original material
      if (!child.userData.originalMaterial) {
        child.userData.originalMaterial = child.material.clone();
      }
    }
  });
  group.userData.meshes = meshes;
  return meshes;
}

collectTableMeshes(table);

// Collect all vinyl meshes from the shelf (separate top vinyl from others)
function collectVinylMeshes(shelfGroup) {
  const vinylMeshes = [];
  let topVinyl = null;
  
  shelfGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Check geometry to identify vinyls
      // Regular vinyls: BoxGeometry(0.25, 4, 5)
      // Top vinyl: BoxGeometry(5, 0.25, 5) with cyan color
      // Text plane: PlaneGeometry
      const geometry = child.geometry;
      
      if (geometry.type === 'BoxGeometry') {
        const params = geometry.parameters;
        const isRegularVinyl = (params.width === 0.25 && params.height === 4 && params.depth === 5);
        const isTopVinyl = (params.width === 5 && params.height === 0.25 && params.depth === 5);
        
        // Skip shelf panels (brown color 0x592C0C) and spinning disc (black, RingGeometry)
        const isShelfPanel = child.material.color.getHex() === 0x592C0C;
        const isBlack = child.material.color.getHex() === 0x000000 && geometry.type !== 'RingGeometry';
        const isCyan = child.material.color.getHex() === 0x12E5C3; // Top vinyl color
        
        // Separate top vinyl (cyan, flat, on top)
        if (isTopVinyl && isCyan && !isShelfPanel && !isBlack) {
          topVinyl = child;
          // Store original material and position
          if (!child.userData.originalMaterial) {
            child.userData.originalMaterial = child.material.clone();
          }
          if (!child.userData.originalPosition) {
            child.userData.originalPosition = child.position.clone();
          }
        }
        // Regular shelf vinyls (inside the shelf)
        else if (isRegularVinyl && !isShelfPanel && !isBlack && !isCyan) {
          vinylMeshes.push(child);
          // Store original material, rotation, and position
          if (!child.userData.originalMaterial) {
            child.userData.originalMaterial = child.material.clone();
          }
          if (!child.userData.originalRotation) {
            child.userData.originalRotation = child.rotation.clone();
          }
          if (!child.userData.originalPosition) {
            child.userData.originalPosition = child.position.clone();
          }
        }
      }
    }
  });
  
  // Find the shelf spinning disc (RingGeometry, black, on the shelf)
  let shelfDisc = null;
  let textPlane = null;
  shelfGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Find the shelf spinning disc
      if (child.geometry.type === 'RingGeometry') {
        // Check if it's on the shelf (not the table disc)
        if (child.position.y > 9 && child.position.y < 11) {
          shelfDisc = child;
          // Store original material and position
          if (!child.userData.originalMaterial) {
            child.userData.originalMaterial = child.material.clone();
          }
          if (!child.userData.originalPosition) {
            child.userData.originalPosition = child.position.clone();
          }
        }
      }
      // Find the text plane (PlaneGeometry, positioned above top vinyl)
      else if (child.geometry.type === 'PlaneGeometry' && child.position.y > 10 && child.position.y < 11) {
        textPlane = child;
        // Store original position
        if (!child.userData.originalPosition) {
          child.userData.originalPosition = child.position.clone();
        }
      }
    }
  });
  
  shelfGroup.userData.vinylMeshes = vinylMeshes;
  shelfGroup.userData.topVinyl = topVinyl;
  shelfGroup.userData.shelfDisc = shelfDisc;
  shelfGroup.userData.textPlane = textPlane;
  return vinylMeshes;
}

collectVinylMeshes(shelf);

// Function to create glow outline for a mesh using edges
function createGlowOutline(mesh) {
  const originalGeometry = mesh.geometry;
  
  // Clone geometry and scale vertices to create slightly larger outline
  const geometry = originalGeometry.clone();
  const positions = geometry.attributes.position;
  
  // Scale vertices outward for glow effect
  for (let i = 0; i < positions.count; i++) {
    positions.setX(i, positions.getX(i) * 1.05);
    positions.setY(i, positions.getY(i) * 1.05);
    positions.setZ(i, positions.getZ(i) * 1.05);
  }
  positions.needsUpdate = true;
  geometry.computeBoundingBox();
  
  // Use EdgesGeometry to create outline effect
  const edges = new THREE.EdgesGeometry(geometry);
  const glowMaterial = new THREE.LineBasicMaterial({
    color: 0x4488ff,
    transparent: true,
    opacity: 0.95
  });
  const glowLine = new THREE.LineSegments(edges, glowMaterial);
  
  // Group for better organization
  const glowGroup = new THREE.Group();
  glowGroup.add(glowLine);
  
  // Position and rotation will be synced in animate loop
  glowGroup.position.copy(mesh.position);
  glowGroup.rotation.copy(mesh.rotation);
  glowGroup.scale.copy(mesh.scale);
  
  return glowGroup;
}

// Function to apply hover effect to the table
function applyTableHoverEffect(isHovering) {
  if (!table || !table.userData.meshes || !spinningDisc) return;
  
  // Only apply hover effect to the spinning disc
  const mesh = spinningDisc;
  
  if (isHovering) {
    // Remove existing glow if any
    if (mesh.userData.glowGroup) {
      mesh.parent.remove(mesh.userData.glowGroup);
    }
    
    // Create and add glow outline to the same parent
    const glowGroup = createGlowOutline(mesh);
    mesh.parent.add(glowGroup);
    mesh.userData.glowGroup = glowGroup;
    
    // Store reference to sync updates in animate loop
    if (!table.userData.glowGroups) {
      table.userData.glowGroups = [];
    }
    const exists = table.userData.glowGroups.some(item => item.original === mesh);
    if (!exists) {
      table.userData.glowGroups.push({ original: mesh, glow: glowGroup });
    }
  } else {
    // Remove glow outline
    if (mesh.userData.glowGroup) {
      mesh.parent.remove(mesh.userData.glowGroup);
      mesh.userData.glowGroup = null;
    }
    if (table.userData.glowGroups) {
      table.userData.glowGroups = table.userData.glowGroups.filter(
        item => item.original !== mesh
      );
    }
  }
}

// Function to apply hover effect to all shelf vinyls (excluding top vinyl)
function applyShelfVinylsHoverEffect(isHovering) {
  const vinylMeshes = shelf.userData.vinylMeshes || [];
  
  vinylMeshes.forEach((vinylMesh) => {
    if (isHovering) {
      // Remove existing glow if any
      if (vinylMesh.userData.glowGroup) {
        vinylMesh.parent.remove(vinylMesh.userData.glowGroup);
      }
      
      // Create and add glow outline to the same parent
      const glowGroup = createGlowOutline(vinylMesh);
      vinylMesh.parent.add(glowGroup);
      vinylMesh.userData.glowGroup = glowGroup;
      
      // Rotate slightly outward (forward) from the shelf, pivoting around bottom edge
      const rotationAngle = Math.PI / 14; 
      const liftAmount = 0.15;

      const shiftAmount = 1
      
      if (vinylMesh.userData.originalPosition) {
        vinylMesh.position.z = vinylMesh.userData.originalPosition.z + shiftAmount;
      }
    } else {
      // Remove glow outline
      if (vinylMesh.userData.glowGroup) {
        vinylMesh.parent.remove(vinylMesh.userData.glowGroup);
        vinylMesh.userData.glowGroup = null;
      }
      
      if (vinylMesh.userData.originalPosition) {
        vinylMesh.position.copy(vinylMesh.userData.originalPosition);
      }
    }
  });
}

// Function to apply hover effect to the top vinyl and its disc (separate)
function applyTopVinylHoverEffect(topVinyl, isHovering) {
  if (!topVinyl) return;
  
  const shelfDisc = shelf.userData.shelfDisc;
  const textPlane = shelf.userData.textPlane;
  
  // Apply to top vinyl
  if (isHovering) {
    // Remove existing glow if any
    if (topVinyl.userData.glowGroup) {
      topVinyl.parent.remove(topVinyl.userData.glowGroup);
    }
    
    // Create and add glow outline to the same parent
    const glowGroup = createGlowOutline(topVinyl);
    topVinyl.parent.add(glowGroup);
    topVinyl.userData.glowGroup = glowGroup;
    
    // Elevate the top vinyl
    const elevationAmount = 0.5;
    if (topVinyl.userData.originalPosition) {
      topVinyl.position.y = topVinyl.userData.originalPosition.y + elevationAmount;
    }
  } else {
    // Remove glow outline
    if (topVinyl.userData.glowGroup) {
      topVinyl.parent.remove(topVinyl.userData.glowGroup);
      topVinyl.userData.glowGroup = null;
    }
    
    // Restore original position
    if (topVinyl.userData.originalPosition) {
      topVinyl.position.copy(topVinyl.userData.originalPosition);
    }
  }
  
  // Apply to shelf disc if it exists
  if (shelfDisc) {
    if (isHovering) {
      // Remove existing glow if any
      if (shelfDisc.userData.glowGroup) {
        shelfDisc.parent.remove(shelfDisc.userData.glowGroup);
      }
      
      // Create and add glow outline to the same parent
      const glowGroup = createGlowOutline(shelfDisc);
      shelfDisc.parent.add(glowGroup);
      shelfDisc.userData.glowGroup = glowGroup;
      
      // Elevate the shelf disc to match top vinyl elevation
      const elevationAmount = 0.5;
      if (shelfDisc.userData.originalPosition) {
        shelfDisc.position.y = shelfDisc.userData.originalPosition.y + elevationAmount;
      }
    } else {
      // Remove glow outline
      if (shelfDisc.userData.glowGroup) {
        shelfDisc.parent.remove(shelfDisc.userData.glowGroup);
        shelfDisc.userData.glowGroup = null;
      }
      
      // Restore original position
      if (shelfDisc.userData.originalPosition) {
        shelfDisc.position.copy(shelfDisc.userData.originalPosition);
      }
    }
  }
  
  // Apply to text plane if it exists
  if (textPlane) {
    if (isHovering) {
      // Elevate the text plane to match top vinyl elevation
      const elevationAmount = 0.5;
      if (textPlane.userData.originalPosition) {
        textPlane.position.y = textPlane.userData.originalPosition.y + elevationAmount;
      }
    } else {
      // Restore original position
      if (textPlane.userData.originalPosition) {
        textPlane.position.copy(textPlane.userData.originalPosition);
      }
    }
  }
}

// Mouse move handler
function onMouseMove(event) {
  // Calculate mouse position in normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the raycaster with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Get all meshes from table and shelf vinyls (including top vinyl and shelf disc) for intersection testing
  const allMeshes = [
    ...(table.userData.meshes || []),
    ...(shelf.userData.vinylMeshes || []),
    ...(shelf.userData.topVinyl ? [shelf.userData.topVinyl] : []),
    ...(shelf.userData.shelfDisc ? [shelf.userData.shelfDisc] : [])
  ];

  // Calculate objects intersecting the picking ray (recursive for nested objects)
  const intersects = raycaster.intersectObjects(allMeshes, true);

  // Reset previously hovered objects
  if (hoveredTable) {
    applyTableHoverEffect(false);
    hoveredTable = null;
  }
  if (hoveredShelfVinyls) {
    applyShelfVinylsHoverEffect(false);
    hoveredShelfVinyls = false;
  }
  if (hoveredTopVinyl) {
    applyTopVinylHoverEffect(hoveredTopVinyl, false);
    hoveredTopVinyl = null;
  }

  // Check if hovering over any object
  if (intersects.length > 0) {
    const intersectedMesh = intersects[0].object;
    
    // Helper function to check if object is descendant of a group
    function isDescendantOf(obj, group) {
      let parent = obj.parent;
      while (parent) {
        if (parent === group) return true;
        parent = parent.parent;
      }
      return false;
    }
    
    // Check if it's the top vinyl or shelf disc first (separate hover)
    const topVinyl = shelf.userData.topVinyl;
    const shelfDisc = shelf.userData.shelfDisc;
    let foundTopVinyl = null;
    
    // Check if hovering over top vinyl
    if (topVinyl && (intersectedMesh === topVinyl || topVinyl.children.includes(intersectedMesh))) {
      foundTopVinyl = topVinyl;
    } else {
      // Check if it's a child of the top vinyl
      let parent = intersectedMesh.parent;
      while (parent) {
        if (parent === topVinyl) {
          foundTopVinyl = topVinyl;
          break;
        }
        parent = parent.parent;
      }
    }
    
    // Also check if hovering over shelf disc (same hover group as top vinyl)
    if (!foundTopVinyl && shelfDisc && (intersectedMesh === shelfDisc || shelfDisc.children.includes(intersectedMesh))) {
      foundTopVinyl = topVinyl; // Use topVinyl as the trigger for the hover effect
    } else if (!foundTopVinyl && shelfDisc) {
      // Check if it's a child of the shelf disc
      let parent = intersectedMesh.parent;
      while (parent) {
        if (parent === shelfDisc) {
          foundTopVinyl = topVinyl; // Use topVinyl as the trigger for the hover effect
          break;
        }
        parent = parent.parent;
      }
    }
    
    // Check if it's a regular shelf vinyl (handle child objects like edge lines)
    const vinylMeshes = shelf.userData.vinylMeshes || [];
    let foundVinyl = null;
    
    if (!foundTopVinyl) {
      // Check if intersected mesh is a vinyl or is a child of a vinyl
      if (vinylMeshes.includes(intersectedMesh)) {
        foundVinyl = intersectedMesh;
      } else {
        // Check if it's a child of a vinyl (like edge lines)
        for (const vinyl of vinylMeshes) {
          let parent = intersectedMesh.parent;
          while (parent) {
            if (parent === vinyl) {
              foundVinyl = vinyl;
              break;
            }
            parent = parent.parent;
          }
          if (foundVinyl) break;
        }
      }
    }
    
    if (foundTopVinyl) {
      hoveredTopVinyl = foundTopVinyl;
      applyTopVinylHoverEffect(hoveredTopVinyl, true);
      document.body.style.cursor = 'pointer';
    } else if (foundVinyl) {
      hoveredShelfVinyls = true;
      applyShelfVinylsHoverEffect(true);
      document.body.style.cursor = 'pointer';
    } 
    // Check if it's the table spinning disc (or a child of it)
    else if (intersectedMesh === spinningDisc) {
      hoveredTable = table;
      applyTableHoverEffect(true);
      document.body.style.cursor = 'pointer';
    } else {
      // Check if it's a child of the spinning disc
      let isDiscChild = false;
      let parent = intersectedMesh.parent;
      while (parent) {
        if (parent === spinningDisc) {
          isDiscChild = true;
          break;
        }
        parent = parent.parent;
      }
      
      if (isDiscChild) {
        hoveredTable = table;
        applyTableHoverEffect(true);
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = 'default';
      }
    }
  } else {
    document.body.style.cursor = 'default';
  }
}

window.addEventListener('mousemove', onMouseMove);

// Natural lighting setup
// Ambient light for overall scene brightness (simulating sky light)
const ambientLight = new THREE.AmbientLight(0xD4A477, 0.6) // Reduced for more natural contrast
scene.add(ambientLight)

// Directional light (simulating sunlight) from above and to the side
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
directionalLight.position.set(10, 15, 5) // High and to the side like natural sun
directionalLight.castShadow = true // Enable shadow casting

// Shadow camera setup for better shadow quality
directionalLight.shadow.camera.left = -20
directionalLight.shadow.camera.right = 20
directionalLight.shadow.camera.top = 20
directionalLight.shadow.camera.bottom = -20
directionalLight.shadow.camera.near = 1
directionalLight.shadow.camera.far = 50
directionalLight.shadow.mapSize.width = 2048
directionalLight.shadow.mapSize.height = 2048

scene.add(directionalLight)


function animate() {
  // Rotate the spinning disc (rotate around Y-axis since it's horizontal)
  if (spinningDisc) {
    spinningDisc.rotation.z += 0.01; // Spin like a vinyl record
  }
  
  // Sync glow groups for hovered table (only the disc now)
  if (hoveredTable && hoveredTable.userData.glowGroups) {
    hoveredTable.userData.glowGroups.forEach(({ original, glow }) => {
      // Sync position and rotation (important for spinning disc)
      glow.position.copy(original.position);
      glow.rotation.copy(original.rotation);
      glow.scale.copy(original.scale);
    });
  }
  
  // Sync glow groups for all hovered shelf vinyls (with rotation)
  if (hoveredShelfVinyls) {
    const vinylMeshes = shelf.userData.vinylMeshes || [];
    vinylMeshes.forEach((vinylMesh) => {
      if (vinylMesh.userData.glowGroup) {
        const glow = vinylMesh.userData.glowGroup;
        glow.position.copy(vinylMesh.position);
        glow.rotation.copy(vinylMesh.rotation); // Includes the hover rotation
        glow.scale.copy(vinylMesh.scale);
      }
    });
  }
  
  // Sync glow group for hovered top vinyl
  if (hoveredTopVinyl && hoveredTopVinyl.userData.glowGroup) {
    const glow = hoveredTopVinyl.userData.glowGroup;
    glow.position.copy(hoveredTopVinyl.position);
    glow.rotation.copy(hoveredTopVinyl.rotation);
    glow.scale.copy(hoveredTopVinyl.scale);
  }
  
  // Sync glow group for shelf disc (part of top vinyl hover)
  const shelfDisc = shelf.userData.shelfDisc;
  if (hoveredTopVinyl && shelfDisc && shelfDisc.userData.glowGroup) {
    const glow = shelfDisc.userData.glowGroup;
    glow.position.copy(shelfDisc.position);
    glow.rotation.copy(shelfDisc.rotation);
    glow.scale.copy(shelfDisc.scale);
  }
  
  controls.update() // Update controls every frame
  renderer.render(scene, camera)
}

renderer.setAnimationLoop(animate)