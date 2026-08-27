import crypto from "node:crypto";
import { sign, verify } from "hono/jwt";
import { env, getRuntimeEnv } from "../env.js";

export function generateEnableBankingJwt(
  appId?: string,
  privateKeyPem?: string
): string {
  let currentAppId = (appId || getRuntimeEnv().APP_ID || process.env.APP_ID || env.APP_ID || "").trim();
  let currentKey = (privateKeyPem || getRuntimeEnv().PRIVATE_KEY_PEM || process.env.PRIVATE_KEY_PEM || env.PRIVATE_KEY_PEM || "").trim();

  if (currentAppId.startsWith('"') && currentAppId.endsWith('"')) {
    currentAppId = currentAppId.slice(1, -1).trim();
  }
  if (currentKey.startsWith('"') && currentKey.endsWith('"')) {
    currentKey = currentKey.slice(1, -1).trim();
  }

  currentKey = currentKey.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");

  if (!currentAppId || !currentKey) {
    throw new Error("Enable Banking APP_ID and PRIVATE_KEY_PEM must be configured");
  }

  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: currentAppId
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: "enablebanking.com",
    aud: "api.enablebanking.com",
    iat: now,
    exp: now + 3600
  };

  const encodeBase64Url = (str: string): string => {
    return Buffer.from(str)
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  };

  const headerB64 = encodeBase64Url(JSON.stringify(header));
  const payloadB64 = encodeBase64Url(JSON.stringify(payload));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const signature = crypto.sign("sha256", Buffer.from(dataToSign), currentKey);
  const signatureB64 = signature
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${dataToSign}.${signatureB64}`;
}

export interface UserTokenPayload extends Record<string, unknown> {
  sub: string;
  email: string;
  name: string;
  exp: number;
  iat: number;
}

export async function createAuthToken(
  user: { id: string; email: string; name: string },
  jwtSecret: string = env.JWT_SECRET,
  expiresInDays: number = 7
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInDays * 24 * 60 * 60;
  const payload: UserTokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    iat: now,
    exp
  };
  return sign(payload, jwtSecret, "HS256");
}

export async function verifyAuthToken(
  token: string,
  jwtSecret: string = env.JWT_SECRET
): Promise<UserTokenPayload | null> {
  try {
    const payload = (await verify(token, jwtSecret, "HS256")) as unknown as UserTokenPayload;
    if (!payload.sub || !payload.email) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
