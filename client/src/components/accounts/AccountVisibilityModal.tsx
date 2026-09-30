import React, { useState, useEffect } from "react";
import {
  BankConnection,
  Account,
  getBankConnections,
  getAccountsByConnection,
  toggleAccountVisibility,
  disconnectBank
} from "@/lib/api/accounts";
import { BankLogo } from "./BankLogo";
import { maskIban, formatCurrencySymbol, formatBalanceAmount } from "@/lib/bank-utils";
import {
  X,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Loader2,
  ChevronRight,
  ArrowLeft
} from "lucide-react";

interface AccountVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => Promise<void>;
  initialConnectionId?: string | null;
}

export const AccountVisibilityModal: React.FC<AccountVisibilityModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
  initialConnectionId
}) => {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [connectionAccounts, setConnectionAccounts] = useState<Account[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState<boolean>(true);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(false);
  const [togglingAccountId, setTogglingAccountId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function load() {
      setIsLoadingConnections(true);
      setError(null);
      try {
        const conns = await getBankConnections();
        if (!isMounted) return;
        setConnections(conns);

        if (initialConnectionId) {
          const match = conns.find((c) => c.id === initialConnectionId);
          if (match) {
            setSelectedConnectionId(match.id);
            return;
          }
        }

        if (conns.length === 1) {
          setSelectedConnectionId(conns[0].id);
        } else {
          setSelectedConnectionId(null);
        }
      } catch (err) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Error al cargar conexiones bancarias";
        setError(msg);
      } finally {
        if (isMounted) {
          setIsLoadingConnections(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [isOpen, initialConnectionId]);

  useEffect(() => {
    if (!selectedConnectionId || !isOpen) {
      setConnectionAccounts([]);
      return;
    }

    const connId = selectedConnectionId;
    let isMounted = true;
    async function loadAccounts() {
      setIsLoadingAccounts(true);
      setError(null);
      try {
        const data = await getAccountsByConnection(connId);
        if (!isMounted) return;
        setConnectionAccounts(data.accounts);
      } catch (err) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Error al cargar cuentas de la entidad";
        setError(msg);
      } finally {
        if (isMounted) {
          setIsLoadingAccounts(false);
        }
      }
    }

    loadAccounts();
    return () => {
      isMounted = false;
    };
  }, [selectedConnectionId, isOpen]);

  if (!isOpen) return null;

  const handleToggle = async (account: Account) => {
    const nextState = !account.isActive;
    setTogglingAccountId(account.id);

    setConnectionAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? { ...a, isActive: nextState } : a))
    );

    try {
      await toggleAccountVisibility(account.id, nextState);
      await onUpdated();

      setConnections((prev) =>
        prev.map((c) => {
          if (c.id === selectedConnectionId) {
            return {
              ...c,
              activeAccountsCount: nextState
                ? c.activeAccountsCount + 1
                : Math.max(0, c.activeAccountsCount - 1)
            };
          }
          return c;
        })
      );
    } catch (err) {
      setConnectionAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, isActive: account.isActive } : a))
      );
      const msg = err instanceof Error ? err.message : "Error al actualizar visibilidad";
      setError(msg);
    } finally {
      setTogglingAccountId(null);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    setIsDeleting(true);
    setError(null);
    try {
      await disconnectBank(connectionId);
      await onUpdated();
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      setSelectedConnectionId(null);
      setConfirmDeleteId(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al desconectar el banco";
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedConn = connections.find((c) => c.id === selectedConnectionId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full sm:max-w-xl max-h-[85vh] sm:max-h-[90vh] bg-surface border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-border bg-surface-elevated flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedConnectionId && connections.length > 1 ? (
              <button
                type="button"
                onClick={() => setSelectedConnectionId(null)}
                className="p-1 -ml-1 rounded-md text-muted hover:text-text transition-colors cursor-pointer"
                title="Volver a lista de bancos"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <Building2 className="w-4 h-4 text-accent shrink-0" />
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-text truncate">
                {selectedConn ? `Cuentas · ${selectedConn.bankName}` : "Entidades y Cuentas Conectadas"}
              </h3>
              <p className="text-[11px] font-mono text-muted truncate">
                {selectedConn
                  ? `${selectedConn.activeAccountsCount} de ${selectedConn.accountsCount} cuentas activas`
                  : "Configurá qué cuentas incluir en tus balances"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-border/60 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-expense/10 border-b border-expense/20 text-expense text-xs font-mono flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {isLoadingConnections ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
              <span className="text-xs font-mono">Cargando entidades...</span>
            </div>
          ) : connections.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Building2 className="w-8 h-8 text-muted mx-auto" />
              <p className="text-sm font-semibold text-text">No hay entidades conectadas</p>
              <p className="text-xs font-mono text-muted max-w-sm mx-auto">
                Conectá tu primer banco para seleccionar qué cuentas querés monitorear.
              </p>
            </div>
          ) : !selectedConnectionId ? (
            /* Connections List View */
            <div className="space-y-2.5">
              <p className="text-xs text-muted font-mono mb-2">
                Seleccioná una entidad bancaria para activar o desactivar sus cuentas:
              </p>
              <div className="divide-y divide-border border border-border rounded-lg bg-surface/40 overflow-hidden">
                {connections.map((conn) => (
                  <div
                    key={conn.id}
                    onClick={() => setSelectedConnectionId(conn.id)}
                    className="p-3.5 flex items-center justify-between hover:bg-surface-elevated transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <BankLogo bankName={conn.bankName} logoUrl={conn.logoUrl} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-text group-hover:text-accent transition-colors truncate">
                            {conn.bankName}
                          </h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded uppercase bg-surface-elevated border border-border text-muted">
                            {conn.aspspCountry}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-muted mt-0.5">
                          {conn.activeAccountsCount} de {conn.accountsCount} activas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ChevronRight className="w-4 h-4 text-muted group-hover:text-text transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Accounts within Selected Connection */
            <div className="space-y-3">
              {isLoadingAccounts ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                  <span className="text-xs font-mono">Cargando cuentas...</span>
                </div>
              ) : connectionAccounts.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-muted">
                  No se encontraron cuentas para esta conexión.
                </div>
              ) : (
                <div className="divide-y divide-border border border-border rounded-lg bg-surface/40 overflow-hidden">
                  {connectionAccounts.map((account) => {
                    const isActive = account.isActive ?? true;
                    const isToggling = togglingAccountId === account.id;
                    const balanceAmountStr = account.lastBalance?.amount ?? "0.00";
                    const balanceNum = parseFloat(balanceAmountStr);
                    const isNegative = !isNaN(balanceNum) && balanceNum < 0;

                    return (
                      <div
                        key={account.id}
                        className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                          !isActive ? "opacity-60 bg-surface/20" : "bg-transparent"
                        }`}
                      >
                        {/* Account Info */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs sm:text-sm text-text truncate">
                              {account.nickname || account.alias || account.bankName}
                            </span>
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-income/10 text-income border border-income/20">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Activa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-elevated text-muted border border-border">
                                <EyeOff className="w-2.5 h-2.5" />
                                Oculta
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs font-mono text-muted flex-wrap">
                            <span>{maskIban(account.iban)}</span>
                            {account.lastBalance && (
                              <span className={isNegative ? "text-expense font-semibold" : "text-text font-semibold"}>
                                {formatCurrencySymbol(account.currency)}
                                {formatBalanceAmount(balanceAmountStr)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggle(account)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer shrink-0 ${
                            isActive
                              ? "bg-surface-elevated hover:bg-surface border border-border text-text hover:text-expense"
                              : "bg-income text-bg hover:bg-income/90 font-semibold"
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isActive ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Desactivar</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Activar</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Danger Zone: Disconnect Entire Bank */}
              <div className="pt-3 border-t border-border/80">
                {confirmDeleteId === selectedConnectionId ? (
                  <div className="p-3.5 rounded-lg bg-expense/10 border border-expense/30 space-y-2.5 animate-in fade-in">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-expense shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-expense">
                          ¿Desconectar {selectedConn?.bankName}?
                        </p>
                        <p className="text-[11px] font-mono text-muted">
                          Se eliminarán el vínculo bancario y todas sus cuentas asociadas.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isDeleting}
                        className="px-2.5 py-1 text-xs font-mono text-muted hover:text-text transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => selectedConnectionId && handleDeleteConnection(selectedConnectionId)}
                        disabled={isDeleting || !selectedConnectionId}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-expense text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Confirmar Desconexión
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-muted">
                      ¿Ya no utilizás esta entidad?
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(selectedConnectionId)}
                      className="inline-flex items-center gap-1 text-xs font-mono text-muted hover:text-expense transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Desconectar banco</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-surface-elevated flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-accent text-bg font-semibold text-xs hover:bg-accent/90 transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
