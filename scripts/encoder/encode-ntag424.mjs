#!/usr/bin/env node
/* ==========================================================================
   House of MANTHAI | Concealed Authenticity Seal encoder (ACS ACR1252U)
   Runs on the atelier computer in Colombo only. Factory-blank NXP NTAG 424
   DNA chips are encoded here, in-house: the House SDM key never leaves this
   computer and is never sent to a chip supplier.

     cd scripts/encoder && npm install          (once)
     node encode-ntag424.mjs                     test mode (default)
     node encode-ntag424.mjs --production-lock   final seals for stitching

   Reads ../../.env.local (never committed):
     SDM_BASE_URL            https://<the House domain>   (no vercel.app, no localhost)
     NFC_SDM_MAC_KEY         32 hex, the same value as in Vercel
     ATELIER_CHIP_MASTER_KEY 32 hex, production lock only; keep it offline

   Safety gate 1  the domain: a vercel.app or local address is refused unless
                  --allow-test-domain, and never together with --production-lock.
   Safety gate 2  test mode leaves key 0 at the factory value, so the chip can
                  be encoded again. --production-lock changes key 0 to the
                  Atelier master key and removes write access for good.
   Every chip is read back like a phone and its MAC checked with the House
   key before it is reported ready. Place chips one at a time; Ctrl+C ends.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { encodeChip } from './_flow.js';
import { domainProblem } from './_ev2.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = new Set(process.argv.slice(2));
const LOCK = args.has('--production-lock'), ALLOW_TEST = args.has('--allow-test-domain'), ONCE = args.has('--once');
if (args.has('--help') || args.has('-h')) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(2, 24).join('\n')); process.exit(0); }
for (const a of args) if (!['--production-lock', '--test-mode', '--allow-test-domain', '--once'].includes(a)) { console.error('Unknown option ' + a + '. Use --help.'); process.exit(2); }
if (LOCK && args.has('--test-mode')) { console.error('Choose --test-mode or --production-lock, not both.'); process.exit(2); }

/* ---------------------------------------------------------------- .env.local */
function readEnv() {
  const file = [path.join(here, '..', '..', '.env.local'), path.join(here, '.env.local')].find((f) => fs.existsSync(f));
  const env = {};
  if (file) for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line); if (!m || line.trim().startsWith('#')) continue;
    env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return { file, get: (k) => process.env[k] || env[k] || '' };
}
const E = readEnv();
const BASE = (E.get('SDM_BASE_URL') || E.get('NEXT_PUBLIC_CANONICAL_URL')).replace(/\/+$/, '');
const MAC = E.get('NFC_SDM_MAC_KEY').toLowerCase(), MASTER = E.get('ATELIER_CHIP_MASTER_KEY').toLowerCase();
const HEX32 = /^[0-9a-f]{32}$/;
function stop(msg) { console.error('\n✗ ' + msg + '\n'); process.exit(1); }

if (!E.file && !process.env.NFC_SDM_MAC_KEY) stop('No .env.local found next to the project. Copy .env.local.example to .env.local and fill it in.');
if (!BASE) stop('SDM_BASE_URL is missing in .env.local.');
if (!HEX32.test(MAC)) stop('NFC_SDM_MAC_KEY in .env.local must be exactly 32 hex characters (the same value as in Vercel).');
if (/^0+$/.test(MAC)) stop('NFC_SDM_MAC_KEY is all zeros: that is the factory key. Generate the House key first.');

/* Safety gate 1: the domain */
const problem = domainProblem(BASE);
if (problem) {
  if (LOCK) stop(problem + ' A production chip must never carry a test or local domain. Set SDM_BASE_URL to the House domain.');
  if (!ALLOW_TEST) stop(problem + ' Chips are permanent: set SDM_BASE_URL to the House domain, or add --allow-test-domain for a throwaway test chip.');
  console.warn('\n! Test domain allowed: ' + BASE + '. Use this chip for testing only, never in a garment.');
}
/* Safety gate 2: the mode */
if (LOCK) {
  if (!HEX32.test(MASTER)) stop('--production-lock needs ATELIER_CHIP_MASTER_KEY (32 hex) in .env.local. Generate it on this computer and keep a sealed offline copy.');
  if (MASTER === MAC) stop('ATELIER_CHIP_MASTER_KEY must be different from NFC_SDM_MAC_KEY.');
  if (/^0+$/.test(MASTER)) stop('ATELIER_CHIP_MASTER_KEY cannot be the factory key.');
}

console.log('\nHouse of MANTHAI · Concealed Authenticity Seal encoder');
console.log('  Mode      ' + (LOCK ? 'PRODUCTION LOCK (permanent)' : 'test mode (key 0 stays at the factory value)'));
console.log('  Seal URL  ' + BASE + '/v?uid=…&ctr=…&cmac=…');
console.log('  SDM key   ' + MAC.slice(0, 4) + '…' + MAC.slice(-4) + ' from ' + (E.file ? path.relative(process.cwd(), E.file) || '.env.local' : 'the environment'));
if (LOCK) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const a = await rl.question('\nProduction-locked chips can never be rewritten. Type SEAL to continue: ');
  rl.close();
  if (a.trim() !== 'SEAL') stop('Not confirmed. Nothing was written.');
}

/* ---------------------------------------------------------------- the reader */
let NFC;
try { ({ NFC } = (await import('nfc-pcsc')).default); }
catch (e) { stop('The reader library is not installed. Run "npm install" inside scripts/encoder first (needs the PC/SC service: pcscd on Linux; built in on macOS and Windows).'); }

const WHY = {
  not_ntag424: 'This is not an NTAG 424 DNA chip.',
  chip_locked: 'This chip is already production-locked. It is finished and cannot be rewritten.',
  auth_refused: 'The chip refused authentication. It may be locked by another key.',
  auth_failed: 'The chip refused the factory key: it was locked elsewhere. Do not use it.',
  cmd_refused: 'The chip refused a setting. If it was encoded before with a different SDM key, it cannot be re-encoded.',
  write_ndef: 'The chip refused the URL write: its write access is locked.',
  readback_mac: 'The read-back did not verify with the House key. Do not stitch this chip.',
  readback_domain: 'The read-back URL is not the House URL. Do not stitch this chip.',
  url_too_long: 'SDM_BASE_URL is too long for the chip.'
};
let busy = false, done = 0;
const nfc = new NFC();
console.log('\nWaiting for the ACR1252U reader…');
nfc.on('reader', (reader) => {
  if (/SAM/i.test(reader.reader.name)) return; // the reader's SAM slot, not the antenna
  reader.autoProcessing = false;
  console.log('Reader ready: ' + reader.reader.name + '. Place one chip flat on the reader.');
  reader.on('card', async () => {
    if (busy) return; busy = true;
    const send = (apdu) => reader.transmit(apdu, 258);
    try {
      const r = await encodeChip(send, { baseUrl: BASE, macKey: MAC, masterKey: LOCK ? MASTER : null, lock: LOCK, log: (m) => console.log('  · ' + m) });
      done++;
      console.log('\n✓ Chip Encoded, Verified & Ready for Stitching — UID: ' + r.uid);
      console.log('  Read-back counter ' + r.counter + (r.locked ? ' · production-locked' : ' · test mode, key 0 still factory'));
      console.log('  For the Atelier (Pair & Seal, step 3) paste: ' + r.url);
      console.log('\nRemove the chip. Place the next one, or press Ctrl+C to finish (' + done + ' encoded).');
    } catch (e) {
      console.error('\n✗ ' + (WHY[e.message] || 'The chip did not answer as expected (' + e.message + ').') + (e.sw ? ' [status ' + e.sw + ']' : ''));
      console.error('  Lift the chip, place it again and keep it still. Nothing is reported ready unless it verifies.\n');
    } finally {
      busy = false;
      if (ONCE) { nfc.close(); process.exit(0); }
    }
  });
  reader.on('error', (e) => console.error('Reader error: ' + e.message));
  reader.on('end', () => console.log('Reader disconnected: ' + reader.reader.name));
});
nfc.on('error', (e) => console.error('PC/SC error: ' + e.message));
process.on('SIGINT', () => { console.log('\n' + done + ' chip' + (done === 1 ? '' : 's') + ' encoded. Goodbye.'); process.exit(0); });
