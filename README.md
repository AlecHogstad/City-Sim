# Rezone

A city redevelopment sim on real maps. Load a real town, see its real zoning,
and decide what gets built next: negotiate with developers, take proposals to
the council, and live with what residents think of it.

The first scenario is Farmington, Minnesota, and the data center campus
proposed on the edge of town.

**Status:** concept. Nothing playable yet. Start with
[docs/CONCEPT.md](docs/CONCEPT.md): the pitch, the systems, the Farmington
scenario, the data sources and the first-version plan.

A sibling of [Corner Town](https://github.com/AlecHogstad/corner-town), and
planned to reuse its renderer and simulation style.

## Get the map (step 1)

`scripts/osm-to-grid.mjs` downloads a town from OpenStreetMap and snaps it
onto a grid of tiles (15 m by default): roads, footpaths, buildings, water,
parks, the golf course, farmland and land use. It writes the grid as JSON and
a PNG preview. Needs Node 18 or newer; nothing to install.

```bash
npm run map:sample        # try it on a made-up patch first (no download)
npm run map:farmington    # the real thing: data/farmington.json and .png
```

Or with options:

```bash
# Everything inside the city limits, 10 m tiles
node scripts/osm-to-grid.mjs --town Farmington --state Minnesota --tile 10 --out data/farmington

# A box instead (south,west,north,east in degrees): include land outside the city
# limits, such as land annexed after OpenStreetMap's boundary was drawn
node scripts/osm-to-grid.mjs --bbox 44.59,-93.24,44.69,-93.09 --out data/farmington-area

# Re-grid a download you already have (no network)
node scripts/osm-to-grid.mjs --input data/farmington.osm.json --tile 20 --out data/farmington-20m
```

The tile legend is in the JSON (`legend`) and at the top of the script.

## Data

Map data will come from OpenStreetMap (© OpenStreetMap contributors, ODbL),
parcels from Dakota County, and zoning from the City of Farmington. See the
concept for details and attribution.

## License

MIT
