#!/usr/bin/env node
/* ==========================================================================
   House of MANTHAI | encoder doctor:  npm run doctor  [-- --reader "<name>"]
   Checks the computer, the PC/SC service, the readers and .env.local.
   Never writes to a chip. Works the same in PowerShell, CMD, Terminal, Bash.
   ========================================================================== */
import os from 'node:os';
import fs from 'node:fs';
import { execFile } from 'node:child_process';
import { readEnv, checkConfig, parseArgs, readerRank, readerLabel, loadNfc, listReaders, pcscdMissing } from './_local.js';

const A = parseArgs(process.argv.slice(2), [], ['--reader']);
const WANT = A.values['--reader'] || '';
let problems = 0;
const ok = (m) => console.log('  ✓ ' + m), warn = (m) => console.log('  ! ' + m), bad = (m) => { problems++; console.log('  ✗ ' + m); };
const run = (cmd, args) => new Promise((res) => execFile(cmd, args, { timeout: 5000, windowsHide: true }, (err, out) => res({ err, out: String(out || '') })));

console.log('\nHouse of MANTHAI · encoder doctor\n');

/* 1. computer and Node */
console.log('Computer');
const plat = { win32: 'Windows', darwin: 'macOS', linux: 'Linux' }[process.platform] || process.platform;
ok(plat + ' ' + os.release() + ' · ' + process.arch + (process.platform === 'darwin' && process.arch === 'arm64' ? ' (Apple Silicon)' : ''));
const major = Number(process.versions.node.split('.')[0]);
if (major === 20 || major === 22) ok('Node ' + process.versions.node + ' (LTS with reader library prebuilds)');
else if (major < 20) bad('Node ' + process.versions.node + ' is too old. Install Node 22 LTS.');
else warn('Node ' + process.versions.node + ': the reader library (@pokusew/pcsclite) has prebuilds for Node 20/22 LTS. If "npm install" tries to compile, install Node 22 LTS instead.');

/* 2. PC/SC service */
console.log('\nSmart card service (PC/SC)');
if (process.platform === 'win32') {
  const r = await run('sc.exe', ['query', 'SCardSvr']);
  if (/RUNNING/i.test(r.out)) ok('Windows Smart Card service (SCardSvr) is running');
  else bad('Windows Smart Card service (SCardSvr) is not running. In PowerShell (as administrator): Set-Service SCardSvr -StartupType Automatic; Start-Service SCardSvr');
} else if (process.platform === 'linux') {
  const r = await run('systemctl', ['is-active', 'pcscd']);
  const sock = ['/run/pcscd/pcscd.comm', '/var/run/pcscd/pcscd.comm'].some((p) => fs.existsSync(p));
  if (/^active/m.test(r.out) || sock) ok('pcscd is running');
  else {
    const s = await run('systemctl', ['is-active', 'pcscd.socket']);
    if (/^active/m.test(s.out)) ok('pcscd starts on demand (pcscd.socket is active)');
    else bad('pcscd is not running. Install pcscd, libccid and libpcsclite-dev, then: sudo systemctl enable --now pcscd');
  }
} else if (process.platform === 'darwin') {
  ok('macOS has PC/SC built in (CryptoTokenKit); CCID readers need no driver');
} else warn('Unknown platform: make sure a PC/SC service is installed.');

/* 3. readers */
console.log('\nReaders');
let names = [];
try {
  await loadNfc();
  ok('Reader library loaded');
  if (pcscdMissing()) bad('Skipping the reader scan until pcscd is running.');
  else { const r = await listReaders(); names = r.names; for (const e of r.errors) warn('PC/SC: ' + e); }
} catch (e) { bad(e.message + '. Run "npm install" in scripts/encoder (see docs/ATELIER.md for build tools).'); }
if (names.length) {
  const usable = names.filter((n) => readerRank(n, WANT) >= 0).sort((a, b) => readerRank(b, WANT) - readerRank(a, WANT));
  const chosen = usable[0] || '';
  for (const n of names) console.log('    ' + n + '  →  ' + readerLabel(n, chosen, WANT));
  if (chosen) ok('The encoder will use: ' + chosen);
  else bad(WANT ? 'No contactless reader matches "' + WANT + '".' : 'Only SAM (contact) slots were detected. Is the reader in PC/SC mode?');
  if (names.some((n) => /ACR1552/i.test(n)) && chosen) warn('ACR1552U: if it is in Keyboard Emulation mode it will not appear as a PC/SC reader. Switch it to PC/SC (CCID) mode for encoding.');
} else if (!pcscdMissing()) bad('No reader detected. Plug the reader in directly (not through an unpowered hub) and run the doctor again.');

/* 4. .env.local */
console.log('\nConfiguration (.env.local)');
const E = readEnv();
if (E.file) ok('Found ' + E.file);
const C = checkConfig(E, { lock: false, allowTest: false });
if (C.base) console.log('    SDM_BASE_URL  ' + C.base);
for (const m of C.errors) bad(m);
for (const m of C.warnings) warn(m);
if (!C.errors.length) ok('NFC_SDM_MAC_KEY is 32 hex · SDM_BASE_URL is a production domain');
const P = checkConfig(E, { lock: true });
if (!P.errors.length) ok('Ready for --production-lock');
else { const extra = P.errors.filter((m) => !C.errors.includes(m)); warn('Not ready for --production-lock' + (extra.length ? ': ' + extra.join(' ') : ' (see above)')); }

console.log('\n' + (problems ? problems + ' problem' + (problems === 1 ? '' : 's') + ' to fix. Nothing was written to any chip.' : 'All set. Nothing was written to any chip. Next: npm run encode:test') + '\n');
process.exit(problems ? 1 : 0);
