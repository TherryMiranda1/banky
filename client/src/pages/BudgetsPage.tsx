import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  PieChart,
  Calendar,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { useBudgets } from "@/hooks/useBudgets";
import { SavingsMacroCard } from "@/components/analytics/SavingsMacroCard";
import { CategoryDonutChart } from "@/components/analytics/CategoryDonutChart";
import { CategoryTrendChart } from "@/components/analytics/CategoryTrendChart";
import { BudgetProgressBar } from "@/components/budgets/BudgetProgressBar";
import { ActionToast } from "@/components/ui/ActionToast";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function formatPeriodTitle(period: string): string {
  const [yStr, mStr] = period.split("-");
  const month = parseInt(mStr, 10);
  return `${MONTH_NAMES[month - 1] || mStr} ${yStr}`;
}

export const BudgetsPage: React.FC = () => {
  const {
    period,
    analytics,
    isLoading,
    isSaving,
    error,
    toastMessage,
    prevPeriod,
    nextPeriod,
    saveSingleBudget,
    refreshData,
    dismissToast
  } = useBudgets();

  const periodTitle = formatPeriodTitle(period);

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Toast Notification */}
      <ActionToast
        isOpen={!!toastMessage}
        message={toastMessage || ""}
        onDismiss={dismissToast}
      />

      {/* GitHub Document Header (Canvas Direct) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-accent" />
            <h1 className="text-xl font-bold tracking-tight text-text">
              Presupuestos & Analíticas
            </h1>
          </div>
          <p className="text-xs text-muted font-mono mt-0.5">
            Distribución y límites de gasto por ciclo financiero
          </p>
        </div>

        {/* Period Selector Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-elevated rounded-md border border-border p-0.5">
            <button
              type="button"
              onClick={prevPeriod}
              title="Mes anterior"
              className="p-1 rounded text-muted hover:text-text transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="px-2.5 py-0.5 flex items-center gap-1.5 min-w-[120px] justify-center">
              <Calendar className="w-3 h-3 text-muted" />
              <span className="font-semibold text-xs font-mono text-text">
                {periodTitle}
              </span>
            </div>

            <button
              type="button"
              onClick={nextPeriod}
              title="Mes siguiente"
              className="p-1 rounded text-muted hover:text-text transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={refreshData}
            title="Recargar analíticas"
            disabled={isLoading}
            className="p-1.5 rounded-md bg-surface border border-border text-muted hover:text-text transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-accent" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-md bg-expense/10 border border-expense/30 flex items-center gap-2 text-expense text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !analytics && (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 rounded-md bg-surface/40 border border-border" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 h-80 rounded-md bg-surface/30 border border-border" />
            <div className="lg:col-span-5 h-80 rounded-md bg-surface/30 border border-border" />
          </div>
        </div>
      )}

      {/* Analytics Loaded Content */}
      {analytics && (
        <>
          {/* Macro Savings Metrics Bar */}
          <SavingsMacroCard
            summary={analytics.summary}
            dateRangeLabel={analytics.cycleRange.dateRangeLabel}
          />

          {/* Main Content Grid: Budgets List (Left) + Donut Analytics (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Category Budget Box Table (7 cols on lg) */}
            <div className="lg:col-span-7 rounded-md border border-border bg-surface/30 overflow-hidden">
              <div className="px-4 py-2.5 bg-surface-elevated border-b border-border flex items-center justify-between">
                <span className="text-xs font-semibold text-text">
                  Límites por Categoría
                </span>
                <span className="text-xs font-mono text-muted">
                  {analytics.categories.length} categorías
                </span>
              </div>

              {analytics.categories.length === 0 ? (
                <div className="p-8 text-center space-y-1 text-muted">
                  <Layers className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p className="text-xs font-medium text-text">No hay categorías configuradas</p>
                  <p className="text-[11px] font-mono">Crea categorías para asignar presupuestos mensuales.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {analytics.categories.map((cat) => (
                    <BudgetProgressBar
                      key={cat.categoryId}
                      item={cat}
                      period={period}
                      onSaveBudget={saveSingleBudget}
                      isSaving={isSaving}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Graphic Distribution & Uncategorized Summary (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-3">
              <CategoryDonutChart
                categories={analytics.categories}
                uncategorizedSpent={analytics.uncategorized.spentAmount}
                totalSpent={analytics.summary.totalSpent}
                period={period}
              />

              {/* Uncategorized notice if any with deep link */}
              {analytics.uncategorized.spentAmount > 0 && (
                <Link
                  to={`/accounts?category=__uncategorized__&period=${encodeURIComponent(period)}`}
                  className="p-3 rounded-md bg-surface-elevated border border-border hover:border-accent/40 flex items-start gap-3 transition-colors group block"
                >
                  <div className="w-6 h-6 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-text group-hover:text-accent transition-colors">
                        Gastos sin categorizar
                      </h3>
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" />
                    </div>
                    <p className="text-[11px] text-muted font-mono mt-0.5">
                      <span className="text-text font-bold">{analytics.uncategorized.spentAmount.toFixed(2)} €</span> sin categoría asignada en este ciclo.
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* Historical Trends Multi-Series Line Chart */}
          <CategoryTrendChart initialMonths={6} />
        </>
      )}
    </div>
  );
};
