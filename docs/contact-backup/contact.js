/* ---------------- contact: two-step brief ----------------
   Step 1 picks the project type, step 2 is the brief. Both steps share one grid cell,
   so the card never changes height; GSAP blurs one set out and staggers the other in. */
{
  const card = $('.ccard'), seg = $('.seg', card), [tab1, tab2] = $$('.seg__b', seg);
  const step1 = $('.cstep[data-step="1"]', card), form = $('.form', card), opts = $$('.opt', card);
  const ok = $('.form__ok', form), btn = $('button[type=submit]', form), txt = $('.btn__txt', form);
  const parts = el => [...el.children].filter(c => c.type !== 'hidden');
  gsap.set(form, { visibility: 'hidden' });
  const go = n => {
    if (+seg.dataset.at === n) return;
    const out = n === 2 ? step1 : form, inn = n === 2 ? form : step1, d = reduced ? 0 : 1;
    seg.dataset.at = n;
    tab1.toggleAttribute('aria-current', n === 1); tab2.toggleAttribute('aria-current', n === 2);
    out.inert = true; inn.inert = false;
    gsap.killTweensOf([step1, form, ...parts(step1), ...parts(form)]);
    gsap.timeline()
      .to(parts(out), { y: -12, opacity: 0, filter: 'blur(6px)', duration: 0.3 * d, stagger: 0.035 * d, ease: 'power2.in' })
      .set(out, { visibility: 'hidden' }).set(inn, { visibility: 'visible' })
      .fromTo(parts(inn), { y: 18, opacity: 0, filter: 'blur(8px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.75 * d, stagger: 0.06 * d, ease: 'expo.out', clearProps: 'filter,transform' }, '-=0.06')
      .call(() => (n === 2 ? form.name : $('.opt.is-on', step1) || opts[0]).focus({ preventScroll: true }));
  };
  opts.forEach(o => o.addEventListener('click', () => {
    const type = o.dataset.type;
    opts.forEach(x => x.classList.toggle('is-on', x === o));
    form.type.value = type; $('.picked b', form).textContent = tab1.textContent = type;
    tab2.disabled = false;
    card.dispatchEvent(new Event('contact:pick'));
    if (!reduced) gsap.fromTo(o, { scale: 0.96 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1,0.45)', clearProps: 'scale' });
    gsap.delayedCall(reduced ? 0 : 0.18, go, [2]);
  }));
  tab1.addEventListener('click', () => go(1));
  tab2.addEventListener('click', () => go(2));
  $('.picked__x', form).addEventListener('click', () => go(1));

  const rules = {
    name: v => v.trim().length > 1 || 'Too short',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Check the email',
    message: v => v.trim().length >= 10 || 'A bit more, please'
  };
  const fields = $$('[name=name],[name=email],[name=message]', form);
  const check = input => {
    const res = rules[input.name](input.value), f = input.closest('.field');
    f.classList.toggle('is-bad', res !== true); $('small', f).textContent = res === true ? '' : res;
    input.setAttribute('aria-invalid', res !== true);
    return res === true;
  };
  fields.forEach(i => {
    i.addEventListener('blur', () => i.value && check(i));
    i.addEventListener('input', () => i.closest('.is-bad') && check(i));
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!fields.map(check).every(Boolean)) {
      fields.find(i => i.getAttribute('aria-invalid') === 'true').focus();
      gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1,0.3)', clearProps: 'transform' });
      return;
    }
    btn.disabled = true; txt.textContent = 'Sending…';
    // shortcut: no backend — simulates delivery. Point this at Formspree/Resend/your API before launch.
    setTimeout(() => {
      const first = form.name.value.trim().split(' ')[0], keep = form.type.value;
      ok.textContent = `Thanks, ${first}. I'll reply to ${form.email.value.trim()} within 24 hours.`;
      gsap.from(ok, { y: 8, opacity: 0, duration: 0.8, ease: 'expo.out' });
      txt.textContent = 'Brief sent ✓';
      form.reset(); form.type.value = keep;
      setTimeout(() => { btn.disabled = false; txt.textContent = 'Send the brief'; }, 2500);
    }, 1100);
  });
}


/* ---------------- contact: relit tubes ----------------
   Blender (blender/tubes_scene.py) renders the sculpture under a 3×3 grid of key lights.
   The cursor picks a point on that grid and the four nearest stills are blended bilinearly:
   layer i gets opacity w_i / (w_0 + … + w_i), which stacks to an exact weighted mix, so
   highlights and shadows slide with the mouse and no WebGL is needed.
   Touch, or a still mouse: the light drifts by itself. Reduced motion: the centre still (CSS). */
{
  const card = $('.ccard'), lit = $('.lit', card), imgs = $$('img', lit), frag = $('.cfrag');
  if (!reduced) {
    const L = { x: 1, y: 1 }, T = { x: 1, y: 1 }, w = new Float32Array(9), clamp = gsap.utils.clamp(0, 2);
    let on = false, moved = -1e9;
    const draw = () => {
      const x = clamp(L.x), y = clamp(L.y), c = Math.min(1, x | 0), r = Math.min(1, y | 0), fx = x - c, fy = y - r;
      w.fill(0);
      w[r * 3 + c] = (1 - fx) * (1 - fy); w[r * 3 + c + 1] = fx * (1 - fy);
      w[r * 3 + c + 3] = (1 - fx) * fy; w[r * 3 + c + 4] = fx * fy;
      let acc = 0;
      imgs.forEach((im, i) => { acc += w[i]; im.style.opacity = w[i] ? (w[i] / acc).toFixed(3) : 0; });
      lit.style.transform = `translate3d(${(1 - x) * 8}px,${(1 - y) * 6}px,0)`;
      if (frag) frag.style.transform = `translate3d(${(x - 1) * 14}px,${(y - 1) * 8}px,0)`;
    };
    addEventListener('pointermove', e => {
      if (!on || e.pointerType === 'touch') return;
      const b = card.getBoundingClientRect();
      T.x = ((e.clientX - b.left) / b.width) * 2; T.y = ((e.clientY - b.top) / b.height) * 2;
      moved = performance.now();
    }, { passive: true });
    gsap.ticker.add(t => {
      if (!on) return;
      if (performance.now() - moved > 2600) { T.x = 1 + Math.sin(t * 0.35) * 0.85; T.y = 1 + Math.cos(t * 0.27) * 0.65; }
      L.x += (T.x - L.x) * 0.06; L.y += (T.y - L.y) * 0.06;
      draw();
    });
    new IntersectionObserver(([e]) => (on = e.isIntersecting), { rootMargin: '100px' }).observe(card);
    card.addEventListener('contact:pick', () => gsap.fromTo(lit, { filter: 'brightness(1.4) saturate(1.2)' }, { filter: 'brightness(1) saturate(1)', duration: 1.2, ease: 'power2.out', clearProps: 'filter' }));
  }
}

