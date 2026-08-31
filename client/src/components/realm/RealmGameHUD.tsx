import React from "react";
import type { KingdomState } from "@/lib/api/kingdom";
import { formatCurrency } from "@/lib/format-utils";
import { Plus, Shield, RefreshCw, AlertTriangle, Check } from "lucide-react";

export interface RealmGameHUDProps {
  state: KingdomState;
  activeAccountsCount?: number;
  totalAccountsCount?: number;
  onOpenCashModal?: () => void;
  onSync?: () => Promise<void>;
  isSyncing?: boolean;
}

export const RealmGameHUD: React.FC<RealmGameHUDProps> = ({
  state,
  activeAccountsCount = 2,
  totalAccountsCount = 2,
  onOpenCashModal,
  onSync,
  isSyncing = false
}) => {
  const { summary, treasuryLevel, buildings, health } = state;

  const burningCount = buildings.filter((b) => b.status === "burning").length;
  const healthyCount = buildings.filter((b) => b.status === "healthy").length;
  const isShieldActive = burningCount === 0 && health !== "crisis";

  const goldMax = Math.max(30000, Math.ceil((summary.totalBalanceEur * 1.5) / 5000) * 5000);
  const elixirMax = Math.max(10000, Math.ceil((Math.abs(summary.netSavings) * 2) / 2000) * 2000);

  const goldPercentage = Math.min(100, Math.max(5, (summary.totalBalanceEur / goldMax) * 100));
  const elixirPercentage = Math.min(
    100,
    Math.max(5, (Math.max(0, summary.netSavings) / elixirMax) * 100)
  );

  return (
    <div className="w-full bg-[#12141a]/95 backdrop-blur-md border border-[#2a2d3d] rounded-xl p-2 sm:p-2.5 shadow-2xl space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Player Badge */}
        <div className="flex items-center gap-2 bg-[#1b1e2a] border border-[#363a4e] px-2.5 py-1.5 rounded-lg shadow-inner">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-amber-400 via-amber-600 to-amber-900 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#181a24] flex items-center justify-center text-amber-300 font-bold text-xs font-mono">
                L{treasuryLevel}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-accent text-[#0a0a0f] text-[9px] font-black px-1 rounded-sm shadow-xs uppercase">
              G1
            </div>
          </div>

          <div className="min-w-[70px]">
            <div className="flex items-center justify-between text-[10px] font-semibold text-[#e2e4ee] leading-none mb-1">
              <span>Soberano</span>
              <span className="text-amber-400 font-mono">Nvl.{treasuryLevel}</span>
            </div>
            <div className="w-full h-1.5 bg-[#0e1017] rounded-full overflow-hidden border border-[#2a2e40]">
              <div
                className="h-full bg-linear-to-r from-blue-500 to-cyan-400 rounded-full"
                style={{ width: `${Math.min(100, (treasuryLevel / 3) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Builders / Workers Badge */}
        <div className="flex items-center gap-1.5 bg-[#1b1e2a] border border-[#363a4e] px-2.5 py-1.5 rounded-lg text-xs">
          <div className="w-6 h-6 rounded-md bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 2a3 3 0 0 0-3 3v2H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-5h1a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3V5a3 3 0 0 0-3-3zm-1 5V5a1 1 0 1 1 2 0v2h-2z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted font-medium leading-none">Obreros</span>
            <div className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-400">
              <span>
                {activeAccountsCount}/{totalAccountsCount}
              </span>
              {onSync && (
                <button
                  type="button"
                  onClick={() => onSync()}
                  disabled={isSyncing}
                  className="text-muted hover:text-accent transition-colors p-0.5 cursor-pointer disabled:opacity-50"
                  title="Sincronizar cuentas bancarias"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin text-accent" : ""}`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Shield of Protection */}
        <div className="flex items-center gap-1.5 bg-[#1b1e2a] border border-[#363a4e] px-2.5 py-1.5 rounded-lg text-xs">
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center border ${
              isShieldActive
                ? "bg-blue-950/80 border-blue-500/40 text-blue-400"
                : "bg-rose-950/80 border-rose-500/40 text-rose-400"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted font-medium leading-none">Escudo</span>
            <span
              className={`font-mono text-[11px] font-bold ${
                isShieldActive ? "text-blue-400" : "text-rose-400"
              }`}
            >
              {isShieldActive ? "ACTIVO" : "EN RIESGO"}
            </span>
          </div>
        </div>

        {/* Gems / Metas */}
        <div className="flex items-center gap-1.5 bg-[#1b1e2a] border border-[#363a4e] px-2.5 py-1.5 rounded-lg text-xs">
          <div className="w-6 h-6 rounded-md bg-fuchsia-950/80 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-400 shadow-xs">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <polygon points="6,2 18,2 22,9 12,22 2,9" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted font-medium leading-none">Gemas</span>
            <span className="font-mono text-xs font-bold text-fuchsia-300">
              {healthyCount}/{buildings.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Meters Strip: Gold & Elixir */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#232738]">
        {/* Gold Meter */}
        <div className="flex items-center justify-between gap-2 bg-[#161822] border border-[#2d3142] px-3 py-1.5 rounded-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-300 via-amber-500 to-amber-700 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-full bg-[#201705] flex items-center justify-center text-amber-300 font-bold text-xs">
                🪙
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-bold font-mono text-amber-300 tracking-tight">
                  {formatCurrency(summary.totalBalanceEur)}
                </span>
                <span className="text-[10px] text-muted font-mono truncate">
                  Max: {formatCurrency(goldMax)}
                </span>
              </div>
              <div className="w-28 sm:w-36 h-1.5 bg-[#0e1017] rounded-full overflow-hidden border border-[#2a2e40] mt-1">
                <div
                  className="h-full bg-linear-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-300"
                  style={{ width: `${goldPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {onOpenCashModal && (
            <button
              type="button"
              onClick={onOpenCashModal}
              className="w-6 h-6 rounded-md bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-xs transition-colors cursor-pointer shrink-0 font-bold"
              title="Añadir efectivo o fondos"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          )}
        </div>

        {/* Elixir Meter */}
        <div className="flex items-center justify-between gap-2 bg-[#161822] border border-[#2d3142] px-3 py-1.5 rounded-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-cyan-400 via-blue-600 to-purple-800 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-full bg-[#081524] flex items-center justify-center text-cyan-300 font-bold text-xs">
                💧
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-xs font-bold font-mono tracking-tight ${
                    summary.netSavings >= 0 ? "text-cyan-300" : "text-rose-400"
                  }`}
                >
                  {summary.netSavings >= 0 ? "+" : ""}
                  {formatCurrency(summary.netSavings)}
                </span>
                <span className="text-[10px] text-muted font-mono">
                  {summary.savingsRate.toFixed(1)}% tasa
                </span>
              </div>
              <div className="w-28 sm:w-36 h-1.5 bg-[#0e1017] rounded-full overflow-hidden border border-[#2a2e40] mt-1">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    summary.netSavings >= 0
                      ? "bg-linear-to-r from-blue-500 to-cyan-300"
                      : "bg-linear-to-r from-rose-500 to-orange-400"
                  }`}
                  style={{ width: `${elixirPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="px-2 py-1 rounded bg-[#0e1017] border border-[#2a2e40] text-[10px] font-mono text-cyan-400 shrink-0">
            {summary.savingsRate >= 20 ? (
              <span className="flex items-center gap-0.5 text-emerald-400 font-semibold">
                <Check className="w-3 h-3" /> Meta
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-amber-400">
                <AlertTriangle className="w-3 h-3" /> Ajustar
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
