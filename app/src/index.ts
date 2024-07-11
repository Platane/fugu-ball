import { loadGeometry } from "./fold/loadGeometry";
import { createRenderer } from "./renderer/index";

const { renderer, scene } = createRenderer();
document.body.appendChild(renderer.domElement);

import { extractFaces, flatten } from "./fold/flatten";

// @ts-ignore
import modelUrl from "../../fish2.glb?url";

(async () => {
  const faces = extractFaces(await loadGeometry(modelUrl));

  console.log(flatten(faces));
})();
