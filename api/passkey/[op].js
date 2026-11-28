/* ==========================================================================
   House of MANTHAI | Private Circle passkeys (WebAuthn), verified on the server
   One function, five operations (POST /api/passkey/<op>):
     register-options  signed-in member asks to link a passkey   (Firebase ID token)
     register-verify   the new passkey's public key is checked and stored
     login-options     any device asks to sign in with a passkey
     login-verify      the signature is checked; a Firebase sign-in token is returned
     list / remove     the member's own passkeys                  (Firebase ID token)
   Public keys live in Firestore `passkeys/{credentialId}`, single-use challenges
   in `webauthn_challenges/{id}` (5 minutes). Clients can never read either:
   firestore.rules denies everything outside members/{uid}; only this server,
   with the Admin SDK, touches them.
   Configuration (Vercel, Production): FIREBASE_SERVICE_ACCOUNT = the JSON of a
   Firebase service-account key. Without it every call answers 503
   "not_configured" and the site keeps its on-device behaviour.
   ========================================================================== */
import crypto from 'node:crypto';
import {
  generateRegistrationOptions, verifyRegistrationResponse,
  generateAuthenticationOptions, verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const RP_NAME = 'House of MANTHAI';
const RP_ID = process.env.PASSKEY_RP_ID || 'manthai.vercel.app';
const ORIGINS = (process.env.PASSKEY_ORIGINS || 'https://manthai.vercel.app').split(',').map((s) => s.trim()).filter(Boolean);
const CHALLENGE_TTL = 5 * 60 * 1000;
const MAX_KEYS = 10;

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

class HttpError extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } }

async function member(req, a) {
  const h = req.headers.authorization || '';
  const m = /^Bearer (.+)$/.exec(h);
  if (!m) throw new HttpError(401, 'sign_in_required');
  try {
    const t = await a.auth.verifyIdToken(m[1], true);
    return { uid: t.uid, email: t.email || '', name: t.name || '' };
  } catch (e) { throw new HttpError(401, 'sign_in_required'); }
}

function body(req) {
  const b = req.body;
  if (b && typeof b === 'object') return b;
  try { return JSON.parse(b || '{}'); } catch (e) { return {}; }
}

function cleanLabel(s) { return String(s || '').replace(/[^\p{L}\p{N} ·()\-/]/gu, '').slice(0, 80) || 'Passkey'; }

async function saveChallenge(a, data) {
  const id = crypto.randomBytes(18).toString('base64url');
  await a.db.collection('webauthn_challenges').doc(id).set({ ...data, exp: Date.now() + CHALLENGE_TTL });
  return id;
}
async function sweepExpired(a) {
  try {
    const q = await a.db.collection('webauthn_challenges').where('exp', '<', Date.now()).limit(20).get();
    if (!q.empty) { const batch = a.db.batch(); q.docs.forEach((d) => batch.delete(d.ref)); await batch.commit(); }
  } catch (e) { /* housekeeping only */ }
}
/* read once and delete, so a challenge can never be replayed */
async function takeChallenge(a, id, type) {
  if (!id || typeof id !== 'string' || id.length > 64) throw new HttpError(400, 'challenge_missing');
  const ref = a.db.collection('webauthn_challenges').doc(id);
  const c = await a.db.runTransaction(async (tx) => {
    const s = await tx.get(ref);
    if (!s.exists) return null;
    tx.delete(ref);
    return s.data();
  });
  if (!c || c.type !== type || c.exp < Date.now()) throw new HttpError(400, 'challenge_expired');
  return c;
}

function keysOf(a, uid) { return a.db.collection('passkeys').where('uid', '==', uid).get(); }
function view(d) {
  const k = d.data();
  return { id: d.id, label: k.label, added: k.createdAt, lastUsed: k.lastUsed || null, synced: !!k.backedUp };
}

const ops = {
  async 'register-options'(req, a) {
    const m = await member(req, a);
    const existing = await keysOf(a, m.uid);
    if (existing.size >= MAX_KEYS) throw new HttpError(409, 'too_many_passkeys');
    const options = await generateRegistrationOptions({
      rpName: RP_NAME, rpID: RP_ID,
      userID: new TextEncoder().encode(m.uid),
      userName: m.email || m.uid, userDisplayName: m.name || m.email || 'Private Circle member',
      attestationType: 'none',
      excludeCredentials: existing.docs.map((d) => ({ id: d.id, transports: d.data().transports || undefined })),
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
      supportedAlgorithmIDs: [-7, -257],
      timeout: 120000,
    });
    const challengeId = await saveChallenge(a, { type: 'reg', uid: m.uid, challenge: options.challenge });
    return { options, challengeId };
  },

  async 'register-verify'(req, a) {
    const m = await member(req, a);
    const b = body(req);
    const c = await takeChallenge(a, b.challengeId, 'reg');
    if (c.uid !== m.uid) throw new HttpError(403, 'wrong_member');
    let v;
    try {
      v = await verifyRegistrationResponse({
        response: b.response, expectedChallenge: c.challenge, expectedOrigin: ORIGINS, expectedRPID: RP_ID,
        requireUserVerification: true,
      });
    } catch (e) { throw new HttpError(400, 'not_verified'); }
    if (!v.verified || !v.registrationInfo) throw new HttpError(400, 'not_verified');
    const { credential, credentialDeviceType, credentialBackedUp } = v.registrationInfo;
    const ref = a.db.collection('passkeys').doc(credential.id);
    const now = new Date().toISOString();
    await ref.set({
      uid: m.uid, email: m.email,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter || 0,
      transports: credential.transports || b.response?.response?.transports || [],
      deviceType: credentialDeviceType, backedUp: !!credentialBackedUp,
      label: cleanLabel(b.label), createdAt: now, lastUsed: null,
    });
    return { passkey: view(await ref.get()) };
  },

  async 'login-options'(req, a) {
    const options = await generateAuthenticationOptions({ rpID: RP_ID, userVerification: 'required', allowCredentials: [], timeout: 120000 });
    /* the site asks for a challenge as soon as a sign-in panel is shown, so some go unused:
       sweep a few expired ones on each request (this never fails the sign-in) */
    const [challengeId] = await Promise.all([
      saveChallenge(a, { type: 'auth', challenge: options.challenge }),
      sweepExpired(a),
    ]);
    return { options, challengeId };
  },

  async 'login-verify'(req, a) {
    const b = body(req);
    const c = await takeChallenge(a, b.challengeId, 'auth');
    const id = b.response && typeof b.response.id === 'string' ? b.response.id : '';
    if (!id || id.length > 1024) throw new HttpError(400, 'not_verified');
    const ref = a.db.collection('passkeys').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, 'unknown_passkey');
    const k = snap.data();
    let v;
    try {
      v = await verifyAuthenticationResponse({
        response: b.response, expectedChallenge: c.challenge, expectedOrigin: ORIGINS, expectedRPID: RP_ID,
        requireUserVerification: true,
        credential: { id, publicKey: Buffer.from(k.publicKey, 'base64url'), counter: k.counter || 0, transports: k.transports || undefined },
      });
    } catch (e) { throw new HttpError(401, 'not_verified'); }
    if (!v.verified) throw new HttpError(401, 'not_verified');
    /* the passkey's user handle must name the same member the key was registered to */
    const handle = b.response.response && b.response.response.userHandle;
    if (handle && Buffer.from(handle, 'base64url').toString('utf8') !== k.uid) throw new HttpError(401, 'not_verified');
    let user;
    try { user = await a.auth.getUser(k.uid); } catch (e) { throw new HttpError(404, 'unknown_passkey'); }
    if (user.disabled) throw new HttpError(403, 'account_disabled');
    await ref.update({ counter: v.authenticationInfo.newCounter, lastUsed: new Date().toISOString(), backedUp: !!v.authenticationInfo.credentialBackedUp });
    const token = await a.auth.createCustomToken(k.uid, { pk: true });
    return { token };
  },

  async list(req, a) {
    const m = await member(req, a);
    const s = await keysOf(a, m.uid);
    return { passkeys: s.docs.map(view).sort((x, y) => String(y.added).localeCompare(String(x.added))) };
  },

  async remove(req, a) {
    const m = await member(req, a);
    const id = body(req).id;
    if (!id || typeof id !== 'string') throw new HttpError(400, 'missing_id');
    const ref = a.db.collection('passkeys').doc(id);
    const s = await ref.get();
    if (!s.exists || s.data().uid !== m.uid) throw new HttpError(404, 'unknown_passkey');
    await ref.delete();
    return { removed: id };
  },
};

/* createHandler(getAdmin) lets the local test harness supply an in-memory admin; Vercel uses the default export */
export function createHandler(getAdmin) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const op = String((req.query && req.query.op) || '');
    if (op === 'status') { res.status(200).end(JSON.stringify({ ready: !!getAdmin(), rpId: RP_ID })); return; }
    if (req.method !== 'POST') { res.status(405).end(JSON.stringify({ error: 'method_not_allowed' })); return; }
    const origin = req.headers.origin;
    if (origin && !ORIGINS.includes(origin)) { res.status(403).end(JSON.stringify({ error: 'origin_not_allowed' })); return; }
    const fn = Object.prototype.hasOwnProperty.call(ops, op) ? ops[op] : null;
    if (!fn) { res.status(404).end(JSON.stringify({ error: 'unknown_operation' })); return; }
    const a = getAdmin();
    if (!a) { res.status(503).end(JSON.stringify({ error: 'not_configured' })); return; }
    try {
      res.status(200).end(JSON.stringify(await fn(req, a)));
    } catch (e) {
      if (e instanceof HttpError) { res.status(e.status).end(JSON.stringify({ error: e.code })); return; }
      console.error('passkey', op, e && e.message);
      res.status(500).end(JSON.stringify({ error: 'server_error' }));
    }
  };
}

export default createHandler(init);
