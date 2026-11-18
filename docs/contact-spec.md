# Contact section: spec from the reference

The reference image (516×362) is the source of truth. Colors were sampled with PIL (box averages). Text colors read darker than they really are because the glyphs are thin and anti-aliased, so text uses the nearest legible tint; this is noted below.

## Layout
- Full-bleed split, min-height 100svh. The form column is about 45% (desktop at 1024px or wider); the 3D column fills the rest.
- The form is vertically centered, with content max-width 440px and generous left padding.
- The knot is cropped by the right and bottom edges. Its left lobes pass slightly behind the form edge, so the form panel sits above the canvas with a soft edge.
- A small separate tube fragment floats near the top, about 55% across, and is blurred (out of focus).

## 3D object
- Thick round glossy tubes tangled into one closed knot with 4–6 visible crossings and one big loop on the right. No flat or boxy shapes.
- Tube diameter is about 1/6 of the knot width, with a very slight organic thickness variation.
- Chrome metal with a deep indigo body (#2c436a to #3a3f7a in the shadows), sharp white-blue highlights (#d4ceeb up to #ffffff), and a violet tint on top-facing surfaces (#7364bf).

## Lighting and background
- Panel and page near-black: #121315 (left edge #111215).
- Royal-blue glow from the right and behind the knot: #535891 to #6d69bd, saturating to about #3d4bff at the core.
- Violet glow at the top right: #7364bf. Low blue glow at the bottom: #272b68.
- Cool white rim highlights.
- Film grain on the glow, about 5–6%.
- Grid: 1px lines in 64px squares, rgba(255,255,255,.05) (sampled #141517 on #121315), behind the knot, faded with a radial mask.

## Form
| Element | Value |
|---|---|
| Panel bg | #121315 |
| Input bg | #1e1f21 |
| Input border | #202123, used as rgba(255,255,255,.06) |
| Toggle track | #151618 |
| Toggle active | #303133 |
| Button | #4889f4 (solid, full width) |
| Heading | near-white (#f4f2ff, the site ink) |
| Subtitle and labels | grey (#8a8b90) *(assumption: the sampled #434446 to #4f5052 is anti-aliasing)* |
| Placeholder | #5a5b60 *(assumption, same reason)* |
| Link | #4889f4 |

- Radius: inputs and button 8px, toggle 10px. Input height 44px. Label 12px. Small vertical rhythm, with about 16px between groups.
- Order: brand logo, heading, one-line subtitle, two-option segmented toggle, labeled inputs (the last one has an eye icon), checkbox with link, button, footer line with link.

## Adapted copy
- Brand "Rahat". Heading "Let's build something". Subtitle "Tell me about your project. I reply within 24 hours."
- Toggle: Email | WhatsApp (preferred reply channel). Fields: Name / Email or phone / Project details (a textarea that grows).
- Checkbox "I agree to the Privacy Policy". Button "Send message". Footer "Prefer to talk? Email me".
- **Assumption:** the reference's eye icon belongs to a password field. With Project details in its place, the icon becomes an expand toggle that grows the textarea, so the reference's icon slot is kept and does something useful.
- **Submission:** the site has no endpoint. The existing simulated send (the `shortcut:` comment in main.js) is reused.
