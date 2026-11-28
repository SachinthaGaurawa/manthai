/* ==========================================================================
   House of MANTHAI | The House Archive, on the server
   The rules of ownership live here, never in the browser:
     Gate 1  a genuine tap of the garment's Concealed Authenticity Seal
             (NTAG 424 DNA, checked in _sun.js) opens a 10-minute session
             for that one piece.
     Gate 2  inside that session, a signed-in member presents the Archive
             Serial and Vault Key of the Solid Metal Vault Card paired to
             THAT piece at the atelier. Five wrong attempts pause the piece
             for 30 minutes. A correct pair inscribes the piece in the
             member's name and seals the Vault Key for good.
   Firestore (Admin SDK only; firestore.rules denies every client):
     pieces/{passportId}        the item record (hashes, never the keys)
     nfc_uids/{chipUid}         chip -> piece, plus the last counter seen
     nfc_sessions/{sha256}      10-minute Gate 1 sessions (single piece)
     vault_attempts/{pieceId}   failed Gate 2 attempts and the pause
     vault_transfers/{sha256}   7-day Ownership Transfer invitations
   Files starting with "_" are helpers, not Vercel routes.
   ========================================================================== */
import crypto from 'node:crypto';
import { verifySun } from './_sun.js';

export const SESSION_TTL = 10 * 60 * 1000;
export const LOCK_TTL = 30 * 60 * 1000;
export const MAX_FAILS = 5;
export const TRANSFER_TTL = 7 * 24 * 3600 * 1000;
export const TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Miss', 'Dr.', 'Prof.', 'Hon.', 'Rev.'];

export class HttpError extends Error {
  constructor(status, code, extra) { super(code); this.status = status; this.code = code; this.extra = extra || {}; }
}

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const token = () => crypto.randomBytes(24).toString('base64url');
export const digitsOf = (s) => String(s || '').replace(/\D/g, '');

/* one-way pairing digests, peppered with a server secret (VAULT_PEPPER) so a copy of the database alone
   cannot be searched for the 10,000 possible Vault Keys */
export function pairHash(pepper, kind, pieceId, value) {
  return crypto.createHmac('sha256', String(pepper)).update(kind + '|' + String(pieceId).toUpperCase() + '|' + digitsOf(value)).digest('hex');
}
function same(a, b) {
  const x = Buffer.from(String(a || ''), 'utf8'), y = Buffer.from(String(b || ''), 'utf8');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

const NAME = /^[\p{L}][\p{L}\p{M} '’.-]{0,59}$/u;
export function cleanPerson(p) {
  p = p || {};
  const first = String(p.first || '').trim().replace(/\s+/g, ' ');
  const last = String(p.last || '').trim().replace(/\s+/g, ' ');
  const title = TITLES.includes(p.title) ? p.title : '';
  if (!NAME.test(first)) throw new HttpError(400, 'name_first');
  if (!NAME.test(last)) throw new HttpError(400, 'name_last');
  return { title, first, last };
}
export function formal(o) { return [o.title, o.first, o.last].filter(Boolean).join(' '); }

/* what anyone holding the garment may see: never a price, never the owner */
export function publicFacts(p) {
  return { id: p.id, pid: p.pid, name: p.name || '', size: p.size || '', edition: p.edition || '', issued: p.issued || '', status: p.status };
}
/* the owner's own record */
export function ownerRecord(p) {
  return { ...publicFacts(p), owner: p.owner ? { title: p.owner.title || '', first: p.owner.first, last: p.owner.last } : null,
    inscribedAt: p.inscribedAt || '', via: p.via || 'card', prior: (p.prior || []).map((x) => ({ initials: x.initials || '', from: x.from || '', to: x.to || '' })),
    transfer: p.transfer ? { email: p.transfer.email, expires: p.transfer.expires } : null };
}
function view(p, who) {
  const mine = !!(who && p.owner && p.owner.uid === who.uid);
  if (mine) return { ...ownerRecord(p), mine: true };
  return { ...publicFacts(p), mine: false, claimed: p.status === 'CLAIMED' };
}

/* ---------------------------------------------------------------- Gate 1 */
export async function tap(a, env, q, who) {
  const key = env.NFC_SDM_MAC_KEY;
  if (!key) throw new HttpError(503, 'not_configured');
  const ok = verifySun(key, q.uid, q.ctr, q.cmac);
  if (!ok) throw new HttpError(403, 'seal_invalid');
  const uidRef = a.db.collection('nfc_uids').doc(ok.uid);
  const res = await a.db.runTransaction(async (tx) => {
    const u = await tx.get(uidRef);
    if (!u.exists) throw new HttpError(404, 'seal_unknown');
    const last = Number(u.data().lastCtr || -1);
    /* the counter rises on every genuine tap: an equal or lower one is a copied or replayed link */
    if (ok.counter <= last) throw new HttpError(409, 'seal_replayed');
    const pRef = a.db.collection('pieces').doc(u.data().pieceId);
    const ps = await tx.get(pRef);
    if (!ps.exists) throw new HttpError(404, 'seal_unknown');
    tx.update(uidRef, { lastCtr: ok.counter, lastTap: Date.now() });
    const p = ps.data();
    let session = null, exp = 0;
    if (p.status === 'UNCLAIMED') {
      session = token(); exp = Date.now() + SESSION_TTL;
      tx.set(a.db.collection('nfc_sessions').doc(sha(session)), { pieceId: p.id, exp });
    }
    return { p, session, exp };
  });
  const p = res.p, out = { piece: view(p, who), verified: true };
  if (res.session) {
    out.session = res.session; out.exp = res.exp;
    if (p.isGift) {
      const buyer = !!(who && who.email && p.buyerEmail && who.email === p.buyerEmail);
      out.gift = { forBuyer: buyer, recipientFirst: (p.intendedRecipientName && p.intendedRecipientName.first) || '' };
      if (!buyer && p.intendedRecipientName) out.suggestedName = { title: p.intendedRecipientName.title || '', first: p.intendedRecipientName.first || '', last: p.intendedRecipientName.last || '' };
    }
  }
  return out;
}

/* a Gate 1 session, still valid, for a piece still awaiting its owner */
export async function session(a, s) {
  if (!s || typeof s !== 'string' || s.length > 64) throw new HttpError(401, 'tap_required');
  const d = await a.db.collection('nfc_sessions').doc(sha(s)).get();
  if (!d.exists || d.data().exp < Date.now()) throw new HttpError(401, 'tap_required');
  const p = await a.db.collection('pieces').doc(d.data().pieceId).get();
  if (!p.exists) throw new HttpError(401, 'tap_required');
  const at = await a.db.collection('vault_attempts').doc(p.id).get();
  const lockedUntil = at.exists && at.data().lockedUntil > Date.now() ? at.data().lockedUntil : 0;
  const pd = p.data(), out = { piece: publicFacts(pd), exp: d.data().exp, lockedUntil, remaining: MAX_FAILS - (at.exists && !lockedUntil ? Number(at.data().fails || 0) : 0) };
  return out;
}

/* ---------------------------------------------------------------- Gate 2 */
export async function claim(a, env, b, who) {
  if (!env.VAULT_PEPPER) throw new HttpError(503, 'not_configured');
  if (!who) throw new HttpError(401, 'sign_in_required');
  if (!who.emailVerified) throw new HttpError(403, 'email_unverified');
  const person = cleanPerson(b.person);
  const serial = digitsOf(b.serial), key = digitsOf(b.key);
  if (serial.length < 8 || serial.length > 12 || key.length !== 4) throw new HttpError(400, 'keys_format');
  if (!b.session || typeof b.session !== 'string' || b.session.length > 64) throw new HttpError(401, 'tap_required');
  const sRef = a.db.collection('nfc_sessions').doc(sha(b.session));
  const now = Date.now();
  const r = await a.db.runTransaction(async (tx) => {
    const s = await tx.get(sRef);
    if (!s.exists || s.data().exp < now) throw new HttpError(401, 'tap_required');
    const pieceId = s.data().pieceId;
    const pRef = a.db.collection('pieces').doc(pieceId), aRef = a.db.collection('vault_attempts').doc(pieceId);
    const [ps, at] = [await tx.get(pRef), await tx.get(aRef)];
    if (!ps.exists) throw new HttpError(401, 'tap_required');
    const p = ps.data(), att = at.exists ? at.data() : { fails: 0, lockedUntil: 0 };
    if (att.lockedUntil > now) return { locked: att.lockedUntil };
    if (p.status !== 'UNCLAIMED') throw new HttpError(409, 'already_claimed');
    if (p.isGift && p.buyerEmail && who.email === p.buyerEmail && !b.keepForSelf) {
      throw new HttpError(409, 'gift_buyer', { recipientFirst: (p.intendedRecipientName && p.intendedRecipientName.first) || '' });
    }
    const good = same(pairHash(env.VAULT_PEPPER, 'serial', pieceId, serial), p.serialHash) & same(pairHash(env.VAULT_PEPPER, 'key', pieceId, key), p.keyHash);
    if (!good) {
      const fails = (att.lockedUntil && att.lockedUntil <= now ? 0 : Number(att.fails || 0)) + 1;
      if (fails >= MAX_FAILS) { tx.set(aRef, { fails: 0, lockedUntil: now + LOCK_TTL }); return { locked: now + LOCK_TTL }; }
      tx.set(aRef, { fails, lockedUntil: 0 });
      return { mismatch: MAX_FAILS - fails };
    }
    const iso = new Date(now).toISOString();
    const upd = { status: 'CLAIMED', vaultKeyStatus: 'SEALED', via: 'card', inscribedAt: iso,
      owner: { uid: who.uid, email: who.email, title: person.title, first: person.first, last: person.last } };
    if (p.isGift) upd.giftStatus = 'INSCRIBED_BY_RECIPIENT';
    tx.update(pRef, upd);
    if (p.cardId) tx.update(a.db.collection('vault_cards').doc(p.cardId), { status: 'CLAIMED' });
    tx.delete(sRef);
    if (at.exists) tx.delete(aRef);
    return { piece: { ...p, ...upd } };
  });
  if (r.locked) throw new HttpError(423, 'locked', { lockedUntil: r.locked });
  if (r.mismatch !== undefined) throw new HttpError(400, 'mismatch', { remaining: r.mismatch });
  return { piece: view(r.piece, who) };
}

/* ---------------------------------------------------------------- reading */
export async function piece(a, id, who) {
  id = String(id || '').toUpperCase();
  if (!/^MNT-[A-Z0-9]{4,12}$/.test(id)) throw new HttpError(404, 'not_found');
  const d = await a.db.collection('pieces').doc(id).get();
  if (!d.exists) throw new HttpError(404, 'not_found');
  return { piece: view(d.data(), who) };
}
export async function mine(a, who) {
  if (!who) throw new HttpError(401, 'sign_in_required');
  const q = await a.db.collection('pieces').where('owner.uid', '==', who.uid).get();
  return { pieces: q.docs.map((d) => ({ ...ownerRecord(d.data()), mine: true })).sort((x, y) => String(y.inscribedAt).localeCompare(String(x.inscribedAt))) };
}
/* the buyer's side: pieces awaiting their own activation, and gifts, which reveal nothing of the recipient */
export async function acquisitions(a, who) {
  if (!who) throw new HttpError(401, 'sign_in_required');
  if (!who.email || !who.emailVerified) return { awaiting: [], gifts: [] };
  const q = await a.db.collection('pieces').where('buyerEmail', '==', who.email).get();
  const awaiting = [], gifts = [];
  q.docs.forEach((d) => {
    const p = d.data(), base = { pid: p.pid, name: p.name || '', size: p.size || '', orderRef: p.orderRef || '' };
    if (p.isGift) gifts.push({ ...base, status: p.status === 'CLAIMED' ? 'Inscribed by Recipient' : 'Dispatched · Awaiting Recipient’s Inscription' });
    else if (p.status === 'UNCLAIMED') awaiting.push(base);
  });
  return { awaiting, gifts };
}

/* ---------------------------------------------------------------- transfers */
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
export async function transferStart(a, b, who) {
  if (!who) throw new HttpError(401, 'sign_in_required');
  const email = String(b.email || '').trim().toLowerCase();
  if (!EMAIL.test(email)) throw new HttpError(400, 'email_invalid');
  if (email === who.email) throw new HttpError(400, 'email_self');
  const pRef = a.db.collection('pieces').doc(String(b.id || '').toUpperCase());
  const t = token(), exp = Date.now() + TRANSFER_TTL;
  const p = await a.db.runTransaction(async (tx) => {
    const ps = await tx.get(pRef);
    if (!ps.exists || !ps.data().owner || ps.data().owner.uid !== who.uid) throw new HttpError(403, 'not_owner');
    const cur = ps.data();
    if (cur.transfer && cur.transfer.tokenHash) tx.delete(a.db.collection('vault_transfers').doc(cur.transfer.tokenHash));
    const transfer = { email, expires: new Date(exp).toISOString(), tokenHash: sha(t) };
    tx.set(a.db.collection('vault_transfers').doc(sha(t)), { pieceId: cur.id, email, exp });
    tx.update(pRef, { transfer });
    return { ...cur, transfer };
  });
  return { piece: view(p, who), token: t };
}
export async function transferCancel(a, b, who) {
  if (!who) throw new HttpError(401, 'sign_in_required');
  const pRef = a.db.collection('pieces').doc(String(b.id || '').toUpperCase());
  const p = await a.db.runTransaction(async (tx) => {
    const ps = await tx.get(pRef);
    if (!ps.exists || !ps.data().owner || ps.data().owner.uid !== who.uid) throw new HttpError(403, 'not_owner');
    const cur = ps.data();
    if (cur.transfer && cur.transfer.tokenHash) tx.delete(a.db.collection('vault_transfers').doc(cur.transfer.tokenHash));
    tx.update(pRef, { transfer: null });
    return { ...cur, transfer: null };
  });
  return { piece: view(p, who) };
}
async function invitation(a, t) {
  if (!t || typeof t !== 'string' || t.length > 64) throw new HttpError(404, 'transfer_invalid');
  const d = await a.db.collection('vault_transfers').doc(sha(t)).get();
  if (!d.exists) throw new HttpError(404, 'transfer_invalid');
  if (d.data().exp < Date.now()) throw new HttpError(410, 'transfer_expired');
  return d;
}
export async function transferView(a, b) {
  const d = await invitation(a, b.token);
  const p = await a.db.collection('pieces').doc(d.data().pieceId).get();
  if (!p.exists) throw new HttpError(404, 'transfer_invalid');
  const e = d.data().email, at = e.indexOf('@');
  return { piece: publicFacts(p.data()), to: e.slice(0, 1) + '•••' + e.slice(at), expires: new Date(d.data().exp).toISOString() };
}
export async function transferAccept(a, b, who) {
  if (!who) throw new HttpError(401, 'sign_in_required');
  if (!who.emailVerified) throw new HttpError(403, 'email_unverified');
  const person = cleanPerson(b.person);
  const d = await invitation(a, b.token);
  if (d.data().email !== who.email) throw new HttpError(403, 'transfer_email');
  const pRef = a.db.collection('pieces').doc(d.data().pieceId), tRef = d.ref;
  const p = await a.db.runTransaction(async (tx) => {
    const ps = await tx.get(pRef), ts = await tx.get(tRef);
    if (!ps.exists || !ts.exists) throw new HttpError(404, 'transfer_invalid');
    const cur = ps.data(), now = new Date().toISOString();
    const prev = cur.owner || {};
    const prior = (cur.prior || []).concat([{ initials: ((prev.first || '').charAt(0) + (prev.last || '').charAt(0)).toUpperCase(), from: cur.inscribedAt || '', to: now }]);
    const upd = { owner: { uid: who.uid, email: who.email, ...person }, inscribedAt: now, via: 'transfer', transfer: null, prior };
    tx.update(pRef, upd); tx.delete(tRef);
    return { ...cur, ...upd };
  });
  return { piece: view(p, who) };
}

export function status(a, env) {
  return { ready: !!(a && env.NFC_SDM_MAC_KEY && env.VAULT_PEPPER), archive: !!a, seal: !!env.NFC_SDM_MAC_KEY, pairing: !!env.VAULT_PEPPER };
}
