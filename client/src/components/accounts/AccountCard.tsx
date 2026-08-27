import React from "react";
import { Account } from "@/lib/api/accounts";
import { Building2, CheckCircle, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

interface AccountCardProps {
  account: Account;
}

function getBankColorClass(bankName: string): { border: string; bg: string; text: string } {
  const normalized = bankName.toLowerCase();
  if (normalized.includes("santander")) {
    return {
      border: "border-l-[#ec0000]",
      bg: "bg-[#ec0000]/10",
      text: "text-[#ec0000]"
    };
  }
  if (normalized.includes("revolut")) {
    return {
      border: "border-l-[#1963d2]",
      bg: "bg-[#1963d2]/10",
      text: "text-[#1963d2]"
    };
  }
  if (normalized.includes("bbva")) {
    return {
      border: "border-l-[#004481]",
      bg: "bg-[#004481]/10",
      text: "text-[#007eae]"
    };
  }
  if (normalized.includes("caixa") || normalized.includes("imagin")) {
    return {
      border: "border-l-[#007eae]",
      bg: "bg-[#007eae]/10",
      text: "text-[#007eae]"
    };
  }
  return {
    border: "border-l-accent",
    bg: "bg-accent/10",
    text: "text-accent"
  };
}

function maskIban(iban: string | null): string {
  if (!iban) return "No IBAN";
  const clean = iban.replace(/\s+/g, "");
  if (clean.length <= 8) return clean;
  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-4);
  return `${prefix} •••• ${suffix}`;
}

function formatCurrencySymbol(currency: string): string {
  switch (currency.toUpperCase()) {
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "USD":
      return "$";
    default:
      return `${currency} `;
  }
}

function formatBalanceAmount(amountStr: string): string {
  const num = parseFloat(amountStr);
  if (isNaN(num)) return amountStr;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  const bankTheme = getBankColorClass(account.bankName);
  const isExpired = account.status === "expired";
  const balanceAmountStr = account.lastBalance?.amount ?? "0.00";
  const balanceNum = parseFloat(balanceAmountStr);
  const isNegative = !isNaN(balanceNum) && balanceNum < 0;

  return (
    <div className={`group relative rounded-xl bg-surface border border-border border-l-4 ${bankTheme.border} p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(0,229,160,0.10)] hover:border-border/80`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${bankTheme.bg} flex items-center justify-center ${bankTheme.text} shrink-0`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <Link
              to={`/accounts/${encodeURIComponent(account.id)}`}
              className="font-semibold text-sm text-text hover:text-accent transition-colors block"
            >
              {account.bankName}
            </Link>
            <p className="text-xs text-muted font-mono mt-0.5">
              {account.alias || maskIban(account.iban)}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {isExpired ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-negative/10 text-negative border border-negative/20">
              <AlertTriangle className="w-3 h-3" />
              Expired
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-accent/10 text-accent border border-accent/20">
              <CheckCircle className="w-3 h-3" />
              Active
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border/40 flex items-end justify-between">
        <div>
          <span className="text-[11px] text-muted font-mono uppercase tracking-wider block">
            Available Balance
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-mono text-muted">
              {formatCurrencySymbol(account.currency)}
            </span>
            <span
              className={`text-2xl font-bold font-mono tracking-tight ${
                isNegative ? "text-negative" : "text-accent"
              }`}
            >
              {formatBalanceAmount(balanceAmountStr)}
            </span>
            <span className="text-xs font-mono text-muted ml-1">
              {account.currency}
            </span>
          </div>
        </div>

        <Link
          to={`/accounts/${encodeURIComponent(account.id)}`}
          className="p-1.5 rounded-lg bg-bg text-muted hover:text-accent hover:bg-border/60 transition-colors"
          title="View account transactions"
        >
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
