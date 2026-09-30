import React, { useState } from "react";
import { Terminal, Copy, Check, Server, Database, Globe, ChevronRight } from "lucide-react";

interface StepConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badge: string;
  commands: {
    label: string;
    code: string;
  }[];
  notes: string[];
}

const DEPLOY_STEPS: StepConfig[] = [
  {
    id: "repo",
    title: "1. Clonar Repositorio",
    subtitle: "Código fuente abierto y dependencias mínimas",
    icon: Terminal,
    badge: "Git",
    commands: [
      {
        label: "Clonar el repositorio de Banky",
        code: "git clone https://github.com/TherryMiranda1/banky.git && cd banky"
      },
      {
        label: "Instalar dependencias del servidor y cliente",
        code: "cd server && npm install && cd ../client && npm install"
      }
    ],
    notes: [
      "No requiere Docker ni servicios externos adicionales.",
      "Todo corre nativamente en la infraestructura serverless de Cloudflare."
    ]
  },
  {
    id: "db",
    title: "2. Base de Datos D1",
    subtitle: "Cloudflare D1 (SQLite distribuido en el Edge)",
    icon: Database,
    badge: "Cloudflare D1",
    commands: [
      {
        label: "Crear base de datos distribuida en D1",
        code: "cd server && npx wrangler d1 create banky-db"
      },
      {
        label: "Aplicar esquema relacional (cuentas, balances, transacciones)",
        code: "npx wrangler d1 execute banky-db --remote --file=src/db/schema.sql"
      }
    ],
    notes: [
      "Pega el database_id generado en la sección [[d1_databases]] de server/wrangler.toml.",
      "Límite gratuito de Cloudflare D1: 5 GB de almacenamiento y 5.000.000 de lecturas por día."
    ]
  },
  {
    id: "api",
    title: "3. Backend API Worker",
    subtitle: "Cloudflare Workers + Hono + Zod",
    icon: Server,
    badge: "Workers Edge",
    commands: [
      {
        label: "Configurar secreto JWT para sesiones multi-tenant",
        code: "npx wrangler secret put JWT_SECRET"
      },
      {
        label: "Configurar clave simétrica AES-256 para vault de sesiones bancarias",
        code: "npx wrangler secret put ENCRYPTION_KEY"
      },
      {
        label: "Configurar clave privada RSA para Enable Banking AISP",
        code: "Get-Content -Raw private.key | npx wrangler secret put PRIVATE_KEY_PEM"
      },
      {
        label: "Desplegar API Worker a la red global de Cloudflare",
        code: "npm run deploy"
      }
    ],
    notes: [
      "El Worker procesa firmas criptográficas en Edge sin Node.js.",
      "Genera una URL como https://banky-server.<tu-subdominio>.workers.dev"
    ]
  },
  {
    id: "client",
    title: "4. Frontend SPA",
    subtitle: "Cloudflare Pages + React 19 + Tailwind v4",
    icon: Globe,
    badge: "Pages SPA",
    commands: [
      {
        label: "Configurar URL de la API de producción en client/.env.production",
        code: "VITE_API_URL=https://api.tudominio.com"
      },
      {
        label: "Compilar frontend optimizado",
        code: "cd client && npm run build"
      },
      {
        label: "Publicar en Cloudflare Pages con regla SPA nativa",
        code: "npx wrangler pages deploy dist --project-name=banky-client"
      }
    ],
    notes: [
      "Cloudflare Pages incluye ancho de banda ilimitado y SSL automático.",
      "El archivo _redirects incluido resuelve el enrutamiento SPA sin servidores web."
    ]
  }
];

export const DeployGuideSection: React.FC = () => {
  const [activeStepId, setActiveStepId] = useState<string>("repo");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const activeStep = DEPLOY_STEPS.find((s) => s.id === activeStepId) || DEPLOY_STEPS[0];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-mono">
          <Terminal className="w-3.5 h-3.5" />
          <span>Guía Paso a Paso</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
          Cómo autohospedar Banky en Cloudflare
        </h2>
        <p className="text-sm text-muted max-w-xl mx-auto">
          Arquitectura 100% serverless: sin VPS, sin mantenimiento y dentro de la capa gratuita permanente de Cloudflare.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 space-y-2">
          {DEPLOY_STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === activeStep.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStepId(step.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isActive
                    ? "bg-surface border-accent/40 shadow-sm text-text"
                    : "bg-surface/40 border-border hover:bg-surface/80 text-muted hover:text-text"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? "bg-accent/15 text-accent border border-accent/30" : "bg-bg text-muted border border-border"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text leading-tight">{step.title}</h4>
                    <p className="text-[11px] text-muted truncate max-w-[190px]">{step.subtitle}</p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? "text-accent translate-x-0.5" : "text-muted/40"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-8 p-6 rounded-2xl bg-surface border border-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/80">
            <div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                {activeStep.badge}
              </span>
              <h3 className="text-base font-bold text-text mt-1">{activeStep.title}</h3>
              <p className="text-xs text-muted">{activeStep.subtitle}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase text-muted tracking-wider">Comandos a ejecutar:</h4>
            {activeStep.commands.map((cmd) => (
              <div key={cmd.code} className="space-y-1.5">
                <p className="text-xs text-muted font-medium">{cmd.label}</p>
                <div className="relative group bg-bg border border-border rounded-xl p-3.5 font-mono text-xs flex items-center justify-between gap-4">
                  <span className="text-accent/90 shrink-0">$</span>
                  <code className="text-text flex-1 select-all overflow-x-auto whitespace-pre font-mono">
                    {cmd.code}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(cmd.code)}
                    className="p-1.5 rounded-lg bg-surface border border-border text-muted hover:text-accent hover:border-accent/40 transition-colors shrink-0 cursor-pointer"
                    title="Copiar comando"
                  >
                    {copiedCode === cmd.code ? (
                      <Check className="w-3.5 h-3.5 text-accent" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border/60">
            <h4 className="text-xs font-mono uppercase text-muted tracking-wider mb-2">Notas técnicas:</h4>
            <ul className="space-y-1 text-xs text-muted list-disc list-inside">
              {activeStep.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
