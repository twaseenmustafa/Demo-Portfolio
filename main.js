import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const mm = gsap.matchMedia();
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* ---------------- smooth scroll ---------------- */
let lenis = null;
if (!reduced) {
  lenis = new window.Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
const scrollTo = target => lenis ? lenis.scrollTo(target, { duration: 1.6 }) : $(target)?.scrollIntoView({ behavior: 'smooth' });

$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href');
  if (id.length < 2 || !$(id)) return;
  e.preventDefault();
  closeMenu();
  scrollTo(id);
}));

/* ---------------- loader + hero intro ---------------- */
document.body.classList.add('is-loading');
const heroImg = $('.hero__portrait img');
const imgReady = new Promise(r => (heroImg.complete ? r() : (heroImg.onload = heroImg.onerror = r, setTimeout(r, 4000))));
const counter = { v: 0 };
const loadTl = gsap.to(counter, {
  v: 100, duration: reduced ? 0.2 : 1.6, ease: 'power2.inOut',
  onUpdate: () => { $('.loader__count span').textContent = Math.round(counter.v); gsap.set('.loader__bar i', { scaleX: counter.v / 100 }); }
});
Promise.all([imgReady, loadTl.then()]).then(() => {
  document.body.classList.remove('is-loading');
  lenis?.start();
  gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.4 } })
    .to('.loader', { yPercent: -100, duration: 1, ease: 'expo.inOut' })
    .set('.loader', { display: 'none' })
    // light blooms first, the arc rises behind, then the silhouette steps out of the dark
    .from('.hero__bg', { opacity: 0, scale: 1.3, duration: 2.4 }, '-=0.55')
    .fromTo('.hero__arc', { clipPath: 'inset(100% 0% 0% 0%)', yPercent: 10 }, { clipPath: 'inset(47% 0% 0% 0%)', yPercent: 0, duration: 1.8 }, '<0.3')
    .from('.hero__portrait img', { yPercent: 10, scale: 1.06, '--b': 0, '--bl': '16px', duration: 2.2, onComplete() { this.targets()[0].style.filter = 'none'; } }, '<0.1')
    .from('.hero__title .line > span', { yPercent: 115, stagger: 0.08 }, '<0.35')
    .from('.nav > *', { y: -30, opacity: 0, stagger: 0.06, duration: 1 }, '<0.2')
    .from(['.hero__lede', '.hero__meta'], { y: 24, opacity: 0, stagger: 0.12 }, '<0.3');
});

/* ---------------- cursor ---------------- */
if (finePointer) {
  const cur = $('.cursor'), label = $('.cursor__label');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 }, tgt = { ...pos };
  addEventListener('pointermove', e => { tgt.x = e.clientX; tgt.y = e.clientY; });
  gsap.ticker.add(() => {
    pos.x += (tgt.x - pos.x) * 0.2; pos.y += (tgt.y - pos.y) * 0.2;
    cur.style.transform = `translate(${pos.x}px,${pos.y}px)`;
  });
  document.addEventListener('pointerover', e => {
    const el = e.target.closest('a,button,summary,label,[data-cursor]');
    cur.classList.toggle('is-hover', !!el && !el.dataset.cursor);
    cur.classList.toggle('is-label', !!el?.dataset.cursor);
    if (el?.dataset.cursor) label.textContent = el.dataset.cursor;
  });
  document.addEventListener('pointerleave', () => gsap.to(cur, { opacity: 0 }));
  document.addEventListener('pointerenter', () => gsap.to(cur, { opacity: 1 }));

  $$('.magnetic').forEach(btn => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' }), yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' });
    btn.addEventListener('pointermove', e => { const r = btn.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.3); yTo((e.clientY - r.top - r.height / 2) * 0.4); });
    btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ---------------- nav ---------------- */
const nav = $('.nav'), pill = $('.nav__pill'), links = $$('.nav__links a');
const movePill = a => a && gsap.set(pill, { x: a.offsetLeft, width: a.offsetWidth });
let activeLink = links[0];
document.fonts.ready.then(() => { movePill(activeLink); ScrollTrigger.refresh(); });
links.forEach(a => a.addEventListener('pointerenter', () => movePill(a)));
$('.nav__links').addEventListener('pointerleave', () => movePill(activeLink));
links.forEach(a => ScrollTrigger.create({
  trigger: $(a.getAttribute('href')), start: 'top 50%', end: 'bottom 50%',
  onToggle: s => { if (!s.isActive) return; activeLink.classList.remove('is-active'); activeLink = a; a.classList.add('is-active'); movePill(a); }
}));
ScrollTrigger.create({
  start: 'top -80', end: 'max',
  onUpdate: s => { nav.classList.toggle('is-hidden', s.direction === 1 && s.scroll() > innerHeight); nav.classList.toggle('is-solid', s.scroll() > innerHeight * 0.8); }
});
const burger = $('.nav__burger'), menu = $('#menu');
function closeMenu() { if (menu.hidden) return; burger.setAttribute('aria-expanded', 'false'); gsap.to(menu, { opacity: 0, duration: 0.3, onComplete: () => (menu.hidden = true) }); lenis?.start(); }
burger.addEventListener('click', () => {
  if (!menu.hidden) return closeMenu();
  menu.hidden = false; burger.setAttribute('aria-expanded', 'true'); lenis?.stop();
  gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.3 });
  gsap.from('#menu a', { y: 40, opacity: 0, stagger: 0.05, ease: 'expo.out', duration: 0.9 });
});
addEventListener('keydown', e => e.key === 'Escape' && closeMenu());
gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });

/* ---------------- hero ---------------- */
const hero = $('.hero');
gsap.set('.hero__portrait', { xPercent: -55 }); // centres the head; lives in GSAP so mouse x and scroll y can't overwrite it
if (finePointer && !reduced) {
  const layers = $$('[data-depth]', hero).map(el => ({ x: gsap.quickTo(el, 'x', { duration: 1.4, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 1.4, ease: 'power3' }), d: +el.dataset.depth }));
  const tx = gsap.quickTo('.hero__title', 'x', { duration: 1.6, ease: 'power3' });
  const gx = gsap.quickTo(hero, '--gx', { duration: 1.8, ease: 'power3', unit: '%' }), gy = gsap.quickTo(hero, '--gy', { duration: 1.8, ease: 'power3', unit: '%' });
  hero.addEventListener('pointermove', e => {
    const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
    layers.forEach(l => { l.x(nx * -50 * l.d); l.y(ny * -28 * l.d); });
    tx(nx * 16); gx(50 + nx * 6); gy(34 + ny * 5);
  });
}
if (!reduced) {
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
    // depth by speed: far glow lags most, arc next, portrait holds, copy lifts away
    .to('.hero__bg', { yPercent: 30, opacity: 0.3, ease: 'none' }, 0)
    .to('.hero__arc', { yPercent: 55, opacity: 0, ease: 'none' }, 0)
    .to('.hero__portrait', { yPercent: 18, ease: 'none' }, 0)
    .to('.hero__title', { y: -160, opacity: 0, ease: 'none' }, 0)
    .to(['.hero__lede', '.hero__meta'], { y: -90, opacity: 0, ease: 'none' }, 0);
}

/* ---------------- reveals ---------------- */
if (!reduced) {
  $$('.h2, .eyebrow, .muted, .steps li, .socials li, .form > *').forEach(el =>
    gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
}

/* ---------------- about: word-by-word ---------------- */
const mText = $('.manifesto__text');
mText.innerHTML = mText.textContent.split(' ').map(w => `<span class="w">${w}</span>`).join(' ');
if (!reduced) gsap.to('.manifesto__text .w', { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: mText, start: 'top 75%', end: 'bottom 45%', scrub: true } });

/* ---------------- marquee: velocity-aware ---------------- */
{
  const track = $('.marquee__track');
  let x = 0, dir = -1, boost = 0;
  lenis?.on('scroll', e => { dir = e.direction === 1 ? -1 : 1; boost = Math.min(Math.abs(e.velocity) * 0.4, 18); });
  gsap.ticker.add(() => {
    if (reduced) return;
    const half = track.scrollWidth / 2;
    x += dir * (0.6 + boost); boost *= 0.92;
    if (x <= -half) x += half; if (x > 0) x -= half;
    track.style.transform = `translate3d(${x}px,0,0) skewX(${dir * boost * -0.5}deg)`;
  });
}

/* ---------------- process: inspection lens ---------------- */
{
  const lens = $('.lens');
  const st = { x: 50, y: 40, r: 140 };
  let hovering = false, visible = false;
  const apply = () => { lens.style.setProperty('--x', st.x + '%'); lens.style.setProperty('--y', st.y + '%'); lens.style.setProperty('--r', st.r + 'px'); };
  const follow = e => {
    const b = lens.getBoundingClientRect();
    gsap.to(st, { x: ((e.clientX - b.left) / b.width) * 100, y: ((e.clientY - b.top) / b.height) * 100, duration: 0.6, ease: 'power3', onUpdate: apply });
  };
  lens.addEventListener('pointerenter', e => { hovering = true; lens.classList.add('is-active'); gsap.to(st, { r: 180, duration: 0.8, ease: 'expo.out' }); follow(e); });
  lens.addEventListener('pointermove', follow);
  lens.addEventListener('pointerleave', () => { hovering = false; gsap.to(st, { r: 140, duration: 0.8, ease: 'expo.out' }); });
  ScrollTrigger.create({ trigger: lens, onToggle: s => (visible = s.isActive) });
  // Idle drift so touch users (and idle mice) still see the overlay at work.
  gsap.ticker.add(t => {
    if (!visible || hovering) return;
    const k = reduced ? 0 : t * 0.5;
    st.x += (50 + Math.sin(k) * 22 - st.x) * 0.05;
    st.y += (45 + Math.sin(k * 1.7) * 22 - st.y) * 0.05;
    apply();
  });
  apply();
  if (!finePointer) $('.lens__hint').textContent = 'Drag to inspect the build';
  if (!reduced) gsap.fromTo(lens, { clipPath: 'inset(18% 12% 18% 12% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none', scrollTrigger: { trigger: lens, start: 'top 95%', end: 'top 35%', scrub: true } });
}

/* ---------------- services: cursor preview ---------------- */
if (finePointer) {
  const prev = $('.cases__preview'), img = $('img', prev);
  const xTo = gsap.quickTo(prev, 'x', { duration: 0.6, ease: 'power3' }), yTo = gsap.quickTo(prev, 'y', { duration: 0.6, ease: 'power3' });
  const rTo = gsap.quickTo(prev, 'rotation', { duration: 0.8, ease: 'power3' });
  let lastX = 0;
  $$('.cases__list li').forEach(li => {
    new Image().src = li.dataset.img;
    li.addEventListener('pointerenter', () => { img.src = li.dataset.img; gsap.to(prev, { opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out' }); });
    li.addEventListener('pointerleave', () => gsap.to(prev, { opacity: 0, scale: 0.8, duration: 0.4 }));
    li.addEventListener('pointermove', e => { xTo(e.clientX + 30); yTo(e.clientY - 170); rTo(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6)); lastX = e.clientX; });
  });
}

/* ---------------- contact form ---------------- */
{
  const form = $('.form'), ok = $('.form__ok'), btn = $('button[type=submit]', form), txt = $('.btn__txt', btn);
  const rules = {
    name: v => v.trim().length > 1 || 'Please enter your name.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email.',
    message: v => v.trim().length >= 10 || 'A sentence or two helps me prepare.'
  };
  const fields = $$('[name=name],[name=email],[name=message]', form);
  const check = input => {
    const res = rules[input.name](input.value), f = input.closest('.field');
    f.classList.toggle('is-bad', res !== true); $('small', f).textContent = res === true ? '' : res;
    input.setAttribute('aria-invalid', res !== true);
    return res === true;
  };
  fields.forEach(i => i.addEventListener('blur', () => i.value && check(i)));
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!fields.map(check).every(Boolean)) {
      fields.find(i => i.getAttribute('aria-invalid') === 'true').focus();
      gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1,0.3)' });
      return;
    }
    btn.disabled = true; txt.textContent = 'Sending…';
    // shortcut: no backend — simulates delivery. Point this at Formspree/Resend/your API before launch.
    setTimeout(() => {
      const { type } = form, first = form.name.value.trim().split(' ')[0];
      ok.textContent = `Thanks, ${first} — your ${type.value.toLowerCase()} idea is in. I'll reply to ${form.email.value.trim()} within 24 hours.`;
      gsap.from(ok, { y: 12, opacity: 0, duration: 0.8, ease: 'expo.out' });
      txt.textContent = 'Sent ✓';
      const keep = type.value;
      form.reset(); type.value = keep;
      setTimeout(() => { btn.disabled = false; txt.textContent = 'Send it'; }, 2500);
    }, 1100);
  });
}

if (!reduced) {
  gsap.from('.preorder__title span', { yPercent: 60, opacity: 0, stagger: 0.12, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.preorder__title', start: 'top 85%' } });
  gsap.fromTo('.footer__word', { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
}

/* ---------------- socials: copy email, placeholder links ---------------- */
const toast = msg => { const t = $('.toast'); t.textContent = msg; t.classList.add('is-on'); clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('is-on'), 2400); };
$$('[data-email]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  const m = a.dataset.email;
  (navigator.clipboard ? navigator.clipboard.writeText(m) : Promise.reject()).then(() => toast(`Copied ${m} — talk soon`), () => (location.href = a.href));
}));
$$('[data-todo]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); toast('Link coming soon'); }));

/* =========================================================
   THREE.JS — laptop reel (recreated from the reference video)
   closed on slab → lid opens → levitates + tilts toward camera → hover (screen plays) → spins ~180°, closes, lands
   ========================================================= */
const SPECIAL = { '`': 'Backquote', '-': 'Minus', '=': 'Equal', '[': 'BracketLeft', ']': 'BracketRight', '\\': 'Backslash', ';': 'Semicolon', "'": 'Quote', ',': 'Comma', '.': 'Period', '/': 'Slash', ' ': 'Space' };
const SHIFTED = { '(': '9', ')': '0', '{': '[', '}': ']', ':': ';', '"': "'", '<': ',', '>': '.', '_': '-', '+': '=', '!': '1', '?': '/' };
const codeOf = c => /[a-z]/i.test(c) ? 'Key' + c.toUpperCase() : /\d/.test(c) ? 'Digit' + c : SPECIAL[c];
const keysFrom = str => [...str].map(c => [codeOf(c), c.toUpperCase(), 1]);
const ROWS = [
  [['Escape', 'esc', 1.5], ...Array.from({ length: 12 }, (_, i) => ['F' + (i + 1), 'F' + (i + 1), 1]), ['Power', '', 1.5]],
  [['Backquote', '`', 1], ...keysFrom('1234567890-='), ['Backspace', 'delete', 2]],
  [['Tab', 'tab', 1.5], ...keysFrom('qwertyuiop[]'), ['Backslash', '\\', 1.5]],
  [['CapsLock', 'caps', 1.75], ...keysFrom("asdfghjkl;'"), ['Enter', 'return', 2.25]],
  [['ShiftLeft', 'shift', 2.25], ...keysFrom('zxcvbnm,./'), ['ShiftRight', 'shift', 2.75]],
  [['Fn', 'fn', 1], ['ControlLeft', 'ctrl', 1], ['AltLeft', 'opt', 1], ['MetaLeft', 'cmd', 1.25], ['Space', '', 5.75], ['MetaRight', 'cmd', 1.25], ['AltRight', 'opt', 1], ['ArrowKeys', '', 2.75]]
];
console.assert(ROWS.every(r => Math.abs(r.reduce((a, k) => a + k[2], 0) - 15) < 1e-6), 'every keyboard row must be 15u wide');

const ease = { out: t => 1 - Math.pow(1 - t, 4), inOut: t => t < .5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2, expo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t) };
const clamp01 = v => Math.min(1, Math.max(0, v));

function rrShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  return s;
}
// slab of given thickness, rounded in plan view like the real chassis; extrudes upward from y=0
function chassis(w, d, r, thick, bevel) {
  const g = new THREE.ExtrudeGeometry(rrShape(w - bevel * 2, d - bevel * 2, r), { depth: thick - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 24 });
  g.rotateX(-Math.PI / 2); g.translate(0, bevel, 0);
  return g;
}
function noiseTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const brushed = () => noiseTex(512, 512, (x, w, h) => { // fine horizontal brushing for anodised aluminium
  x.fillStyle = '#7a7a7a'; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 6000; i++) { const v = 110 + Math.random() * 30 | 0; x.fillStyle = `rgba(${v},${v},${v},.07)`; x.fillRect(Math.random() * w, Math.random() * h, 40 + Math.random() * 200, 1); }
});
const grain = (base = 26) => noiseTex(256, 256, (x, w, h) => {
  const d = x.createImageData(w, h);
  for (let i = 0; i < d.data.length; i += 4) { const v = base + Math.random() * 60; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0);
});
const dots = () => noiseTex(64, 256, (x, w, h) => { // speaker grille perforation
  x.fillStyle = '#3a3b42'; x.fillRect(0, 0, w, h); x.fillStyle = '#060608';
  for (let yy = 4; yy < h; yy += 6) for (let xx = (yy / 6 % 2) * 3 + 4; xx < w; xx += 6) { x.beginPath(); x.arc(xx, yy, 1.4, 0, 7); x.fill(); }
});

/* ---------- screen: power-on → loader → looping kinetic type (time-driven, never scroll-driven) ---------- */
function makeScreen() {
  const W = 1024, H = 640, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const PHRASES = [['I build', 'unexpected', 'things.'], ['Tools that', 'developers', 'keep.'], ['Ideas, shipped', 'before they', 'go cold.']];
  const P = 4.8; // seconds per phrase
  const glow = (cx, cy, r, col) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); };
  const font = (w, s, f = 'Onest') => (x.font = `${w} ${s}px "${f}"`);
  function draw(t) { // t = seconds since power-on
    x.globalAlpha = 1; x.filter = 'none';
    const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0b0634'); bg.addColorStop(1, '#04030c'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
    // living backdrop: drifting indigo light + the site's arc motif turning slowly
    glow(512 + Math.sin(t * 0.4) * 120, 300 + Math.cos(t * 0.3) * 50, 420, 'rgba(83,51,242,.55)');
    glow(512 - Math.sin(t * 0.25) * 200, 360, 300, 'rgba(162,56,255,.22)');
    x.save(); x.translate(512, 330); x.rotate(Math.sin(t * 0.3) * 0.25);
    const ag = x.createLinearGradient(0, -40, 0, 230); ag.addColorStop(0, 'rgba(241,237,255,.0)'); ag.addColorStop(0.3, 'rgba(241,237,255,.22)'); ag.addColorStop(1, 'rgba(106,77,255,0)');
    x.strokeStyle = ag; x.lineWidth = 34; x.beginPath(); x.arc(0, 0, 210, 0.05, Math.PI - 0.05); x.stroke(); x.restore();
    // light sweep
    const sx = ((t * 0.18) % 1.6 - 0.3) * W; const sw = x.createLinearGradient(sx - 160, 0, sx + 160, 0);
    sw.addColorStop(0, 'rgba(255,255,255,0)'); sw.addColorStop(0.5, 'rgba(255,255,255,.05)'); sw.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = sw; x.fillRect(0, 0, W, H);
    // chrome
    font(500, 13, 'Geist Mono'); x.fillStyle = 'rgba(244,242,255,.55)'; x.textAlign = 'left'; x.fillText('</> rahat.dev', 40, 46);
    x.textAlign = 'right'; x.fillText('2026', W - 40, 46);
    const L = 1.9; // loader length
    if (t < L + 0.5) {
      const p = clamp01(t / L), prog = p < 0.55 ? ease.out(p / 0.55) * 0.72 : 0.72 + ease.inOut((p - 0.55) / 0.45) * 0.28; // stall-then-finish, like a real boot
      const fade = 1 - clamp01((t - L) / 0.5);
      x.globalAlpha = fade; x.textAlign = 'center';
      font(500, 46, 'Geist Mono'); x.fillStyle = '#c9bfff'; x.fillText('</>', 512, 290);
      x.fillStyle = 'rgba(244,242,255,.12)'; x.fillRect(392, 330, 240, 2);
      const lw = 240 * prog + clamp01((t - L) / 0.5) * 400;
      const lg = x.createLinearGradient(512 - lw / 2, 0, 512 + lw / 2, 0); lg.addColorStop(0, '#5b3cff'); lg.addColorStop(1, '#f1edff');
      x.fillStyle = lg; x.fillRect(t < L ? 392 : 512 - lw / 2, 330, t < L ? 240 * prog : lw, 2);
      font(500, 12, 'Geist Mono'); x.fillStyle = 'rgba(244,242,255,.6)'; x.fillText(String(Math.round(prog * 100)).padStart(3, '0') + '%', 512, 362);
      x.globalAlpha = 1;
    }
    if (t > L) {
      const k = t - L, i = Math.floor(k / P) % PHRASES.length, lt = k % P;
      x.textAlign = 'left';
      PHRASES[i].forEach((line, j) => {
        const inT = ease.expo(clamp01((lt - j * 0.12) / 1.0)), outT = ease.inOut(clamp01((lt - 3.7 - j * 0.06) / 0.8));
        const y = 240 + j * 92, dy = (1 - inT) * 90 - outT * 70;
        x.save(); x.beginPath(); x.rect(0, y - 92, W, 108); x.clip();
        x.globalAlpha = inT * (1 - outT);
        const blur = (1 - inT) * 10 + outT * 12; if (blur > 0.3) x.filter = `blur(${blur.toFixed(1)}px)`;
        font(400, 88); x.letterSpacing = (-4 + (1 - inT) * 6).toFixed(1) + 'px';
        if (j === 1) { const g = x.createLinearGradient(80, 0, 700, 0); g.addColorStop(0, '#a99bff'); g.addColorStop(1, '#f1edff'); x.fillStyle = g; } else x.fillStyle = '#f4f2ff';
        x.fillText(line, 80, y + dy); x.restore(); x.filter = 'none'; x.letterSpacing = '0px';
      });
      // phrase progress + live tag
      x.globalAlpha = 1; x.fillStyle = 'rgba(244,242,255,.1)'; x.fillRect(80, 560, 864, 2);
      x.fillStyle = '#a99bff'; x.fillRect(80, 560, 864 * (lt / P), 2);
      font(500, 12, 'Geist Mono'); x.fillStyle = 'rgba(244,242,255,.55)'; x.fillText(`0${i + 1} / 0${PHRASES.length}`, 80, 590);
      x.textAlign = 'right'; x.fillStyle = '#7dffb2'; x.fillText('● LIVE', 944, 590);
    }
  }
  return { canvas: c, draw };
}

function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: devicePixelRatio < 2, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environmentIntensity = 0.7;
  return { r, scene };
}

function buildLaptop(screenTex) {
  const W = 3.1, D = 2.15, BH = 0.075, LT = 0.04, U = 0.168, R = 0.16;
  const brush = brushed(); brush.repeat.set(2, 2);
  const alu = new THREE.MeshPhysicalMaterial({ color: 0x5b5d64, metalness: 1, roughness: 0.8, roughnessMap: brush, bumpMap: brush, bumpScale: 0.02, clearcoat: 0.15, clearcoatRoughness: 0.5 });
  const black = new THREE.MeshStandardMaterial({ color: 0x08080b, roughness: 0.75 });
  const keyMat = new THREE.MeshStandardMaterial({ color: 0x0f0f13, roughness: 0.6, metalness: 0.05 });
  const root = new THREE.Group(), keys = {};
  const cast = m => { m.castShadow = true; m.receiveShadow = true; return m; };
  const flat = (geo, mat, y, z = 0, x = 0) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); root.add(m); return m; };

  root.add(cast(new THREE.Mesh(chassis(W, D, R, BH, 0.012), alu)));
  // thumb scoop on the front edge
  const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.02), black); scoop.position.set(0, BH - 0.008, D / 2 - 0.002); root.add(scoop);
  // feet
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.012, 24), black); f.position.set(sx * (W / 2 - 0.25), -0.004, sz * (D / 2 - 0.22)); root.add(f); });
  // ports on the left side
  [-0.5, -0.25].forEach(z => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.025, 0.12), black); p.position.set(-W / 2 + 0.002, BH / 2, z); root.add(p); });

  const kTop = -D / 2 + 0.17, kH = 5.55 * U;
  flat(new THREE.ShapeGeometry(rrShape(15 * U + 0.08, kH + 0.08, 0.03)), black, BH + 0.0008, kTop + kH / 2);
  const grille = dots(); grille.repeat.set(1, 4); grille.colorSpace = THREE.SRGBColorSpace;
  [-1, 1].forEach(s => flat(new THREE.PlaneGeometry(0.15, kH), new THREE.MeshStandardMaterial({ map: grille, color: 0x6a6c74, metalness: 0.8, roughness: 0.45 }), BH + 0.0008, kTop + kH / 2, s * (15 * U / 2 + 0.17)));

  // keys + one legend atlas
  const atlas = document.createElement('canvas'); atlas.width = 1500; atlas.height = 555;
  const ax = atlas.getContext('2d'); ax.fillStyle = 'rgba(225,222,240,.8)';
  const geo = {};
  let z = kTop;
  ROWS.forEach((row, ri) => {
    const h = ri === 0 ? U * 0.55 : U; let cx = -15 * U / 2;
    const zc = z + h / 2; z += h;
    row.forEach(([code, label, w]) => {
      const kx = cx + (w * U) / 2; cx += w * U;
      if (code === 'ArrowKeys') {
        [[-1, 0.25, 0.5], [0, 0, 0.5], [0, 0.5, 0.5], [1, 0.25, 0.5]].forEach(([dx, dz, sh]) => {
          const g = geo['ar'] ??= new RoundedBoxGeometry(U * 0.86, 0.018, U * sh - 0.02, 2, 0.006);
          const k = new THREE.Mesh(g, keyMat); k.position.set(kx + dx * U * 0.9, BH + 0.009, zc - U / 2 + dz * U + U * 0.25); root.add(k);
        });
        return;
      }
      const g = geo[w + '_' + h] ??= new RoundedBoxGeometry(w * U - 0.026, 0.018, h - 0.026, 2, 0.006);
      const k = new THREE.Mesh(g, keyMat); k.position.set(kx, BH + 0.009, zc); k.userData.y0 = k.position.y; root.add(k); keys[code] = k;
      if (label) {
        ax.font = `500 ${label.length > 2 ? 15 : 20}px "Geist Mono"`;
        const px = ((kx - w * U / 2 + 15 * U / 2) / (15 * U)) * 1500, py = ((zc - h / 2 - kTop) / kH) * 555;
        label.length > 2 ? ax.fillText(label, px + 8, py + (ri === 0 ? 20 : 74)) : ax.fillText(label, px + 10, py + 28);
      }
    });
  });
  const lt = new THREE.CanvasTexture(atlas); lt.colorSpace = THREE.SRGBColorSpace; lt.anisotropy = 8;
  flat(new THREE.PlaneGeometry(15 * U, kH), new THREE.MeshBasicMaterial({ map: lt, transparent: true, depthWrite: false, opacity: 0.85 }), BH + 0.0185, kTop + kH / 2);
  keys.Backquote ??= keys.Escape;

  // force-touch trackpad: glass with a hairline edge
  flat(new THREE.ShapeGeometry(rrShape(1.36, 0.82, 0.05)), new THREE.MeshPhysicalMaterial({ color: 0x55575e, metalness: 0.5, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 }), BH + 0.0009, D / 2 - 0.5);
  const hinge = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, W - 0.75, 24), black));
  hinge.rotation.z = Math.PI / 2; hinge.position.set(0, BH + 0.01, -D / 2 + 0.035); root.add(hinge);

  // lid: pivots at the hinge, screen faces the deck when closed
  const lid = new THREE.Group(); lid.position.set(0, BH + 0.003, -D / 2 + 0.03); root.add(lid);
  const shell = cast(new THREE.Mesh(chassis(W, D - 0.02, R, LT, 0.01), alu)); shell.position.set(0, 0, D / 2 - 0.02); lid.add(shell);
  const inner = new THREE.Mesh(new THREE.ShapeGeometry(rrShape(W - 0.03, D - 0.05, R - 0.02)), new THREE.MeshPhysicalMaterial({ color: 0x030304, roughness: 0.12, clearcoat: 1 }));
  inner.rotation.x = Math.PI / 2; inner.position.set(0, -0.001, D / 2 - 0.02); lid.add(inner);
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false, color: 0x000000 });
  const SW = 2.96, SH = 1.85;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), screenMat); screen.rotation.x = Math.PI / 2; screen.position.set(0, -0.002, D / 2 + 0.035); lid.add(screen);
  // glass: additive environment reflection over the panel
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.04, D - 0.06), new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 1, roughness: 0.06, transparent: true, blending: THREE.AdditiveBlending, envMapIntensity: 0.22, depthWrite: false }));
  glass.rotation.x = Math.PI / 2; glass.position.set(0, -0.003, D / 2 - 0.02); lid.add(glass);
  const notch = new THREE.Mesh(new THREE.ShapeGeometry(rrShape(0.34, 0.08, 0.02)), new THREE.MeshBasicMaterial({ color: 0x030304 }));
  notch.rotation.x = Math.PI / 2; notch.position.set(0, -0.0025, D / 2 + 0.035 + SH / 2 - 0.02); lid.add(notch);
  // mark on the back of the lid: polished, picks up the rim light
  const lc = document.createElement('canvas'); lc.width = 256; lc.height = 128;
  const lx = lc.getContext('2d'); lx.fillStyle = '#fff'; lx.font = '500 92px "Geist Mono"'; lx.textAlign = 'center'; lx.textBaseline = 'middle'; lx.fillText('</>', 128, 68);
  const logoT = new THREE.CanvasTexture(lc);
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.24), new THREE.MeshPhysicalMaterial({ color: 0xd9d4ff, metalness: 1, roughness: 0.12, alphaMap: logoT, transparent: true }));
  logo.rotation.x = -Math.PI / 2; logo.rotation.z = Math.PI; logo.position.set(0, LT + 0.002, D / 2 - 0.02); lid.add(logo);
  const spill = new THREE.PointLight(0x8f7bff, 0, 3, 1.6); spill.position.set(0, -0.6, D / 2); lid.add(spill);
  root.position.y = 0.006; // feet clearance
  return { root, lid, keys, screenMat, spill, W, D, BH };
}

let webgl = true;
try { webgl = !!document.createElement('canvas').getContext('webgl2'); } catch { webgl = false; }

if (!webgl) {
  $('.product__canvas').style.background = 'url(assets/lens-hud.webp) center/cover';
} else document.fonts.ready.then(() => {
  const canvas = $('.product__canvas');
  const { r, scene } = makeRenderer(canvas);
  const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 80);

  const key = new THREE.DirectionalLight(0xf4f1ff, 2.6); key.position.set(1.5, 8, 3.5); key.castShadow = true;
  Object.assign(key.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: 2, far: 16 }); key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 8; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  const rim = new THREE.SpotLight(0x7a5cff, 60, 20, 0.6, 0.8); rim.position.set(-4, 4, -5);
  const fill = new THREE.PointLight(0xc9bfff, 6, 14); fill.position.set(3, 1.5, 5);
  scene.add(key, rim, fill, new THREE.HemisphereLight(0xb9b0ff, 0x05030f, 0.35));

  // plinth: matte, faint grain, soft bevel
  const g = grain(22); g.repeat.set(3, 3);
  const slab = new THREE.Mesh(new RoundedBoxGeometry(4.6, 3.2, 3.3, 6, 0.05), new THREE.MeshPhysicalMaterial({ color: 0x16151d, roughness: 0.62, roughnessMap: g, metalness: 0.15, bumpMap: g, bumpScale: 0.04, clearcoat: 0.2, clearcoatRoughness: 0.6 }));
  slab.position.y = -1.6; slab.receiveShadow = true; scene.add(slab);
  // contact shadow: tight and dark when resting, wide and faint when hovering
  const cs = document.createElement('canvas'); cs.width = cs.height = 256;
  const cx = cs.getContext('2d'), rg = cx.createRadialGradient(128, 128, 0, 128, 128, 128); rg.addColorStop(0, 'rgba(0,0,0,.85)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = rg; cx.fillRect(0, 0, 256, 256);
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cs), transparent: true, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2; contact.position.y = 0.003; scene.add(contact);

  const scr = makeScreen();
  const tex = new THREE.CanvasTexture(scr.canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = r.capabilities.getMaxAnisotropy();
  const lap = buildLaptop(tex);
  const tilt = new THREE.Group(), yaw = new THREE.Group();
  lap.root.position.y -= lap.BH / 2; tilt.add(lap.root); tilt.position.y = lap.BH / 2; yaw.add(tilt); scene.add(yaw);

  // reel state; one timeline unit ≈ one second of the reference
  const S = { lid: 0, lift: 0, tiltX: 0, ry: 0, camZ: 10.4, camY: 1.05, lookY: 0.32, power: 0 };
  const tl = gsap.timeline()
    .to(S, { lid: 1.93, duration: 0.55, ease: 'power3.out' }, 0)                                   // 0–0.5s lid swings open
    .to(S, { lift: 0.62, tiltX: 0.36, duration: 0.85, ease: 'power2.inOut' }, 0.4)                 // 0.4–1.2s levitates, tilts toward camera
    .to(S, { camZ: 9.2, camY: 1.5, lookY: 1.02, duration: 0.95, ease: 'power2.inOut' }, 0.35)     // camera cranes up + dollies in
    .to(S, { power: 1, duration: 0.5, ease: 'power1.in' }, 0.6)                                     // screen wakes
    .to(S, { ry: 0.08, camZ: 8.8, duration: 2.6, ease: 'none' }, 1.25)                             // hover drift
    .to(S, { ry: 0.38, duration: 0.6, ease: 'power1.in' }, 3.85)                                    // slow turn starts
    .to(S, { ry: Math.PI + 0.12, duration: 1.15, ease: 'power2.inOut' }, 4.45)                      // fast ~180° spin
    .to(S, { tiltX: 0.5, duration: 0.5, ease: 'power1.out' }, 4.45).to(S, { tiltX: 0.12, duration: 0.65, ease: 'power2.in' }, 4.95)
    .to(S, { power: 0, duration: 0.35 }, 4.7)
    .to(S, { lid: 0.42, duration: 0.7, ease: 'power2.in' }, 4.95)                                    // closes during the turn
    .to(S, { lid: 0, lift: 0, tiltX: 0, duration: 0.75, ease: 'power3.out' }, 5.6)                  // lands closed on the slab
    .to(S, { camZ: 10.4, camY: 1.05, lookY: 0.32, duration: 1.0, ease: 'power2.inOut' }, 5.45)
    .to({}, { duration: 0.35 });

  if (!reduced) {
    ScrollTrigger.create({ trigger: '.product', pin: '.product__stage', start: 'top top', end: '+=460%', scrub: 1, animation: tl, onUpdate: s => gsap.set('.product__meter i', { scaleX: s.progress }) });
    gsap.fromTo('.lap__word span', { xPercent: 6 }, { xPercent: -16, ease: 'none', scrollTrigger: { trigger: '.product', start: 'top bottom', end: () => '+=' + innerHeight * 5.6, scrub: true } });
  } else tl.progress(0.3);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let far = 1;
  const resize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; far = Math.max(1, 1.3 / cam.aspect); cam.updateProjectionMatrix(); };
  resize(); addEventListener('resize', resize);
  addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = e.clientY / innerHeight - 0.5; });

  /* typing: real keystrokes press real keys; an autopilot types when you don't */
  const typedEl = $('.typed span');
  let typed = '', lastHuman = 0, visible = false;
  const press = code => { const k = lap.keys[code]; if (k) gsap.fromTo(k.position, { y: k.userData.y0 - 0.01 }, { y: k.userData.y0, duration: 0.3, ease: 'back.out(3)', overwrite: true }); };
  const show = s => { typed = (typed + s).slice(-34); typedEl.textContent = typed; };
  addEventListener('keydown', e => {
    if (e.target.closest?.('input,textarea') || !visible) return;
    if (performance.now() - lastHuman > 3000) typed = ''; // human takes over from the autopilot
    lastHuman = performance.now(); press(e.code);
    if (e.key.length === 1) show(e.key); else if (e.key === 'Backspace') { typed = typed.slice(0, -1); typedEl.textContent = typed; }
  });
  const LINES = ['ship({ craft: true, ai: true })', 'npm run build -- --beautiful', 'git commit -m "last 2%"', 'await agent.plan(goal)'];
  let li = 0, ci = 0;
  (function auto() {
    setTimeout(auto, 70 + Math.random() * 110);
    if (!visible || reduced || S.power < 0.5 || performance.now() - lastHuman < 3000) return;
    const line = LINES[li];
    if (ci === 0) typed = '';
    if (ci < line.length) {
      const ch = line[ci++], base = SHIFTED[ch] ?? ch;
      if (SHIFTED[ch] || /[A-Z]/.test(ch)) press('ShiftLeft');
      press(codeOf(base.toLowerCase())); show(ch);
    } else { press('Enter'); ci = 0; li = (li + 1) % LINES.length; }
  })();

  let onAt = -1, lastDraw = 0;
  gsap.ticker.add(t => {
    const b = canvas.getBoundingClientRect(); // pin-safe visibility (a separate toggle trigger mis-measures pinned parents)
    visible = b.bottom > 0 && b.top < innerHeight;
    if (!visible) return;
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    const hover = S.lift > 0.05 ? Math.sin(t * 1.1) * 0.025 * (S.lift / 0.62) : 0;
    lap.lid.rotation.x = -S.lid;
    tilt.rotation.x = S.tiltX;
    yaw.rotation.y = S.ry + mouse.x * 0.1 * (S.lift / 0.62);
    yaw.position.y = S.lift + hover;
    cam.position.set(mouse.x * 0.25, (S.camY - mouse.y * 0.15), S.camZ * far);
    cam.lookAt(0, S.lookY, 0);
    // contact shadow reacts to height like the reel: tight/dark on the slab, broad/soft when floating
    const h = S.lift / 0.62;
    contact.scale.set(3.6 + h * 1.4, 1, 2.6 + h * 1.2); contact.material.opacity = 0.75 - h * 0.45;
    // screen: restart the boot sequence each time it powers on; redraw at ~30fps
    if (S.power > 0.5 && onAt < 0) onAt = t; else if (S.power < 0.05) onAt = -1;
    lap.screenMat.color.setScalar(S.power);
    lap.spill.intensity = S.power * 2.4;
    if (onAt >= 0 && t - lastDraw > 1 / 30) { scr.draw(reduced ? 6 : t - onAt); tex.needsUpdate = true; lastDraw = t; }
    r.render(scene, cam);
  });
  ScrollTrigger.sort(); ScrollTrigger.refresh();
});

// Pins are created out of DOM order (3D scene waits for fonts) — sort so spacing is computed top-down.
ScrollTrigger.sort();
ScrollTrigger.refresh();
addEventListener('load', () => ScrollTrigger.refresh());
