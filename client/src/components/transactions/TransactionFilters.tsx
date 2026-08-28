import React from "react";
import { Filter, X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Layers, FileSpreadsheet, Download } from "lucide-react";
import { CategoryDropdown } from "@/components/categories/CategoryDropdown";
import { CategoryItem } from "@/lib/api/categories";

export type TransactionTypeFilter = "all" | "income" | "expense" | "transfer";

interface TransactionFiltersProps {
  fromDate: string;
  toDate: string;
  selectedCategory: string;
  availableCategories?: string[];
  categoriesList?: CategoryItem[];
  selectedType?: TransactionTypeFilter;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  onCategoryChange: (category: string) => void;
  onTypeChange?: (type: TransactionTypeFilter) => void;
  onReset: () => void;
  onExportExcel?: () => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  fromDate,
  toDate,
  selectedCategory,
  categoriesList,
  selectedType = "all",
  onFromChange,
  onToChange,
  onCategoryChange,
  onTypeChange,
  onReset,
  onExportExcel
}) => {
  const hasActiveFilters = Boolean(
    fromDate || toDate || selectedCategory || (selectedType && selectedType !== "all")
  );

  return (
    <div className="p-2 sm:p-2.5 rounded-xl bg-surface/80 border border-border/70 flex flex-wrap items-center justify-between gap-2.5 text-xs">
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1 text-muted text-[11px] font-mono shrink-0 pl-1">
          <Filter className="w-3 h-3 text-accent" />
          <span className="hidden sm:inline">Filtros:</span>
        </div>

        {/* Type Filter Segmented Control */}
        {onTypeChange && (
          <div className="flex items-center bg-bg/80 p-0.5 rounded-lg border border-border/70 shrink-0">
            <button
              type="button"
              onClick={() => onTypeChange("all")}
              className={`px-2 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                selectedType === "all"
                  ? "bg-surface text-accent font-semibold shadow-xs border border-border/60"
                  : "text-muted hover:text-text"
              }`}
            >
              <Layers className="w-2.5 h-2.5" />
              <span>Todos</span>
            </button>

            <button
              type="button"
              onClick={() => onTypeChange("income")}
              className={`px-2 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                selectedType === "income"
                  ? "bg-accent/15 text-accent font-semibold shadow-xs border border-accent/40"
                  : "text-muted hover:text-text"
              }`}
            >
              <ArrowDownLeft className="w-2.5 h-2.5 text-accent" />
              <span>Ingresos</span>
            </button>

            <button
              type="button"
              onClick={() => onTypeChange("expense")}
              className={`px-2 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                selectedType === "expense"
                  ? "bg-negative/15 text-negative font-semibold shadow-xs border border-negative/40"
                  : "text-muted hover:text-text"
              }`}
            >
              <ArrowUpRight className="w-2.5 h-2.5 text-negative" />
              <span>Gastos</span>
            </button>

            <button
              type="button"
              onClick={() => onTypeChange("transfer")}
              className={`px-2 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                selectedType === "transfer"
                  ? "bg-sky-500/15 text-sky-400 font-semibold shadow-xs border border-sky-500/40"
                  : "text-muted hover:text-text"
              }`}
            >
              <ArrowLeftRight className="w-2.5 h-2.5 text-sky-400" />
              <span>Traspasos</span>
            </button>
          </div>
        )}

        {/* Category Dropdown */}
        <div className="flex items-center gap-1 bg-bg/70 px-1.5 py-0.5 rounded-lg border border-border/60 focus-within:border-accent transition-colors shrink-0">
          <span className="text-[10px] text-muted font-mono pl-1">Cat:</span>
          <CategoryDropdown
            value={selectedCategory || null}
            onChange={(catName) => onCategoryChange(catName || "")}
            categories={categoriesList}
            allowAll={true}
            allLabel="Todas"
            allowUncategorized={true}
            uncategorizedLabel="Sin categoría"
            size="sm"
            className="min-w-[120px] sm:min-w-[140px]"
          />
        </div>

        {/* From Date */}
        <div className="flex items-center gap-1 bg-bg/70 px-2 py-1 rounded-lg border border-border/60 focus-within:border-accent transition-colors shrink-0">
          <span className="text-[10px] text-muted font-mono">Desde:</span>
          <input
            id="filter-from-date"
            type="date"
            value={fromDate}
            onChange={(e) => onFromChange(e.target.value)}
            className="bg-transparent text-[11px] font-mono text-text outline-hidden color-scheme-dark"
          />
        </div>

        {/* To Date */}
        <div className="flex items-center gap-1 bg-bg/70 px-2 py-1 rounded-lg border border-border/60 focus-within:border-accent transition-colors shrink-0">
          <span className="text-[10px] text-muted font-mono">Hasta:</span>
          <input
            id="filter-to-date"
            type="date"
            value={toDate}
            onChange={(e) => onToChange(e.target.value)}
            className="bg-transparent text-[11px] font-mono text-text outline-hidden color-scheme-dark"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onExportExcel && (
          <button
            type="button"
            onClick={onExportExcel}
            title="Exportar movimientos a Excel / CSV"
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-text hover:text-accent transition-colors cursor-pointer px-2.5 py-1 rounded-lg bg-bg/70 border border-border/60 hover:border-accent/40 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Exportar Excel</span>
            <Download className="w-3 h-3 text-muted sm:hidden" />
          </button>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-muted hover:text-accent transition-colors cursor-pointer px-2 py-1 rounded-lg bg-bg/60 border border-border/40"
          >
            <X className="w-3 h-3" />
            <span>Limpiar</span>
          </button>
        )}
      </div>
    </div>
  );
};
