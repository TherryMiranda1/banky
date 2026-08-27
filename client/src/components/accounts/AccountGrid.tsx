import React from "react";
import { Account } from "@/lib/api/accounts";
import { AccountCard } from "./AccountCard";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface AccountGridProps {
  accounts: Account[];
  isLoading?: boolean;
}

export const AccountGrid: React.FC<AccountGridProps> = ({ accounts, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="rounded-xl bg-surface border border-border p-5 h-44 flex flex-col justify-between animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-border/80" />
                <div className="space-y-2">
                  <div className="w-28 h-4 rounded bg-border/80" />
                  <div className="w-20 h-3 rounded bg-border/50" />
                </div>
              </div>
              <div className="w-14 h-5 rounded bg-border/60" />
            </div>
            <div className="pt-4 border-t border-border/40 space-y-2">
              <div className="w-24 h-3 rounded bg-border/50" />
              <div className="w-36 h-7 rounded bg-border/80" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} />
      ))}

      <Link
        to="/connect"
        className="group rounded-xl bg-surface/50 border border-dashed border-border/90 hover:border-accent/40 p-5 flex flex-col items-center justify-center text-center gap-3 min-h-[170px] transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface/80 cursor-pointer"
      >
        <div className="w-10 h-10 rounded-full bg-accent/10 group-hover:bg-accent/20 flex items-center justify-center text-accent transition-colors">
          <PlusCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-sm text-text group-hover:text-accent transition-colors">
            Connect New Bank
          </p>
          <p className="text-xs text-muted font-mono mt-0.5">
            Add Santander, Revolut, BBVA & more
          </p>
        </div>
      </Link>
    </div>
  );
};
