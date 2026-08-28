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
      <div className="rounded-md border border-border bg-surface/30 overflow-hidden divide-y divide-border/40 animate-pulse">
        <div className="px-4 py-2.5 bg-surface-elevated border-b border-border flex items-center justify-between">
          <div className="h-4 w-32 rounded bg-border/60" />
          <div className="h-4 w-20 rounded bg-border/60" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-border/40" />
              <div className="space-y-1">
                <div className="h-3.5 w-40 bg-border/50 rounded" />
                <div className="h-2.5 w-20 bg-border/30 rounded" />
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
      <div className="rounded-md border border-border bg-surface/30 p-12 text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-surface-elevated border border-border flex items-center justify-center mx-auto text-muted">
          <Inbox className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-text">No se encontraron movimientos</h3>
        <p className="text-xs text-muted font-mono max-w-sm mx-auto">
          Cambiá el periodo o limpiá los filtros de búsqueda para ver más actividad.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* GitHub Primer Box Layout */}
      <div className="rounded-md border border-border bg-surface/30 overflow-hidden">
        {/* Box Header */}
        <div className="px-4 py-2.5 bg-surface-elevated border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-text">
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
              <div key={group.dateKey} className="border-b border-border/50 last:border-b-0">
                {/* Date Sub-Header */}
                <div className="px-4 py-1.5 bg-surface-elevated/60 border-b border-border/40 flex items-center justify-between">
                  <span className="text-[11px] font-mono font-medium text-muted uppercase tracking-wider">
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

                {/* Rows */}
                <div className="divide-y divide-border/30">
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
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-surface-elevated hover:bg-border/60 border border-border text-xs font-mono text-text transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                <span>Cargando movimientos...</span>
              </>
            ) : (
              <span>Cargar más</span>
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
