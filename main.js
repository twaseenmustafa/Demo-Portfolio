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

/* ---------------- stack: floating sticker field ----------------
   Each sticker rises at its own speed (parallax) while the section scrolls in,
   holds while pinned, then peels away upward on exit. Three nested layers so
   scroll-in, scroll-out and pointer tilt never fight over the same transform. */
{
  const sec = $('.float'), items = $$('.sticker', sec);
  const sp = el => +el.dataset.speed;
  if (!reduced) {
    items.forEach(el => gsap.fromTo(el, { y: () => innerHeight * 0.5 * sp(el), rotation: () => (sp(el) - 1.6) * 18 },
      { y: 0, rotation: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top top', scrub: true, invalidateOnRefresh: true } }));
    gsap.from('.float__word span', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: sec, start: 'top 80%', end: 'top 10%', scrub: true } });
    gsap.timeline({ scrollTrigger: { trigger: sec, pin: '.float__stage', start: 'top top', end: '+=120%', scrub: true } })
      .to({}, { duration: 0.4 })
      .to(items.map(el => $('.sticker__out', el)), {
        y: i => -innerHeight * (0.45 + sp(items[i]) * 0.3), rotation: i => (i % 2 ? 1 : -1) * (14 + sp(items[i]) * 8),
        scale: 0.75, opacity: 0, ease: 'power2.in', duration: 1, stagger: { each: 0.04, from: 'center' }
      }, 0.4)
      .to('.float__word span', { yPercent: -35, scale: 0.92, opacity: 0, ease: 'power2.in', duration: 0.8 }, 0.7)
      .to(['.float__cap', '.float__head'], { y: -50, opacity: 0, ease: 'power2.in', duration: 0.5 }, 0.8);
  }
  if (finePointer && !reduced) {
    const tilt = items.map(el => {
      const t = $('.sticker__tilt', el), o = { duration: 0.9, ease: 'power3' };
      return { rx: gsap.quickTo(t, 'rotationX', o), ry: gsap.quickTo(t, 'rotationY', o), x: gsap.quickTo(t, 'x', o), y: gsap.quickTo(t, 'y', o), d: sp(el) };
    });
    sec.addEventListener('pointermove', e => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      tilt.forEach(o => { o.ry(nx * 34); o.rx(-ny * 34); o.x(nx * -26 * o.d); o.y(ny * -18 * o.d); });
    });
  }
}

// Pins are created out of DOM order (3D scene waits for fonts) — sort so spacing is computed top-down.
ScrollTrigger.sort();
ScrollTrigger.refresh();
addEventListener('load', () => ScrollTrigger.refresh());
