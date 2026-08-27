import { createMiddleware } from "hono/factory";
import { UnauthorizedError } from "../errors/AppError.js";
import { verifyAuthToken, UserTokenPayload } from "../services/jwt.js";
import { env } from "../env.js";

declare module "hono" {
  interface ContextVariableMap {
    user: UserTokenPayload;
    userId: string;
  }
}

export const requireAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization") || c.req.header("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Unauthorized: Missing or invalid Authorization header");
  }

  const token = authHeader.substring(7).trim();
  const secret = (c.env as any)?.JWT_SECRET || env.JWT_SECRET;
  const payload = await verifyAuthToken(token, secret);

  if (!payload) {
    throw new UnauthorizedError("Unauthorized: Invalid or expired token");
  }

  c.set("user", payload);
  c.set("userId", payload.sub);
  await next();
});
