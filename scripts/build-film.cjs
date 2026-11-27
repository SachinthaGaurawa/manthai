/* ==========================================================================
   House of MANTHAI | Atelier Film generator (development only)
   Cuts a 1920 x 1080 film from the temporary womenswear photographs: title
   card, a prologue plate, four editorial chapters with a slow push, and an end
   card (the hero clip is not used: it shows menswear, and Phase 1 is
   womenswear). Stills are typeset in Chromium with the brand vectors and
   fonts, then ffmpeg adds the camera move and cross-dissolves and encodes
   MP4 (H.264) + WebM (VP9). Silent by design until licensed music exists.

   Usage (from the repository root, with the site served at SITE):
     SITE=http://127.0.0.1:8124 node scripts/build-film.cjs
   Output: assets/media/film/temp/atelier-film.{mp4,webm} + atelier-film-poster.webp
   The film is TEMPORARY like the photographs it uses: replace it with the
   finished film before launch (catalog.js M.CONFIG.film).
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SITE = process.env.SITE || 'http://127.0.0.1:8124';
const WORK = path.join(ROOT, 'scripts/.film');
const OUT = path.join(ROOT, 'assets/media/film/temp');
fs.mkdirSync(WORK, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sealBody = /<symbol id="spiral-seal" viewBox="0 0 1000 860">([\s\S]*?)<\/symbol>/.exec(html)[1].replace(/fill="currentColor"/g, '');
const wmStart = html.indexOf('<g id="wm-paths"');
let depth = 0, i = wmStart, wmEnd = -1;
while (i < html.length) {
  if (html.startsWith('<g', i) && /[\s>]/.test(html[i + 2])) depth++;
  else if (html.startsWith('</g>', i)) { depth--; if (depth === 0) { wmEnd = i + 4; break; } }
  i++;
}
const wmGroup = html.slice(wmStart, wmEnd).replace('id="wm-paths"', '');
const GOLD = '<linearGradient id="foil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E5D0A6"/><stop offset=".46" stop-color="#C9AF7E"/><stop offset="1" stop-color="#9F824C"/></linearGradient>';
const seal = (w) => `<svg width="${w}" height="${w * 0.86}" viewBox="0 0 1000 860" style="display:block;margin:0 auto"><defs>${GOLD}</defs><g fill="url(#foil)">${sealBody}</g></svg>`;
const wordmark = (w) => `<svg width="${w}" height="${w * 120 / 796}" viewBox="120 30 796 120" style="display:block;margin:0 auto;color:#F7F4EE">${wmGroup}</svg>`;

const BASE = `<link rel="stylesheet" href="/assets/css/fonts.css"><style>
  *{margin:0;padding:0;box-sizing:border-box} html,body{width:1920px;height:1080px;overflow:hidden;background:#0E0D0C;color:#F7F4EE}
  .serif{font-family:'Cormorant Garamond',serif} .sans{font-family:'Tenor Sans',sans-serif}
  .center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
  .eyebrow{font:400 20px/1 'Tenor Sans',sans-serif;letter-spacing:.34em;text-transform:uppercase;color:#C9AF7E}
  .tag{font:italic 300 40px/1.35 'Cormorant Garamond',serif;color:#ACA498;letter-spacing:.01em}
  .plates{position:absolute;inset:92px 120px 150px;display:grid;gap:28px}
  .plates img{width:100%;height:100%;object-fit:cover;display:block}
  .cap{position:absolute;left:120px;right:120px;bottom:52px;display:flex;align-items:baseline;gap:28px;border-top:1px solid rgba(201,175,126,.28);padding-top:24px}
  .cap span{font:400 46px/1 'Cormorant Garamond',serif;letter-spacing:.06em;color:#C9AF7E;min-width:64px}
  .cap b{font:300 46px/1 'Cormorant Garamond',serif;font-weight:300;color:#F7F4EE}
  .pro{position:absolute;inset:0;display:grid;grid-template-columns:720px 1fr;gap:110px;align-items:center;padding:0 160px}
  .pro img{width:720px;height:1080px;object-fit:cover;display:block}
  .pro h2{font:300 74px/1.12 'Cormorant Garamond',serif;letter-spacing:.005em}
  .pro h2 em{color:#E6CF9F}
</style>`;

const title = () => `${BASE}<div class="center">${seal(150)}<div style="height:54px"></div>${wordmark(560)}<div style="height:40px"></div><p class="eyebrow">The Atelier Film</p></div>`;
const end = () => `${BASE}<div class="center">${seal(120)}<div style="height:46px"></div>${wordmark(420)}<div style="height:38px"></div><p class="tag">Tailored Without Boundaries. Crafted to Endure.</p><div style="height:34px"></div><p class="eyebrow" style="color:#ACA498;font-size:17px">House of MANTHAI · Colombo</p></div>`;
const plate = (imgs, num, word) => `${BASE}<div class="plates" style="grid-template-columns:repeat(${imgs.length},1fr)">${imgs.map((s) => `<img src="/assets/media/${s}" alt="">`).join('')}</div>
  <div class="cap"><span>${num}</span><b>${word}</b></div>`;
const prologue = () => `${BASE}<div class="pro"><img src="/assets/media/lookbook/temp/ivory.webp" alt="">
  <div><p class="eyebrow">House of MANTHAI</p><div style="height:34px"></div><h2>Every piece begins <em>in the atelier,</em> by hand.</h2><div style="height:34px"></div><p class="tag" style="font-size:34px">Contemporary luxury womenswear.</p></div></div>`;

const STILLS = [
  ['00-title', title()],
  ['01-prologue', prologue()],
  ['02-silhouette', plate(['products/temp/aurelia-gown-form.webp', 'products/temp/aurelia-gown-detail.webp', 'products/temp/alabaster-slip-move.webp'], 'I', 'Silhouette')],
  ['03-detail', plate(['products/temp/nocturne-cape-top-detail.webp', 'products/temp/solstice-midi-detail.webp', 'products/temp/vespera-blazer-detail.webp'], 'II', 'Hand-finished detail')],
  ['04-atelier', plate(['lookbook/temp/atelier.webp', 'lookbook/temp/emporium.webp', 'lookbook/temp/studio.webp'], 'III', 'The Atelier')],
  ['05-movement', plate(['products/temp/vespera-blazer-move.webp', 'products/temp/nocturne-cape-top-move.webp', 'products/temp/vespera-trousers-move.webp'], 'IV', 'Movement')],
  ['06-end', end()],
];

const FPS = 25, X = 0.9; /* cross-dissolve, seconds */
/* [file, seconds, push] — push is the slow zoom across the shot */
const SHOTS = [['00-title', 4.2, 0.02], ['01-prologue', 5.2, 0.03], ['02-silhouette', 4.2, 0.035], ['03-detail', 4.2, 0.035], ['04-atelier', 4.2, 0.035], ['05-movement', 4.2, 0.035], ['06-end', 5.2, 0.02]];

function ff(args) { execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: 'inherit' }); }

(async () => {
  const b = await chromium.launch();
  for (const [name, markup] of STILLS) {
    const pg = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
    await pg.goto(SITE + '/robots.txt');
    await pg.setContent(markup, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(200);
    await pg.screenshot({ path: path.join(WORK, name + '.png') });
    await pg.close();
    console.log('typeset', name);
  }
  await b.close();

  /* each shot as an intermediate clip at 1920 x 1080, 25 fps, yuv420p */
  const clips = SHOTS.map(([name, sec, push]) => {
    const out = path.join(WORK, 'clip-' + name + '.mp4'), n = Math.round(sec * FPS);
    /* push in from 1.00 to 1+push, on a 3840 px source so the move stays smooth */
    ff(['-loop', '1', '-i', path.join(WORK, name + '.png'), '-t', String(sec),
      '-vf', `zoompan=z='1+${push}*on/${n}':d=${n}:s=1920x1080:fps=${FPS}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',format=yuv420p`,
      '-frames:v', String(n), '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', out]);
    return { out, sec };
  });

  /* chain cross-dissolves; fade in from and out to obsidian */
  const inputs = clips.flatMap((c) => ['-i', c.out]);
  let chain = '', last = '[0:v]', t = clips[0].sec;
  for (let k = 1; k < clips.length; k++) {
    const lbl = k === clips.length - 1 ? '[cut]' : `[x${k}]`;
    chain += `${last}[${k}:v]xfade=transition=fade:duration=${X}:offset=${(t - X).toFixed(2)}${lbl};`;
    last = lbl; t += clips[k].sec - X;
  }
  const total = t;
  chain += `[cut]fade=t=in:st=0:d=1.2,fade=t=out:st=${(total - 1.4).toFixed(2)}:d=1.4,format=yuv420p[v]`;
  const master = path.join(WORK, 'master.mp4');
  ff([...inputs, '-filter_complex', chain, '-map', '[v]', '-c:v', 'libx264', '-crf', '12', '-preset', 'slow', master]);

  ff(['-i', master, '-c:v', 'libx264', '-profile:v', 'high', '-crf', '23', '-preset', 'veryslow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(OUT, 'atelier-film.mp4')]);
  ff(['-i', master, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', path.join(OUT, 'atelier-film.webm')]);
  ff(['-i', path.join(WORK, '00-title.png'), '-vf', 'scale=1920:1080:flags=lanczos', '-quality', '82', path.join(OUT, 'atelier-film-poster.webp')]);
  for (const f of ['atelier-film.mp4', 'atelier-film.webm', 'atelier-film-poster.webp']) {
    console.log(f, Math.round(fs.statSync(path.join(OUT, f)).size / 1024) + ' KB');
  }
  console.log('duration', total.toFixed(1) + 's');
})();
