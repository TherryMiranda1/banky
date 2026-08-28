import { useState, useEffect, useCallback, useMemo } from "react";
import { getAspsps, startAuth, Aspsp } from "@/lib/api/auth";

export interface UseConnectFlowResult {
  aspsps: Aspsp[];
  filteredAspsps: Aspsp[];
  featuredAspsps: Aspsp[];
  isLoading: boolean;
  error: string | null;
  connectingBank: string | null;
  searchQuery: string;
  selectedCountry: string;
  setSearchQuery: (query: string) => void;
  setSelectedCountry: (country: string) => void;
  handleConnect: (aspsp: Aspsp) => Promise<void>;
  refetch: () => Promise<void>;
}

const FEATURED_BANKS = ["santander", "revolut", "bbva", "caixabank"];

export function useConnectFlow(): UseConnectFlowResult {
  const [aspsps, setAspsps] = useState<Aspsp[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectingBank, setConnectingBank] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("ES");

  const loadAspsps = useCallback(async (country: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAspsps(country);
      setAspsps(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load available banks");
      setAspsps([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAspsps(selectedCountry);
  }, [selectedCountry, loadAspsps]);

  const handleConnect = useCallback(async (aspsp: Aspsp) => {
    setError(null);
    setConnectingBank(aspsp.name);
    try {
      const { url } = await startAuth(aspsp.name, aspsp.country, aspsp.logo);
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No authorization URL returned by server");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate bank connection");
      setConnectingBank(null);
    }
  }, []);

  const filteredAspsps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return aspsps;
    return aspsps.filter((bank) =>
      bank.name.toLowerCase().includes(query) ||
      (bank.bic && bank.bic.toLowerCase().includes(query))
    );
  }, [aspsps, searchQuery]);

  const featuredAspsps = useMemo(() => {
    return aspsps.filter((bank) =>
      FEATURED_BANKS.some((f) => bank.name.toLowerCase().includes(f))
    );
  }, [aspsps]);

  return {
    aspsps,
    filteredAspsps,
    featuredAspsps,
    isLoading,
    error,
    connectingBank,
    searchQuery,
    selectedCountry,
    setSearchQuery,
    setSelectedCountry,
    handleConnect,
    refetch: () => loadAspsps(selectedCountry)
  };
}
