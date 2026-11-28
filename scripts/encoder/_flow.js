/* ==========================================================================
   House of MANTHAI | the encoding of one Concealed Authenticity Seal
   encodeChip(send, opts) runs the whole sequence on a chip that is on the
   reader. send(apdu) -> Promise<Buffer> is the only link to the hardware,
   so the sequence is tested against a simulated chip (tests/encoder.test.mjs).
     1  select the NDEF application, read key versions
     2  write the URL template into file 02 (plain, before authentication)
     3  authenticate with key 0 (the factory key; a locked chip is refused)
     4  ChangeFileSettings: SDM on, UID + counter mirror, MAC with key 2
     5  ChangeKey 2 -> NFC_SDM_MAC_KEY
     6  production lock only: ChangeKey 0 -> ATELIER_CHIP_MASTER_KEY
     7  read the tag back like a phone and verify its MAC with the House key
   ========================================================================== */
import { verifySun } from '../../api/vault/_sun.js';
import { Session, SELECT_APP, SELECT_NDEF, READ_BINARY, updateBinary, apdu, sealFile, sdmSettings, urlFromFile } from './_ev2.js';

const ZERO = Buffer.alloc(16);
const VERSION = 0x01; // key version written with House keys; factory keys are version 0x00
const sw = (r) => Session.sw(r);
function must(r, ok, what) { if (!ok.includes(sw(r))) throw Object.assign(new Error(what), { sw: sw(r) }); return r; }

export async function keyVersion(send, keyNo) {
  const r = await send(apdu(0x64, Buffer.from([keyNo])));
  return sw(r) === '9100' ? r[0] : null;
}

export async function encodeChip(send, { baseUrl, macKey, masterKey = null, lock = false, log = () => {} }) {
  if (lock && !masterKey) throw new Error('master_key_required');
  const seal = sealFile(baseUrl);
  must(await send(SELECT_APP), ['9000'], 'not_ntag424');

  const v0 = await keyVersion(send, 0), v2 = await keyVersion(send, 2);
  /* a production-locked chip is finished: it is never rewritten */
  if (v0 === VERSION) throw new Error('chip_locked');
  /* a chip encoded before in test mode already holds the House key in slot 2 */
  const old2 = v2 === VERSION ? Buffer.from(macKey, 'hex') : ZERO;
  log('Key 0 is the factory key; key 2 ' + (v2 === VERSION ? 'already holds the House key (test-mode chip)' : 'is the factory key') + '.');

  must(await send(SELECT_NDEF), ['9000'], 'select_ndef');
  must(await send(updateBinary(seal.file)), ['9000'], 'write_ndef');
  must(await send(SELECT_APP), ['9000'], 'not_ntag424');
  log('URL template written: ' + seal.url);

  const s = await new Session(send).authenticate(0, ZERO);
  await s.changeFileSettings(0x02, sdmSettings(seal, { locked: lock }));
  log('Secure Dynamic Messaging switched on (UID + counter mirror, MAC with key 2).');
  await s.changeKey(2, Buffer.from(macKey, 'hex'), VERSION, old2);
  log('Key 2 set to the House SDM key.');
  if (lock) {
    await s.changeKey(0, Buffer.from(masterKey, 'hex'), VERSION, null, 0);
    log('Key 0 changed to the Atelier master key: the chip is production-locked.');
  }

  /* read back exactly as a phone would: no authentication */
  must(await send(SELECT_APP), ['9000'], 'not_ntag424');
  must(await send(SELECT_NDEF), ['9000'], 'select_ndef');
  const r = must(await send(READ_BINARY), ['9000'], 'read_ndef');
  const url = urlFromFile(r.subarray(0, r.length - 2));
  const q = new URL(url), want = new URL('/v', baseUrl);
  if (q.origin + q.pathname !== want.origin + want.pathname) throw Object.assign(new Error('readback_domain'), { url });
  const ok = verifySun(macKey, q.searchParams.get('uid'), q.searchParams.get('ctr'), q.searchParams.get('cmac'));
  if (!ok) throw Object.assign(new Error('readback_mac'), { url });
  return { uid: ok.uid, counter: ok.counter, url, locked: lock };
}
