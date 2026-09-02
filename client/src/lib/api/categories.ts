import { apiFetch } from "./client";

export interface CategoryItem {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  realmSprite?: string | null;
  position?: number;
  createdAt: string;
}

export interface CategorizationRuleItem {
  id: string;
  userId: string;
  categoryId: string;
  accountId?: string | null;
  direction?: "in" | "out" | "all" | null;
  pattern?: string | null;
  priority: number;
  createdAt: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  accountName?: string | null;
  accountIban?: string | null;
}

export interface CategoriesResponse {
  data: CategoryItem[];
}

export interface CategoryResponse {
  data: CategoryItem;
}

export interface RulesResponse {
  data: CategorizationRuleItem[];
}

export interface RuleResponse {
  data: CategorizationRuleItem;
}

export interface ApplyRulesResponse {
  applied: number;
  total: number;
}

export async function getCategories(): Promise<CategoryItem[]> {
  const res = await apiFetch<CategoriesResponse>("/categories");
  return res.data;
}

export async function reorderCategories(categoryIds: string[]): Promise<CategoryItem[]> {
  const res = await apiFetch<CategoriesResponse>("/categories/reorder", {
    method: "PUT",
    body: JSON.stringify({ categoryIds })
  });
  return res.data;
}

export async function createCategory(data: {
  name: string;
  color: string;
  icon: string;
  realmSprite?: string | null;
}): Promise<CategoryItem> {
  const res = await apiFetch<CategoryResponse>("/categories", {
    method: "POST",
    body: JSON.stringify(data)
  });
  return res.data;
}

export async function updateCategory(
  id: string,
  data: {
    name: string;
    color: string;
    icon: string;
    realmSprite?: string | null;
  }
): Promise<CategoryItem> {
  const res = await apiFetch<CategoryResponse>(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
  return res.data;
}

export async function deleteCategory(id: string): Promise<{ success: boolean; id: string }> {
  return apiFetch<{ success: boolean; id: string }>(`/categories/${id}`, {
    method: "DELETE"
  });
}

export async function getCategorizationRules(): Promise<CategorizationRuleItem[]> {
  const res = await apiFetch<RulesResponse>("/categories/rules");
  return res.data;
}

export async function createCategorizationRule(data: {
  categoryId: string;
  pattern?: string | null;
  accountId?: string | null;
  direction?: "in" | "out" | "all" | null;
  priority?: number;
}): Promise<CategorizationRuleItem> {
  const res = await apiFetch<RuleResponse>("/categories/rules", {
    method: "POST",
    body: JSON.stringify(data)
  });
  return res.data;
}

export async function updateCategorizationRule(
  id: string,
  data: {
    categoryId: string;
    pattern?: string | null;
    accountId?: string | null;
    direction?: "in" | "out" | "all" | null;
    priority?: number;
  }
): Promise<CategorizationRuleItem> {
  const res = await apiFetch<RuleResponse>(`/categories/rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
  return res.data;
}

export async function deleteCategorizationRule(id: string): Promise<{ success: boolean; id: string }> {
  return apiFetch<{ success: boolean; id: string }>(`/categories/rules/${id}`, {
    method: "DELETE"
  });
}

export async function applyCategorizationRules(): Promise<ApplyRulesResponse> {
  return apiFetch<ApplyRulesResponse>("/categories/rules/apply", {
    method: "POST"
  });
}

