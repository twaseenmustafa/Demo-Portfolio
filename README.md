<div align="center">

<a href="https://dempo-blond.vercel.app">
  <img src="docs/hero.jpg" alt="Rahat Hasan — portfolio hero" width="100%">
</a>

# Rahat Hasan — Portfolio

**Beyond templates. Beyond code. Beyond.**
An immersive, scroll-driven portfolio for a senior full-stack developer — a 3D laptop that opens as you scroll, a layered parallax hero, and a screen that plays its own animation.

<a href="https://dempo-blond.vercel.app"><img src="https://img.shields.io/badge/LIVE%20DEMO-open%20the%20site-5b3cff?style=for-the-badge&logo=vercel&logoColor=white" alt="Live demo"></a>

![Three.js](https://img.shields.io/badge/Three.js-WebGL-0b0634?style=flat-square&logo=threedotjs&logoColor=a99bff)
![GSAP](https://img.shields.io/badge/GSAP-ScrollTrigger-0b0634?style=flat-square&logo=greensock&logoColor=a99bff)
![Lenis](https://img.shields.io/badge/Lenis-smooth%20scroll-0b0634?style=flat-square)
![No build step](https://img.shields.io/badge/build-none-0b0634?style=flat-square)
![Deployed on Vercel](https://img.shields.io/badge/deployed-Vercel-0b0634?style=flat-square&logo=vercel&logoColor=a99bff)

</div>

---

## What you'll see

| | |
|---|---|
| **Cinematic intro** | A loader, then the glow blooms, the arc rises, and the portrait steps out of the dark. |
| **Layered parallax hero** | A cut-out portrait sits in front of a glow and arc. Each layer moves at its own depth with the mouse and scroll. |
| **3D laptop reel** | A Three.js laptop on a slab opens, floats, spins and closes as you scroll. Real keyboard presses are echoed by the 3D keys. |
| **Live screen** | The laptop screen boots, then loops kinetic text. It runs on its own clock, not on scroll. |
| **Selected work** | Hover list of projects with cursor-following previews: Brudcode, TruckPai, open source. |
| **Inspect lens** | A cursor-driven lens reveals the performance checks behind the build. |
| **Contact** | Validated form, social links, and click-to-copy email. |

## Tech

- **Rendering:** Three.js (WebGL2), custom materials, soft shadows, procedural geometry — no model files
- **Motion:** GSAP + ScrollTrigger, Lenis smooth scroll, `quickTo` pointer parallax
- **Craft:** pre-baked duotone images, `@property` animated gradients, film grain, magnetic buttons, custom cursor
- **Accessibility:** semantic landmarks, focus states, `prefers-reduced-motion` support, no-WebGL fallback
- **Zero build:** plain HTML, CSS and ES modules. Open `index.html` through any static server.

## Run it locally

```bash
git clone https://github.com/twaseenmustafa/Demo-Portfolio.git
cd Demo-Portfolio
python -m http.server 5173
```

Then open <http://localhost:5173>. A static server is needed because the page loads ES modules.

## Project structure

```
index.html     page structure and content
style.css      design system (indigo / white / black)
main.js        loader, parallax, scroll choreography, Three.js laptop scene
assets/        cut-out portrait and pre-graded lens images
docs/          README visuals
```

## Make it yours

1. Replace `assets/rahat-portrait.webp` with your own cut-out headshot.
2. Update the email, LinkedIn and Google Play placeholders in `index.html`.
3. Connect the contact form (search for `shortcut:` in `main.js`) to Formspree, Resend or your own API.

---

<div align="center">

**[Open the live site →](https://dempo-blond.vercel.app)**

Photography via Unsplash. © 2026 Rahat Hasan.

</div>
