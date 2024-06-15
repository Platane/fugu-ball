const file = Bun.file("./flat.svg");

const text = await file.text();

const polygons: [number, number][][] = [...text.matchAll(/points="([^"]*)"/g)]

  //
  .map(([, ps]) =>
    ps
      .split(" ")
      .filter((x) => x.trim())
      .map((p) => p.split(",").map((x) => parseFloat(x)))
  );

const scale = 1;

//
//

let annotations = "";

const edges = new Map();

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
        `<line x1="${a[0]}" x2="${b[0]}" y1="${a[1]}" y2="${b[1]}" stroke="#666" stroke-width="1" />`;
    }
  }
}

const font = "20px monospace";

for (const { a, b } of edges.values()) {
  const cx = (a[0] + b[0]) / 2;
  const cy = (a[1] + b[1]) / 2;

  const l = Math.hypot(a[0] - b[0], a[1] - b[1]);

  const label = (l * scale).toFixed(2);
  const textLength = 60;

  annotations +=
    "\n" +
    `<circle cx="${cx}" cy="${cy}" r="3" fill="#333" />` +
    "\n" +
    `<text x="${cx - textLength / 2}" y="${
      cy + 1
    }" textLength="${textLength}">` +
    label +
    "</text>";
}

annotations += `\n<style>
    text {
        font: ${font};
    }
</style>
`;

await Bun.write(
  "./flat-annotated.svg",
  text.replace(/<\/svg>/, (s) => annotations + s)
);
