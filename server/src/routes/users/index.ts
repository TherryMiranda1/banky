import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getDb, users, eq } from "../../db/index.js";
import { requireAuth } from "../../middleware/auth.js";
import { BadRequestError, NotFoundError } from "../../errors/AppError.js";

const UpdatePreferencesSchema = z.object({
  cutoffDay: z.number({
    required_error: "cutoffDay is required",
    invalid_type_error: "cutoffDay must be a number"
  }).int("cutoffDay must be an integer").min(1, "cutoffDay must be at least 1").max(31, "cutoffDay cannot exceed 31")
});

export const usersRouter = new Hono();

usersRouter.use("*", requireAuth);

usersRouter.get("/preferences", async (c) => {
  const userId = c.get("userId");
  const db = getDb();

  const [user] = await db
    .select({
      id: users.id,
      cutoffDay: users.cutoffDay
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return c.json({
    data: {
      cutoffDay: user.cutoffDay
    }
  });
});

const preferencesValidator = zValidator("json", UpdatePreferencesSchema, (result) => {
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const message = firstIssue
      ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
      : "Invalid preferences parameters";
    throw new BadRequestError(message, result.error.issues);
  }
});

usersRouter.patch("/preferences", preferencesValidator, async (c) => {
  const userId = c.get("userId");
  const { cutoffDay } = c.req.valid("json");
  const db = getDb();
  const now = new Date().toISOString();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existing) {
    throw new NotFoundError("User not found");
  }

  await db
    .update(users)
    .set({
      cutoffDay,
      updatedAt: now
    })
    .where(eq(users.id, userId));

  const [updatedUser] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      cutoffDay: users.cutoffDay,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return c.json({
    data: updatedUser
  });
});

usersRouter.put("/preferences", preferencesValidator, async (c) => {
  const userId = c.get("userId");
  const { cutoffDay } = c.req.valid("json");
  const db = getDb();
  const now = new Date().toISOString();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existing) {
    throw new NotFoundError("User not found");
  }

  await db
    .update(users)
    .set({
      cutoffDay,
      updatedAt: now
    })
    .where(eq(users.id, userId));

  const [updatedUser] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      cutoffDay: users.cutoffDay,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return c.json({
    data: updatedUser
  });
});


