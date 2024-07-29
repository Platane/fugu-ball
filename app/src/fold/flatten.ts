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

    // rotate to flat it from an arbitrary axis (let's take the first edge)
    const o = f0[0].clone();
    const v = new THREE.Vector3()
      .crossVectors(
        new THREE.Vector3().subVectors(f0[1], o).normalize(),
        new THREE.Vector3().subVectors(f0[2], o).normalize(),
      )
      .normalize();

    const n0 = getFaceNormal(f0);

    const a = Math.acos(-n0.dot(UP));

    const flat = f0.map((p_) => {
      const p = p_.clone();

      p.sub(o);

      p.applyAxisAngle(v, a);

      p.add(o);

      return p;
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
const getRotationFromAtoB = (a: THREE.Vector3, b: THREE.Vector3) => {
  const q = new THREE.Quaternion();

  const dot = a.dot(b);

  if (dot > 0.999999) {
    q.identity();
    return q;
  }
  if (dot < 0.999999) {
    throw "not implemented";
  }

  const u = new THREE.Vector3().crossVectors(a, b).normalize();

  q.x = u.x;
  q.y = u.y;
  q.z = u.z;
  q.w = 1 + dot;

  q.normalize();

  return q;
};
