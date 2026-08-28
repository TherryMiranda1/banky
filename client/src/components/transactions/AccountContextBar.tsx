import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Filter,
  Search,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Layers,
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
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
      {/* Primary Toolbar */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-surface/80 border border-border/70 flex flex-wrap items-center justify-between gap-2.5 shadow-sm backdrop-blur-md">
        {/* Left: Period Linear Navigator */}
        <div className="flex items-center gap-1.5 bg-bg/80 p-1 rounded-xl border border-border/60">
          <button
            type="button"
            onClick={handlePrevPeriod}
            title="Mes anterior"
            className="p-1 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2">
            <span className="text-xs font-semibold text-text whitespace-nowrap">
              {periodInfo.label}
            </span>
            {periodInfo.isCurrent && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            )}
          </div>

          <button
            type="button"
            onClick={handleNextPeriod}
            title="Mes siguiente"
            className="p-1 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {selectedPeriod !== currentPeriod && (
            <button
              type="button"
              onClick={() => onSelectPeriod(currentPeriod)}
              title="Ir al ciclo actual"
              className="ml-1 p-1 px-2 rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors text-[10px] font-mono flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">Actual</span>
            </button>
          )}
        </div>

        {/* Center: Search & Quick Type Pills */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          {onSearchChange && (
            <div className="relative flex-1 min-w-[120px]">
              <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar movimiento..."
                className="w-full bg-bg/80 border border-border/60 rounded-xl pl-8 pr-7 py-1.5 text-xs text-text placeholder:text-muted/60 outline-hidden focus:border-accent transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-text cursor-pointer p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Type Filter Segmented Control */}
          {onTypeChange && (
            <div className="hidden sm:flex items-center bg-bg/80 p-0.5 rounded-xl border border-border/60 shrink-0">
              <button
                type="button"
                onClick={() => onTypeChange("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                  selectedType === "all"
                    ? "bg-surface text-text font-semibold shadow-xs border border-border/70"
                    : "text-muted hover:text-text"
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Todos</span>
              </button>

              <button
                type="button"
                onClick={() => onTypeChange("expense")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                  selectedType === "expense"
                    ? "bg-expense/15 text-expense font-semibold shadow-xs border border-expense/40"
                    : "text-muted hover:text-text"
                }`}
              >
                <ArrowUpRight className="w-3 h-3 text-expense" />
                <span>Gastos</span>
              </button>

              <button
                type="button"
                onClick={() => onTypeChange("income")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                  selectedType === "income"
                    ? "bg-income/15 text-income font-semibold shadow-xs border border-income/40"
                    : "text-muted hover:text-text"
                }`}
              >
                <ArrowDownLeft className="w-3 h-3 text-income" />
                <span>Ingresos</span>
              </button>

              <button
                type="button"
                onClick={() => onTypeChange("transfer")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                  selectedType === "transfer"
                    ? "bg-transfer/15 text-transfer font-semibold shadow-xs border border-transfer/40"
                    : "text-muted hover:text-text"
                }`}
              >
                <ArrowLeftRight className="w-3 h-3 text-transfer" />
                <span>Traspasos</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Filters Toggle & Category */}
        <div className="flex items-center gap-2">
          {/* Quick Category Picker */}
          <div className="hidden md:flex items-center gap-1 bg-bg/80 px-2 py-1 rounded-xl border border-border/60 shrink-0">
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
              className="min-w-[100px]"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
              showAdvancedFilters || (fromDate || toDate)
                ? "bg-accent/15 border-accent/40 text-accent"
                : "bg-bg/80 border-border/60 text-muted hover:text-text hover:border-border"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filtros</span>
            {(fromDate || toDate) && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              title="Limpiar todos los filtros"
              className="p-1.5 rounded-xl bg-surface hover:bg-border/60 border border-border/60 text-muted hover:text-accent transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Expandable Drawer */}
      {showAdvancedFilters && (
        <div className="p-3.5 rounded-2xl bg-surface/90 border border-border/70 flex flex-wrap items-center gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 text-muted font-mono text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <span>Rango de fechas:</span>
          </div>

          <div className="flex items-center gap-1 bg-bg/80 px-2.5 py-1 rounded-xl border border-border/60">
            <span className="text-[10px] text-muted font-mono">Desde:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromChange(e.target.value)}
              className="bg-transparent text-[11px] font-mono text-text outline-hidden color-scheme-dark"
            />
          </div>

          <div className="flex items-center gap-1 bg-bg/80 px-2.5 py-1 rounded-xl border border-border/60">
            <span className="text-[10px] text-muted font-mono">Hasta:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToChange(e.target.value)}
              className="bg-transparent text-[11px] font-mono text-text outline-hidden color-scheme-dark"
            />
          </div>

          {/* Mobile Category Dropdown if hidden on small screens */}
          <div className="flex md:hidden items-center gap-1 bg-bg/80 px-2 py-1 rounded-xl border border-border/60">
            <span className="text-[10px] text-muted font-mono">Categoría:</span>
            <CategoryDropdown
              value={selectedCategory || null}
              onChange={(catName) => onCategoryChange(catName || "")}
              categories={categoriesList}
              allowAll={true}
              allLabel="Todas"
              allowUncategorized={true}
              uncategorizedLabel="Sin categoría"
              size="sm"
              className="min-w-[120px]"
            />
          </div>

          {/* Mobile Type Selector if hidden on small screens */}
          <div className="flex sm:hidden items-center bg-bg/80 p-0.5 rounded-xl border border-border/60 w-full justify-between">
            <button
              type="button"
              onClick={() => onTypeChange?.("all")}
              className={`flex-1 py-1 rounded-lg text-[10px] font-mono text-center ${
                selectedType === "all" ? "bg-surface text-text font-semibold" : "text-muted"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => onTypeChange?.("expense")}
              className={`flex-1 py-1 rounded-lg text-[10px] font-mono text-center ${
                selectedType === "expense" ? "bg-expense/15 text-expense font-semibold" : "text-muted"
              }`}
            >
              Gastos
            </button>
            <button
              type="button"
              onClick={() => onTypeChange?.("income")}
              className={`flex-1 py-1 rounded-lg text-[10px] font-mono text-center ${
                selectedType === "income" ? "bg-income/15 text-income font-semibold" : "text-muted"
              }`}
            >
              Ingresos
            </button>
            <button
              type="button"
              onClick={() => onTypeChange?.("transfer")}
              className={`flex-1 py-1 rounded-lg text-[10px] font-mono text-center ${
                selectedType === "transfer" ? "bg-transfer/15 text-transfer font-semibold" : "text-muted"
              }`}
            >
              Traspasos
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
