import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function encryptionKey(): Buffer {
  const raw = process.env.CUSTOMER_DATA_ENCRYPTION_KEY;
  if (!raw) throw new Error("CUSTOMER_DATA_ENCRYPTION_KEY is not set");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("CUSTOMER_DATA_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  return key;
}

// AES-256-GCM provides confidentiality and tamper detection for customer bank
// destinations and wallet addresses. Never log the decrypted values.
export function encryptCustomerValue(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64");
}

export function decryptCustomerValue(value: string): string {
  const packed = Buffer.from(value, "base64");
  if (packed.length < 29) throw new Error("Invalid encrypted customer value");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), packed.subarray(0, 12));
  decipher.setAuthTag(packed.subarray(12, 28));
  return Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString("utf8");
}
