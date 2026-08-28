import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import crypto from "node:crypto";
import { getDb, users, eq } from "../../db/index.js";
import { hashPassword, verifyPassword } from "../../services/password.js";
import { createAuthToken } from "../../services/jwt.js";
import { requireAuth } from "../../middleware/auth.js";
import { ConflictError, UnauthorizedError, NotFoundError } from "../../errors/AppError.js";
import { env } from "../../env.js";
import { seedDefaultCategoriesIfEmpty } from "../../services/categories-seed.js";

const registerSchema = z.object({
  email: z.string().email("Valid email is required").transform((val) => val.toLowerCase().trim()),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().min(1, "Name is required").trim()
});

const loginSchema = z.object({
  email: z.string().email("Valid email is required").transform((val) => val.toLowerCase().trim()),
  password: z.string().min(1, "Password is required")
});

export const userAuthRouter = new Hono();

userAuthRouter.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, name } = c.req.valid("json");
  const db = getDb();

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    throw new ConflictError("A user with this email address already exists");
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  await db.insert(users).values({
    id: userId,
    email,
    passwordHash,
    name,
    createdAt: now,
    updatedAt: now
  });

  try {
    await seedDefaultCategoriesIfEmpty(db, userId);
  } catch (err) {
    console.error("Failed to seed default categories on register:", err);
  }

  const secret = (c.env as any)?.JWT_SECRET || env.JWT_SECRET;
  const token = await createAuthToken({ id: userId, email, name }, secret);

  return c.json(
    {
      token,
      user: {
        id: userId,
        email,
        name,
        cutoffDay: 1,
        createdAt: now
      }
    },
    201
  );
});

userAuthRouter.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const db = getDb();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
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
      cutoffDay: user.cutoffDay ?? 1,
      createdAt: user.createdAt
    }
  });
});

userAuthRouter.get("/me", requireAuth, async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      cutoffDay: user.cutoffDay ?? 1,
      createdAt: user.createdAt
    }
  });
});
