import { Hono } from "hono";
import { authFlowRouter } from "./auth-flow.js";
import { userAuthRouter } from "./user-auth.js";

export const authRouter = new Hono();

authRouter.route("/", userAuthRouter);
authRouter.route("/", authFlowRouter);
