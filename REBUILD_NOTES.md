# Rebuild notes — GTA VI Trophy Guide (gta6-trophy-guide-01)

## What this build is
A static, offline trophy guide + tracker for all 55 GTA VI trophies:
exact official names/descriptions/grades, a guide in our own words with named
sources beside every trophy, a 4-phase roadmap to the platinum, one missable
trophy (Positive Mental Attitude), localStorage progress with export/import,
kind/grade/search/earned filters, and a spoiler mode that hides un-earned
story trophies (name, description and guide all withheld from the DOM).

## Known weaknesses
- **Single-source guides.** PowerPyx is the source for all 55 trophies; only
  14 have a second source. If PowerPyx is wrong on a detail, we repeat it.
- **5 trophies are unconfirmed** (In The Beginning…, Capital Offense, Bad Luck
  I Guess, The Truth Is Out There, Ten Pin) plus the meditation step for
  Positive Mental Attitude. The guides say so honestly, but they are thin.
- **Cover shows only the top of the first card.** At the judge's 768×480 the
  cover shows hero + roadmap strip + toolbar + one card top. The cited-guide
  evidence lives in shots 3–4 and in the source.
- **Roadmap strip duplicates the full roadmap.** Small redundancy, kept because
  it puts the phases on the cover.
- **No per-trophy difficulty or time estimates.** The 200-hour figure is
  global (PowerPyx); per-trophy estimates do not exist in any source yet.
- **Next-up is roadmap order, not easiest-next.** A new player may want the
  cheapest next trophy first.
- **No compact checklist mode.** The full cards are long; a dense list view
  would help players ticking through cleanup.
- **No Leonida map.** Locations are described in words only. Any map must be
  an original drawing — no Rockstar art, no game screenshots.
- **Spoiler placeholder shows the grade badge.** Deliberate (grade is not a
  story spoiler), but a strict reading could call it a leak.

## Concrete rebuild ideas (in priority order)
1. **Second-source the 41 single-source guides.** Once the game is out and
   text guides publish (GTABase, KeenGamer, TrueTrophies), add a second source
   to every trophy and re-check the 5 unconfirmed ones; replace their guides
   with confirmed methods.
2. **Easiest-next mode.** Add a toggle that orders the list by estimated
   effort (story automatics first, then cheap activities, then grinds) and
   makes Next-up follow it.
3. **Compact checklist view.** A toggle that collapses each card to one line
   (checkbox, name, grade, stage) for fast ticking during cleanup.
4. **Per-kind progress bars.** Show story/collectibles/activities progress as
   small bars in the toolbar, not just counts in the chips.
5. **Original Leonida location sketch.** A hand-drawn SVG of Leonida with
   markers for meditation spots, drone races and ranges — only once location
   data is confirmed by two sources.
6. **Per-trophy time notes.** Add "about 10 minutes" style notes once
   community timings exist; never invent them.
7. **Print stylesheet.** A clean print view of the earned/remaining checklist
   for players who want it on paper.

## Do not rebuild
- Do not add Rockstar logos, box art or game screenshots (gates fail).
- Do not add network calls at runtime (offline gate).
- Do not invent methods for the 5 unconfirmed trophies; label them until
  a citable source confirms them.
