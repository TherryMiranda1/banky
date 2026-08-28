import React, { useMemo } from "react";
import { Transaction } from "@/lib/api/transactions";
import { ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";

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
    <div className="grid grid-cols-3 gap-2 sm:gap-4 p-2 sm:p-3 rounded-2xl bg-surface/60 border border-border/60 backdrop-blur-sm">
      {/* Income Card */}
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface/80 border border-border/60">
        <div className="w-7 h-7 rounded-lg bg-income/10 border border-income/20 flex items-center justify-center text-income shrink-0">
          <ArrowDownLeft className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-mono text-muted uppercase tracking-wider block truncate">
            Ingresos
          </span>
          <span className="text-xs sm:text-sm font-bold font-mono text-income tracking-tight block truncate">
            +{formatCurrency(totalIncome, currency)}
          </span>
        </div>
      </div>

      {/* Expense Card */}
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface/80 border border-border/60">
        <div className="w-7 h-7 rounded-lg bg-expense/10 border border-expense/20 flex items-center justify-center text-expense shrink-0">
          <ArrowUpRight className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-mono text-muted uppercase tracking-wider block truncate">
            Gastos
          </span>
          <span className="text-xs sm:text-sm font-bold font-mono text-expense tracking-tight block truncate">
            -{formatCurrency(totalExpense, currency)}
          </span>
        </div>
      </div>

      {/* Net Card */}
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface/80 border border-border/60">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
            isNetPositive
              ? "bg-positive/10 border-positive/20 text-positive"
              : "bg-expense/10 border-expense/20 text-expense"
          }`}
        >
          {isNetPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-mono text-muted uppercase tracking-wider block truncate">
            Neto
          </span>
          <span
            className={`text-xs sm:text-sm font-bold font-mono tracking-tight block truncate ${
              isNetPositive ? "text-positive" : "text-expense"
            }`}
          >
            {isNetPositive ? "+" : "-"}{formatCurrency(netTotal, currency)}
          </span>
        </div>
      </div>
    </div>
  );
};
