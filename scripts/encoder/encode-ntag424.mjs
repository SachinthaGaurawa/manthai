#!/usr/bin/env node
/* ==========================================================================
   House of MANTHAI | Concealed Authenticity Seal encoder (Founder Encoding Station)
   Runs on the House's own computer: Windows 10/11, macOS (Apple Silicon or
   Intel) or Linux. Factory-blank NXP NTAG 424 DNA chips are encoded here, in
   house: the SDM key never leaves this computer and is never sent to a chip
   supplier.

   Readers: any PC/SC (CCID) ISO 14443-4 contactless reader. Tested targets:
   ACS ACR1552U (primary, in PC/SC mode), ACS ACR1252U, Identiv uTrust 3700 F.
   SAM (contact) slots are skipped automatically; contactless PICC/CL slots
   are preferred.

     cd scripts/encoder
     npm install                 once
     npm run doctor              checks the computer, reader and .env.local
     npm run encode:test         test mode (key 0 stays factory, rewritable)
     npm run encode:prod         production lock (permanent, type SEAL)

   Options: --test-mode | --production-lock, --allow-test-domain (test chips
   only), --reader "<part of the reader name>", --once (one chip, then exit).

   Reads .env.local at the project root (never committed):
     SDM_BASE_URL            https://<the House domain>   (no vercel.app, no localhost)
     NFC_SDM_MAC_KEY         32 hex, the same value as in Vercel
     ATELIER_CHIP_MASTER_KEY 32 hex, production lock only; keep it offline
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { encodeChip } from './_flow.js';
import { readEnv, checkConfig, parseArgs, readerRank, isSam, loadNfc, pcscdMissing, explainPcsc } from './_local.js';

const A = parseArgs(process.argv.slice(2), ['--production-lock', '--test-mode', '--allow-test-domain', '--once', '--help', '-h'], ['--reader']);
if (A.flags.has('--help') || A.flags.has('-h')) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split(/\r?\n/).slice(2, 28).join('\n')); process.exit(0); }
if (A.unknown.length) { console.error('Unknown option: ' + A.unknown.join(', ') + '. Use --help.'); process.exit(2); }
const LOCK = A.flags.has('--production-lock'), ALLOW_TEST = A.flags.has('--allow-test-domain'), ONCE = A.flags.has('--once'), WANT = A.values['--reader'] || '';
if (LOCK && A.flags.has('--test-mode')) { console.error('Choose --test-mode or --production-lock, not both.'); process.exit(2); }
function stop(msg) { console.error('\n✗ ' + msg + '\n'); process.exit(1); }

/* Safety gates 1 (domain) and 2 (mode) */
const E = readEnv();
const C = checkConfig(E, { lock: LOCK, allowTest: ALLOW_TEST });
if (C.errors.length) stop(C.errors.join('\n  '));
for (const w of C.warnings) console.warn('\n! ' + w + ' Never stitch this chip into a garment.');

console.log('\nHouse of MANTHAI · Concealed Authenticity Seal encoder');
console.log('  Mode      ' + (LOCK ? 'PRODUCTION LOCK (permanent)' : 'test mode (key 0 stays at the factory value)'));
console.log('  Seal URL  ' + C.base + '/v?uid=…&ctr=…&cmac=…');
console.log('  SDM key   ' + C.mac.slice(0, 4) + '…' + C.mac.slice(-4) + ' from ' + (E.file ? path.relative(process.cwd(), E.file) || '.env.local' : 'the environment'));
if (WANT) console.log('  Reader    name containing "' + WANT + '"');
if (LOCK) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const a = await rl.question('\nProduction-locked chips can never be rewritten. Type SEAL to continue: ');
  rl.close();
  if (a.trim() !== 'SEAL') stop('Not confirmed. Nothing was written.');
}

if (pcscdMissing()) stop('pcscd is not running. Run: sudo systemctl enable --now pcscd   (then npm run doctor)');
let NFC;
try { NFC = await loadNfc(); } catch (e) { stop(e.message + '\n  Run "npm install" inside scripts/encoder, then "npm run doctor".'); }

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

/* one reader is used: the best-ranked contactless slot; SAM slots never */
let active = null, busy = false, done = 0;
const seen = new Map();
let nfc;
try { nfc = new NFC(); } catch (e) { stop('The PC/SC service refused: ' + explainPcsc(e.message) + '\n  Run "npm run doctor".'); }
console.log('\nWaiting for a contactless reader (ACR1552U, ACR1252U, uTrust 3700 F or any PC/SC reader)…');
const noReader = setTimeout(() => { if (!active) console.log('No usable reader yet. Plug it in, or run "npm run doctor" to see what the computer detects.'); }, 6000);

function choose(reader) {
  const name = reader.reader.name, rank = readerRank(name, WANT);
  seen.set(name, reader);
  if (isSam(name)) { console.log('  · Skipped ' + name + ' (contact SAM slot)'); return; }
  if (rank < 0) { console.log('  · Skipped ' + name + ' (does not match --reader)'); return; }
  if (active && readerRank(active.reader.name, WANT) >= rank) { console.log('  · Also found ' + name + ' (not used; pick it with --reader)'); return; }
  if (active) console.log('  · Switching to ' + name + ' (contactless slot)');
  active = reader; clearTimeout(noReader);
  console.log('Reader ready: ' + name + '. Place one chip flat on the reader.');
}

nfc.on('reader', (reader) => {
  reader.autoProcessing = false;
  choose(reader);
  reader.on('card', async () => {
    if (reader !== active || busy) return; busy = true;
    const send = (apdu) => reader.transmit(apdu, 258);
    try {
      const r = await encodeChip(send, { baseUrl: C.base, macKey: C.mac, masterKey: LOCK ? C.master : null, lock: LOCK, log: (m) => console.log('  · ' + m) });
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
  reader.on('error', (e) => console.error('Reader error (' + reader.reader.name + '): ' + e.message));
  reader.on('end', () => {
    seen.delete(reader.reader.name);
    if (reader !== active) return;
    console.log('Reader disconnected: ' + reader.reader.name);
    active = null;
    for (const r of seen.values()) if (readerRank(r.reader.name, WANT) >= 0) choose(r);
  });
});
nfc.on('error', (e) => console.error('PC/SC error: ' + e.message + ' (run "npm run doctor")'));
process.on('SIGINT', () => { console.log('\n' + done + ' chip' + (done === 1 ? '' : 's') + ' encoded. Goodbye.'); process.exit(0); });
