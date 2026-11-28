/* node tests/atelier.test.mjs : the Atelier rules against a small in-memory Firestore */
import assert from 'node:assert';
import { signSun } from '../api/vault/_sun.js';
import * as L from '../api/vault/_logic.js';
import * as A from '../api/atelier/_logic.js';

const store = {};
const key = (c, id) => c + '/' + id;
function snap(c, id) { const v = store[key(c, id)]; return { id, exists: v !== undefined, data: () => v && JSON.parse(JSON.stringify(v)), ref: ref(c, id) }; }
function ref(c, id) { return { c, id, get: async () => snap(c, id), set: async (v) => { store[key(c, id)] = v; }, delete: async () => { delete store[key(c, id)]; } }; }
const getPath = (o, p) => p.split('.').reduce((x, k) => x == null ? undefined : x[k], o);
const docsOf = (c, f) => Object.keys(store).filter((k) => k.startsWith(c + '/') && (!f || f(store[k]))).map((k) => snap(c, k.slice(c.length + 1)));
const db = {
  collection: (c) => ({ doc: (id) => ref(c, id), get: async () => ({ docs: docsOf(c) }), where: (f, op, v) => ({ get: async () => ({ docs: docsOf(c, (x) => getPath(x, f) === v) }) }) }),
  runTransaction: async (fn) => { const w = []; const tx = { get: async (r) => snap(r.c, r.id), set: (r, v) => w.push(() => store[key(r.c, r.id)] = v), update: (r, v) => w.push(() => store[key(r.c, r.id)] = { ...store[key(r.c, r.id)], ...v }), delete: (r) => w.push(() => delete store[key(r.c, r.id)]) }; const out = await fn(tx); w.forEach((f) => f()); return out; }
};
const users = { 'client@x.com': { uid: 'c1', emailVerified: true }, 'new@x.com': { uid: 'c2', emailVerified: false } };
const a = { db, auth: { getUserByEmail: async (e) => { if (!users[e]) throw new Error('no user'); return users[e]; } } };
const K = '00112233445566778899aabbccddeeff';
const env = { NFC_SDM_MAC_KEY: K, VAULT_PEPPER: 'pepper-pepper-pepper-pepper', ATELIER_ADMIN_SECRET: 'atelier-secret-0123456789', ATELIER_ADMIN_EMAILS: 'founder@manthai.lk, second@manthai.lk' };
const rej = async (p, status, code) => { try { await p; assert.fail('expected ' + code); } catch (e) { assert.equal(e.code, code, e.message); assert.equal(e.status, status); return e; } };
const founder = { uid: 'f1', email: 'founder@manthai.lk', emailVerified: true };

// gate: only an allowlisted, verified email with the secret; five wrong secrets pause even the right one
await rej(A.gate(a, env, null, env.ATELIER_ADMIN_SECRET), 404, 'not_found');
await rej(A.gate(a, env, { ...founder, emailVerified: false }, env.ATELIER_ADMIN_SECRET), 404, 'not_found');
await rej(A.gate(a, env, { uid: 'x', email: 'someone@x.com', emailVerified: true }, env.ATELIER_ADMIN_SECRET), 404, 'not_found');
await rej(A.gate(a, { ...env, ATELIER_ADMIN_SECRET: 'short' }, founder, 'short'), 404, 'not_found');
const admin = await A.gate(a, env, founder, env.ATELIER_ADMIN_SECRET);
assert.equal(admin.email, 'founder@manthai.lk');
const f2 = { uid: 'f2', email: 'second@manthai.lk', emailVerified: true };
for (let i = 0; i < 5; i++) await rej(A.gate(a, env, f2, 'wrong'), 404, 'not_found');
await rej(A.gate(a, env, f2, env.ATELIER_ADMIN_SECRET), 404, 'not_found');

// CSV import: header skipped, bad and repeated rows reported, nothing stored in plain text
const csv = 'archiveSerial,vaultKey\n48291074,7392\n51730962,2048\n123,1\n60418237,55\n48291074,1111\n70000001,0001\n';
const imp = await A.importCards(a, env, { csv, lot: 'Lot A' }, admin);
assert.equal(imp.added, 3); assert.deepEqual(imp.invalid, [4, 5, 6]);
assert.deepEqual(imp.pool, { available: 3, paired: 0, claimed: 0 });
assert.ok(!JSON.stringify(store).includes('48291074') && !JSON.stringify(store).includes('7392'));
const again = await A.importCards(a, env, { csv: '48291074,7392' }, admin);
assert.equal(again.added, 0); assert.equal(again.duplicates, 1);

// card check
assert.equal((await A.cardCheck(a, env, { serial: 'MNT · 4829 · 1074', key: '7392' })).state, 'available');
assert.equal((await A.cardCheck(a, env, { serial: '48291074', key: '7393' })).state, 'mismatch');
assert.equal((await A.cardCheck(a, env, { serial: '99999999', key: '7392' })).state, 'unknown');

// Pair & Seal with a genuine tap URL from the reader
const UID = '04A1B2C3D4E5F6', t = signSun(K, UID, 3);
const url = 'https://manthai.lk/v?uid=' + t.uid + '&ctr=' + t.ctr + '&cmac=' + t.cmac;
const base = { pid: 'aurelia-gown', name: 'Aurelia Liquid Silk-Velvet Evening Gown', size: 'S', edition: 'Edition 01 · Piece 05 of 15', serial: '48291074', key: '7392', orderRef: 'ord-8f2k1q', buyerEmail: 'Buyer@x.com' };
await rej(A.pair(a, env, { ...base, nfc: url.replace(t.cmac, '0000000000000000') }, admin), 400, 'seal_invalid');
await rej(A.pair(a, env, { ...base, nfc: url, key: '7393' }, admin), 409, 'card_mismatch');
await rej(A.pair(a, env, { ...base, nfc: url, edition: 'Edition 1' }, admin), 400, 'edition_format');
const pr = await A.pair(a, env, { ...base, nfc: url }, admin);
assert.match(pr.piece.id, /^MNT-[A-Z0-9]{7}$/); assert.equal(pr.piece.sealVerified, true);
assert.deepEqual(pr.pool, { available: 2, paired: 1, claimed: 0 });
const rec = store[key('pieces', pr.piece.id)];
assert.equal(rec.orderRef, 'ORD-8F2K1Q'); assert.equal(rec.buyerEmail, 'buyer@x.com'); assert.equal(store[key('nfc_uids', UID)].lastCtr, 3);
// the sealing tap itself can never be replayed by a client
await rej(L.tap(a, env, t, null), 409, 'seal_replayed');
// same seal, same card, same edition number: refused
await rej(A.pair(a, env, { ...base, nfc: url, serial: '51730962', key: '2048', edition: 'Edition 01 · Piece 06 of 15' }, admin), 409, 'seal_paired');
await rej(A.pair(a, env, { ...base, nfc: '04B7C8D9E0F1A2' }, admin), 409, 'card_used');
await rej(A.pair(a, env, { ...base, nfc: '04B7C8D9E0F1A2', serial: '51730962', key: '2048' }, admin), 409, 'edition_taken');

// the client inscribes it with the same card: the pool marks it CLAIMED
const t2 = signSun(K, UID, 4), tp = await L.tap(a, env, t2, null);
const buyer = { uid: 'b1', email: 'buyer@x.com', emailVerified: true };
await L.claim(a, env, { session: tp.session, serial: '48291074', key: '7392', person: { title: 'Ms.', first: 'Anjali', last: 'De Silva' } }, buyer);
assert.deepEqual(await A.pool(a), { available: 2, paired: 0, claimed: 1 });

// a gift: raw UID (no tap), recipient name kept for the recipient
const g = await A.pair(a, env, { ...base, nfc: '04b7c8d9e0f1a2', serial: '51730962', key: '2048', edition: 'Edition 01 · Piece 06 of 15', gift: true, recipient: { title: 'Ms.', first: 'Nethmi', last: 'Perera' } }, admin);
assert.equal(g.piece.sealVerified, false); assert.equal(store[key('pieces', g.piece.id)].intendedRecipientName.first, 'Nethmi');
await rej(A.pair(a, env, { ...base, nfc: '04C3D4E5F6A7B8', serial: '70000001', key: '0001', edition: 'Edition 01 · Batch of 24', gift: true, buyerEmail: '', recipient: { first: 'A', last: 'B' } }, admin), 400, 'gift_buyer_email');

// ledger
const lg = await A.ledger(a, '');
assert.equal(lg.total, 2);
assert.equal(lg.rows.find((r) => r.id === pr.piece.id).state, 'Inscribed');
assert.equal(lg.rows.find((r) => r.id === g.piece.id).state, 'Awaiting Activation');
assert.equal((await A.ledger(a, 'nethmi')).total, 0);
assert.equal((await A.ledger(a, g.piece.id.toLowerCase())).total, 1);

// a pause shows as a security alert and can be released after a human check
store[key('vault_attempts', g.piece.id)] = { fails: 0, lockedUntil: Date.now() + 60000 };
assert.equal((await A.ledger(a, g.piece.id)).rows[0].state, 'Locked / Security Alert');
await A.release(a, { id: g.piece.id });
assert.equal((await A.ledger(a, g.piece.id)).rows[0].state, 'Awaiting Activation');

// concierge: a verified client account, a written note, an unclaimed piece
const cp = { id: g.piece.id, email: 'client@x.com', person: { title: 'Ms.', first: 'Nethmi', last: 'Perera' }, note: 'Seen in person at the atelier with ID.' };
await rej(A.concierge(a, { ...cp, note: 'ok' }, admin), 400, 'note_required');
await rej(A.concierge(a, { ...cp, email: 'nobody@x.com' }, admin), 404, 'client_unknown');
await rej(A.concierge(a, { ...cp, email: 'new@x.com' }, admin), 409, 'client_unverified');
const cc = await A.concierge(a, cp, admin);
assert.equal(cc.owner, 'Ms. Nethmi Perera');
assert.equal(store[key('pieces', g.piece.id)].via, 'concierge');
await rej(A.concierge(a, cp, admin), 409, 'already_claimed');
assert.deepEqual(await A.pool(a), { available: 1, paired: 0, claimed: 2 });

// seal input forms
assert.deepEqual(A.readSeal(env, '04a1b2c3d4e5f6'), { uid: '04A1B2C3D4E5F6', counter: -1, verified: false });
assert.throws(() => A.readSeal(env, 'hello'), /seal_format/);
console.log('atelier ok');
