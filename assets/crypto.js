const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}
function unb64(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}
async function key(pass, salt, iterations = 310000) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
export async function encryptJSON(data, pass) {
  if (!pass || pass.length < 10) throw new Error('Use a passphrase of at least 10 characters.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 310000;
  const derivedKey = await key(pass, salt, iterations);
  const plain = enc.encode(JSON.stringify(data));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, derivedKey, plain));
  return JSON.stringify({
    format: 'LifeAtlasEncryptedExport', version: 1, cipher: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256', iterations, salt: b64(salt), iv: b64(iv), ciphertext: b64(cipher)
  });
}
export async function decryptJSON(text, pass) {
  let box;
  try { box = JSON.parse(text); } catch { throw new Error('The selected file is not valid JSON.'); }
  if (box.format !== 'LifeAtlasEncryptedExport' || box.version !== 1) throw new Error('Not a supported LifeAtlas encrypted export.');
  if (!box.salt || !box.iv || !box.ciphertext) throw new Error('Encrypted export is incomplete.');
  const iterations = Number(box.iterations || 310000);
  if (!Number.isFinite(iterations) || iterations < 100000) throw new Error('Encrypted export uses an invalid key-derivation configuration.');
  try {
    const derivedKey = await key(pass, unb64(box.salt), iterations);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, derivedKey, unb64(box.ciphertext));
    return JSON.parse(dec.decode(plain));
  } catch {
    throw new Error('Unable to decrypt this export. Check the passphrase and file integrity.');
  }
}
export async function sha256(value) {
  const bytes = enc.encode(typeof value === 'string' ? value : JSON.stringify(value));
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map(x => x.toString(16).padStart(2, '0')).join('');
}
