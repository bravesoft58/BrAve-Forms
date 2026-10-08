import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM for the stored Microsoft 365 client secret (BF-74). The key lives
// only in Vercel (EMAIL_SETTINGS_KEY, 32 bytes base64); the database holds the
// ciphertext. The organization id is bound in as associated data, so a
// ciphertext copied onto another organization's row fails to decrypt instead of
// sending as that organization. "v1:" names the key version so a rotation can
// add "v2:" and still read old rows.
//
// Stored form: v1:<iv base64>:<auth tag base64>:<ciphertext base64>

const VERSION = "v1";
const IV_BYTES = 12;
const KEY_BYTES = 32;
const TAG_BYTES = 16;

export class SecretKeyMissingError extends Error {}

function loadKey(raw: string | undefined): Buffer {
  const key = Buffer.from(raw ?? "", "base64");
  if (key.length !== KEY_BYTES) {
    throw new SecretKeyMissingError(
      `EMAIL_SETTINGS_KEY must be ${KEY_BYTES} bytes, base64-encoded`,
    );
  }
  return key;
}

export function encryptSecret(
  plaintext: string,
  orgId: string,
  rawKey: string | undefined = process.env.EMAIL_SETTINGS_KEY,
): string {
  const key = loadKey(rawKey);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(orgId, "utf8"));
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), tag.toString("base64"), body.toString("base64")].join(":");
}

/** Throws on a wrong key, a wrong organization, or any tampering. */
export function decryptSecret(
  stored: string,
  orgId: string,
  rawKey: string | undefined = process.env.EMAIL_SETTINGS_KEY,
): string {
  const parts = stored.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Unrecognised secret format");
  }
  const [, iv, tag, body] = parts.map((p) => Buffer.from(p, "base64"));
  if (iv.length !== IV_BYTES) throw new Error("Unrecognised secret format");
  // A fixed tag length: GCM otherwise accepts a truncated tag, which is easier to forge.
  const decipher = createDecipheriv("aes-256-gcm", loadKey(rawKey), iv, { authTagLength: TAG_BYTES });
  decipher.setAAD(Buffer.from(orgId, "utf8"));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
}
