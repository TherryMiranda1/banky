#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const shouldUpdateEnv = args.includes("--env") || args.includes("--write");
const fileArg = args.find((a) => !a.startsWith("--")) || "private.key";

const resolvedKeyPath = path.resolve(process.cwd(), fileArg);

if (!fs.existsSync(resolvedKeyPath)) {
  console.error(`❌ Error: File not found at "${resolvedKeyPath}"`);
  process.exit(1);
}

const rawContent = fs.readFileSync(resolvedKeyPath, "utf8");
const normalized = rawContent.replace(/\r\n/g, "\n").trim();
const escaped = JSON.stringify(normalized + "\n");
const envLine = `PRIVATE_KEY_PEM=${escaped}`;

if (shouldUpdateEnv) {
  const envPath = path.resolve(process.cwd(), "server/.env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");
    if (/^PRIVATE_KEY_PEM=.*$/m.test(envContent)) {
      envContent = envContent.replace(/^PRIVATE_KEY_PEM=.*$/m, envLine);
    } else {
      envContent += `\n${envLine}\n`;
    }
    fs.writeFileSync(envPath, envContent, "utf8");
    console.log(`✅ Updated PRIVATE_KEY_PEM in ${envPath}`);
  } else {
    console.warn(`⚠️ Warning: ${envPath} not found. Outputting to stdout.`);
    console.log(envLine);
  }
} else {
  console.log(envLine);
}
