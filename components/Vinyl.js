import * as THREE from 'three';

export const createVinyl = (
  color = '#ffffff',
  topShelf = false,
  xpos = 1,
  ypos
) => {

  const geometry = new THREE.BoxGeometry(0.25, 4, 5);
  const material = new THREE.MeshStandardMaterial({ 
    color: color
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(xpos, ypos, 0);

  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
  mesh.add(line);

  return mesh;
};