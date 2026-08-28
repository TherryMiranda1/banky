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
  { code: "ES", label: "España" },
  { code: "GB", label: "Reino Unido" },
  { code: "FR", label: "Francia" },
  { code: "DE", label: "Alemania" },
  { code: "IT", label: "Italia" }
];

interface BankCardProps {
  bank: Aspsp;
  isConnecting: boolean;
  onConnect: (bank: Aspsp) => void;
}

const BankCard: React.FC<BankCardProps> = ({ bank, isConnecting, onConnect }) => {
  return (
    <button
      type="button"
      onClick={() => onConnect(bank)}
      disabled={isConnecting}
      className="group flex items-center justify-between p-3.5 rounded-md bg-surface/40 hover:bg-surface-elevated border border-border transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-md bg-white shadow-xs border border-border/40 p-1 flex items-center justify-center shrink-0 overflow-hidden">
          {bank.logo ? (
            <img
              src={bank.logo}
              alt={bank.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <Building2 className="w-5 h-5 text-slate-700" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-text text-xs sm:text-sm tracking-tight truncate group-hover:text-white transition-colors">
            {bank.name}
          </h4>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-muted">
            <span className="uppercase">{bank.country}</span>
            {bank.bic && <span className="truncate">· {bank.bic}</span>}
          </div>
        </div>
      </div>

      <div className="shrink-0 ml-2">
        {isConnecting ? (
          <Loader2 className="w-4 h-4 text-accent animate-spin" />
        ) : (
          <div className="p-1.5 rounded-md text-muted group-hover:text-text group-hover:bg-surface transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </button>
  );
};

const SkeletonCard: React.FC = () => (
  <div className="p-3.5 rounded-md bg-surface/30 border border-border animate-pulse flex items-center justify-between">
    <div className="flex items-center gap-3 flex-1">
      <div className="w-10 h-10 rounded-md bg-border/60 shrink-0" />
      <div className="space-y-1.5 flex-1">
        <div className="h-3.5 bg-border/60 rounded w-1/2" />
        <div className="h-2.5 bg-border/40 rounded w-1/4" />
      </div>
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
    <div className="space-y-5 max-w-6xl mx-auto animate-in fade-in duration-150">
      {/* GitHub Document Header */}
      <div className="space-y-1.5 pb-3 border-b border-border">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
            Conectar Entidad Bancaria
          </h1>
          <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-mono bg-surface-elevated text-muted border border-border">
            <Lock className="w-3 h-3 text-accent" />
            OAuth 2.0 SCA
          </span>
        </div>
        <p className="text-xs text-muted font-mono">
          Acceso de solo lectura mediante Open Banking (AISP) · Cifrado AES-256-GCM · Sin inicio de pagos
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-expense/10 border border-expense/30 flex items-center justify-between gap-3 text-xs text-expense font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={refetch}
            className="flex items-center gap-1 px-2 py-1 rounded bg-expense/20 hover:bg-expense/30 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Reintentar
          </button>
        </div>
      )}

      {connectingBank && (
        <div className="p-3 rounded-md bg-accent/10 border border-accent/20 flex items-center gap-2.5 text-xs text-accent font-mono">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>
            Iniciando autorización segura con <strong>{connectingBank}</strong>... Serás redirigido a la app de tu banco.
          </span>
        </div>
      )}

      {/* Search & Country Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar Santander, Revolut, BBVA..."
            className="w-full pl-8 pr-4 py-1.5 rounded-md bg-surface-elevated border border-border text-xs text-text placeholder:text-muted/60 focus:outline-none focus:border-accent font-sans"
          />
        </div>

        {/* Country Selector Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <Globe className="w-3.5 h-3.5 text-muted shrink-0 mr-1" />
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => setSelectedCountry(country.code)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                selectedCountry === country.code
                  ? "bg-surface-elevated text-text font-semibold border border-border"
                  : "text-muted hover:text-text"
              }`}
            >
              {country.code}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Banks Section */}
      {!searchQuery && featuredAspsps.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
              Bancos Principales
            </h3>
            <span className="text-[11px] font-mono text-muted/60">Verificados y activos</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2.5">
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

      {/* All Supported Banks */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
            {searchQuery ? `Resultados de búsqueda (${filteredAspsps.length})` : `Todos los bancos soportados (${filteredAspsps.length})`}
          </h3>
          <button
            type="button"
            onClick={refetch}
            className="text-[11px] font-mono text-muted hover:text-text flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Actualizar lista
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))}
          </div>
        ) : filteredAspsps.length === 0 ? (
          <div className="p-12 text-center rounded-md bg-surface/30 border border-border space-y-2">
            <Building2 className="w-8 h-8 text-muted mx-auto" />
            <p className="text-sm font-medium text-text">No se encontraron entidades</p>
            <p className="text-xs text-muted font-mono max-w-sm mx-auto">
              No hay bancos para "{searchQuery}" en {selectedCountry}. Probá cambiando el país o limpiando la búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
