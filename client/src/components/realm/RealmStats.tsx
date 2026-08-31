import React from "react";
import type { KingdomState, KingdomHealth } from "@/lib/api/kingdom";
import { formatCurrency } from "@/lib/format-utils";
import { Crown, Flame, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";

export interface RealmStatsProps {
  state: KingdomState;
}

export const RealmStats: React.FC<RealmStatsProps> = ({ state }) => {
  const { summary, health, treasuryLevel, buildings } = state;
  const burningCount = buildings.filter((b) => b.status === "burning").length;

  const getHealthBadge = (h: KingdomHealth) => {
    switch (h) {
      case "thriving":
        return {
          label: "Floreciente",
          color: "text-income bg-income/10 border-income/20",
          icon: <Sparkles className="w-3.5 h-3.5 text-income" />
        };
      case "crisis":
        return {
          label: "En Crisis",
          color: "text-expense bg-expense/10 border-expense/20",
          icon: <ShieldAlert className="w-3.5 h-3.5 text-expense" />
        };
      case "struggling":
        return {
          label: "En Dificultades",
          color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
          icon: <Flame className="w-3.5 h-3.5 text-amber-400" />
        };
      default:
        return {
          label: "Estable",
          color: "text-accent bg-accent/10 border-accent/20",
          icon: <TrendingUp className="w-3.5 h-3.5 text-accent" />
        };
    }
  };

  const badge = getHealthBadge(health);
  const normalizedRate = Math.min(100, Math.max(0, summary.savingsRate));

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 p-3 rounded-lg bg-surface border border-border text-xs">
      {/* Health Badge */}
      <div className="flex items-center gap-2">
        <span className="text-muted font-medium">Reino:</span>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tracking-wide uppercase ${badge.color}`}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </span>
      </div>

      {/* Inline Metrics Strip */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-muted text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-text font-sans font-medium">Ahorro:</span>
          <span
            className={`font-semibold ${
              summary.netSavings >= 0 ? "text-income" : "text-expense"
            }`}
          >
            {summary.netSavings >= 0 ? "+" : ""}
            {formatCurrency(summary.netSavings)}
          </span>
        </div>

        <span className="text-border hidden sm:inline">•</span>

        <div className="flex items-center gap-1.5">
          <span className="text-text font-sans font-medium">Tasa:</span>
          <span
            className={`font-semibold ${
              summary.savingsRate >= 20
                ? "text-income"
                : summary.savingsRate >= 0
                ? "text-accent"
                : "text-expense"
            }`}
          >
            {summary.savingsRate.toFixed(1)}%
          </span>
          <div className="w-12 h-1.5 rounded-full bg-border overflow-hidden hidden sm:block">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                summary.savingsRate >= 20
                  ? "bg-income"
                  : summary.savingsRate >= 0
                  ? "bg-accent"
                  : "bg-expense"
              }`}
              style={{ width: `${normalizedRate}%` }}
            />
          </div>
        </div>

        <span className="text-border hidden sm:inline">•</span>

        <div className="flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-text font-sans font-medium">Tesoro:</span>
          <span className="text-amber-400 font-semibold">Nvl. {treasuryLevel}</span>
        </div>

        {burningCount > 0 && (
          <>
            <span className="text-border hidden sm:inline">•</span>
            <div className="flex items-center gap-1 text-expense">
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              <span className="font-semibold">{burningCount} sobregasto</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

