import React from "react";
import { useConnectFlow } from "@/hooks/useConnectFlow";
import { Aspsp } from "@/lib/api/auth";
import {
  Building2,
  Search,
  Lock,
  ArrowUpRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  Globe
} from "lucide-react";

const COUNTRIES = [
  { code: "ES", label: "Spain" },
  { code: "GB", label: "United Kingdom" },
  { code: "FR", label: "France" },
  { code: "DE", label: "Germany" },
  { code: "IT", label: "Italy" }
];

function getBankStyle(name: string): { borderHover: string; glow: string; badgeColor: string; isSpecial: boolean } {
  const lower = name.toLowerCase();
  if (lower.includes("santander")) {
    return {
      borderHover: "hover:border-[#ec0000]/60",
      glow: "hover:shadow-[0_0_24px_-4px_rgba(236,0,0,0.35)]",
      badgeColor: "bg-[#ec0000]/10 text-[#ec0000] border-[#ec0000]/20",
      isSpecial: true
    };
  }
  if (lower.includes("revolut")) {
    return {
      borderHover: "hover:border-[#1964f7]/60",
      glow: "hover:shadow-[0_0_24px_-4px_rgba(25,100,247,0.35)]",
      badgeColor: "bg-[#1964f7]/10 text-[#1964f7] border-[#1964f7]/20",
      isSpecial: true
    };
  }
  if (lower.includes("bbva")) {
    return {
      borderHover: "hover:border-[#004481]/60",
      glow: "hover:shadow-[0_0_24px_-4px_rgba(0,68,129,0.35)]",
      badgeColor: "bg-[#004481]/20 text-[#2d8eff] border-[#004481]/40",
      isSpecial: true
    };
  }
  return {
    borderHover: "hover:border-accent/50",
    glow: "hover:shadow-[0_0_20px_-4px_rgba(0,229,160,0.2)]",
    badgeColor: "bg-surface border-border text-muted",
    isSpecial: false
  };
}

interface BankCardProps {
  bank: Aspsp;
  isConnecting: boolean;
  onConnect: (bank: Aspsp) => void;
}

const BankCard: React.FC<BankCardProps> = ({ bank, isConnecting, onConnect }) => {
  const styles = getBankStyle(bank.name);

  return (
    <button
      type="button"
      onClick={() => onConnect(bank)}
      disabled={isConnecting}
      className={`group relative w-full text-left p-4 sm:p-5 rounded-xl bg-surface border border-border transition-all duration-300 ${styles.borderHover} ${styles.glow} disabled:opacity-50 disabled:cursor-not-allowed flex flex-col justify-between overflow-hidden cursor-pointer`}
    >
      <div className="flex items-start justify-between w-full">
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-bg border border-border flex items-center justify-center shrink-0 group-hover:border-accent/40 transition-colors overflow-hidden">
            {bank.logo ? (
              <img
                src={bank.logo}
                alt={bank.name}
                className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <Building2 className="w-5 h-5 text-muted group-hover:text-accent transition-colors" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-text text-sm tracking-tight truncate group-hover:text-white transition-colors">
              {bank.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-mono text-muted uppercase">
                {bank.country}
              </span>
              {bank.bic && (
                <span className="text-[11px] font-mono text-muted/70 truncate">
                  · {bank.bic}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 ml-2">
          {isConnecting ? (
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-border/40 group-hover:bg-accent/10 border border-transparent group-hover:border-accent/30 flex items-center justify-center transition-all">
              <ArrowUpRight className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" />
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border ${styles.badgeColor}`}>
          Open Banking AISP
        </span>
        <span className="text-muted text-[11px] flex items-center gap-1 font-mono">
          <Lock className="w-3 h-3 text-muted/80" /> Direct Link
        </span>
      </div>
    </button>
  );
};

const SkeletonCard: React.FC = () => (
  <div className="p-4 sm:p-5 rounded-xl bg-surface/50 border border-border/70 animate-pulse flex flex-col justify-between h-[132px]">
    <div className="flex items-center gap-3.5">
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-border/60 shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-border/60 rounded w-2/3" />
        <div className="h-3 bg-border/40 rounded w-1/3" />
      </div>
    </div>
    <div className="pt-3 border-t border-border/30 flex items-center justify-between">
      <div className="h-3 bg-border/40 rounded w-20" />
      <div className="h-3 bg-border/30 rounded w-16" />
    </div>
  </div>
);

export const Connect: React.FC = () => {
  const {
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
    refetch
  } = useConnectFlow();

  return (
    <div className="relative max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1f293d0a_1px,transparent_1px),linear-gradient(to_bottom,#1f293d0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="space-y-2 border-b border-border pb-5 sm:pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-accent/10 text-accent border border-accent/20">
          <Lock className="w-3.5 h-3.5" />
          <span>OAuth 2.0 Strong Customer Authentication</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
          Connect your bank
        </h2>
        <p className="text-xs sm:text-sm text-muted">
          Read-only access · No transactions initiated · AES-256-GCM encrypted vault
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-negative/10 border border-negative/30 flex items-center justify-between gap-3 text-sm text-negative">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={refetch}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-negative/20 hover:bg-negative/30 text-xs font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {connectingBank && (
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 flex items-center gap-3 text-sm text-accent">
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <span>
            Initiating secure OAuth authorization with <strong>{connectingBank}</strong>... You will be redirected to your bank.
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Santander, Revolut, BBVA..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent font-sans transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <Globe className="w-4 h-4 text-muted shrink-0 mr-1" />
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => setSelectedCountry(country.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer shrink-0 tabular-nums ${
                selectedCountry === country.code
                  ? "bg-accent text-bg font-bold shadow-sm"
                  : "bg-surface border border-border text-muted hover:text-text hover:bg-border/60"
              }`}
            >
              {country.code}
            </button>
          ))}
        </div>
      </div>

      {!searchQuery && featuredAspsps.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
              Featured Institutions
            </h3>
            <span className="text-xs font-mono text-muted/70">Restricted Production Ready</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {featuredAspsps.map((bank) => (
              <BankCard
                key={`featured-${bank.name}-${bank.country}`}
                bank={bank}
                isConnecting={connectingBank === bank.name}
                onConnect={handleConnect}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
            {searchQuery ? `Search Results (${filteredAspsps.length})` : `All Supported Banks (${filteredAspsps.length})`}
          </h3>
          <button
            type="button"
            onClick={refetch}
            className="text-xs font-mono text-muted hover:text-accent flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Refresh list
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))}
          </div>
        ) : filteredAspsps.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-surface border border-border space-y-3">
            <Building2 className="w-8 h-8 text-muted mx-auto" />
            <p className="text-sm font-medium text-text">No financial institutions found</p>
            <p className="text-xs text-muted max-w-sm mx-auto">
              No matching ASPSP found for "{searchQuery}" in country {selectedCountry}. Try selecting another country or clearing the filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAspsps.map((bank) => (
              <BankCard
                key={`${bank.name}-${bank.country}`}
                bank={bank}
                isConnecting={connectingBank === bank.name}
                onConnect={handleConnect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
