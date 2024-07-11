import * as THREE from "three";

type Face = [THREE.Vector3, THREE.Vector3, THREE.Vector3];

export const flatten = (faces_: Face[]) => {
  const getFaceNormal = ([a, b, c]: Face) => {
    const ab = new THREE.Vector3().subVectors(b, a).normalize();
    const ac = new THREE.Vector3().subVectors(c, a).normalize();
    return new THREE.Vector3().crossVectors(ab, ac).normalize();
  };
  const getRotationFromAtoB = (a: THREE.Vector3, b: THREE.Vector3) => {
    const q = new THREE.Quaternion();

    const dot = a.dot(b);

    if (dot > 0.999999) {
      q.identity();
      return q;
    }

    const u = new THREE.Vector3().crossVectors(a, b).normalize();

    q.x = u.x;
    q.y = u.y;
    q.z = u.z;
    q.w = 1 + dot;

    q.normalize();

    return q;
  };
  const getFlattenMatrix = (face: Face) => {
    const m = new THREE.Matrix4();

    const n = getFaceNormal(face);

    const q = getRotationFromAtoB(n, UP);

    const n_ = n.clone().applyQuaternion(q);
    console.log(n_.toArray());

    m.makeRotationFromQuaternion(q);

    return m;

    const a = face[0].clone().applyQuaternion(q);

    const tr = new THREE.Matrix4();

    tr.makeTranslation(new THREE.Vector3(0, -a.y, 0));

    // return m.multiply(tr);
  };

  const UP = new THREE.Vector3(0, 1, 0);

  const faces = faces_.slice();

  const chunks: { face: Face; flat: Face; m: THREE.Matrix4 }[][] = [];

  while (faces[0]) {
    const chunk: { face: Face; flat: Face; m: THREE.Matrix4 }[] = [];

    const f0 = faces.shift()!;
    const n0 = getFaceNormal(f0);
    const q0 = getRotationFromAtoB(n0, UP);

    const flat = f0.map((p) => p.applyQuaternion(q0));

    chunk.push({
      face: f0,
      flat,
      m: new THREE.Matrix4().makeRotationFromQuaternion(q0),
    });

    const edges = [
      [f0[0], f0[1]],
      [f0[1], f0[2]],
      [f0[2], f0[0]],
    ];

    while (edges[0]) {
      break;
    }

    chunks.push(chunk);
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
        geometry.attributes.position.array[i + 2]
      )
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
