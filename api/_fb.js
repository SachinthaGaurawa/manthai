/* ==========================================================================
   House of MANTHAI | shared Firebase Admin access for /api functions
   FIREBASE_SERVICE_ACCOUNT (Vercel, Production) holds the service-account JSON.
   Files starting with "_" are helpers, not Vercel routes.
   ========================================================================== */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let admin = null;
export function init() {
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
export async function who(req, a) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m) return null;
  try {
    const t = await a.auth.verifyIdToken(m[1], true);
    return { uid: t.uid, email: String(t.email || '').toLowerCase(), emailVerified: !!t.email_verified };
  } catch (e) { return null; }
}
export function body(req) {
  const b = req.body;
  if (b && typeof b === 'object') return b;
  try { return JSON.parse(b || '{}'); } catch (e) { return {}; }
}
