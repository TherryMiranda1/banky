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
    <div className="space-y-5 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Toast Notification */}
      <ActionToast
        isOpen={!!toastMessage}
        message={toastMessage || ""}
        onDismiss={dismissToast}
      />

      {/* Header Bar with Period Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-accent" />
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-text">
              Presupuestos & Analíticas
            </h1>
          </div>
          <p className="text-xs text-muted font-mono mt-0.5">
            Gestión y distribución de gastos por ciclo financiero
          </p>
        </div>

        {/* Period Selector Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-bg rounded-xl border border-border p-1 shadow-inner">
            <button
              type="button"
              onClick={prevPeriod}
              title="Mes anterior"
              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3 py-1 flex items-center gap-1.5 min-w-[130px] justify-center">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span className="font-semibold text-xs font-mono text-text">
                {periodTitle}
              </span>
            </div>

            <button
              type="button"
              onClick={nextPeriod}
              title="Mes siguiente"
              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={refreshData}
            title="Recargar analíticas"
            disabled={isLoading}
            className="p-2 rounded-xl bg-surface border border-border text-muted hover:text-text hover:border-accent/40 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-accent" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-negative/10 border border-negative/30 flex items-center gap-2.5 text-negative text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !analytics && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-surface/50 animate-pulse border border-border" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-surface/50 animate-pulse border border-border" />
              ))}
            </div>
            <div className="lg:col-span-5 h-64 rounded-2xl bg-surface/50 animate-pulse border border-border" />
          </div>
        </div>
      )}

      {/* Analytics Loaded Content */}
      {analytics && (
        <>
          {/* Macro Savings Metrics Cards */}
          <SavingsMacroCard
            summary={analytics.summary}
            dateRangeLabel={analytics.cycleRange.dateRangeLabel}
          />

          {/* Main Content Grid: Budgets List (Left) + Donut Analytics (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Category Budget Progress Bars (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted font-mono">
                    Límites por Categoría
                  </h2>
                  <p className="text-[11px] text-muted font-mono">
                    Modificá el objetivo mensual inline con persistencia histórica
                  </p>
                </div>
                <span className="text-xs font-mono text-muted">
                  {analytics.categories.length} categorías
                </span>
              </div>

              {analytics.categories.length === 0 ? (
                <div className="p-8 text-center bg-surface rounded-2xl border border-border">
                  <Layers className="w-8 h-8 text-muted mx-auto mb-2" />
                  <p className="text-xs font-semibold text-text">No hay categorías configuradas</p>
                  <p className="text-[11px] text-muted font-mono mt-1">Crea categorías para asignar presupuestos mensuales.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
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
            <div className="lg:col-span-5 space-y-3.5 sticky top-20">
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
                  className="p-3.5 rounded-2xl bg-surface border border-border/80 hover:border-accent/40 flex items-start gap-3 shadow-xs transition-all group block"
                >
                  <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 mt-0.5">
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
                      Tenés <span className="text-text font-bold">{analytics.uncategorized.spentAmount.toFixed(2)} €</span> sin categoría en este ciclo. Click para categorizar.
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
