const file = Bun.file("./flat.svg");

const text = await file.text();

const polygons: [number, number][][] = [...text.matchAll(/points="([^"]*)"/g)]

  //
  .map(([, ps]) =>
    ps
      .split(" ")
      .filter((x) => x.trim())
      .map((p) => p.split(",").map(Number))
  );

const edges = polygons.flatMap((polygon) =>
  polygon.map((_, i) => [polygon[i], polygon[(i + 1) % polygon.length]])
);

//
// add edges

let annotations = "";

const edgesMap = new Map<
  string,
  { a: [number, number]; b: [number, number] }
>();

for (const polygon of polygons) {
  let b = polygon.at(-1);

  for (const a of polygon) {
    edgesMap.set(a[0] + "" + b[0] + a[1] + "" + b[1], { a, b });

    b = a;
  }

  {
    const a = polygon[0];
    const b = polygon[2];

    const key = a[0] + "" + b[0] + a[1] + "" + b[1];

    if (!edgesMap.has(key)) {
      edgesMap.set(key, { a, b });

      annotations +=
        "\n" +
        `<line x1="${a[0]}" x2="${b[0]}" y1="${a[1]}" y2="${b[1]}" stroke="#888" stroke-width="1" />`;
    }
  }
}

//
// add bounding boxes

const clusters = polygons.map((p) => [p]);

for (let i = clusters.length; i--; ) {
  const keys = clusters[i].flat().map(([x, y]) => x + "-" + y);

  for (let j = i; j--; ) {
    if (
      clusters[j]
        .flat()
        .map(([x, y]) => x + "-" + y)
        .some((k) => keys.includes(k))
    ) {
      clusters[j].push(...clusters.splice(i, 1)[0]);
      break;
    }
  }
}

for (const cluster of clusters) {
  const points = cluster.flat();

  const margin = 10;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [x, y] of points) {
    minX = Math.min(minX, x - margin);
    minY = Math.min(minY, y - margin);
    maxX = Math.max(maxX, x + margin);
    maxY = Math.max(maxY, y + margin);
  }

  edgesMap.set(minX + "" + minY + minX + "" + maxY, {
    a: [minX, minY],
    b: [minX, maxY],
  });
  edgesMap.set(minX + "" + minY + maxX + "" + minY, {
    a: [minX, minY],
    b: [maxX, minY],
  });

  annotations +=
    "\n" +
    `<rect x="${minX}" y="${minY}" width="${maxX - minX}" height="${
      maxY - minY
    }" stroke="#666" stroke-width="1" fill="none" />`;
}

for (let i = clusters.length; i--; ) {
  for (let j = clusters[i].length; j--; ) {
    let cx = 0;
    let cy = 0;
    for (const [x, y] of clusters[i][j]) {
      cx += x;
      cy += y;
    }
    cx /= clusters[i][j].length;
    cy /= clusters[i][j].length;

    annotations +=
      "\n" +
      '<text class="label" ' +
      `x="${cx - 30}" ` +
      `y="${cy - 10}" ` +
      ">" +
      (i + 10).toString(36).toUpperCase() +
      (j + 1) +
      "</text>";
  }
}

const font = "54px monospace";
const scale = 0.095;

// add margin for glue

const pointEqual = (a: [number, number], b: [number, number]) =>
  a[0] === b[0] && a[1] === b[1];

{
  for (let i = edges.length; i--; ) {
    const [a, b] = edges[i];

    const l = Math.hypot(a[0] - b[0], a[1] - b[1]);

    const cx = (a[0] + b[0]) / 2;
    const cy = (a[1] + b[1]) / 2;

    let nx = a[1] - b[1];
    let ny = -(a[0] - b[0]);
    nx /= l;
    ny /= l;

    for (let j = i; j--; ) {
      const [a0, b0] = edges[j];

      if (pointEqual(a0, b) && pointEqual(a, b0)) break;

      const l0 = Math.hypot(a0[0] - b0[0], a0[1] - b0[1]);

      if (Math.abs(l - l0) < 0.01) {
        const c0x = (a0[0] + b0[0]) / 2;
        const c0y = (a0[1] + b0[1]) / 2;

        let n0x = a0[1] - b0[1];
        let n0y = -(a0[0] - b0[0]);
        n0x /= l0;
        n0y /= l0;

        let m = 20;

        if (
          [
            //
            49.7, 49.4, 77.9, 51.2, 41.8, 41.2, 35.6, 46.9, 50.6, 54.6, 46.3,
            39.6, 61.3, 29.3, 41.7,
          ].some((x) => Math.abs(x - l * scale) < 0.1)
        )
          m *= -1;

        const color = `hsl(${(i ** 3 + 17 * j ** 7) % 360} , 80% , 70%)`;
        const color0 = `hsl(${(i ** 13 + 7 * j ** 5) % 360} , 80% , 40%)`;

        annotations +=
          "\n" +
          `<circle ` +
          `cx="${cx + nx * m}" ` +
          `cy="${cy + ny * m}" ` +
          `r="26" ` +
          'stroke-width="8" ' +
          `fill="${color}" stroke="${color0}" />` +
          "\n" +
          `<circle ` +
          `cx="${c0x - n0x * m}" ` +
          `cy="${c0y - n0y * m}" ` +
          `r="26" ` +
          'stroke-width="8" ' +
          `fill="${color}" stroke="${color0}" />` +
          "\n" +
          `<line ` +
          `x1="${a0[0]}" ` +
          `x2="${b0[0]}" ` +
          `y1="${a0[1]}" ` +
          `y2="${b0[1]}" ` +
          `stroke-width="${m === -20 ? 20 : 4}" ` +
          `stroke="${color0}" />` +
          "\n" +
          `<line ` +
          `x1="${a[0]}" ` +
          `x2="${b[0]}" ` +
          `y1="${a[1]}" ` +
          `y2="${b[1]}" ` +
          `stroke-width="${m === 20 ? 20 : 4}" ` +
          `stroke="${color0}" />` +
          "\n";

        break;
      }
    }
  }
}

for (const { a, b } of edgesMap.values()) {
  const cx = (a[0] + b[0]) / 2;
  const cy = (a[1] + b[1]) / 2;

  const l = Math.hypot(a[0] - b[0], a[1] - b[1]);

  const label = (l * scale).toFixed(1);
  const textLength = 68;

  annotations +=
    "\n" +
    `<line ` +
    `x1="${cx - 20}" ` +
    `x2="${cx + 20}" ` +
    `y1="${cy}" ` +
    `y2="${cy}" ` +
    `stroke="#555" stroke-width="1.5" />` +
    "\n" +
    `<circle cx="${cx}" cy="${cy}" r="3" fill="#555" />` +
    "\n" +
    '<text class="quote" ' +
    `x="${cx - textLength / 2}" ` +
    `y="${cy - 3}" ` +
    ">" +
    label +
    "</text>";
}

annotations += `\n<style>
    text {
        font: ${font};
        text-shadow: 1px 0px 2px white, -1px 0px 2px white;
        letter-spacing:-0.1em;
    }
    
    text.label{
        font-size: 80px;
        fill: #1122ee88;
        font-weight: bold;
    }
</style>
`;

await Bun.write(
  "./flat-annotated.svg",
  text
    .replace(/<\/svg>/, (s) => "<g>" + annotations + "</g>" + s)
    .replace(/<svg /, (s) => s + ' style="width:100%;height:100%" ')
);

console.log("generated");
