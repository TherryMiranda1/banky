import { Hono } from "hono";
import { z } from "zod";
import { SyncService } from "../../services/sync.js";
import { requireAuth } from "../../middleware/auth.js";

const syncBodySchema = z.record(z.unknown()).optional().default({});

export const syncHandlerRouter = new Hono();
const syncService = new SyncService();

syncHandlerRouter.use("*", requireAuth);

syncHandlerRouter.post("/", async (c) => {
  const userId = c.get("userId");
  let body: unknown = {};
  const contentType = c.req.header("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      const text = await c.req.text();
      body = text.trim() ? JSON.parse(text) : {};
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
  }

  const parsed = syncBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid request payload", details: parsed.error.issues }, 400);
  }

  const result = await syncService.syncAll(userId);
  return c.json(result);
});
