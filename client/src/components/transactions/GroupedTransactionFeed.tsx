import React, { useMemo, useState } from "react";
import { Transaction } from "@/lib/api/transactions";
import { TransactionRow } from "./TransactionRow";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { Loader2, Inbox } from "lucide-react";
import { CategoryItem } from "@/lib/api/categories";

interface GroupedTransactionFeedProps {
  transactions: Transaction[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onUpdateCategory?: (
    transactionId: string,
    categoryId: string | null,
    categoryName: string | null
  ) => void;
  categoriesList?: CategoryItem[];
}

interface DateGroup {
  dateKey: string;
  label: string;
  transactions: Transaction[];
  dailyNet: number;
}

function formatDateGroupHeader(isoString: string): { key: string; label: string } {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return { key: isoString, label: isoString };

    const now = new Date();
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

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

    if (isToday) return { key, label: "Hoy" };
    if (isYesterday) return { key, label: "Ayer" };

    const isCurrentYear = date.getFullYear() === now.getFullYear();
    const formatted = new Intl.DateTimeFormat("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      ...(isCurrentYear ? {} : { year: "numeric" })
    }).format(date);

    return { key, label: formatted.charAt(0).toUpperCase() + formatted.slice(1) };
  } catch {
    return { key: isoString, label: isoString };
  }
}

function formatDailyNet(net: number): string {
  const isNeg = net < 0;
  const abs = Math.abs(net);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(abs);

  return `${isNeg ? "-" : "+"}€${formatted}`;
}

export const GroupedTransactionFeed: React.FC<GroupedTransactionFeedProps> = ({
  transactions,
  total,
  hasMore,
  isLoading,
  isLoadingMore,
  onLoadMore,
  onUpdateCategory,
  categoriesList
}) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const groups = useMemo(() => {
    const groupMap = new Map<string, DateGroup>();

    for (const tx of transactions) {
      const { key, label } = formatDateGroupHeader(tx.bookedAt);
      const amt = parseFloat(tx.amount);
      const val = isNaN(amt) ? 0 : amt;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          dateKey: key,
          label,
          transactions: [tx],
          dailyNet: val
        });
      } else {
        const existing = groupMap.get(key)!;
        existing.transactions.push(tx);
        existing.dailyNet += val;
      }
    }

    return Array.from(groupMap.values());
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="rounded-3xl bg-surface/80 border border-border/70 overflow-hidden divide-y divide-border/40 animate-pulse">
        <div className="px-5 py-3.5 bg-surface border-b border-border flex items-center justify-between">
          <div className="h-4 w-32 rounded-md bg-border/60" />
          <div className="h-4 w-20 rounded-md bg-border/60" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-border/40" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-36 bg-border/50 rounded" />
                <div className="h-2.5 w-24 bg-border/30 rounded" />
              </div>
            </div>
            <div className="h-4 w-16 bg-border/50 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-3xl bg-surface/60 border border-border/70 p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto text-muted">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-text">Sin movimientos en este periodo</h3>
        <p className="text-xs text-muted font-mono max-w-sm mx-auto">
          Probá cambiando el mes o limpiando los filtros para ver más movimientos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grouped Feed Container */}
      <div className="rounded-3xl bg-surface/80 border border-border/70 overflow-hidden shadow-xl">
        {/* Feed Header */}
        <div className="px-5 py-3 bg-surface/90 border-b border-border/60 flex items-center justify-between">
          <span className="text-xs font-mono text-muted uppercase tracking-wider">
            Historial de Movimientos
          </span>
          <span className="text-xs font-mono text-muted">
            {transactions.length} de {total}
          </span>
        </div>

        {/* Date Groups */}
        <div>
          {groups.map((group) => {
            const isDailyNetPositive = group.dailyNet >= 0;

            return (
              <div key={group.dateKey} className="border-b border-border/30 last:border-b-0">
                {/* Date Group Header */}
                <div className="px-4 sm:px-5 py-2 bg-surface-elevated/90 border-b border-border/40 flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-muted uppercase tracking-wider">
                    {group.label}
                  </span>
                  <span
                    className={`font-mono text-[11px] font-medium ${
                      isDailyNetPositive ? "text-income" : "text-muted"
                    }`}
                  >
                    {formatDailyNet(group.dailyNet)}
                  </span>
                </div>

                {/* Rows for this date */}
                <div className="divide-y divide-border/20">
                  {group.transactions.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      transaction={tx}
                      onUpdateCategory={onUpdateCategory}
                      categoriesList={categoriesList}
                      onSelectTransaction={(selected) => setSelectedTransaction(selected)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Infinite Scroll / Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-surface hover:bg-border/60 border border-border text-xs font-mono text-text transition-all duration-150 disabled:opacity-50 cursor-pointer shadow-sm hover:border-accent/40"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
                <span>Cargando más movimientos...</span>
              </>
            ) : (
              <span>Cargar más movimientos</span>
            )}
          </button>
        </div>
      )}

      {/* Rich Detail Modal */}
      <TransactionDetailModal
        isOpen={Boolean(selectedTransaction)}
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        categoriesList={categoriesList}
        onUpdateCategory={(txId, catId, catName) => {
          if (selectedTransaction && selectedTransaction.id === txId) {
            setSelectedTransaction({
              ...selectedTransaction,
              category: catName
            });
          }
          if (onUpdateCategory) {
            onUpdateCategory(txId, catId, catName);
          }
        }}
      />
    </div>
  );
};
