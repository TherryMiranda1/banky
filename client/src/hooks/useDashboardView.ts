import { useState, useCallback, useEffect } from "react";

export type DashboardViewMode = "accounts" | "realm";

const STORAGE_KEY = "banky_dashboard_view";

export interface DashboardViewState {
  view: DashboardViewMode;
  toggle: () => void;
  setView: (mode: DashboardViewMode) => void;
}

export function useDashboardView(): DashboardViewState {
  const [view, setViewInternal] = useState<DashboardViewMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "accounts" || stored === "realm") {
        return stored;
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
    return "accounts";
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, view);
    } catch {
      // Ignore storage write errors
    }
  }, [view]);

  const toggle = useCallback(() => {
    setViewInternal((prev) => (prev === "accounts" ? "realm" : "accounts"));
  }, []);

  const setView = useCallback((mode: DashboardViewMode) => {
    setViewInternal(mode);
  }, []);

  return {
    view,
    toggle,
    setView
  };
}
