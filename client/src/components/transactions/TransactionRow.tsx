import React from "react";
import { Transaction } from "@/lib/api/transactions";
import { CategoryBadge } from "./CategoryBadge";

interface TransactionRowProps {
  transaction: Transaction;
  index: number;
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

export const TransactionRow: React.FC<TransactionRowProps> = ({ transaction, index }) => {
  const { formatted, isNegative } = formatCurrency(transaction.amount, transaction.currency);
  const dateFormatted = formatDate(transaction.bookedAt);

  const staggerDelay = Math.min(index * 30, 600);

  return (
    <div
      style={{
        animationDelay: `${staggerDelay}ms`,
        animationFillMode: "both"
      }}
      className={`group flex items-center justify-between py-3.5 px-3 sm:px-4 bg-surface hover:bg-surface/80 border-b border-border/40 transition-colors duration-150 animate-in fade-in slide-in-from-bottom-1 duration-300 gap-3 sm:gap-4 ${
        isNegative
          ? "border-l-2 border-l-negative/60"
          : "border-l-2 border-l-accent/60"
      }`}
    >
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1 pr-2 sm:pr-4">
        <div className="w-16 sm:w-18 shrink-0">
          <span className="text-[11px] sm:text-xs font-mono text-muted tracking-tight block">
            {dateFormatted}
          </span>
        </div>

        <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
          <p className="text-xs sm:text-sm font-medium text-text truncate group-hover:text-white transition-colors max-w-full">
            {transaction.description || "Uncategorized Transaction"}
          </p>
          {transaction.category && <CategoryBadge category={transaction.category} />}
        </div>
      </div>

      <div className="text-right shrink-0 min-w-0">
        <span
          className={`font-mono text-xs sm:text-sm font-semibold tracking-tight whitespace-nowrap ${
            isNegative ? "text-negative" : "text-accent"
          }`}
        >
          {formatted}
        </span>
      </div>
    </div>
  );
};
