import React from "react";
import { Account } from "@/lib/api/accounts";
import { AccountCard } from "./AccountCard";
import { Plus } from "lucide-react";
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-surface border border-border/80 p-5 h-44 flex flex-col justify-between animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-border/60" />
                <div className="space-y-2">
                  <div className="w-28 h-4 rounded bg-border/60" />
                  <div className="w-16 h-3 rounded bg-border/40" />
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-border/40 space-y-2">
              <div className="w-20 h-3 rounded bg-border/40" />
              <div className="w-32 h-6 rounded bg-border/60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Connect New Bank Action Card */}
      <Link
        to="/connect"
        className="group rounded-2xl bg-surface/40 border border-dashed border-border/80 hover:border-accent/40 p-5 flex flex-col items-center justify-center text-center gap-2.5 min-h-[160px] transition-all duration-200 hover:bg-surface/80 cursor-pointer"
      >
        <div className="w-10 h-10 rounded-full bg-bg border border-border/80 group-hover:border-accent/40 group-hover:bg-accent/10 flex items-center justify-center text-muted group-hover:text-accent transition-colors">
          <Plus className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-sm text-text group-hover:text-accent transition-colors">
            Conectar banco
          </p>
          <p className="text-xs text-muted font-mono mt-0.5">
            Santander, Revolut, BBVA y más
          </p>
        </div>
      </Link>
    </div>
  );
};
