import React, { useState, useEffect } from "react";
import { getCategories, CategoryItem } from "@/lib/api/categories";
import { createManualTransaction, Transaction } from "@/lib/api/transactions";
import { Account } from "@/lib/api/accounts";
import { CategoryDropdown } from "@/components/categories/CategoryDropdown";
import { X, Plus, Minus, Check, Calendar, Tag, AlertCircle, Loader2, DollarSign } from "lucide-react";

interface CashTransactionModalProps {
  cashAccount: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTx: Transaction) => void;
}

export const CashTransactionModal: React.FC<CashTransactionModalProps> = ({
  cashAccount,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [bookedAt, setBookedAt] = useState<string>(() => new Date().toISOString().split("T")[0]!);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setDescription("");
      setSelectedCategory("");
      setBookedAt(new Date().toISOString().split("T")[0]!);
      setError(null);

      setIsLoadingCats(true);
      getCategories()
        .then((cats) => setCategories(cats))
        .catch(() => {})
        .finally(() => setIsLoadingCats(false));
    }
  }, [isOpen]);

  if (!isOpen || !cashAccount) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(",", "."));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Por favor introduce un importe válido mayor a cero.");
      return;
    }

    if (!description.trim()) {
      setError("Por favor introduce una descripción o concepto.");
      return;
    }

    const finalAmountStr = type === "expense" ? `-${parsedAmount.toFixed(2)}` : parsedAmount.toFixed(2);

    try {
      setIsSubmitting(true);
      setError(null);

      const created = await createManualTransaction({
        accountId: cashAccount.id,
        amount: finalAmountStr,
        currency: cashAccount.currency || "EUR",
        description: description.trim(),
        category: selectedCategory.trim() ? selectedCategory : null,
        bookedAt: `${bookedAt}T12:00:00Z`
      });

      onSuccess(created);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrar el movimiento";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-text">Movimiento en Efectivo</h3>
              <p className="text-xs text-muted font-mono">{cashAccount.nickname || "Cuenta de Efectivo"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-border/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-negative/10 border border-negative/20 text-negative text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle: Gasto vs Ingreso */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-bg border border-border">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                type === "expense"
                  ? "bg-negative/15 text-negative border border-negative/30 shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              <Minus className="w-3.5 h-3.5" />
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                type === "income"
                  ? "bg-accent/15 text-accent border border-accent/30 shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Ingreso
            </button>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text uppercase tracking-wider font-mono">
              Importe (€)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-bg border border-border text-text placeholder:text-muted/60 text-xl font-bold font-mono focus:outline-none focus:border-accent transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono text-muted">
                {cashAccount.currency || "EUR"}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text uppercase tracking-wider font-mono">
              Concepto / Descripción
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Compra supermercado, Cena, Propina..."
              maxLength={150}
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-border text-text placeholder:text-muted/60 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Category selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-accent" />
              Categoría
            </label>
            {isLoadingCats ? (
              <div className="h-10 rounded-xl bg-bg animate-pulse border border-border" />
            ) : (
              <CategoryDropdown
                value={selectedCategory || null}
                onChange={(catName) => setSelectedCategory(catName || "")}
                categories={categories}
                placeholder="Sin categoría"
                allowClear={true}
                clearLabel="Sin categoría"
                className="w-full"
              />
            )}
          </div>

          {/* Date picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              Fecha
            </label>
            <input
              type="date"
              required
              value={bookedAt}
              onChange={(e) => setBookedAt(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-border text-text text-sm focus:outline-none focus:border-accent transition-colors font-mono"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-text hover:bg-border/50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-accent text-bg font-semibold text-xs uppercase tracking-wider hover:bg-accent/90 transition-all shadow-[0_0_15px_rgba(0,229,160,0.25)] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Guardar Movimiento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
