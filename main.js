import { initMachine } from './machine.js';
const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const sfx = (() => {
  let ac; const bufs = {};
  const unlock = () => {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    ['chip', 'toggle', 'peel', 'send', 'error', 'pm-tile1', 'pm-tile2', 'pm-tile3', 'pm-tile4', 'pm-speaker', 'pm-print', 'pm-key', 'pm-build', 'pm-next', 'pm-ship', 'pm-gauge', 'pm-on', 'pm-off', 'pm-lever', 'pm-spring'].forEach(n => fetch(`assets/sfx/${n}.mp3`).then(r => r.arrayBuffer()).then(b => ac.decodeAudioData(b)).then(d => (bufs[n] = d)).catch(() => {}));
  };
  addEventListener('pointerdown', unlock, { once: true, capture: true });
  addEventListener('keydown', unlock, { once: true, capture: true });
  return (n, vol = 0.32, rate = 1) => {
    if (!ac || !bufs[n]) return;
    const s = ac.createBufferSource(), g = ac.createGain();
    s.buffer = bufs[n]; s.playbackRate.value = rate * (0.97 + Math.random() * 0.06); g.gain.value = vol;
    s.connect(g).connect(ac.destination); s.start();
  };
})();
const mm = gsap.matchMedia();
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* ---------------- smooth scroll ---------------- */
let lenis = null;
if (!reduced) {
  lenis = new window.Lenis({ lerp: 0.075, wheelMultiplier: 0.9, touchMultiplier: 1.3, smoothWheel: true });
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

/* ---------------- loader + hero intro ----------------
   1. The </> mark assembles pixel by pixel in the centre of a violet field.
   2. It flies into the nav logo's exact spot while a giant "Rahat" rises through a mask.
   3. The field lifts away on a stepped pixel edge; the hero intro plays underneath as it clears.
   The real nav logo sits under the field the whole time, so the hand-off is seamless. */
document.body.classList.add('is-loading');
{
  const heroImg = $('.hero__portrait img'), loader = $('.loader'), mark = $('.loader__mark'), word = $('.loader__word span'), navLogo = $('.nav .logo svg');
  const imgReady = new Promise(r => (heroImg.complete ? r() : (heroImg.onload = heroImg.onerror = r, setTimeout(r, 4000))));
  // pixel map of </> (13 x 7 cells)
  const CELLS = [[3,0],[2,1],[1,2],[0,3],[1,4],[2,5],[3,6], [8,0],[8,1],[7,2],[6,3],[6,4],[5,5],[5,6], [9,0],[10,1],[11,2],[12,3],[11,4],[10,5],[9,6]];
  const px = CELLS.map(([x, y]) => { const i = document.createElement('i'); i.style.left = `calc(var(--u) * ${x})`; i.style.top = `calc(var(--u) * ${y})`; mark.appendChild(i); return i; });
  // stepped bottom edge: columns sit at a few heights, like pixels peeling off
  const STEPS = [0, 1, 0, 2, 1, 0, 1, 2, 0, 1, 0, 2, 1, 0], E = { b: 0 };
  const paintEdge = () => {
    const cell = innerHeight * 0.05, n = STEPS.length, pts = ['0 0', '100% 0'];
    for (let i = n - 1; i >= 0; i--) { const y = Math.max(0, E.b - STEPS[i] * cell); pts.push(`${((i + 1) / n * 100).toFixed(3)}% ${y.toFixed(1)}px`, `${(i / n * 100).toFixed(3)}% ${y.toFixed(1)}px`); }
    loader.style.clipPath = `polygon(${pts.join(',')})`;
  };
  E.b = innerHeight + innerHeight * 0.16; paintEdge();
  gsap.set(word, { yPercent: 110 });
  const intro = () => gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.4 } })
    // light blooms first, the arc rises behind, then the silhouette steps out of the dark
    // slowed for a calm, cinematic reveal: the glow breathes in, the arc climbs, the face sharpens out of the blur
    .from('.hero__bg', { opacity: 0, scale: 1.35, duration: 3.6, ease: 'power3.out' })
    .fromTo('.hero__arc', { clipPath: 'inset(100% 0% 0% 0%)', yPercent: 14 }, { clipPath: 'inset(47% 0% 0% 0%)', yPercent: 0, duration: 2.8, ease: 'power3.out' }, '<0.45')
    .from('.hero__portrait img', { yPercent: 10, scale: 1.08, '--b': 0, '--bl': '18px', duration: 3.4, ease: 'power3.out', onComplete() { this.targets()[0].style.filter = 'none'; } }, '<0.15')
    .from('.hero__title .line > span', { yPercent: 115, stagger: 0.12, duration: 1.8 }, 1.6) // after the field has fully cleared
    .from('.nav > *:not(.logo)', { y: -30, opacity: 0, stagger: 0.08, duration: 1.4 }, '<0.3')
    .from(['.hero__lede', '.hero__meta'], { y: 24, opacity: 0, stagger: 0.16, duration: 1.6 }, '<0.4');
  const finish = () => { loader.style.display = 'none'; document.body.classList.remove('is-loading'); lenis?.start(); };
  if (reduced) {
    imgReady.then(() => gsap.to(loader, { opacity: 0, duration: 0.4, onComplete: () => { finish(); } }));
  } else {
    const assemble = gsap.to(px, { scale: 1, duration: 0.16, ease: 'back.out(3)', delay: 0.8, stagger: { each: 0.035, from: 'random' } });
    Promise.all([imgReady, assemble.then(), document.fonts.ready]).then(() => {
      const m = mark.getBoundingClientRect(), t = navLogo.getBoundingClientRect(), s = t.width / m.width;
      // build the hero intro now but hold it: its from-states (dark stage, no light, no arc, no portrait)
      // apply immediately, so the lifting field reveals an empty stage and the full intro plays after
      const heroIn = intro().pause();
      gsap.timeline()
        .to(mark, { x: t.left + t.width / 2 - (m.left + m.width / 2), y: t.top + t.height / 2 - (m.top + m.height / 2), scale: s, duration: 1.05, ease: 'expo.inOut' }, 0.1)
        .to(word, { yPercent: 0, duration: 1.15, ease: 'expo.out' }, 0.25)
        // the field lifts away on its stepped edge; the word drifts up a little faster for depth
        .to(E, { b: -innerHeight * 0.16, duration: 1.2, ease: 'power3.inOut', onUpdate: paintEdge }, 1.15)
        .to(word, { yPercent: -18, duration: 1.2, ease: 'power3.inOut' }, 1.15)
        // the intro starts the instant the field begins to lift, so the stage is already lighting up as it's uncovered
        .add(() => heroIn.play(), 1.15) // the loader has finished its show; the hero enters as the field lifts
        .add(finish);
    });
  }
}

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
gsap.set(pill, { opacity: 0 }); // nothing is current on the hero; the first section trigger fades it in
document.fonts.ready.then(() => { movePill(activeLink); ScrollTrigger.refresh(); });
links.forEach(a => a.addEventListener('pointerenter', () => { movePill(a); gsap.to(pill, { opacity: 1, duration: 0.2 }); }));
$('.nav__links').addEventListener('pointerleave', () => { movePill(activeLink); gsap.to(pill, { opacity: activeLink.classList.contains('is-active') ? 1 : 0, duration: 0.3 }); });
links.forEach(a => ScrollTrigger.create({
  trigger: $(a.getAttribute('href')), start: 'top 50%', end: 'bottom 50%',
  onToggle: s => { if (!s.isActive) return; activeLink.classList.remove('is-active'); activeLink = a; a.classList.add('is-active'); movePill(a); gsap.to(pill, { opacity: 1, duration: 0.3 }); }
}));
// back above the first section: nothing is "current", so clear the highlight instead of leaving the last one lit
ScrollTrigger.create({ trigger: '.hero', start: 'top bottom', end: 'bottom 50%', onToggle: s => { if (!s.isActive) return; activeLink.classList.remove('is-active'); gsap.to(pill, { opacity: 0, duration: 0.3 }); } });
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
  // the glow position lives in CSS vars; tween a plain proxy and write them as % (quickTo can't add units to vars)
  const G = { x: 50, y: 34 }, paintG = () => { hero.style.setProperty('--gx', G.x + '%'); hero.style.setProperty('--gy', G.y + '%'); };
  const gx = gsap.quickTo(G, 'x', { duration: 1.8, ease: 'power3', onUpdate: paintG }), gy = gsap.quickTo(G, 'y', { duration: 1.8, ease: 'power3', onUpdate: paintG });
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
  $$('.h2, .eyebrow, .steps li').forEach(el =>
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

/* ---------------- process: the build machine (machine.js) ---------------- */
initMachine({ reduced, finePointer, sfx });

/* ---------------- services: cursor preview ---------------- */
if (finePointer) {
  const prev = $('.cases__preview'), img = $('img', prev);
  const xTo = gsap.quickTo(prev, 'x', { duration: 0.6, ease: 'power3' }), yTo = gsap.quickTo(prev, 'y', { duration: 0.6, ease: 'power3' });
  const rTo = gsap.quickTo(prev, 'rotation', { duration: 0.8, ease: 'power3' });
  let lastX = 0;
  const list = $('.cases__list');
  const show = li => { if (img.getAttribute('src') !== li.dataset.img) img.src = li.dataset.img; gsap.to(prev, { opacity: 1, scale: 1, duration: 0.45, ease: 'expo.out', overwrite: 'auto' }); };
  const hide = () => gsap.to(prev, { opacity: 0, scale: 0.85, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  list.addEventListener('pointerleave', hide);
  // scrolling moves rows out from under a still cursor without any pointerleave, so re-check on scroll
  addEventListener('scroll', () => { if (!list.matches(':hover')) hide(); }, { passive: true });
  $$('.cases__list li').forEach(li => {
    new Image().src = li.dataset.img;
    li.addEventListener('pointerenter', () => show(li));
    li.addEventListener('pointerleave', e => { if (!e.relatedTarget || !list.contains(e.relatedTarget)) hide(); });
    li.addEventListener('pointermove', e => { xTo(e.clientX + 30); yTo(e.clientY - 170); rTo(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6)); lastX = e.clientX; });
  });
}

/* ---------------- contact: sentence form ----------------
   Fill-in-the-blanks: inputs sit inside the sentence and grow with what you type.
   Errors show only after a field is left or on submit, one calm line at a time. */
{
  const form = $('#contact .form'), ok = $('.form__ok', form), err = $('.mad__err', form), btn = $('button[type=submit]', form), txt = $('.btn__txt', form);
  const contact = form.contact, clear = $('.mad__x', form), wa = () => form.channel.value === 'WhatsApp';
  const rules = {
    name: v => v.trim().length > 1 || 'Tell me your name.',
    contact: v => (wa() ? /^\+?[\d\s()-]{7,}$/ : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/).test(v.trim()) || (wa() ? 'That WhatsApp number looks short.' : 'Check that email address.'),
    message: v => v.trim().length >= 10 || 'A sentence or two helps me prepare.'
  };
  const fields = [form.name, contact, form.message];
  const check = el => {
    const res = rules[el.name](el.value), bad = res !== true;
    el.closest('.mad__f').classList.toggle('is-bad', bad); el.setAttribute('aria-invalid', bad);
    return res;
  };
  fields.forEach(el => {
    el.addEventListener('blur', () => { if (el.value) { const r = check(el); err.textContent = r === true ? '' : r; } });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') { const r = check(el); err.textContent = r === true ? '' : r; } });
  });
  // browsers without field-sizing: size the blanks by character count
  if (!CSS.supports('field-sizing', 'content')) $$('.mad__f:not(.mad__f--fill) input', form).forEach(i => { const fit = () => (i.style.width = Math.max(i.value.length, i.placeholder.length) + 2 + 'ch'); i.addEventListener('input', fit); fit(); });
  contact.addEventListener('input', () => (clear.hidden = !contact.value));
  clear.addEventListener('click', () => { contact.value = ''; clear.hidden = true; contact.dispatchEvent(new Event('input')); contact.focus(); });
  // one pill per choice group glides to the picked chip (measured, so it works at any wrap)
  const pills = $$('[role=radiogroup]', form).map(g => {
    const pill = document.createElement('i'); pill.className = 'mad__pill'; g.prepend(pill);
    const move = instant => {
      const c = $('input:checked+span', g); if (!c) return;
      const gr = g.getBoundingClientRect(), r = c.getBoundingClientRect();
      gsap.to(pill, { x: r.left - gr.left, y: r.top - gr.top, width: r.width, height: r.height, duration: instant || reduced ? 0 : 0.6, ease: 'expo.out', overwrite: true });
    };
    g.addEventListener('change', e => { move(); sfx(e.target.name === 'channel' ? 'toggle' : 'chip'); });
    new ResizeObserver(() => move(true)).observe(g);
    move(true);
    return move;
  });
  $$('input[name=channel]', form).forEach(r => r.addEventListener('change', () => {
    contact.type = wa() ? 'tel' : 'email'; contact.autocomplete = wa() ? 'tel' : 'email';
    contact.placeholder = wa() ? 'your WhatsApp' : 'your email';
    contact.dispatchEvent(new Event('input'));
    if (contact.value) { const r2 = check(contact); err.textContent = r2 === true ? '' : r2; }
  }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const bad = fields.map(el => [el, check(el)]).find(([, r]) => r !== true);
    if (bad) {
      err.textContent = bad[1]; bad[0].focus(); sfx('error', 0.28);
      gsap.fromTo(bad[0].closest('.mad__f'), { x: -6 }, { x: 0, duration: 0.6, ease: 'elastic.out(1,0.3)', clearProps: 'transform' });
      return;
    }
    err.textContent = ''; btn.disabled = true; txt.textContent = 'Sending…';
    // shortcut: no backend — simulates delivery. Point this at Formspree/Resend/your API before launch.
    setTimeout(() => {
      const first = form.name.value.trim().split(' ')[0], via = form.channel.value, type = form.type.value;
      ok.textContent = `Thanks, ${first}. I'll reply on ${via} within 24 hours.`;
      gsap.from(ok, { y: 6, opacity: 0, duration: 0.7, ease: 'expo.out' });
      txt.textContent = 'Message sent'; sfx('send', 0.3);
      form.reset(); form.channel.value = via; form.type.value = type; clear.hidden = true; pills.forEach(m => m(true));
      $$('input', form).forEach(i => i.dispatchEvent(new Event('input')));
      setTimeout(() => { btn.disabled = false; txt.textContent = 'Send message'; }, 2500);
    }, 1100);
  });
}

/* ---------------- contact: real-time knot ----------------
   knot.js (Three.js, loaded only when the section is near) renders the Blender GLB.
   The Cycles poster stays underneath as the loading / no-WebGL / slow-device fallback. */
{
  const art = $('.kx__art');
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    import('./knot.js').then(m => m.mountKnot(art, { reduced })).catch(() => {}); // poster remains
  }, { rootMargin: '600px' }).observe(art);
}

/* ---------------- contact: ASCII field that answers the knot + entrance parallax ----------------
   Behind the knot: monospace glyphs in a halo hugging its silhouette. The halo's lobes turn with the
   knot's real rotation (window.__knot from knot.js; the spinning poster's angle when WebGL is off),
   so letters only change when the knot moves. No random jitter. ~20 fps, only while on screen. */
{
  const cv = $('.kx__ascii'), ctx = cv.getContext('2d'), art = $('.kx__art'), RAMP = ' .:;~-=+<>ixzv/{}XYZ#%@', CW = 11, CH = 16;
  let cols = 0, rows = 0, w = 0, h = 0, on = false, last = 0;
  const size = () => {
    const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio, 2);
    w = r.width; h = r.height; cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    cols = Math.ceil(w / CW); rows = Math.ceil(h / CH);
    ctx.font = "500 12px 'Geist Mono', ui-monospace, monospace"; ctx.textBaseline = 'top';
  };
  const draw = t => {
    ctx.clearRect(0, 0, w, h);
    const a = art.getBoundingClientRect(), c = cv.getBoundingClientRect();
    const kx = a.left + a.width / 2 - c.left, ky = a.top + a.height / 2 - c.top, R = a.width * 0.4;
    const k = window.__knot, ay = k ? k.y : t * 0.07, ax = k ? k.x : t * 0.045;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = x * CW + CW / 2 - kx, dy = y * CH + CH / 2 - ky, d = Math.hypot(dx, dy) / R;
      if (d < 0.8) continue; // hidden behind the knot anyway
      const th = Math.atan2(dy, dx);
      const halo = Math.exp(-((d - 1.05) ** 2) / 0.16);
      const lobes = (0.5 + 0.5 * Math.cos(3 * th - ay * 3 + d * 1.8)) * (0.55 + 0.45 * Math.cos(2 * th + ax * 2 - d));
      const v = halo * (0.3 + 0.75 * lobes);
      if (v < 0.12) continue;
      ctx.fillStyle = v > 0.72 ? `rgba(214,206,255,${Math.min(0.85, v * 0.8).toFixed(2)})` : `rgba(124,104,255,${(v * 0.8).toFixed(2)})`;
      ctx.fillText(RAMP[Math.min(RAMP.length - 1, (v * RAMP.length) | 0)], x * CW, y * CH);
    }
  };
  new ResizeObserver(() => { size(); draw(last); }).observe(cv);
  if (!reduced) {
    new IntersectionObserver(([e]) => (on = e.isIntersecting)).observe(cv);
    gsap.ticker.add(t => { if (on && t - last > 1 / 20) { last = t; draw(t); } });
    const sc = (from, extra = {}) => ({ ...from, ease: 'none', scrollTrigger: { refreshPriority: -1, trigger: '.contact', start: 'top bottom', end: 'top top', scrub: 1.2 }, ...extra });
    gsap.from('.kx__inner', sc({ y: 140 }));
    gsap.from('.kx__art', sc({ yPercent: 35, rotate: -18 }));
    gsap.from('.kx__ascii', sc({ yPercent: 20, opacity: 0 }));
  }
}

if (!reduced) {
  gsap.fromTo('.footer__word', { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: { refreshPriority: -2, trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
}

/* ---------------- socials: copy email, placeholder links ---------------- */
const toast = msg => { const t = $('.toast'); t.textContent = msg; t.classList.add('is-on'); clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('is-on'), 2400); };
$$('[data-email]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  const m = a.dataset.email;
  (navigator.clipboard ? navigator.clipboard.writeText(m) : Promise.reject()).then(() => toast(`Copied ${m} — talk soon`), () => (location.href = a.href));
}));
$$('[data-todo]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); toast('Link coming soon'); }));

/* ---------------- gift: sticker board ----------------
   One continuous parallax over the section's whole pass through the viewport (no start/stop phases):
   each layer's offset = (0.5 - progress) * data-speed, so everything glides at its own rate the entire
   time and settles exactly when the section is centred. Progress is smoothed (scrub), positions are
   written before the section ever appears, and a slow float + depth-scaled cursor drift sit on top. */
{
  const sec = $('.gift'), items = $$('[data-speed]', sec);
  const P = { v: reduced ? 0.5 : 0 }, M = { x: 0, y: 0 }, T = { x: 0, y: 0 };
  const seeds = items.map(() => [Math.random() * 6.28, 0.22 + Math.random() * 0.2]);
  let t = 0, on = false;
  const render = () => {
    const d = 0.5 - P.v, fade = Math.min(1, Math.max(0, Math.min(P.v, 1 - P.v) * 5));
    items.forEach((el, i) => {
      const sp = +el.dataset.speed, dp = +el.dataset.depth, [ph, f] = seeds[i], still = el.dataset.f === '0', fl = still || reduced ? 0 : 1;
      const y = d * sp * 2.2 + fl * Math.sin(t * f + ph) * 9 + M.y * dp;
      const x = fl * Math.cos(t * f * 0.8 + ph) * 5 + M.x * dp * 1.4;
      el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${(fl * Math.sin(t * f * 0.6 + ph) * 2.2 + d * (i % 2 ? 6 : -6) * fl).toFixed(2)}deg)`;
      if (!still) el.style.opacity = fade.toFixed(3);
    });
  };
  render();
  if (!reduced) {
    // visibility only; progress is read from the live (Lenis-smoothed) position every frame, so no tween
    // restarts on each scroll event and there is no surge-and-stall
    ScrollTrigger.create({ refreshPriority: -1, trigger: sec, start: 'top bottom', end: 'bottom top', onToggle: s => (on = s.isActive) });
    const prog = () => { const r = sec.getBoundingClientRect(); return Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height))); };
    P.v = prog();
    if (finePointer) sec.addEventListener('pointermove', e => { T.x = e.clientX / innerWidth * 2 - 1; T.y = e.clientY / innerHeight * 2 - 1; });
    sec.addEventListener('pointerleave', () => (T.x = T.y = 0));
    gsap.ticker.add((time, dt) => {
      if (!on) return;
      t = time;
      const k = 1 - Math.pow(0.95, dt / 16.7);
      M.x += (T.x - M.x) * k; M.y += (T.y - M.y) * k;
      P.v += (prog() - P.v) * (1 - Math.pow(0.86, dt / 16.7)); // steady glide toward the true position
      render();
    });
  }
  $$('[download]', sec).forEach(a => a.addEventListener('click', () => { sfx('peel', 0.4); toast('Sticker saved. Enjoy it.'); }));
}

/* ---------------- stack: the horizon ----------------
   Pinned while dawn breaks, the headline fills and three proof cards rise; then
   the stage scrolls away with hero-style parallax as the sky sinks back to night.
   The ribbon is drawn at low resolution and ordered-dithered (Bayer 4×4) into the
   brand palette, then scaled up with no smoothing: crisp pixel dots, one canvas.
   It has its own inertia: idles, spins up with scroll, coasts down when you stop. */
{
  const stage = $('.flow__stage'), sky = $('.flow__sky'), cv = $('.flow__ribbon'), copy = $('.flow__copy');
  const cards = $$('.gcard', stage), title = $('.flow__title'), ctx = cv.getContext('2d');
  const ss = (a, b, x) => { const t = gsap.utils.clamp(0, 1, (x - a) / (b - a)); return t * t * (3 - 2 * t); };
  title.innerHTML = title.textContent.split(' ').map(w => `<span class="w${/layer|hand-offs/i.test(w) ? ' acc' : ''}">${w}</span>`).join(' ');
  const words = $$('.w', title);
  const nums = cards.map(c => { const b = $('b', c); return { el: b, from: +b.dataset.from, to: +b.dataset.to, last: null }; });
  const clock = $('.viz-clock', stage);
  // dither: 4×4 Bayer thresholds and five palette steps from deep indigo to near-white
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const PAL = [[29, 12, 134], [58, 30, 208], [91, 60, 255], [169, 155, 255], [241, 237, 255]];
  const off = document.createElement('canvas'), octx = off.getContext('2d', { willReadFrequently: true });
  const PX = 3; // CSS px per dither pixel
  let lw = 0, lh = 0;
  const size = () => { const r = cv.getBoundingClientRect(); lw = Math.max(1, Math.round(r.width / PX)); lh = Math.max(1, Math.round(r.height / PX)); off.width = cv.width = lw; off.height = cv.height = lh; ctx.imageSmoothingEnabled = false; };
  size(); addEventListener('resize', size);

  const PIN = 1.6, Q = PIN / (PIN + 1);
  let P = 0, target = 0, mx = 0, my = 0, tmx = 0, tmy = 0, lastW = -1, on = false;
  let phase = 0, spin = 0.2, vel = 0, light = false;
  addEventListener('pointermove', e => { tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5; });
  lenis?.on('scroll', e => (vel = e.velocity));

  function drawRibbon(ph) {
    const N = innerWidth < 700 ? 20 : 34, W = lw, H = lh, cx = W / 2, cy = H / 2, f = 1200 / PX, span = W * 0.96, bh = H * 0.52, bw = Math.max(2, span / N * 0.62);
    const quads = [];
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1), wave = Math.sin(ph + u * 5.2), tw = Math.sin(ph * 0.7 + u * 7) * 1.36, rz = wave * 0.17;
      const X = (u - 0.5) * span + mx * -10, Y = wave * H * 0.16 + my * 6, Z = Math.cos(ph + u * 5.2) * 30;
      const ct = Math.cos(tw), st = Math.sin(tw), cz = Math.cos(rz), sz = Math.sin(rz);
      const pts = [[-bw / 2, -bh / 2], [bw / 2, -bh / 2], [bw / 2, bh / 2], [-bw / 2, bh / 2]].map(([x, y]) => {
        const y1 = y * ct, z1 = y * st, x2 = x * cz - y1 * sz, y2 = x * sz + y1 * cz, zz = Z + z1, s = f / (f - zz);
        return [cx + (X + x2) * s, cy + (Y + y2) * s];
      });
      const lum = (0.18 + Math.sin(u * Math.PI) * 0.72) * (0.5 + 0.5 * Math.abs(ct)) + 0.06;
      quads.push([Z, pts, Math.min(lum, 1)]);
    }
    octx.clearRect(0, 0, W, H);
    quads.sort((a, b) => a[0] - b[0]).forEach(([, p, l]) => {
      const v = Math.round(l * 255); octx.fillStyle = `rgb(${v},${v},${v})`;
      octx.beginPath(); octx.moveTo(p[0][0], p[0][1]); for (let k = 1; k < 4; k++) octx.lineTo(p[k][0], p[k][1]); octx.closePath(); octx.fill();
    });
    const img = octx.getImageData(0, 0, W, H), d = img.data, L = PAL.length - 1;
    for (let y = 0, o = 0; y < H; y++) for (let x = 0; x < W; x++, o += 4) {
      const th = BAYER[(x & 3) + ((y & 3) << 2)];
      if (d[o + 3] / 255 <= th) { d[o + 3] = 0; continue; }       // dithered edge, no soft alpha
      const lv = (d[o] / 255) * L, bi = Math.floor(lv), c = PAL[Math.min(L, bi + (lv - bi > th ? 1 : 0))];
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  function frame(t, dt = 16) {
    const k = 1 - Math.exp(-dt / 220); // heavier follow: the stage settles a beat after your thumb
    P += (target - P) * k; mx += (tmx - mx) * k * 0.6; my += (tmy - my) * k * 0.6;
    const p = reduced ? Q : P, a = Math.min(p / Q, 1), e = Math.max(0, (p - Q) / (1 - Q)), vh = innerHeight;
    // weight: idle drift; scroll spins it up over ~0.4s; it coasts down over ~1.5s
    vel *= Math.exp(-dt / 300);
    const want = 0.2 + Math.min(Math.abs(vel) * 0.05, 2.2);
    spin += (want - spin) * (1 - Math.exp(-dt / (want > spin ? 400 : 1500)));
    if (!reduced) phase += spin * dt / 1000;

    const skyY = a < 0.28 ? (a / 0.28) * 34 : 34 + ((a - 0.28) / 0.72) * 6 + ss(0, 0.45, e) * 44;
    sky.style.transform = `translate3d(0,${-skyY}%,0)`;
    const isLight = a > 0.24 && e < 0.55;
    if (isLight !== light) { light = isLight; nav.classList.toggle('on-light', light); }

    const rIn = ss(0.04, 0.26, a);
    cv.style.opacity = rIn * (1 - ss(0.55, 0.95, e));
    cv.style.transform = `translate3d(0,${(1 - rIn) * 200 + e * vh * 0.35}px,0)`;
    if (cv.style.opacity > 0.01) drawRibbon(phase + mx * 0.8);

    copy.style.opacity = ss(0.1, 0.22, a) * (1 - ss(0.15, 0.6, e));
    copy.style.transform = `translate3d(0,${(1 - ss(0.1, 0.24, a)) * 40 - e * vh * 0.45}px,0)`;
    const lit = Math.floor(ss(0.14, 0.38, a) * (words.length + 0.999));
    if (lit !== lastW) { words.forEach((w, i) => w.classList.toggle('on', i < lit)); lastW = lit; }

    cards.forEach((c, i) => {
      const r = ss(0.26 + i * 0.06, 0.56 + i * 0.06, a), sp = [1, 1.2, 1.4][i];
      const y = (1 - r) * vh * 0.6 * sp - e * vh * (0.12 + i * 0.07);
      c.style.transform = `translate3d(${mx * -10 * (i + 1)}px,${y}px,0) rotateX(${my * -5 + (1 - r) * 16}deg) rotateY(${mx * 7}deg) rotate(${(1 - r) * (i - 1) * 5}deg)`;
      c.style.opacity = ss(0.24 + i * 0.06, 0.36 + i * 0.06, a);
      c.classList.toggle('is-live', r > 0.5 && e < 1);
      const nmb = nums[i], v = Math.round(nmb.from + (nmb.to - nmb.from) * ss(0.32 + i * 0.06, 0.62 + i * 0.06, a));
      if (v !== nmb.last) { nmb.last = v; nmb.el.textContent = v; }
    });
    clock.style.setProperty('--arc', (100 * ss(0.44, 0.74, a)).toFixed(1));
  }

  if (!reduced) {
    ScrollTrigger.create({ trigger: '.flow', pin: stage, start: 'top top', end: () => '+=' + innerHeight * PIN, invalidateOnRefresh: true, onRefresh: size });
    ScrollTrigger.create({ trigger: '.flow', start: 'top top', end: () => '+=' + innerHeight * (PIN + 1), invalidateOnRefresh: true, onUpdate: s => (target = s.progress) });
  }
  ScrollTrigger.create({ trigger: '.flow', start: 'top bottom', end: 'bottom top', onToggle: s => { on = s.isActive; if (!on && light) { light = false; nav.classList.remove('on-light'); } } });
  gsap.ticker.add((t, dt) => { if (on || Math.abs(target - P) > 0.0005) frame(t, Math.min(dt, 100)); });
  frame(0);
}

// Pins are created out of DOM order (3D scene waits for fonts) — sort so spacing is computed top-down.
ScrollTrigger.sort();
ScrollTrigger.refresh();
addEventListener('load', () => ScrollTrigger.refresh());
