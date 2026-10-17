import { Hono } from "hono";
import { apiKeysHandlerRouter } from "./api-keys-handler.js";

export const apiKeysRouter = new Hono();

apiKeysRouter.route("/", apiKeysHandlerRouter);
