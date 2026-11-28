/* ==========================================================================
   House of MANTHAI | The Atelier API (/api/atelier/<op>), for the House only
     GET  whoami | pool | ledger?q=
     POST import {csv,lot} | card-check {serial,key} | pair {...} |
          concierge {id,email,person,note} | release {id}
   Every request carries the Founder's Firebase ID token (a verified email in
   ATELIER_ADMIN_EMAILS) and the X-Atelier-Key header (ATELIER_ADMIN_SECRET).
   Anything else, including five wrong keys, is answered 404 as if nothing
   lived here.
   ========================================================================== */
import { init, who, body } from '../_fb.js';
import { HttpError } from '../vault/_logic.js';
import * as A from './_logic.js';

const POST = new Set(['import', 'card-check', 'pair', 'concierge', 'release']);
const GET = new Set(['whoami', 'pool', 'ledger']);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  const op = String((req.query && req.query.op) || ''), a = init(), env = process.env;
  const notFound = () => res.status(404).json({ error: 'not_found' });
  if ((!POST.has(op) && !GET.has(op)) || !a) return notFound();
  if ((POST.has(op) && req.method !== 'POST') || (GET.has(op) && req.method !== 'GET')) return notFound();
  try {
    const admin = await A.gate(a, env, await who(req, a), String(req.headers['x-atelier-key'] || ''));
    const b = POST.has(op) ? body(req) : {};
    let out;
    switch (op) {
      case 'whoami': out = { email: admin.email, pepper: !!env.VAULT_PEPPER, seal: !!env.NFC_SDM_MAC_KEY, base: env.SDM_BASE_URL || env.NEXT_PUBLIC_CANONICAL_URL || '' }; break;
      case 'pool': out = await A.pool(a); break;
      case 'ledger': out = await A.ledger(a, req.query.q); break;
      case 'import': out = await A.importCards(a, env, b, admin); break;
      case 'card-check': out = await A.cardCheck(a, env, b); break;
      case 'pair': out = await A.pair(a, env, b, admin); break;
      case 'concierge': out = await A.concierge(a, b, admin); break;
      case 'release': out = await A.release(a, b); break;
      default: return notFound();
    }
    return res.status(200).json(out);
  } catch (e) {
    if (e instanceof HttpError) return res.status(e.status).json({ error: e.code, ...e.extra });
    console.error('atelier', op, e && e.message);
    return res.status(500).json({ error: 'server' });
  }
}
