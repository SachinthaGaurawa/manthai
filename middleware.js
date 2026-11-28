/* ==========================================================================
   House of MANTHAI | edge metadata for shared links
   WhatsApp, iMessage, Facebook and LinkedIn read the raw HTML and never run
   JavaScript, so the single-page shell would preview every route as the
   homepage. For the Maison, each piece, /verify and each Digital Product Passport this
   rewrites only the <head> tags (title, description, canonical, Open Graph,
   Twitter) of the shell before it leaves the edge. Anything unexpected falls
   through to the normal static rewrite, untouched.
   Passport previews carry the passport ID only, never an owner's name.
   ========================================================================== */
export const config = { matcher: ['/the-maison', '/pieces/:slug', '/passport/:id', '/verify'] };

const ORIGIN = 'https://manthai.vercel.app';
const V = '20261128v';
const card = (file) => ORIGIN + '/assets/og/' + file + '?v=' + V;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function setMeta(html, attr, key, value) {
  const re = new RegExp('(<meta ' + attr + '="' + key.replace(/:/g, '\\:') + '" content=")[^"]*(")');
  return html.replace(re, (_, a, b) => a + esc(value) + b);
}

function applyMeta(html, m) {
  let h = html.replace(/<title>[^<]*<\/title>/, '<title>' + esc(m.title) + '</title>');
  h = h.replace(/(<link rel="canonical" href=")[^"]*(")/, (_, a, b) => a + esc(m.url) + b);
  h = setMeta(h, 'name', 'description', m.desc);
  h = setMeta(h, 'property', 'og:url', m.url);
  h = setMeta(h, 'property', 'og:title', m.title);
  h = setMeta(h, 'property', 'og:description', m.desc);
  h = setMeta(h, 'property', 'og:image', m.image);
  h = setMeta(h, 'property', 'og:image:secure_url', m.image);
  h = setMeta(h, 'property', 'og:image:alt', m.alt);
  h = setMeta(h, 'name', 'twitter:title', m.title);
  h = setMeta(h, 'name', 'twitter:description', m.desc);
  h = setMeta(h, 'name', 'twitter:image', m.image);
  h = setMeta(h, 'name', 'twitter:image:alt', m.alt);
  if (m.noindex) h = setMeta(h, 'name', 'robots', 'noindex, nofollow');
  if (m.type) h = setMeta(h, 'property', 'og:type', m.type);
  return h;
}

/* the same-origin asset fetch keeps any preview-protection cookie of the visitor */
function get(request, path) {
  const headers = {};
  const cookie = request.headers.get('cookie');
  if (cookie) headers.cookie = cookie;
  const bypass = request.headers.get('x-vercel-protection-bypass');
  if (bypass) headers['x-vercel-protection-bypass'] = bypass;
  return fetch(new URL(path, request.url), { headers });
}

async function metaFor(request, path) {
  if (/^\/the-maison\/?$/.test(path)) {
    return { title: 'The Maison | MANTHAI', url: ORIGIN + '/the-maison', image: card('og-manthai-flagship.png'), alt: 'MANTHAI · The Maison',
      desc: 'Discover House of MANTHAI: our savoir-faire, the Unbounded Spiral Seal, and our signature presentation ritual.' };
  }
  if (/^\/verify\/?$/.test(path)) {
    return { title: 'Register Your Piece | MANTHAI', url: ORIGIN + '/verify', image: card('og-passport.png'), alt: 'MANTHAI · Private Vault',
      desc: 'Verify a MANTHAI piece and inscribe it in your name with the Archive Serial and Vault Key of its Solid Metal Vault Card.' };
  }
  let m = /^\/pieces\/([a-z0-9-]+)\/?$/.exec(path);
  if (m) {
    const res = await get(request, '/assets/og/meta.json');
    if (!res.ok) return null;
    const p = ((await res.json()).pieces || {})[m[1]];
    if (!p) return null;
    return { title: p.name + ' | MANTHAI', url: ORIGIN + '/pieces/' + m[1], image: card('og-piece-' + m[1] + '.png'), alt: p.name + ' · MANTHAI',
      desc: p.edition + ' · ' + p.price + ' · ' + p.note + '.', type: 'product' };
  }
  m = /^\/passport\/([A-Za-z0-9-]{4,24})\/?$/.exec(path);
  if (m) {
    const id = m[1].toUpperCase();
    return { title: 'Digital Product Passport · ' + id + ' | MANTHAI', url: ORIGIN + '/passport/' + id, image: card('og-passport.png'),
      alt: 'MANTHAI · Digital Product Passport', noindex: true,
      desc: 'Verified authentic piece issued by House of Manthai (Private) Limited. Live digital ownership and provenance registry.' };
  }
  return null;
}

export default async function middleware(request) {
  try {
    if (request.method !== 'GET') return;
    const meta = await metaFor(request, new URL(request.url).pathname);
    if (!meta) return;
    const shell = await get(request, '/');
    if (!shell.ok || !(shell.headers.get('content-type') || '').includes('text/html')) return;
    const html = applyMeta(await shell.text(), meta);
    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, must-revalidate',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'x-frame-options': 'SAMEORIGIN',
        'permissions-policy': 'camera=(self), microphone=(), geolocation=()',
      },
    });
  } catch (e) {
    return; /* the static rewrite serves the shell as before */
  }
}
