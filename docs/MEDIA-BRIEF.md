# Media brief

Every picture and film on the site is currently a drawn placeholder. This brief lists each slot, the file to add, and the prompt for it. Add the file at the path shown and the placeholder is replaced automatically. A missing or broken file falls back to the placeholder.

Style for everything: Vogue Italia editorial, 35mm anamorphic film grain, chiaroscuro warm golden light, obsidian black, alabaster ivory, burnished antique gold, deep garnet. No logos or text other than the MANTHAI wordmark.

## Hero film

- Files: `assets/media/hero/manthai-hero.webm`, `manthai-hero.mp4`, `hero-poster.webp`. Run `scripts/encode-media.sh master.mov` on a 12 second master to produce all three.
- Four shots of three seconds: origin and texture, craft and silhouette, hardware and scent, eternal reveal.
- Prompt: Ultra-luxury Parisian-Ceylonese haute couture campaign film, dramatic chiaroscuro warm golden sunset beam inside a minimalist dark architectural travertine pavilion, 35mm anamorphic film grain, slow camera drift, fluid fabric motion.

## Product photography

Three 4:5 portrait stills per product: **form** (the product), **move** (on a model in motion), **detail** (macro). Set the paths in `media` on each product in `assets/js/catalog.js`. Suggested folder: `assets/media/products/<id>/`.

### Alstroemeria Velvet Couture Gown (`alstroemeria-gown`)

- Files: `assets/media/products/alstroemeria-gown/form.webp`, `move.webp`, `detail.webp`
- Prompt: Hand-painted floral silk-velvet sculpted evening gown, fluid fabric motion, 35mm anamorphic film grain, chiaroscuro golden light

### Mahatittha Garnet Lace Midi (`mahatittha-lace-midi`)

- Files: `assets/media/products/mahatittha-lace-midi/form.webp`, `move.webp`, `detail.webp`
- Prompt: Deep garnet velvet draped lace midi dress with an architectural twisted waist, warm chiaroscuro

### Sovereign Obsidian Blazer (`sovereign-obsidian-blazer`)

- Files: `assets/media/products/sovereign-obsidian-blazer/form.webp`, `move.webp`, `detail.webp`
- Prompt: Razor-sharp obsidian black bespoke tailored blazer, satin peak lapels, dramatic chiaroscuro

### Ceylon Silk Evening Shirt (`ceylon-silk-evening-shirt`)

- Files: `assets/media/products/ceylon-silk-evening-shirt/form.webp`, `move.webp`, `detail.webp`
- Prompt: Alabaster ivory heavy mulberry silk shirt, concealed placket, soft sheen, window light

### The Kotiya Top-Handle Bag (`kotiya-top-handle`)

- Files: `assets/media/products/kotiya-top-handle/form.webp`, `move.webp`, `detail.webp`
- Prompt: Structured matte obsidian calfskin top-handle handbag with brushed antique gold architectural clasp on dark wet basalt

### Mannar Pearl Minaudière (`mannar-pearl-minaudiere`)

- Files: `assets/media/products/mannar-pearl-minaudiere/form.webp`, `move.webp`, `detail.webp`
- Prompt: Ivory satin evening minaudiere with a brass frame and delicate gold chain, museum product photography

### Mantai 525 AD (`mantai-525`)

- Files: `assets/media/products/mantai-525/form.webp`, `move.webp`, `detail.webp`
- Prompt: Heavy rectangular crystal perfume flacon with matte black magnetic cap on dark wet basalt, golden rim lighting

### Ira-Handa Nocturne (`ira-handa-nocturne`)

- Files: `assets/media/products/ira-handa-nocturne/form.webp`, `move.webp`, `detail.webp`
- Prompt: Heavy crystal flacon holding golden saffron liquid, golden perfume mist suspended in dark air, emerald silk fold in shadow

## Campaign stills

Set `src` on each item of `M.LOOKBOOK` in `assets/js/catalog.js`. Suggested folder: `assets/media/lookbook/`.

### The Great Emporium (`emporium`)

- File: `assets/media/lookbook/emporium.webp`
- Prompt: Ultra-luxury Parisian-Ceylonese haute couture campaign film still, dramatic chiaroscuro warm golden sunset beam inside a minimalist dark architectural travertine pavilion, poised South Asian and international high-fashion models wearing a hand-painted floral silk-velvet sculpted evening gown and a razor-sharp obsidian black bespoke tailored blazer, fluid fabric motion, 35mm anamorphic film grain, Vogue Italia editorial aesthetic, obsidian black, alabaster ivory, burnished antique gold, deep garnet

### Leather and Scent (`hardware`)

- File: `assets/media/lookbook/hardware.webp`
- Prompt: Museum-grade luxury product photography, structured matte obsidian calfskin top-handle handbag with brushed antique gold architectural clasp beside a heavy rectangular crystal perfume flacon with matte black magnetic cap resting on dark wet basalt stone with subtle golden rim lighting, deep emerald silk fabric fold in shadow, razor-sharp macro focus

### The Atelier (`atelier`)

- File: `assets/media/lookbook/atelier.webp`
- Prompt: Intimate editorial close-up of a master couturier’s hands delicately painting metallic gold and soft Alstroemeria petals onto ivory silk velvet with a fine sable brush on a sunlit wooden atelier table, antique brass scissors and tiny glass beads beside the fabric, warm chiaroscuro shadows

### The Label (`label`)

- File: `assets/media/lookbook/label.webp`
- Prompt: Extreme macro light sweep across a black woven damask label revealing the gold MANTHAI wordmark, deep obsidian silk folds

