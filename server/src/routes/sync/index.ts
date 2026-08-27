import { Hono } from "hono";
import { syncHandlerRouter } from "./sync-handler.js";

export const syncRouter = new Hono();

syncRouter.route("/", syncHandlerRouter);
