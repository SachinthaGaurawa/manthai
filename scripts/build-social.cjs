/* ==========================================================================
   House of MANTHAI | social preview + icon generator (development only)
   Renders the Open Graph cards and the icon suite from the exact brand vectors
   in index.html (Unbounded Spiral Seal + MANTHAI wordmark) and the catalog.

   Usage (from the repository root, with the site served at SITE):
     SITE=http://127.0.0.1:8124 node scripts/build-social.cjs
     python3 scripts/pack-social.py      # flattens + quantises PNGs under budget
   Requires Playwright with Chromium. Nothing here ships to the browser.
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SITE = process.env.SITE || 'http://127.0.0.1:8124';
const OUT = path.join(ROOT, 'assets/og');
fs.mkdirSync(OUT, { recursive: true });

/* ---------- catalog, read from the single source of truth ---------- */
const win = {};
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/js/catalog.js'), 'utf8'), { window: win, document: undefined, console });
const M = win.MANTHAI;
const lkr = (n) => 'LKR ' + Math.round(n).toLocaleString('en-US');
const editionTag = (p) => (p.edition ? 'Numbered Edition of ' + p.edition : 'Small-Batch Release · ' + p.crafted + ' Pieces');

/* ---------- brand vectors, lifted from the inline sprite ---------- */
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sealBody = /<symbol id="spiral-seal" viewBox="0 0 1000 860">([\s\S]*?)<\/symbol>/.exec(html)[1];
const wmStart = html.indexOf('<g id="wm-paths"');
let depth = 0, i = wmStart, wmEnd = -1;
while (i < html.length) {
  if (html.startsWith('<g', i) && /[\s>]/.test(html[i + 2])) depth++;
  else if (html.startsWith('</g>', i)) { depth--; if (depth === 0) { wmEnd = i + 4; break; } }
  i++;
}
const wmGroup = html.slice(wmStart, wmEnd).replace('id="wm-paths"', '');

const GOLD = '<linearGradient id="foil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E5D0A6"/><stop offset=".46" stop-color="#C9AF7E"/><stop offset="1" stop-color="#9F824C"/></linearGradient>';
/* the Seal, filled with brushed champagne-gold foil (flat, no bevel) or a single colour */
function seal(w, fill, dx) {
  const h = Math.round(w * 0.86 * 100) / 100;
  const body = sealBody.replace(/fill="currentColor"/g, '');
  return `<svg width="${w}" height="${h}" viewBox="0 0 1000 860" style="display:block;transform:translateX(${dx || 0}px)" aria-hidden="true"><defs>${GOLD}</defs><g fill="${fill}">${body}</g></svg>`;
}
function wordmark(w, color) {
  const h = Math.round(w * 120 / 796 * 100) / 100;
  return `<svg width="${w}" height="${h}" viewBox="120 30 796 120" style="display:block;color:${color}" aria-hidden="true">${wmGroup}</svg>`;
}
/* micro-grain is added by pack-social.py (seeded, budget-aware), not here */
const BASE = `<link rel="stylesheet" href="/assets/css/fonts.css"><style>
  *{margin:0;padding:0;box-sizing:border-box} html,body{width:1200px;height:630px;overflow:hidden;background:#090808}
  .serif{font-family:'Cormorant Garamond',serif} .sans{font-family:'Tenor Sans',sans-serif}
</style>`;

/* ---------- 1. homepage: the Obsidian Monolith ---------- */
function monolith() {
  /* lockup: Seal 136 x 117, 46px breath, wordmark 405 wide (61 tall) = 224 tall, centred on y = 300 */
  const top = 300 - 224 / 2;
  return `${BASE}<body><div style="position:relative;width:1200px;height:630px;background:#090808">
    <div style="position:absolute;inset:0;background:radial-gradient(62% 58% at 50% 41%,#1A1816 0%,#0E0D0C 48%,#070606 100%)"></div>
    <div style="position:absolute;left:0;right:0;top:${top}px;display:flex;flex-direction:column;align-items:center">
      ${seal(136, 'url(#foil)', 6)}
      <div style="height:46px"></div>
      ${wordmark(405, '#F4F0E6')}
    </div>
    <div style="position:absolute;inset:.5px;border:1px solid rgba(201,175,126,.14)"></div>
  </div></body>`;
}

/* ---------- 2. a piece: 50/50 architectural split ---------- */
function piece(p) {
  return `${BASE}<body><div style="position:relative;display:flex;width:1200px;height:630px;background:#0E0D0C">
    <div style="position:relative;width:540px;height:630px;overflow:hidden;background:#171514">
      <img src="${p.media.form}" style="width:100%;height:100%;object-fit:cover;object-position:top center;display:block">
    </div>
    <div style="width:1px;height:630px;background:rgba(201,175,126,.22)"></div>
    <div style="position:relative;flex:1;height:630px;overflow:hidden">
      <div style="position:absolute;inset:0;background:radial-gradient(80% 70% at 50% 18%,#1A1816 0%,#0E0D0C 55%,#0A0908 100%)"></div>
      <div style="position:absolute;inset:64px;display:flex;flex-direction:column;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:18px">${seal(42, 'url(#foil)', 0)}${wordmark(132, '#F4F0E6')}</div>
        <h1 class="serif" style="font-weight:400;font-size:40px;line-height:1.15;color:#F4F0E6;max-width:520px;text-wrap:balance">${p.name.replace(/(\S+-\S+)/g, '<span style="white-space:nowrap">$1</span>')}</h1>
        <div>
          <p class="sans" style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#C9AF7E">${editionTag(p)}</p>
          <p class="sans" style="margin-top:14px;font-size:19px;letter-spacing:.06em;color:#F4F0E6">${lkr(p.price)}</p>
        </div>
      </div>
    </div>
    <div style="position:absolute;inset:.5px;border:1px solid rgba(201,175,126,.14);pointer-events:none"></div>
  </div></body>`;
}

/* ---------- 3. the Digital Product Passport (no client name, ever) ---------- */
function passport() {
  return `${BASE}<body><div style="position:relative;width:1200px;height:630px;background:#F7F4EE">
    <div style="position:absolute;inset:0;background:radial-gradient(70% 65% at 50% 42%,#FBF9F4 0%,#F7F4EE 55%,#EFEAE0 100%)"></div>
    <div style="position:absolute;left:0;right:0;top:${300 - 330 / 2}px;display:flex;flex-direction:column;align-items:center;text-align:center">
      ${seal(96, '#755A2A', 4)}
      <div style="height:26px"></div>
      ${wordmark(250, '#141210')}
      <h1 class="serif" style="margin-top:26px;font-weight:400;font-size:34px;line-height:1.1;color:#141210">Digital Product Passport</h1>
      <p class="sans" style="margin-top:14px;font-size:13px;letter-spacing:.22em;text-transform:uppercase;color:#59534B">Live Provenance Registry</p>
      <p class="sans" style="margin-top:22px;display:inline-flex;align-items:center;gap:9px;padding:9px 16px;border:1px solid #755A2A;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#755A2A">
        <svg width="13" height="13" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>Verified Authentic</p>
    </div>
    <div style="position:absolute;inset:.5px;border:1px solid rgba(117,90,42,.18)"></div>
  </div></body>`;
}

/* ---------- 4. icon: gold-foil Seal on obsidian, 22% breathing room, +2% optical counterweight ---------- */
/* the Seal's glyph fills about 86% of its own box; ICON_FILL is the share of the
   icon the glyph should span: generous on tab favicons (16 to 48 px) so it reads beside other sites, calmer on
   home-screen icons, which iOS and Android mask into rounded shapes */
const ICON_FILL = { 16: 0.84, 32: 0.83, 48: 0.82, 180: 0.66, 192: 0.64, 512: 0.64 };
function icon(size) {
  const w = Math.round(size * ICON_FILL[size] / 0.864 * 10) / 10;
  return `<style>*{margin:0;padding:0}html,body{width:${size}px;height:${size}px;overflow:hidden;background:#0E0D0C}</style>
    <body><div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:#0E0D0C">${seal(w, 'url(#foil)')}</div></body>`;
}

(async () => {
  const b = await chromium.launch();
  async function shot(markup, file, w, h) {
    const pg = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await pg.goto(SITE + '/robots.txt');
    await pg.setContent(markup, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(150);
    await pg.screenshot({ path: file, clip: { x: 0, y: 0, width: w, height: h } });
    await pg.close();
    console.log('rendered', path.relative(ROOT, file));
  }
  if (!process.env.ICONS_ONLY) {
    await shot(monolith(), path.join(OUT, 'og-manthai-flagship.png'), 1200, 630);
    await shot(passport(), path.join(OUT, 'og-passport.png'), 1200, 630);
    for (const p of M.PRODUCTS) await shot(piece(p), path.join(OUT, 'og-piece-' + p.id + '.png'), 1200, 630);
  }
  const ic = path.join(ROOT, 'scripts/.icons'); fs.mkdirSync(ic, { recursive: true });
  for (const s of [512, 192, 180, 48, 32, 16]) await shot(icon(s), path.join(ic, 'icon-' + s + '.png'), s, s);
  await b.close();

  /* metadata the edge reads for each piece (WhatsApp and iMessage never run JavaScript) */
  const meta = { pieces: {} };
  M.PRODUCTS.forEach((p) => {
    meta.pieces[p.id] = { name: p.name, edition: editionTag(p), price: lkr(p.price), note: p.summary.replace(/\.$/, '') };
  });
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 1) + '\n');
  console.log('wrote assets/og/meta.json');
})();
