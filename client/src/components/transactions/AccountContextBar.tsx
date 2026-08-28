import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  X,
  Calendar
} from "lucide-react";
import { CategoryDropdown } from "@/components/categories/CategoryDropdown";
import { CategoryItem } from "@/lib/api/categories";
import { formatCyclePeriod, getAdjacentPeriod, getCurrentPeriod } from "@/lib/cycle-utils";
import { TransactionTypeFilter } from "./TransactionFilters";

interface AccountContextBarProps {
  selectedPeriod: string;
  cutoffDay?: number;
  onSelectPeriod: (period: string) => void;
  fromDate: string;
  toDate: string;
  selectedCategory: string;
  categoriesList?: CategoryItem[];
  selectedType?: TransactionTypeFilter;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  onCategoryChange: (category: string) => void;
  onTypeChange?: (type: TransactionTypeFilter) => void;
  onReset: () => void;
}

export const AccountContextBar: React.FC<AccountContextBarProps> = ({
  selectedPeriod,
  cutoffDay = 1,
  onSelectPeriod,
  fromDate,
  toDate,
  selectedCategory,
  categoriesList,
  selectedType = "all",
  searchQuery = "",
  onSearchChange,
  onFromChange,
  onToChange,
  onCategoryChange,
  onTypeChange,
  onReset
}) => {
  const [showDates, setShowDates] = useState<boolean>(false);
  const currentPeriod = getCurrentPeriod(cutoffDay);
  const periodInfo = formatCyclePeriod(selectedPeriod || currentPeriod, cutoffDay);

  const handlePrevPeriod = () => {
    const prev = getAdjacentPeriod(selectedPeriod || currentPeriod, -1);
    onSelectPeriod(prev);
  };

  const handleNextPeriod = () => {
    const next = getAdjacentPeriod(selectedPeriod || currentPeriod, 1);
    onSelectPeriod(next);
  };

  const hasActiveFilters = Boolean(
    fromDate || toDate || selectedCategory || (selectedType && selectedType !== "all") || searchQuery
  );

  return (
    <div className="space-y-2">
      {/* GitHub-style Flat Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-md bg-surface/50 border border-border">
        {/* Left: Cycle Selector */}
        <div className="flex items-center gap-1">
          <div className="flex items-center rounded-md bg-surface-elevated border border-border p-0.5">
            <button
              type="button"
              onClick={handlePrevPeriod}
              title="Mes anterior"
              className="p-1 rounded text-muted hover:text-text transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-2 text-xs font-semibold text-text font-mono whitespace-nowrap">
              {periodInfo.label}
            </span>

            <button
              type="button"
              onClick={handleNextPeriod}
              title="Mes siguiente"
              className="p-1 rounded text-muted hover:text-text transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {selectedPeriod !== currentPeriod && (
            <button
              type="button"
              onClick={() => onSelectPeriod(currentPeriod)}
              title="Ir al ciclo actual"
              className="px-2 py-1 rounded-md bg-accent/10 border border-accent/20 text-accent text-[11px] font-mono flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Hoy</span>
            </button>
          )}
        </div>

        {/* Center: Search Input */}
        <div className="flex-1 min-w-[140px] max-w-sm relative">
          <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Buscar por concepto o comercio..."
            className="w-full bg-surface-elevated border border-border rounded-md pl-8 pr-7 py-1 text-xs text-text placeholder:text-muted/60 outline-hidden focus:border-accent font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange?.("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-text cursor-pointer p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Right: Type Filters & Category */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onTypeChange && (
            <div className="flex items-center rounded-md bg-surface-elevated border border-border p-0.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => onTypeChange("all")}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  selectedType === "all"
                    ? "bg-surface text-text font-semibold shadow-xs"
                    : "text-muted hover:text-text"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => onTypeChange("expense")}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  selectedType === "expense"
                    ? "bg-surface text-expense font-semibold shadow-xs"
                    : "text-muted hover:text-text"
                }`}
              >
                Gastos
              </button>
              <button
                type="button"
                onClick={() => onTypeChange("income")}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  selectedType === "income"
                    ? "bg-surface text-income font-semibold shadow-xs"
                    : "text-muted hover:text-text"
                }`}
              >
                Ingresos
              </button>
              <button
                type="button"
                onClick={() => onTypeChange("transfer")}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  selectedType === "transfer"
                    ? "bg-surface text-transfer font-semibold shadow-xs"
                    : "text-muted hover:text-text"
                }`}
              >
                Traspasos
              </button>
            </div>
          )}

          {/* Category Dropdown */}
          <div className="flex items-center gap-1 bg-surface-elevated px-2 py-0.5 rounded-md border border-border text-xs">
            <span className="text-[10px] text-muted font-mono">Cat:</span>
            <CategoryDropdown
              value={selectedCategory || null}
              onChange={(catName) => onCategoryChange(catName || "")}
              categories={categoriesList}
              allowAll={true}
              allLabel="Todas"
              allowUncategorized={true}
              uncategorizedLabel="Sin categoría"
              size="sm"
              dropdownAlign="right"
              className="min-w-[100px]"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowDates((prev) => !prev)}
            title="Filtrar por fecha"
            className={`p-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
              showDates || fromDate || toDate
                ? "bg-accent/10 border-accent/30 text-accent"
                : "bg-surface-elevated border-border text-muted hover:text-text"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              title="Limpiar filtros"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono text-muted hover:text-accent border border-transparent hover:border-border cursor-pointer transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Range Sub-Bar */}
      {showDates && (
        <div className="flex items-center gap-3 p-2 rounded-md bg-surface/30 border border-border text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-muted">Desde:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromChange(e.target.value)}
              className="bg-surface-elevated border border-border rounded px-2 py-0.5 text-text outline-hidden color-scheme-dark"
            />
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-muted">Hasta:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToChange(e.target.value)}
              className="bg-surface-elevated border border-border rounded px-2 py-0.5 text-text outline-hidden color-scheme-dark"
            />
          </div>
        </div>
      )}
    </div>
  );
};
