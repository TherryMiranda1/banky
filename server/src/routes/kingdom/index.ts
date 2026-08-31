import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireAuth } from "../../middleware/auth.js";
import { BadRequestError } from "../../errors/AppError.js";
import { GetKingdomQuerySchema } from "./types.js";
import { getKingdomHandler } from "./kingdom.handler.js";

export const kingdomRouter = new Hono();

kingdomRouter.use("*", requireAuth);

// GET /kingdom?period=YYYY-MM - Transforms financial metrics into visual kingdom state
kingdomRouter.get(
  "/",
  zValidator("query", GetKingdomQuerySchema, (result) => {
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new BadRequestError(issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid query parameters");
    }
  }),
  getKingdomHandler
);
