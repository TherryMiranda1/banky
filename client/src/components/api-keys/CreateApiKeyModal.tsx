import React, { useState } from "react";
import {
  X,
  Key,
  Shield,
  Clock,
  Check
} from "lucide-react";
import { ApiKeyScope, CreateApiKeyPayload } from "@/lib/api/api-keys";

interface CreateApiKeyModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateApiKeyPayload) => Promise<boolean>;
}

interface ScopeOption {
  id: ApiKeyScope;
  label: string;
  desc: string;
  isWrite?: boolean;
}

const SCOPE_GROUPS: Array<{ title: string; options: ScopeOption[] }> = [
  {
    title: "Cuentas y Saldos",
    options: [
      { id: "accounts:read", label: "accounts:read", desc: "Listar cuentas, detalles y alias de bancos y efectivo" },
      { id: "balance:read", label: "balance:read", desc: "Consultar saldos agregados y balances consolidados" }
    ]
  },
  {
    title: "Transacciones",
    options: [
      { id: "transactions:read", label: "transactions:read", desc: "Consultar movimientos bancarios y filtros históricos" },
      { id: "transactions:write", label: "transactions:write", desc: "Registrar gastos manuales, notas o cambiar categorías", isWrite: true }
    ]
  },
  {
    title: "Categorías y Presupuestos",
    options: [
      { id: "categories:read", label: "categories:read", desc: "Consultar categorías y reglas automáticas" },
      { id: "budgets:read", label: "budgets:read", desc: "Ver metas de ahorro y analítica de presupuestos" }
    ]
  },
  {
    title: "Sincronización Bancaria",
    options: [
      { id: "sync:write", label: "sync:write", desc: "Disparar sincronizaciones con Enable Banking vía AISP", isWrite: true }
    ]
  }
];

export const CreateApiKeyModal: React.FC<CreateApiKeyModalProps> = ({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState<string>("");
  const [selectedScopes, setSelectedScopes] = useState<ApiKeyScope[]>([
    "accounts:read",
    "balance:read",
    "transactions:read"
  ]);
  const [expiresInDays, setExpiresInDays] = useState<number>(90);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleScope = (scopeId: ApiKeyScope) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError("Introduce un nombre descriptivo para identificar tu key");
      return;
    }
    if (selectedScopes.length === 0) {
      setValidationError("Debes seleccionar al menos un scope de permisos");
      return;
    }

    setValidationError(null);
    const success = await onSubmit({
      name: name.trim(),
      scopes: selectedScopes,
      expiresInDays
    });

    if (success) {
      setName("");
      setSelectedScopes(["accounts:read", "balance:read", "transactions:read"]);
      setExpiresInDays(90);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-text text-sm sm:text-base">Nueva API Key</h2>
              <p className="text-muted text-xs">Crea credenciales con permisos granulares</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-text p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {validationError && (
          <div className="p-3 rounded-xl bg-negative/10 border border-negative/20 text-negative text-xs">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text">Nombre de la clave</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Script Sincronización Notifier"
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-border focus:border-accent focus:outline-none text-text text-xs placeholder:text-muted/60 transition-colors"
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>Vigencia</span>
            </label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-border focus:border-accent focus:outline-none text-text text-xs transition-colors cursor-pointer"
            >
              <option value={30}>30 días</option>
              <option value={60}>60 días</option>
              <option value={90}>90 días (recomendado)</option>
              <option value={180}>180 días (6 meses)</option>
              <option value={365}>365 días (1 año)</option>
            </select>
          </div>

          <div className="space-y-2.5 pt-1">
            <label className="text-xs font-medium text-text flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-accent" />
              <span>Permisos (Scopes)</span>
            </label>

            <div className="space-y-3">
              {SCOPE_GROUPS.map((group) => (
                <div key={group.title} className="p-3 rounded-xl bg-bg/60 border border-border/60 space-y-2">
                  <p className="text-[11px] font-semibold text-text uppercase tracking-wider font-mono">
                    {group.title}
                  </p>
                  <div className="space-y-1.5">
                    {group.options.map((opt) => {
                      const isSelected = selectedScopes.includes(opt.id);
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => toggleScope(opt.id)}
                          className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-surface border border-accent/30 shadow-xs"
                              : "bg-transparent border border-transparent hover:bg-surface/50"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center shrink-0 border transition-all ${
                              isSelected
                                ? "bg-accent border-accent text-bg"
                                : "border-muted/50 bg-bg"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-semibold text-text">
                                {opt.label}
                              </span>
                              {opt.isWrite && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20">
                                  Escritura
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted leading-tight mt-0.5">
                              {opt.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-border text-xs text-muted hover:text-text transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-accent text-bg font-semibold text-xs hover:bg-accent/90 transition-all cursor-pointer disabled:opacity-50 shadow-md hover:shadow-accent/20"
            >
              {isSubmitting ? "Creando..." : "Crear API Key"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
