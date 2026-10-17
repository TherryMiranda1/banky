import React from "react";
import {
  Key,
  Shield,
  Clock,
  Trash2,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { ApiKeyItem, ApiKeyScope } from "@/lib/api/api-keys";

interface ApiKeyListProps {
  keys: ApiKeyItem[];
  revokingId: string | null;
  onRevoke: (id: string) => void;
  onOpenCreate: () => void;
}

const SCOPE_LABELS: Record<ApiKeyScope, { label: string; color: string }> = {
  "accounts:read": { label: "Cuentas (Lectura)", color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  "balance:read": { label: "Saldos (Lectura)", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  "transactions:read": { label: "Transacciones (Lectura)", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  "transactions:write": { label: "Transacciones (Escritura)", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  "categories:read": { label: "Categorías (Lectura)", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  "budgets:read": { label: "Presupuestos (Lectura)", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  "sync:write": { label: "Sync Bancario (Ejecución)", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" }
};

function formatDate(isoString: string | null): string {
  if (!isoString) return "Nunca";
  const date = new Date(isoString);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getKeyStatus(key: ApiKeyItem): { label: string; badgeClass: string } {
  if (key.revokedAt) {
    return {
      label: "Revocada",
      badgeClass: "text-negative bg-negative/10 border-negative/20"
    };
  }
  if (key.expiresAt && new Date(key.expiresAt).getTime() < Date.now()) {
    return {
      label: "Expirada",
      badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/20"
    };
  }
  return {
    label: "Activa",
    badgeClass: "text-accent bg-accent/10 border-accent/20"
  };
}

export const ApiKeyList: React.FC<ApiKeyListProps> = ({
  keys,
  revokingId,
  onRevoke,
  onOpenCreate
}) => {
  if (keys.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-surface border border-border flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
          <Key className="w-6 h-6" />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="font-semibold text-text text-base">No hay API Keys generadas</h3>
          <p className="text-muted text-xs leading-relaxed">
            Crea una API Key para conectar scripts, integraciones o automatizar consultas sin exponer tus credenciales de sesión.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreate}
          className="px-4 py-2 rounded-xl bg-accent text-bg font-semibold text-xs hover:bg-accent/90 transition-all cursor-pointer shadow-md hover:shadow-accent/20"
        >
          Crear mi primera API Key
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {keys.map((k) => {
        const status = getKeyStatus(k);
        const isRevoked = !!k.revokedAt;
        const isExpired = !!k.expiresAt && new Date(k.expiresAt).getTime() < Date.now();
        const canRevoke = !isRevoked && !isExpired;

        return (
          <div
            key={k.id}
            className={`p-4 rounded-2xl bg-surface border transition-all ${
              isRevoked
                ? "border-border/40 opacity-60"
                : "border-border hover:border-border/80 shadow-sm"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 font-semibold text-text text-sm">
                    <Key className="w-4 h-4 text-accent shrink-0" />
                    <span className="truncate">{k.name}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${status.badgeClass}`}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-muted">
                  <span className="px-1.5 py-0.5 rounded bg-bg border border-border text-[11px] text-text">
                    {k.keyPrefix}...
                  </span>
                </div>
              </div>

              {canRevoke && (
                <button
                  type="button"
                  onClick={() => onRevoke(k.id)}
                  disabled={revokingId === k.id}
                  className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-negative/30 bg-negative/10 hover:bg-negative/20 text-negative text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{revokingId === k.id ? "Revocando..." : "Revocar"}</span>
                </button>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap gap-1.5">
              {k.scopes.map((scope) => {
                const badge = SCOPE_LABELS[scope] || {
                  label: scope,
                  color: "text-muted bg-border/40 border-border"
                };
                return (
                  <span
                    key={scope}
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border font-mono ${badge.color}`}
                  >
                    <Shield className="w-2.5 h-2.5" />
                    {badge.label}
                  </span>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-muted font-mono">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted shrink-0" />
                <span>Creada: {formatDate(k.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted shrink-0" />
                <span>Último uso: {formatDate(k.lastUsedAt)}</span>
              </div>
              <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
                <AlertTriangle className="w-3 h-3 text-muted shrink-0" />
                <span>Expira: {formatDate(k.expiresAt)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
