import { useState, useEffect, useCallback } from "react";
import { getAccounts, getTotalBalance, triggerSync, reorderAccounts, Account } from "@/lib/api/accounts";

export interface DashboardDataState {
  accounts: Account[];
  totalBalance: Record<string, string>;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSyncedAt: string | null;
  refreshData: () => Promise<void>;
  syncAll: () => Promise<void>;
  handleReorderAccounts: (newAccountIds: string[]) => Promise<void>;
}

export function useDashboardData(): DashboardDataState {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [accs, totals] = await Promise.all([getAccounts(), getTotalBalance()]);
      setAccounts(accs);
      setTotalBalance(totals);

      const latestSync = accs.reduce<string | null>((latest, current) => {
        if (!current.syncedAt) return latest;
        if (!latest) return current.syncedAt;
        return new Date(current.syncedAt) > new Date(latest) ? current.syncedAt : latest;
      }, null);

      setLastSyncedAt(latestSync);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(msg);
    } finally {
      if (isInitial) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  const refreshData = useCallback(async () => {
    await fetchDashboardData(false);
  }, [fetchDashboardData]);

  const syncAll = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      await triggerSync();
      await fetchDashboardData(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync operation failed";
      setError(msg);
    } finally {
      setIsSyncing(false);
    }
  }, [fetchDashboardData]);

  const handleReorderAccounts = useCallback(async (newAccountIds: string[]) => {
    // Optimistic update
    const idMap = new Map(accounts.map((a) => [a.id, a]));
    const reordered: Account[] = [];
    newAccountIds.forEach((id, idx) => {
      const acc = idMap.get(id);
      if (acc) {
        reordered.push({ ...acc, position: idx });
      }
    });
    setAccounts(reordered);

    try {
      const updated = await reorderAccounts(newAccountIds);
      setAccounts(updated);
    } catch (err) {
      console.error("Error reordering accounts:", err);
      await fetchDashboardData(false);
    }
  }, [accounts, fetchDashboardData]);

  return {
    accounts,
    totalBalance,
    isLoading,
    isSyncing,
    error,
    lastSyncedAt,
    refreshData,
    syncAll,
    handleReorderAccounts
  };
}

