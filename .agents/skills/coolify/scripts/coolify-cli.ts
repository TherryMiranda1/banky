import { execSync } from "child_process";
import fs from "fs";

const baseUrl = process.env.COOLIFY_API_URL || "https://genmachine.therry.dev/api/v1";
const token = process.env.COOLIFY_API_TOKEN;

export async function coolifyApi(path: string, options: RequestInit = {}) {
  if (!token) {
    throw new Error(
      "Missing COOLIFY_API_TOKEN environment variable. Please export COOLIFY_API_TOKEN=<your-token> or add it to your .env file."
    );
  }
  const url = `${baseUrl.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function handleCommand() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    console.log(`
Coolify API Management CLI
--------------------------
Usage: bun run coolify-cli.ts <command> [args...]

Commands:
  servers                                         List all connected Coolify servers
  projects                                        List projects and environments
  apps                                            List all deployed applications
  app <app_uuid>                                  Get detailed status and info for an app
  envs <app_uuid>                                 List environment variables for an app
  set-env <app_uuid> <key> <value> [is_preview]   Update an existing environment variable
  add-env <app_uuid> <key> <value> [is_preview]   Create/Register a new environment variable
  set-domain <app_uuid> <domain>                  Configure domain (FQDN + compose domains) and update auth URL
  deploy <app_uuid>                               Trigger deployment for an application
  deployments [app_uuid]                          List recent deployments
  logs <deployment_uuid>                          Print logs for a specific deployment
  keys                                            List registered SSH deploy keys
  setup-deploy-key <repo_name>                    Generate and link an SSH deploy key to GitHub and Coolify
  health <domain_or_url>                          Check health status of a deployed instance
`);
    return;
  }

  switch (command) {
    case "servers": {
      const data = await coolifyApi("/servers");
      console.log(JSON.stringify(data, null, 2));
      break;
    }
    case "projects": {
      const data = await coolifyApi("/projects");
      console.log(JSON.stringify(data, null, 2));
      break;
    }
    case "apps": {
      const data = await coolifyApi("/applications");
      console.log(JSON.stringify(data, null, 2));
      break;
    }
    case "app": {
      const uuid = args[1];
      if (!uuid) throw new Error("Missing app uuid");
      const data = await coolifyApi(`/applications/${uuid}`);
      console.log(JSON.stringify(data, null, 2));
      break;
    }
    case "envs": {
      const uuid = args[1];
      if (!uuid) throw new Error("Missing app uuid");
      const data = await coolifyApi(`/applications/${uuid}/envs`);
      console.log(JSON.stringify(data, null, 2));
      break;
    }
    case "set-env": {
      const uuid = args[1];
      const key = args[2];
      const value = args[3];
      const isPreview = args[4] === "true";
      if (!uuid || !key || value === undefined) {
        throw new Error("Usage: set-env <app_uuid> <key> <value> [is_preview]");
      }
      const data = await coolifyApi(`/applications/${uuid}/envs`, {
        method: "PATCH",
        body: JSON.stringify({ key, value, is_preview: isPreview }),
      });
      console.log(JSON.stringify(data, null, 2));
      break;
    }
    case "add-env": {
      const uuid = args[1];
      const key = args[2];
      const value = args[3];
      const isPreview = args[4] === "true";
      if (!uuid || !key || value === undefined) {
        throw new Error("Usage: add-env <app_uuid> <key> <value> [is_preview]");
      }
      const data = await coolifyApi(`/applications/${uuid}/envs`, {
        method: "POST",
        body: JSON.stringify({ key, value, is_preview: isPreview }),
      });
      console.log(JSON.stringify(data, null, 2));
      break;
    }
    case "set-domain": {
      const uuid = args[1];
      const domain = args[2];
      if (!uuid || !domain) {
        throw new Error("Usage: set-domain <app_uuid> <https://domain.com>");
      }
      const cleanDomain = domain.replace(/\/+$/, "");
      console.log(`1. Setting FQDN and compose domain to ${cleanDomain}...`);
      await coolifyApi(`/applications/${uuid}`, {
        method: "PATCH",
        body: JSON.stringify({
          fqdn: cleanDomain,
          docker_compose_domains: JSON.stringify({
            spaces: { domain: `${cleanDomain}:3000` },
          }),
        }),
      });

      console.log(`2. Updating BETTER_AUTH_URL and SERVICE_FQDN_SPACES_3000...`);
      await coolifyApi(`/applications/${uuid}/envs`, {
        method: "PATCH",
        body: JSON.stringify({
          key: "BETTER_AUTH_URL",
          value: cleanDomain,
          is_preview: false,
        }),
      }).catch(() => {});

      await coolifyApi(`/applications/${uuid}/envs`, {
        method: "POST",
        body: JSON.stringify({
          key: "SERVICE_FQDN_SPACES_3000",
          value: cleanDomain,
          is_preview: false,
        }),
      }).catch(() => {});

      console.log(`3. Triggering redeployment...`);
      const deployRes = await coolifyApi(`/deploy?uuid=${uuid}`, { method: "POST" });
      console.log("Deploy response:", deployRes);
      break;
    }
    case "deploy": {
      const uuid = args[1];
      if (!uuid) throw new Error("Missing app uuid");
      const data = await coolifyApi(`/deploy?uuid=${uuid}`, { method: "POST" });
      console.log(JSON.stringify(data, null, 2));
      break;
    }
    case "deployments": {
      const data = await coolifyApi("/deployments");
      console.log(JSON.stringify(data, null, 2));
      break;
    }
    case "logs": {
      const deploymentUuid = args[1];
      if (!deploymentUuid) throw new Error("Missing deployment uuid");
      const data = await coolifyApi(`/deployments/${deploymentUuid}`);
      console.log(data?.logs || "No logs available.");
      break;
    }
    case "keys": {
      const data = await coolifyApi("/security/keys");
      console.log(JSON.stringify(data, null, 2));
      break;
    }
    case "setup-deploy-key": {
      const repo = args[1];
      if (!repo) throw new Error("Usage: setup-deploy-key <owner/repo>");
      const keyPath = `./temp_deploy_key_${Date.now()}`;
      console.log(`1. Generating SSH key pair: ${keyPath}...`);
      execSync(`ssh-keygen -t ed25519 -N "" -C "coolify-${repo.replace("/", "-")}" -f ${keyPath}`);

      const privateKey = fs.readFileSync(keyPath, "utf8");
      console.log(`2. Adding deploy key to GitHub: ${repo}...`);
      execSync(`gh repo deploy-key add ${keyPath}.pub --title "Coolify Deploy Key" --repo ${repo}`);

      console.log(`3. Registering private key in Coolify...`);
      const keyRes = await coolifyApi("/security/keys", {
        method: "POST",
        body: JSON.stringify({
          name: `${repo.replace("/", "-")}-key`,
          description: `Deploy key for ${repo}`,
          private_key: privateKey,
        }),
      });

      fs.unlinkSync(keyPath);
      fs.unlinkSync(`${keyPath}.pub`);

      console.log("Registered key in Coolify successfully:", keyRes);
      break;
    }
    case "health": {
      let target = args[1] || "https://mobile-spaces.therry.dev";
      if (!target.startsWith("http://") && !target.startsWith("https://")) {
        target = `https://${target}`;
      }
      const healthUrl = `${target.replace(/\/+$/, "")}/api/health`;
      console.log(`Checking health on ${healthUrl}...`);
      try {
        const res = await fetch(healthUrl, { method: "GET" });
        const text = await res.text();
        console.log(`Status HTTP ${res.status}:`, text);
      } catch (err: any) {
        console.error("Healthcheck error:", err.message || err);
      }
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

if (import.meta.main) {
  handleCommand().catch((err) => {
    console.error("Error:", err.message || err);
    process.exit(1);
  });
}
