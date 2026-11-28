#!/usr/bin/env node
/* ==========================================================================
   House of MANTHAI | Atelier pairing: one garment seal + one Solid Metal Vault Card
   Run at the atelier, on the House's own computer, when a piece is sealed in
   its lacquered box. It writes the item record to the House Archive; the
   Archive Serial and Vault Key are stored only as peppered digests.

   FIREBASE_SERVICE_ACCOUNT='<json>' VAULT_PEPPER='<same secret as Vercel>' \
   node scripts/provision-piece.mjs \
     --id MNT-7KQ2M9P --pid aurelia-gown --name "Aurelia Gown" --size S \
     --edition "Edition 01 · Piece 05 of 15" --nfc 04DE5F1EACC040 \
     --serial 48291074 --key 7392 --order ORD-8F2K1Q --buyer client@example.com \
     [--gift --to "Ms. Anjali De Silva"]

   Never commit the service account, the pepper or a card's Vault Key.
   ========================================================================== */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { pairHash, digitsOf, TITLES } from '../api/vault/_logic.js';

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i];
  if (!k.startsWith('--')) continue;
  const v = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true;
  args[k.slice(2)] = v;
}
function fail(m) { console.error('provision: ' + m); process.exit(1); }

const id = String(args.id || '').toUpperCase();
const nfc = String(args.nfc || '').toUpperCase();
const serial = digitsOf(args.serial), key = digitsOf(args.key);
if (!/^MNT-[A-Z0-9]{4,12}$/.test(id)) fail('--id must look like MNT-7KQ2M9P');
if (!args.pid || !args.name || !args.size) fail('--pid, --name and --size are required');
if (!/^[0-9A-F]{14}$/.test(nfc)) fail('--nfc must be the 7-byte chip UID in hex (14 characters)');
if (serial.length < 8 || serial.length > 12) fail('--serial must be the 8 to 12 digit Archive Serial');
if (!/^\d{4}$/.test(key)) fail('--key must be the 4-digit Vault Key');
if (!process.env.VAULT_PEPPER || process.env.VAULT_PEPPER.length < 24) fail('VAULT_PEPPER (24+ characters, the same as on Vercel) is required');
if (!process.env.FIREBASE_SERVICE_ACCOUNT) fail('FIREBASE_SERVICE_ACCOUNT is required');

let to = null;
if (args.gift) {
  const w = String(args.to || '').trim().split(/\s+/).filter(Boolean);
  const title = TITLES.includes(w[0]) ? w.shift() : '';
  if (w.length < 2) fail('--gift needs --to "Title First Last" (the recipient name the buyer gave)');
  to = { title, first: w[0], last: w.slice(1).join(' ') };
}

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
const db = getFirestore(initializeApp({ credential: cert(sa), projectId: sa.project_id }));
const pepper = process.env.VAULT_PEPPER;

const pRef = db.collection('pieces').doc(id), uRef = db.collection('nfc_uids').doc(nfc);
await db.runTransaction(async (tx) => {
  const [p, u] = [await tx.get(pRef), await tx.get(uRef)];
  if (p.exists) throw new Error(id + ' already exists in the House Archive');
  if (u.exists) throw new Error('seal ' + nfc + ' is already paired to ' + u.data().pieceId);
  tx.set(pRef, {
    id, pid: String(args.pid), name: String(args.name), size: String(args.size), edition: String(args.edition || ''),
    issued: new Date().toISOString(), status: 'UNCLAIMED', vaultKeyStatus: 'ACTIVE', nfcUid: nfc,
    serialHash: pairHash(pepper, 'serial', id, serial), keyHash: pairHash(pepper, 'key', id, key),
    orderRef: String(args.order || ''), buyerEmail: String(args.buyer || '').trim().toLowerCase(),
    isGift: !!args.gift, intendedRecipientName: to, owner: null, prior: [], transfer: null,
  });
  tx.set(uRef, { pieceId: id, lastCtr: -1 });
});
console.log('Paired ' + id + ' with seal ' + nfc + '. The Vault Card is now bound to this piece alone.');
