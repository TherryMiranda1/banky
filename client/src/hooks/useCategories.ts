import { useState, useEffect, useCallback } from "react";
import {
  CategoryItem,
  CategorizationRuleItem,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  getCategorizationRules,
  createCategorizationRule,
  updateCategorizationRule,
  deleteCategorizationRule,
  applyCategorizationRules,
  ApplyRulesResponse
} from "../lib/api/categories";

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [rules, setRules] = useState<CategorizationRuleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [applyLoading, setApplyLoading] = useState<boolean>(false);
  const [applyResult, setApplyResult] = useState<ApplyRulesResponse | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [cats, rls] = await Promise.all([
        getCategories(),
        getCategorizationRules()
      ]);
      setCategories(cats);
      setRules(rls);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error cargando categorías";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCategory = async (data: {
    name: string;
    color: string;
    icon: string;
    realmSprite?: string | null;
  }) => {
    const created = await createCategory(data);
    setCategories((prev) => [...prev, created]);
    return created;
  };

  const handleUpdateCategory = async (
    id: string,
    data: {
      name: string;
      color: string;
      icon: string;
      realmSprite?: string | null;
    }
  ) => {
    const updated = await updateCategory(id, data);
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? updated : c))
    );
    // Also update rules that contain this category
    setRules((prev) =>
      prev.map((r) =>
        r.categoryId === id
          ? {
              ...r,
              categoryName: updated.name,
              categoryColor: updated.color,
              categoryIcon: updated.icon
            }
          : r
      )
    );
    return updated;
  };

  const handleReorderCategories = async (newCategoryIds: string[]) => {
    // Optimistic update
    const idMap = new Map(categories.map((c) => [c.id, c]));
    const reordered: CategoryItem[] = [];
    newCategoryIds.forEach((id, idx) => {
      const cat = idMap.get(id);
      if (cat) {
        reordered.push({ ...cat, position: idx });
      }
    });
    setCategories(reordered);

    try {
      const saved = await reorderCategories(newCategoryIds);
      setCategories(saved);
    } catch (err) {
      console.error("Error saving category order:", err);
      // Revert on error
      await loadData();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setRules((prev) => prev.filter((r) => r.categoryId !== id));
  };

  const handleCreateRule = async (data: {
    categoryId: string;
    pattern?: string | null;
    accountId?: string | null;
    direction?: "in" | "out" | "all" | null;
    priority?: number;
  }) => {
    const created = await createCategorizationRule(data);
    setRules((prev) => [created, ...prev].sort((a, b) => b.priority - a.priority));
    return created;
  };

  const handleUpdateRule = async (
    id: string,
    data: {
      categoryId: string;
      pattern?: string | null;
      accountId?: string | null;
      direction?: "in" | "out" | "all" | null;
      priority?: number;
    }
  ) => {
    const updated = await updateCategorizationRule(id, data);
    setRules((prev) =>
      prev.map((r) => (r.id === id ? updated : r)).sort((a, b) => b.priority - a.priority)
    );
    return updated;
  };

  const handleDeleteRule = async (id: string) => {
    await deleteCategorizationRule(id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleApplyRules = async (): Promise<ApplyRulesResponse> => {
    try {
      setApplyLoading(true);
      const res = await applyCategorizationRules();
      setApplyResult(res);
      return res;
    } finally {
      setApplyLoading(false);
    }
  };

  const clearApplyResult = () => {
    setApplyResult(null);
  };

  return {
    categories,
    rules,
    loading,
    error,
    applyLoading,
    applyResult,
    refresh: loadData,
    handleCreateCategory,
    handleUpdateCategory,
    handleReorderCategories,
    handleDeleteCategory,
    handleCreateRule,
    handleUpdateRule,
    handleDeleteRule,
    handleApplyRules,
    clearApplyResult
  };
}

