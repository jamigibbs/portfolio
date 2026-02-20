# Session Handoff — "Fuck, where do we go?" Travel Tool

## Project Overview

A single-page travel cost estimator. Two HTML files of note:

| File | Purpose |
|---|---|
| `fuck-where-do-we-go.html` | Main tool — the one we've been building |
| `fuck-where-do-we-go-script.js` | All JS for the main tool (~5000 lines) |
| `travel-cost-estimator.html` | Older version — ignore |

**Live branch**: `claude/travel-cost-estimator-G2tEY`
**PR link**: https://github.com/dnfisher/dnfisher.github.io/compare/main...claude/travel-cost-estimator-G2tEY

---

## Current State (v1.22.0)

### Architecture

The tool is a sidebar + map layout:
- **Sidebar** (400px): All controls, results, and the road trip panel
- **Map** (Leaflet.js): Destination markers, isochrones, road trip route polyline

### Three Planner Tabs

The top of the sidebar has three tabs:
1. **🚗 Driving Planner** — Sets max drive time; fetches TravelTime isochrone; shows reachable destinations as markers
2. **✈️ Flying Planner** — Sets max flight time; uses distance-based filtering (no isochrone); shows destinations as markers
3. **🗺️ Road Trip** — Completely separate UX (v1.22.0); see below

### Road Trip Tab (v1.22.0 — just added)

When the Road Trip tab is active, the entire sidebar content swaps to a focused road trip UI:
- Home city (shared with main tool — auto-populated)
- Destination city (Nominatim autocomplete)
- Optional End city (for A→B trips, otherwise out-and-back)
- Trip duration in days (stepper, 2–21)
- "Generate Road Trip" button
- Results: day-by-day timeline (Day 1, Day 2, etc.) with leg distances
- Map shows: orange dashed polyline route + numbered stop markers + nearby destination pins

### Three-Tier Destination System

All destinations in `DESTINATIONS` array in the script have a `touristScore` (1–10):
- **Tier 1** (7–10): Full popup card with hero image, weather, costs
- **Tier 2** (4–6): Full popup card
- **Tier 3** (unrated/1–3): Now also shows full popup card (bug was fixed in v1.21.0)

### APIs Used

| API | Purpose | Key location |
|---|---|---|
| TravelTime | Driving isochrones | `API_KEYS.travelTime` in script |
| Open-Meteo | Weather for destinations | Free, no key |
| Wikipedia | Hero images for destinations | Free, no key |
| Nominatim (OSM) | City autocomplete | Free, no key |
| Open Exchange Rates | Currency conversion | `API_KEYS.openExchange` |

---

## What Was Done in This Session

### v1.21.0 — Road Trip Generator + Popup Fix
- Removed the Tier 3 minimal popup branch — all destinations now show the full card
- Fixed popup options to always use `maxWidth: 550, minWidth: 520`
- Implemented all road trip JS functions:
  - `adjustRoadTripDays(delta)` — stepper
  - `setupCityAutocomplete(inputId, resultsId, onSelect)` — reusable Nominatim autocomplete
  - `initRoadTripAutocomplete()` — wires up destination + end city inputs
  - `generateRoadTrip()` — main orchestrator
  - `findRoadTripStops()` — geographic corridor algorithm (perpendicular distance from home→dest line)
  - `selectEvenlySpacedStops()` — bucket-based even spacing with tourist score tiebreaker
  - `displayRoadTripRoute()` — draws polyline + numbered markers on map
  - `renderRoadTripResults()` — sidebar results panel
  - `clearRoadTripRoute()` — cleanup
- Road trip results panel HTML added to sidebar (`#roadtripResults`)

### v1.22.0 — Road Trip Moved to Dedicated 3rd Tab
- Road trip controls removed from inside `.drive-options`
- New `.roadtrip-options` panel added at the same level as `.drive-options` / `.fly-options`
- `switchPlannerTab('roadtrip')` added; clears existing destination markers and isochrone when entering road trip mode
- Road trip tab gets its own full sidebar context — no Drive Time stepper, no budget section showing through
- Map in road trip mode: shows route + keeps nearby destination pins visible

---

## Key Code Patterns

### Switching planner tabs
```js
switchPlannerTab('drive' | 'fly' | 'roadtrip')
```
Toggles `.active` on `.planner-tab` buttons and shows/hides `.drive-options`, `.fly-options`, `.roadtrip-options` divs.

### Adding a new destination
The `DESTINATIONS` array is in the script file. Each entry looks like:
```js
{
  city: 'Nashville',
  region: 'Tennessee',
  country: 'United States',
  lat: 36.1627,
  lon: -86.7816,
  touristScore: 8,
  estimatedCostPerNight: 180
}
```

### Search flow
1. User sets home city → `selectHomeCity()` stores `selectedHomeCity`
2. User clicks "Find Destinations" → `searchDestinations()`
3. If drive mode → fetch isochrone → filter destinations inside polygon
4. If fly mode → filter by distance from home
5. Each destination gets enriched (`enrichDestination()`) with weather + Wikipedia image
6. `addDestinationMarker()` places a Leaflet marker with `bindPopup(createPopupContent(...))`

---

## GitHub — How It Currently Works

**Problem**: `gh` CLI is not installed. There's no way to create PRs programmatically from this environment.

**Current workaround**: All work is committed and pushed to `claude/travel-cost-estimator-G2tEY`. You (the user) manually create the PR by going to:
```
https://github.com/dnfisher/dnfisher.github.io/compare/main...claude/travel-cost-estimator-G2tEY
```

**Git push command used**:
```bash
git push -u origin claude/travel-cost-estimator-G2tEY
```

---

## GitHub MCP / Plugin — Try This in the New Session

The user has installed a Claude Code plugin (likely the **GitHub MCP server**). This can enable the assistant to:
- Create PRs directly
- Read/post PR comments
- List issues
- Merge branches

### What to do at the start of the new session

1. **Check what MCP servers are configured**:
```bash
cat ~/.claude.json | python3 -m json.tool | grep -A 20 mcpServers
# also check for project-level config:
cat /home/user/dnfisher.github.io/.mcp.json 2>/dev/null
# and global MCP json:
cat ~/.config/claude/mcp.json 2>/dev/null
```

2. **List available MCP tools** — ask Claude: *"What MCP tools do you have available?"* or look for tools with `mcp__` prefix.

3. **If GitHub MCP is active**, Claude should be able to call something like `mcp__github__create_pull_request` directly. Try asking: *"Create a PR from branch `claude/travel-cost-estimator-G2tEY` to main"*.

4. **If it's not configured yet**, the GitHub MCP server can be added. The official one is `@modelcontextprotocol/server-github` — it needs a GitHub personal access token. Configuration goes in either:
   - `/home/user/dnfisher.github.io/.mcp.json` (project-level)
   - Or via the Claude Code settings UI

---

## Potential Next Features

Things that came up but weren't built:
- **Cost per stop in road trip**: Each intermediate stop could fetch accommodation cost estimates (currently shows `null` for stops that aren't in the destinations dataset)
- **Better road trip stops**: The corridor algorithm uses straight-line distance; could be improved with actual road routing via a routing API
- **Save/share trips**: Export a road trip as a link or PDF
- **Favorites**: Pin destinations to compare them side by side
- **More destinations**: The `DESTINATIONS` array is hand-curated; could pull from a larger dataset

---

## File Size Reference

```
fuck-where-do-we-go.html       ~2300 lines
fuck-where-do-we-go-script.js  ~5300 lines
```

Both files are large — always read specific sections rather than the whole file. Use `Grep` with line numbers to find functions before editing.
