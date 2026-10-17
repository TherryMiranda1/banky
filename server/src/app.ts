import { Hono } from "hono";
import { cors } from "hono/cors";
import { AppError } from "./errors/AppError.js";
import { getDatabase, D1Database } from "./db/index.js";
import { authRouter } from "./routes/auth/index.js";
import { aspspsRouter } from "./routes/aspsps/index.js";
import { syncRouter } from "./routes/sync/index.js";
import { accountsRouter } from "./routes/accounts/index.js";
import { balanceRouter } from "./routes/balance/index.js";
import { transactionsRouter } from "./routes/transactions/index.js";
import { categoriesRouter } from "./routes/categories/index.js";
import { budgetsRouter, analyticsRouter } from "./routes/budgets/index.js";
import { kingdomRouter } from "./routes/kingdom/index.js";
import { usersRouter } from "./routes/users/index.js";
import { apiKeysRouter } from "./routes/api-keys/index.js";
import { docsRouter } from "./docs/index.js";
import { openApiSpec } from "./docs/openapi-spec.js";
import { generateEnableBankingJwt } from "./services/jwt.js";

import { setRuntimeEnv } from "./env.js";

export type CloudflareBindings = {
  DB?: D1Database;
  ENABLE_BANKING_REDIRECT_URL?: string;
  FRONTEND_URL?: string;
  ENABLE_BANKING_BASE_URL?: string;
  PRIVATE_KEY_PEM?: string;
  APP_ID?: string;
  ENCRYPTION_KEY?: string;
  JWT_SECRET?: string;
};

export const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use("*", async (c, next) => {
  if (c.env) {
    setRuntimeEnv(c.env);
    if (c.env.DB) {
      getDatabase(c.env.DB);
    }
  }
  await next();
});

app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"]
  })
);

app.get("/", (c) => {
  return c.json({
    name: "Banky Open Banking API",
    status: "online",
    docs: "/docs",
    openapi: "/openapi.json",
    health: "/health"
  });
});

app.get("/health", (c) => {
  return c.json({ ok: true });
});

app.get("/openapi.json", (c) => {
  return c.json(openApiSpec);
});

app.route("/docs", docsRouter);

app.route("/auth", authRouter);
app.route("/aspsps", aspspsRouter);
app.route("/sync", syncRouter);
app.route("/accounts", accountsRouter);
app.route("/balance", balanceRouter);
app.route("/transactions", transactionsRouter);
app.route("/categories", categoriesRouter);
app.route("/budgets", budgetsRouter);
app.route("/analytics", analyticsRouter);
app.route("/kingdom", kingdomRouter);
app.route("/users", usersRouter);
app.route("/api-keys", apiKeysRouter);

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(
      {
        error: err.message,
        details: err.details
      },
      err.statusCode as any
    );
  }

  console.error("Internal server error:", err);
  return c.json(
    {
      error: "Internal Server Error"
    },
    500
  );
});
