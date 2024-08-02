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

const createChunkObject = (
  c: ReturnType<typeof flatten>[number],
  material: THREE.Material,
) => {
  const geo = faceToMesh(c.face);
  const m = new THREE.Mesh(geo, material);
  m.position.copy(c.origin);
  m.userData.origin = c.origin;
  m.userData.rotation = c.rotation;

  for (const o of c.children) m.add(createChunkObject(o, material));

  return m;
};

(async () => {
  const faces = [];
  if (!true) {
    faces.push(...extractFaces(await loadGeometry(modelUrl)));
  } else {
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
  }

  const mat = new THREE.MeshStandardMaterial({
    color: "#ab1231",
    flatShading: true,
  });
  const mat2 = mat.clone();
  mat2.wireframe = true;

  const chunks = flatten(faces);

  const chunkObjects = chunks.map((c) => createChunkObject(c, mat));

  for (const m of chunkObjects) scene.add(m);

  for (const f of faces) scene.add(new THREE.Mesh(faceToMesh(f), mat2));

  let n = 0;
  {
    const stack = chunkObjects.slice();
    while (stack[0]) {
      n++;
      const o = stack.shift()!;
      stack.unshift(...(o.children as THREE.Mesh[]));
    }
  }

  console.log(n);

  {
    const input = document.querySelector("#time-range") as HTMLInputElement;
    input.addEventListener("input", (e) => {
      const k = +input.value;

      const i = Math.floor(k * n);
      const t = (k * n) % 1;

      console.log(i, t);

      {
        let j = 0;

        const identity = new THREE.Quaternion().identity();

        const stack = chunkObjects.slice();
        while (stack[0]) {
          const o = stack.shift()!;
          stack.unshift(...(o.children as THREE.Mesh[]));

          if (j > i) {
            o.quaternion.copy(identity);
          } else if (j === i) {
            o.quaternion.slerpQuaternions(identity, o.userData.rotation, t);
          } else if (j < i) {
            o.quaternion.copy(o.userData.rotation);
          }

          j++;
        }
      }

      {
        let j = 0;

        const stack = [];
        for (let i = 0; i < chunks.length; i++) {
          stack.push(chunks[i]);

          const mesh = chunkObjects[i];

          while (stack[0]) {
            j++;

            const o = stack.shift()!;
            stack.unshift(...o.children);

            if (j < i) {
            }
          }
        }
      }
    });
  }
})();
