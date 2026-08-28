import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import crypto from "node:crypto";
import { EnableBankingAdapter } from "../../core/infra/enable-banking/EnableBankingAdapter.js";
import { stateStore } from "../../services/state-store.js";
import { encrypt } from "../../services/crypto.js";
import { getDb, bankConnections, accounts } from "../../db/index.js";
import { BadRequestError } from "../../errors/AppError.js";
import { requireAuth } from "../../middleware/auth.js";
import { getRuntimeEnv } from "../../env.js";
import { SyncService } from "../../services/sync.js";

const startAuthSchema = z.object({
  aspspName: z.string().min(1, "aspspName is required"),
  aspspCountry: z.string().length(2, "aspspCountry must be a 2-letter ISO code"),
  logoUrl: z.string().optional()
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
  const logoUrl =
    stateData.logoUrl ||
    `https://enablebanking.com/brands/${stateData.aspspCountry}/${encodeURIComponent(stateData.aspspName)}/`;

  const db = getDb();

  await db.insert(bankConnections).values({
    id: connectionId,
    userId,
    bankName: stateData.aspspName,
    aspspName: stateData.aspspName,
    aspspCountry: stateData.aspspCountry,
    logoUrl,
    sessionIdEnc,
    validUntil: sessionData.validUntil,
    status: "active",
    createdAt: now
  });

  for (const account of sessionData.accounts) {
    await db
      .insert(accounts)
      .values({
        id: account.uid,
        connectionId,
        iban: account.iban || null,
        alias: account.name || null,
        currency: account.currency,
        lastBalance: null,
        syncedAt: null
      })
      .onConflictDoUpdate({
        target: accounts.id,
        set: {
          connectionId,
          iban: account.iban || null,
          alias: account.name || null,
          currency: account.currency
        }
      });
  }

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
  const { aspspName, aspspCountry, logoUrl } = c.req.valid("json");
  const userId = c.get("userId");

  const state = await stateStore.createState({
    aspspName,
    aspspCountry: aspspCountry.toUpperCase(),
    userId,
    logoUrl
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
