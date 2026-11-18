# Knot spec (reference 1, BlockUnity page)

Image 2 is a topology guide only: one thick tube weaving over and under itself.

## Form
- One closed tube. It is thick, perfectly round and smooth.
- Tube diameter is about 1/4 of a loop's opening, so it reads chunky, never wire-like.
- Loops are big, open and flowing, not a tight ball. The knot is stretched: wider than it is deep.
- Visible features, reading clockwise from the top:
  - a large loop rising on the right (cropped by the top-right),
  - strands crossing near the center,
  - a lobe pointing left (toward the form edge),
  - a lower loop under the center,
  - a big arc sweeping along the bottom right (cropped by the bottom and right edges).
- Counts in the visible area: **4 big lobes, 5 crossings** (over/under, alternating).
- The image is cropped right and bottom, so the hidden part must close into one natural tube. A knot with 5–7 crossings and 4–5 lobes fits.
- A separate short bent tube fragment floats top-left of the knot, out of focus.

## Material (sampled with PIL from tube pixels, luminance percentiles)
| Percentile | Color | Role |
|---|---|---|
| 10% | #233569 | deep indigo shadow |
| 25% | #31437a | steel-indigo |
| 50% | #4c5e94 | steel-blue body |
| 75% | #7781b6 | lavender-blue sheen |
| 90% | #b5b8e3 | silver-lavender highlight |
| 98% | #e9ebfb | sharp highlight lines (pure white is under 1% of pixels) |

- Broad, soft gradient reflections (blue, violet, silver-lavender) plus a few thin sharp lines. No blown-out white areas.
- Principled BSDF: metallic 1, roughness about 0.14, coat 1.

## Lighting
- Deep royal-blue panel on the right, violet panel top-right, thin cool-white strip top-left (rim), dark navy fill below. Nothing on the left.
- Cycles with AgX and denoising.

## Framing (hero)
- The knot is big, cropped by the right and bottom edges, with the left lobe near the middle of the frame and a dark left side.
