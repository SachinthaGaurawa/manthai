#!/usr/bin/env python3
"""House of MANTHAI | packs the rendered social cards and icons (development only).

Run after scripts/build-social.cjs, from the repository root:
  python3 scripts/pack-social.py
Flattens every card to 8-bit sRGB, lays a seeded monochrome micro-grain (one
level, about 2%) over the lacquer and ivory fields, which also breaks 8-bit
banding, then quantises to a 256-colour palette, thinning the grain until the card
sits under budget (home 220 KB, every other card 250 KB). Then the icon suite:
favicon.ico (16/32/48), icon.png (512), apple-touch-icon.png (180) and the
assets/brand copies the manifest and JSON-LD point to. Requires Pillow.
"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OG = os.path.join(ROOT, 'assets', 'og')
IC = os.path.join(ROOT, 'scripts', '.icons')

def pack(path, budget, grain_from_x=0):
    src = np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
    h, w = src.shape[:2]
    for density in (0.22, 0.18, 0.14, 0.10, 0.06, 0.0):
        rng = np.random.default_rng(1188)
        noise = rng.integers(-1, 2, size=(h, w)) * (rng.random((h, w)) < density)
        noise[:, :grain_from_x] = 0
        img = Image.fromarray(np.clip(src + noise[..., None], 0, 255).astype(np.uint8))
        img.quantize(colors=256, method=Image.Quantize.MEDIANCUT).save(path, optimize=True)
        size = os.path.getsize(path)
        if size <= budget:
            break
    print('%-40s %4d KB  (grain density %.2f)' % (os.path.relpath(path, ROOT), size // 1024, density))
    if size > budget:
        raise SystemExit('over budget: ' + path)

for name in sorted(os.listdir(OG)):
    if name.endswith('.png'):
        pack(os.path.join(OG, name), 220 * 1024 if name == 'og-manthai-flagship.png' else 250 * 1024,
             541 if name.startswith('og-piece-') else 0)

def icon(size):
    return Image.open(os.path.join(IC, 'icon-%d.png' % size)).convert('RGB')

icon(512).save(os.path.join(ROOT, 'icon.png'), optimize=True)
icon(180).save(os.path.join(ROOT, 'apple-touch-icon.png'), optimize=True)
icon(512).save(os.path.join(ROOT, 'assets', 'brand', 'icon-512.png'), optimize=True)
icon(192).save(os.path.join(ROOT, 'assets', 'brand', 'icon-192.png'), optimize=True)
icon(32).save(os.path.join(ROOT, 'assets', 'brand', 'favicon-32.png'), optimize=True)
icon(48).save(os.path.join(ROOT, 'favicon.ico'), format='ICO', sizes=[(16, 16), (32, 32), (48, 48)],
              append_images=[icon(16), icon(32)])
print('icons written: favicon.ico, icon.png, apple-touch-icon.png, assets/brand/{icon-512,icon-192,favicon-32}.png')
