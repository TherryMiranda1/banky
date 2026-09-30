import React, { useState } from "react";
import { KeyRound, ShieldAlert, Copy, Check, ArrowUpRight } from "lucide-react";

export const OnlineBankingSetupSection: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <section id="online-banking" className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-mono">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Configuración Enable Banking AISP</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
          Cómo configurar tu proveedor de Open Banking
        </h2>
        <p className="text-sm text-muted max-w-2xl mx-auto">
          Banky utiliza la API oficial de Enable Banking para comunicarse de forma segura y autorizada (PSD2) con más de 2.000 bancos europeos sin custodiar credenciales bancarias.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between space-y-4 hover:border-accent/40 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 text-accent font-mono font-bold text-xs flex items-center justify-center">
                01
              </span>
              <span className="text-[11px] font-mono text-muted">RSA 4096 RS256</span>
            </div>
            <h3 className="font-bold text-base text-text">Generar Par de Claves RSA</h3>
            <p className="text-xs text-muted leading-relaxed">
              Enable Banking firma las solicitudes con JWT RS256. Genera tu clave privada y extrae la clave pública:
            </p>
            <div className="space-y-2 pt-1">
              <div className="relative group bg-bg border border-border rounded-lg p-2.5 font-mono text-[11px] flex items-center justify-between gap-2">
                <code className="text-text truncate select-all">openssl genrsa -out private.key 4096</code>
                <button
                  type="button"
                  onClick={() => handleCopy("openssl genrsa -out private.key 4096", "rsa1")}
                  className="p-1 rounded bg-surface text-muted hover:text-accent cursor-pointer"
                >
                  {copiedKey === "rsa1" ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="relative group bg-bg border border-border rounded-lg p-2.5 font-mono text-[11px] flex items-center justify-between gap-2">
                <code className="text-text truncate select-all">openssl rsa -in private.key -pubout -out public.key</code>
                <button
                  type="button"
                  onClick={() => handleCopy("openssl rsa -in private.key -pubout -out public.key", "rsa2")}
                  className="p-1 rounded bg-surface text-muted hover:text-accent cursor-pointer"
                >
                  {copiedKey === "rsa2" ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted border-t border-border/60 pt-3">
            Guarda <code className="text-text font-mono">private.key</code> de forma confidencial. Nunca la subas al repositorio.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between space-y-4 hover:border-accent/40 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 text-accent font-mono font-bold text-xs flex items-center justify-center">
                02
              </span>
              <a
                href="https://enablebanking.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-mono text-accent inline-flex items-center gap-1 hover:underline"
              >
                enablebanking.com <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
            <h3 className="font-bold text-base text-text">Registrar App en Console</h3>
            <p className="text-xs text-muted leading-relaxed">
              Crea una cuenta en la consola de Enable Banking, registra una nueva aplicación y sube tu <code className="text-text font-mono">public.key</code>.
            </p>
            <div className="p-3 rounded-xl bg-bg border border-border space-y-2 text-xs text-muted">
              <div className="flex items-center justify-between">
                <span>Application ID:</span>
                <span className="font-mono text-text text-[11px]">APP_ID</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Entorno:</span>
                <span className="font-mono text-accent text-[11px]">Production / Test</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Licencia:</span>
                <span className="font-mono text-text text-[11px]">Free Tier</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted border-t border-border/60 pt-3">
            Obtendrás tu <code className="text-text font-mono">APP_ID</code> para colocarlo en <code className="text-text font-mono">server/wrangler.toml</code>.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-border flex flex-col justify-between space-y-4 hover:border-accent/40 transition-colors">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 text-accent font-mono font-bold text-xs flex items-center justify-center">
                03
              </span>
              <span className="text-[11px] font-mono text-muted">OAuth 2.0 / PSD2</span>
            </div>
            <h3 className="font-bold text-base text-text">Configurar Redirect URI</h3>
            <p className="text-xs text-muted leading-relaxed">
              En la configuración de la app en Enable Banking Console, añade tu URL autorizada de redirección:
            </p>
            <div className="relative group bg-bg border border-border rounded-lg p-2.5 font-mono text-[11px] flex items-center justify-between gap-2">
              <code className="text-text truncate select-all">https://tudominio.com/auth/callback</code>
              <button
                type="button"
                onClick={() => handleCopy("https://tudominio.com/auth/callback", "redirect")}
                className="p-1 rounded bg-surface text-muted hover:text-accent cursor-pointer"
              >
                {copiedKey === "redirect" ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-accent/[0.04] border border-accent/20 text-[11px] text-accent flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Los bancos solo redirigen al dominio exacto declarado para prevenir ataques man-in-the-middle.</span>
          </div>
        </div>
      </div>
    </section>
  );
};
