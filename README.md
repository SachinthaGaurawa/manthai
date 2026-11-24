# House of MANTHAI

The flagship storefront for the House of MANTHAI: static HTML, CSS and vanilla JavaScript. No build step, no framework, no dependencies.

Live site: https://manthai.vercel.app

## How it deploys

- **Vercel** is connected to this repository. A push to `main` publishes to production at `manthai.vercel.app`. Every other branch and pull request gets its own preview URL. `vercel.json` declares the project as a plain static site.
- **GitHub Pages** (`sachinthagaurawa.github.io/manthai/`) always forwards to `https://manthai.vercel.app`. The redirect lives in the `<head>` script of `index.html` and in `404.html`, so it works for the home page and for any deep link. `.nojekyll` keeps Pages from processing the files.

## Structure

```
index.html            page shell, SVG brand sprite, dialog layers
vercel.json           static deploy config, cache and security headers
404.html              forwards stray URLs to the Vercel domain
docs/                 Pass 1 design plan (tokens, spatial blueprint, self-review)
assets/css/tokens.css exact design tokens from the brand directive
assets/css/site.css   layout, components, motion, responsive rules
assets/js/catalog.js  products, prices (LKR), navigation, lookbook, ritual, policy text, config
assets/js/art.js      atmospheric SVG placeholders for photography and film
assets/js/core.js     state, currency, dialogs, toast, helpers
assets/js/shop.js     collection, product drawer, loupe, bespoke, bag, checkout
assets/js/maison.js   navigation, search, hero film, Salon, Stylist, Passport
assets/brand/         official wordmark, crest, favicon
assets/media/         drop-in folders for real photography and film
```

## Replacing placeholders with real media

Every placeholder is an SVG that real media replaces automatically. Nothing else needs to change.

| Slot | File or field | Spec |
| --- | --- | --- |
| Hero film | `assets/media/hero/manthai-hero.webm` and `manthai-hero.mp4` | 12 s seamless loop, silent track, WebM under 3.5 MB, MP4 under 4.5 MB |
| Hero poster | `assets/media/hero/hero-poster.webp` | First frame, 1600 x 900, under 120 KB |
| Product photography | `media.form`, `media.move`, `media.detail` on each product in `catalog.js` | 4:5 portrait stills. Form is the product, move is the model, detail is the macro |
| Campaign stills | `src` on each `M.LOOKBOOK` item in `catalog.js` | 4:5 or 3:4 |
| Atelier film modal | `M.CONFIG.film` in `catalog.js` | `webm`, `mp4`, `poster` paths |
| Ambient sound | `M.CONFIG.ambientSrc` in `catalog.js` | Optional loop. Empty uses a very quiet synthesised drone |

The hero film currently in the repo is a temporary prototype clip supplied by the owner (736 x 414 source, upscaled to 1280 wide). Replace it with licensed, higher resolution footage before launch.

The full list of slots with a prompt for each is in `docs/MEDIA-BRIEF.md`. `scripts/encode-media.sh master.mov` makes the hero WebM, MP4 and poster. A missing or broken photo falls back to the placeholder.

Each slot carries a `data-media-slot` attribute and the director's prompt in `data-prompt` (or in the `prompt` field of the catalog) so the shoot brief travels with the page.

## Configuration to finish before launch

All in `assets/js/catalog.js` under `M.CONFIG`:

- `whatsapp`: the Maison concierge number, international format, digits only. Set to +94 77 878 7998.
- `googleClientId`: a Google Identity Services client ID turns the Private Salon sign-in from a demo chooser into real Google sign-in.
- Currency rates in `M.CURRENCIES` are indicative. `FX.refresh()` in `core.js` is the place to connect a live rate feed.

## What is demonstration only

This build has no server. Checkout creates an order reference in the browser and takes no payment. PayHere, LankaQR, bank transfer and card are presented as the intended methods. Salon sign-in, stylist requests and NFC passports run locally and send no email. Privacy and terms texts are marked as drafts. Wire these to real services before taking orders.

## Accessibility and motion

- Visible `:focus-visible` gold rings, skip link, native `<dialog>` layers with focus return, labelled controls and live regions.
- `prefers-reduced-motion`: the hero film shows a still, reveals and sweeps are removed.
- Hero film pauses when less than half of it is visible and has a pause button and an ambient sound toggle.
- Layout is tested from 320 px phones to 2560 px displays, portrait and landscape.
