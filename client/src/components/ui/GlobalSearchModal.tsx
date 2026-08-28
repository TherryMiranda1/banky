import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  Wallet,
  PieChart,
  Tags,
  PlusCircle,
  Landmark,
  X,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { getAccounts, Account } from "@/lib/api/accounts";
import { maskIban } from "@/lib/bank-utils";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Páginas" | "Cuentas" | "Acciones";
  icon: React.ReactNode;
  action: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      getAccounts()
        .then(setAccounts)
        .catch(() => setAccounts([]));
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const items: SearchItem[] = [
    // Pages
    {
      id: "page-dashboard",
      title: "Dashboard",
      subtitle: "Vista general y saldo consolidado",
      category: "Páginas",
      icon: <LayoutDashboard className="w-4 h-4 text-accent" />,
      action: () => {
        navigate("/");
        onClose();
      }
    },
    {
      id: "page-accounts",
      title: "Cuentas y Movimientos",
      subtitle: "Historial de transacciones y filtros",
      category: "Páginas",
      icon: <Wallet className="w-4 h-4 text-accent" />,
      action: () => {
        navigate("/accounts");
        onClose();
      }
    },
    {
      id: "page-budgets",
      title: "Presupuestos & Analíticas",
      subtitle: "Límites por categoría y distribución",
      category: "Páginas",
      icon: <PieChart className="w-4 h-4 text-accent" />,
      action: () => {
        navigate("/budgets");
        onClose();
      }
    },
    {
      id: "page-categories",
      title: "Categorías & Reglas",
      subtitle: "Motor de reglas automáticas",
      category: "Páginas",
      icon: <Tags className="w-4 h-4 text-accent" />,
      action: () => {
        navigate("/categories");
        onClose();
      }
    },
    {
      id: "page-connect",
      title: "Conectar Banco",
      subtitle: "Añadir Santander, Revolut u Open Banking",
      category: "Páginas",
      icon: <PlusCircle className="w-4 h-4 text-accent" />,
      action: () => {
        navigate("/connect");
        onClose();
      }
    },

    // Accounts
    ...accounts.map((acc) => ({
      id: `acc-${acc.id}`,
      title: acc.nickname || acc.bankName,
      subtitle: `${maskIban(acc.iban)} · Saldo: ${acc.lastBalance?.amount ?? "0.00"} ${acc.currency}`,
      category: "Cuentas" as const,
      icon: <Landmark className="w-4 h-4 text-slate-400" />,
      action: () => {
        navigate(`/accounts/${encodeURIComponent(acc.id)}`);
        onClose();
      }
    })),

    // Quick Actions
    {
      id: "action-connect",
      title: "Vincular nueva cuenta bancaria",
      subtitle: "Open Banking SCA",
      category: "Acciones",
      icon: <Sparkles className="w-4 h-4 text-accent" />,
      action: () => {
        navigate("/connect");
        onClose();
      }
    }
  ];

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase()))
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].action();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface-elevated">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Buscar páginas, cuentas, acciones... (o presiona Esc)"
            className="flex-1 bg-transparent text-sm text-text placeholder:text-muted outline-hidden font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted hover:text-text cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface border border-border text-muted">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-border/20">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-muted font-mono text-xs">
              No se encontraron resultados para "{query}"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-surface-elevated text-text"
                      : "text-muted hover:text-text"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-surface border border-border flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-muted px-1.5 py-0.2 rounded bg-surface border border-border">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] font-mono text-muted truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-3.5 h-3.5 shrink-0 transition-opacity ${
                      isSelected ? "opacity-100 text-accent" : "opacity-0"
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 bg-surface-elevated/50 border-t border-border flex items-center justify-between text-[11px] font-mono text-muted">
          <span>Usa ↑ ↓ para navegar</span>
          <span>Presiona Enter para saltar</span>
        </div>
      </div>
    </div>
  );
};
