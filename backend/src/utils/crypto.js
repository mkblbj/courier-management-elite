const crypto = require('crypto');

const ENC_KEY = process.env.MERCARI_ENC_KEY || process.env.APP_ENC_KEY || '';

function getKey() {
  if (!ENC_KEY) throw new Error('Encryption key not configured (MERCARI_ENC_KEY)');
  // 支持 base64 或 hex；否则按 utf8 直接使用（不推荐）
  try {
    if (/^[A-Za-z0-9+/=]+$/.test(ENC_KEY) && ENC_KEY.length >= 44) {
      return Buffer.from(ENC_KEY, 'base64');
    }
  } catch (_) {}
  try {
    if (/^[0-9a-fA-F]+$/.test(ENC_KEY) && ENC_KEY.length >= 64) {
      return Buffer.from(ENC_KEY, 'hex');
    }
  } catch (_) {}
  // fallback
  return Buffer.from(ENC_KEY, 'utf8');
}

function encrypt(plainText) {
  const key = getKey();
  const iv = crypto.randomBytes(12); // GCM 推荐 12 字节 IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key.slice(0, 32), iv);
  const enc = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decrypt(token) {
  const key = getKey();
  const buf = Buffer.from(String(token), 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key.slice(0, 32), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}

module.exports = { encrypt, decrypt };


