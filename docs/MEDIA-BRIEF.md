# Media brief

Every picture and film on the site is currently a drawn placeholder. This brief lists each slot, the file to add, and the prompt for it. Add the file at the path shown and the placeholder is replaced automatically. A missing or broken file falls back to the placeholder.

Phase 1 is womenswear only. Style for everything: Vogue Italia editorial, 35mm anamorphic film grain, chiaroscuro warm golden light, obsidian black, alabaster ivory, burnished antique gold, deep garnet. No logos or text other than the MANTHAI wordmark. No menswear, handbags or fragrance in any frame.

## Hero film

- Files: `assets/media/hero/manthai-hero.webm`, `manthai-hero.mp4`, `hero-poster.webp`. Run `scripts/encode-media.sh master.mov` on a 12 second master to produce all three.
- Four shots of three seconds: origin and texture, craft and silhouette, brushwork and beadwork shimmer, the woven damask neck label reveal.
- Prompt: Ultra-luxury Parisian-Ceylonese haute couture campaign film, flowing hand-painted silk-velvet evening couture in dramatic chiaroscuro drapery, warm golden beam inside a dark travertine pavilion, macro brushwork and beadwork shimmer, final reveal of a woven damask neck label bearing the gold MANTHAI wordmark, 35mm anamorphic film grain, slow camera drift.

## Product photography

Four 4:5 portrait stills per product: **form** (front view), **back** (back view), **detail** (bodice and textile macro, also read by the 4x loupe), **move** (drape in motion). Set the paths in `media` on each product in `assets/js/catalog.js`. Suggested folder: `assets/media/products/<id>/`.

### Alstroemeria Velvet Couture Gown (`alstroemeria-gown`)

- Files: `assets/media/products/alstroemeria-gown/form.webp`, `assets/media/products/alstroemeria-gown/back.webp`, `assets/media/products/alstroemeria-gown/detail.webp`, `assets/media/products/alstroemeria-gown/move.webp`
- Prompt: Hand-painted Alstroemeria silk-velvet sculpted evening gown, fluid fabric motion, brushwork and beadwork shimmer, 35mm anamorphic film grain, chiaroscuro golden light

### Ceylon Rosette Mullet Gown (`ceylon-rosette-mullet`)

- Files: `assets/media/products/ceylon-rosette-mullet/form.webp`, `assets/media/products/ceylon-rosette-mullet/back.webp`, `assets/media/products/ceylon-rosette-mullet/detail.webp`, `assets/media/products/ceylon-rosette-mullet/move.webp`
- Prompt: Alabaster Silk mullet evening gown with three-dimensional sculpted silk rosettes and a sweeping train, chiaroscuro golden light, 35mm anamorphic film grain

### Serendib Bow Column Gown (`serendib-column`)

- Files: `assets/media/products/serendib-column/form.webp`, `assets/media/products/serendib-column/back.webp`, `assets/media/products/serendib-column/detail.webp`, `assets/media/products/serendib-column/move.webp`
- Prompt: Strapless Mannar Pearl duchesse satin column gown with a sculpted origami back bow, museum-quality fashion photography, warm chiaroscuro

### Mahatittha Garnet Lace Midi (`mahatittha-lace-midi`)

- Files: `assets/media/products/mahatittha-lace-midi/form.webp`, `assets/media/products/mahatittha-lace-midi/back.webp`, `assets/media/products/mahatittha-lace-midi/detail.webp`, `assets/media/products/mahatittha-lace-midi/move.webp`
- Prompt: Deep garnet velvet draped lace midi dress with an architectural twisted waist, warm chiaroscuro

### Anuradhapura Twisted Silk Midi (`anuradhapura-silk-midi`)

- Files: `assets/media/products/anuradhapura-silk-midi/form.webp`, `assets/media/products/anuradhapura-silk-midi/back.webp`, `assets/media/products/anuradhapura-silk-midi/detail.webp`, `assets/media/products/anuradhapura-silk-midi/move.webp`
- Prompt: Liquid obsidian mulberry silk crepe asymmetric twisted midi dress in fluid motion, golden rim light on black

### Sovereign Wave-Ruffle Blazer (`sovereign-wave-blazer`)

- Files: `assets/media/products/sovereign-wave-blazer/form.webp`, `assets/media/products/sovereign-wave-blazer/back.webp`, `assets/media/products/sovereign-wave-blazer/detail.webp`, `assets/media/products/sovereign-wave-blazer/move.webp`
- Prompt: Alabaster Silk tailored blazer with a wave-ruffle peplum hem and satin peak lapels, soft window light, editorial womenswear

### Kotiya Noir Scarf-Neck Mini (`kotiya-noir-mini`)

- Files: `assets/media/products/kotiya-noir-mini/form.webp`, `assets/media/products/kotiya-noir-mini/back.webp`, `assets/media/products/kotiya-noir-mini/detail.webp`, `assets/media/products/kotiya-noir-mini/move.webp`
- Prompt: Obsidian wool-silk crepe tailored mini dress with an emerald silk scarf at the neck, dramatic chiaroscuro

### Mannar Pearl Lace Cape (`mannar-pearl-cape`)

- Files: `assets/media/products/mannar-pearl-cape/form.webp`, `assets/media/products/mannar-pearl-cape/back.webp`, `assets/media/products/mannar-pearl-cape/detail.webp`, `assets/media/products/mannar-pearl-cape/move.webp`
- Prompt: Champagne-ivory sheer lace atelier cape with a scalloped hem and a gold hook closure, soft backlight

## Campaign stills

Set `src` on each item of `M.LOOKBOOK` in `assets/js/catalog.js`. Suggested folder: `assets/media/lookbook/`.

### The Great Emporium (`emporium`)

- File: `assets/media/lookbook/emporium.webp`
- Prompt: Ultra-luxury Parisian-Ceylonese haute couture campaign film still, dramatic chiaroscuro warm golden sunset beam inside a minimalist dark architectural travertine pavilion, two poised South Asian and international high-fashion women wearing a hand-painted floral silk-velvet sculpted evening gown and a black silk column gown, fluid fabric motion, 35mm anamorphic film grain, Vogue Italia editorial aesthetic, obsidian black, alabaster ivory, burnished antique gold, deep garnet

### Sculpted Tailoring (`studio`)

- File: `assets/media/lookbook/studio.webp`
- Prompt: Museum-grade luxury womenswear photography, an Alabaster Silk wave-ruffle peplum blazer with satin peak lapels on a dress form, a champagne-ivory sheer lace cape draped over the arm, dark wet basalt floor, subtle golden rim lighting, razor-sharp macro focus

### The Atelier (`atelier`)

- File: `assets/media/lookbook/atelier.webp`
- Prompt: Intimate editorial close-up of a master couturier’s hands delicately painting metallic gold and soft Alstroemeria petals onto ivory silk velvet with a fine sable brush on a sunlit wooden atelier table, antique brass scissors and tiny glass beads beside the fabric, warm chiaroscuro shadows

### The Label (`label`)

- File: `assets/media/lookbook/label.webp`
- Prompt: Extreme macro light sweep across a black woven damask label revealing the gold MANTHAI wordmark, deep obsidian silk folds
