// GTA VI Trophy Guide & Tracker — vanilla JS, no libraries, no network at runtime.
// Loads data/trophies.json (a file of this app), renders the roadmap + checklist,
// and keeps progress in localStorage. Export writes a file; import reads only the
// file the reader chooses.
const DATA_URL = 'data/trophies.json';
const STORE_KEY = 'gta6-trophy-guide-v1';

const PHASES = [
  {
    stage: 1,
    title: 'Play the story — Chapters 1 to 4, then the final mission',
    short: 'Story',
    meta: 'about 60–80 hours · 18 trophies',
    blurb:
      'Finish the four chapters and the side-character questlines as they open, then the final ' +
      'mission — PowerPyx and GTABase place that last mission in a fifth chapter, while the ' +
      'official descriptions name Chapters 1 to 4 only. Every story trophy is ' +
      'automatic on mission completion, so just play. Two things matter here: do the Chapter 1 ' +
      'meditation for Positive Mental Attitude while you still can (see the warning below), and keep ' +
      'a manual save at the start of each chapter — there is no mission replay.',
  },
  {
    stage: 2,
    title: 'Open-world systems — scan, study, race, shoot',
    short: 'Open-world systems',
    meta: '12 trophies',
    blurb:
      'While the story runs, scan every new vehicle with the WAiNK app and study animals through ' +
      'binoculars — the 100% checklist wants 200 of 277 vehicles and 100 of 255 animals, and progress ' +
      'counts from the start. Work through stunts, races, drone races and shooting ranges as you go.',
  },
  {
    stage: 3,
    title: 'Side quests, robberies and money',
    short: 'Side quests & money',
    meta: '22 trophies',
    blurb:
      'Stranger strands, the optional questlines, gang operations, bank vaults, jewelry stores, ' +
      'collectible cards, garages, laundering marked bills and shop spending. Most of this stays ' +
      'available after the story, so mop it up in free-roam whenever it is convenient.',
  },
  {
    stage: 4,
    title: '100% checklist and cleanup',
    short: '100% & cleanup',
    meta: '3 trophies',
    blurb:
      'After the credits, open the 100% checklist under Progress, then Stats. Finish any 70 of the ' +
      '80 challenges, close out the remaining checklist items, and A Long Road unlocks — then the ' +
      'platinum, Vice Got a Price!, pops as the last trophy of the set.',
  },
];

const KIND_LABELS = {
  all: 'All trophies',
  story: 'Story',
  missable: 'Missable',
  collectible: 'Collectibles',
  activity: 'Activities',
  online: 'Online',
};

// The 28 trophies PlayStation hides until earned (GTABase per-trophy flags, matching
// the 28-hidden count every list reports): the 12 story trophies, the 5 character-quest
// finals, Fair Game, Catch Me If You Can, Challenging Tank, and the 8 one-off hidden ones.
const HIDDEN_IDS = new Set([
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 22, 23, 24, 26, 27, 29, 37, 38, 44, 45, 46,
  47, 48, 49, 50, 51,
]);

const state = {
  earned: new Set(),
  spoiler: false,
  kind: 'all',
  grade: 'all',
  query: '',
  earnedOnly: false,
};

let doc = null;

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const statusEl = $('listStatus');
const emptyEl = $('emptyState');

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) state.earned = new Set(saved.earned.filter((n) => Number.isInteger(n)));
    if (typeof saved.spoiler === 'boolean') state.spoiler = saved.spoiler;
  } catch {
    // Corrupt saved state: start fresh rather than crash.
    state.earned = new Set();
  }
}

function saveState() {
  localStorage.setItem(
    STORE_KEY,
    JSON.stringify({ earned: [...state.earned].sort((a, b) => a - b), spoiler: state.spoiler }),
  );
}

function isHidden(t) {
  return state.spoiler && t.kind === 'story' && !state.earned.has(t.id);
}

function matchesFilters(t) {
  if (state.kind === 'missable' && !t.missable) return false;
  if (state.kind === 'online') return false; // the list has no online trophies
  if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
  if (state.grade !== 'all' && t.grade !== state.grade) return false;
  if (state.earnedOnly && !state.earned.has(t.id)) return false;
  if (state.query) {
    const q = state.query.toLowerCase();
    const hay = isHidden(t)
      ? ''
      : `${t.name} ${t.description} ${t.guide} ${t.target ?? ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function gradeCountsText() {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of doc.trophies) if (state.earned.has(t.id)) counts[t.grade] += 1;
  return `Earned: ${counts.platinum} platinum · ${counts.gold} gold · ${counts.silver} silver · ${counts.bronze} bronze`;
}

function renderProgress() {
  const n = state.earned.size;
  const total = doc.trophies.length;
  $('progressText').textContent = `${n} of ${total} earned`;
  $('progressPct').textContent = `${Math.round((n / total) * 100)}%`;
  $('progressFill').style.width = `${(n / total) * 100}%`;
  $('gradeCounts').textContent = gradeCountsText();
  const next = doc.trophies
    .slice()
    .sort((a, b) => a.stage - b.stage || a.id - b.id)
    .find((t) => !state.earned.has(t.id));
  if (!next) {
    $('nextUp').textContent = 'Platinum earned — every trophy is ticked. Vice got a price, and you paid it.';
  } else if (isHidden(next)) {
    $('nextUp').textContent =
      'Next up: a hidden story trophy — spoilers are on, so its name stays hidden until you earn it.';
  } else {
    $('nextUp').textContent = `Next up: ${next.name} — ${next.description}`;
  }
}

function renderRoadmap() {
  const missable = doc.trophies.filter((t) => t.missable);
  const callout = $('missableCallout');

  // Compact strip under the hero: one chip per phase, so the roadmap is visible
  // above the fold on the cover screenshot.
  const strip = $('roadmapStrip');
  strip.replaceChildren();
  for (const phase of PHASES) {
    const stageTrophies = doc.trophies.filter((x) => x.stage === phase.stage);
    const earnedInStage = stageTrophies.filter((t) => state.earned.has(t.id)).length;
    const item = document.createElement('a');
    item.className = 'strip-item';
    item.href = '#roadmap';
    const num = document.createElement('span');
    num.className = 'strip-num';
    num.textContent = String(phase.stage);
    const label = document.createElement('span');
    label.className = 'strip-label';
    label.textContent = phase.short;
    const count = document.createElement('span');
    count.className = 'strip-count';
    count.textContent = `${earnedInStage}/${stageTrophies.length} earned`;
    item.append(num, label, count);
    strip.append(item);
  }
  callout.replaceChildren();
  const warn = document.createElement('p');
  const warnStrong = document.createElement('strong');
  warnStrong.textContent = 'Only one trophy can be missed: ';
  warn.append(warnStrong);
  warn.append(
    document.createTextNode(
      `${missable.map((t) => t.name).join(', ')} — the Chapter 1 meditation at Jason's house. ` +
        'PowerPyx and GTABase both flag it as the only potentially missable trophy, because that ' +
        'meditation becomes unavailable after Chapter 1. Do it the morning after the mission Down to ' +
        'Earth, when Lucia walks out to the balcony. Every other trophy stays earnable after the story.',
    ),
  );
  callout.append(warn);

  const phasesEl = $('phases');
  phasesEl.replaceChildren();
  for (const phase of PHASES) {
    const li = document.createElement('li');
    li.className = 'phase';
    const head = document.createElement('div');
    head.className = 'phase-head';
    const num = document.createElement('span');
    num.className = 'phase-num';
    num.textContent = String(phase.stage);
    const title = document.createElement('h3');
    title.textContent = phase.title;
    const meta = document.createElement('span');
    meta.className = 'phase-meta';
    meta.textContent = phase.meta;
    head.append(num, title, meta);
    const blurb = document.createElement('p');
    blurb.textContent = phase.blurb;
    const chips = document.createElement('ul');
    chips.className = 'phase-trophies';
    const stageTrophies = doc.trophies.filter((x) => x.stage === phase.stage);
    let hiddenCount = 0;
    for (const t of stageTrophies) {
      if (isHidden(t)) {
        hiddenCount += 1;
        continue;
      }
      const chip = document.createElement('li');
      chip.textContent = t.name;
      if (state.earned.has(t.id)) chip.classList.add('done');
      if (t.missable) chip.classList.add('missable');
      chips.append(chip);
    }
    if (hiddenCount > 0) {
      const chip = document.createElement('li');
      chip.className = 'hidden-chip';
      chip.textContent = `${hiddenCount} hidden story ${hiddenCount === 1 ? 'trophy' : 'trophies'} (spoilers on)`;
      chips.append(chip);
    }
    const stageProgress = document.createElement('p');
    stageProgress.className = 'phase-progress';
    const earnedInStage = stageTrophies.filter((t) => state.earned.has(t.id)).length;
    stageProgress.textContent = `Stage ${phase.stage}: ${earnedInStage} of ${stageTrophies.length} earned`;
    li.append(head, blurb, chips, stageProgress);
    phasesEl.append(li);
  }
}

function renderChips() {
  const chipsEl = $('kindChips');
  chipsEl.replaceChildren();
  for (const [kind, label] of Object.entries(KIND_LABELS)) {
    const count =
      kind === 'all'
        ? doc.trophies.length
        : kind === 'missable'
          ? doc.trophies.filter((t) => t.missable).length
          : kind === 'online'
            ? 0
            : doc.trophies.filter((t) => t.kind === kind).length;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.setAttribute('aria-pressed', String(state.kind === kind));
    btn.textContent = `${label} (${count})`;
    btn.addEventListener('click', () => {
      state.kind = kind;
      render();
    });
    chipsEl.append(btn);
  }
}

function sourceLine(t) {
  const p = document.createElement('p');
  p.className = 'sources';
  const label = document.createElement('strong');
  label.textContent = 'Sources: ';
  p.append(label);
  t.sources.forEach((s, i) => {
    if (i > 0) p.append(document.createTextNode(' · '));
    const a = document.createElement('a');
    a.href = s.url;
    a.rel = 'noopener';
    a.textContent = s.name;
    p.append(a);
  });
  return p;
}

function trophyCard(t) {
  const card = document.createElement('article');
  card.className = 'card';
  if (state.earned.has(t.id)) card.classList.add('earned');

  const head = document.createElement('div');
  head.className = 'card-head';
  const earnLabel = document.createElement('label');
  earnLabel.className = 'earn-box';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(t.id);
  box.setAttribute('aria-label', isHidden(t) ? 'Mark hidden story trophy earned' : `Mark ${t.name} earned`);
  box.addEventListener('change', () => {
    if (box.checked) state.earned.add(t.id);
    else state.earned.delete(t.id);
    saveState();
    render();
  });
  earnLabel.append(box, document.createTextNode('Earned'));
  head.append(earnLabel);

  const titleWrap = document.createElement('div');
  titleWrap.className = 'card-title';
  const title = document.createElement('h3');
  title.textContent = isHidden(t) ? 'Hidden story trophy' : t.name;
  titleWrap.append(title);
  head.append(titleWrap);

  const badge = document.createElement('span');
  badge.className = `badge ${t.grade}`;
  badge.textContent = t.grade;
  head.append(badge);
  card.append(head);

  if (isHidden(t)) {
    card.classList.add('hidden-card');
    const note = document.createElement('p');
    note.className = 'hidden-note';
    note.textContent =
      'Spoilers are hidden. This is a story trophy — its name and description stay hidden until ' +
      'you earn it. Tick “Earned” when you have it and the guide appears.';
    card.append(note);
    return card;
  }

  const official = document.createElement('p');
  official.className = 'official';
  const offLabel = document.createElement('span');
  offLabel.className = 'label';
  offLabel.textContent = 'Official — ';
  official.append(offLabel, document.createTextNode(t.description));
  card.append(official);

  const guide = document.createElement('p');
  guide.className = 'guide';
  guide.textContent = t.guide;
  card.append(guide);

  const tags = document.createElement('ul');
  tags.className = 'tags';
  const tagItems = [
    `Kind: ${t.kind}`,
    `Roadmap stage ${t.stage}`,
  ];
  if (t.target) tagItems.push(`Target: ${t.target}`);
  for (const text of tagItems) {
    const li = document.createElement('li');
    li.textContent = text;
    tags.append(li);
  }
  if (t.missable) {
    const li = document.createElement('li');
    li.className = 'missable-tag';
    li.textContent = 'MISSABLE — see warning';
    tags.append(li);
  }
  if (HIDDEN_IDS.has(t.id)) {
    const li = document.createElement('li');
    li.textContent = 'Hidden on PlayStation until earned';
    tags.append(li);
  }
  if (/not yet confirmed/i.test(t.guide)) {
    const li = document.createElement('li');
    li.className = 'unknown-tag';
    li.textContent = 'Unconfirmed at launch';
    tags.append(li);
  }
  card.append(tags);
  card.append(sourceLine(t));
  return card;
}

function renderList() {
  listEl.replaceChildren();
  const visible = doc.trophies.filter(matchesFilters);
  for (const t of visible) listEl.append(trophyCard(t));

  const shown = visible.length;
  const total = doc.trophies.length;
  statusEl.textContent =
    state.kind === 'online'
      ? 'Online: 0 of 55 — this list has no online trophies. All 55 are single-player (PowerPyx).'
      : `Showing ${shown} of ${total} trophies` +
        (state.earned.size ? ` · ${state.earned.size} earned` : '');

  emptyEl.hidden = shown !== 0;
  if (shown === 0) {
    emptyEl.textContent =
      state.kind === 'online'
        ? 'No online trophies. Every trophy in this list is earned in single-player — there is nothing to track under Online.'
        : 'Nothing matches these filters. Clear the search or pick a different kind or grade.';
  }
}

function renderSources() {
  const el = $('sourceList');
  el.replaceChildren();
  el.append(document.createTextNode('Guide sources: '));
  doc.sources.forEach((s, i) => {
    if (i > 0) el.append(document.createTextNode(' · '));
    const a = document.createElement('a');
    a.href = s.url;
    a.rel = 'noopener';
    a.textContent = s.name;
    el.append(a);
  });
}

function render() {
  renderProgress();
  renderRoadmap();
  renderChips();
  renderList();
}

function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importProgress(file) {
  const errEl = $('importError');
  errEl.hidden = true;
  file
    .text()
    .then((text) => {
      const parsed = JSON.parse(text);
      const ids = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(ids)) throw new Error('expected a JSON array of trophy ids, or an object with an "earned" array');
      const valid = new Set(doc.trophies.map((t) => t.id));
      const cleaned = ids.filter((n) => Number.isInteger(n) && valid.has(n));
      if (cleaned.length === 0 && ids.length > 0) {
        throw new Error('no trophy ids in this file matched the 55 trophies');
      }
      state.earned = new Set(cleaned);
      saveState();
      render();
    })
    .catch((e) => {
      errEl.textContent = `Could not import that file: ${e.message}. Your saved progress was left unchanged.`;
      errEl.hidden = false;
    });
}

function wireControls() {
  $('search').addEventListener('input', (e) => {
    state.query = e.target.value.trim();
    renderList();
  });
  $('grade').addEventListener('change', (e) => {
    state.grade = e.target.value;
    renderList();
  });
  $('earnedOnly').addEventListener('change', (e) => {
    state.earnedOnly = e.target.checked;
    renderList();
  });
  const spoiler = $('spoilerToggle');
  spoiler.checked = state.spoiler;
  spoiler.addEventListener('change', () => {
    state.spoiler = spoiler.checked;
    saveState();
    render();
  });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) importProgress(file);
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (window.confirm('Clear all earned trophies? This cannot be undone. Export first if you want a backup.')) {
      state.earned = new Set();
      saveState();
      render();
    }
  });
}

async function boot() {
  loadState();
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`could not load ${DATA_URL}: ${res.status}`);
  doc = await res.json();
  wireControls();
  renderSources();
  render();
}

boot().catch((e) => {
  listEl.replaceChildren();
  emptyEl.hidden = false;
  emptyEl.textContent = `The trophy data could not be loaded (${e.message}). Reload the page, or check that data/trophies.json sits beside this page.`;
});
