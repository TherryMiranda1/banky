import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import crypto from "node:crypto";
import { getDatabase } from "../../db/index.js";
import { hashPassword, verifyPassword } from "../../services/password.js";
import { createAuthToken } from "../../services/jwt.js";
import { requireAuth } from "../../middleware/auth.js";
import { ConflictError, UnauthorizedError, NotFoundError } from "../../errors/AppError.js";
import { env } from "../../env.js";

const registerSchema = z.object({
  email: z.string().email("Valid email is required").transform((val) => val.toLowerCase().trim()),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().min(1, "Name is required").trim()
});

const loginSchema = z.object({
  email: z.string().email("Valid email is required").transform((val) => val.toLowerCase().trim()),
  password: z.string().min(1, "Password is required")
});

interface UserDbRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
}

export const userAuthRouter = new Hono();

userAuthRouter.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, name } = c.req.valid("json");
  const db = getDatabase();

  const existingUser = await db.queryOne<UserDbRow>("SELECT id FROM users WHERE email = ?", [email]);
  if (existingUser) {
    throw new ConflictError("A user with this email address already exists");
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, email, passwordHash, name, now, now]
  );

  const secret = (c.env as any)?.JWT_SECRET || env.JWT_SECRET;
  const token = await createAuthToken({ id: userId, email, name }, secret);

  return c.json(
    {
      token,
      user: {
        id: userId,
        email,
        name,
        createdAt: now
      }
    },
    201
  );
});

userAuthRouter.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const db = getDatabase();

  const user = await db.queryOne<UserDbRow>(
    "SELECT id, email, password_hash, name, created_at FROM users WHERE email = ?",
    [email]
  );

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const secret = (c.env as any)?.JWT_SECRET || env.JWT_SECRET;
  const token = await createAuthToken({ id: user.id, email: user.email, name: user.name }, secret);

  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at
    }
  });
});

userAuthRouter.get("/me", requireAuth, async (c) => {
  const userId = c.get("userId");
  const db = getDatabase();

  const user = await db.queryOne<UserDbRow>(
    "SELECT id, email, name, created_at FROM users WHERE id = ?",
    [userId]
  );

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at
    }
  });
});
