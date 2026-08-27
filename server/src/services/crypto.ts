import crypto from "node:crypto";
import { InternalServerError } from "../errors/AppError.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

import { getRuntimeEnv } from "../env.js";

function getKey(): Buffer {
  const envKey = (getRuntimeEnv().ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || "").trim();
  if (!envKey) {
    throw new InternalServerError("ENCRYPTION_KEY environment variable is not defined");
  }

  if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
    return Buffer.from(envKey, "hex");
  }

  return crypto.createHash("sha256").update(envKey).digest();
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(":");

  if (parts.length !== 3) {
    throw new InternalServerError("Invalid encrypted format");
  }

  const [ivHex, tagHex, encryptedHex] = parts;
  if (!ivHex || !tagHex || !encryptedHex) {
    throw new InternalServerError("Malformed encrypted payload parts");
  }

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
