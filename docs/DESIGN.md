# Design System: House of MANTHAI

This file is the source of truth for generating new MANTHAI screens, whether you use Google Stitch or build by hand. The values match the live code in `assets/css/tokens.css` and `assets/css/flagship.css`.

Where this system departs from generic "premium UI" advice, the house brand wins:
- the serif display face is used deliberately, for editorial work;
- the hero is centred like a fashion-house cover;
- a restrained cursor is used on desktop only.

## 1. Visual Theme & Atmosphere

MANTHAI is a quiet couture house rendered as an editorial magazine, not a shop. The page alternates between two settings:
- **Obsidian night scenes:** hero, Maison, ritual and footer.
- **Alabaster gallery daylight:** pillars, collection and product drawer.

Gold is never decoration. It shows up only as hairlines, the emblem and the active state.

- **Density 3 (gallery airy).** Sections breathe at clamp(88px, 12vw, 168px). A single line of copy often stands alone.
- **Variance 7 (offset asymmetric).** Content sits on 60/40 editorial splits that alternate sides. Product cards are staggered, and some drop lower than their neighbours.
- **Motion 6 (fluid, choreographed once).**
  - One cinematic moment: the Seal preloader and curtain lift, once per session.
  - Everything after that is slow and soft: silk-curtain image reveals, 0.6s crossfades and Lenis inertial scroll.
  - No motion loops forever, except the hero film.

## 2. Color Palette & Roles

| Name | Hex | Role |
| --- | --- | --- |
| Obsidian | #0B0B0C | Dark canvas: hero, preloader, ritual, footer. Never pure black. |
| Charcoal | #141416 | Elevated dark surfaces: drawers, Maison, panels. |
| Alabaster | #F6F3EC | Light gallery canvas. Never #FFFFFF. |
| Pearl | #EAE4D7 | Quiet secondary light surface: image wells, size guide. |
| Sovereign Gold | #C5A059 | The single accent: 1px hairlines, emblem, active and focus states on dark (8.0:1 on obsidian). |
| Champagne Gold | #C9AF7E | Lit state of the Seal only: decoder highlight, preloader. |
| Solar Ochre | #7A5C20 | Gold for text and links on light backgrounds (5.6:1 on alabaster). |
| Ink | #141415 | Primary text on light. |
| Stone | #68645D | Secondary text on light (5.3:1). |
| Mist | #A39E93 | Secondary text on dark (7.4:1). |
| Gold Hairline | rgba(197,160,89,0.18) to 0.38 | Dividers, borders and the solid header edge. |

Rules:
- Use one accent family (gold) and nothing else: no blue links, no green success states, no purple.
- Errors use a muted brick tone only inside forms.
- Gradients appear only as image scrims and the verification-card sheen, never on text.

## 3. Typography Rules

- **Display:** Cormorant Garamond 300 at clamp(2.5rem, 5.2vw, 5.2rem), line-height 1.04, tracking -0.005em, balanced wrapping. Hierarchy comes from weight 300 against 400 and from colour, never from bold. Italic 300 is used for quiet asides such as panel titles and the preloader line.
- **Body:** Cormorant Garamond 400 at clamp(1.06rem, 1rem + 0.25vw, 1.19rem), relaxed leading, a maximum of 46 to 62ch.
- **UI:** Tenor Sans at 12 to 14px, tracking 0.06 to 0.08em, sentence case everywhere. Examples: "Explore the Collection", "Reserve in Your Bag", "Speak with a Maison Stylist".
- **Wordmark:** the official MANTHAI SVG only. Never retype it, recolour its letterforms or redraw it.
- **Banned:** Inter, system UI fonts, all-caps labels, monospace, Times/Georgia as visible faces.

## 4. Component Stylings

- **Buttons:** square corners and a 1px border.
  - The primary button on dark has a gold border; on hover a gold fill sweeps across left to right (scaleX, 0.6s), and the label turns obsidian.
  - The primary button on light is an obsidian fill with a gold sheen pass.
  - A ghost button is a hairline outline.
  - On press, the button moves down 1px.
  - No glow and no rounded pills.
- **Links:** text with a 1px underline that turns gold or ochre on hover.
- **Navigation:** four items: New Arrivals, Collections, Lookbook, The Maison.
  - A gold underline grows with scaleX on hover.
  - The header is transparent over the hero. After scrolling it becomes rgba(11,11,12,0.92) with a 12px blur and a gold hairline.
- **Product cards:** a 3:4 image well on pearl. A second view crossfades in over 0.6s, and a "Quick view" bar slides up. Below the image sit the edition tag, the name in serif, the LKR price and a size preview (sold-out sizes struck through). There is no card chrome: no shadow and no radius.
- **Forms:** labels above in Tenor Sans, square 1px gold-hairline inputs, a gold focus border, and errors inline below the field. Required fields are marked "*"; optional ones say "(optional)".
- **Choices (shipping, payment, gift):** full-width hairline rows with a square gold check. A selected row has a gold border and a 6% gold wash.
- **Checkout:** a three-step accordion. Each completed step collapses to an editable summary, with a numbered gold circle marking its state.
- **Empty states:** one serif sentence that says how to fill the space, for example "Save a silhouette from any piece and it waits for you here."

## 5. The Emblem: Unbounded Spiral Seal

- **Master file:** `assets/brand/manthai-unbounded-spiral-seal.svg` (viewBox 0 0 1000 860, `fill="currentColor"`, transparent background).
- **Groups:** `#spiral-core`, `#chambers-foundation` (chambers 6 to 4), `#chambers-crescendo` (chambers 3 to 1), `#unbounded-arch`.
- **Colour:** gold on obsidian, or foil and emboss on packaging. Never place it in a white box, never outline it, never rotate it.
- **Neck labels:** carry the wordmark only.
- **Copy:** must never claim the Golden Ratio. Use the logarithmic Spira Mirabilis story.

## 6. Layout Principles

- **Container:** max 1440px, with side gutters of clamp(20px, 4.4vw, 72px).
- **Editorial splits:** 3fr/2fr (60/40), alternating sides from block to block. The PDP uses a 3fr gallery beside a 2fr sticky details column.
- **Collection grid:** a 6-column grid with 2-column cards. Some cards span 3 columns and some drop lower, so no row reads as three equal cards.
- **Hero:** full viewport (`100svh`) with the film behind a scrim. The centred cover-style title is a deliberate brand exception.
- **Below 900px:** everything collapses to one column, the Seal stage moves above its copy, and the PDP gets a sticky bottom bar. Touch targets are at least 44px. No horizontal scroll at 390px.

## 7. Motion & Interaction

- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` for everything. The curtain uses `cubic-bezier(0.76, 0, 0.24, 1)`.
- **Preloader (once per session, skippable, 1.5s total):**
  - The core fades in and scales from 0.82 to 1 over 0 to 0.45s.
  - The six chambers bloom clockwise, 45ms apart, from 0.30s.
  - The arch sweeps in over 0.70 to 1.10s as the hairline completes.
  - The curtain lifts with `clip-path: inset(0 0 100% 0)` while the hero settles from scale 1.06 to 1.
- **Silk-curtain reveals:** images unclip from the top over 1.2s as they enter view.
- **Veil:** a 0.45s obsidian veil covers long jumps instead of a long scroll.
- **Smooth scroll and cursor:** Lenis smooth scroll on desktop. An 8px gold dot cursor expands to a 56px ring labelled "View", "Zoom" or "Explore" (fine pointers only; the native cursor returns inside dialogs).
- **Animated properties:** only `transform`, `opacity` and `clip-path`. `prefers-reduced-motion` turns off the preloader, the reveals and the cursor.

## 8. Anti-Patterns (Never)

- No emojis.
- No Inter.
- No pure black or pure white.
- No neon, glows or drop-shadow stacks.
- No rounded pill buttons or 2rem-radius cards; MANTHAI is square-cut.
- No all-caps UI labels.
- No discount banners, countdown timers, star ratings, "Only 2 left!" pressure or "Coming Soon" shop pages.
- No cash on delivery.
- No AI copy clichés ("Elevate", "Seamless", "Unleash").
- No invented statistics.
- No menswear, leather or parfumerie products in Phase 1. They appear only as one Future Chapters line in the footer.
- No second accent colour.
- No gradient text.
- No layout overlaps, except text set over the hero film's scrim.
