import React from "react";
import { MacroSavingsSummary } from "@/lib/api/budgets";

interface SavingsMacroCardProps {
  summary: MacroSavingsSummary;
  dateRangeLabel: string;
}

export const SavingsMacroCard: React.FC<SavingsMacroCardProps> = ({
  summary,
  dateRangeLabel
}) => {
  const isNetPositive = summary.netSavings >= 0;
  const remainingBudget = summary.totalBudgeted > 0 ? summary.totalBudgeted - summary.totalSpent : 0;
  const isWithinBudget = remainingBudget >= 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-md bg-surface/40 border border-border text-xs font-mono">
      {/* 1. Ingresos */}
      <div className="flex items-center gap-2">
        <span className="text-muted">Ingresos:</span>
        <span className="text-income font-medium">
          +{summary.totalIncome.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
        </span>
      </div>

      <span className="hidden sm:inline text-border">|</span>

      {/* 2. Gastos */}
      <div className="flex items-center gap-2">
        <span className="text-muted">Gastos:</span>
        <span className="text-text font-medium">
          -{summary.totalSpent.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
        </span>
        {summary.totalBudgeted > 0 && (
          <span className="text-muted text-[11px]">
            (de {summary.totalBudgeted.toFixed(2)} € obj)
          </span>
        )}
      </div>

      <span className="hidden sm:inline text-border">|</span>

      {/* 3. Flujo Neto */}
      <div className="flex items-center gap-2">
        <span className="text-muted">Flujo Neto:</span>
        <span className={`font-semibold ${isNetPositive ? "text-income" : "text-expense"}`}>
          {isNetPositive ? "+" : ""}
          {summary.netSavings.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
        </span>
      </div>

      <span className="hidden sm:inline text-border">|</span>

      {/* 4. Margen */}
      <div className="flex items-center gap-2">
        <span className="text-muted">Margen Obj:</span>
        {summary.totalBudgeted > 0 ? (
          <span className={`font-medium ${isWithinBudget ? "text-income" : "text-expense"}`}>
            {isWithinBudget ? "+" : ""}
            {remainingBudget.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </span>
        ) : (
          <span className="text-muted">Sin objetivo</span>
        )}
      </div>

      <span className="text-[10px] text-muted hidden md:inline ml-auto">
        {dateRangeLabel}
      </span>
    </div>
  );
};
