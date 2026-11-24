# MANTHAI Flagship Storefront: Pass 1 Design Plan

Design read: ultra-luxury maison e-commerce for design-literate, high-value clients (Sri Lanka and international), in a museum-grade editorial language, built as dependency-free static HTML, CSS and JavaScript.

Dials: variance 7, motion 5, density 2. The brief's own tokens and rules always win over any generic design heuristic.

## 1. Design token manifest

### Colour (WCAG verified pairs from the directive)

| Token | Hex | Role |
|---|---|---|
| `--obsidian-void` | `#0B0B0C` | Primary dark editorial canvas |
| `--anuradhapura-charcoal` | `#151517` | Drawers, elevated dark surfaces |
| `--alabaster-silk` | `#F6F3EC` | Light gallery canvas (never `#FFFFFF`) |
| `--mannar-pearl` | `#EAE4D7` | Product frames, soft warm surface |
| `--sovereign-gold` | `#C5A059` | Hairlines, dark-mode icons, accents (8.01:1 on Obsidian) |
| `--solar-ochre` | `#7E5F20` | Gold text on light surfaces only (5.35:1) |
| `--ceylon-emerald` | `#0E3B2E` | Heritage couture and fragrance accent |
| `--garnet-velvet` | `#4A121C` | Evening couture accent |
| `--muted-stone` | `#A39E93` | Secondary text on dark (7.37:1) |
| `--graphite-ink` | `#4A4843` | Secondary text on light (8.24:1) |

Rule: one accent family. Gold is the only accent. Emerald and garnet appear as material colour inside imagery and product plates, never as UI chrome.

### Typography

| Role | Family | Use |
|---|---|---|
| Display and editorial | Cormorant Garamond 300/400/500 + 400 italic | Hero poetry, product names, narrative |
| Luxury UI | Tenor Sans 400 | Navigation, buttons, prices, sizes, specs |
| Ceremonial | Cinzel 400 | Edition numbers and chapter seals only |

Scale (fluid, `clamp()`): hero `3rem to 7.25rem`, section title `2.25rem to 4.5rem`, product name `1.5rem to 1.9rem`, body `1.0625rem to 1.1875rem` serif at line-height 1.65, UI `0.72rem to 0.8rem` with 0.16em tracking. Body measure is capped near 62 characters.

Emphasis rule: italics inside the same family, never mixed families.

### Space, shape, motion

* Spacing scale: 4, 8, 12, 16, 24, 32, 48, 72, 120, 168 px, section rhythm 120 to 168 px at desktop.
* Shape lock: everything is sharp (radius 0) with 1px gold hairlines. No pills, no soft cards.
* Easing: `cubic-bezier(0.22, 1, 0.36, 1)` everywhere. Durations 240, 480, 900 ms.
* Motion budget: one orchestrated page-load sequence (header, hero poetry, CTAs, in order), one quiet scroll reveal for the gallery, and motion that answers a click (drawers, cross-fades, shimmer, loupe). Everything collapses under `prefers-reduced-motion`.
* Z-index scale: header 40, atelier panel 45, layers (native dialogs, top layer), toast 60.

## 2. Spatial blueprint

```
HERO (100svh, obsidian, film slot + vignette scrim)
  header: wordmark | 6 sovereign links | search  region  salon  bag(n)
  centre: slogan (one small line) / headline / two sharp CTAs
  bottom-right: pause-play + ambient sound     bottom-centre: hairline cue (no label)

THE COLLECTION (alabaster, filter tabs on one hairline)
  row A  [ 4:5 ][ 4:5 ][ 4:5 ]     3 columns
  row B  [   4:5   ][   4:5   ]    2 columns, second frame dropped 72px
  row C  [ 4:5 ][ 4:5 ][ 4:5 ]     3 columns, middle frame dropped
  hover: frame cross-fades to model movement or macro textile; Quick View bar rises

THE CAMPAIGN (charcoal, horizontal scroll-snap rail of four stills, keyboard scrollable)

THE MAISON (obsidian, crest left at 5/12, verbatim copy right at 6/12, cipher reveal)

THE UNBOXING RITUAL (obsidian void, exploded rigid box illustration + five part selector)

FOOTER (obsidian: crest, slogan, columns, DHL DDP note, discreet payment marks)

LAYERS: atelier panel, search, region, salon, bag and checkout, product drawer
        (loupe, size, bespoke, NFC passport), measurements, stylist, film
```

Left-aligned editorial text, centred only in the hero and ceremonial moments. Section families used: full-bleed film, 3-2-3 asymmetric gallery, horizontal rail, split narrative, exploded interactive diagram, footer. No family repeats.

## 3. Media architecture

Every media slot carries `data-media-slot`, a `data-prompt` (the director's prompt from the production script), and a drop-in path in `assets/js/catalog.js` (`media` fields) or the `<video>` element's `<source>` tags. Atmospheric CSS and SVG placeholders render until real footage or photography is supplied; supplying a file replaces the placeholder automatically.

Hero film: 12 second seamless loop in four shots (origin and texture, craft and silhouette, brushwork and beadwork shimmer, the woven label reveal). The placeholder reel runs the same four-beat pacing in CSS so the real film can swap in without changing the timing of surrounding UI.

## 4. Anti-template self-review

| Check | Result |
|---|---|
| Inter, Roboto, Space Grotesk anywhere | None. Cormorant Garamond, Tenor Sans, Cinzel only |
| Purple or neon gradients | None. Palette is obsidian, alabaster, gold, with emerald and garnet as material |
| Identical rounded SaaS cards | None. Radius 0, three different grid rhythms, offset frames |
| Tracked all-caps eyebrow above every heading | Rationed to the hero slogan and one or two functional labels. Section titles stand alone |
| Black Friday, sale tags, crossed-out prices | None |
| Fake countdown timers | None. Scarcity is a stock fact tied to the bag |
| BNPL or instalment badges | None |
| Numbered 01/02/03 markers | Used only where the content is a real sequence (the unboxing parts) |
| Em-dash and middle-dot clutter | Not used as design devices. Verbatim brand copy is untouched |
| Scroll cue with a label | Hairline only, no text |
| Cream plus terracotta default | Rejected. Warm alabaster is mandated by the brief, and the accent is burnished gold with emerald and garnet as material colour, not terracotta |
| One memorable thing | The Ira-Handa cipher: a wordmark whose crossbars hide the Sun and Moon, revealed in gold on request |

Conflicts resolved in favour of the directive: dual canvases (obsidian and alabaster), serif display type, the two-button hero, the 6-link navigation panel, and the pause and sound controls.
