/* ==========================================================================
   House of MANTHAI | NTAG 424 DNA secure messaging (EV2), pure functions
   Used only by the local encoder (encode-ntag424.mjs). No reader code here,
   so every step can be tested without hardware.
   References: NXP NT4H2421Gx datasheet, AN12196 (session keys, SDM).
   ========================================================================== */
import crypto from 'node:crypto';
import { cmac } from '../../api/vault/_sun.js';

export { cmac };
export const ZERO16 = Buffer.alloc(16);

export function aesCbc(key, iv, data, decrypt) {
  const c = (decrypt ? crypto.createDecipheriv : crypto.createCipheriv)('aes-128-cbc', key, iv);
  c.setAutoPadding(false);
  return Buffer.concat([c.update(data), c.final()]);
}
export const rotl1 = (b) => Buffer.concat([b.subarray(1), b.subarray(0, 1)]);
export function xorBuf(a, b) { const o = Buffer.alloc(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] ^ b[i]; return o; }
/* ISO/IEC 9797-1 padding method 2: always 0x80, then zeros to a 16-byte boundary */
export function pad(b) { const n = 16 - (b.length % 16); return Buffer.concat([b, Buffer.from([0x80]), Buffer.alloc(n - 1)]); }
export function unpad(b) { let i = b.length - 1; while (i >= 0 && b[i] === 0) i--; if (i < 0 || b[i] !== 0x80) throw new Error('bad padding'); return b.subarray(0, i); }
/* the 8-byte truncated MAC: bytes 1,3,5..15 of the full CMAC */
export function macT(key, msg) { const f = cmac(key, msg), o = Buffer.alloc(8); for (let i = 0; i < 8; i++) o[i] = f[i * 2 + 1]; return o; }
export const le16 = (n) => Buffer.from([n & 255, (n >> 8) & 255]);
export const le24 = (n) => Buffer.from([n & 255, (n >> 8) & 255, (n >> 16) & 255]);

/* CRC32 as the chip wants it for ChangeKey: IEEE 802.3 polynomial without the final XOR (JAMCRC), least significant byte first */
const TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export function crc32nk(buf) { let c = 0xffffffff; for (const b of buf) c = TABLE[(c ^ b) & 255] ^ (c >>> 8); c >>>= 0; return Buffer.from([c & 255, (c >>> 8) & 255, (c >>> 16) & 255, (c >>> 24) & 255]); }

/* session keys after AuthenticateEV2First (datasheet 9.1.7). Byte 15 of RndA/RndB is the first byte. */
export function sessionKeys(key, rndA, rndB) {
  const tail = Buffer.concat([rndA.subarray(0, 2), xorBuf(rndA.subarray(2, 8), rndB.subarray(0, 6)), rndB.subarray(6, 16), rndA.subarray(8, 16)]);
  const sv1 = Buffer.concat([Buffer.from('A55A00010080', 'hex'), tail]);
  const sv2 = Buffer.concat([Buffer.from('5AA500010080', 'hex'), tail]);
  return { enc: cmac(key, sv1), mac: cmac(key, sv2) };
}

/* ---------------------------------------------------------------- APDUs */
export const apdu = (ins, data, p1 = 0, p2 = 0) => Buffer.concat([Buffer.from([0x90, ins, p1, p2, data.length]), data, Buffer.from([0x00])]);
export const SELECT_APP = Buffer.from('00A4040007D276000085010100', 'hex');
export const SELECT_NDEF = Buffer.from('00A4000C02E104', 'hex');
export const updateBinary = (data, offset = 0) => Buffer.concat([Buffer.from([0x00, 0xd6, (offset >> 8) & 0x7f, offset & 255, data.length]), data]);
export const READ_BINARY = Buffer.from('00B0000000', 'hex');

/* An authenticated session. send(apduBuffer) -> Promise<Buffer> of the full response with SW1 SW2. */
export class Session {
  constructor(send) { this.send = send; this.ti = null; this.ctr = 0; this.k = null; }
  static sw(r) { return r.subarray(r.length - 2).toString('hex').toUpperCase(); }
  async authenticate(keyNo, key, rndA = crypto.randomBytes(16)) {
    const r1 = await this.send(apdu(0x71, Buffer.from([keyNo, 0x00])));
    if (Session.sw(r1) !== '91AF') throw Object.assign(new Error('auth_refused'), { sw: Session.sw(r1) });
    const rndB = aesCbc(key, ZERO16, r1.subarray(0, 16), true);
    const r2 = await this.send(apdu(0xaf, aesCbc(key, ZERO16, Buffer.concat([rndA, rotl1(rndB)]))));
    if (Session.sw(r2) !== '9100') throw Object.assign(new Error('auth_failed'), { sw: Session.sw(r2) });
    const plain = aesCbc(key, ZERO16, r2.subarray(0, 32), true);
    if (!plain.subarray(4, 20).equals(rotl1(rndA))) throw new Error('auth_rnda');
    this.ti = plain.subarray(0, 4); this.ctr = 0; this.k = sessionKeys(key, rndA, rndB);
    return this;
  }
  iv(prefix, ctr) { return aesCbc(this.k.enc, ZERO16, Buffer.concat([Buffer.from(prefix, 'hex'), this.ti, le16(ctr), Buffer.alloc(8)])); }
  /* the bytes a Full-mode command carries after the header: E(data) || MACt */
  wrapFull(cmd, header, data) {
    const enc = data.length ? aesCbc(this.k.enc, this.iv('A55A', this.ctr), pad(data)) : Buffer.alloc(0);
    const mac = macT(this.k.mac, Buffer.concat([Buffer.from([cmd]), le16(this.ctr), this.ti, header, enc]));
    return Buffer.concat([header, enc, mac]);
  }
  /* Full mode command; checkMac=false only where the session ends with the command (changing the key in use) */
  async full(cmd, header, data, checkMac = true) {
    const r = await this.send(apdu(cmd, this.wrapFull(cmd, header, data)));
    const sw = Session.sw(r);
    if (sw !== '9100') throw Object.assign(new Error('cmd_refused'), { sw, cmd });
    this.ctr++;
    const body = r.subarray(0, r.length - 2);
    if (checkMac) {
      const resp = body.subarray(0, body.length - 8), mac = body.subarray(body.length - 8);
      const want = macT(this.k.mac, Buffer.concat([Buffer.from([0x00]), le16(this.ctr), this.ti, resp]));
      if (!want.equals(mac)) throw new Error('response_mac');
      return resp;
    }
    return body;
  }
  /* ChangeFileSettings (5F) for one file, Full mode */
  changeFileSettings(fileNo, settings) { return this.full(0x5f, Buffer.from([fileNo]), settings); }
  /* ChangeKey (C4). Changing a key other than the one in use needs its old value. */
  changeKey(keyNo, newKey, version, oldKey, authKeyNo = 0) {
    if (keyNo === authKeyNo) return this.full(0xc4, Buffer.from([keyNo]), Buffer.concat([newKey, Buffer.from([version])]), false);
    return this.full(0xc4, Buffer.from([keyNo]), Buffer.concat([xorBuf(newKey, oldKey), Buffer.from([version]), crc32nk(newKey)]));
  }
}

/* ---------------------------------------------------------------- the NDEF seal file */
/* NDEF URI record for https://<rest> with the SDM placeholders; offsets are from the start of file 02 (after the 2-byte NLEN) */
export function sealFile(baseUrl) {
  const u = new URL('/v', baseUrl);
  if (u.protocol !== 'https:') throw new Error('https_only');
  const rest = u.host + u.pathname + '?uid=' + '0'.repeat(14) + '&ctr=' + '0'.repeat(6) + '&cmac=' + '0'.repeat(16);
  const payload = Buffer.concat([Buffer.from([0x04]), Buffer.from(rest, 'ascii')]); // 0x04 = "https://"
  if (payload.length > 255) throw new Error('url_too_long');
  const record = Buffer.concat([Buffer.from([0xd1, 0x01, payload.length, 0x55]), payload]);
  const file = Buffer.concat([Buffer.from([(record.length >> 8) & 255, record.length & 255]), record]);
  const start = 2 + 4 + 1; // NLEN, record header, URI prefix code
  const at = (s) => start + rest.indexOf(s) + s.length;
  return { file, url: 'https://' + rest, uidOffset: at('uid='), ctrOffset: at('ctr='), macOffset: at('cmac=') };
}

/* ChangeFileSettings data for file 02: plain comm, SDM on, ASCII UID + counter mirror, MAC over an empty input.
   Access rights go on the wire least significant byte first:
     AccessRights    [RW<<4 | Change, Read<<4 | Write]
     SDMAccessRights [RFU<<4 | SDMCtrRet, SDMMetaRead<<4 | SDMFileRead]   */
export function sdmSettings(seal, { locked }) {
  const access = locked ? Buffer.from([0x00, 0xe0]) /* RW 0, Change 0, Read free, Write key 0 */ : Buffer.from([0xe0, 0xee]) /* factory: RW free, Change 0, Read free, Write free */;
  return Buffer.concat([
    Buffer.from([0x40]), access,
    Buffer.from([0xc1]),            // UID mirror, SDMReadCtr mirror, ASCII
    Buffer.from([0xff, 0xe2]),      // SDMCtrRet none, SDMMetaRead plain (E), SDMFileRead key 2
    le24(seal.uidOffset), le24(seal.ctrOffset),
    le24(seal.macOffset),           // SDMMACInputOffset = SDMMACOffset: MAC over an empty input
    le24(seal.macOffset)
  ]);
}

/* read the URL back out of an NDEF file read with ReadBinary */
export function urlFromFile(buf) {
  const n = (buf[0] << 8) | buf[1], rec = buf.subarray(2, 2 + n);
  if (rec[0] !== 0xd1 || rec[3] !== 0x55) throw new Error('not_uri_record');
  const pre = { 0x00: '', 0x01: 'http://www.', 0x02: 'https://www.', 0x03: 'http://', 0x04: 'https://' }[rec[4]];
  return pre + rec.subarray(5, 4 + rec[2]).toString('ascii');
}

/* the domain gate: production chips must carry the House's own domain */
export function domainProblem(baseUrl) {
  let u; try { u = new URL(baseUrl); } catch (e) { return 'SDM_BASE_URL is not a valid URL.'; }
  if (u.protocol !== 'https:') return 'SDM_BASE_URL must start with https://.';
  if (u.pathname !== '/' || u.search || u.hash) return 'SDM_BASE_URL must be the domain only, for example https://www.example.com.';
  if (/(^|\.)vercel\.app$/i.test(u.hostname)) return 'SDM_BASE_URL points at a vercel.app test domain (' + u.hostname + ').';
  if (/^(localhost|127\.|0\.0\.0\.0|\[::1\])/i.test(u.hostname) || u.hostname.endsWith('.local')) return 'SDM_BASE_URL points at a local address (' + u.hostname + ').';
  return '';
}
