import * as THREE from "three";

import { loadGeometry } from "./fold/loadGeometry";
import { createRenderer } from "./renderer/index";

const { renderer, scene } = createRenderer();
document.body.appendChild(renderer.domElement);

import { extractFaces, Face, flatten } from "./fold/flatten";

// @ts-ignore
import modelUrl from "../../fish2.glb?url";

type PointLike = { x: number; y: number; z: number };
const faceToMesh = (face: PointLike[]) => {
  const geo = new THREE.BufferGeometry();

  const o = face[0];

  const vertices = [];

  for (let i = 2; i < face.length; i++) {
    let a = face[i - 1];
    let b = face[i - 0];

    vertices.push(o.x, o.y, o.z);
    vertices.push(a.x, a.y, a.z);
    vertices.push(b.x, b.y, b.z);
  }

  const ba = new THREE.BufferAttribute(new Float32Array(vertices), 3);
  geo.setAttribute("position", ba);

  // normal (flat shading)
  // TODO

  return geo;
};

(async () => {
  const faces = extractFaces(await loadGeometry(modelUrl));

  console.log(faces);

  const mat = new THREE.MeshStandardMaterial({ color: "#ab1231" });
  const meshes = faces.map(faceToMesh).map((geo) => {
    const m = new THREE.Mesh(geo, mat);
    m.material.side = THREE.DoubleSide;
    mat.flatShading = true;
    return m;
  });

  for (const m of meshes) scene.add(m);

  const chunks = flatten(faces);
})();
