import * as THREE from 'three';

/**
 * Helper function to check if an object is a descendant of a group
 */
function isDescendantOf(obj, group) {
  let parent = obj.parent;
  while (parent) {
    if (parent === group) return true;
    parent = parent.parent;
  }
  return false;
}

/**
 * Detects which object was hovered/clicked
 */
export function detectInteraction(intersectedMesh, table, shelf, spinningDisc) {
  const topVinyl = shelf.userData.topVinyl;
  const shelfDisc = shelf.userData.shelfDisc;
  let foundTopVinyl = null;
  
  // Check if hovering/clicking on top vinyl
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
  
  // Also check if hovering/clicking on shelf disc (same group as top vinyl)
  if (!foundTopVinyl && shelfDisc && (intersectedMesh === shelfDisc || shelfDisc.children.includes(intersectedMesh))) {
    foundTopVinyl = topVinyl;
  } else if (!foundTopVinyl && shelfDisc) {
    let parent = intersectedMesh.parent;
    while (parent) {
      if (parent === shelfDisc) {
        foundTopVinyl = topVinyl;
        break;
      }
      parent = parent.parent;
    }
  }
  
  // Check if it's a regular shelf vinyl
  const vinylMeshes = shelf.userData.vinylMeshes || [];
  let foundVinyl = null;
  
  if (!foundTopVinyl) {
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
  
  // Check if it's the table spinning disc
  let foundTableDisc = false;
  if (intersectedMesh === spinningDisc) {
    foundTableDisc = true;
  } else {
    let parent = intersectedMesh.parent;
    while (parent) {
      if (parent === spinningDisc) {
        foundTableDisc = true;
        break;
      }
      parent = parent.parent;
    }
  }
  
  return {
    foundTopVinyl,
    foundVinyl,
    foundTableDisc
  };
}

/**
 * Gets all interactable meshes for raycasting
 */
export function getInteractableMeshes(table, shelf) {
  return [
    ...(table.userData.meshes || []),
    ...(shelf.userData.vinylMeshes || []),
    ...(shelf.userData.topVinyl ? [shelf.userData.topVinyl] : []),
    ...(shelf.userData.shelfDisc ? [shelf.userData.shelfDisc] : [])
  ];
}

/**
 * Creates mouse move handler for hover detection
 */
export function createMouseMoveHandler(raycaster, mouse, camera, table, shelf, spinningDisc, hoverStates, hoverEffects) {
  return function(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const allMeshes = getInteractableMeshes(table, shelf);
    const intersects = raycaster.intersectObjects(allMeshes, true);

    // Reset previously hovered objects
    if (hoverStates.hoveredTable) {
      hoverEffects.applyTableHoverEffect(table, spinningDisc, false);
      hoverStates.hoveredTable = null;
    }
    if (hoverStates.hoveredShelfVinyls) {
      hoverEffects.applyShelfVinylsHoverEffect(shelf, false);
      hoverStates.hoveredShelfVinyls = false;
    }
    if (hoverStates.hoveredTopVinyl) {
      hoverEffects.applyTopVinylHoverEffect(shelf, hoverStates.hoveredTopVinyl, false);
      hoverStates.hoveredTopVinyl = null;
    }

    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object;
      const detection = detectInteraction(intersectedMesh, table, shelf, spinningDisc);
      
      if (detection.foundTopVinyl) {
        hoverStates.hoveredTopVinyl = detection.foundTopVinyl;
        hoverEffects.applyTopVinylHoverEffect(shelf, detection.foundTopVinyl, true);
        document.body.style.cursor = 'pointer';
      } else if (detection.foundVinyl) {
        hoverStates.hoveredShelfVinyls = true;
        hoverEffects.applyShelfVinylsHoverEffect(shelf, true);
        document.body.style.cursor = 'pointer';
      } else if (detection.foundTableDisc) {
        hoverStates.hoveredTable = table;
        hoverEffects.applyTableHoverEffect(table, spinningDisc, true);
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = 'default';
      }
    } else {
      document.body.style.cursor = 'default';
    }
  };
}

/**
 * Creates mouse click handler
 */
export function createMouseClickHandler(raycaster, mouse, camera, table, shelf, spinningDisc, clickHandlers) {
  return function(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const allMeshes = getInteractableMeshes(table, shelf);
    const intersects = raycaster.intersectObjects(allMeshes, true);

    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object;
      const detection = detectInteraction(intersectedMesh, table, shelf, spinningDisc);
      
      if (detection.foundTopVinyl) {
        clickHandlers.onTopVinylClick();
      } else if (detection.foundVinyl) {
        clickHandlers.onShelfVinylsClick();
      } else if (detection.foundTableDisc) {
        clickHandlers.onTableDiscClick();
      }
    }
  };
}

