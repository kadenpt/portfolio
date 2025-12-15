import * as THREE from 'three';

/**
 * Collects all meshes in the table group
 */
export function collectTableMeshes(group) {
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

/**
 * Collects all vinyl meshes from the shelf (separates top vinyl from others)
 */
export function collectVinylMeshes(shelfGroup) {
  const vinylMeshes = [];
  let topVinyl = null;
  
  shelfGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const geometry = child.geometry;
      
      if (geometry.type === 'BoxGeometry') {
        const params = geometry.parameters;
        const isRegularVinyl = (params.width === 0.25 && params.height === 4 && params.depth === 5);
        const isTopVinyl = (params.width === 5 && params.height === 0.25 && params.depth === 5);
        
        const isShelfPanel = child.material.color.getHex() === 0x592C0C;
        const isBlack = child.material.color.getHex() === 0x000000 && geometry.type !== 'RingGeometry';
        const isCyan = child.material.color.getHex() === 0x12E5C3;
        
        // Separate top vinyl (cyan, flat, on top)
        if (isTopVinyl && isCyan && !isShelfPanel && !isBlack) {
          topVinyl = child;
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
  
  // Find the shelf spinning disc and text plane
  let shelfDisc = null;
  let textPlane = null;
  shelfGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Find the shelf spinning disc
      if (child.geometry.type === 'RingGeometry') {
        if (child.position.y > 9 && child.position.y < 11) {
          shelfDisc = child;
          if (!child.userData.originalMaterial) {
            child.userData.originalMaterial = child.material.clone();
          }
          if (!child.userData.originalPosition) {
            child.userData.originalPosition = child.position.clone();
          }
        }
      }
      // Find the text plane
      else if (child.geometry.type === 'PlaneGeometry' && child.position.y > 10 && child.position.y < 11) {
        textPlane = child;
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

/**
 * Creates a glow outline for a mesh using edges
 */
export function createGlowOutline(mesh) {
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
  
  glowGroup.position.copy(mesh.position);
  glowGroup.rotation.copy(mesh.rotation);
  glowGroup.scale.copy(mesh.scale);
  
  return glowGroup;
}

/**
 * Applies hover effect to the table spinning disc
 */
export function applyTableHoverEffect(table, spinningDisc, isHovering) {
  if (!table || !table.userData.meshes || !spinningDisc) return;
  
  const mesh = spinningDisc;
  
  if (isHovering) {
    if (mesh.userData.glowGroup) {
      mesh.parent.remove(mesh.userData.glowGroup);
    }
    
    const glowGroup = createGlowOutline(mesh);
    mesh.parent.add(glowGroup);
    mesh.userData.glowGroup = glowGroup;
    
    if (!table.userData.glowGroups) {
      table.userData.glowGroups = [];
    }
    const exists = table.userData.glowGroups.some(item => item.original === mesh);
    if (!exists) {
      table.userData.glowGroups.push({ original: mesh, glow: glowGroup });
    }
  } else {
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

/**
 * Applies hover effect to all shelf vinyls (excluding top vinyl)
 */
export function applyShelfVinylsHoverEffect(shelf, isHovering) {
  const vinylMeshes = shelf.userData.vinylMeshes || [];
  
  vinylMeshes.forEach((vinylMesh) => {
    if (isHovering) {
      if (vinylMesh.userData.glowGroup) {
        vinylMesh.parent.remove(vinylMesh.userData.glowGroup);
      }
      
      const glowGroup = createGlowOutline(vinylMesh);
      vinylMesh.parent.add(glowGroup);
      vinylMesh.userData.glowGroup = glowGroup;
      
      // Rotate slightly outward (forward) from the shelf, pivoting around bottom edge
      const rotationAngle = Math.PI / 14;
      const shiftAmount = 1;
      
      if (vinylMesh.userData.originalPosition) {
        vinylMesh.position.z = vinylMesh.userData.originalPosition.z + shiftAmount;
      }
    } else {
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

/**
 * Applies hover effect to the top vinyl and its disc
 */
export function applyTopVinylHoverEffect(shelf, topVinyl, isHovering) {
  if (!topVinyl) return;
  
  const shelfDisc = shelf.userData.shelfDisc;
  const textPlane = shelf.userData.textPlane;
  
  // Apply to top vinyl
  if (isHovering) {
    if (topVinyl.userData.glowGroup) {
      topVinyl.parent.remove(topVinyl.userData.glowGroup);
    }
    
    const glowGroup = createGlowOutline(topVinyl);
    topVinyl.parent.add(glowGroup);
    topVinyl.userData.glowGroup = glowGroup;
    
    // Elevate the top vinyl
    const elevationAmount = 0.5;
    if (topVinyl.userData.originalPosition) {
      topVinyl.position.y = topVinyl.userData.originalPosition.y + elevationAmount;
    }
  } else {
    if (topVinyl.userData.glowGroup) {
      topVinyl.parent.remove(topVinyl.userData.glowGroup);
      topVinyl.userData.glowGroup = null;
    }
    
    if (topVinyl.userData.originalPosition) {
      topVinyl.position.copy(topVinyl.userData.originalPosition);
    }
  }
  
  // Apply to shelf disc
  if (shelfDisc) {
    if (isHovering) {
      if (shelfDisc.userData.glowGroup) {
        shelfDisc.parent.remove(shelfDisc.userData.glowGroup);
      }
      
      const glowGroup = createGlowOutline(shelfDisc);
      shelfDisc.parent.add(glowGroup);
      shelfDisc.userData.glowGroup = glowGroup;
      
      const elevationAmount = 0.5;
      if (shelfDisc.userData.originalPosition) {
        shelfDisc.position.y = shelfDisc.userData.originalPosition.y + elevationAmount;
      }
    } else {
      if (shelfDisc.userData.glowGroup) {
        shelfDisc.parent.remove(shelfDisc.userData.glowGroup);
        shelfDisc.userData.glowGroup = null;
      }
      
      if (shelfDisc.userData.originalPosition) {
        shelfDisc.position.copy(shelfDisc.userData.originalPosition);
      }
    }
  }
  
  // Apply to text plane
  if (textPlane) {
    if (isHovering) {
      const elevationAmount = 0.5;
      if (textPlane.userData.originalPosition) {
        textPlane.position.y = textPlane.userData.originalPosition.y + elevationAmount;
      }
    } else {
      if (textPlane.userData.originalPosition) {
        textPlane.position.copy(textPlane.userData.originalPosition);
      }
    }
  }
}

