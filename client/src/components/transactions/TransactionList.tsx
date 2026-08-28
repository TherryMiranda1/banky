import React, { useState } from "react";
import { Transaction } from "@/lib/api/transactions";
import { TransactionRow } from "./TransactionRow";
import { TransactionDetailModal } from "./TransactionDetailModal";
import { Loader2, Inbox } from "lucide-react";
import { CategoryItem } from "@/lib/api/categories";

interface TransactionListProps {
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

export const TransactionList: React.FC<TransactionListProps> = ({
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
  if (isLoading) {
    return (
      <div className="rounded-xl bg-surface border border-border overflow-hidden divide-y divide-border/40">
        <div className="px-4 py-3 bg-surface/50 border-b border-border/60 flex items-center justify-between">
          <div className="h-4 w-32 rounded bg-border/60 animate-pulse" />
          <div className="h-4 w-16 rounded bg-border/60 animate-pulse" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-4 w-16 bg-border/50 rounded" />
              <div className="h-4 w-40 bg-border/50 rounded" />
              <div className="h-4 w-16 bg-border/30 rounded" />
            </div>
            <div className="h-4 w-20 bg-border/50 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl bg-surface border border-border p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-border/40 text-muted flex items-center justify-center mx-auto">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-text">No transactions in this period</h3>
        <p className="text-xs text-muted font-mono max-w-sm mx-auto">
          Try clearing or adjusting your date range and category filters to see more activity.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-surface border border-border overflow-hidden">
        <div className="px-4 py-3 bg-surface border-b border-border/60 flex items-center justify-between">
          <span className="text-xs font-mono text-muted uppercase tracking-wider">
            Transactions History
          </span>
          <span className="text-xs font-mono text-muted">
            Showing {transactions.length} of {total}
          </span>
        </div>

        <div className="divide-y divide-border/20">
          {transactions.map((tx, idx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              index={idx}
              onUpdateCategory={onUpdateCategory}
              categoriesList={categoriesList}
              onSelectTransaction={(selected) => setSelectedTransaction(selected)}
            />
          ))}
        </div>
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-surface hover:bg-border/60 border border-border text-sm font-mono text-text transition-all duration-150 disabled:opacity-50 cursor-pointer shadow-sm hover:border-accent/40"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
                <span>Loading more...</span>
              </>
            ) : (
              <span>Load more transactions</span>
            )}
          </button>
        </div>
      )}

      {/* Transaction Rich Detail Modal */}
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

