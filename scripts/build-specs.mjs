import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chartCode = (page) => {
  const script = page.split('<script type="module">')[1];
  const end = script.indexOf("};", script.indexOf("export const chartBuilders")) + 2;
  return script.slice(0, end);
};
const page = await fs.readFile(path.join(root, "index.html"), "utf8");
const { chartBuilders } = await import(
  "data:text/javascript," + encodeURIComponent(chartCode(page))
);
const tables = {
  australia: "australia",
  states: "states",
  grid: "grid",
  gridShapes: "grid-shapes",
  stateMonth: "state-month",
  speciesMonth: "species-month",
  rankings: "rankings",
  beeMap: "bee-map",
  beeRidges: "bee-ridges",
  beeMonth: "bee-month",
  threatenedRecords: "threatened-records",
  threatenedListings: "threatened-listings",
  upset: "upset",
  seasonField: "season-field",
  insights: "insights",
};
const entries = await Promise.all(
  Object.entries(tables).map(async ([key, file]) => [
    key,
    JSON.parse(await fs.readFile(path.join(root, "data/processed", file + ".json"), "utf8")),
  ]),
);
const data = Object.fromEntries(entries);
await fs.writeFile(path.join(root, "data/story.json"), JSON.stringify(data));
const headings = Object.fromEntries(
  [...page.matchAll(/<figure[^>]*data-chart="([^"]+)"[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/g)].map(
    ([, id, heading]) => [
      id,
      heading
        .replace(/<[^>]+>/g, "")
        .replace(/&[a-z]+;|['’]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    ],
  ),
);
// Long data tables are written to specs/data/ and linked by URL, so each specification stays short enough to read.
// The URLs point at the published site, so a specification also opens in the online Vega Editor.
const site = "https://wenshen18643.github.io/fit3179-fieldnotes/";
const dataDir = path.join(root, "specs", "data");
await fs.mkdir(dataDir, { recursive: true });
for (const dir of [path.join(root, "specs"), dataDir])
  for (const file of await fs.readdir(dir))
    if (file.endsWith(".json")) await fs.rm(path.join(dir, file));
const written = new Map();
const linkData = async (node, name, counter) => {
  if (Array.isArray(node)) {
    for (const item of node) await linkData(item, name, counter);
    return;
  }
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node.values) && JSON.stringify(node.values).length > 3000) {
    const text = JSON.stringify(node.values);
    if (!written.has(text)) {
      const file = `${name}-${++counter.n}.json`;
      await fs.writeFile(path.join(dataDir, file), text + "\n");
      written.set(text, file);
    }
    node.url = site + "specs/data/" + written.get(text);
    delete node.values;
  }
  for (const value of Object.values(node)) await linkData(value, name, counter);
};
for (const [id, build] of Object.entries(chartBuilders)) {
  if (!headings[id]) throw new Error("No heading on the page for " + id);
  const spec = build(data, 920);
  await linkData(spec, headings[id], { n: 0 });
  await fs.writeFile(
    path.join(root, "specs", headings[id] + ".json"),
    JSON.stringify(spec, null, 2) + "\n",
  );
}
await fs.mkdir(path.join(root, "vendor"), { recursive: true });
for (const [packageName, file, out] of [
  ["vega", "build/vega.min.js", "vega.min.js"],
  ["vega-lite", "build/vega-lite.min.js", "vega-lite.min.js"],
  ["vega-embed", "build/vega-embed.min.js", "vega-embed.min.js"],
]) {
  await fs.copyFile(
    path.join(root, "node_modules", packageName, file),
    path.join(root, "vendor", out),
  );
  await fs.copyFile(
    path.join(root, "node_modules", packageName, "LICENSE"),
    path.join(root, "vendor", packageName + "-LICENSE.txt"),
  );
}
console.log(
  `Built ${Object.keys(chartBuilders).length} readable specifications. Chart data: ${(JSON.stringify(data).length / 1024).toFixed(0)} KB.`,
);
