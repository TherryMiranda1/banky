import React, { useState } from "react";
import { Transaction } from "@/lib/api/transactions";
import { CategoryBadge } from "./CategoryBadge";
import { CategoryPickerPopover } from "@/components/categories/CategoryPickerPopover";
import { CategoryItem } from "@/lib/api/categories";
import { Tag } from "lucide-react";

interface TransactionRowProps {
  transaction: Transaction;
  index: number;
  onUpdateCategory?: (
    transactionId: string,
    categoryId: string | null,
    categoryName: string | null
  ) => void;
  categoriesList?: CategoryItem[];
  onSelectTransaction?: (transaction: Transaction) => void;
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    const isCurrentYear = date.getFullYear() === now.getFullYear();
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      ...(isCurrentYear ? {} : { year: "numeric" })
    };

    return new Intl.DateTimeFormat("en-US", options).format(date);
  } catch {
    return isoString;
  }
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
  index,
  onUpdateCategory,
  categoriesList,
  onSelectTransaction
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const { formatted, isNegative } = formatCurrency(transaction.amount, transaction.currency);
  const dateFormatted = formatDate(transaction.bookedAt);

  const staggerDelay = Math.min(index * 30, 600);

  const handleCategorySelect = (categoryId: string | null, categoryName: string | null) => {
    if (onUpdateCategory) {
      onUpdateCategory(transaction.id, categoryId, categoryName);
    }
  };

  const ibanSuffix = transaction.iban
    ? transaction.iban.replace(/\s+/g, "").slice(-4)
    : null;

  const meta = transaction.metadata;

  const isTransfer = transaction.isTransfer || transaction.category?.toLowerCase() === "traspasos";

  return (
    <div
      style={{
        animationDelay: `${staggerDelay}ms`,
        animationFillMode: "both"
      }}
      onClick={() => onSelectTransaction?.(transaction)}
      className={`group flex items-start justify-between py-3.5 px-3 sm:px-4 bg-surface hover:bg-surface/80 border-b border-border/40 transition-colors duration-150 animate-in fade-in slide-in-from-bottom-1 duration-300 gap-3 sm:gap-4 cursor-pointer ${
        isTransfer
          ? "border-l-2 border-l-sky-500/60"
          : isNegative
          ? "border-l-2 border-l-negative/60"
          : "border-l-2 border-l-accent/60"
      }`}
    >
      <div className="flex items-start gap-2.5 sm:gap-4 min-w-0 flex-1 pr-1 sm:pr-4">
        <div className="w-14 sm:w-18 shrink-0 pt-0.5">
          <span className="text-[11px] sm:text-xs font-mono text-muted tracking-tight block">
            {dateFormatted}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-xs sm:text-sm font-medium text-text group-hover:text-white transition-colors break-words leading-snug">
            {transaction.description || "Transacción sin concepto"}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {(transaction.bankName || ibanSuffix) && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-muted bg-bg border border-border/60 shrink-0">
                <span>{transaction.bankName || "Cuenta"}</span>
                {ibanSuffix && (
                  <span className="text-accent/80 font-semibold">•••• {ibanSuffix}</span>
                )}
              </span>
            )}

            {meta?.mccInfo && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-text/80 bg-accent/5 border border-accent/20 shrink-0">
                <span>{meta.mccInfo.name}</span>
              </span>
            )}

            {meta?.exchangeRate && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 shrink-0">
                <span>{meta.exchangeRate.sourceCurrency} FX</span>
              </span>
            )}

            {transaction.isTransfer && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-blue-300 bg-blue-500/10 border border-blue-500/20 shrink-0">
                <span>⇆ Traspaso</span>
              </span>
            )}

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
                title="Cambiar categoría (Click para desplegar selector)"
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
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-muted/70 hover:text-text bg-border/20 hover:bg-border/60 border border-border/40 hover:border-accent/30 transition-all cursor-pointer"
              >
                <Tag className="w-2.5 h-2.5" />
                <span>+ Categoría</span>
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

      <div className="text-right shrink-0 min-w-0">
        <span
          className={`font-mono text-xs sm:text-sm font-semibold tracking-tight whitespace-nowrap ${
            isTransfer
              ? "text-sky-400"
              : isNegative
              ? "text-negative"
              : "text-accent"
          }`}
        >
          {formatted}
        </span>
      </div>
    </div>
  );
};

