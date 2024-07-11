import type * as THREE from "three";

export const loadGeometry = async (glbUrl: string) => {
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader");

  const loader = new GLTFLoader();

  const glbBlob = await fetch(glbUrl).then((res) => res.blob());
  const glbBlobUrl = URL.createObjectURL(glbBlob);

  const { scene } = await loader.loadAsync(glbBlobUrl);

  const geometry = (scene.children[0] as THREE.Mesh).geometry;

  URL.revokeObjectURL(glbBlobUrl);

  return geometry;
};
