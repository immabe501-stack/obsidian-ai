import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const raw = process.env.PII_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("PII_ENCRYPTION_KEY is not set");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("PII_ENCRYPTION_KEY must decode to 32 bytes (base64-encoded)");
  }
  return key;
}

/**
 * 加密敏感字串。輸出格式：base64(iv || ciphertext || authTag)
 * 回傳 null 表示輸入為 null / undefined / 空字串。
 */
export function encryptPII(plaintext: string | null | undefined): string | null {
  if (!plaintext) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, enc, tag]).toString("base64");
}

export function decryptPII(payload: string | null | undefined): string | null {
  if (!payload) return null;
  const buf = Buffer.from(payload, "base64");
  if (buf.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error("Invalid encrypted payload");
  }
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(buf.length - TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH, buf.length - TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/**
 * 顯示用遮罩：保留前 2 與後 2 字元，中間以 * 取代。
 *   A123456789 → A1******89
 */
export function maskPII(plaintext: string | null | undefined): string {
  if (!plaintext) return "";
  if (plaintext.length <= 4) return "*".repeat(plaintext.length);
  return `${plaintext.slice(0, 2)}${"*".repeat(plaintext.length - 4)}${plaintext.slice(-2)}`;
}
