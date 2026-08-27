import { getRuntimeEnv } from "../env.js";

export interface OAuthStateData {
  aspspName: string;
  aspspCountry: string;
  userId: string;
  createdAt: number;
}

export class OAuthStateStore {
  private readonly consumedTokens = new Set<string>();

  async createState(data: Omit<OAuthStateData, "createdAt">): Promise<string> {
    const secret = (getRuntimeEnv().JWT_SECRET || "banky-jwt-super-secret-key-change-in-production").trim();
    const stateObj: OAuthStateData = {
      ...data,
      userId: data.userId || "default-user",
      createdAt: Date.now()
    };

    const payloadB64 = Buffer.from(JSON.stringify(stateObj)).toString("base64url");
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
    const sigB64 = Buffer.from(sig).toString("base64url");

    return `${payloadB64}.${sigB64}`;
  }

  async validateAndConsume(stateToken: string, ttlMs: number = 15 * 60 * 1000): Promise<OAuthStateData | null> {
    try {
      const parts = stateToken.split(".");
      if (parts.length !== 2) return null;
      const [payloadB64, sigB64] = parts;

      if (this.consumedTokens.has(sigB64!)) {
        return null;
      }

      const secret = (getRuntimeEnv().JWT_SECRET || "banky-jwt-super-secret-key-change-in-production").trim();
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );

      const sigBytes = Buffer.from(sigB64!, "base64url");
      const valid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(payloadB64!));
      if (!valid) return null;

      const data = JSON.parse(Buffer.from(payloadB64!, "base64url").toString("utf8")) as OAuthStateData;
      if (Date.now() - data.createdAt > ttlMs) {
        return null;
      }

      this.consumedTokens.add(sigB64!);
      return data;
    } catch {
      return null;
    }
  }
}

export const stateStore = new OAuthStateStore();
