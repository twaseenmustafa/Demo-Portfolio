/* Process section: "the build machine".
   Generated isometric SVG (no images), so every part is a live control: power switch, stage tiles,
   speaker (Discover), printer (Prototype: prints a different sheet every time), keypad (Build),
   ship button + gauge (Ship) and a two-position lever. Parts sit still (no mouse drift); you can
   drag any part within a small range and it stays there, pull it too far and it springs home.
   Cables are recomputed every frame from the parts' live offsets, so nothing ever disconnects.
   Scrolling in, parts rise at different speeds; scrolling out, they lift away at different speeds. */
const { gsap, ScrollTrigger } = window;
const NS = 'http://www.w3.org/2000/svg';
const C = Math.cos(Math.PI / 6), S = 0.5;
const P = (x, y, z = 0) => [(x - y) * C, (x + y) * S - z];
const el = (tag, attrs, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  parent && parent.appendChild(n);
  return n;
};
const pts = a => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
const poly = (a, cls, g) => el('polygon', { points: pts(a), class: cls }, g);
const hull = a => { // monotone chain
  const p = [...a].sort((u, v) => u[0] - v[0] || u[1] - v[1]), cr = (o, u, v) => (u[0] - o[0]) * (v[1] - o[1]) - (u[1] - o[1]) * (v[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && cr(lo.at(-2), lo.at(-1), q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length > 1 && cr(up.at(-2), up.at(-1), q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
// face transforms: draw flat 2D art onto a face, reading left-to-right on screen (u right, v down)
const mtx = (a, b, c, d, [e, f]) => `matrix(${a},${b},${c},${d},${e.toFixed(1)},${f.toFixed(1)})`;
const mTop = (x, y, z) => mtx(C, S, -C, S, P(x, y, z));
const mLeft = (x, y, z) => mtx(C, S, 0, 1, P(x, y, z));      // +y face, origin at its left-top corner
const mRight = (x, y, z) => mtx(C, -S, 0, 1, P(x, y, z));    // +x face, origin at (x, y+d) = its left-top corner

function box(g, x, y, z, w, d, h, o = {}) {
  const L = [P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x, y + d, z)];
  const R = [P(x + w, y, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x + w, y, z)];
  poly(L, 'f ' + (o.l || 'l'), g);
  poly(R, 'f ' + (o.r || 'r'), g);
  if (o.hatch !== false && h > 14) poly(R, 'hatch', g);
  return poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], 'f ' + (o.t || 't'), g);
}
const EX = r => r * C * Math.SQRT2, EY = r => r * S * Math.SQRT2;
function cyl(g, cx, cy, z, r, h, o = {}) {
  const [x, by] = P(cx, cy, z), ty = by - h, rx = EX(r), ry = EY(r);
  el('path', { d: `M${x - rx} ${ty}L${x - rx} ${by}A${rx} ${ry} 0 0 0 ${x + rx} ${by}L${x + rx} ${ty}Z`, class: 'f ' + (o.side || 'cyl') }, g);
  return el('ellipse', { cx: x, cy: ty, rx, ry, class: 'f ' + (o.top || 't') }, g);
}
const band = (g, cx, cy, z, r) => { const [x, y] = P(cx, cy, z); el('path', { d: `M${x - EX(r)} ${y}A${EX(r)} ${EY(r)} 0 0 0 ${x + EX(r)} ${y}`, class: 'ln' }, g); };
const screw = (g, x, y) => { el('circle', { cx: x, cy: y, r: 2.6, class: 'f wht' }, g); el('line', { x1: x - 1.4, y1: y, x2: x + 1.4, y2: y, class: 'ln', style: 'stroke-width:1' }, g); };
const shadowOf = (g, foot, h) => poly(hull(foot.flatMap(([x, y]) => [P(x, y), P(x - 0.25 * h, y + 0.75 * h)])), 'sh', g);
const rect = (x, y, w, d) => [[x, y], [x + w, y], [x + w, y + d], [x, y + d]];
const circ = (cx, cy, r, n = 24) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(i / n * 6.283), cy + r * Math.sin(i / n * 6.283)]);
const rnd = (a, b) => a + Math.random() * (b - a);

const STEPS = ['Discover', 'Prototype', 'Build', 'Ship'];

export function initMachine({ reduced, sfx = () => {} }) {
  const sec = document.querySelector('.pm'), svg = sec.querySelector('.pm__svg');

  // ---------- paint ----------
  const defs = el('defs', {}, svg);
  const lin = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => { const gr = el('linearGradient', { id, x1, y1, x2, y2 }, defs); stops.forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, gr)); };
  lin('pmPanel', [[0, '#6a4dff'], [1, '#3a1fd6']]);
  lin('pmT', [[0, '#ffffff'], [1, '#f1eeff']], 0, 0, 1, 1);
  lin('pmL', [[0, '#f3f0ff'], [1, '#d9d2fb']]);
  lin('pmR', [[0, '#d3ccf7'], [1, '#aea2ee']]);
  lin('pmCyl', [[0, '#e9e4ff'], [0.22, '#ffffff'], [0.45, '#e2dcfb'], [1, '#9d90e6']], 0, 0, 1, 0);          // vertical cylinders: lit left, falling off right
  lin('pmRoll', [[0, '#ffffff'], [0.3, '#f4f1ff'], [0.42, '#ffffff'], [0.75, '#c9c0f3'], [1, '#8e80dd']], 0.75, 0, 0.25, 1); // roller: across its axis
  lin('pmPaper', [[0, '#ffffff'], [1, '#e9e5ff']]);
  const hp = el('pattern', { id: 'pmHatch', width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(35)' }, defs);
  el('line', { x1: 0, y1: 0, x2: 0, y2: 5, stroke: '#05030f', 'stroke-width': 0.9, opacity: 0.22 }, hp);

  // ---------- panel (shadows clipped to it) ----------
  const panelG = el('g', {}, svg);
  el('rect', { x: -150, y: -370, width: 300, height: 600, rx: 26, fill: 'url(#pmPanel)' }, panelG);
  const pc = el('clipPath', { id: 'pmPanelClip' }, defs); el('rect', { x: -150, y: -370, width: 300, height: 600, rx: 26 }, pc);
  for (let i = 0; i < 7; i++) el('line', { x1: -150, y1: -330 + i * 90, x2: 150, y2: -330 + i * 90, stroke: '#fff', opacity: 0.06 }, panelG);
  const shadows = el('g', { 'clip-path': 'url(#pmPanelClip)' }, panelG);
  const cables = el('g', {}, svg);

  const parts = [];
  const part = (name, speed, range = 34) => {
    const g = el('g', { class: 'part', 'data-part': name }, svg), sg = el('g', {}, shadows);
    const p = { name, g, sg, speed, range, lift: 0, bob: 0, dx: 0, dy: 0, hover: false };
    parts.push(p);
    return p;
  };
  let dragged = false; // set by a part drag so the click that ends it doesn't also fire the control
  const control = (node, label, fn, extra = {}) => {
    node.classList.add('btn-part');
    Object.entries({ tabindex: 0, role: 'button', 'aria-label': label, ...extra }).forEach(([k, v]) => node.setAttribute(k, v));
    node.addEventListener('click', e => { e.stopPropagation(); if (!dragged) fn(e); });
    node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } });
  };

  // floating stage tiles
  const ICONS = ['M10 10a7 7 0 1 0 0 .1M15 15l7 7', 'M6 6h18v13H6zM16 14l4 10 2-4 4-1z', 'M11 8 5 15l6 7M21 8l6 7-6 7M18 6l-4 18', 'M16 26V8M9 15l7-7 7 7'];
  const tiles = [[-205, -150, 150], [-95, -235, 205], [70, -235, 205], [180, -140, 150]].map(([x, y, z], i) => {
    const p = part('tile' + i, 260 + i * 40, 26);
    p.g.classList.add('tile');
    el('ellipse', { cx: P(x + 19, y + 19)[0], cy: P(x + 19, y + 19)[1], rx: 26, ry: 14, class: 'sh', opacity: 0.6 }, p.sg);
    box(p.g, x, y, z, 38, 38, 10, { hatch: false });
    el('path', { d: ICONS[i], class: 'ln', transform: mTop(x + 4, y + 4, z + 10) }, p.g);
    control(p.g, STEPS[i], () => { sfx('pm-tile' + (i + 1), 0.34); setStep(i); });
    return p;
  });

  // deploy unit: the Ship button
  const dep = part('deploy', 200);
  shadowOf(dep.sg, circ(250, -60, 24), 70);
  cyl(dep.g, 250, -60, 0, 24, 66);
  band(dep.g, 250, -60, 22, 24); band(dep.g, 250, -60, 44, 24);
  for (let i = 0; i < 3; i++) { const [x, y] = P(250, -36, 30 + i * 4); el('line', { x1: x - 8, y1: y + 3, x2: x + 4, y2: y + 3, class: 'ln', style: 'stroke-width:1.2' }, dep.g); }
  const shipBtn = el('g', {}, dep.g);
  cyl(shipBtn, 250, -60, 66, 15, 9, { side: 'acc', top: 'acc2' });
  el('ellipse', { cx: P(250, -60, 75)[0], cy: P(250, -60, 75)[1], rx: EX(8), ry: EY(8), class: 'f wht' }, shipBtn);
  dep.anchor = P(226, -60, 20);
  control(dep.g, 'Ship it', () => ship());

  // ---------- core ----------
  const core = part('core', 60, 22), g = core.g;
  shadowOf(core.sg, rect(-92, -72, 184, 144), 96);
  box(g, -92, -72, 0, 184, 144, 8, { hatch: false });                      // plinth
  box(g, -90, -70, 8, 180, 140, 72);
  poly([P(-84, -64, 80), P(84, -64, 80), P(84, 64, 80), P(-84, 64, 80)], 'thin', g);
  const vents = el('g', { transform: mLeft(-90, 70, 80) }, g);
  for (let i = 0; i < 6; i++) el('rect', { x: 14 + i * 13, y: 18, width: 6, height: 40, rx: 3, class: 'f acc' }, vents);
  el('rect', { x: 104, y: 20, width: 62, height: 18, rx: 3, class: 'f wht' }, vents);
  el('text', { x: 110, y: 32, class: 'txt', style: 'font-size:7.5px' }, vents).textContent = 'RAHAT-01';
  [[6, 6], [174, 6], [6, 64], [174, 64]].forEach(([x, y]) => screw(vents, x, y));
  const leds = el('g', { transform: mRight(90, 70, 80) }, g);
  const ledDots = [0, 1, 2, 3].map(i => el('circle', { cx: 86 + i * 13, cy: 14, r: 4, class: 'f wht' }, leds));
  el('rect', { x: 14, y: 26, width: 112, height: 28, rx: 5, class: 'f ink' }, leds);
  const screen = el('text', { x: 70, y: 44, class: 'txt', 'text-anchor': 'middle', style: 'fill:#a99bff;font-size:8.5px' }, leds);
  [[6, 6], [134, 6], [6, 64], [134, 64]].forEach(([x, y]) => screw(leds, x, y));

  // printer: back housing with a paper slot, platen roller in front, sheet rising out of the slot
  const HY = -70, HD = 24, HZ = 80, HH = 64, PZ = HZ + HH, PY = HY + HD / 2, PW = 112, PX = -56, DIR = [0, -0.2, 0.98];
  const printer = el('g', {}, g);
  box(printer, -84, HY, HZ, 168, HD, HH);
  const sideK = el('g', { transform: mRight(84, HY + HD, HZ + HH) }, printer);
  el('circle', { cx: 12, cy: 26, r: 7, class: 'f acc' }, sideK); el('circle', { cx: 12, cy: 26, r: 2.5, class: 'f wht' }, sideK);
  const slot = el('g', { transform: mTop(-84, HY, PZ) }, printer);
  el('rect', { x: 22, y: 9, width: 124, height: 6, rx: 3, class: 'f ink' }, slot);
  // sheet
  const paperG = el('g', {}, printer);
  const paper = el('polygon', { class: 'f paper' }, paperG);
  const clip = el('clipPath', { id: 'pmClip' }, defs), clipPoly = el('polygon', {}, clip);
  const contentG = el('g', {}, el('g', { 'clip-path': 'url(#pmClip)' }, paperG));
  const curl = el('path', { class: 'f paper' }, paperG);
  const sheetAt = (u, L) => P(PX + u, PY + DIR[1] * L, PZ + DIR[2] * L);
  const drawPaper = L => {
    const q = [sheetAt(0, L), sheetAt(PW, L), sheetAt(PW, 0), sheetAt(0, 0)];
    paper.setAttribute('points', pts(q)); clipPoly.setAttribute('points', pts(q));
    const [e, f] = sheetAt(0, L), [e2, f2] = sheetAt(PW, L);
    // v runs down the sheet (towards the slot): screen delta of (0, -DIR.y, -DIR.z)
    contentG.setAttribute('transform', `matrix(${C},${S},${(DIR[1] * C).toFixed(3)},${(-DIR[1] * S + DIR[2]).toFixed(3)},${e.toFixed(1)},${f.toFixed(1)})`);
    curl.setAttribute('d', `M${e.toFixed(1)} ${f.toFixed(1)}q-3 -7 3 -9L${(e2 + 3).toFixed(1)} ${(f2 - 9).toFixed(1)}q-6 2 -3 9Z`); // rolled top edge
  };
  // the sheet changes every print: a brief, a wireframe, code or a release report, re-randomised each time
  const T = {
    Discover(c) {
      el('text', { x: 8, y: 14, class: 'txt' }, c).textContent = 'BRIEF';
      for (let i = 0; i < 4; i++) el('rect', { x: 8, y: 22 + i * 8, width: rnd(40, 64), height: 3, rx: 1.5, class: 'ink', opacity: 0.55 }, c);
      [15, 10, 5].forEach((r, i) => el('circle', { cx: 88, cy: 34, r, class: i === 2 ? 'acc' : 'thin' }, c));
      el('text', { x: 8, y: 66, class: 'txt', style: 'font-size:7px' }, c).textContent = '1 GOAL · 1 METRIC';
      el('rect', { x: 8, y: 72, width: rnd(30, 60), height: 3, rx: 1.5, class: 'acc2' }, c);
    },
    Prototype(c) {
      el('rect', { x: 8, y: 6, width: 96, height: 8, rx: 2, class: 'acc' }, c);
      el('rect', { x: 8, y: 18, width: 58, height: 34, rx: 2, class: 'thin' }, c);
      el('path', { d: 'M8 18l58 34M66 18 8 52', class: 'thin' }, c);
      for (let i = 0; i < 3; i++) el('rect', { x: 72, y: 18 + i * 12, width: rnd(18, 30), height: 4, rx: 2, class: 'ink', opacity: 0.5 }, c);
      el('rect', { x: 8, y: 58, width: rnd(28, 44), height: 10, rx: 5, class: 'acc' }, c);
      el('text', { x: 8, y: 82, class: 'txt', style: 'font-size:7px' }, c).textContent = 'V' + Math.ceil(rnd(1, 9)) + ' · CLICKABLE';
    },
    Build(c) {
      el('text', { x: 8, y: 14, class: 'txt' }, c).textContent = 'BUILD #' + Math.ceil(rnd(10, 99));
      let ind = 0;
      for (let i = 0; i < 8; i++) {
        ind = Math.max(0, Math.min(3, ind + (Math.random() < 0.5 ? 1 : -1)));
        el('rect', { x: 8 + ind * 8, y: 22 + i * 7.5, width: rnd(16, 56), height: 3.2, rx: 1.6, class: i % 3 ? 'acc' : 'acc2', opacity: 0.85 }, c);
      }
    },
    Ship(c) {
      el('text', { x: 8, y: 14, class: 'txt' }, c).textContent = 'RELEASE';
      const h = Array.from({ length: 6 }, () => rnd(14, 44));
      h.forEach((v, k) => el('rect', { x: 10 + k * 15, y: 66 - v, width: 9, height: v, class: 'f acc' }, c));
      el('polyline', { points: h.map((v, k) => `${14 + k * 15},${60 - v}`).join(' '), class: 'ln', style: 'stroke:#5b3cff;stroke-width:1.6' }, c);
      el('rect', { x: 8, y: 72, width: 40, height: 10, rx: 5, class: 'acc' }, c);
      el('text', { x: 14, y: 79.5, class: 'txt', style: 'fill:#fff;font-size:6.5px' }, c).textContent = '✓ LIVE';
    }
  };
  // platen roller with end caps; gradient shading across the axis
  const RY = -24, RZ = 104, RR = 24, RX0 = -78, RX1 = 78;
  const ring = (x, r = RR, n = 32) => Array.from({ length: n }, (_, i) => { const a = i / n * 6.283; return P(x, RY + r * Math.cos(a), RZ + r * Math.sin(a)); });
  const roller = el('g', {}, g);
  box(roller, -90, RY - 10, 80, 10, 20, 26, { hatch: false });
  poly(hull([...ring(RX0), ...ring(RX1)]), 'f roll', roller);
  const stripes = Array.from({ length: 14 }, () => el('line', { class: 'ln', style: 'stroke-width:1' }, roller));
  poly(ring(RX1), 'f r', roller);
  poly(ring(RX1, 12), 'f acc', roller);
  poly(ring(RX1, 4.5), 'f wht', roller);
  box(roller, RX1, RY - 6, 80, 8, 12, 18, { hatch: false });
  let spin = 0;
  const drawRoller = () => stripes.forEach((s, k) => {
    const a = spin + k / stripes.length * 6.283, vis = Math.cos(a) + Math.sin(a);
    const [x1, y1] = P(RX0 + 2, RY + RR * Math.cos(a), RZ + RR * Math.sin(a)), [x2, y2] = P(RX1, RY + RR * Math.cos(a), RZ + RR * Math.sin(a));
    s.setAttribute('x1', x1.toFixed(1)); s.setAttribute('y1', y1.toFixed(1)); s.setAttribute('x2', x2.toFixed(1)); s.setAttribute('y2', y2.toFixed(1));
    s.style.opacity = vis > 0.2 ? (Math.min(1, vis) * 0.7).toFixed(2) : 0;
  });
  // keypad: 8x3 raised keys
  const keys = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) {
    const x = -82 + c * 20.5, y = 10 + r * 19, kg = el('g', { class: 'key' }, g);
    box(kg, x + 2, y + 2, 80, 16, 15, 4, { hatch: false });
    kg.addEventListener('pointerenter', () => power && kg.classList.add('on'));
    kg.addEventListener('click', e => {
      e.stopPropagation(); if (dragged) return;
      kg.classList.toggle('on'); gsap.fromTo(kg, { y: 3 }, { y: 0, duration: 0.35, ease: 'back.out(3)' }); sfx('pm-key', 0.3);
      setStep(2);
    });
    keys.push(kg);
  }
  core.anchorL = P(-90, 40, 30); core.anchorR = P(90, -20, 30); core.anchorF = P(40, 70, 20); core.anchorD = P(90, 50, 20);
  control(printer, 'Print', () => { sfx('pm-print', 0.32); setStep(1); });
  control(roller, 'Print', () => { sfx('pm-print', 0.32); setStep(1); });
  control(vents, 'Build', () => { sfx('pm-build', 0.32); setStep(2); });
  control(leds, 'Next stage', () => { sfx('pm-next', 0.3); setStep(step + 1); });

  // speaker cube: Discover
  const spk = part('speaker', 140);
  shadowOf(spk.sg, rect(-262, -12, 64, 64), 64);
  box(spk.g, -262, -12, 0, 64, 64, 64);
  const cone = el('g', { transform: mLeft(-262, 52, 64) }, spk.g);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) el('circle', { cx: 8 + i * 12, cy: 8 + j * 48, r: 1.6, class: 'ink' }, cone);
  el('circle', { cx: 32, cy: 32, r: 21, class: 'f r' }, cone);
  el('circle', { cx: 32, cy: 32, r: 15, class: 'thin' }, cone);
  const coreDot = el('circle', { cx: 32, cy: 32, r: 8, class: 'f ink' }, cone);
  const waves = [0, 1, 2].map(() => el('circle', { cx: 32, cy: 32, r: 22, class: 'ring', opacity: 0 }, cone));
  const knobT = el('g', { transform: mTop(-262, -12, 64) }, spk.g);
  el('circle', { cx: 46, cy: 18, r: 7, class: 'f acc' }, knobT);
  el('line', { x1: 46, y1: 18, x2: 46, y2: 12, class: 'ln', style: 'stroke:#fff' }, knobT);
  spk.anchor = P(-198, 30, 24);
  control(spk.g, 'Discover', () => { sfx('pm-speaker', 0.34); setStep(0); });

  // power badge with sliding switch
  const badge = part('badge', 90);
  shadowOf(badge.sg, rect(-180, 150, 132, 36), 26);
  box(badge.g, -180, 150, 0, 132, 36, 26, { l: 'acc' });
  const bl = el('g', { transform: mLeft(-180, 186, 26) }, badge.g);
  el('text', { x: 12, y: 17, class: 'txt', style: 'fill:#fff;font-size:10px' }, bl).textContent = 'POWER';
  const sw = el('g', { transform: mTop(-180, 150, 26) }, badge.g);
  el('rect', { x: 80, y: 9, width: 44, height: 18, rx: 9, class: 'f ink' }, sw);
  const knob = el('rect', { x: 82, y: 11, width: 20, height: 14, rx: 7, class: 'f acc2' }, sw);
  const pled = el('circle', { cx: 18, cy: 18, r: 4, fill: '#7dffb2' }, sw);
  badge.anchor = P(-112, 150, 18);
  control(badge.g, 'Power', () => setPower(!power), { role: 'switch', 'aria-checked': 'true' });

  // gauge
  const dial = part('dial', 120);
  shadowOf(dial.sg, circ(225, 120, 34), 40);
  cyl(dial.g, 225, 120, 0, 34, 38);
  band(dial.g, 225, 120, 8, 34);
  const face = el('g', { transform: mTop(225, 120, 38) }, dial.g);
  el('circle', { cx: 0, cy: 0, r: 28, class: 'f wht' }, face);
  el('circle', { cx: 0, cy: 0, r: 24, class: 'f ink' }, face);
  for (let i = 0; i <= 8; i++) { const a = (-210 + i * 30) * Math.PI / 180; el('line', { x1: Math.cos(a) * 16, y1: Math.sin(a) * 16, x2: Math.cos(a) * 21, y2: Math.sin(a) * 21, class: 'ln', style: `stroke:${i > 6 ? '#7dffb2' : '#a99bff'};stroke-width:1.4` }, face); }
  const needle = el('g', {}, face);
  el('line', { x1: 0, y1: 0, x2: 18, y2: 0, class: 'ln', style: 'stroke:#fff;stroke-width:2.4' }, needle);
  el('circle', { cx: 0, cy: 0, r: 4, class: 'f acc2' }, face);
  dial.anchor = P(191, 120, 16);
  control(dial.g, 'Gauge', () => { sfx('pm-gauge', 0.32); gsap.fromTo(G, { a: G.a + 360 }, { a: G.a, duration: 1.4, ease: 'expo.out' }); });

  // two-position lever
  const joy = part('joy', 180);
  shadowOf(joy.sg, rect(40, 205, 54, 54), 18);
  box(joy.g, 40, 205, 0, 54, 54, 18, { hatch: false });
  const jt = el('g', { transform: mTop(40, 205, 18) }, joy.g);
  const jl = [el('circle', { cx: 12, cy: 42, r: 5, class: 'f wht' }, jt), el('circle', { cx: 42, cy: 12, r: 5, class: 'f acc' }, jt)];
  const [jx, jy] = P(67, 232, 18);
  el('ellipse', { cx: jx, cy: jy, rx: EX(13), ry: EY(13), class: 'f ink' }, joy.g);
  const stick = el('g', {}, joy.g);
  el('line', { x1: jx, y1: jy, x2: jx, y2: jy - 58, class: 'ln', style: 'stroke-width:5' }, stick);
  el('line', { x1: jx, y1: jy, x2: jx, y2: jy - 58, class: 'ln', style: 'stroke:#fff;stroke-width:2' }, stick);
  el('circle', { cx: jx, cy: jy - 64, r: 12, class: 'f acc' }, stick);
  el('circle', { cx: jx - 4, cy: jy - 68, r: 3.5, fill: '#fff' }, stick);
  joy.anchor = P(40, 232, 8);
  stick.classList.add('btn-part');
  Object.entries({ tabindex: 0, role: 'switch', 'aria-label': 'Lever', 'aria-checked': 'true' }).forEach(([k, v]) => stick.setAttribute(k, v));

  const wires = [[core, 'anchorR', dep, 'anchor'], [core, 'anchorL', spk, 'anchor'], [core, 'anchorF', joy, 'anchor'], [core, 'anchorD', dial, 'anchor'], [badge, 'anchor', core, 'anchorL']]
    .map(w => ({ w, a: el('path', { class: 'cable' }, cables), b: el('path', { class: 'cable cable--hi' }, cables) }));
  [...tiles, dep, core, spk, badge, dial, joy].forEach(p => svg.appendChild(p.g));

  // ---------- state ----------
  let autoT = 0, step = 0, power = true, inP = reduced ? 1 : 0, outP = 0, lastUser = -1e9, shipped = 0, lever = 1;
  const G = { a: -210 }, J = { a: 24 };
  const scrollY = p => (1 - inP) * p.speed - outP * p.speed * 1.6;
  const pos = p => [p.dx, p.dy + scrollY(p) - p.lift + p.bob];
  const wirePath = (a, b) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}C${a[0].toFixed(1)} ${(a[1] + 46).toFixed(1)} ${b[0].toFixed(1)} ${(b[1] + 46).toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  const render = () => {
    const off = new Map(parts.map(p => [p, pos(p)]));
    parts.forEach(p => {
      const [x, y] = off.get(p);
      p.g.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
      p.sg.setAttribute('transform', `translate(${p.dx.toFixed(2)} ${p.dy.toFixed(2)})`);
      p.sg.style.opacity = Math.max(0, 1 - Math.abs(scrollY(p)) / 140 - p.lift / 30).toFixed(2);
    });
    wires.forEach(({ w: [pa, ka, pb, kb], a, b }) => {
      const oa = off.get(pa), ob = off.get(pb), d = wirePath([pa[ka][0] + oa[0], pa[ka][1] + oa[1]], [pb[kb][0] + ob[0], pb[kb][1] + ob[1]]);
      a.setAttribute('d', d); b.setAttribute('d', d);
      if (power && !reduced) b.style.strokeDashoffset = (-performance.now() / 40).toFixed(1);
    });
    drawRoller();
    needle.setAttribute('transform', `rotate(${G.a.toFixed(1)})`);
    stick.setAttribute('transform', `rotate(${J.a.toFixed(1)} ${jx} ${jy})`);
    panelG.setAttribute('transform', `translate(0 ${((1 - inP) * 40 - outP * 70).toFixed(2)})`);
  };

  function print() {
    contentG.replaceChildren();
    T[STEPS[step]](contentG);
    if (reduced) return drawPaper(100);
    const o = { L: 8 };
    gsap.to(o, { L: 100, duration: 1.5, ease: 'power2.out', overwrite: true, onUpdate: () => drawPaper(o.L) });
    gsap.to({ v: 0 }, { v: 1, duration: 1.5, ease: 'power2.out', onUpdate() { spin += 0.06; } });
  }
  function setStep(i, auto) {
    if (!auto) lastUser = performance.now();
    step = (i + 4) % 4;
    tiles.forEach((t, k) => t.g.classList.toggle('is-hot', k === step));
    gsap.to(G, { a: -210 + (step + 1) * 60, duration: reduced ? 0 : 1.2, ease: 'elastic.out(1,0.6)' });
    keys.forEach((k, n) => k.classList.toggle('on', n < (step + 1) * 6));
    ledDots.forEach((d, n) => d.setAttribute('class', 'f ' + (n <= step ? 'acc2' : 'wht')));
    screen.textContent = power ? `${step + 1}/4 ${STEPS[step].toUpperCase()}` : 'OFF';
    if (power) print(); // each control plays its own sound; the auto-run stays silent
    if (step === 0) pulseWaves();
  }
  function pulseWaves() {
    if (reduced || !power) return;
    waves.forEach((w, k) => gsap.fromTo(w, { attr: { r: 21 }, opacity: 0.9 }, { attr: { r: 46 }, opacity: 0, duration: 1.3, delay: k * 0.25, ease: 'power2.out' }));
    gsap.fromTo(coreDot, { attr: { r: 10 } }, { attr: { r: 8 }, duration: 0.5, ease: 'elastic.out(1,0.3)' });
  }
  function ship() {
    if (power) sfx('pm-ship', 0.34);
    gsap.fromTo(shipBtn, { y: 0 }, { y: 6, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.in' });
    if (!power) return;
    setStep(3);
    shipped++;
    screen.textContent = `SHIPPED #${shipped}`;
    gsap.fromTo(G, { a: -210 }, { a: 30, duration: 1.4, ease: 'expo.out' });
  }
  // power: the switch slides and the machine jolts awake (or settles) part by part
  function setPower(on) {
    sfx(on ? 'pm-on' : 'pm-off', 0.34);
    power = on;
    sec.classList.toggle('is-off', !on);
    badge.g.setAttribute('aria-checked', on);
    pled.setAttribute('fill', on ? '#7dffb2' : '#ff8fa8');
    gsap.to(knob, { attr: { x: on ? 82 : 102 }, duration: reduced ? 0 : 0.45, ease: 'back.out(2)' });
    if (!reduced) parts.forEach((p, i) => gsap.fromTo(p, { bob: on ? -8 : 3 }, { bob: 0, duration: 0.9, delay: i * 0.04, ease: 'elastic.out(1,0.4)' }));
    screen.textContent = on ? `${step + 1}/4 ${STEPS[step].toUpperCase()}` : 'OFF';
    if (on) setStep(step);
  }
  // lever: two positions; each throw flips it to the other side and moves the machine one stage
  function throwLever(to = -lever) {
    sfx('pm-lever', 0.32);
    lever = to;
    stick.setAttribute('aria-checked', lever > 0);
    jl[0].setAttribute('class', 'f ' + (lever < 0 ? 'acc' : 'wht')); jl[1].setAttribute('class', 'f ' + (lever > 0 ? 'acc' : 'wht'));
    gsap.to(J, { a: lever * 24, duration: reduced ? 0 : 0.7, ease: 'back.out(2.2)' });
    setStep(step + 1);
  }

  // ---------- input ----------
  const settle = p => gsap.to(p, { lift: p.hover ? 5 : 0, duration: 0.45, ease: 'power3.out' });
  // drag any part around inside its range; past the range it resists, and if let go there it springs home
  const unit = () => svg.viewBox.baseVal.width / svg.getBoundingClientRect().width;
  parts.forEach(p => {
    const hover = v => () => { if (reduced) return; p.hover = v; settle(p); };
    p.g.addEventListener('pointerenter', hover(true)); p.g.addEventListener('pointerleave', hover(false));
    p.g.addEventListener('focusin', hover(true)); p.g.addEventListener('focusout', hover(false));
    p.g.addEventListener('pointerdown', e => {
      if (e.button) return;
      const k = unit(), sx = e.clientX, sy = e.clientY, bx = p.dx, by = p.dy;
      let moving = false, raw = [bx, by];
      const move = ev => {
        const mx = (ev.clientX - sx) * k, my = (ev.clientY - sy) * k;
        if (!moving && Math.hypot(mx, my) < 4 * k) return;
        if (!moving) { moving = true; dragged = true; gsap.killTweensOf(p, 'dx,dy'); sec.classList.add('is-dragging'); }
        raw = [bx + mx, by + my];
        const r = Math.hypot(...raw), lim = r > p.range ? (p.range + (r - p.range) * 0.3) / r : 1; // rubber band past the range
        p.dx = raw[0] * lim; p.dy = raw[1] * lim;
      };
      const up = () => {
        removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
        sec.classList.remove('is-dragging');
        if (moving && Math.hypot(...raw) > p.range * 1.25) { sfx('pm-spring', 0.26); gsap.to(p, { dx: 0, dy: 0, duration: 1.1, ease: 'elastic.out(1,0.35)' }); }
        else if (moving && Math.hypot(p.dx, p.dy) > p.range) { const s = p.range / Math.hypot(p.dx, p.dy); gsap.to(p, { dx: p.dx * s, dy: p.dy * s, duration: 0.6, ease: 'elastic.out(1,0.5)' }); }
        setTimeout(() => (dragged = false), 0);
      };
      addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    });
  });
  stick.addEventListener('pointerdown', e => e.stopPropagation());
  stick.addEventListener('click', e => { e.stopPropagation(); throwLever(); });
  stick.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowLeft: -1, Enter: -lever, ' ': -lever }[e.key];
    if (!d) return; e.preventDefault(); if (d !== lever) throwLever(d);
  });

  // ---------- loop + scroll ----------
  let visible = false;
  ScrollTrigger.create({ refreshPriority: -1, trigger: sec, start: 'top bottom', end: 'bottom top', onToggle: s => (visible = s.isActive) });
  if (!reduced) {
    ScrollTrigger.create({ refreshPriority: -1, trigger: svg, start: 'top 98%', end: 'center 55%', scrub: 1.2, onUpdate: s => (inP = s.progress) });
    ScrollTrigger.create({ refreshPriority: -1, trigger: sec, start: 'bottom 85%', end: 'bottom top', scrub: 1.2, onUpdate: s => (outP = s.progress) });
    tiles.forEach((t, i) => gsap.to(t, { bob: -5, duration: 2 + i * 0.3, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.4 }));
  }
  gsap.ticker.add((time, dt) => {
    if (!visible) return;
    if (power && !reduced) spin += 0.0012 * dt;
    autoT ||= time;
    if (power && !reduced && performance.now() - lastUser > 8000 && time - autoT > 4) { autoT = time; setStep(step + 1, true); }
    render();
  });

  // ---------- text: masked word reveal in, staggered lift-off out ----------
  const title = sec.querySelector('.pm__title');
  title.innerHTML = title.innerHTML.split(/(<em>.*?<\/em>|<br>)|\s+/).filter(Boolean).map(w => w === '<br>' ? w : `<span class="w"><span>${w}</span></span>`).join(' ');
  if (!reduced) {
    gsap.timeline({ scrollTrigger: { refreshPriority: -1, trigger: sec, start: 'top 70%' } })
      .from(sec.querySelectorAll('.pm__title .w>span'), { yPercent: 115, rotate: 5, duration: 1.1, stagger: 0.08, ease: 'expo.out' })
      .from(sec.querySelectorAll('.pm__lede, .pm__flow, .pm__cta'), { y: 24, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out' }, 0.25)
      .from(sec.querySelectorAll('.pm__stat'), { y: 30, opacity: 0, filter: 'blur(6px)', duration: 0.9, stagger: 0.1, ease: 'expo.out', clearProps: 'filter' }, 0.35);
    // each text block leaves at its own speed (data-speed), so the column peels away in layers
    sec.querySelectorAll('[data-speed]').forEach(t => gsap.to(t, { y: -t.dataset.speed * 1.4, ease: 'none', scrollTrigger: { refreshPriority: -1, trigger: sec, start: 'bottom 85%', end: 'bottom top', scrub: 1.2 } }));
  }

  drawPaper(reduced ? 100 : 8);
  setStep(0, true);
  render();
}
