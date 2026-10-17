import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireAuth } from "../../middleware/auth.js";
import { requireJwtOnly } from "../../middleware/scopes.js";
import { CreateApiKeySchema } from "../../core/ports/api-key-scopes.js";
import { apiKeyService } from "../../services/api-key.service.js";
import { BadRequestError } from "../../errors/AppError.js";

export const apiKeysHandlerRouter = new Hono();

apiKeysHandlerRouter.use("*", requireAuth, requireJwtOnly);

apiKeysHandlerRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const keys = await apiKeyService.list(userId);
  return c.json(keys);
});

apiKeysHandlerRouter.post(
  "/",
  zValidator("json", CreateApiKeySchema, (result) => {
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const message = firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Invalid request body";
      throw new BadRequestError(message, result.error.issues);
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const result = await apiKeyService.create(userId, body);
    return c.json(result, 201);
  }
);

apiKeysHandlerRouter.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const keyId = c.req.param("id");
  await apiKeyService.revoke(userId, keyId);
  return c.json({ success: true, id: keyId });
});
