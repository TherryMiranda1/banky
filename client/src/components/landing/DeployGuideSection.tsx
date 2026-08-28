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
    id: "db",
    title: "1. Base de Datos D1",
    subtitle: "Cloudflare D1 (SQLite en el Edge)",
    icon: Database,
    badge: "Cloudflare D1",
    commands: [
      {
        label: "Crear base de datos distribuida en D1",
        code: "npx wrangler d1 create banky-db"
      },
      {
        label: "Aplicar esquema relacional (cuentas, balances, transacciones)",
        code: "npx wrangler d1 execute banky-db --remote --file=src/db/schema.sql"
      }
    ],
    notes: [
      "Pega el database_id generado en la sección [[d1_databases]] de wrangler.toml",
      "Soporta SQLite en memoria localmente para desarrollo y tests"
    ]
  },
  {
    id: "api",
    title: "2. Backend API Worker",
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
        code: "npx wrangler secret put PRIVATE_KEY_PEM"
      },
      {
        label: "Desplegar API Worker a la red global de Cloudflare",
        code: "npm run deploy"
      }
    ],
    notes: [
      "Zero Cold Start en V8 Isolates de Cloudflare",
      "Validación de endpoints en tiempo de compilación y runtime vía Zod"
    ]
  },
  {
    id: "frontend",
    title: "3. Frontend SPA",
    subtitle: "Cloudflare Pages + React 19 + Tailwind v4",
    icon: Globe,
    badge: "Cloudflare Pages",
    commands: [
      {
        label: "Compilar bundle estático optimizado con Vite",
        code: "npm run build"
      },
      {
        label: "Desplegar a Cloudflare Pages con redirección SPA automática",
        code: "npx wrangler pages deploy dist --project-name=banky-client"
      }
    ],
    notes: [
      "Configura VITE_API_URL con la URL asignada a tu Worker",
      "Reglas de routing SPA configuradas en public/_redirects"
    ]
  }
];

export const DeployGuideSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState<string>("db");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const currentStep = DEPLOY_STEPS.find((s) => s.id === activeStep) || DEPLOY_STEPS[0];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-border bg-surface/80 backdrop-blur-xl overflow-hidden shadow-2xl">
      <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-text">Guía de Despliegue Serverless</h3>
            <p className="text-xs sm:text-sm text-muted">Despliega tu propia instancia en Cloudflare en menos de 5 minutos</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-bg/70 p-1 rounded-xl border border-border">
          {DEPLOY_STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  isActive
                    ? "bg-surface border border-accent/40 text-accent font-semibold shadow-sm"
                    : "text-muted hover:text-text hover:bg-surface/50 border border-transparent"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">{step.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-mono">
            <span>Paso {DEPLOY_STEPS.findIndex((s) => s.id === activeStep) + 1} de 3</span>
          </div>

          <h4 className="text-xl font-bold text-text">{currentStep.title}</h4>
          <p className="text-sm text-muted">{currentStep.subtitle}</p>

          <div className="pt-4 border-t border-border space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted font-mono font-semibold">
              Detalles clave
            </p>
            <ul className="space-y-2">
              {currentStep.notes.map((note, i) => (
                <li key={i} className="text-xs text-text/80 flex items-start gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="space-y-3">
            {currentStep.commands.map((cmd, idx) => {
              const cmdKey = `${activeStep}-${idx}`;
              const isCopied = copiedIndex === cmdKey;

              return (
                <div key={idx} className="space-y-1.5">
                  <span className="text-xs font-mono text-muted">{cmd.label}</span>
                  <div className="relative group bg-bg border border-border rounded-xl p-3.5 font-mono text-xs text-text flex items-center justify-between gap-4 transition-colors hover:border-accent/40">
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                      <span className="text-accent select-none">$</span>
                      <code className="text-text font-medium whitespace-nowrap">{cmd.code}</code>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(cmd.code, cmdKey)}
                      title="Copiar comando"
                      className="p-1.5 rounded-lg bg-surface/80 border border-border/80 text-muted hover:text-accent hover:border-accent/40 transition-colors shrink-0 cursor-pointer"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
