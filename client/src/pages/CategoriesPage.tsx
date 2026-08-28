import React, { useState, useEffect } from "react";
import {
  FolderTree,
  Plus,
  Play,
  Trash2,
  Edit2,
  RefreshCw,
  Cpu,
  CheckCircle2,
  Tag,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight
} from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { CategoryItem, CategorizationRuleItem } from "@/lib/api/categories";
import { getAccounts, Account } from "@/lib/api/accounts";
import { CategoryBadge } from "@/components/transactions/CategoryBadge";
import { CategoryModal, ICON_MAP } from "@/components/categories/CategoryModal";
import { RuleModal } from "@/components/categories/RuleModal";

export const CategoriesPage: React.FC = () => {
  const {
    categories,
    rules,
    loading,
    error,
    applyLoading,
    applyResult,
    refresh,
    handleCreateCategory,
    handleUpdateCategory,
    handleReorderCategories,
    handleDeleteCategory,
    handleCreateRule,
    handleUpdateRule,
    handleDeleteRule,
    handleApplyRules,
    clearApplyResult
  } = useCategories();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CategorizationRuleItem | null>(null);
  const [targetCategoryForRule, setTargetCategoryForRule] = useState<string | undefined>(undefined);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    getAccounts()
      .then(setAccounts)
      .catch((err) => console.warn("Failed to load accounts for rules:", err));
  }, []);

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryModalOpen(true);
  };

  const openEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCategoryModalOpen(true);
  };

  const openCreateRule = (categoryId?: string) => {
    setEditingRule(null);
    setTargetCategoryForRule(categoryId);
    setRuleModalOpen(true);
  };

  const openEditRule = (rule: CategorizationRuleItem) => {
    setEditingRule(rule);
    setTargetCategoryForRule(rule.categoryId);
    setRuleModalOpen(true);
  };

  const handleMoveCategory = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === categories.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newCategories = [...categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    const newIds = newCategories.map((c) => c.id);
    await handleReorderCategories(newIds);
  };

  const onConfirmDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`¿Eliminar la categoría "${name}"?`)) {
      try {
        setActionError(null);
        await handleDeleteCategory(id);
      } catch (err: unknown) {
        setActionError(err instanceof Error ? err.message : "Error al eliminar categoría");
      }
    }
  };

  const onConfirmDeleteRule = async (id: string) => {
    try {
      setActionError(null);
      await handleDeleteRule(id);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Error al eliminar regla");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text">Categorías & Reglas</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-accent/10 text-accent border border-accent/20">
              Regex & Flow Engine
            </span>
          </div>
          <p className="text-xs text-muted font-mono mt-0.5">
            Personalizá tus categorías, ordenalas arriba/abajo y automatizá reglas por contenido o cuenta
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => refresh()}
            title="Actualizar datos"
            disabled={loading}
            className="p-2 rounded-lg bg-surface border border-border hover:bg-border/40 text-muted hover:text-text transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => handleApplyRules()}
            disabled={applyLoading || rules.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-accent/40 text-accent hover:bg-accent/10 text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${applyLoading ? "animate-spin" : ""}`} />
            <span>{applyLoading ? "Re-categorizando..." : "Re-categorizar"}</span>
          </button>
          <button
            type="button"
            onClick={() => openCreateRule()}
            disabled={categories.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-border hover:bg-border/40 text-text text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <Cpu className="w-3.5 h-3.5 text-accent" />
            <span>Nueva Regla</span>
          </button>
          <button
            type="button"
            onClick={openCreateCategory}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent text-bg hover:brightness-110 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {applyResult && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-accent/10 border border-accent/30 text-xs font-mono text-text animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
            <span>
              Re-categorización: <strong className="text-accent">{applyResult.applied}</strong> actualizadas de {applyResult.total} transacciones.
            </span>
          </div>
          <button type="button" onClick={clearApplyResult} className="text-muted hover:text-text text-[11px] underline cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {(error || actionError) && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error || actionError}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted">
          <RefreshCw className="w-6 h-6 animate-spin text-accent" />
          <span className="text-xs font-mono">Cargando...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Categories Column */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold font-mono uppercase tracking-wider text-muted flex items-center gap-2">
                <FolderTree className="w-3.5 h-3.5 text-accent" />
                <span>Tus Categorías ({categories.length})</span>
              </h2>
              <span className="text-[11px] text-muted font-mono">Ordená con ▲ / ▼</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {categories.map((cat, index) => {
                const IconComp = ICON_MAP[cat.icon] || Tag;
                const catRulesCount = rules.filter((r) => r.categoryId === cat.id).length;
                const isFirst = index === 0;
                const isLast = index === categories.length - 1;

                return (
                  <div key={cat.id} className="p-3.5 rounded-xl bg-surface border border-border/80 hover:border-border transition-all flex items-center justify-between gap-3 group shadow-xs">
                    {/* Move buttons and info */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(index, "up")}
                          disabled={isFirst}
                          title="Mover arriba"
                          className="p-1 rounded text-muted hover:text-text hover:bg-border/60 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(index, "down")}
                          disabled={isLast}
                          title="Mover abajo"
                          className="p-1 rounded text-muted hover:text-text hover:bg-border/60 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div
                        style={{ color: cat.color, backgroundColor: `${cat.color}20`, borderColor: `${cat.color}40` }}
                        className="w-9 h-9 rounded-lg flex items-center justify-center border shrink-0"
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-text truncate">{cat.name}</p>
                        <p className="text-[11px] text-muted font-mono">{catRulesCount} {catRulesCount === 1 ? "regla" : "reglas"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                      <button type="button" onClick={() => openCreateRule(cat.id)} title="Añadir regla" className="p-1.5 rounded-md text-muted hover:text-accent hover:bg-accent/10 cursor-pointer">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => openEditCategory(cat)} title="Editar" className="p-1.5 rounded-md text-muted hover:text-text hover:bg-border/40 cursor-pointer">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => onConfirmDeleteCategory(cat.id, cat.name)} title="Eliminar" className="p-1.5 rounded-md text-muted hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rules Column */}
          <div className="lg:col-span-7 space-y-3">
            <h2 className="text-xs font-semibold font-mono uppercase tracking-wider text-muted flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-accent" />
              <span>Reglas Automatizadas ({rules.length})</span>
            </h2>

            {rules.length === 0 ? (
              <div className="p-8 rounded-xl bg-surface border border-border/80 text-center space-y-2">
                <Cpu className="w-8 h-8 text-muted mx-auto" />
                <p className="text-sm font-semibold text-text">Sin reglas configuradas</p>
                <p className="text-xs text-muted font-mono">Creá una regla por contenido (regex) o por cuenta y flujo de dinero.</p>
              </div>
            ) : (
              <div className="bg-surface border border-border/80 rounded-xl overflow-hidden shadow-xs divide-y divide-border/60">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-3.5 flex items-start justify-between gap-3 hover:bg-border/20 transition-colors">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CategoryBadge category={rule.categoryName} color={rule.categoryColor} />
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface border border-border text-muted">
                          P: {rule.priority}
                        </span>

                        {rule.accountName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-accent/10 text-accent border border-accent/20">
                            <Landmark className="w-2.5 h-2.5" />
                            <span>{rule.accountName}</span>
                          </span>
                        )}

                        {rule.direction === "in" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <ArrowDownLeft className="w-2.5 h-2.5" />
                            <span>Dinero que Entra (+)</span>
                          </span>
                        )}

                        {rule.direction === "out" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <ArrowUpRight className="w-2.5 h-2.5" />
                            <span>Dinero que Sale (-)</span>
                          </span>
                        )}
                      </div>

                      {rule.pattern ? (
                        <div className="font-mono text-xs text-text bg-bg/60 px-2.5 py-1 rounded border border-border/40 truncate">
                          {rule.pattern}
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-muted italic bg-bg/30 px-2.5 py-1 rounded border border-border/20">
                          Todos los movimientos {rule.direction === "in" ? "entrantes" : rule.direction === "out" ? "salientes" : ""} de {rule.accountName || "la cuenta"}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => openEditRule(rule)}
                        title="Editar regla"
                        className="p-1.5 rounded-md text-muted hover:text-text hover:bg-border/40 cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onConfirmDeleteRule(rule.id)}
                        title="Eliminar regla"
                        className="p-1.5 rounded-md text-muted hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categoryToEdit={editingCategory}
        onSave={async (data) => {
          if (editingCategory) {
            await handleUpdateCategory(editingCategory.id, data);
          } else {
            await handleCreateCategory(data);
          }
        }}
      />

      <RuleModal
        isOpen={ruleModalOpen}
        onClose={() => {
          setRuleModalOpen(false);
          setEditingRule(null);
        }}
        categories={categories}
        accounts={accounts}
        defaultCategoryId={targetCategoryForRule}
        existingRules={rules}
        ruleToEdit={editingRule}
        onSave={async (data) => {
          if (editingRule) {
            await handleUpdateRule(editingRule.id, data);
          } else {
            await handleCreateRule(data);
          }
        }}
      />
    </div>
  );
};

