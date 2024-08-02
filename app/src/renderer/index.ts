import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export const createRenderer = () => {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  //

  const scene = new THREE.Scene();

  {
    const dirLight1 = new THREE.DirectionalLight(0x404040, 50);
    dirLight1.position.set(2, 2.5, 2.6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x363011, 30);
    dirLight2.position.set(1, 1.4, -2.6);
    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0x666666, 10);
    dirLight3.position.set(0, 3, 0.1);
    scene.add(dirLight3);

    // scene.add(new THREE.DirectionalLightHelper(dirLight1));
    // scene.add(new THREE.DirectionalLightHelper(dirLight2));
    // scene.add(new THREE.DirectionalLightHelper(dirLight3));

    const ambientLight = new THREE.AmbientLight(0x404040, 15);
    scene.add(ambientLight);
  }

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial({ color: "#3de541" }),
  );
  scene.add(cube);

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    1,
    20000,
  );
  camera.position.set(30, 30, 100);
  {
    const p = location.hash
      .split("#")[1]
      ?.match(/([\d.-]*),([\d.-]*),([\d.-]*)/);
    if (p) camera.position.set(+p[1], +p[2], +p[3]);
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.8;
  controls.target.set(0, 0, 0);
  controls.minDistance = 1.0;
  controls.maxDistance = 10.0;
  controls.update();
  {
    let timeout: string | number | NodeJS.Timeout | undefined;
    controls.addEventListener("change", () => {
      clearTimeout(timeout);
      timeout = setTimeout(
        () =>
          history.replaceState(
            {},
            "",
            "#" +
              camera.position
                .toArray()
                .map((x) => Math.round(x * 100) / 100)
                .join(","),
          ),
        200,
      );
    });
  }

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });

  window.addEventListener(
    "resize",
    () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    },
    false,
  );

  return { scene, renderer };
};
