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
    const dirLight = new THREE.DirectionalLight(0x404040, 50);
    dirLight.position.set(2, 2.5, 2.6);
    scene.add(dirLight);

    scene.add(new THREE.DirectionalLightHelper(dirLight));

    const ambientLight = new THREE.AmbientLight(0x404040, 15);
    scene.add(ambientLight);
  }

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial({ color: "#3de541" })
  );
  scene.add(cube);

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  camera.position.set(30, 30, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 0, 0);
  controls.minDistance = 1.0;
  controls.maxDistance = 10.0;
  controls.update();

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
    false
  );

  return { scene, renderer };
};
