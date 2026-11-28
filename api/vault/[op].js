/* ==========================================================================
   House of MANTHAI | The House Archive API (/api/vault/<op>)
     GET  status                      is the archive configured?
     POST tap        {uid,ctr,cmac}   Gate 1: a genuine seal tap -> 10-minute session
     POST session    {session}        that session, its piece, attempts left
     POST claim      {session,serial,key,person,keepForSelf}   Gate 2 (signed in)
     GET  piece?id=MNT-...            the public record (owner only to the owner)
     GET  mine                        the member's inscribed pieces (signed in)
     GET  acquisitions                awaiting activation + gifts, as the buyer (signed in)
     POST transfer-start|transfer-cancel|transfer-view|transfer-accept
   Configuration (Vercel, Production), set by the House only:
     FIREBASE_SERVICE_ACCOUNT  the Firebase service-account JSON (already used by passkeys)
     NFC_SDM_MAC_KEY           32 hex: the NTAG 424 DNA SDM File Read key of the seals
     VAULT_PEPPER              a long random secret for the Vault Card pairing digests
   Without them every operation answers 503 "not_configured": nothing can be
   inscribed, and there is no sample, demo or bypass in production.
   ========================================================================== */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as L from './_logic.js';

let admin = null;
function init() {
  if (admin) return admin;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  let sa;
  try { sa = JSON.parse(raw); } catch (e) { return null; }
  if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  const app = getApps()[0] || initializeApp({ credential: cert(sa), projectId: sa.project_id });
  admin = { auth: getAuth(app), db: getFirestore(app) };
  return admin;
}

/* the signed-in member, when a Firebase ID token is presented; otherwise null */
async function who(req, a) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m) return null;
  try {
    const t = await a.auth.verifyIdToken(m[1], true);
    return { uid: t.uid, email: String(t.email || '').toLowerCase(), emailVerified: !!t.email_verified };
  } catch (e) { return null; }
}
function body(req) {
  const b = req.body;
  if (b && typeof b === 'object') return b;
  try { return JSON.parse(b || '{}'); } catch (e) { return {}; }
}

const POST = new Set(['tap', 'session', 'claim', 'transfer-start', 'transfer-cancel', 'transfer-view', 'transfer-accept']);
const GET = new Set(['status', 'piece', 'mine', 'acquisitions']);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const op = String((req.query && req.query.op) || '');
  if (!POST.has(op) && !GET.has(op)) return res.status(404).json({ error: 'unknown_op' });
  if ((POST.has(op) && req.method !== 'POST') || (GET.has(op) && req.method !== 'GET')) return res.status(405).json({ error: 'method' });
  const env = process.env, a = init();
  if (op === 'status') return res.status(200).json(L.status(a, env));
  if (!a) return res.status(503).json({ error: 'not_configured' });
  try {
    const b = POST.has(op) ? body(req) : {}, me = await who(req, a);
    let out;
    switch (op) {
      case 'tap': out = await L.tap(a, env, b, me); break;
      case 'session': out = await L.session(a, b.session); break;
      case 'claim': out = await L.claim(a, env, b, me); break;
      case 'piece': out = await L.piece(a, req.query.id, me); break;
      case 'mine': out = await L.mine(a, me); break;
      case 'acquisitions': out = await L.acquisitions(a, me); break;
      case 'transfer-start': out = await L.transferStart(a, b, me); break;
      case 'transfer-cancel': out = await L.transferCancel(a, b, me); break;
      case 'transfer-view': out = await L.transferView(a, b); break;
      case 'transfer-accept': out = await L.transferAccept(a, b, me); break;
      default: return res.status(404).json({ error: 'unknown_op' });
    }
    return res.status(200).json(out);
  } catch (e) {
    if (e instanceof L.HttpError) return res.status(e.status).json({ error: e.code, ...e.extra });
    console.error('vault', op, e && e.message);
    return res.status(500).json({ error: 'server' });
  }
}
