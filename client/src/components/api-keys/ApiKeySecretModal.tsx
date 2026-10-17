import React, { useState } from "react";
import {
  Key,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";
import { CreateApiKeyResult } from "@/lib/api/api-keys";

interface ApiKeySecretModalProps {
  result: CreateApiKeyResult | null;
  onClose: () => void;
}

export const ApiKeySecretModal: React.FC<ApiKeySecretModalProps> = ({
  result,
  onClose
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!result) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-surface border border-accent/40 rounded-2xl shadow-[0_0_50px_rgba(0,229,160,0.15)] p-6 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-text text-base">API Key Generada</h2>
            <p className="text-muted text-xs">Clave: {result.name}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300 leading-relaxed">
            <span className="font-semibold text-amber-200">Copia esta clave ahora.</span> Por razones de seguridad bancaria, no volverá a mostrarse en ningún lugar. Si la pierdes, deberás revocarla y crear una nueva.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-muted">Tu API Key (Bearer Token)</label>
          <div className="relative flex items-center">
            <input
              type="text"
              readOnly
              value={result.key}
              className="w-full pl-3 pr-24 py-2.5 rounded-xl bg-bg border border-accent/30 text-accent font-mono text-xs select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-accent text-bg font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:bg-accent/90"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copiada</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-bg/60 border border-border/60 space-y-1.5 text-xs font-mono text-muted">
          <div className="flex items-center justify-between">
            <span>Prefijo público:</span>
            <span className="text-text">{result.keyPrefix}...</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Permisos otorgados:</span>
            <span className="text-text">{result.scopes.length} scopes</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Expira en:</span>
            <span className="text-text">
              {result.expiresAt
                ? new Date(result.expiresAt).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })
                : "Sin expiración"}
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-accent text-bg font-semibold text-xs hover:bg-accent/90 transition-all cursor-pointer shadow-md hover:shadow-accent/20 flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>He guardado mi clave</span>
          </button>
        </div>
      </div>
    </div>
  );
};
