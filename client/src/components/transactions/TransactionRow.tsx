import React, { useState } from "react";
import { Transaction } from "@/lib/api/transactions";
import { CategoryBadge } from "./CategoryBadge";
import { CategoryPickerPopover } from "@/components/categories/CategoryPickerPopover";
import { CategoryItem } from "@/lib/api/categories";
import { Tag, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";

interface TransactionRowProps {
  transaction: Transaction;
  index?: number;
  onUpdateCategory?: (
    transactionId: string,
    categoryId: string | null,
    categoryName: string | null
  ) => void;
  categoriesList?: CategoryItem[];
  onSelectTransaction?: (transaction: Transaction) => void;
}

function formatCurrency(amountStr: string, currency: string): { formatted: string; isNegative: boolean } {
  const num = parseFloat(amountStr);
  const isNegative = !isNaN(num) && num < 0;

  let symbol = "";
  switch (currency.toUpperCase()) {
    case "EUR":
      return {
        formatted: `${isNegative ? "-" : "+"}€${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(isNaN(num) ? 0 : num))}`,
        isNegative
      };
    case "GBP":
      symbol = "£";
      break;
    case "USD":
      symbol = "$";
      break;
    default:
      symbol = `${currency} `;
      break;
  }

  const absNum = Math.abs(isNaN(num) ? 0 : num);
  const formattedNum = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(absNum);

  const sign = isNegative ? "-" : "+";
  return {
    formatted: `${sign}${symbol}${formattedNum}`,
    isNegative
  };
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onUpdateCategory,
  categoriesList,
  onSelectTransaction
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const { formatted, isNegative } = formatCurrency(transaction.amount, transaction.currency);

  const handleCategorySelect = (categoryId: string | null, categoryName: string | null) => {
    if (onUpdateCategory) {
      onUpdateCategory(transaction.id, categoryId, categoryName);
    }
  };

  const ibanSuffix = transaction.iban
    ? transaction.iban.replace(/\s+/g, "").slice(-4)
    : null;

  const isTransfer = transaction.isTransfer || transaction.category?.toLowerCase() === "traspasos";
  const meta = transaction.metadata;

  return (
    <div
      onClick={() => onSelectTransaction?.(transaction)}
      className="group py-2.5 px-3.5 sm:px-4 hover:bg-surface-elevated transition-colors duration-100 cursor-pointer border-b border-border/50 last:border-b-0"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Node Icon & Info */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
              isTransfer
                ? "bg-transfer/10 border-transfer/30 text-transfer"
                : isNegative
                ? "bg-surface-elevated border-border text-muted"
                : "bg-income/10 border-income/30 text-income"
            }`}
          >
            {isTransfer ? (
              <ArrowLeftRight className="w-3 h-3" />
            ) : isNegative ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownLeft className="w-3 h-3" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            {/* Row 1: Concept / Description (with amount on mobile) */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm font-medium text-text group-hover:text-white transition-colors truncate">
                {transaction.description || "Transacción sin concepto"}
              </p>

              {/* Amount on Mobile (<sm) */}
              <span
                className={`sm:hidden font-mono text-xs font-semibold tracking-tight whitespace-nowrap shrink-0 ${
                  isTransfer
                    ? "text-transfer"
                    : isNegative
                    ? "text-text"
                    : "text-income"
                }`}
              >
                {formatted}
              </span>
            </div>

            {/* Row 2: Subtitle Tags (Bank + Category) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {transaction.bankName && (
                <span className="text-[10px] font-mono text-muted px-1.5 py-0.2 rounded bg-surface-elevated border border-border shrink-0">
                  {transaction.bankName}{ibanSuffix ? ` ••${ibanSuffix}` : ""}
                </span>
              )}

              {meta?.mccInfo && (
                <span className="text-[10px] font-mono text-muted/80 hidden md:inline">
                  {meta.mccInfo.name}
                </span>
              )}

              {/* Category Badge & Picker */}
              <div
                className="relative inline-flex items-center shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {transaction.category ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPickerOpen((prev) => !prev);
                    }}
                    title="Cambiar categoría"
                    className="cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
                  >
                    <CategoryBadge category={transaction.category} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPickerOpen((prev) => !prev);
                    }}
                    title="Asignar categoría"
                    className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono text-muted hover:text-text bg-surface-elevated border border-border hover:border-accent/40 transition-colors cursor-pointer"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    <span>Categoría</span>
                  </button>
                )}

                <CategoryPickerPopover
                  isOpen={isPickerOpen}
                  onClose={() => setIsPickerOpen(false)}
                  onSelect={handleCategorySelect}
                  currentCategoryName={transaction.category}
                  categoriesList={categoriesList}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Amount on Desktop (>=sm) */}
        <div className="hidden sm:block text-right shrink-0">
          <span
            className={`font-mono text-xs sm:text-sm font-semibold tracking-tight whitespace-nowrap ${
              isTransfer
                ? "text-transfer"
                : isNegative
                ? "text-text"
                : "text-income"
            }`}
          >
            {formatted}
          </span>
        </div>
      </div>
    </div>
  );
};
