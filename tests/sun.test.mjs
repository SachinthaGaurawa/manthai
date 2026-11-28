/* node tests/sun.test.mjs : the seal check against RFC 4493 and NXP AN12196 */
import assert from 'node:assert';
import { cmac, verifySun, signSun } from '../api/vault/_sun.js';
const K = Buffer.from('2b7e151628aed2a6abf7158809cf4f3c', 'hex');
assert.equal(cmac(K, Buffer.alloc(0)).toString('hex'), 'bb1d6929e95937287fa37d129b756746');
assert.equal(cmac(K, Buffer.from('6bc1bee22e409f96e93d7e117393172a', 'hex')).toString('hex'), '070a16b46b4d4144f79bdd9dd04a287c');
assert.equal(cmac(K, Buffer.from('6bc1bee22e409f96e93d7e117393172aae2d8a571e03ac9c9eb76fac45af8e5130c81c46a35ce411', 'hex')).toString('hex'), 'dfa66747de9ae63030ca32611497c827');
const Z = '00000000000000000000000000000000';
assert.deepEqual(verifySun(Z, '041E3C8A2D6B80', '000006', '4B00064004B0B3D3'), { uid: '041E3C8A2D6B80', counter: 6 });
assert.deepEqual(verifySun(Z, '041e3c8a2d6b80', '000006', '4b00064004b0b3d3'), { uid: '041E3C8A2D6B80', counter: 6 });
assert.equal(verifySun(Z, '041E3C8A2D6B80', '000007', '4B00064004B0B3D3'), null);
assert.equal(verifySun(Z, '041E3C8A2D6B80', '060000', '4B00064004B0B3D3'), null);
assert.equal(verifySun('00000000000000000000000000000001', '041E3C8A2D6B80', '000006', '4B00064004B0B3D3'), null);
assert.equal(verifySun(Z, '041E3C8A2D6B8', '000006', '4B00064004B0B3D3'), null);
assert.deepEqual(signSun(Z, '041E3C8A2D6B80', 6), { uid: '041E3C8A2D6B80', ctr: '000006', cmac: '4B00064004B0B3D3' });
console.log('sun ok');
