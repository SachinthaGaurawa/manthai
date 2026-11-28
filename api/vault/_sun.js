/* ==========================================================================
   House of MANTHAI | NTAG 424 DNA Secure Unique NFC (SUN) message check
   The Concealed Authenticity Seal is an NXP NTAG 424 DNA chip. Each tap
   produces a fresh URL:  /v?uid=<7-byte UID>&ctr=<3-byte counter>&cmac=<8-byte MAC>
   (plain UID and counter mirroring, MAC over an empty input, as in NXP
   application note AN12196).
   Byte contract (scripts/encoder must match it exactly):
     uid   14 hex  the 7-byte UID, as mirrored
     ctr    6 hex  SDMReadCtr as mirrored: most significant byte FIRST
     cmac  16 hex  the truncated SDMMAC
     SV2   = 3CC3 0001 0080 || UID || SDMReadCtr (least significant byte first)
     KSes  = AES-CMAC(SDM File Read key, SV2)
     MAC   = AES-CMAC(KSes, empty input), keeping bytes 1,3,5..15 (0-based)
   Checked against AN12196: uid 041E3C8A2D6B80, ctr 000006 -> 4B00064004B0B3D3. The MAC is keyed with the chip's SDM File Read
   key, so a URL cannot be forged without the key, and the counter rises on
   every tap, so an old URL cannot be replayed.
   Files starting with "_" are helpers, not Vercel routes.
   ========================================================================== */
import crypto from 'node:crypto';

const ZERO = Buffer.alloc(16);
function aesEcb(key, block) {
  const c = crypto.createCipheriv('aes-128-ecb', key, null);
  c.setAutoPadding(false);
  return Buffer.concat([c.update(block), c.final()]);
}
function shift1(b) {
  const out = Buffer.alloc(16);
  let carry = 0;
  for (let i = 15; i >= 0; i--) { out[i] = ((b[i] << 1) | carry) & 0xff; carry = b[i] >> 7; }
  return out;
}
function xor(a, b) { const o = Buffer.alloc(16); for (let i = 0; i < 16; i++) o[i] = a[i] ^ b[i]; return o; }

/* AES-128 CMAC (RFC 4493) */
export function cmac(key, msg) {
  const L = aesEcb(key, ZERO);
  let K1 = shift1(L); if (L[0] & 0x80) K1[15] ^= 0x87;
  let K2 = shift1(K1); if (K1[0] & 0x80) K2[15] ^= 0x87;
  const n = Math.max(1, Math.ceil(msg.length / 16));
  const complete = msg.length > 0 && msg.length % 16 === 0;
  let last;
  if (complete) last = xor(msg.subarray((n - 1) * 16, n * 16), K1);
  else {
    const pad = Buffer.alloc(16);
    msg.subarray((n - 1) * 16).copy(pad);
    pad[msg.length - (n - 1) * 16] = 0x80;
    last = xor(pad, K2);
  }
  let X = ZERO;
  for (let i = 0; i < n - 1; i++) X = aesEcb(key, xor(X, msg.subarray(i * 16, i * 16 + 16)));
  return aesEcb(key, xor(X, last));
}

const HEX = /^[0-9a-f]+$/i;
/* -> { uid: '041E3C8A2D6B80', counter: 6 } when the MAC is genuine, otherwise null */
export function verifySun(keyHex, uidHex, ctrHex, macHex) {
  if (!keyHex || !HEX.test(keyHex) || keyHex.length !== 32) return null;
  if (!uidHex || !HEX.test(uidHex) || uidHex.length !== 14) return null;
  if (!ctrHex || !HEX.test(ctrHex) || ctrHex.length !== 6) return null;
  if (!macHex || !HEX.test(macHex) || macHex.length !== 16) return null;
  const key = Buffer.from(keyHex, 'hex'), uid = Buffer.from(uidHex, 'hex');
  /* the URL carries the counter most significant byte first; SV2 takes it least significant byte first */
  const ctrMsb = Buffer.from(ctrHex, 'hex'), ctr = Buffer.from([ctrMsb[2], ctrMsb[1], ctrMsb[0]]);
  const sv2 = Buffer.concat([Buffer.from('3CC300010080', 'hex'), uid, ctr]);
  const ses = cmac(key, sv2);
  const full = cmac(ses, Buffer.alloc(0));
  const mac = Buffer.alloc(8);
  for (let i = 0; i < 8; i++) mac[i] = full[i * 2 + 1];
  const given = Buffer.from(macHex, 'hex');
  if (!crypto.timingSafeEqual(mac, given)) return null;
  return { uid: uidHex.toUpperCase(), counter: ctr[0] | (ctr[1] << 8) | (ctr[2] << 16) };
}

/* the URL parameters a genuine chip with this key would produce at this counter (tests and the local encoder) */
export function signSun(keyHex, uidHex, counter) {
  const uid = Buffer.from(uidHex, 'hex'), le = Buffer.from([counter & 255, (counter >> 8) & 255, (counter >> 16) & 255]);
  const ses = cmac(Buffer.from(keyHex, 'hex'), Buffer.concat([Buffer.from('3CC300010080', 'hex'), uid, le]));
  const full = cmac(ses, Buffer.alloc(0)), mac = Buffer.alloc(8);
  for (let i = 0; i < 8; i++) mac[i] = full[i * 2 + 1];
  return { uid: uidHex.toUpperCase(), ctr: Buffer.from([le[2], le[1], le[0]]).toString('hex').toUpperCase(), cmac: mac.toString('hex').toUpperCase() };
}
