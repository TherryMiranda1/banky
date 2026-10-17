import { createMiddleware } from "hono/factory";
import { ForbiddenError } from "../errors/AppError.js";
import type { ApiKeyScope } from "../core/ports/api-key-scopes.js";

export const requireScope = (scope: ApiKeyScope) =>
  createMiddleware(async (c, next) => {
    const authMethod = c.get("authMethod");
    if (authMethod === "api_key") {
      const scopes = c.get("apiKeyScopes") || [];
      if (!scopes.includes(scope)) {
        throw new ForbiddenError(`Forbidden: Missing required scope '${scope}'`);
      }
    }
    await next();
  });

export const requireJwtOnly = createMiddleware(async (c, next) => {
  const authMethod = c.get("authMethod");
  if (authMethod !== "jwt") {
    throw new ForbiddenError("Forbidden: This endpoint requires interactive session authentication");
  }
  await next();
});
