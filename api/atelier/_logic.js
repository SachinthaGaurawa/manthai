/* ==========================================================================
   House of MANTHAI | The Atelier, on the server (/api/atelier/<op>)
   What the House alone may do, behind a verified Founder email AND the
   Atelier secret:
     pool        counts of the Solid Metal Vault Card pool
     import      a lot of Vault Cards (archiveSerial,vaultKey), stored only as
                 peppered digests, UNASSIGNED
     card-check  is this card in the pool, unassigned, and its key right?
     pair        Pair & Seal: garment seal <-> Vault Card <-> Passport ID <->
                 piece/order, in one transaction; the card becomes PAIRED
     ledger      every provisioned piece, its state and its last seal counter
     concierge   Concierge-Assisted Registration for a verified client
     release     lift a 30-minute pause after a human check
   Firestore (Admin SDK only):
     vault_cards/{hmac(serial)}  { serialTail, keyHash, status, lot, pieceId }
     admin_attempts/{uid}        wrong Atelier secrets and the pause
   Files starting with "_" are helpers, not Vercel routes.
   ========================================================================== */
import crypto from 'node:crypto';
import { verifySun } from '../vault/_sun.js';
import { HttpError, pairHash, digitsOf, cleanPerson, LOCK_TTL, MAX_FAILS } from '../vault/_logic.js';

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const PID = /^[a-z0-9-]{2,60}$/;
const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const EDITION = /^Edition \d{2} · (Piece \d{2} of \d{2}|Batch of \d{2})$/;
const ALPHA = 'ACDEFGHJKLMNPQRTUVWXY34679';

const hmac = (pepper, s) => crypto.createHmac('sha256', String(pepper)).update(s).digest('hex');
export const cardId = (pepper, serial) => hmac(pepper, 'card|' + digitsOf(serial)).slice(0, 40);
const poolKeyHash = (pepper, serial, key) => hmac(pepper, 'pool-key|' + digitsOf(serial) + '|' + digitsOf(key));
function same(a, b) { const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || '')); return x.length === y.length && crypto.timingSafeEqual(x, y); }
function passportId() { const b = crypto.randomBytes(7); let s = 'MNT-'; for (let i = 0; i < 7; i++) s += ALPHA[b[i] % ALPHA.length]; return s; }

/* ---------------------------------------------------------------- who may enter */
export function adminConfigured(env) {
  return !!(env.ATELIER_ADMIN_SECRET && env.ATELIER_ADMIN_SECRET.length >= 16 && String(env.ATELIER_ADMIN_EMAILS || '').trim());
}
/* a signed-in, verified, allowlisted email presenting the Atelier secret; anyone else meets a 404 */
export async function gate(a, env, who, secret) {
  if (!adminConfigured(env) || !who || !who.emailVerified) throw new HttpError(404, 'not_found');
  const list = String(env.ATELIER_ADMIN_EMAILS).toLowerCase().split(/[\s,;]+/).filter(Boolean);
  if (!list.includes(who.email)) throw new HttpError(404, 'not_found');
  const ref = a.db.collection('admin_attempts').doc(who.uid), now = Date.now();
  const at = await ref.get(), d = at.exists ? at.data() : { fails: 0, lockedUntil: 0 };
  if (d.lockedUntil > now) throw new HttpError(404, 'not_found');
  if (!same(secret, env.ATELIER_ADMIN_SECRET)) {
    const fails = (d.lockedUntil && d.lockedUntil <= now ? 0 : Number(d.fails || 0)) + 1;
    await ref.set(fails >= MAX_FAILS ? { fails: 0, lockedUntil: now + LOCK_TTL } : { fails, lockedUntil: 0 });
    throw new HttpError(404, 'not_found');
  }
  if (at.exists && d.fails) await ref.set({ fails: 0, lockedUntil: 0 });
  return { email: who.email, uid: who.uid };
}
function needPepper(env) { if (!env.VAULT_PEPPER) throw new HttpError(503, 'not_configured'); return env.VAULT_PEPPER; }

/* ---------------------------------------------------------------- the Vault Card pool */
async function countWhere(a, status) {
  const q = a.db.collection('vault_cards').where('status', '==', status);
  if (typeof q.count === 'function') return (await q.count().get()).data().count;
  return (await q.get()).docs.length;
}
export async function pool(a) {
  const [available, paired, claimed] = await Promise.all(['UNASSIGNED', 'PAIRED', 'CLAIMED'].map((s) => countWhere(a, s)));
  return { available, paired, claimed };
}

/* "48291074,7392" lines, a header line allowed; serials 8 to 12 digits, keys 4 digits */
export function parseCards(csv) {
  const rows = [], invalid = [], seen = new Set();
  String(csv || '').split(/\r?\n/).forEach((line, i) => {
    const t = line.trim(); if (!t) return;
    const cells = t.split(/[,;\t]/).map((c) => c.replace(/["\s]/g, ''));
    if (i === 0 && /[a-z]/i.test(t)) return;
    const serial = digitsOf(cells[0]), key = digitsOf(cells[1]);
    if (serial.length < 8 || serial.length > 12 || !/^\d{4}$/.test(key) || cells.length < 2) { invalid.push(i + 1); return; }
    if (seen.has(serial)) { invalid.push(i + 1); return; }
    seen.add(serial); rows.push({ serial, key });
  });
  return { rows, invalid };
}
export async function importCards(a, env, b, admin) {
  const pepper = needPepper(env);
  const { rows, invalid } = parseCards(b.csv);
  if (rows.length > 5000) throw new HttpError(400, 'too_many');
  if (!rows.length) throw new HttpError(400, 'empty', { invalid });
  const lot = String(b.lot || '').trim().slice(0, 40) || ('Lot ' + new Date().toISOString().slice(0, 10));
  const col = a.db.collection('vault_cards'), now = new Date().toISOString();
  let added = 0, duplicates = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const refs = chunk.map((r) => col.doc(cardId(pepper, r.serial)));
    const snaps = await Promise.all(refs.map((r) => r.get()));
    const writes = [];
    chunk.forEach((r, j) => {
      if (snaps[j].exists) { duplicates++; return; }
      writes.push(refs[j].set({ serialTail: r.serial.slice(-4), digits: r.serial.length, keyHash: poolKeyHash(pepper, r.serial, r.key),
        status: 'UNASSIGNED', lot, importedAt: now, importedBy: admin.email, pieceId: null }));
      added++;
    });
    await Promise.all(writes);
  }
  return { added, duplicates, invalid, lot, pool: await pool(a) };
}
async function cardState(a, pepper, serial, key) {
  const s = digitsOf(serial), k = digitsOf(key);
  if (s.length < 8 || s.length > 12 || k.length !== 4) throw new HttpError(400, 'keys_format');
  const ref = a.db.collection('vault_cards').doc(cardId(pepper, s)), d = await ref.get();
  if (!d.exists) return { ref, state: 'unknown' };
  if (!same(poolKeyHash(pepper, s, k), d.data().keyHash)) return { ref, state: 'mismatch' };
  return { ref, state: d.data().status === 'UNASSIGNED' ? 'available' : 'used', data: d.data() };
}
export async function cardCheck(a, env, b) {
  const c = await cardState(a, needPepper(env), b.serial, b.key);
  return { state: c.state, pieceId: c.state === 'used' ? c.data.pieceId : null };
}

/* the garment seal, as a raw UID or as the URL of a tap on this reader or a phone */
/* a raw UID (keyboard-wedge readers may add colons, hyphens or spaces) -> 14 upper-case hex; NXP UIDs start with 04 */
function rawUid(t) {
  const c = String(t || '').replace(/[\s:-]/g, '');
  if (!/^[0-9a-f]{14}$/i.test(c)) return null;
  if (!/^04/i.test(c)) throw new HttpError(400, /04$/i.test(c) ? 'seal_reversed' : 'seal_format');
  return c.toUpperCase();
}
export function readSeal(env, input) {
  const t = String(input || '').trim();
  if (!/uid=/i.test(t)) { const u = rawUid(t); if (u) return { uid: u, counter: -1, verified: false }; throw new HttpError(400, 'seal_format'); }
  let q; try { q = new URL(t).searchParams; } catch (e) { q = new URLSearchParams(t.replace(/^[^?]*\?/, '')); }
  const uid = q.get('uid'), ctr = q.get('ctr'), mac = q.get('cmac');
  if (!uid) throw new HttpError(400, 'seal_format');
  if (!ctr || !mac) { const u = rawUid(uid); if (u) return { uid: u, counter: -1, verified: false }; throw new HttpError(400, 'seal_format'); }
  if (!env.NFC_SDM_MAC_KEY) throw new HttpError(503, 'not_configured');
  const ok = verifySun(env.NFC_SDM_MAC_KEY, uid, ctr, mac);
  if (!ok) throw new HttpError(400, 'seal_invalid');
  return { uid: ok.uid, counter: ok.counter, verified: true };
}

/* ---------------------------------------------------------------- Pair & Seal */
export async function pair(a, env, b, admin) {
  const pepper = needPepper(env);
  const pid = String(b.pid || ''), name = String(b.name || '').trim().slice(0, 90), size = String(b.size || '');
  const edition = String(b.edition || '').trim();
  if (!PID.test(pid) || !name) throw new HttpError(400, 'piece_format');
  if (!SIZES.includes(size)) throw new HttpError(400, 'size_format');
  if (!EDITION.test(edition)) throw new HttpError(400, 'edition_format');
  const seal = readSeal(env, b.nfc);
  const serial = digitsOf(b.serial), key = digitsOf(b.key);
  const orderRef = String(b.orderRef || '').trim().toUpperCase().slice(0, 24);
  const buyerEmail = String(b.buyerEmail || '').trim().toLowerCase();
  if (buyerEmail && !EMAIL.test(buyerEmail)) throw new HttpError(400, 'email_invalid');
  let to = null;
  if (b.gift) { if (!buyerEmail) throw new HttpError(400, 'gift_buyer_email'); to = cleanPerson(b.recipient); }
  const card = await cardState(a, pepper, serial, key);
  if (card.state !== 'available') throw new HttpError(409, 'card_' + card.state);
  if (/Piece \d{2} of/.test(edition)) {
    const dup = await a.db.collection('pieces').where('pid', '==', pid).get();
    if (dup.docs.some((d) => d.data().edition === edition)) throw new HttpError(409, 'edition_taken');
  }
  const uRef = a.db.collection('nfc_uids').doc(seal.uid), now = new Date().toISOString();
  let id = '', tries = 0;
  const piece = await a.db.runTransaction(async (tx) => {
    const [u, c] = [await tx.get(uRef), await tx.get(card.ref)];
    if (u.exists) throw new HttpError(409, 'seal_paired', { pieceId: u.data().pieceId });
    if (!c.exists || c.data().status !== 'UNASSIGNED') throw new HttpError(409, 'card_used');
    let p;
    do { id = passportId(); p = await tx.get(a.db.collection('pieces').doc(id)); } while (p.exists && ++tries < 5);
    if (p.exists) throw new HttpError(500, 'server');
    const rec = { id, pid, name, size, edition, issued: now, status: 'UNCLAIMED', vaultKeyStatus: 'ACTIVE', nfcUid: seal.uid,
      serialHash: pairHash(pepper, 'serial', id, serial), keyHash: pairHash(pepper, 'key', id, key), cardId: card.ref.id,
      orderRef, buyerEmail, isGift: !!to, intendedRecipientName: to, owner: null, prior: [], transfer: null,
      sealedAt: now, sealedBy: admin.email, sealVerified: seal.verified };
    tx.set(a.db.collection('pieces').doc(id), rec);
    tx.set(uRef, { pieceId: id, lastCtr: seal.counter });
    tx.update(card.ref, { status: 'PAIRED', pieceId: id, pairedAt: now });
    return rec;
  });
  return { piece: { id: piece.id, name: piece.name, size: piece.size, edition: piece.edition, issued: piece.issued, isGift: piece.isGift,
    sealVerified: seal.verified, serialTail: serial.slice(-4) }, pool: await pool(a) };
}

/* ---------------------------------------------------------------- the ledger */
function stateOf(p, lock) {
  if (lock) return 'Locked / Security Alert';
  if (p.status === 'CLAIMED' && p.transfer) return 'Transfer Pending';
  if (p.status === 'CLAIMED') return 'Inscribed';
  return 'Awaiting Activation';
}
export async function ledger(a, q) {
  const now = Date.now();
  let docs = (await a.db.collection('pieces').get()).docs.map((d) => d.data());
  docs.sort((x, y) => String(y.issued).localeCompare(String(x.issued)));
  const term = String(q || '').trim().toLowerCase();
  if (term) docs = docs.filter((p) => [p.id, p.name, p.orderRef, p.nfcUid, p.edition, p.owner && p.owner.last].some((v) => String(v || '').toLowerCase().includes(term)));
  docs = docs.slice(0, 400);
  const rows = await Promise.all(docs.map(async (p) => {
    const [u, at] = await Promise.all([a.db.collection('nfc_uids').doc(p.nfcUid || '-').get(), a.db.collection('vault_attempts').doc(p.id).get()]);
    const lock = at.exists && at.data().lockedUntil > now ? at.data().lockedUntil : 0;
    return { id: p.id, name: p.name, size: p.size, edition: p.edition, orderRef: p.orderRef || '', issued: p.issued, isGift: !!p.isGift,
      state: stateOf(p, lock), lockedUntil: lock, fails: at.exists && !lock ? Number(at.data().fails || 0) : 0,
      lastCtr: u.exists ? u.data().lastCtr : null, lastTap: u.exists && u.data().lastTap ? new Date(u.data().lastTap).toISOString() : '',
      owner: p.owner ? [p.owner.title, p.owner.first, p.owner.last].filter(Boolean).join(' ') : '', via: p.owner ? (p.via || 'card') : '',
      sealVerified: p.sealVerified !== false };
  }));
  return { rows, total: rows.length };
}

/* ---------------------------------------------------------------- the 1%: Concierge-Assisted Registration */
export async function concierge(a, b, admin) {
  const id = String(b.id || '').toUpperCase(), email = String(b.email || '').trim().toLowerCase();
  const note = String(b.note || '').trim().slice(0, 240);
  if (!EMAIL.test(email)) throw new HttpError(400, 'email_invalid');
  if (note.length < 12) throw new HttpError(400, 'note_required');
  const person = cleanPerson(b.person);
  let user;
  try { user = await a.auth.getUserByEmail(email); } catch (e) { throw new HttpError(404, 'client_unknown'); }
  if (!user.emailVerified) throw new HttpError(409, 'client_unverified');
  const pRef = a.db.collection('pieces').doc(id), now = new Date().toISOString();
  const p = await a.db.runTransaction(async (tx) => {
    const ps = await tx.get(pRef);
    if (!ps.exists) throw new HttpError(404, 'piece_unknown');
    const cur = ps.data();
    if (cur.status !== 'UNCLAIMED') throw new HttpError(409, 'already_claimed');
    const upd = { status: 'CLAIMED', vaultKeyStatus: 'SEALED', via: 'concierge', inscribedAt: now,
      owner: { uid: user.uid, email, ...person }, concierge: { by: admin.email, at: now, note } };
    if (cur.isGift) upd.giftStatus = 'INSCRIBED_BY_RECIPIENT';
    tx.update(pRef, upd);
    if (cur.cardId) tx.update(a.db.collection('vault_cards').doc(cur.cardId), { status: 'CLAIMED' });
    return { ...cur, ...upd };
  });
  return { id: p.id, owner: [person.title, person.first, person.last].filter(Boolean).join(' ') };
}
export async function release(a, b) {
  const id = String(b.id || '').toUpperCase();
  await a.db.collection('vault_attempts').doc(id).delete();
  return { id };
}
