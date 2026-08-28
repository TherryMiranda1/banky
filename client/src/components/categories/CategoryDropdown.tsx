import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Tag,
  Check,
  ChevronDown,
  Ban,
  Layers,
  ArrowLeftRight,
  ShoppingBag,
  Home,
  Car,
  Utensils,
  Film,
  Sparkles,
  Zap,
  Briefcase,
  CreditCard,
  HeartPulse,
  Plane,
  Gift,
  Dumbbell,
  GraduationCap,
  HelpCircle,
  LucideIcon
} from "lucide-react";
import { CategoryItem, getCategories } from "@/lib/api/categories";

const FALLBACK_ICON_MAP: Record<string, LucideIcon> = {
  ArrowLeftRight,
  ShoppingBag,
  Home,
  Car,
  Utensils,
  Film,
  Sparkles,
  Zap,
  Briefcase,
  CreditCard,
  HeartPulse,
  Plane,
  Gift,
  Tag,
  Dumbbell,
  GraduationCap,
  HelpCircle
};

export interface CategoryDropdownProps {
  value: string | null;
  onChange: (categoryName: string | null, categoryId: string | null, item?: CategoryItem | null) => void;
  categories?: CategoryItem[];
  placeholder?: string;
  allowAll?: boolean;
  allLabel?: string;
  allowClear?: boolean;
  clearLabel?: string;
  allowUncategorized?: boolean;
  uncategorizedLabel?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
  dropdownAlign?: "left" | "right";
  id?: string;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  value,
  onChange,
  categories: initialCategories,
  placeholder = "Seleccionar categoría",
  allowAll = false,
  allLabel = "Todas",
  allowClear = true,
  clearLabel = "Sin categoría",
  allowUncategorized,
  uncategorizedLabel = "Sin categoría",
  size = "md",
  disabled = false,
  className = "",
  dropdownAlign = "left",
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories || []);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const showUncategorized = allowUncategorized ?? allowAll;

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
      return;
    }

    if (isOpen && categories.length === 0) {
      setLoading(true);
      getCategories()
        .then((data) => setCategories(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, initialCategories, categories.length]);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setHighlightedIndex(0);
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const isUncategorizedValue =
    value === "__uncategorized__" ||
    value === "uncategorized" ||
    value?.toLowerCase() === "sin categoría" ||
    value?.toLowerCase() === "sin categoria";

  const selectedCategory = useMemo(() => {
    if (!value || isUncategorizedValue) return null;
    return (
      categories.find(
        (c) => c.name.toLowerCase() === value.toLowerCase() || c.id === value
      ) || null
    );
  }, [categories, value, isUncategorizedValue]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const query = search.toLowerCase().trim();
    return categories.filter((cat) => cat.name.toLowerCase().includes(query));
  }, [categories, search]);

  const optionList = useMemo(() => {
    const list: Array<{
      type: "all" | "clear" | "uncategorized" | "category";
      name: string | null;
      id: string | null;
      item?: CategoryItem;
    }> = [];

    if (allowAll) {
      list.push({ type: "all", name: null, id: null });
    }

    if (showUncategorized) {
      list.push({ type: "uncategorized", name: "__uncategorized__", id: "__uncategorized__" });
    }

    if (allowClear && !allowAll && !showUncategorized) {
      list.push({ type: "clear", name: null, id: null });
    }

    for (const cat of filteredCategories) {
      list.push({ type: "category", name: cat.name, id: cat.id, item: cat });
    }

    return list;
  }, [allowAll, allowClear, showUncategorized, filteredCategories]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(optionList.length, 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + optionList.length) % Math.max(optionList.length, 1));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const option = optionList[highlightedIndex];
      if (option) {
        if (option.type === "all") {
          onChange("", "", null);
        } else if (option.type === "clear") {
          onChange(null, null, null);
        } else if (option.type === "uncategorized") {
          onChange("__uncategorized__", "__uncategorized__", null);
        } else {
          onChange(option.name, option.id, option.item || null);
        }
        setIsOpen(false);
      }
    }
  };

  const isSmall = size === "sm";

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} id={id}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`flex items-center justify-between gap-1.5 w-full bg-bg/80 hover:bg-bg border border-border/70 hover:border-accent/40 rounded-lg text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isSmall ? "px-2 py-1 text-[11px] font-mono" : "px-2.5 py-1.5 text-xs font-mono"
        } ${isOpen ? "border-accent ring-1 ring-accent/30" : ""}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {selectedCategory ? (
            <>
              <div
                style={{
                  color: selectedCategory.color,
                  backgroundColor: `${selectedCategory.color}20`,
                  borderColor: `${selectedCategory.color}40`
                }}
                className="w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0"
              >
                {(() => {
                  const Icon = FALLBACK_ICON_MAP[selectedCategory.icon] || Tag;
                  return <Icon className="w-2.5 h-2.5" />;
                })()}
              </div>
              <span className="truncate text-text font-medium">{selectedCategory.name}</span>
            </>
          ) : isUncategorizedValue ? (
            <>
              <div className="w-3.5 h-3.5 rounded bg-muted/20 border border-muted/30 flex items-center justify-center text-muted shrink-0">
                <HelpCircle className="w-2.5 h-2.5" />
              </div>
              <span className="truncate text-text font-medium">{uncategorizedLabel}</span>
            </>
          ) : value ? (
            <span className="truncate text-text font-medium">{value}</span>
          ) : allowAll ? (
            <span className="truncate text-muted">{allLabel}</span>
          ) : (
            <span className="truncate text-muted/70">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-3 h-3 text-muted shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-accent" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          onKeyDown={handleKeyDown}
          className={`absolute top-full mt-1.5 z-50 w-64 sm:w-72 bg-surface/98 backdrop-blur-md border border-border/90 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            dropdownAlign === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="p-2 border-b border-border/60">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-bg/80 border border-border/80 text-xs">
              <Search className="w-3.5 h-3.5 text-muted shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar categoría..."
                className="w-full bg-transparent text-text placeholder:text-muted/60 text-xs outline-hidden font-sans"
              />
            </div>
          </div>

          <div ref={listRef} className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {loading && (
              <div className="py-4 text-center text-[11px] font-mono text-muted">
                Cargando categorías...
              </div>
            )}

            {!loading &&
              optionList.map((opt, idx) => {
                const isHighlighted = highlightedIndex === idx;
                const isSelected =
                  opt.type === "all"
                    ? !value
                    : opt.type === "clear"
                    ? !value
                    : opt.type === "uncategorized"
                    ? isUncategorizedValue
                    : value?.toLowerCase() === opt.name?.toLowerCase() || value === opt.id;

                if (opt.type === "all") {
                  return (
                    <button
                      key="__all__"
                      type="button"
                      onClick={() => {
                        onChange("", "", null);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        isHighlighted ? "bg-border/60 text-text" : "text-muted hover:bg-border/30 hover:text-text"
                      } ${isSelected ? "bg-accent/10 text-accent font-semibold" : ""}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded flex items-center justify-center bg-border/40 text-muted shrink-0">
                          <Layers className="w-3 h-3" />
                        </div>
                        <span className="truncate">{allLabel}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
                    </button>
                  );
                }

                if (opt.type === "uncategorized") {
                  return (
                    <button
                      key="__uncategorized__"
                      type="button"
                      onClick={() => {
                        onChange("__uncategorized__", "__uncategorized__", null);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        isHighlighted ? "bg-border/60 text-text" : "text-muted hover:bg-border/30 hover:text-text"
                      } ${isSelected ? "bg-accent/10 text-accent font-semibold" : ""}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded flex items-center justify-center bg-muted/20 border border-muted/30 text-muted shrink-0">
                          <HelpCircle className="w-3 h-3" />
                        </div>
                        <span className="truncate">{uncategorizedLabel}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
                    </button>
                  );
                }

                if (opt.type === "clear") {
                  return (
                    <button
                      key="__clear__"
                      type="button"
                      onClick={() => {
                        onChange(null, null, null);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        isHighlighted ? "bg-border/60 text-text" : "text-muted hover:bg-border/30 hover:text-text"
                      } ${isSelected ? "bg-accent/10 text-accent font-semibold" : ""}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded flex items-center justify-center bg-border/40 text-muted shrink-0">
                          <Ban className="w-3 h-3" />
                        </div>
                        <span className="truncate">{clearLabel}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
                    </button>
                  );
                }

                const cat = opt.item!;
                const IconComp = FALLBACK_ICON_MAP[cat.icon] || Tag;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onChange(cat.name, cat.id, cat);
                      setIsOpen(false);
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

            {!loading && optionList.length === 0 && (
              <div className="py-4 text-center text-[11px] font-mono text-muted">
                No se encontraron categorías
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
