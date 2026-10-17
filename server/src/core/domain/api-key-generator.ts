export function generateRawApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const base64 = Buffer.from(bytes).toString("base64url");
  return `bky_live_${base64}`;
}

export function extractKeyPrefix(rawKey: string): string {
  return rawKey.slice(0, 16);
}

export async function hashApiKey(rawKey: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(rawKey));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
