import React from "react";
import { Account } from "@/lib/api/accounts";
import { AlertTriangle, Power, Settings2, ChevronLeft, ChevronRight } from "lucide-react";
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
      aria-label={`Ver detalles de la cuenta ${displayName}`}
      className={`group relative rounded-2xl bg-surface border border-border/80 p-5 flex flex-col justify-between h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-lg cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-accent/50 ${
        !isActive ? "opacity-60 grayscale-[20%]" : ""
      }`}
    >
      {/* Top Header: Logo + Status Badges + Action Buttons */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <BankLogo bankName={account.bankName} logoUrl={account.logoUrl} size="md" />

          {/* Action buttons & status badge */}
          <div
            className="flex items-center gap-1.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {isExpired && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-negative/10 text-negative border border-negative/20">
                <AlertTriangle className="w-3 h-3" />
                Expirada
              </span>
            )}

            {!isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-border text-muted">
                Inactiva
              </span>
            )}

            {onMove && (
              <div className="flex items-center bg-bg/80 border border-border/60 rounded-xl p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove("prev");
                  }}
                  disabled={isFirst}
                  aria-label="Mover cuenta hacia la izquierda"
                  title="Mover hacia la izquierda"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-text hover:bg-border/60 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove("next");
                  }}
                  disabled={isLast}
                  aria-label="Mover cuenta hacia la derecha"
                  title="Mover hacia la derecha"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-text hover:bg-border/60 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(account);
                }}
                aria-label="Configurar cuenta"
                title="Configurar cuenta"
                className="w-7 h-7 flex items-center justify-center rounded-xl bg-bg/60 border border-border/40 text-muted hover:text-text hover:bg-border/60 transition-colors cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            )}

            {onToggleActive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleActive(account);
                }}
                aria-label={isActive ? "Desactivar cuenta" : "Activar cuenta"}
                title={isActive ? "Desactivar cuenta" : "Activar cuenta"}
                className={`w-7 h-7 flex items-center justify-center rounded-xl bg-bg/60 border border-border/40 transition-colors cursor-pointer ${
                  isActive
                    ? "text-accent/80 hover:text-accent hover:bg-accent/10"
                    : "text-muted hover:text-text hover:bg-border/60"
                }`}
              >
                <Power className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Account Title & Subtitle (Full width, no aggressive truncation) */}
        <div className="space-y-1">
          <h3 className="font-semibold text-sm sm:text-base text-text group-hover:text-accent transition-colors leading-snug line-clamp-2">
            {displayName}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted font-mono flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full border ${bankTheme.badgeBg} ${bankTheme.badgeText}`}>
              {bankTheme.label}
            </span>
            <span>{maskIban(account.iban)}</span>
          </div>
        </div>
      </div>

      {/* Card Footer: Clean Available Balance without redundant action button */}
      <div className="mt-5 pt-3.5 border-t border-border/40">
        <span className="text-[10px] text-muted font-mono uppercase tracking-wider block">
          Saldo Disponible
        </span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-sm font-mono text-muted">
            {formatCurrencySymbol(account.currency)}
          </span>
          <span
            className={`text-2xl font-bold font-mono tracking-tight ${
              isNegative ? "text-negative" : "text-text group-hover:text-accent transition-colors"
            }`}
          >
            {formatBalanceAmount(balanceAmountStr)}
          </span>
          <span className="text-xs font-mono text-muted ml-0.5">
            {account.currency}
          </span>
        </div>

        {account.lastBalance?.heldAmount && (
          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Retención: {formatCurrencySymbol(account.currency)}{account.lastBalance.heldAmount}</span>
          </div>
        )}
      </div>
    </div>
  );
};
