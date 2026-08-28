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
  if (isOverBudget) {
    progressColor = "var(--color-expense)";
  } else if (isNearLimit) {
    progressColor = "#f59e0b";
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
    <div className="p-3 hover:bg-surface-elevated/70 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        {/* Left: Category Icon & Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${item.categoryColor}15`,
              borderColor: `${item.categoryColor}35`,
              color: item.categoryColor
            }}
          >
            <IconComponent className="w-3.5 h-3.5" />
          </div>

          <div className="min-w-0 flex items-center gap-2 flex-wrap">
            <Link
              to={transactionUrl}
              className="font-medium text-xs text-text hover:text-white transition-colors flex items-center gap-1 group"
            >
              <span>{item.categoryName}</span>
              <ArrowUpRight className="w-3 h-3 text-muted group-hover:text-text transition-colors shrink-0" />
            </Link>

            {item.isInheritedBudget && (
              <span
                title="Presupuesto heredado"
                className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-surface-elevated text-muted border border-border flex items-center gap-0.5"
              >
                <Sparkles className="w-2 h-2 text-accent" />
                <span>Heredado</span>
              </span>
            )}

            {isOverBudget && (
              <span className="text-[10px] font-mono text-expense flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>+{(item.spentAmount - item.budgetAmount).toFixed(2)} €</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Amounts & Inline Edit */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
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
                  className="w-20 px-2 py-0.5 text-xs font-mono text-text bg-surface border border-accent/50 rounded focus:outline-hidden"
                />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted">
                  €
                </span>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="px-2 py-0.5 text-xs font-medium bg-accent text-bg rounded hover:bg-accent/90 cursor-pointer"
              >
                {isSaving ? "..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAmountInput(item.budgetAmount.toFixed(2));
                  setIsEditing(false);
                }}
                className="px-1.5 py-0.5 text-xs text-muted hover:text-text rounded cursor-pointer"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-right font-mono text-xs">
                <span className="font-semibold text-text">{item.spentAmount.toFixed(2)} €</span>
                <span className="text-muted mx-1">/</span>
                <span className="text-muted">{hasNoBudget ? "—" : `${item.budgetAmount.toFixed(2)} €`}</span>
                <span className="text-muted text-[11px] ml-1.5">({hasNoBudget ? "0%" : `${item.spentPercentage}%`})</span>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                title="Editar límite"
                className="p-1 text-muted hover:text-text rounded hover:bg-surface transition-colors cursor-pointer"
              >
                {saveSuccess ? <Check className="w-3 h-3 text-positive" /> : <Edit2 className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Clean Linear Progress Bar */}
      <div className="w-full h-1 rounded-full bg-border/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-150 ease-out"
          style={{
            width: `${progressWidth}%`,
            backgroundColor: progressColor
          }}
        />
      </div>
    </div>
  );
};
