import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) globalThis.crypto = webcrypto;
if (!globalThis.btoa) globalThis.btoa = value => Buffer.from(value, 'binary').toString('base64');
if (!globalThis.atob) globalThis.atob = value => Buffer.from(value, 'base64').toString('binary');

const { encryptJSON, decryptJSON, sha256 } = await import('../assets/crypto.js');
const source = { manifest:{ format:'LifeAtlasPhase1' }, events:[{ id:'α', payload:{ note:'Unicode ✓' } }] };
const encrypted = await encryptJSON(source, 'correct horse battery staple');
assert.notEqual(encrypted.includes('Unicode'), true);
assert.deepEqual(await decryptJSON(encrypted, 'correct horse battery staple'), source);
await assert.rejects(() => decryptJSON(encrypted, 'wrong passphrase'), /Unable to decrypt/);
await assert.rejects(() => encryptJSON(source, 'short'), /at least 10/);
assert.equal((await sha256(source)).length, 64);
console.log('LifeAtlas crypto tests passed.');
