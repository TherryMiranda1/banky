import React, { useState } from "react";
import { Transaction } from "@/lib/api/transactions";
import { CategoryBadge } from "./CategoryBadge";
import { CategoryPickerPopover } from "@/components/categories/CategoryPickerPopover";
import { CategoryItem } from "@/lib/api/categories";
import { Tag, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Landmark } from "lucide-react";

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
      symbol = "€";
      break;
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
      className="group flex items-center justify-between py-3 px-3.5 sm:px-4 bg-surface/40 hover:bg-surface-elevated/80 transition-colors duration-150 gap-3 cursor-pointer border-b border-border/30 last:border-b-0"
    >
      {/* Left: Transaction Icon & Main Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Semantic Icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
            isTransfer
              ? "bg-transfer/10 border-transfer/20 text-transfer"
              : isNegative
              ? "bg-surface border-border/80 text-muted group-hover:text-text"
              : "bg-income/10 border-income/20 text-income"
          }`}
        >
          {isTransfer ? (
            <ArrowLeftRight className="w-4 h-4" />
          ) : isNegative ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownLeft className="w-4 h-4" />
          )}
        </div>

        {/* Text Details */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-xs sm:text-sm font-semibold text-text group-hover:text-white transition-colors truncate">
            {transaction.description || "Transacción sin concepto"}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap">
            {transaction.bankName && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono text-muted bg-bg/80 border border-border/60 shrink-0">
                <Landmark className="w-2.5 h-2.5" />
                <span>{transaction.bankName}</span>
                {ibanSuffix && (
                  <span className="text-text/70">••{ibanSuffix}</span>
                )}
              </span>
            )}

            {meta?.mccInfo && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono text-muted/80 bg-surface border border-border/40 shrink-0">
                {meta.mccInfo.name}
              </span>
            )}

            {/* Category Badge & Picker */}
            <div
              className="relative inline-flex items-center"
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
                  className="cursor-pointer hover:opacity-80 transition-opacity active:scale-95 focus:outline-hidden"
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
                  className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono text-muted/70 hover:text-text bg-border/20 hover:bg-border/60 border border-border/40 hover:border-accent/30 transition-all cursor-pointer"
                >
                  <Tag className="w-2.5 h-2.5" />
                  <span>Categorizar</span>
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

      {/* Right: Amount */}
      <div className="text-right shrink-0">
        <span
          className={`font-mono text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap ${
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
  );
};
