import React, { useMemo, useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/context/AuthContext";
import { getCurrentPeriod, formatCyclePeriod } from "@/lib/cycle-utils";
import { TotalBalance } from "@/components/balance/TotalBalance";
import { AccountGrid } from "@/components/accounts/AccountGrid";
import { EditAccountModal } from "@/components/accounts/EditAccountModal";
import { CashTransactionModal } from "@/components/transactions/CashTransactionModal";
import { Account, updateAccount, ensureCashAccount } from "@/lib/api/accounts";
import { Plus, Landmark, AlertCircle, RefreshCw, Calendar, Wallet } from "lucide-react";
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
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-64 rounded-3xl bg-surface border border-border/80" />
        <div className="space-y-4">
          <div className="h-5 w-40 rounded-full bg-surface border border-border/80" />
          <AccountGrid accounts={[]} isLoading={true} />
        </div>
      </div>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-surface border border-negative/30 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-negative/10 text-negative flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-text">Error al cargar datos</h2>
        <p className="text-xs text-muted font-mono">{error}</p>
        <button
          type="button"
          onClick={() => refreshData()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-bg font-semibold text-xs uppercase tracking-wider hover:bg-accent/90 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reintentar
        </button>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 sm:p-12 rounded-3xl bg-surface border border-border/80 text-center space-y-6 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mx-auto">
          <Landmark className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-text">Sin bancos conectados</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            Conectá tus cuentas de Santander, Revolut u Open Banking para visualizar tus saldos consolidados y movimientos.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/connect"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-bg font-semibold text-sm hover:bg-accent/90 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Conectar Primer Banco
          </Link>
          <button
            type="button"
            onClick={handleOpenCashModal}
            disabled={isInitializingCash}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-bg border border-border text-text font-semibold text-sm hover:bg-border/60 transition-all cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            Crear Cuenta Efectivo
          </button>
        </div>
      </div>
    );
  }

  const activeAccountsCount = accounts.filter((a) => a.isActive).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Revolut Hero Section */}
      <TotalBalance
        totals={totalBalance}
        lastSyncedAt={lastSyncedAt}
        isSyncing={isSyncing}
        onSync={syncAll}
        onOpenCashModal={handleOpenCashModal}
        isInitializingCash={isInitializingCash}
      />

      {/* Financial Cycle Minimal Chip */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-surface/60 border border-border/60 text-xs">
        <div className="flex items-center gap-2 text-muted">
          <Calendar className="w-3.5 h-3.5 text-accent" />
          <span className="font-medium text-text">Ciclo {cycleInfo.label}:</span>
          <span className="font-mono">{cycleInfo.rangeLabel}</span>
        </div>
        <span className="font-mono text-[11px] text-muted">
          {cutoffDay > 1 ? `Corte día ${cutoffDay}` : "Mes natural"}
        </span>
      </div>

      {/* Accounts Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-text">Cuentas</h2>
          </div>
          <span className="text-xs font-mono text-muted">
            {activeAccountsCount} de {accounts.length} activas
          </span>
        </div>

        <AccountGrid
          accounts={accounts}
          isLoading={false}
          onEdit={(acc) => setEditingAccount(acc)}
          onToggleActive={handleToggleActive}
          onMoveAccount={handleMoveAccount}
        />
      </div>

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
