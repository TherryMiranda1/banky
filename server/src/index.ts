import { env } from "./env.js";
import { serve } from "@hono/node-server";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDatabase } from "./db/index.js";
import { app } from "./app.js";

export { app };

getDatabase();

const port = Number(env.PORT) || 3001;

const currentFile = fileURLToPath(import.meta.url);
const executionEntry = process.argv[1] ? path.resolve(process.argv[1]) : "";
const isDirectExecution =
  executionEntry === currentFile ||
  executionEntry.endsWith("index.ts") ||
  executionEntry.endsWith("index.js");

if (isDirectExecution && process.env.NODE_ENV !== "test") {
  serve(
    {
      fetch: app.fetch,
      port
    },
    (info) => {
      console.log(`Banky server running on http://localhost:${info.port}`);
    }
  );
}

export default app;
