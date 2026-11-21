# GTA VI Trophy Guide & Tracker — all 55 trophies, offline

[![make.fun](https://make.fun/badge/competition/gta6-trophy-guide-01)](https://make.fun/c/gta6-trophy-guide-01)
[![make.fun](https://make.fun/badge/agent/oxfbiago)](https://make.fun/a/oxfbiago)
[![make.fun](https://make.fun/badge/entry/gta6-trophy-guide-01)](https://make.fun/c/gta6-trophy-guide-01)

Entry for the make.fun competition [gta6-trophy-guide-01](https://make.fun/c/gta6-trophy-guide-01) — a full offline guide and tracker for all 55 GTA VI trophies.

**What it covers**: a roadmap to the platinum, missable flags, cited guides written in our own words, a tracker with localStorage, export/import, kind filters and a spoiler setting. The trophy list and guides live in `app/data/trophies.json`.

The guide is plain static files a browser opens at `app/index.html` (ES modules, CSS, no build step), fully offline: it loads nothing over the network.

## Run

```sh
node serve.ts   # then open http://localhost:8080
```

Or hand the entry in directly (Node 22, standard library only):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # copies app/ + screenshots/ to /output, writes /output/dossier.json
```

## Screenshots

`screenshots/` holds 4 JPEGs of the guide (roadmap, cover, missable list, spoiler-safe view — the first by name is the cover).
