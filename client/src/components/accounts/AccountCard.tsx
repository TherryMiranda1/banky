import React from "react";
import { Account } from "@/lib/api/accounts";
import { AlertTriangle, Power, Settings2, ChevronUp, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BankLogo } from "./BankLogo";
import { formatFirstName } from "@/lib/format-utils";
import { getBankMetadata, maskIban, formatCurrencySymbol, formatBalanceAmount } from "@/lib/bank-utils";

interface AccountCardProps {
  account: Account;
  onEdit?: (account: Account) => void;
  onToggleActive?: (account: Account) => void;
  onMove?: (direction: "prev" | "next") => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onEdit,
  onToggleActive,
  onMove,
  isFirst = false,
  isLast = false
}) => {
  const navigate = useNavigate();
  const isExpired = account.status === "expired";
  const isActive = account.isActive ?? true;
  const balanceAmountStr = account.lastBalance?.amount ?? "0.00";
  const balanceNum = parseFloat(balanceAmountStr);
  const isNegative = !isNaN(balanceNum) && balanceNum < 0;

  const displayName = account.nickname || formatFirstName(account.alias) || account.bankName;
  const bankTheme = getBankMetadata(account.bankName);

  const handleCardClick = () => {
    navigate(`/accounts/${encodeURIComponent(account.id)}`);
  };

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={`group flex items-center justify-between py-3.5 px-4 bg-surface/30 hover:bg-surface-elevated transition-colors duration-100 cursor-pointer border-b border-border/50 last:border-b-0 ${
        !isActive ? "opacity-60" : ""
      }`}
    >
      {/* Left: Bank Logo + Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <BankLogo bankName={account.bankName} logoUrl={account.logoUrl} size="md" />

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm text-text group-hover:text-white transition-colors truncate">
              {displayName}
            </h3>

            {isExpired ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-expense/10 text-expense border border-expense/20">
                <AlertTriangle className="w-2.5 h-2.5" />
                Expirada
              </span>
            ) : !isActive ? (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono bg-surface-elevated text-muted border border-border">
                Inactiva
              </span>
            ) : (
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${bankTheme.badgeBg} ${bankTheme.badgeText}`}>
                {bankTheme.label}
              </span>
            )}
          </div>

          <p className="text-xs text-muted font-mono truncate">
            {maskIban(account.iban)} {account.nickname ? `(${account.bankName})` : ""}
          </p>
        </div>
      </div>

      {/* Right: Balance + Quick Hover Actions */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <span
            className={`font-mono text-sm sm:text-base font-bold tracking-tight block ${
              isNegative ? "text-expense" : "text-text group-hover:text-accent transition-colors"
            }`}
          >
            {formatCurrencySymbol(account.currency)}{formatBalanceAmount(balanceAmountStr)}
          </span>
          <span className="text-[10px] font-mono text-muted uppercase block">
            {account.currency}
          </span>
        </div>

        {/* Quick Actions (revealed on hover) */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {onMove && (
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => onMove("prev")}
                disabled={isFirst}
                title="Mover arriba"
                className="p-0.5 text-muted hover:text-text disabled:opacity-20 cursor-pointer"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onMove("next")}
                disabled={isLast}
                title="Mover abajo"
                className="p-0.5 text-muted hover:text-text disabled:opacity-20 cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(account)}
              title="Ajustes de cuenta"
              className="p-1.5 rounded-md hover:bg-surface border border-transparent hover:border-border text-muted hover:text-text cursor-pointer transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleActive && (
            <button
              type="button"
              onClick={() => onToggleActive(account)}
              title={isActive ? "Desactivar cuenta" : "Activar cuenta"}
              className={`p-1.5 rounded-md hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer ${
                isActive ? "text-muted hover:text-expense" : "text-muted hover:text-positive"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
