import React, { useState, useEffect } from "react";
import { Account, updateAccount } from "@/lib/api/accounts";
import { BankLogo } from "./BankLogo";
import { X, Check, Power, Tag, AlertCircle, Loader2 } from "lucide-react";

interface EditAccountModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedAccount: Account) => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  account,
  isOpen,
  onClose,
  onSaved
}) => {
  const [nickname, setNickname] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account && isOpen) {
      setNickname(account.nickname || "");
      setIsActive(account.isActive ?? true);
      setError(null);
    }
  }, [account, isOpen]);

  if (!isOpen || !account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const trimmed = nickname.trim();
      const updated = await updateAccount(account.id, {
        nickname: trimmed.length > 0 ? trimmed : null,
        isActive
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al actualizar la cuenta";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BankLogo bankName={account.bankName} logoUrl={account.logoUrl} size="sm" />
            <div>
              <h3 className="font-bold text-base text-text">Configurar Cuenta</h3>
              <p className="text-xs text-muted font-mono">{account.bankName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-border/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-negative/10 border border-negative/20 text-negative text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nickname Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-text uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-accent" />
              Nombre / Nickname personalizado
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={account.alias || account.bankName}
              maxLength={50}
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-border text-text placeholder:text-muted/60 text-sm focus:outline-none focus:border-accent transition-colors font-sans"
            />
            <p className="text-[11px] text-muted font-mono">
              Nombre visible en dashboards, gráficos y reportes.
            </p>
          </div>

          {/* Active / Inactive Toggle Switch */}
          <div className="p-4 rounded-xl bg-bg border border-border/80 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Power className={`w-3.5 h-3.5 ${isActive ? "text-accent" : "text-muted"}`} />
                <span className="text-sm font-semibold text-text">
                  {isActive ? "Cuenta Activa" : "Cuenta Desactivada"}
                </span>
              </div>
              <p className="text-xs text-muted">
                {isActive
                  ? "Incluida en balance global y analíticas."
                  : "Oculta de los totales agregados y presupuestos."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? "bg-accent" : "bg-border"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-text hover:bg-border/50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-accent text-bg font-semibold text-xs uppercase tracking-wider hover:bg-accent/90 transition-all shadow-[0_0_15px_rgba(0,229,160,0.25)] cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
