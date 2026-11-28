/* ==========================================================================
   House of MANTHAI | encoder helpers shared by encode-ntag424.mjs and doctor.mjs
   Pure Node, the same on Windows, macOS and Linux: paths via path.join,
   .env.local read with either line ending, no shell commands.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { domainProblem } from './_ev2.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(here, '..', '..');

/* .env.local at the project root (or next to the encoder); process environment wins */
export function readEnv() {
  const file = [path.join(ROOT, '.env.local'), path.join(here, '.env.local')].find((f) => fs.existsSync(f)) || '';
  const env = {};
  if (file) {
    const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, ''); // Notepad may add a byte-order mark
    for (const line of text.split(/\r\n|\r|\n/)) {
      if (/^\s*#/.test(line)) continue;
      const m = /^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line); if (!m) continue;
      env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
  const get = (k) => (process.env[k] || env[k] || '').trim();
  return { file, get };
}

export const HEX32 = /^[0-9a-f]{32}$/;
/* every problem with the local configuration, as plain sentences; empty when ready */
export function checkConfig(E, { lock = false, allowTest = false } = {}) {
  const out = { base: (E.get('SDM_BASE_URL') || E.get('NEXT_PUBLIC_CANONICAL_URL')).replace(/\/+$/, ''), mac: E.get('NFC_SDM_MAC_KEY').toLowerCase(), master: E.get('ATELIER_CHIP_MASTER_KEY').toLowerCase(), errors: [], warnings: [] };
  if (!E.file && !E.get('NFC_SDM_MAC_KEY')) out.errors.push('No .env.local found. Copy .env.local.example to .env.local at the project root and fill it in.');
  if (!out.base) out.errors.push('SDM_BASE_URL is missing.');
  if (!HEX32.test(out.mac)) out.errors.push('NFC_SDM_MAC_KEY must be exactly 32 hex characters (the same value as in Vercel).');
  else if (/^0+$/.test(out.mac)) out.errors.push('NFC_SDM_MAC_KEY is all zeros, the factory key.');
  const dp = out.base ? domainProblem(out.base) : '';
  if (dp) {
    if (lock) out.errors.push(dp + ' A production chip must never carry a test or local domain.');
    else if (!allowTest) out.errors.push(dp + ' Set the House domain, or add --allow-test-domain for a throwaway test chip.');
    else out.warnings.push(dp + ' Allowed for a test chip only.');
  }
  if (lock) {
    if (!HEX32.test(out.master)) out.errors.push('--production-lock needs ATELIER_CHIP_MASTER_KEY (32 hex).');
    else if (out.master === out.mac) out.errors.push('ATELIER_CHIP_MASTER_KEY must differ from NFC_SDM_MAC_KEY.');
    else if (/^0+$/.test(out.master)) out.errors.push('ATELIER_CHIP_MASTER_KEY cannot be the factory key.');
  } else if (out.master && !HEX32.test(out.master)) out.warnings.push('ATELIER_CHIP_MASTER_KEY is set but is not 32 hex characters.');
  return out;
}

/* ---------------------------------------------------------------- readers
   ACS ACR1552U and ACR1252U show two PC/SC readers each: "... PICC 0" (the
   contactless antenna) and "... SAM 0" (the contact slot). SAM slots are never
   used. Contactless slots (PICC, CL, Contactless) are preferred.            */
export const isSam = (name) => /\bSAM\b/i.test(name);
export const isContactless = (name) => /\b(PICC|CL|Contactless)\b/i.test(name);
export function readerRank(name, wanted) {
  if (isSam(name)) return -1;
  if (wanted && !name.toLowerCase().includes(wanted.toLowerCase())) return -1;
  return isContactless(name) ? 2 : 1;
}
/* label for the doctor's reader list */
export function readerLabel(name, chosen, wanted) {
  if (isSam(name)) return 'SAM [Skipped]';
  if (wanted && !name.toLowerCase().includes(wanted.toLowerCase())) return 'not matching --reader [Skipped]';
  return (isContactless(name) ? 'PICC' : 'reader') + (name === chosen ? ' [Selected]' : ' [Available]');
}

/* --flag and --name value parsing, the same in every shell */
export function parseArgs(argv, flags, valued) {
  const out = { flags: new Set(), values: {}, unknown: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], eq = a.indexOf('='), key = eq > 0 ? a.slice(0, eq) : a;
    if (valued.includes(key)) { const v = eq > 0 ? a.slice(eq + 1) : argv[++i]; if (v === undefined || v.startsWith('--')) out.unknown.push(key + ' needs a value'); else out.values[key] = v; }
    else if (flags.includes(a)) out.flags.add(a);
    else out.unknown.push(a);
  }
  return out;
}

export async function loadNfc() {
  try { return (await import('nfc-pcsc')).default.NFC; }
  catch (e) { const err = new Error('nfc-pcsc is not installed or its PC/SC binding failed to load: ' + (e && e.message ? e.message.split('\n')[0] : e)); err.code = 'nfc_missing'; throw err; }
}

/* Linux only: libpcsclite waits forever for a pcscd that is not running, so look for its socket first */
export function pcscdMissing() {
  if (process.platform !== 'linux') return false;
  return !['/run/pcscd/pcscd.comm', '/var/run/pcscd/pcscd.comm'].some((p) => fs.existsSync(p));
}
/* reader names from a short-lived child process (never hangs the caller) */
export function listReaders(timeoutMs = 8000) {
  return new Promise((resolve) => {
    execFile(process.execPath, [path.join(here, '_list-readers.mjs')], { timeout: timeoutMs, windowsHide: true }, (err, out, errOut) => {
      if (err && err.killed) return resolve({ names: [], errors: ['The PC/SC service did not answer within ' + Math.round(timeoutMs / 1000) + ' s.'] });
      try { resolve(JSON.parse(String(out))); } catch (e) { const t = String(errOut || (err && err.message) || 'reader listing failed'), m = /(?:^|\n)\s*Error: ([^\n]+)/.exec(t); resolve({ names: [], errors: [explainPcsc(m ? m[1] : t.split(/\r?\n/)[0])] }); }
    });
  });
}

/* plain-language hint for the common PC/SC failures */
export function explainPcsc(msg) {
  if (/0x8010006a|Access denied/i.test(msg)) return msg + '. Linux: run from the desktop session (not SSH) or allow your user in polkit for pcscd.';
  if (/0x8010001d|service.*not.*(running|available)|No Smart Card service/i.test(msg)) return msg + '. Start the smart card service (Windows: SCardSvr; Linux: pcscd).';
  if (/0x8010002e|no readers/i.test(msg)) return msg + '. No reader is plugged in.';
  return msg;
}
