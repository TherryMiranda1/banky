import React from "react";
import { TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight, CheckCircle2, AlertTriangle, Scale } from "lucide-react";
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. Ingresos del Ciclo */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted uppercase tracking-wider">Ingresos del Ciclo</span>
          <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold font-mono text-text">
            {summary.totalIncome.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
          <span className="text-[10px] font-mono text-muted mt-0.5 block truncate">{dateRangeLabel}</span>
        </div>
      </div>

      {/* 2. Gastos Totales */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted uppercase tracking-wider">Gastos Totales</span>
          <div className="w-7 h-7 rounded-lg bg-negative/10 border border-negative/20 flex items-center justify-center text-negative">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold font-mono text-text">
            {summary.totalSpent.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-muted">
            <span>Presupuestado:</span>
            <span className="text-text font-medium">{summary.totalBudgeted.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* 3. Flujo Neto de Caja */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted uppercase tracking-wider">Flujo Neto del Ciclo</span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isNetPositive
                ? "bg-accent/10 border border-accent/20 text-accent"
                : "bg-negative/10 border border-negative/20 text-negative"
            }`}
          >
            {isNetPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          </div>
        </div>
        <div className="mt-3">
          <div
            className={`text-xl sm:text-2xl font-bold font-mono ${
              isNetPositive ? "text-accent" : "text-negative"
            }`}
          >
            {isNetPositive ? "+" : ""}
            {summary.netSavings.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
          <span className="text-[10px] font-mono text-muted mt-0.5 block">
            {isNetPositive ? "Superávit de caja en curso" : "Déficit de caja en curso"}
          </span>
        </div>
      </div>

      {/* 4. Margen de Presupuesto */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted uppercase tracking-wider">Margen Presupuestario</span>
          <div className="w-7 h-7 rounded-lg bg-surface border border-border/80 flex items-center justify-center text-muted">
            <Scale className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-3">
          {summary.totalBudgeted > 0 ? (
            <>
              <div
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  isWithinBudget ? "text-accent" : "text-negative"
                }`}
              >
                {isWithinBudget ? "+" : ""}
                {remainingBudget.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-[10px] font-mono text-muted">
                {isWithinBudget ? (
                  <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Dentro de límites
                  </span>
                ) : (
                  <span className="text-negative font-medium inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Excedido
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-xl sm:text-2xl font-bold font-mono text-muted">
                0.00 €
              </div>
              <span className="text-[10px] font-mono text-muted mt-0.5 block">
                Sin límites configurados
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
