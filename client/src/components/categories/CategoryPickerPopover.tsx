import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Tag, Check, Ban, X } from "lucide-react";
import { CategoryItem, getCategories } from "@/lib/api/categories";
import { ICON_MAP } from "./CategoryModal";

interface CategoryPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (categoryId: string | null, categoryName: string | null) => void;
  currentCategoryName: string | null;
  categoriesList?: CategoryItem[];
  align?: "left" | "right";
}

export const CategoryPickerPopover: React.FC<CategoryPickerPopoverProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentCategoryName,
  categoriesList: initialCategories,
  align = "left"
}) => {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories || []);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
      return;
    }

    if (isOpen) {
      setLoading(true);
      getCategories()
        .then((data) => setCategories(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, initialCategories]);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Click outside listener (for desktop popover)
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const query = search.toLowerCase().trim();
    return categories.filter((cat) => cat.name.toLowerCase().includes(query));
  }, [categories, search]);

  const totalItems = 1 + filteredCategories.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % totalItems);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex === 0) {
        onSelect(null, null);
      } else {
        const selected = filteredCategories[highlightedIndex - 1];
        if (selected) {
          onSelect(selected.id, selected.name);
        }
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Modal Backdrop (<sm) */}
      <div
        className="sm:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end justify-center p-0 animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="w-full max-h-[80vh] bg-surface border-t border-border rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {/* Mobile Sheet Header */}
          <div className="p-4 pb-2 border-b border-border/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-text">Seleccionar Categoría</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-muted hover:text-text cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-border/60">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg border border-border text-xs">
              <Search className="w-4 h-4 text-muted shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Buscar categoría..."
                className="w-full bg-transparent text-text placeholder:text-muted focus:outline-hidden text-xs font-sans"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="text-muted p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Categories List (Touch Friendly) */}
          <div className="overflow-y-auto p-2 space-y-1 max-h-[60vh] pb-8">
            <button
              type="button"
              onClick={() => {
                onSelect(null, null);
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                !currentCategoryName ? "bg-accent/15 text-accent font-semibold" : "text-muted hover:bg-border/30 hover:text-text"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-border/40 text-muted">
                  <Ban className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">Sin categoría</span>
              </div>
              {!currentCategoryName && <Check className="w-4 h-4 text-accent shrink-0" />}
            </button>

            {loading && (
              <div className="py-6 text-center text-xs font-mono text-muted">
                Cargando categorías...
              </div>
            )}

            {!loading && filteredCategories.length === 0 && (
              <div className="py-6 text-center text-xs font-mono text-muted">
                No se encontraron categorías
              </div>
            )}

            {!loading &&
              filteredCategories.map((cat) => {
                const isSelected = currentCategoryName?.toLowerCase() === cat.name.toLowerCase();
                const IconComp = ICON_MAP[cat.icon] || Tag;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelect(cat.id, cat.name);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      isSelected ? "bg-accent/15 text-accent font-semibold" : "text-text/90 hover:bg-border/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        style={{
                          color: cat.color,
                          backgroundColor: `${cat.color}20`,
                          borderColor: `${cat.color}40`
                        }}
                        className="w-6 h-6 rounded-md flex items-center justify-center border shrink-0"
                      >
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-accent shrink-0" />}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Desktop Popover (>= sm) */}
      <div
        ref={popoverRef}
        onKeyDown={handleKeyDown}
        className={`hidden sm:block absolute top-full mt-1.5 z-50 w-64 sm:w-72 bg-surface/98 backdrop-blur-md border border-border/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
          align === "right" ? "right-0" : "left-0"
        }`}
      >
        <div className="p-2 border-b border-border/60">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-bg/80 border border-border/80 text-xs">
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder="Buscar categoría..."
              className="w-full bg-transparent text-text placeholder:text-muted/60 focus:outline-hidden text-xs font-sans"
            />
          </div>
        </div>

        <div ref={listRef} className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 no-scrollbar">
          {/* Unassigned / Sin categoría option */}
          <button
            type="button"
            onClick={() => {
              onSelect(null, null);
              onClose();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              highlightedIndex === 0 ? "bg-border/60 text-text" : "text-muted hover:bg-border/30 hover:text-text"
            } ${!currentCategoryName ? "bg-accent/10 text-accent font-semibold" : ""}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-border/40 text-muted">
                <Ban className="w-3 h-3" />
              </div>
              <span className="truncate">Sin categoría</span>
            </div>
            {!currentCategoryName && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
          </button>

          {loading && (
            <div className="py-4 text-center text-[11px] font-mono text-muted">
              Cargando categorías...
            </div>
          )}

          {!loading && filteredCategories.length === 0 && (
            <div className="py-4 text-center text-[11px] font-mono text-muted">
              No se encontraron categorías
            </div>
          )}

          {!loading &&
            filteredCategories.map((cat, idx) => {
              const itemIndex = idx + 1;
              const isSelected = currentCategoryName?.toLowerCase() === cat.name.toLowerCase();
              const isHighlighted = highlightedIndex === itemIndex;
              const IconComp = ICON_MAP[cat.icon] || Tag;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onSelect(cat.id, cat.name);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    isHighlighted ? "bg-border/60 text-text" : "text-text/90 hover:bg-border/30"
                  } ${isSelected ? "bg-accent/10 text-accent font-semibold" : ""}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      style={{
                        color: cat.color,
                        backgroundColor: `${cat.color}20`,
                        borderColor: `${cat.color}40`
                      }}
                      className="w-5 h-5 rounded flex items-center justify-center border shrink-0"
                    >
                      <IconComp className="w-3 h-3" />
                    </div>
                    <span className="truncate">{cat.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
                </button>
              );
            })}
        </div>
      </div>
    </>
  );
};
