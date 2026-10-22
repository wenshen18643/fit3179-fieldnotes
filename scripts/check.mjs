// npm run check: checks the data adds up, then draws every chart at desktop and phone
// width and makes sure each one renders and each control changes its chart.
import fs from "node:fs/promises";
import path from "node:path";
import * as vega from "vega";
import { compile } from "vega-lite";

// Same as build-specs.mjs: load the chart builders out of index.html.
const chartCode = (page) => {
  const script = page.split('<script type="module">')[1];
  const end = script.indexOf("};", script.indexOf("export const chartBuilders")) + 2;
  return script.slice(0, end);
};
const page = await fs.readFile("index.html", "utf8");
const { chartBuilders } = await import(
  "data:text/javascript," + encodeURIComponent(chartCode(page))
);
const data = JSON.parse(await fs.readFile("data/story.json", "utf8"));
const table = async (name) => JSON.parse(await fs.readFile(`data/processed/${name}.json`, "utf8"));
const [flows, monthly, families, coverage] = await Promise.all(
  ["flows", "monthly", "families", "coverage"].map(table),
);
// Every breakdown (by state, source, map square, month, family) must sum to the same total.
const assert = (ok, message) => {
  if (!ok) throw new Error(message);
};
assert(
  data.states.reduce((sum, row) => sum + row.count, 0) === data.insights.total,
  "State totals do not reconcile",
);
assert(
  flows.reduce((sum, row) => sum + row.count, 0) === data.insights.total,
  "Source totals do not reconcile",
);
assert(
  data.grid.reduce((sum, row) => sum + row.count, 0) === data.insights.total,
  "Map totals do not reconcile",
);
assert(
  monthly.reduce((sum, row) => sum + row.count, 0) === data.insights.total,
  "Monthly totals do not reconcile",
);
assert(
  families.reduce((sum, row) => sum + row.count, 0) === data.insights.total,
  "Family totals do not reconcile",
);
assert(
  coverage
    .filter((row) => row.year === 2025 && row.source === "eBird Australia" && row.month >= 9)
    .every((row) => row.count === 0),
  "Unexpected source coverage; reconsider 2024 baseline",
);
assert(
  data.threatenedRecords.every((row) => row.count > 0 && row.scientific.split(" ").length === 2),
  "Conservation join contains unmatched or infraspecific taxa",
);
// Draw each chart without a browser and save it as an SVG in artifacts/qa to look at.
await fs.mkdir("artifacts/qa", { recursive: true });
let passed = 0;
for (const width of [920, 360])
  for (const [id, builder] of Object.entries(chartBuilders)) {
    const spec = builder(data, width);
    const runtime = spec.$schema.includes("vega-lite") ? compile(spec).spec : spec;
    const view = new vega.View(vega.parse(runtime), { renderer: "none" });
    try {
      await view.runAsync();
      const svg = await view.toSVG();
      assert(svg.includes("<svg"), "No SVG output: " + id);
      assert(!/\b(?:NaN|Infinity)\b/.test(svg), "Invalid plotted coordinate: " + id);
      await fs.writeFile(path.join("artifacts/qa", `${id}-${width}.svg`), svg);
      // Change each chart's control and make sure the picture changes.
      const controls = {
        "seasonal-footprint": ["phase", 2],
        "monthly-ranks": ["highlight", "Australian Magpie"],
        "observation-atlas": ["cover", 0.9],
        "record-density": ["measure", "people"],
        "season-field": ["who", "Bee-eater"],
        "state-circles": ["picked", "SA"],
        "shared-responsibility": ["picked", "SA"],
      };
      if (controls[id]) {
        view.signal(...controls[id]);
        await view.runAsync();
        assert((await view.toSVG()) !== svg, "Control did not change output: " + id);
      }
      console.log("PASS", id, width);
      passed++;
    } finally {
      view.finalize();
    }
  }
console.log(
  `Passed aggregation, source-coverage and interaction checks; rendered ${passed} desktop/mobile SVG charts.`,
);
