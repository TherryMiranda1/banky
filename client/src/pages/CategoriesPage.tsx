import React, { useState, useEffect } from "react";
import {
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
  ArrowUpRight,
  FolderTree
} from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { CategoryItem, CategorizationRuleItem } from "@/lib/api/categories";
import { getAccounts, Account } from "@/lib/api/accounts";
import { CategoryBadge } from "@/components/transactions/CategoryBadge";
import { CategoryModal, ICON_MAP } from "@/components/categories/CategoryModal";
import { RuleModal } from "@/components/categories/RuleModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

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

  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: "category" | "rule";
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleExecuteDelete = async () => {
    if (!deleteConfirmState) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      if (deleteConfirmState.type === "category") {
        await handleDeleteCategory(deleteConfirmState.id);
      } else {
        await handleDeleteRule(deleteConfirmState.id);
      }
      setDeleteConfirmState(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* GitHub Document Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text">
              Categorías & Reglas
            </h1>
            <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-surface-elevated text-muted border border-border">
              Motor de Automatización
            </span>
          </div>
          <p className="text-xs text-muted font-mono mt-0.5">
            Configuración de taxonomía y reglas automáticas de clasificación
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => refresh()}
            title="Actualizar datos"
            disabled={loading}
            className="p-1.5 rounded-md bg-surface border border-border text-muted hover:text-text transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-accent" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => handleApplyRules()}
            disabled={applyLoading || rules.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface hover:bg-surface-elevated border border-border text-xs font-medium text-text transition-colors cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3 h-3 text-accent ${applyLoading ? "animate-spin" : ""}`} />
            <span>{applyLoading ? "Aplicando..." : "Re-categorizar"}</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateRule()}
            disabled={categories.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface hover:bg-surface-elevated border border-border text-xs font-medium text-text transition-colors cursor-pointer disabled:opacity-50"
          >
            <Cpu className="w-3.5 h-3.5 text-muted" />
            <span>Nueva regla</span>
          </button>

          <button
            type="button"
            onClick={openCreateCategory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-bg hover:bg-accent/90 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nueva categoría</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {applyResult && (
        <div className="flex items-center justify-between p-2.5 rounded-md bg-accent/10 border border-accent/20 text-xs font-mono text-text">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
            <span>
              Re-categorización: <strong className="text-accent">{applyResult.applied}</strong> de {applyResult.total} movimientos actualizados.
            </span>
          </div>
          <button type="button" onClick={clearApplyResult} className="text-muted hover:text-text text-[11px] underline cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {(error || actionError) && (
        <div className="flex items-center gap-2 p-2.5 rounded-md bg-expense/10 border border-expense/30 text-expense text-xs font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error || actionError}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted">
          <RefreshCw className="w-5 h-5 animate-spin text-accent" />
          <span className="text-xs font-mono">Cargando categorías...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Categories Box Table (5 cols on lg) */}
          <div className="lg:col-span-5 rounded-md border border-border bg-surface/30 overflow-hidden">
            <div className="px-4 py-2.5 bg-surface-elevated border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderTree className="w-3.5 h-3.5 text-muted" />
                <span className="text-xs font-semibold text-text">
                  Categorías ({categories.length})
                </span>
              </div>
              <span className="text-[11px] font-mono text-muted">Orden editable</span>
            </div>

            <div className="divide-y divide-border/40">
              {categories.map((cat, index) => {
                const IconComp = ICON_MAP[cat.icon] || Tag;
                const catRulesCount = rules.filter((r) => r.categoryId === cat.id).length;
                const isFirst = index === 0;
                const isLast = index === categories.length - 1;

                return (
                  <div
                    key={cat.id}
                    className="p-2.5 px-3.5 hover:bg-surface-elevated/70 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Reorder Buttons (Always visible) */}
                      <div className="flex flex-col shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(index, "up")}
                          disabled={isFirst}
                          title="Mover arriba"
                          className="p-0.5 text-muted hover:text-text disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(index, "down")}
                          disabled={isLast}
                          title="Mover abajo"
                          className="p-0.5 text-muted hover:text-text disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Icon */}
                      <div
                        style={{ color: cat.color, backgroundColor: `${cat.color}15`, borderColor: `${cat.color}35` }}
                        className="w-7 h-7 rounded-md flex items-center justify-center border shrink-0"
                      >
                        <IconComp className="w-3.5 h-3.5" />
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <p className="font-medium text-xs text-text truncate">{cat.name}</p>
                        <p className="text-[10px] text-muted font-mono">{catRulesCount} {catRulesCount === 1 ? "regla" : "reglas"}</p>
                      </div>
                    </div>

                    {/* Actions (Always accessible on touch & desktop) */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openCreateRule(cat.id)}
                        title="Añadir regla para esta categoría"
                        className="p-1 rounded text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditCategory(cat)}
                        title="Editar categoría"
                        className="p-1 rounded text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirmState({
                            isOpen: true,
                            type: "category",
                            id: cat.id,
                            name: cat.name
                          })
                        }
                        title="Eliminar categoría"
                        className="p-1 rounded text-muted hover:text-expense hover:bg-expense/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rules Box Table (7 cols on lg) */}
          <div className="lg:col-span-7 rounded-md border border-border bg-surface/30 overflow-hidden">
            <div className="px-4 py-2.5 bg-surface-elevated border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-muted" />
                <span className="text-xs font-semibold text-text">
                  Reglas Automatizadas ({rules.length})
                </span>
              </div>
              <span className="text-[11px] font-mono text-muted">Prioridad ascendente</span>
            </div>

            {rules.length === 0 ? (
              <div className="p-8 text-center space-y-1 text-muted">
                <Cpu className="w-6 h-6 mx-auto mb-1 opacity-50" />
                <p className="text-xs font-medium text-text">Sin reglas configuradas</p>
                <p className="text-[11px] font-mono">Creá reglas por concepto regex o por cuenta bancaria.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-3 px-4 flex items-start justify-between gap-3 hover:bg-surface-elevated/70 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CategoryBadge category={rule.categoryName} color={rule.categoryColor} />

                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-surface-elevated border border-border text-muted">
                          P:{rule.priority}
                        </span>

                        {rule.accountName && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-surface-elevated border border-border text-muted">
                            <Landmark className="w-2.5 h-2.5" />
                            <span>{rule.accountName}</span>
                          </span>
                        )}

                        {rule.direction === "in" && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-income/10 text-income border border-income/20">
                            <ArrowDownLeft className="w-2.5 h-2.5" />
                            <span>Entradas (+)</span>
                          </span>
                        )}

                        {rule.direction === "out" && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-expense/10 text-expense border border-expense/20">
                            <ArrowUpRight className="w-2.5 h-2.5" />
                            <span>Salidas (-)</span>
                          </span>
                        )}
                      </div>

                      {rule.pattern ? (
                        <div className="font-mono text-xs text-text bg-surface-elevated px-2 py-0.5 rounded border border-border truncate">
                          {rule.pattern}
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-muted italic">
                          Todos los movimientos {rule.direction === "in" ? "entrantes" : rule.direction === "out" ? "salientes" : ""} de {rule.accountName || "la cuenta"}
                        </div>
                      )}
                    </div>

                    {/* Actions (Always accessible on touch & desktop) */}
                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => openEditRule(rule)}
                        title="Editar regla"
                        className="p-1 rounded text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirmState({
                            isOpen: true,
                            type: "rule",
                            id: rule.id,
                            name: rule.pattern || rule.categoryName
                          })
                        }
                        title="Eliminar regla"
                        className="p-1 rounded text-muted hover:text-expense hover:bg-expense/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
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

      {/* Destructive Action Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmState?.isOpen)}
        title={
          deleteConfirmState?.type === "category"
            ? `¿Eliminar categoría "${deleteConfirmState?.name}"?`
            : `¿Eliminar regla de automatización?`
        }
        description={
          deleteConfirmState?.type === "category"
            ? "Esta acción eliminará la categoría. Los movimientos asociados pasarán a estado sin categoría."
            : `Se eliminará la regla "${deleteConfirmState?.name}". Las transacciones ya categorizadas conservarán su categoría actual.`
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleExecuteDelete}
        onCancel={() => setDeleteConfirmState(null)}
      />
    </div>
  );
};
