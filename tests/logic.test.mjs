import assert from 'node:assert';
import { signSun } from '../api/vault/_sun.js';
import * as L from '../api/vault/_logic.js';
// --- tiny fake Firestore
const store = {};
const key = (c, id) => c + '/' + id;
function snap(c, id) { const v = store[key(c, id)]; return { id, exists: v !== undefined, data: () => v && JSON.parse(JSON.stringify(v)), ref: ref(c, id) }; }
function ref(c, id) { return { c, id, get: async () => snap(c, id), set: async (v) => { store[key(c, id)] = v; } }; }
function getPath(o, p) { return p.split('.').reduce((x, k) => x == null ? undefined : x[k], o); }
const db = {
  collection: (c) => ({ doc: (id) => ref(c, id), where: (f, op, v) => ({ get: async () => ({ docs: Object.keys(store).filter(k => k.startsWith(c + '/') && getPath(store[k], f) === v).map(k => snap(c, k.slice(c.length + 1))) }) }) }),
  runTransaction: async (fn) => { const w = []; const tx = { get: async (r) => snap(r.c, r.id), set: (r, v) => w.push(() => store[key(r.c, r.id)] = v), update: (r, v) => w.push(() => store[key(r.c, r.id)] = { ...store[key(r.c, r.id)], ...v }), delete: (r) => w.push(() => delete store[key(r.c, r.id)]) }; const out = await fn(tx); w.forEach(f => f()); return out; }
};
const a = { db }, K = '00112233445566778899aabbccddeeff', env = { NFC_SDM_MAC_KEY: K, VAULT_PEPPER: 'pepper-pepper-pepper-pepper' };
function sun(uid, n) { return signSun(K, uid, n); }
function prov(id, uid, serial, k, extra) { store[key('pieces', id)] = { id, pid: 'aurelia-gown', name: 'Aurelia Gown', size: 'S', edition: 'Edition 01', status: 'UNCLAIMED', serialHash: L.pairHash(env.VAULT_PEPPER, 'serial', id, serial), keyHash: L.pairHash(env.VAULT_PEPPER, 'key', id, k), buyerEmail: 'buyer@x.com', orderRef: 'ORD-1', isGift: false, owner: null, prior: [], ...extra }; store[key('nfc_uids', uid)] = { pieceId: id, lastCtr: -1 }; }
const rej = async (p, status, code) => { try { await p; assert.fail('expected ' + code); } catch (e) { assert.equal(e.code, code, e.message); assert.equal(e.status, status); return e; } };
const buyer = { uid: 'u1', email: 'buyer@x.com', emailVerified: true }, other = { uid: 'u2', email: 'her@x.com', emailVerified: true };
const P = { title: 'Ms.', first: 'Anjali', last: 'De Silva' };

prov('MNT-AAAA1', '04AABBCCDDEEFF', '48291074', '7392');
// no key configured
await rej(L.tap(a, {}, sun('04AABBCCDDEEFF', 1), null), 503, 'not_configured');
// forged
await rej(L.tap(a, env, { ...sun('04AABBCCDDEEFF', 1), cmac: '0000000000000000' }, null), 403, 'seal_invalid');
// genuine
const t1 = await L.tap(a, env, sun('04AABBCCDDEEFF', 5), null);
assert.ok(t1.session && t1.piece.status === 'UNCLAIMED' && t1.piece.claimed === false && !('serialHash' in t1.piece));
// replay same and lower counter
await rej(L.tap(a, env, sun('04AABBCCDDEEFF', 5), null), 409, 'seal_replayed');
await rej(L.tap(a, env, sun('04AABBCCDDEEFF', 3), null), 409, 'seal_replayed');
// unknown chip
await rej(L.tap(a, env, sun('04000000000001', 1), null), 404, 'seal_unknown');
// claim without session / without sign-in
await rej(L.claim(a, env, { session: 'nope', serial: '48291074', key: '7392', person: P }, buyer), 401, 'tap_required');
await rej(L.claim(a, env, { session: t1.session, serial: '48291074', key: '7392', person: P }, null), 401, 'sign_in_required');
// 4 mismatches then lock on 5th
for (let i = 4; i >= 1; i--) { const e = await rej(L.claim(a, env, { session: t1.session, serial: '48291074', key: '0000', person: P }, buyer), 400, 'mismatch'); assert.equal(e.extra.remaining, i); }
const s1 = await L.session(a, t1.session); assert.equal(s1.remaining, 1);
const lk = await rej(L.claim(a, env, { session: t1.session, serial: '48291074', key: '0001', person: P }, buyer), 423, 'locked');
assert.ok(lk.extra.lockedUntil > Date.now() + 29 * 60000);
// even the right key is refused while locked
await rej(L.claim(a, env, { session: t1.session, serial: '48291074', key: '7392', person: P }, buyer), 423, 'locked');
// unlock by time travel
store[key('vault_attempts', 'MNT-AAAA1')].lockedUntil = Date.now() - 1;
// another valid card serial for a different piece cannot claim this one
prov('MNT-BBBB2', '04112233445566', '11112222', '1234');
await rej(L.claim(a, env, { session: t1.session, serial: '11112222', key: '1234', person: P }, buyer), 400, 'mismatch');
// bad name
await rej(L.claim(a, env, { session: t1.session, serial: '48291074', key: '7392', person: { first: '1', last: 'X' } }, buyer), 400, 'name_first');
const c1 = await L.claim(a, env, { session: t1.session, serial: '48291074', key: '7392', person: P }, buyer);
assert.equal(c1.piece.status, 'CLAIMED'); assert.equal(c1.piece.mine, true); assert.equal(c1.piece.owner.first, 'Anjali');
assert.equal(store[key('pieces', 'MNT-AAAA1')].vaultKeyStatus, 'SEALED');
// session consumed
await rej(L.claim(a, env, { session: t1.session, serial: '48291074', key: '7392', person: P }, buyer), 401, 'tap_required');
// tap after claim: no session, third party sees no owner
const t2 = await L.tap(a, env, sun('04AABBCCDDEEFF', 6), other);
assert.ok(!t2.session); assert.equal(t2.piece.claimed, true); assert.equal(t2.piece.owner, undefined);
const t3 = await L.tap(a, env, sun('04AABBCCDDEEFF', 7), buyer); assert.equal(t3.piece.mine, true);
// public piece read
const pv = await L.piece(a, 'mnt-aaaa1', null); assert.equal(pv.piece.owner, undefined); assert.equal(pv.piece.claimed, true);
assert.equal((await L.mine(a, buyer)).pieces.length, 1); assert.equal((await L.mine(a, other)).pieces.length, 0);

// gift flow
prov('MNT-GIFT1', '04999999999999', '22223333', '4321', { isGift: true, intendedRecipientName: { title: 'Ms.', first: 'Nadia', last: 'Perera' } });
const g1 = await L.tap(a, env, sun('04999999999999', 1), buyer);
assert.equal(g1.gift.forBuyer, true); assert.equal(g1.gift.recipientFirst, 'Nadia'); assert.equal(g1.suggestedName, undefined);
const gb = await rej(L.claim(a, env, { session: g1.session, serial: '22223333', key: '4321', person: P }, buyer), 409, 'gift_buyer');
assert.equal(gb.extra.recipientFirst, 'Nadia');
const acq1 = await L.acquisitions(a, buyer);
assert.deepEqual(acq1.gifts[0], { pid: 'aurelia-gown', name: 'Aurelia Gown', size: 'S', orderRef: 'ORD-1', status: 'Dispatched · Awaiting Recipient’s Inscription' });
assert.equal(JSON.stringify(acq1).includes('MNT-GIFT1'), false);
const g2 = await L.tap(a, env, sun('04999999999999', 2), other);
assert.equal(g2.gift.forBuyer, false); assert.equal(g2.suggestedName.first, 'Nadia');
const gc = await L.claim(a, env, { session: g2.session, serial: '22223333', key: '4321', person: { title: 'Ms.', first: 'Nadia', last: 'Perera' } }, other);
assert.equal(gc.piece.owner.last, 'Perera');
const acq2 = await L.acquisitions(a, buyer); assert.equal(acq2.gifts[0].status, 'Inscribed by Recipient');
await rej(L.piece(a, 'MNT-GIFT1', buyer).then(r => { if (r.piece.owner) throw new L.HttpError(500, 'leak'); throw new L.HttpError(200, 'fine'); }), 200, 'fine');
// keep for self
prov('MNT-GIFT2', '04888888888888', '33334444', '5555', { isGift: true, intendedRecipientName: { title: '', first: 'Mira', last: 'Fern' } });
const k1 = await L.tap(a, env, sun('04888888888888', 1), buyer);
const kc = await L.claim(a, env, { session: k1.session, serial: '33334444', key: '5555', person: P, keepForSelf: true }, buyer); assert.equal(kc.piece.mine, true);
// awaiting row for buyer
prov('MNT-WAIT1', '04777777777777', '55556666', '1111');
const acq3 = await L.acquisitions(a, buyer); assert.equal(acq3.awaiting.length, 2); assert.equal(acq3.awaiting[1].name, 'Aurelia Gown');

// transfer
await rej(L.transferStart(a, { id: 'MNT-AAAA1', email: 'z@x.com' }, other), 403, 'not_owner');
const ts = await L.transferStart(a, { id: 'MNT-AAAA1', email: 'her@x.com' }, buyer);
const tv = await L.transferView(a, { token: ts.token }); assert.equal(tv.to, 'h•••@x.com');
await rej(L.transferAccept(a, { token: ts.token, person: P }, { uid: 'u3', email: 'z@x.com', emailVerified: true }), 403, 'transfer_email');
const ta = await L.transferAccept(a, { token: ts.token, person: { first: 'Her', last: 'Self' } }, other);
assert.equal(ta.piece.owner.first, 'Her'); assert.equal(ta.piece.prior[0].initials, 'AD');
await rej(L.transferAccept(a, { token: ts.token, person: P }, other), 404, 'transfer_invalid');
assert.equal((await L.mine(a, buyer)).pieces.length, 1); // MNT-GIFT2 only
console.log('logic ok');
