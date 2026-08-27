import React from "react";
import { Filter, X } from "lucide-react";

interface TransactionFiltersProps {
  fromDate: string;
  toDate: string;
  selectedCategory: string;
  availableCategories: string[];
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  onCategoryChange: (category: string) => void;
  onReset: () => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  fromDate,
  toDate,
  selectedCategory,
  availableCategories,
  onFromChange,
  onToChange,
  onCategoryChange,
  onReset
}) => {
  const hasActiveFilters = Boolean(fromDate || toDate || selectedCategory);

  return (
    <div className="p-3.5 sm:p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap">
        <div className="flex items-center gap-1.5 text-muted text-xs font-mono shrink-0">
          <Filter className="w-3.5 h-3.5 text-accent" />
          <span>Filters:</span>
        </div>

        {/* From Date */}
        <div className="flex items-center gap-1.5 bg-bg px-2.5 py-1.5 rounded-lg border border-border/80 focus-within:border-accent transition-colors shrink-0">
          <label htmlFor="filter-from-date" className="text-xs text-muted font-mono">From:</label>
          <input
            id="filter-from-date"
            type="date"
            value={fromDate}
            onChange={(e) => onFromChange(e.target.value)}
            className="bg-transparent text-xs font-mono text-text outline-none color-scheme-dark"
          />
        </div>

        {/* To Date */}
        <div className="flex items-center gap-1.5 bg-bg px-2.5 py-1.5 rounded-lg border border-border/80 focus-within:border-accent transition-colors shrink-0">
          <label htmlFor="filter-to-date" className="text-xs text-muted font-mono">To:</label>
          <input
            id="filter-to-date"
            type="date"
            value={toDate}
            onChange={(e) => onToChange(e.target.value)}
            className="bg-transparent text-xs font-mono text-text outline-none color-scheme-dark"
          />
        </div>

        {/* Category Select */}
        <div className="flex items-center gap-1.5 bg-bg px-2.5 py-1.5 rounded-lg border border-border/80 focus-within:border-accent transition-colors shrink-0">
          <label htmlFor="filter-category" className="text-xs text-muted font-mono">Cat:</label>
          <select
            id="filter-category"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="bg-transparent text-xs font-mono text-text outline-none cursor-pointer pr-1 max-w-[120px] sm:max-w-none truncate"
          >
            <option value="" className="bg-surface text-text">All</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat} className="bg-surface text-text">
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-1 text-xs font-mono text-muted hover:text-accent transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg bg-bg border border-border/40 shrink-0 self-start sm:self-auto"
        >
          <X className="w-3 h-3" />
          Clear filters
        </button>
      )}
    </div>
  );
};
