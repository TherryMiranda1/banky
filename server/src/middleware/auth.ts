import { createMiddleware } from "hono/factory";
import { UnauthorizedError } from "../errors/AppError.js";
import { verifyAuthToken, UserTokenPayload } from "../services/jwt.js";
import { apiKeyService } from "../services/api-key.service.js";
import type { ApiKeyScope } from "../core/ports/api-key-scopes.js";
import { env } from "../env.js";

declare module "hono" {
  interface ContextVariableMap {
    user: UserTokenPayload;
    userId: string;
    authMethod: "jwt" | "api_key";
    apiKeyScopes?: ApiKeyScope[];
    apiKeyId?: string;
  }
}

export const requireAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization") || c.req.header("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Unauthorized: Missing or invalid Authorization header");
  }

  const token = authHeader.substring(7).trim();

  if (token.startsWith("bky_")) {
    const verified = await apiKeyService.verify(token);
    if (!verified) {
      throw new UnauthorizedError("Unauthorized: Invalid or expired API key");
    }

    c.set("userId", verified.userId);
    c.set("authMethod", "api_key");
    c.set("apiKeyScopes", verified.scopes);
    c.set("apiKeyId", verified.keyId);
    c.set("user", {
      sub: verified.userId,
      email: "",
      name: verified.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    return next();
  }

  const secret = (c.env as any)?.JWT_SECRET || env.JWT_SECRET;
  const payload = await verifyAuthToken(token, secret);

  if (!payload) {
    throw new UnauthorizedError("Unauthorized: Invalid or expired token");
  }

  c.set("user", payload);
  c.set("userId", payload.sub);
  c.set("authMethod", "jwt");
  await next();
});

