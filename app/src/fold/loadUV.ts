import * as THREE from "three";

export const loadUV = async (svgUvUrl: string) => {
  const svgUvContent = await fetch(svgUvUrl).then((res) => res.text());
  const uvPolygons: THREE.Vector2[][] = [
    ...svgUvContent.matchAll(/points="([^"]*)"/g),
  ].map(([, ps]) =>
    ps
      .split(" ")
      .filter((x) => x.trim())
      .map((p) => new THREE.Vector2(...p.split(",").map(Number)))
  );

  return uvPolygons;
};
