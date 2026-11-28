/* node tests/encoder.test.mjs : the chip encoder against NXP vectors and a simulated NTAG 424 DNA */
import assert from 'node:assert';
import crypto from 'node:crypto';
import { sessionKeys, aesCbc, ZERO16, crc32nk, rotl1, macT, pad, unpad, le16, sealFile, sdmSettings, urlFromFile, domainProblem, xorBuf } from '../scripts/encoder/_ev2.js';
import { encodeChip } from '../scripts/encoder/_flow.js';
import { signSun, verifySun } from '../api/vault/_sun.js';

/* AN12196: AuthenticateEV2First with the factory key */
const K0 = Buffer.alloc(16);
assert.equal(aesCbc(K0, ZERO16, Buffer.from('A04C124213C186F22399D33AC2A30215', 'hex'), true).toString('hex').toUpperCase(), 'B9E2FC789B64BF237CCCAA20EC7E6E48');
const sk = sessionKeys(K0, Buffer.from('13C5DB8A5930439FC3DEF9A4C675360F', 'hex'), Buffer.from('B9E2FC789B64BF237CCCAA20EC7E6E48', 'hex'));
assert.equal(sk.enc.toString('hex').toUpperCase(), '1309C877509E5A215007FF0ED19CA564');
assert.equal(sk.mac.toString('hex').toUpperCase(), '4C6626F5E72EA694202139295C7A7FC7');
/* JAMCRC of "123456789" is 0x340BC6D9, sent least significant byte first */
assert.equal(crc32nk(Buffer.from('123456789')).toString('hex'), 'd9c60b34');
assert.deepEqual(unpad(pad(Buffer.from('ab', 'hex'))), Buffer.from('ab', 'hex'));
assert.equal(pad(Buffer.alloc(16)).length, 32);

/* the domain gate */
assert.ok(domainProblem('https://manthai.vercel.app'));
assert.ok(domainProblem('http://manthai.com'));
assert.ok(domainProblem('https://localhost:3000'));
assert.ok(domainProblem('https://manthai.com/v'));
assert.equal(domainProblem('https://www.houseofmanthai.com'), '');

/* the seal file layout */
const seal = sealFile('https://www.houseofmanthai.com');
assert.equal(seal.url, 'https://www.houseofmanthai.com/v?uid=00000000000000&ctr=000000&cmac=0000000000000000');
assert.equal(urlFromFile(seal.file), seal.url);
const txt = seal.file.toString('latin1');
assert.equal(txt.slice(seal.uidOffset, seal.uidOffset + 14), '0'.repeat(14));
assert.equal(txt.slice(seal.uidOffset - 4, seal.uidOffset), 'uid=');
assert.equal(txt.slice(seal.ctrOffset - 4, seal.ctrOffset), 'ctr=');
assert.equal(txt.slice(seal.macOffset - 5, seal.macOffset), 'cmac=');
const st = sdmSettings(seal, { locked: false });
assert.equal(st.subarray(0, 6).toString('hex'), '40e0eec1ffe2');
assert.equal(sdmSettings(seal, { locked: true }).subarray(1, 3).toString('hex'), '00e0');

/* ---------------------------------------------------------------- a simulated NTAG 424 DNA */
function chip(uidHex) {
  const C = { keys: [0, 1, 2, 3, 4].map(() => Buffer.alloc(16)), ver: [0, 0, 0, 0, 0], file: Buffer.alloc(256), sdm: null, access: Buffer.from('e0ee', 'hex'), ctr: 0, app: false, ef: false, auth: null, pend: null, log: [] };
  const ok = (b = Buffer.alloc(0), s = '9100') => Buffer.concat([b, Buffer.from(s, 'hex')]);
  function rmac(resp) { return macT(C.auth.mac, Buffer.concat([Buffer.from([0]), le16(C.auth.ctr), C.auth.ti, resp])); }
  function full(cmd, hdrLen, data) {
    const a = C.auth, hdr = data.subarray(0, hdrLen), enc = data.subarray(hdrLen, data.length - 8), mac = data.subarray(data.length - 8);
    const want = macT(a.mac, Buffer.concat([Buffer.from([cmd]), le16(a.ctr), a.ti, hdr, enc]));
    if (!want.equals(mac)) return null;
    const iv = aesCbc(a.enc, ZERO16, Buffer.concat([Buffer.from('A55A', 'hex'), a.ti, le16(a.ctr), Buffer.alloc(8)]));
    a.ctr++;
    return { hdr, plain: unpad(aesCbc(a.enc, iv, enc, true)) };
  }
  C.send = async (ap) => {
    const hex = ap.toString('hex').toUpperCase();
    if (hex === '00A4040007D276000085010100') { C.app = true; C.ef = false; C.auth = null; return Buffer.from('9000', 'hex'); }
    if (hex === '00A4000C02E104') { C.ef = C.app; return Buffer.from(C.ef ? '9000' : '6A82', 'hex'); }
    if (ap[0] === 0x00 && ap[1] === 0xd6) {
      if (!C.ef || (C.access[1] & 0x0f) !== 0x0e) return Buffer.from('6982', 'hex');
      ap.subarray(5, 5 + ap[4]).copy(C.file, (ap[2] << 8) | ap[3]); return Buffer.from('9000', 'hex');
    }
    if (hex === '00B0000000') {
      const out = Buffer.from(C.file);
      if (C.sdm) {
        C.ctr++;
        const p = signSun(C.keys[2].toString('hex'), uidHex, C.ctr);
        out.write(p.uid, C.sdm.uid, 'ascii'); out.write(p.ctr, C.sdm.ctr, 'ascii'); out.write(p.cmac, C.sdm.mac, 'ascii');
      }
      return Buffer.concat([out, Buffer.from('9000', 'hex')]);
    }
    if (ap[0] !== 0x90) return Buffer.from('6E00', 'hex');
    const ins = ap[1], data = ap.subarray(5, 5 + ap[4]);
    if (ins === 0x64) return ok(Buffer.from([C.ver[data[0]]]));
    if (ins === 0x71) { const rb = crypto.randomBytes(16); C.pend = { no: data[0], rb }; return ok(aesCbc(C.keys[data[0]], ZERO16, rb), '91AF'); }
    if (ins === 0xaf && C.pend) {
      const k = C.keys[C.pend.no], p = aesCbc(k, ZERO16, data, true), ra = p.subarray(0, 16);
      if (!p.subarray(16).equals(rotl1(C.pend.rb))) { C.pend = null; return Buffer.from('91AE', 'hex'); }
      const ti = crypto.randomBytes(4), s = sessionKeys(k, ra, C.pend.rb);
      C.auth = { no: C.pend.no, ti, ctr: 0, enc: s.enc, mac: s.mac }; C.pend = null;
      return ok(aesCbc(k, ZERO16, Buffer.concat([ti, rotl1(ra), Buffer.alloc(12)])));
    }
    if (!C.auth) return Buffer.from('91AE', 'hex');
    if (ins === 0x5f) {
      if (C.auth.no !== 0) return Buffer.from('919D', 'hex');
      const r = full(ins, 1, data); if (!r) return Buffer.from('911E', 'hex');
      const p = r.plain; assert.equal(p[0], 0x40); assert.equal(p[3], 0xc1); assert.equal(p.subarray(4, 6).toString('hex'), 'ffe2');
      const o = (i) => p[i] | (p[i + 1] << 8) | (p[i + 2] << 16);
      assert.equal(o(12), o(15), 'MAC input offset equals MAC offset');
      C.access = Buffer.from(p.subarray(1, 3)); C.sdm = { uid: o(6), ctr: o(9), mac: o(15) };
      return ok(rmac(Buffer.alloc(0)));
    }
    if (ins === 0xc4) {
      const r = full(ins, 1, data); if (!r) return Buffer.from('911E', 'hex');
      const no = r.hdr[0], p = r.plain;
      if (no === C.auth.no) { C.keys[no] = Buffer.from(p.subarray(0, 16)); C.ver[no] = p[16]; C.auth = null; return ok(); }
      const nk = xorBuf(p.subarray(0, 16), C.keys[no]);
      if (!crc32nk(nk).equals(p.subarray(17, 21))) return Buffer.from('911E', 'hex');
      C.keys[no] = nk; C.ver[no] = p[16];
      return ok(rmac(Buffer.alloc(0)));
    }
    return Buffer.from('911C', 'hex');
  };
  return C;
}

const MAC = crypto.randomBytes(16).toString('hex'), MASTER = crypto.randomBytes(16).toString('hex');
const base = 'https://www.houseofmanthai.com';

/* test mode: factory chip -> encoded, key 0 untouched, phone tap verifies on the server */
const c1 = chip('04A1B2C3D4E580');
const r1 = await encodeChip(c1.send, { baseUrl: base, macKey: MAC });
assert.equal(r1.uid, '04A1B2C3D4E580'); assert.equal(r1.counter, 1); assert.equal(r1.locked, false);
assert.ok(c1.keys[0].equals(Buffer.alloc(16))); assert.equal(c1.keys[2].toString('hex'), MAC);
/* a later tap: counter rises and the server accepts it */
const tap = new URL(urlFromFile((await c1.send(Buffer.from('00B0000000', 'hex'))).subarray(0, 256)));
const v = verifySun(MAC, tap.searchParams.get('uid'), tap.searchParams.get('ctr'), tap.searchParams.get('cmac'));
assert.deepEqual(v, { uid: '04A1B2C3D4E580', counter: 2 });
/* test mode can run again on the same chip (key 2 already holds the House key) */
const r1b = await encodeChip(c1.send, { baseUrl: base, macKey: MAC });
assert.equal(r1b.counter, 3);

/* production lock: key 0 becomes the master key, writes need key 0, the chip is refused afterwards */
const c2 = chip('04FFEE11223380');
await assert.rejects(encodeChip(c2.send, { baseUrl: base, macKey: MAC, lock: true }), /master_key_required/);
const r2 = await encodeChip(c2.send, { baseUrl: base, macKey: MAC, masterKey: MASTER, lock: true });
assert.equal(r2.locked, true); assert.equal(c2.keys[0].toString('hex'), MASTER); assert.equal(c2.access.toString('hex'), '00e0');
assert.equal((await c2.send(Buffer.from('00D6000001' + '00', 'hex'))).toString('hex'), '6982');
await assert.rejects(encodeChip(c2.send, { baseUrl: base, macKey: MAC, masterKey: MASTER, lock: true }), /chip_locked/);

/* a chip keyed with another MAC key fails the read-back check instead of passing silently */
const c3 = chip('04123456789A80');
c3.send = ((orig) => async (ap) => { const r = await orig(ap); if (ap[1] === 0xc4) c3.keys[2] = crypto.randomBytes(16); return r; })(c3.send);
await assert.rejects(encodeChip(c3.send, { baseUrl: base, macKey: MAC }), /readback_mac/);

console.log('encoder ok');
