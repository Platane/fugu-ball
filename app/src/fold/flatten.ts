import * as THREE from "three";

export type Face = [THREE.Vector3, THREE.Vector3, THREE.Vector3];

interface F {
  face: THREE.Vector3[];
  origin: THREE.Vector3;
  rotation: THREE.Quaternion;
  // rotationAxis: { o: THREE.Vector3; v: THREE.Vector3 };
  // rotationAngle: number;
  children: F[];
}

/**
 * return an array of hierarchy
 */
export const flatten = (faces_: Face[]) => {
  const UP = new THREE.Vector3(0, 1, 0);

  const faces = faces_.slice();

  const chunks: F[] = [];

  // until there is no faces...
  while (faces[0]) {
    const parent: F = {
      face: [],
      children: [],
      rotationAxis: {
        v: new THREE.Vector3(),
        o: new THREE.Vector3(),
      },
      rotationAngle: 0,
    };

    // take an arbitrary face of the list as parent
    const f0 = faces.shift()!;

    const n0 = getFaceNormal(f0);

    const q0 = getRotationFromAtoB(n0, UP);

    const centerOfFace = new THREE.Vector3(
      (f0[0].x + f0[1].x + f0[2].x) / 3,
      (f0[0].y + f0[1].y + f0[2].y) / 3,
      (f0[0].z + f0[1].z + f0[2].z) / 3,
    );

    const flat = f0.map((p) => {
      const ce = new THREE.Vector3().subVectors(p, centerOfFace);

      ce.applyQuaternion(q0);
      ce.add(centerOfFace);

      return ce;
    });

    console.log(getFaceNormal(flat).dot(UP));

    parent.face.push(...flat);

    const edges = [
      [f0[0], f0[1]],
      [f0[1], f0[2]],
      [f0[2], f0[0]],
    ];

    while (edges[0]) {
      break;
    }

    chunks.push(parent);
  }

  return chunks;
};

export const extractFaces = (geometry: THREE.BufferGeometry) => {
  const vertices: THREE.Vector3[] = [];
  const faces: Face[] = [];

  for (let i = 0; i < geometry.attributes.position.array.length; i += 3) {
    vertices.push(
      new THREE.Vector3(
        geometry.attributes.position.array[i + 0],
        geometry.attributes.position.array[i + 1],
        geometry.attributes.position.array[i + 2],
      ),
    );
  }
  if (geometry.index)
    for (let i = 0; i < geometry.index.array.length; i += 3) {
      faces.push([
        vertices[geometry.index.array[i + 0]],
        vertices[geometry.index.array[i + 1]],
        vertices[geometry.index.array[i + 2]],
      ]);
    }
  else {
    throw new Error("unindexed geometry not implemented");
  }

  return faces;
};

const getFaceNormal = ([a, b, c]: Face) => {
  const ab = new THREE.Vector3().subVectors(b, a).normalize();
  const ac = new THREE.Vector3().subVectors(c, a).normalize();
  return new THREE.Vector3().crossVectors(ab, ac).normalize();
};

/**
 * assuming a and b are normalized
 */
const getRotationFromAtoB = (a: THREE.Vector3, b: THREE.Vector3) => {
  const q = new THREE.Quaternion();

  const dot = a.dot(b);

  if (dot > 0.999999) {
    q.identity();
    return q;
  }
  if (dot < -0.999999) {
    throw "not implemented";
  }

  const u = new THREE.Vector3().crossVectors(a, b);

  q.x = u.x;
  q.y = u.y;
  q.z = u.z;
  q.w = 1 + dot;

  q.normalize();

  return q;
};
