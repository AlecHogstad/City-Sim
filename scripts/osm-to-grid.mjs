#!/usr/bin/env node
/**
 * Fetches a town from OpenStreetMap and snaps it onto a tile grid: the first
 * step of turning a real place into a playable map.
 *
 *   node scripts/osm-to-grid.mjs --town Farmington --state Minnesota --out data/farmington
 *
 * Writes:
 *   <out>.json      the grid: one string per row, one character per tile (legend below)
 *   <out>.png       a picture of the grid, to check it looks like the town
 *   <out>.osm.json  the raw OpenStreetMap response, so you can re-grid without downloading again
 *
 * Options:
 *   --town NAME      city or town name, as OpenStreetMap has it (with --state)
 *   --state NAME     the state it's in, to tell same-named towns apart
 *   --bbox S,W,N,E   a box in degrees instead of a town (e.g. to include land just outside the city limits)
 *   --tile METERS    size of a tile (default 15)
 *   --input FILE     grid a saved .osm.json instead of downloading
 *   --out PATH       where to write (without extension)
 *   --server URL     Overpass server (default https://overpass-api.de/api/interpreter)
 *
 * Needs Node 18 or newer (for built-in fetch). No other dependencies.
 * Map data © OpenStreetMap contributors, available under the Open Database License (ODbL).
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { deflateSync } from "node:zlib";

/** One character per tile. Later layers paint over earlier ones. */
export const LEGEND = {
  ".": { name: "open land", color: [214, 220, 196] },
  F: { name: "farmland or meadow", color: [228, 222, 170] },
  H: { name: "residential area", color: [226, 214, 206] },
  C: { name: "commercial or retail area", color: [240, 196, 196] },
  I: { name: "industrial area", color: [214, 196, 230] },
  E: { name: "school, hospital or other institution", color: [246, 230, 170] },
  P: { name: "park, playground or sports ground", color: [160, 206, 140] },
  G: { name: "golf course", color: [130, 190, 120] },
  T: { name: "woods", color: [110, 160, 100] },
  W: { name: "water", color: [120, 170, 220] },
  K: { name: "footpath or trail", color: [190, 160, 120] },
  R: { name: "road", color: [90, 90, 96] },
  B: { name: "building", color: [150, 80, 60] },
};

const HELP = `Fetches a town from OpenStreetMap and snaps it onto a tile grid.

  node scripts/osm-to-grid.mjs --town Farmington --state Minnesota --out data/farmington

  --town NAME      city or town name, as OpenStreetMap has it (with --state)
  --state NAME     the state it's in
  --bbox S,W,N,E   a box in degrees instead of a town
  --tile METERS    size of a tile (default 15)
  --input FILE     grid a saved .osm.json instead of downloading
  --out PATH       where to write, without extension (default data/<town>)
  --server URL     Overpass server (default https://overpass-api.de/api/interpreter)`;

// ---------- arguments ----------

function parseArgs(argv) {
  const args = { tile: 15, server: "https://overpass-api.de/api/interpreter" };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, "");
    const value = argv[i + 1];
    if (["town", "state", "bbox", "tile", "input", "out", "server"].includes(key)) { args[key] = value; i++; }
    else if (key === "help" || key === "h") args.help = true;
    else throw new Error(`Unknown option ${argv[i]} (try --help)`);
  }
  args.tile = Number(args.tile);
  if (!args.out) args.out = `data/${(args.town ?? "town").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return args;
}

// ---------- download ----------

/** The Overpass query: everything that shapes the map, inside the town or a box. */
export function overpassQuery({ town, state, bbox }) {
  const scope = bbox ? `(${bbox})` : "(area.town)";
  const area = bbox ? "" : `area["name"="${state}"]["admin_level"="4"]->.state;\narea["name"="${town}"]["boundary"="administrative"](area.state)->.town;\n`;
  return `[out:json][timeout:180];
${area}(
  way["highway"]${scope};
  way["building"]${scope};
  way["landuse"]${scope};
  relation["landuse"]${scope};
  way["leisure"]${scope};
  relation["leisure"]${scope};
  way["natural"~"water|wood|wetland"]${scope};
  relation["natural"~"water|wood|wetland"]${scope};
  way["waterway"]${scope};
  way["amenity"~"school|hospital|college|university"]${scope};
);
out geom;`;
}

async function download(args) {
  const query = overpassQuery(args);
  console.log(`Asking ${args.server} for ${args.bbox ? `the box ${args.bbox}` : `${args.town}, ${args.state}`}…`);
  const response = await fetch(args.server, { method: "POST", body: new URLSearchParams({ data: query }), headers: { "User-Agent": "city-sim osm-to-grid (github.com/AlecHogstad/city-sim)" } });
  if (!response.ok) throw new Error(`Overpass answered ${response.status} ${response.statusText}: ${(await response.text()).slice(0, 300)}`);
  return response.json();
}

// ---------- geometry ----------

/** Degrees to meters around a reference latitude (accurate enough for a town). */
function projector(lat0, lon0) {
  const mPerLat = 111_320, mPerLon = 111_320 * Math.cos((lat0 * Math.PI) / 180);
  return ({ lat, lon }) => [(lon - lon0) * mPerLon, (lat0 - lat) * mPerLat]; // x east, y south (rows go down)
}

/** Joins open ways (as relations hand them over) into closed rings, end to end. */
function stitch(lines) {
  const rings = [], open = lines.map((l) => [...l]).filter((l) => l.length > 1);
  const same = (a, b) => a.lat === b.lat && a.lon === b.lon;
  while (open.length) {
    let ring = open.shift();
    let grew = true;
    while (!same(ring[0], ring[ring.length - 1]) && grew) {
      grew = false;
      for (let i = 0; i < open.length; i++) {
        const l = open[i], end = ring[ring.length - 1];
        if (same(l[0], end)) ring = ring.concat(l.slice(1));
        else if (same(l[l.length - 1], end)) ring = ring.concat([...l].reverse().slice(1));
        else continue;
        open.splice(i, 1); grew = true; break;
      }
    }
    if (ring.length > 3) rings.push(ring);
  }
  return rings;
}

/** The rings of an area: a closed way, or a relation's outer and inner members (holes cut by even-odd). */
function ringsOf(element) {
  if (element.type === "way") {
    const g = element.geometry ?? [];
    return g.length > 3 && g[0].lat === g[g.length - 1].lat && g[0].lon === g[g.length - 1].lon ? [g] : [];
  }
  if (element.type === "relation") return stitch((element.members ?? []).filter((m) => m.geometry).map((m) => m.geometry));
  return [];
}

// ---------- the grid ----------

/** What each OpenStreetMap feature becomes, and in what order layers are painted. */
function classify(tags) {
  const t = tags ?? {};
  if (t.building) return { layer: 6, code: "B", kind: "area" };
  if (t.highway) {
    if (["footway", "path", "cycleway", "pedestrian", "steps", "bridleway", "track"].includes(t.highway)) return { layer: 4, code: "K", kind: "line", width: 3 };
    const width = { motorway: 24, trunk: 20, primary: 16, secondary: 14, tertiary: 12, residential: 10, unclassified: 10, service: 6, living_street: 8 }[t.highway];
    return width ? { layer: 5, code: "R", kind: "line", width } : null;
  }
  if (t.waterway) return ["river", "canal"].includes(t.waterway) ? { layer: 3, code: "W", kind: "line", width: 12 } : ["stream", "ditch", "drain"].includes(t.waterway) ? { layer: 3, code: "W", kind: "line", width: 4 } : null;
  if (t.natural === "water" || t.landuse === "reservoir" || t.landuse === "basin") return { layer: 3, code: "W", kind: "area" };
  if (t.leisure === "golf_course") return { layer: 2, code: "G", kind: "area" };
  if (["park", "playground", "pitch", "sports_centre", "garden", "nature_reserve", "recreation_ground", "dog_park"].includes(t.leisure)) return { layer: 2, code: "P", kind: "area" };
  if (["school", "hospital", "college", "university"].includes(t.amenity)) return { layer: 1, code: "E", kind: "area" };
  if (t.natural === "wood" || t.landuse === "forest") return { layer: 1, code: "T", kind: "area" };
  if (t.natural === "wetland" || ["meadow", "grass", "farmland", "farmyard", "orchard"].includes(t.landuse)) return { layer: 0, code: "F", kind: "area" };
  if (t.landuse === "residential") return { layer: 0, code: "H", kind: "area" };
  if (["commercial", "retail"].includes(t.landuse)) return { layer: 0, code: "C", kind: "area" };
  if (["industrial", "railway", "construction", "landfill", "quarry"].includes(t.landuse)) return { layer: 0, code: "I", kind: "area" };
  if (["cemetery", "recreation_ground", "village_green"].includes(t.landuse)) return { layer: 2, code: "P", kind: "area" };
  if (["education", "institutional", "religious"].includes(t.landuse)) return { layer: 1, code: "E", kind: "area" };
  return null;
}

/** Snaps OpenStreetMap elements onto a grid of `tile`-meter squares. */
export function toGrid(osm, { tile = 15, name = "town", bbox } = {}) {
  const elements = (osm.elements ?? []).filter((e) => e.geometry || e.members);
  const points = [];
  for (const e of elements) {
    if (e.geometry) points.push(...e.geometry);
    for (const m of e.members ?? []) if (m.geometry) points.push(...m.geometry);
  }
  if (!points.length) throw new Error("No map features in the data. Check the town name and state (or try --bbox).");
  // The grid covers the box asked for, or everything that came back.
  let [south, west, north, east] = bbox ? bbox.split(",").map(Number) : [Infinity, Infinity, -Infinity, -Infinity];
  if (!bbox) for (const p of points) { south = Math.min(south, p.lat); north = Math.max(north, p.lat); west = Math.min(west, p.lon); east = Math.max(east, p.lon); }
  const project = projector(north, west);
  const [width, height] = project({ lat: south, lon: east });
  const cols = Math.ceil(width / tile), rows = Math.ceil(height / tile);
  if (cols * rows > 4_000_000) throw new Error(`That's ${cols}×${rows} tiles: too big. Use a bigger --tile or a smaller --bbox.`);
  const grid = Array.from({ length: rows }, () => new Array(cols).fill("."));
  const counts = {};

  const features = elements.map((e) => ({ e, c: classify(e.tags) })).filter((f) => f.c).sort((a, b) => a.c.layer - b.c.layer);
  for (const { e, c } of features) {
    counts[c.code] = (counts[c.code] ?? 0) + 1;
    if (c.kind === "line") paintLine(grid, (e.geometry ?? []).map(project), c.width / 2, tile, c.code);
    else {
      const rings = ringsOf(e).map((r) => r.map(project));
      if (rings.length) paintArea(grid, rings, tile, c.code);
    }
  }
  return {
    name,
    source: "OpenStreetMap",
    attribution: "© OpenStreetMap contributors (ODbL)",
    tileMeters: tile,
    origin: { lat: north, lon: west },
    bounds: { south, west, north, east },
    cols, rows,
    legend: Object.fromEntries(Object.entries(LEGEND).map(([code, { name }]) => [code, name])),
    features: counts,
    tiles: grid.map((row) => row.join("")),
  };
}

/** Fills tiles whose centres fall inside the rings (even-odd, so inner rings are holes). */
function paintArea(grid, rings, tile, code) {
  const rows = grid.length, cols = grid[0].length;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rings) for (const [x, y] of r) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  const z0 = Math.max(0, Math.floor(minY / tile)), z1 = Math.min(rows - 1, Math.floor(maxY / tile));
  const x0 = Math.max(0, Math.floor(minX / tile)), x1 = Math.min(cols - 1, Math.floor(maxX / tile));
  let painted = 0;
  for (let z = z0; z <= z1; z++) {
    const py = (z + 0.5) * tile;
    // Where each ring edge crosses this row of tile centres.
    const crossings = [];
    for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if ((yi > py) !== (yj > py)) crossings.push(xi + ((py - yi) / (yj - yi)) * (xj - xi));
    }
    crossings.sort((a, b) => a - b);
    for (let k = 0; k + 1 < crossings.length; k += 2) {
      const from = Math.max(x0, Math.ceil(crossings[k] / tile - 0.5)), to = Math.min(x1, Math.floor(crossings[k + 1] / tile - 0.5));
      for (let x = from; x <= to; x++) { grid[z][x] = code; painted++; }
    }
  }
  // Something smaller than a tile (a house on big tiles) still gets the tile at its middle.
  if (!painted) {
    const tx = Math.floor((minX + maxX) / 2 / tile), tz = Math.floor((minY + maxY) / 2 / tile);
    if (tx >= 0 && tz >= 0 && tx < cols && tz < rows) grid[tz][tx] = code;
  }
}

/** Paints a line `half` meters either side of its path. */
function paintLine(grid, path, half, tile, code) {
  const rows = grid.length, cols = grid[0].length;
  const r = Math.ceil(half / tile);
  for (let i = 1; i < path.length; i++) {
    const [ax, ay] = path[i - 1], [bx, by] = path[i];
    const length = Math.hypot(bx - ax, by - ay);
    const steps = Math.max(1, Math.ceil(length / (tile / 3)));
    for (let s = 0; s <= steps; s++) {
      const x = ax + ((bx - ax) * s) / steps, y = ay + ((by - ay) * s) / steps;
      const cx = Math.floor(x / tile), cz = Math.floor(y / tile);
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        const tx = cx + dx, tz = cz + dz;
        if (tx < 0 || tz < 0 || tx >= cols || tz >= rows) continue;
        // The tile the line passes through always; its neighbors if they're within the line's width.
        if ((dx === 0 && dz === 0) || Math.hypot((tx + 0.5) * tile - x, (tz + 0.5) * tile - y) < half) grid[tz][tx] = code;
      }
    }
  }
}

// ---------- the picture ----------

/** A PNG of the grid, a pixel or more per tile. No image library: just zlib and a few checksums. */
export function toPng(map, scale = Math.max(1, Math.floor(1600 / Math.max(map.cols, map.rows)))) {
  const w = map.cols * scale, h = map.rows * scale;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    const row = map.tiles[Math.floor(y / scale)];
    for (let x = 0; x < w; x++) {
      const [r, g, b] = (LEGEND[row[Math.floor(x / scale)]] ?? LEGEND["."]).color;
      const o = y * (w * 3 + 1) + 1 + x * 3;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(w, 0); header.writeUInt32BE(h, 4);
  header[8] = 8; header[9] = 2; // 8-bit RGB
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ---------- run ----------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (!args.input && !args.bbox && !(args.town && args.state))) {
    console.log(HELP);
    return;
  }
  mkdirSync(dirname(args.out), { recursive: true });
  let osm;
  if (args.input) {
    osm = JSON.parse(readFileSync(args.input, "utf8"));
  } else {
    osm = await download(args);
    writeFileSync(`${args.out}.osm.json`, JSON.stringify(osm));
    console.log(`Saved the raw data to ${args.out}.osm.json (${(osm.elements ?? []).length} features).`);
  }
  const map = toGrid(osm, { tile: args.tile, name: args.town ?? "town", bbox: args.bbox });
  writeFileSync(`${args.out}.json`, JSON.stringify(map));
  writeFileSync(`${args.out}.png`, toPng(map));
  const km = (n) => ((n * args.tile) / 1000).toFixed(1);
  console.log(`Grid: ${map.cols} × ${map.rows} tiles of ${args.tile} m (${km(map.cols)} × ${km(map.rows)} km).`);
  console.log(`Features: ${Object.entries(map.features).map(([code, n]) => `${n} ${LEGEND[code].name}`).join(", ")}.`);
  console.log(`Wrote ${args.out}.json and ${args.out}.png.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { console.error(error.message); process.exit(1); });
