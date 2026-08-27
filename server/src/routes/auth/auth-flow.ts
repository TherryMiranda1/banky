import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import crypto from "node:crypto";
import { EnableBankingAdapter } from "../../core/infra/enable-banking/EnableBankingAdapter.js";
import { stateStore } from "../../services/state-store.js";
import { encrypt } from "../../services/crypto.js";
import { getDatabase } from "../../db/index.js";
import { BadRequestError } from "../../errors/AppError.js";
import { requireAuth } from "../../middleware/auth.js";
import { getRuntimeEnv } from "../../env.js";
import { SyncService } from "../../services/sync.js";

const startAuthSchema = z.object({
  aspspName: z.string().min(1, "aspspName is required"),
  aspspCountry: z.string().length(2, "aspspCountry must be a 2-letter ISO code")
});

const callbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().min(1, "state is required"),
  error: z.string().optional(),
  error_description: z.string().optional()
});

const callbackBodySchema = z.object({
  code: z.string().optional(),
  state: z.string().min(1, "state is required"),
  error: z.string().optional(),
  error_description: z.string().optional()
});

export const authFlowRouter = new Hono();
const adapter = new EnableBankingAdapter();
const syncService = new SyncService(adapter);

async function handleCallbackCore(
  code: string | undefined,
  state: string,
  error?: string,
  errorDescription?: string
): Promise<{ connectionId: string; userId: string; accountsCount: number }> {
  if (error) {
    throw new BadRequestError(`Authorization failed: ${errorDescription || error}`);
  }

  const stateData = await stateStore.validateAndConsume(state);
  if (!stateData) {
    throw new BadRequestError("Invalid or expired OAuth state parameter");
  }

  if (!code) {
    throw new BadRequestError("Missing authorization code in callback");
  }

  const sessionData = await adapter.completeAuth(code);
  const sessionIdEnc = encrypt(sessionData.sessionId);
  const connectionId = crypto.randomUUID();
  const userId = stateData.userId || "default-user";
  const now = new Date().toISOString();

  const db = getDatabase();

  const batchStatements = [
    {
      sql: `INSERT INTO bank_connections (id, user_id, bank_name, aspsp_name, aspsp_country, session_id_enc, valid_until, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        connectionId,
        userId,
        stateData.aspspName,
        stateData.aspspName,
        stateData.aspspCountry,
        sessionIdEnc,
        sessionData.validUntil,
        now
      ]
    },
    ...sessionData.accounts.map((account) => ({
      sql: `INSERT INTO accounts (id, connection_id, iban, alias, currency, last_balance, synced_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              connection_id = excluded.connection_id,
              iban = excluded.iban,
              alias = excluded.alias,
              currency = excluded.currency,
              synced_at = excluded.synced_at`,
      params: [
        account.uid,
        connectionId,
        account.iban,
        account.name,
        account.currency,
        null,
        null
      ]
    }))
  ];

  await db.batch(batchStatements);

  try {
    await syncService.syncAll(userId);
  } catch (syncErr) {
    console.error("Initial sync on callback finished with warning:", syncErr);
  }

  return {
    connectionId,
    userId,
    accountsCount: sessionData.accounts.length
  };
}

authFlowRouter.post("/start", requireAuth, zValidator("json", startAuthSchema), async (c) => {
  const { aspspName, aspspCountry } = c.req.valid("json");
  const userId = c.get("userId");

  const state = await stateStore.createState({
    aspspName,
    aspspCountry: aspspCountry.toUpperCase(),
    userId
  });

  const result = await adapter.startAuth({
    name: aspspName,
    country: aspspCountry.toUpperCase(),
    state
  });

  return c.json({ url: result.url });
});

// JSON Callback endpoint for Frontend SPA
authFlowRouter.post("/callback", zValidator("json", callbackBodySchema), async (c) => {
  const { code, state, error, error_description } = c.req.valid("json");
  const result = await handleCallbackCore(code, state, error, error_description);

  return c.json({
    success: true,
    connectionId: result.connectionId,
    accountsCount: result.accountsCount
  });
});

// Browser Redirect Callback endpoint (fallback)
authFlowRouter.get("/callback", zValidator("query", callbackQuerySchema), async (c) => {
  const { code, state, error, error_description } = c.req.valid("query");
  await handleCallbackCore(code, state, error, error_description);

  const frontendUrl = getRuntimeEnv().FRONTEND_URL || (c.env as any)?.FRONTEND_URL || process.env.FRONTEND_URL || "http://localhost:5173";
  return c.redirect(`${frontendUrl}/?connected=true`);
});
