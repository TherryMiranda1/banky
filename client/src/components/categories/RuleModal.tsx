import React, { useState, useEffect, useMemo } from "react";
import { X, Cpu, CheckCircle2, AlertCircle, Landmark, Layers, FileText } from "lucide-react";
import { CategoryItem, CategorizationRuleItem } from "@/lib/api/categories";
import { Account } from "@/lib/api/accounts";
import { CategoryDropdown } from "./CategoryDropdown";

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  accounts?: Account[];
  defaultCategoryId?: string;
  existingRules?: CategorizationRuleItem[];
  ruleToEdit?: CategorizationRuleItem | null;
  onSave: (data: {
    categoryId: string;
    pattern?: string | null;
    accountId?: string | null;
    direction?: "in" | "out" | "all" | null;
    priority?: number;
  }) => Promise<void>;
}

type RuleMode = "pattern_only" | "account_flow_only" | "combined";

export const RuleModal: React.FC<RuleModalProps> = ({
  isOpen,
  onClose,
  categories,
  accounts = [],
  defaultCategoryId,
  existingRules = [],
  ruleToEdit = null,
  onSave
}) => {
  const [categoryId, setCategoryId] = useState<string>("");
  const [mode, setMode] = useState<RuleMode>("pattern_only");
  const [pattern, setPattern] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [direction, setDirection] = useState<"in" | "out" | "all">("all");
  const [priority, setPriority] = useState<number>(10);

  // Simulator state
  const [testString, setTestString] = useState("");
  const [testAmount, setTestAmount] = useState<string>("-25.00");
  const [testAccountId, setTestAccountId] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(ruleToEdit);

  useEffect(() => {
    if (ruleToEdit) {
      setCategoryId(ruleToEdit.categoryId);
      // Convert stored pipes or formatted regex to multiline if helpful
      setPattern(ruleToEdit.pattern || "");
      setAccountId(ruleToEdit.accountId || "");
      setDirection(ruleToEdit.direction || "all");
      setPriority(ruleToEdit.priority);

      const hasPat = Boolean(ruleToEdit.pattern && ruleToEdit.pattern.trim());
      const hasAccOrDir = Boolean(ruleToEdit.accountId || (ruleToEdit.direction && ruleToEdit.direction !== "all"));

      if (hasPat && hasAccOrDir) {
        setMode("combined");
      } else if (hasAccOrDir) {
        setMode("account_flow_only");
      } else {
        setMode("pattern_only");
      }
    } else {
      if (categories.length > 0) {
        setCategoryId(defaultCategoryId || categories[0].id);
      }
      setPattern("");
      setAccountId("");
      setDirection("all");
      setPriority(10);
      setMode("pattern_only");
    }

    setTestString("");
    setTestAmount("-25.00");
    setTestAccountId(accounts.length > 0 ? accounts[0].id : "");
    setError(null);
  }, [isOpen, defaultCategoryId, categories, accounts, ruleToEdit]);

  // Normalize multiline input into combined regex pattern
  const { normalizedPattern, patternLines, isRegexValid, regexObj } = useMemo(() => {
    const raw = pattern.trim();
    if (!raw) {
      return { normalizedPattern: "", patternLines: [], isRegexValid: true, regexObj: null };
    }

    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let normalized = raw;
    if (lines.length > 1) {
      normalized = lines.map((l) => `(?:${l})`).join("|");
    }

    let valid = true;
    let compiled: RegExp | null = null;
    try {
      compiled = new RegExp(normalized, "i");
    } catch {
      valid = false;
    }

    return {
      normalizedPattern: normalized,
      patternLines: lines,
      isRegexValid: valid,
      regexObj: compiled
    };
  }, [pattern]);

  if (!isOpen) return null;

  const cleanAccountId = accountId.trim() || null;
  const cleanDirection = direction !== "all" ? direction : null;

  // Check duplicate
  const isDuplicate = existingRules.some((r) => {
    if (r.id === ruleToEdit?.id) return false;
    const sameCategory = r.categoryId === categoryId;
    const sameAccount = (r.accountId || null) === (mode === "pattern_only" ? null : cleanAccountId);
    const sameDirection = (r.direction || null) === (mode === "pattern_only" ? null : cleanDirection);
    const samePattern =
      (r.pattern ? r.pattern.trim().toLowerCase() : "") ===
      (mode === "account_flow_only" ? "" : normalizedPattern.toLowerCase());
    return sameCategory && sameAccount && sameDirection && samePattern;
  });

  // Simulator evaluation
  let testMatch = false;
  const simDesc = testString.trim();
  const simAmt = parseFloat(testAmount);
  const simAcc = testAccountId || null;

  let criteriaCount = 0;
  let criteriaPassed = 0;

  if (mode !== "pattern_only") {
    if (cleanAccountId) {
      criteriaCount++;
      if (simAcc === cleanAccountId) criteriaPassed++;
    }
    if (cleanDirection) {
      criteriaCount++;
      if (!isNaN(simAmt)) {
        if (cleanDirection === "in" && simAmt > 0) criteriaPassed++;
        if (cleanDirection === "out" && simAmt < 0) criteriaPassed++;
      }
    }
  }

  if (mode !== "account_flow_only") {
    if (regexObj) {
      criteriaCount++;
      if (simDesc && regexObj.test(simDesc)) criteriaPassed++;
    }
  }

  if (criteriaCount > 0 && criteriaPassed === criteriaCount) {
    testMatch = true;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setError("Seleccioná una categoría.");
      return;
    }

    if (mode === "pattern_only" && !normalizedPattern) {
      setError("El patrón regex o lista de palabras clave es requerido.");
      return;
    }

    if (mode === "account_flow_only" && !cleanAccountId && cleanDirection === null) {
      setError("Seleccioná al menos una cuenta o un flujo de dinero (Entradas / Salidas).");
      return;
    }

    if (mode === "combined" && !normalizedPattern) {
      setError("El patrón de contenido es requerido en el modo combinado.");
      return;
    }

    if (mode === "combined" && !cleanAccountId && cleanDirection === null) {
      setError("En modo combinado debes especificar cuenta o flujo de dinero.");
      return;
    }

    if (!isRegexValid) {
      setError("La sintaxis de expresión regular ingresada no es válida.");
      return;
    }

    if (isDuplicate) {
      setError("Ya existe otra regla configurada con estos mismos criterios.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSave({
        categoryId,
        pattern: mode === "account_flow_only" ? null : normalizedPattern,
        accountId: mode === "pattern_only" ? null : cleanAccountId,
        direction: mode === "pattern_only" ? null : cleanDirection,
        priority: Number(priority) || 0
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar la regla");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/15 text-accent border border-accent/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text">
                {isEditing ? "Editar Regla de Categorización" : "Nueva Regla de Categorización"}
              </h3>
              <p className="text-xs text-muted font-mono">
                Editor multilínea de patrones y condiciones de cuenta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-text p-1 rounded-lg hover:bg-border/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Destination */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5">
              Categoría Destino
            </label>
            <CategoryDropdown
              value={categoryId || null}
              onChange={(_, id) => setCategoryId(id || "")}
              categories={categories}
              placeholder="Seleccioná una categoría"
              allowClear={false}
              className="w-full"
            />
          </div>

          {/* Mode Selector Tabs */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5">
              Tipo de Condición
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-bg rounded-xl border border-border text-xs font-medium">
              <button
                type="button"
                onClick={() => setMode("pattern_only")}
                className={`py-2 px-2 rounded-lg flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                  mode === "pattern_only"
                    ? "bg-accent/15 text-accent font-semibold border border-accent/30 shadow-xs"
                    : "text-muted hover:text-text"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="text-[11px] leading-tight">Solo Contenido</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("account_flow_only")}
                className={`py-2 px-2 rounded-lg flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                  mode === "account_flow_only"
                    ? "bg-accent/15 text-accent font-semibold border border-accent/30 shadow-xs"
                    : "text-muted hover:text-text"
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span className="text-[11px] leading-tight">Cuenta / Flujo</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("combined")}
                className={`py-2 px-2 rounded-lg flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                  mode === "combined"
                    ? "bg-accent/15 text-accent font-semibold border border-accent/30 shadow-xs"
                    : "text-muted hover:text-text"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="text-[11px] leading-tight">Combinado</span>
              </button>
            </div>
          </div>

          {/* Account and Direction section (if mode != pattern_only) */}
          {mode !== "pattern_only" && (
            <div className="p-3.5 rounded-xl bg-bg/50 border border-border/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-text">
                <Landmark className="w-3.5 h-3.5 text-accent" />
                <span>Condición de Cuenta y Flujo</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Account Selection */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-muted mb-1">
                    Cuenta Bancaria
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border text-xs text-text focus:outline-hidden focus:border-accent font-sans"
                  >
                    <option value="">Todas las cuentas</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.nickname || acc.alias || acc.bankName} {acc.iban ? `(••${acc.iban.slice(-4)})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Flow Direction */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-muted mb-1">
                    Flujo de Dinero
                  </label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as "in" | "out" | "all")}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border text-xs text-text focus:outline-hidden focus:border-accent font-sans"
                  >
                    <option value="all">Cualquier movimiento</option>
                    <option value="in">🟢 Solo Dinero que Entra (Ingresos)</option>
                    <option value="out">🔴 Solo Dinero que Sale (Gastos)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Multiline Pattern section (if mode != account_flow_only) */}
          {mode !== "account_flow_only" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-muted">
                  Editor Multilínea de Regex / Palabras Clave
                </label>
                {patternLines.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                    {patternLines.length} {patternLines.length === 1 ? "línea" : "líneas / patrones"}
                  </span>
                )}
              </div>

              <textarea
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Escribí una palabra, regex o comercio por línea:&#10;mercadona&#10;carrefour&#10;lidl&#10;uber.*eats"
                rows={4}
                className={`w-full px-3 py-2 rounded-lg bg-bg border text-xs text-text placeholder:text-muted/50 focus:outline-hidden font-mono custom-scrollbar resize-y ${
                  !isRegexValid ? "border-rose-500 focus:border-rose-500" : "border-border focus:border-accent"
                }`}
                required={mode === "pattern_only" || mode === "combined"}
              />

              <div className="flex items-center justify-between text-[11px] font-mono mt-1">
                {!isRegexValid ? (
                  <p className="text-rose-400">Sintaxis de expresión regular inválida.</p>
                ) : (
                  <p className="text-muted">
                    Podés escribir una palabra por línea o usar <code className="text-accent bg-accent/10 px-1 py-0.5 rounded">|</code>.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5">
              Prioridad (Mayor número = Mayor precedencia)
            </label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              min={0}
              max={100}
              className="w-full px-3 py-2 rounded-lg bg-bg border border-border text-sm text-text font-mono focus:outline-hidden focus:border-accent"
            />
          </div>

          {/* Live Simulator */}
          <div className="p-3.5 rounded-xl bg-bg/80 border border-border space-y-2.5">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">
              Simulador de Coincidencia en Tiempo Real
            </span>

            <div className="space-y-2">
              {mode !== "account_flow_only" && (
                <input
                  type="text"
                  value={testString}
                  onChange={(e) => setTestString(e.target.value)}
                  placeholder="Descripción de prueba: ej. COMPRA MERCADONA MADRID"
                  className="w-full px-2.5 py-1.5 rounded-md bg-surface border border-border text-xs text-text placeholder:text-muted/50 font-mono focus:outline-hidden focus:border-accent"
                />
              )}

              {mode !== "pattern_only" && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    placeholder="Monto: -25.00 o 1500"
                    className="w-full px-2.5 py-1.5 rounded-md bg-surface border border-border text-xs text-text placeholder:text-muted/50 font-mono focus:outline-hidden focus:border-accent"
                  />
                  {accounts.length > 0 && (
                    <select
                      value={testAccountId}
                      onChange={(e) => setTestAccountId(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-md bg-surface border border-border text-xs text-text font-sans focus:outline-hidden focus:border-accent"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.nickname || acc.alias || acc.bankName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            <div className="pt-1">
              {testMatch ? (
                <div className="flex items-center gap-1.5 text-xs text-accent font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Coincide con {selectedCategory?.name || "Categoría"}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Sin coincidencia con los datos ingresados</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-muted hover:text-text rounded-lg border border-border hover:bg-border/30 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !isRegexValid}
              className="px-4 py-2 text-xs font-semibold bg-accent text-bg hover:brightness-110 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Regla"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
