import { useState, useEffect, useCallback } from "react";
import { getKingdomState, type KingdomState } from "@/lib/api/kingdom";

export interface UseKingdomReturn {
  state: KingdomState | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useKingdom(period: string): UseKingdomReturn {
  const [state, setState] = useState<KingdomState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKingdom = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await getKingdomState(period);
      setState(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar el reino";
      setError(msg);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [period]);

  useEffect(() => {
    fetchKingdom(true);
  }, [fetchKingdom]);

  const refresh = useCallback(async () => {
    await fetchKingdom(false);
  }, [fetchKingdom]);

  return {
    state,
    isLoading,
    error,
    refresh
  };
}
