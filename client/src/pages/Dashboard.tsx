import React from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { TotalBalance } from "@/components/balance/TotalBalance";
import { AccountGrid } from "@/components/accounts/AccountGrid";
import { PlusCircle, Landmark, AlertCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export const Dashboard: React.FC = () => {
  const {
    accounts,
    totalBalance,
    isLoading,
    isSyncing,
    error,
    lastSyncedAt,
    refreshData,
    syncAll
  } = useDashboardData();

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8 max-w-6xl animate-pulse">
        <div className="h-44 sm:h-56 rounded-2xl bg-surface border border-border" />
        <div className="space-y-4">
          <div className="h-6 w-48 rounded bg-surface border border-border" />
          <AccountGrid accounts={[]} isLoading={true} />
        </div>
      </div>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-8 sm:my-12 p-6 sm:p-8 rounded-2xl bg-surface border border-negative/30 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-negative/10 text-negative flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-text">Failed to load dashboard data</h2>
        <p className="text-sm text-muted font-mono">{error}</p>
        <button
          type="button"
          onClick={() => refreshData()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-bg font-semibold text-xs uppercase tracking-wider hover:bg-accent/90 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-8 sm:my-12 p-6 sm:p-12 rounded-2xl bg-surface border border-border text-center space-y-6 shadow-2xl">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-accent/10 border border-accent/30 text-accent flex items-center justify-center mx-auto">
          <Landmark className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text">No banks connected</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            Connect your Santander, Revolut, or Open Banking accounts to aggregate balances and monitor cash flow securely.
          </p>
        </div>
        <div>
          <Link
            to="/connect"
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-accent text-bg font-semibold text-sm hover:bg-accent/90 shadow-[0_0_20px_rgba(0,229,160,0.3)] transition-all cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            Connect Your First Bank
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl">
      <TotalBalance
        totals={totalBalance}
        lastSyncedAt={lastSyncedAt}
        isSyncing={isSyncing}
        onSync={syncAll}
      />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-text">Connected Accounts</h2>
            <p className="text-xs text-muted font-mono mt-0.5">
              Cached locally in SQLite with zero read latency
            </p>
          </div>
          <span className="text-xs font-mono text-muted">
            {accounts.length} {accounts.length === 1 ? "account" : "accounts"} active
          </span>
        </div>

        <AccountGrid accounts={accounts} isLoading={false} />
      </div>
    </div>
  );
};
