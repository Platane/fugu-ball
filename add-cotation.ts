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

//
// add edges

let annotations = "";

const edges = new Map<string, { a: [number, number]; b: [number, number] }>();

for (const polygon of polygons) {
  let b = polygon.at(-1);

  for (const a of polygon) {
    edges.set(a[0] + "" + b[0] + a[1] + "" + b[1], { a, b });

    b = a;
  }

  {
    const a = polygon[0];
    const b = polygon[2];

    const key = a[0] + "" + b[0] + a[1] + "" + b[1];

    if (!edges.has(key)) {
      edges.set(key, { a, b });

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

  edges.set(minX + "" + minY + minX + "" + maxY, {
    a: [minX, minY],
    b: [minX, maxY],
  });
  edges.set(minX + "" + minY + maxX + "" + minY, {
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

for (const { a, b } of edges.values()) {
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
