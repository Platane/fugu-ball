import * as THREE from "three";

export type Face = [THREE.Vector3, THREE.Vector3, THREE.Vector3];

interface F {
  face: THREE.Vector3[];
  position: THREE.Vector3;
  origin: THREE.Vector3;
  rotation: THREE.Quaternion;
  children: F[];
  parent: F | null;
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
    // take an arbitrary face of the list as parent
    const f0 = faces.shift()!;

    const n0 = getFaceNormal(f0);

    const q0 = getRotationFromAtoB(n0, UP);

    const centerOfFace = new THREE.Vector3(
      (f0[0].x + f0[1].x + f0[2].x) / 3,
      (f0[0].y + f0[1].y + f0[2].y) / 3,
      (f0[0].z + f0[1].z + f0[2].z) / 3,
    );

    const flatFace = f0.map((p) => {
      const ce = new THREE.Vector3().subVectors(p, centerOfFace);

      ce.applyQuaternion(q0);
      ce.x += centerOfFace.x;
      ce.z += centerOfFace.z;

      return ce;
    });

    const root: F = {
      face: flatFace,
      children: [],
      parent: null,
      rotation: q0.clone().invert(),
      origin: centerOfFace,
      position: new THREE.Vector3(0, centerOfFace.y, 0),
    };
    chunks.push(root);

    const edges = [
      { a: f0[1], b: f0[2], parent: root },
      { a: f0[2], b: f0[0], parent: root },
      { a: f0[0], b: f0[1], parent: root },
    ];

    while (edges[0]) {
      const edge = edges.shift()!;

      let adjacentFace: Face | undefined;

      out: for (let i = faces.length; i--; ) {
        const f = faces[i];

        for (let k = 3; k--; ) {
          if (f[k + 0] === edge.b && f[(k + 1) % 3] === edge.a) {
            adjacentFace = [f[k + 0], f[(k + 1) % 3], f[(k + 2) % 3]];

            faces.splice(i, 1);

            break out;
          }
        }
      }

      if (!adjacentFace) {
        continue;
      }

      const foldedFace = adjacentFace.map((p) => p.clone()) as Face;

      {
        let ancestors = [];
        let e: F | null = edge.parent;
        while (e) {
          ancestors.push(e);
          e = e.parent;
        }
        ancestors.reverse();
        for (const { origin, rotation } of ancestors) {
          for (const p of foldedFace) {
            p.sub(origin);
            p.applyQuaternion(rotation);
            p.add(origin);
          }
        }
      }

      const origin = foldedFace[0];

      const n = getFaceNormal(foldedFace);

      const axis = new THREE.Vector3()
        .subVectors(foldedFace[1], foldedFace[0])
        .normalize();

      const oc = new THREE.Vector3()
        .subVectors(foldedFace[2], origin)
        .normalize();

      const rotation = new THREE.Quaternion();
      // stupid implementation
      {
        let bestDot = -Infinity;
        let bestAngle = 0;

        const tmp = new THREE.Vector3();
        const n = 500;
        for (let k = n; k--; ) {
          const t = k / n;
          const angle = Math.PI * 2 * t - Math.PI;

          rotation.setFromAxisAngle(axis, angle);

          tmp.copy(oc);
          tmp.applyQuaternion(rotation);

          const dot = -tmp.cross(axis).y;

          if (dot > bestDot) {
            bestDot = dot;
            bestAngle = angle;
          }
        }

        rotation.setFromAxisAngle(axis, bestAngle);
      }

      const flatFace = foldedFace.map((p_) => {
        const p = p_.clone();
        p.sub(origin);
        p.applyQuaternion(rotation);

        return p;
      });

      const f: F = {
        position: new THREE.Vector3(),
        origin: origin,
        children: [],
        rotation: rotation.clone().invert(),
        face: flatFace,
        parent: edge.parent,
      };

      edge.parent.children.push(f);

      edges.push(
        { a: adjacentFace[1], b: adjacentFace[2], parent: f },
        { a: adjacentFace[2], b: adjacentFace[0], parent: f },
      );

      break;
    }
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
