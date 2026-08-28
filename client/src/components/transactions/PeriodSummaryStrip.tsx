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
    <div className="flex items-center gap-4 sm:gap-6 px-3.5 py-2 rounded-md bg-surface/40 border border-border/70 text-xs font-mono">
      <div className="flex items-center gap-1.5">
        <span className="text-muted">Ingresos:</span>
        <span className="text-income font-medium">+{formatCurrency(totalIncome, currency)}</span>
      </div>

      <span className="text-border">|</span>

      <div className="flex items-center gap-1.5">
        <span className="text-muted">Gastos:</span>
        <span className="text-text font-medium">-{formatCurrency(totalExpense, currency)}</span>
      </div>

      <span className="text-border">|</span>

      <div className="flex items-center gap-1.5">
        <span className="text-muted">Neto:</span>
        <span className={`font-semibold ${isNetPositive ? "text-income" : "text-expense"}`}>
          {isNetPositive ? "+" : "-"}{formatCurrency(netTotal, currency)}
        </span>
      </div>
    </div>
  );
};
