import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Edit2, AlertTriangle, Tag, Sparkles, ArrowUpRight } from "lucide-react";
import { CategoryAnalyticsItem } from "@/lib/api/budgets";
import { ICON_MAP } from "@/components/categories/CategoryModal";

interface BudgetProgressBarProps {
  item: CategoryAnalyticsItem;
  period?: string;
  onSaveBudget: (categoryId: string, newAmount: string) => Promise<boolean>;
  isSaving?: boolean;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  item,
  period,
  onSaveBudget,
  isSaving = false
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [amountInput, setAmountInput] = useState<string>(item.budgetAmount.toFixed(2));
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    setAmountInput(item.budgetAmount.toFixed(2));
  }, [item.budgetAmount]);

  const IconComponent = ICON_MAP[item.categoryIcon] || Tag;

  const isOverBudget = item.spentAmount > item.budgetAmount && item.budgetAmount > 0;
  const isNearLimit = item.spentPercentage >= 90 && !isOverBudget && item.budgetAmount > 0;
  const hasNoBudget = item.budgetAmount <= 0;

  const progressWidth = hasNoBudget
    ? (item.spentAmount > 0 ? 100 : 0)
    : Math.min(100, Math.max(0, item.spentPercentage));

  let progressColor = item.categoryColor || "var(--color-accent)";
  let progressBgGlow = "rgba(0, 229, 160, 0.2)";

  if (isOverBudget) {
    progressColor = "var(--color-negative)";
    progressBgGlow = "rgba(255, 77, 106, 0.25)";
  } else if (isNearLimit) {
    progressColor = "#f59e0b";
    progressBgGlow = "rgba(245, 158, 11, 0.25)";
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amountInput);
    if (isNaN(cleanAmount) || cleanAmount < 0) return;

    const success = await onSaveBudget(item.categoryId, cleanAmount.toFixed(2));
    if (success) {
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const transactionUrl = `/accounts?category=${encodeURIComponent(item.categoryName)}${period ? `&period=${encodeURIComponent(period)}` : ""}`;

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-border hover:border-border/80 transition-all duration-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
        {/* Left: Category Icon & Name with Deep Link */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to={transactionUrl}
            title={`Ver movimientos de ${item.categoryName}`}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-border shadow-xs hover:scale-105 transition-transform"
            style={{
              backgroundColor: `${item.categoryColor}18`,
              borderColor: `${item.categoryColor}40`,
              color: item.categoryColor
            }}
          >
            <IconComponent className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                to={transactionUrl}
                className="font-semibold text-xs text-text truncate hover:text-accent transition-colors flex items-center gap-1 group"
              >
                <span>{item.categoryName}</span>
                <ArrowUpRight className="w-3 h-3 text-muted group-hover:text-accent transition-colors shrink-0" />
              </Link>
              {item.isInheritedBudget && (
                <span
                  title="Heredado del mes previo"
                  className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-border/60 text-muted border border-border flex items-center gap-1"
                >
                  <Sparkles className="w-2 h-2 text-accent" />
                  <span>Heredado</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-muted mt-0.5">
              {hasNoBudget ? (
                <span>Sin límite asignado</span>
              ) : isOverBudget ? (
                <span className="text-negative font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Excedido en {(item.spentAmount - item.budgetAmount).toFixed(2)} €</span>
                </span>
              ) : (
                <span>Disponible: {item.remainingAmount.toFixed(2)} €</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Amounts & Inline Edit */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
          {isEditing ? (
            <form onSubmit={handleSave} className="flex items-center gap-1.5">
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="w-24 px-2 py-1 text-xs font-mono text-text bg-bg border border-accent/50 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-accent"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono text-muted">
                  €
                </span>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="px-2.5 py-1 text-xs font-semibold bg-accent text-bg rounded-lg hover:bg-accent/90 transition-colors cursor-pointer"
              >
                {isSaving ? "..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAmountInput(item.budgetAmount.toFixed(2));
                  setIsEditing(false);
                }}
                className="px-2 py-1 text-xs text-muted hover:text-text rounded-lg hover:bg-border/60 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs font-bold font-mono text-text">
                  <span>{item.spentAmount.toFixed(2)} €</span>
                  <span className="text-muted font-normal text-[11px] mx-1">/</span>
                  <span className={hasNoBudget ? "text-muted font-normal text-[11px]" : "text-muted"}>
                    {hasNoBudget ? "—" : `${item.budgetAmount.toFixed(2)} €`}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-muted">
                  {hasNoBudget ? "0%" : `${item.spentPercentage}%`}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                title="Modificar límite mensual"
                className="p-1 text-muted hover:text-accent rounded-lg hover:bg-border/60 transition-colors cursor-pointer"
              >
                {saveSuccess ? <Check className="w-3.5 h-3.5 text-accent" /> : <Edit2 className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-1.5 rounded-full bg-border/60 overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-200 ease-out"
          style={{
            width: `${progressWidth}%`,
            backgroundColor: progressColor,
            boxShadow: progressWidth > 0 ? `0 0 8px ${progressBgGlow}` : "none"
          }}
        />
      </div>
    </div>
  );
};
