# Rezone: concept

A city redevelopment sim on real maps. You load a real town, see its real
zoning, and decide what gets built next: you negotiate with developers, take
proposals to the council, and live with what residents think about it. The
first scenario is Farmington, Minnesota, where a $5 billion data center
campus is going through approvals, lawsuits and site work right now.

This is a sibling of [Corner Town](https://github.com/AlecHogstad/corner-town),
not a mode of it. Corner Town is a developer game on an invented map. Rezone
puts you on the city's side of the table, on a real one.

## The pitch

Farmington is a town of about 24,000 on the southern edge of the Twin Cities
metro. A developer wants to turn a former golf course at the edge of town
into a dozen data center buildings. It promises millions a year in property
tax and a few hundred jobs. It also wants millions of gallons of water a day
at peak, a lot of electricity, and land that was annexed from the township
next door. Some residents are suing.

You're the city. What do you agree to, on what terms, and what do the people
who live here think of you afterward?

Then the same questions for a warehouse by the highway, a subdivision on
farmland, apartments over shops downtown, or keeping the golf course.

## What makes it fun

- **Your own town, for real.** Recognizing your street, your school and the
  field the data center wants is the hook. Real maps are the point, not a
  backdrop.
- **Deals with tradeoffs you can't avoid.** Tax base against water, jobs
  against traffic, growth against the people who moved here for open space.
  No option is free, and the game shows you the bill.
- **People, not a happiness bar.** Homeowners, renters, farmers, downtown
  businesses, parents, environmental groups and the trades all weigh the same
  deal differently, and they vote and show up at hearings.
- **Fair to the real world.** The scenario starts from public facts and
  labels claims as claims. The game is a sandbox for exploring tradeoffs, not
  a verdict on a real project.

## Who you are

The city: in effect the council and the city administrator together. You:

- zone and rezone land (with a hearing and a council vote)
- review proposals that developers bring you, and negotiate their terms
- set the levy and spend the budget
- decide what the city provides: water, roads, parks, services

You don't build buildings yourself; developers do, if the terms work for
them. (That's the inverse of Corner Town.)

## The loop

1. **The town as it is.** Real streets, buildings, parcels and zoning, from
   public data. A budget, water and power capacity, and a population with
   opinions.
2. **Proposals arrive.** A developer wants to build something. Some fit the
   zoning; many need a rezoning, an annexation or a variance.
3. **Negotiate.** A term sheet with levers (below). The developer accepts,
   counters or walks.
4. **Hearings and the vote.** Groups weigh in by how the deal hits them. The
   council votes, and members who vote against their ward pay for it at the
   next election.
5. **Build out over years.** Construction, then operation: revenue arrives,
   water and power draw rise, traffic and noise change, land values move.
6. **Consequences.** Budget surpluses or shortfalls, utility upgrades someone
   has to pay for, lawsuits, elections. Then the next proposal.

## Systems

### The map (real data, simplified onto a grid)

- **Streets, buildings, land use, water, parks:** OpenStreetMap, which is free
  to use with attribution (ODbL). Not Google Maps: Google's terms don't allow
  extracting geometry to rebuild a city.
- **Parcels and property values:** Dakota County publishes parcel and property
  data free of charge through the Minnesota Geospatial Commons.
- **Zoning:** from the city of Farmington's zoning map (cities, not counties,
  zone in Minnesota). Simplified to a handful of districts the game
  understands: rural/agricultural, low-density residential, medium/high
  density, commercial, downtown mixed-use, industrial, business park,
  public/parks.
- **People:** Census and American Community Survey figures by block group:
  households, owners vs renters, ages, incomes, commute.

Real geometry is snapped onto a grid (about 10 meters a tile) so the game can
use Corner Town's renderer and simulation style: isometric tiles, a kit of
building forms, instanced trees and cars. Rendering real shapes directly is a
later option, not the first version.

### Zoning and rezoning

- Each parcel has a district. A proposal that doesn't fit needs a rezoning: a
  notice period, a planning commission hearing, then a council vote.
- Annexation brings township land into the city (Farmington's data center site
  was annexed). It can come with agreements with the township that constrain
  what you can do, and breaking them invites a lawsuit.
- Environmental review can be required for big projects. Skipping it is
  faster and is grounds for a challenge.

### Deals

A proposal is a term sheet. For a data center, the levers include:

- **Water:** a daily cap, closed-loop or air cooling (less water, more power),
  reuse of discharge, who pays for new wells or treatment.
- **Power:** who pays for transmission and substation upgrades, whether
  residents' rates are shielded, on-site generation or storage.
- **Money:** property tax with or without abatement, a payment in lieu of
  taxes, a community benefits fund, a guarantee of minimum assessed value.
- **Neighbors:** setbacks, berms and screening, noise limits at the property
  line, construction traffic routes and hours.
- **Openness:** whether the end user is named, whether the city staff signs
  NDAs.

The developer has its own model: a return it needs, sites in other towns it
can go to instead, and a deadline. Push too hard and it walks; give away too
much and you pay later.

Other proposal types reuse the same structure with different levers:
warehouses and logistics (truck routes, hours, jobs), manufacturing
(emissions, jobs, rail), subdivisions (park dedication, school capacity,
road costs), apartments (affordability, parking), solar farms, golf courses
and their redevelopment.

### Sentiment: groups, not a single number

Each group cares about a weighted set of outcomes, near where they live:

| Group | Cares most about |
|---|---|
| Homeowners near the site | noise, views, traffic, property value, water |
| Homeowners elsewhere | property taxes, schools, the town's character |
| Renters | rent, jobs, transit, services |
| Farmers and township residents | annexation, water table, roads |
| Downtown businesses | customers, construction disruption, parking |
| Parents | schools (capacity and funding), safety, parks |
| Environmental groups | water, energy source, open space, process |
| Building trades | construction jobs, local hiring |
| Seniors on fixed incomes | property taxes, utility rates |

Opinion is local (distance to the site matters), sticky (people remember a
broken promise) and social (a hearing with a packed room moves the
undecided). Groups turn opinion into action: comments at hearings, petitions,
lawsuits, and votes.

### The budget and utilities

- Revenue: property tax (by assessed value and class), fees, state aid. A
  big commercial or industrial property shifts the tax burden off homes, which
  people notice.
- Costs: services that grow with population, roads, debt service, and capital
  projects such as wells, water treatment and a new school.
- Water: aquifer and well capacity, treatment, and peak versus average
  demand. Power: the utility's capacity and the cost of new transmission, and
  who pays it.

### Council and elections

Council members represent parts of town and face elections every two years
(in game time). Each votes by their own priorities and their constituents'
mood. Lose the council and your agenda stalls.

## Scenario 1: Farmington and the technology park

What's public, as of October 2026 (claims labeled as claims; see Sources):

- Farmington had 23,632 residents at the 2020 census.
- Tract's Farmington Technology Park: up to 12 data center buildings and over
  2.5 million square feet on about 340 acres, approaching $5 billion at full
  buildout (the developer's estimate). Listing sites describe the site as the
  former Fountain Valley Golf Course. The land was annexed from Castle Rock
  Township, and the Metropolitan Council approved the city's plan amendment
  on May 14, 2025.
- The developer said 275 to 300 permanent jobs and $16 to $18 million a year
  in property tax (November 2024 claims).
- Water: a city contract reportedly allows up to 2.93 million gallons a day
  at peak; the developer later said annual use would be capped at 50 million
  gallons; opponents have cited over 2 million gallons a day. Sources
  disagree, which is itself a good game mechanic: you negotiate under
  uncertainty.
- City staff signed NDAs with the developer; the city released employees
  from them in April 2026.
- Residents and the Coalition for Responsible Data Center Development sued,
  arguing breach of the annexation agreement with Castle Rock Township,
  inadequate notice and skipped environmental review.
- The developer lists site work through 2026 (soil and groundwater testing,
  demolishing the clubhouse, environmental cleanup) and a 2028 milestone.

How the scenario plays:

- **Start:** 2024, before the deal is signed. The site is a golf course and
  farmland in the township. The developer arrives with a proposal and an NDA.
- **Decisions:** sign the NDA or not; annex or not; how much environmental
  review; the term sheet; how to handle hearings.
- **Outcomes over ten years:** budget, utility capacity and rates, traffic,
  land values, each group's opinion, lawsuits, and two council elections.
- **Endings:** not a win screen. A report card for the town on several
  measures, compared with the path the real city took (where that's known)
  and with other choices players made.

## Building catalog (beyond Corner Town's)

Data center campus and single halls, warehouse/logistics, light
manufacturing, heavy manufacturing, solar farm, substation, water tower and
treatment plant, golf course, sports complex, big-box retail, business park,
subdivision (several densities), townhomes, apartments over retail, senior
housing, school expansion, park types.

## Tech plan

- Same stack as Corner Town: Next.js, React Three Fiber, zustand, vitest.
  Reuse its renderer kit (building forms, trees, cars, people, lighting) and
  the walking-distance and land-value simulation where they fit.
- A data pipeline that runs offline, not in the browser: scripts fetch
  OpenStreetMap (Overpass), county parcels and city zoning, snap them to a
  grid and write one JSON file per town into the repo. The game loads that
  file. Attribution (OpenStreetMap contributors, Dakota County) in the app and
  README.
- One town at first. The pipeline is the part that makes other towns cheap
  later.

## First version

1. **Farmington on a grid.** The pipeline for one town: OSM streets,
   buildings, water and parks for Farmington plus the site; parcels; zoning
   as an overlay. The town renders in Corner Town's style, and you can pan
   around and click a parcel to see its owner class, value and zone.
2. **One proposal, end to end.** The technology park: a term sheet with the
   levers above, a developer that accepts, counters or walks, a hearing, and
   a council vote.
3. **Groups and consequences.** Five or six groups with local, sticky
   opinions; budget, water and power effects over ten years; one election.
4. **The report card.**

After that: more proposal types (warehouse, subdivision, golf course
redevelopment), more towns, lawsuits as a system, and real-shape rendering.

## Open questions

- Is the player one person (a mayor) or the city as a whole? A mayor gives a
  face and a re-election arc.
- How literal should the Farmington scenario be? Real names for real
  organizations, or lightly fictionalized ("a data center developer")? Real
  public facts with fictional characters is probably the right line.
- Scale: the whole city (about 15 square miles) at 10 meters a tile is a big
  grid. The first version may cover the site, downtown and the neighborhoods
  in between.
- Which utility serves the site, and what the real capacity numbers are,
  need primary sources (utility filings, the city's water plan) before they
  go into the game.

## Sources

- [Farmington: Data Center (Farmington Technology Park), City of Farmington](https://www.farmingtonmn.gov/473/Data-Center-Farmington-Technology-Park)
- [$5B data center park in Farmington moves forward despite objections (Star Tribune via Yahoo)](https://www.yahoo.com/news/5b-data-center-park-farmington-110700186.html)
- [Farmington officials signed NDA with data center developer Tract (Star Tribune)](https://www.startribune.com/farmington-tract-nda-data-center/601203732)
- [Proposed data center in Farmington sparks resident pushback (Star Tribune)](https://www.startribune.com/farmington-data-center-tract/601173097)
- [Farmington, Minn., residents sue to stop data center park (GovTech)](https://www.govtech.com/infrastructure/farmington-minn-residents-sue-to-stop-data-center-park)
- [Farmington sued by group over plans to build data center (KSTP)](https://kstp.com/kstp-news/local-news/farmington-sued-by-group-over-plans-to-build-data-center/)
- [Deep dive: the Farmington push for responsible hyperscale data centers (streets.mn)](https://streets.mn/2025/11/07/deep-dive-the-farmington-push-for-responsible-hyper-scale-data-centers/)
- [Minnesota Senate committee filing on Farmington water contract (SF 3852)](https://assets.senate.mn/committees/2025-2026/3130_Committee_on_Environment_Climate_and_Legacy/Mo-Feshami_SF-3852.pdf)
- [Farmington Technology Park, Tract project site](https://www.mnlcofarmington.com/)
- [Farmington Technology Park building listings (datacentermap.com)](https://www.datacentermap.com/usa/minnesota/minneapolis/farmington-technology-park-building-3/)
- [Farmington, Minnesota (Wikipedia)](https://en.wikipedia.org/wiki/Farmington,_Minnesota)
- [Dakota County GIS data](https://www.co.dakota.mn.us/HomeProperty/MappingServices/GISData)
- [Dakota County property information (Minnesota Geospatial Commons)](https://gisdata.mn.gov/de/dataset/us-mn-co-dakota-loc-property-information-service)

These were gathered from search results in October 2026, and several disagree
on dates and figures (noted above). Check the primary sources (city council
minutes, the court docket, the water contract) before any number goes into
the game.
