import React, { useMemo, useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardView } from "@/hooks/useDashboardView";
import { useAuth } from "@/context/AuthContext";
import { getCurrentPeriod, formatCyclePeriod } from "@/lib/cycle-utils";
import { TotalBalance } from "@/components/balance/TotalBalance";
import { AccountGrid } from "@/components/accounts/AccountGrid";
import { EditAccountModal } from "@/components/accounts/EditAccountModal";
import { CashTransactionModal } from "@/components/transactions/CashTransactionModal";
import { RealmView } from "@/components/realm/RealmView";
import { Account, updateAccount, ensureCashAccount } from "@/lib/api/accounts";
import { Plus, Landmark, AlertCircle, RefreshCw, Calendar, Wallet, Castle } from "lucide-react";
import { Link } from "react-router-dom";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const cutoffDay = user?.cutoffDay || 1;
  const currentPeriod = useMemo(() => getCurrentPeriod(cutoffDay), [cutoffDay]);
  const cycleInfo = useMemo(() => formatCyclePeriod(currentPeriod, cutoffDay), [currentPeriod, cutoffDay]);

  const {
    accounts,
    totalBalance,
    isLoading,
    isSyncing,
    error,
    lastSyncedAt,
    refreshData,
    syncAll,
    handleReorderAccounts
  } = useDashboardData();

  const { view, setView } = useDashboardView();

  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isCashModalOpen, setIsCashModalOpen] = useState<boolean>(false);
  const [cashAccount, setCashAccount] = useState<Account | null>(null);
  const [isInitializingCash, setIsInitializingCash] = useState<boolean>(false);

  const handleMoveAccount = async (index: number, direction: "prev" | "next") => {
    if (direction === "prev" && index === 0) return;
    if (direction === "next" && index === accounts.length - 1) return;

    const targetIndex = direction === "prev" ? index - 1 : index + 1;
    const newAccounts = [...accounts];
    const temp = newAccounts[index];
    newAccounts[index] = newAccounts[targetIndex];
    newAccounts[targetIndex] = temp;

    const newIds = newAccounts.map((a) => a.id);
    await handleReorderAccounts(newIds);
  };

  const handleOpenCashModal = async () => {
    const existingCash = accounts.find(
      (a) => a.bankName.toLowerCase().includes("efectivo") || a.bankName.toLowerCase().includes("cash")
    );

    if (existingCash) {
      setCashAccount(existingCash);
      setIsCashModalOpen(true);
    } else {
      try {
        setIsInitializingCash(true);
        const created = await ensureCashAccount();
        setCashAccount(created);
        setIsCashModalOpen(true);
        await refreshData();
      } catch (err) {
        console.error("Error creating cash account:", err);
      } finally {
        setIsInitializingCash(false);
      }
    }
  };

  const handleToggleActive = async (account: Account) => {
    try {
      const nextActive = !account.isActive;
      await updateAccount(account.id, { isActive: nextActive });
      await refreshData();
    } catch (err) {
      console.error("Error toggling account status:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto animate-pulse">
        <div className="h-28 rounded-md bg-surface/50 border border-border/80" />
        <div className="h-64 rounded-md bg-surface/30 border border-border/80" />
      </div>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-md bg-surface border border-expense/30 text-center space-y-4">
        <div className="w-10 h-10 rounded-full bg-expense/10 text-expense flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h2 className="text-base font-semibold text-text">Error al sincronizar datos</h2>
        <p className="text-xs text-muted font-mono">{error}</p>
        <button
          type="button"
          onClick={() => refreshData()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-bg font-semibold text-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-md bg-surface/50 border border-border text-center space-y-5">
        <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border text-accent flex items-center justify-center mx-auto">
          <Landmark className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight text-text">Sin cuentas conectadas</h2>
          <p className="text-xs text-muted max-w-md mx-auto">
            Conectá tus cuentas de Santander, Revolut o bancos compatibles para consolidar tus saldos y movimientos en un solo lugar.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <Link
            to="/connect"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-bg font-semibold text-xs hover:bg-accent/90 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Conectar primer banco</span>
          </Link>
          <button
            type="button"
            onClick={handleOpenCashModal}
            disabled={isInitializingCash}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-surface hover:bg-surface-elevated border border-border text-text font-medium text-xs transition-colors cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-income" />
            <span>Crear cuenta efectivo</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* GitHub Primer Document Balance Header */}
      <TotalBalance
        totals={totalBalance}
        lastSyncedAt={lastSyncedAt}
        isSyncing={isSyncing}
        onSync={syncAll}
        onOpenCashModal={handleOpenCashModal}
        isInitializingCash={isInitializingCash}
      />

      {/* Dashboard View Switcher & Financial Cycle Inline Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="inline-flex items-center p-0.5 rounded-lg bg-surface border border-border">
          <button
            type="button"
            onClick={() => setView("accounts")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer min-h-[32px] ${
              view === "accounts"
                ? "bg-surface-elevated text-accent font-semibold shadow-xs border border-border/80"
                : "text-muted hover:text-text"
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Cuentas</span>
          </button>
          <button
            type="button"
            onClick={() => setView("realm")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer min-h-[32px] ${
              view === "realm"
                ? "bg-surface-elevated text-accent font-semibold shadow-xs border border-border/80"
                : "text-muted hover:text-text"
            }`}
          >
            <Castle className="w-3.5 h-3.5" />
            <span>Reino</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface/40 border border-border text-xs font-mono text-muted">
          <Calendar className="w-3.5 h-3.5 text-accent" />
          <span className="text-text font-medium hidden sm:inline">Ciclo {cycleInfo.label}:</span>
          <span>{cycleInfo.rangeLabel}</span>
          <span className="text-[11px] hidden md:inline text-muted/80">
            • {cutoffDay > 1 ? `Corte día ${cutoffDay}` : "Mes natural"}
          </span>
        </div>
      </div>

      {/* Main View Content */}
      {view === "accounts" ? (
        <AccountGrid
          accounts={accounts}
          isLoading={false}
          onEdit={(acc) => setEditingAccount(acc)}
          onToggleActive={handleToggleActive}
          onMoveAccount={handleMoveAccount}
        />
      ) : (
        <RealmView
          period={currentPeriod}
          activeAccountsCount={accounts.filter((a) => a.isActive).length}
          totalAccountsCount={accounts.length}
          onOpenCashModal={handleOpenCashModal}
          onSync={syncAll}
          isSyncing={isSyncing}
        />
      )}

      {/* Modals */}
      <EditAccountModal
        account={editingAccount}
        isOpen={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        onSaved={async () => {
          await refreshData();
        }}
      />

      <CashTransactionModal
        cashAccount={cashAccount}
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        onSuccess={async () => {
          await refreshData();
        }}
      />
    </div>
  );
};
