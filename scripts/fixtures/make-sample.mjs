// Builds a small made-up patch of town in Overpass's "out geom" format, for testing osm-to-grid without a download.
import { writeFileSync } from "node:fs";
const LAT = 44.64, LON = -93.15, M = 1 / 111320, ML = 1 / (111320 * Math.cos((LAT * Math.PI) / 180));
const p = (x, y) => ({ lat: +(LAT - y * M).toFixed(7), lon: +(LON + x * ML).toFixed(7) });
const box = (x0, y0, x1, y1) => [p(x0, y0), p(x1, y0), p(x1, y1), p(x0, y1), p(x0, y0)];
let id = 1;
const way = (tags, geometry) => ({ type: "way", id: id++, tags, geometry });
const elements = [
  way({ landuse: "farmland" }, box(0, 0, 1200, 900)),
  way({ landuse: "residential" }, box(50, 50, 500, 450)),
  way({ highway: "primary" }, [p(0, 470), p(1200, 470)]),
  way({ highway: "residential" }, [p(260, 0), p(260, 470)]),
  way({ highway: "footway" }, [p(500, 150), p(700, 300), p(900, 300)]),
  way({ waterway: "river" }, [p(1000, 0), p(950, 400), p(1050, 900)]),
  way({ natural: "water" }, box(560, 560, 700, 680)),
  way({ leisure: "park" }, box(520, 60, 680, 200)),
  way({ amenity: "school" }, box(320, 300, 460, 420)),
  // A golf course as a relation: the outer ring split over two ways, and a hole (a clubhouse lot) inside.
  { type: "relation", id: id++, tags: { leisure: "golf_course", type: "multipolygon" }, members: [
    { type: "way", role: "outer", geometry: [p(100, 520), p(500, 520), p(500, 860)] },
    { type: "way", role: "outer", geometry: [p(500, 860), p(100, 860), p(100, 520)] },
    { type: "way", role: "inner", geometry: box(250, 650, 330, 720) },
  ] },
];
// A row of houses along the residential street, and a big building.
for (let i = 0; i < 12; i++) elements.push(way({ building: "house" }, box(275, 20 + i * 35, 295, 40 + i * 35)));
elements.push(way({ building: "yes" }, box(330, 320, 420, 380)));
writeFileSync(new URL("./sample.osm.json", import.meta.url), JSON.stringify({ elements }));
console.log(`Wrote ${elements.length} features to scripts/fixtures/sample.osm.json`);
