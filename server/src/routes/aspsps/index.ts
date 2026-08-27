import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { EnableBankingAdapter } from "../../core/infra/enable-banking/EnableBankingAdapter.js";

const getAspspsQuerySchema = z.object({
  country: z.string().length(2).optional()
});

export const aspspsRouter = new Hono();
const adapter = new EnableBankingAdapter();

aspspsRouter.get("/", zValidator("query", getAspspsQuerySchema), async (c) => {
  const { country } = c.req.valid("query");
  const aspsps = await adapter.getAspsps(country ? country.toUpperCase() : undefined);

  return c.json({ aspsps });
});
