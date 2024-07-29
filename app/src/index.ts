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
  // const faces = extractFaces(await loadGeometry(modelUrl));
  const faces = [];
  {
    const a = new THREE.Vector3(0, 0, 0);
    const b = new THREE.Vector3(2, 0, 0);
    const c = new THREE.Vector3(0, 0, 2.3);
    const d = new THREE.Vector3(1, 2.1, -1);

    faces.push(
      //
      [a, c, b],
      [a, b, d],
    );
  }

  const mat = new THREE.MeshStandardMaterial({
    color: "#ab1231",
    flatShading: true,
    side: THREE.DoubleSide,
  });
  const mat2 = mat.clone();
  mat2.wireframe = true;

  const chunks = flatten(faces);

  const traverse = (c: (typeof chunks)[number]) => {
    const geo = faceToMesh(c.face);
    const m = new THREE.Mesh(geo, mat);

    for (const o of c.children) m.add(traverse(o));

    return m;
  };
  const meshes = chunks.map(traverse);

  for (const m of meshes) scene.add(m);

  for (const f of faces) scene.add(new THREE.Mesh(faceToMesh(f), mat2));

  {
    const input = document.querySelector("#time-range") as HTMLInputElement;
    input.addEventListener("input", (e) => {
      const k = +input.value;
      console.log(k);
    });
  }
})();
