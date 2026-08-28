import React, { useMemo } from "react";
import { Transaction } from "@/lib/api/transactions";

interface PeriodSummaryStripProps {
  transactions: Transaction[];
  currency?: string;
}

function formatCurrency(num: number, currency: string = "EUR"): string {
  const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : `${currency} `;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(num));
  return `${symbol}${formatted}`;
}

export const PeriodSummaryStrip: React.FC<PeriodSummaryStripProps> = ({
  transactions,
  currency = "EUR"
}) => {
  const { totalIncome, totalExpense, netTotal } = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const tx of transactions) {
      if (tx.isTransfer) continue;
      const amt = parseFloat(tx.amount);
      if (isNaN(amt)) continue;
      if (amt > 0) {
        income += amt;
      } else {
        expense += Math.abs(amt);
      }
    }

    return {
      totalIncome: income,
      totalExpense: expense,
      netTotal: income - expense
    };
  }, [transactions]);

  const isNetPositive = netTotal >= 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-2.5 sm:px-3.5 sm:py-2 rounded-md bg-surface/40 border border-border/70 text-xs font-mono">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-muted text-[11px] sm:text-xs">Ingresos:</span>
        <span className="text-income font-medium truncate">+{formatCurrency(totalIncome, currency)}</span>
      </div>

      <span className="hidden sm:inline text-border">|</span>

      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-muted text-[11px] sm:text-xs">Gastos:</span>
        <span className="text-text font-medium truncate">-{formatCurrency(totalExpense, currency)}</span>
      </div>

      <span className="hidden sm:inline text-border">|</span>

      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-muted text-[11px] sm:text-xs">Neto:</span>
        <span className={`font-semibold truncate ${isNetPositive ? "text-income" : "text-expense"}`}>
          {isNetPositive ? "+" : "-"}{formatCurrency(netTotal, currency)}
        </span>
      </div>
    </div>
  );
};
