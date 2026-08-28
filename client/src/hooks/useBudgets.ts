import { useState, useEffect, useCallback } from "react";
import {
  BudgetItem,
  CategoryAnalyticsResponse,
  getBudgets,
  updateBudgets,
  getCategoryAnalytics
} from "@/lib/api/budgets";
import { useAuth } from "@/context/AuthContext";

function getDefaultPeriod(cutoffDay = 1): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  if (cutoffDay === 1 || day < cutoffDay) {
    return `${year}-${String(month).padStart(2, "0")}`;
  }

  if (month === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function shiftPeriod(period: string, delta: number): string {
  const [yStr, mStr] = period.split("-");
  let y = parseInt(yStr, 10);
  let m = parseInt(mStr, 10) + delta;
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

export interface UseBudgetsState {
  period: string;
  budgets: BudgetItem[];
  analytics: CategoryAnalyticsResponse | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  toastMessage: string | null;
  setPeriod: (period: string) => void;
  prevPeriod: () => void;
  nextPeriod: () => void;
  saveSingleBudget: (categoryId: string, amount: string) => Promise<boolean>;
  saveAllBudgets: (updates: Array<{ categoryId: string; amount: string }>) => Promise<boolean>;
  refreshData: () => Promise<void>;
  dismissToast: () => void;
}

export function useBudgets(initialPeriod?: string): UseBudgetsState {
  const { user } = useAuth();
  const [period, setPeriodState] = useState<string>(() => initialPeriod || getDefaultPeriod(user?.cutoffDay));
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [analytics, setAnalytics] = useState<CategoryAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchData = useCallback(async (targetPeriod: string, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const [budgetsRes, analyticsRes] = await Promise.all([
        getBudgets(targetPeriod),
        getCategoryAnalytics(targetPeriod)
      ]);
      setBudgets(budgetsRes.data);
      setAnalytics(analyticsRes);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar presupuestos y analíticas";
      setError(msg);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period, true);
  }, [period, fetchData]);

  const setPeriod = useCallback((newPeriod: string) => {
    setPeriodState(newPeriod);
  }, []);

  const prevPeriod = useCallback(() => {
    setPeriodState((curr) => shiftPeriod(curr, -1));
  }, []);

  const nextPeriod = useCallback(() => {
    setPeriodState((curr) => shiftPeriod(curr, 1));
  }, []);

  const saveSingleBudget = useCallback(
    async (categoryId: string, amount: string): Promise<boolean> => {
      setIsSaving(true);
      setError(null);
      try {
        await updateBudgets(period, [{ categoryId, amount }]);
        await fetchData(period, false);
        setToastMessage("Presupuesto guardado correctamente");
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al guardar el presupuesto";
        setError(msg);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [period, fetchData]
  );

  const saveAllBudgets = useCallback(
    async (updates: Array<{ categoryId: string; amount: string }>): Promise<boolean> => {
      setIsSaving(true);
      setError(null);
      try {
        await updateBudgets(period, updates);
        await fetchData(period, false);
        setToastMessage("Presupuestos actualizados con éxito");
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al actualizar presupuestos";
        setError(msg);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [period, fetchData]
  );

  const refreshData = useCallback(async () => {
    await fetchData(period, false);
  }, [period, fetchData]);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  return {
    period,
    budgets,
    analytics,
    isLoading,
    isSaving,
    error,
    toastMessage,
    setPeriod,
    prevPeriod,
    nextPeriod,
    saveSingleBudget,
    saveAllBudgets,
    refreshData,
    dismissToast
  };
}
