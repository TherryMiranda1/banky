import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import { openApiSpec } from "./openapi-spec.js";

export const docsRouter = new Hono();

docsRouter.get("/openapi.json", (c) => {
  return c.json(openApiSpec);
});

docsRouter.get("/", swaggerUI({ url: "/docs/openapi.json" }));
