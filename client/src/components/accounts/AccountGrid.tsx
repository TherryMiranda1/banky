import React from "react";
import { Account } from "@/lib/api/accounts";
import { AccountCard } from "./AccountCard";
import { Plus, Landmark } from "lucide-react";
import { Link } from "react-router-dom";

interface AccountGridProps {
  accounts: Account[];
  isLoading?: boolean;
  onEdit?: (account: Account) => void;
  onToggleActive?: (account: Account) => void;
  onMoveAccount?: (index: number, direction: "prev" | "next") => void;
}

export const AccountGrid: React.FC<AccountGridProps> = ({
  accounts,
  isLoading,
  onEdit,
  onToggleActive,
  onMoveAccount
}) => {
  if (isLoading) {
    return (
      <div className="rounded-md border border-border bg-surface/30 overflow-hidden divide-y divide-border/40 animate-pulse">
        <div className="px-4 py-2.5 bg-surface-elevated border-b border-border flex items-center justify-between">
          <div className="h-4 w-32 rounded bg-border/60" />
          <div className="h-4 w-16 rounded bg-border/60" />
        </div>
        {[1, 2, 3].map((idx) => (
          <div key={idx} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-border/50" />
              <div className="space-y-1.5">
                <div className="w-32 h-4 rounded bg-border/60" />
                <div className="w-20 h-3 rounded bg-border/40" />
              </div>
            </div>
            <div className="w-24 h-5 rounded bg-border/50" />
          </div>
        ))}
      </div>
    );
  }

  const activeCount = accounts.filter((a) => a.isActive).length;

  return (
    <div className="rounded-md border border-border bg-surface/30 overflow-hidden">
      {/* Box Header */}
      <div className="px-4 py-2.5 bg-surface-elevated border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="w-3.5 h-3.5 text-muted" />
          <span className="text-xs font-semibold text-text">
            Cuentas bancarias conectadas
          </span>
        </div>
        <span className="text-xs font-mono text-muted">
          {activeCount} de {accounts.length} activas
        </span>
      </div>

      {/* Account Rows */}
      <div className="divide-y divide-border/40">
        {accounts.map((account, index) => (
          <AccountCard
            key={account.id}
            account={account}
            onEdit={onEdit}
            onToggleActive={onToggleActive}
            onMove={onMoveAccount ? (dir) => onMoveAccount(index, dir) : undefined}
            isFirst={index === 0}
            isLast={index === accounts.length - 1}
          />
        ))}
      </div>

      {/* Box Footer Action: Connect New Bank */}
      <div className="px-4 py-2.5 bg-surface/20 border-t border-border/60 flex items-center justify-between">
        <Link
          to="/connect"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Conectar otra cuenta o banco...</span>
        </Link>
        <Link
          to="/accounts"
          className="text-[11px] font-mono text-muted hover:text-text transition-colors"
        >
          Ver todas las transacciones →
        </Link>
      </div>
    </div>
  );
};
