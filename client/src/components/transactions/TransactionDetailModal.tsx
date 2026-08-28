import React, { useState } from "react";
import { Transaction } from "@/lib/api/transactions";
import { CategoryItem } from "@/lib/api/categories";
import { CategoryBadge } from "./CategoryBadge";
import { CategoryPickerPopover } from "@/components/categories/CategoryPickerPopover";
import { BankLogo } from "@/components/accounts/BankLogo";
import {
  X,
  Copy,
  Check,
  Calendar,
  CreditCard,
  Building,
  MapPin,
  ShoppingCart,
  Utensils,
  Fuel,
  Car,
  Plane,
  Hotel,
  Tv,
  Laptop,
  HeartPulse,
  ShoppingBag,
  Banknote,
  Globe,
  Tag,
  Coins,
  ShieldCheck,
  FileText
} from "lucide-react";

import { formatFirstName } from "@/lib/format-utils";

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCategory?: (
    transactionId: string,
    categoryId: string | null,
    categoryName: string | null
  ) => void;
  categoriesList?: CategoryItem[];
}

const MCC_ICONS: Record<string, React.FC<{ className?: string }>> = {
  ShoppingCart,
  Utensils,
  Fuel,
  Car,
  Plane,
  Hotel,
  Tv,
  Laptop,
  HeartPulse,
  ShoppingBag,
  Banknote,
  Globe
};

function formatCurrency(amountStr: string, currency: string): { formatted: string; isNegative: boolean } {
  const num = parseFloat(amountStr);
  const isNegative = !isNaN(num) && num < 0;

  let symbol = "";
  switch (currency.toUpperCase()) {
    case "EUR":
      symbol = "€";
      break;
    case "GBP":
      symbol = "£";
      break;
    case "USD":
      symbol = "$";
      break;
    default:
      symbol = `${currency} `;
      break;
  }

  const absNum = Math.abs(isNaN(num) ? 0 : num);
  const formattedNum = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(absNum);

  const sign = isNegative ? "-" : "+";
  return {
    formatted: `${sign}${symbol}${formattedNum}`,
    isNegative
  };
}

function formatDateFull(isoString: string | null | undefined): string {
  if (!isoString) return "No disponible";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: isoString.includes("T") ? "2-digit" : undefined,
      minute: isoString.includes("T") ? "2-digit" : undefined
    }).format(date);
  } catch {
    return isoString;
  }
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onUpdateCategory,
  categoriesList
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  if (!isOpen || !transaction) return null;

  const { formatted, isNegative } = formatCurrency(transaction.amount, transaction.currency);
  const meta = transaction.metadata;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const MccIconComponent = meta?.mccInfo?.icon ? MCC_ICONS[meta.mccInfo.icon] || ShoppingBag : ShoppingBag;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-surface border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between gap-3 bg-bg/40">
          <div className="flex items-center gap-3 min-w-0">
            {transaction.bankName && (
              <BankLogo bankName={transaction.bankName} size="md" />
            )}
            <div className="min-w-0">
              <span className="text-xs font-semibold text-text block truncate">
                {transaction.bankName || "Detalle de Transacción"}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-muted font-mono truncate">
                {formatFirstName(transaction.accountAlias) && (
                  <span className="text-text/90 font-medium">{formatFirstName(transaction.accountAlias)}</span>
                )}
                {formatFirstName(transaction.accountAlias) && transaction.iban && <span>•</span>}
                {transaction.iban && (
                  <span>•••• {transaction.iban.replace(/\s+/g, "").slice(-4)}</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-text hover:bg-border/60 transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-text">
          {/* Main Amount Hero Card */}
          <div className="p-5 rounded-2xl bg-bg/80 border border-border/60 text-center space-y-2 relative overflow-hidden">
            {transaction.isTransfer || transaction.category?.toLowerCase() === "traspasos" ? (
              <div className="flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-sky-300">
                  Traspaso Interno (Neutral)
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isNegative ? "bg-negative shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "bg-accent shadow-[0_0_10px_rgba(0,229,160,0.5)]"
                  }`}
                />
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
                  {isNegative ? "Cargo / Gasto" : "Abono / Ingreso"}
                </span>
              </div>
            )}

            <div
              className={`text-3xl sm:text-4xl font-bold font-mono tracking-tight ${
                transaction.isTransfer || transaction.category?.toLowerCase() === "traspasos"
                  ? "text-sky-400"
                  : isNegative
                  ? "text-negative"
                  : "text-accent"
              }`}
            >
              {formatted}
            </div>

            <p className="text-xs sm:text-sm font-medium text-text leading-relaxed px-2 break-words">
              {transaction.description || "Transacción sin concepto"}
            </p>

            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              {(transaction.isTransfer || transaction.category?.toLowerCase() === "traspasos") && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/30">
                  <span>⇆ Traspaso Interno (No afecta métricas)</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-accent/10 text-accent border border-accent/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Asentado (Settled)
              </span>

              {/* Category Pill with Picker */}
              <div className="relative inline-flex items-center">
                {transaction.category ? (
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen((prev) => !prev)}
                    title="Cambiar categoría"
                    className="cursor-pointer hover:opacity-85 active:scale-95 transition-all"
                  >
                    <CategoryBadge category={transaction.category} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono text-muted bg-border/40 hover:bg-border border border-border transition-colors cursor-pointer"
                  >
                    <Tag className="w-3 h-3" />
                    <span>+ Asignar categoría</span>
                  </button>
                )}

                <CategoryPickerPopover
                  isOpen={isPickerOpen}
                  onClose={() => setIsPickerOpen(false)}
                  onSelect={(catId, catName) => {
                    if (onUpdateCategory) {
                      onUpdateCategory(transaction.id, catId, catName);
                    }
                  }}
                  currentCategoryName={transaction.category}
                  categoriesList={categoriesList}
                />
              </div>
            </div>
          </div>

          {/* Post-Transaction Balance Card */}
          {meta?.balanceAfter && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-surface border border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                    Saldo Resultante
                  </span>
                  <span className="text-xs text-text font-medium">Tras este movimiento</span>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-sm sm:text-base text-text">
                {meta.balanceAfter.amount} {meta.balanceAfter.currency}
              </div>
            </div>
          )}

          {/* Counterparty (Beneficiario o Emisor) */}
          {meta?.counterparty && (meta.counterparty.name || meta.counterparty.iban) && (
            <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-wider">
                <Building className="w-3.5 h-3.5 text-accent" />
                <span>{isNegative ? "Beneficiario (Destino)" : "Ordenante (Origen)"}</span>
              </div>

              <div className="space-y-2">
                {meta.counterparty.name && (
                  <div className="text-sm font-semibold text-text">
                    {meta.counterparty.name}
                  </div>
                )}

                {meta.counterparty.iban && (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-bg/80 border border-border/60">
                    <span className="font-mono text-xs text-text truncate">
                      {meta.counterparty.iban}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(meta.counterparty!.iban!, "counterparty-iban")}
                      className="p-1 rounded-md text-muted hover:text-accent hover:bg-border/40 transition-colors cursor-pointer shrink-0"
                      title="Copiar IBAN"
                    >
                      {copiedKey === "counterparty-iban" ? (
                        <Check className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                {(meta.counterparty.city || meta.counterparty.country) && (
                  <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
                    <MapPin className="w-3.5 h-3.5 text-muted" />
                    <span>
                      {[meta.counterparty.city, meta.counterparty.country].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Commercial & POS Info (MCC) */}
          {meta?.mccInfo && (
            <div className="p-4 rounded-xl bg-surface border border-border space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-wider">
                  <MccIconComponent className="w-3.5 h-3.5 text-accent" />
                  <span>Sector Comercial (MCC)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-bg border border-border text-muted">
                  Código {meta.mccInfo.code}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                  <MccIconComponent className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-text">{meta.mccInfo.name}</div>
                  <span className="text-xs text-muted font-mono">Grupo: {meta.mccInfo.group}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bank Transaction Code (ISO 20022) */}
          {meta?.bankTransactionCode && (
            <div className="p-3.5 rounded-xl bg-surface border border-border flex items-start gap-3">
              <div className="p-2 rounded-lg bg-bg text-muted shrink-0 mt-0.5">
                <CreditCard className="w-4 h-4 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                  Tipo de Operación Bancaria
                </span>
                <p className="text-xs font-medium text-text mt-0.5">
                  {meta.bankTransactionCode.description || meta.bankTransactionCode.code}
                </p>
                {meta.bankTransactionCode.code && (
                  <span className="inline-block mt-1 font-mono text-[10px] text-muted/80 bg-bg px-1.5 py-0.5 rounded border border-border/40">
                    {meta.bankTransactionCode.code}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Foreign Currency Exchange */}
          {meta?.exchangeRate && (
            <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2">
              <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                Conversión de Divisa Extranjera
              </span>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted">Importe Original:</span>
                <span className="text-text font-bold">
                  {meta.exchangeRate.sourceAmount} {meta.exchangeRate.sourceCurrency}
                </span>
              </div>
              {meta.exchangeRate.rate && (
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted">Tipo de Cambio:</span>
                  <span className="text-accent font-bold">
                    1 {meta.exchangeRate.unitCurrency || "EUR"} = {meta.exchangeRate.rate} {meta.exchangeRate.sourceCurrency}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Triple Dates Timeline */}
          <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>Cronología de Fechas</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between py-1 border-b border-border/40">
                <span className="text-muted">Fecha Contable (Booking):</span>
                <span className="text-text font-medium">{formatDateFull(transaction.bookedAt)}</span>
              </div>

              {meta?.dates?.valueDate && (
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted">Fecha Valor (Value):</span>
                  <span className="text-text font-medium">{formatDateFull(meta.dates.valueDate)}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1">
                <span className="text-muted">Fecha Operación (POS/Tarjeta):</span>
                {meta?.dates?.transactionDate ? (
                  <span className="text-text font-medium">{formatDateFull(meta.dates.transactionDate)}</span>
                ) : (
                  <span className="text-muted/70 italic text-[11px]">Coincide con fecha contable</span>
                )}
              </div>
            </div>
          </div>

          {/* Reference Numbers & Remittance Info */}
          {(meta?.referenceNumber || (meta?.remittanceInformation && meta.remittanceInformation.length > 0) || meta?.note) && (
            <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span>Referencias Bancarias</span>
              </div>

              {meta?.referenceNumber && (
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-bg/80 border border-border/60">
                  <div>
                    <span className="text-[10px] font-mono text-muted block">Ref. Operación / SEPA</span>
                    <span className="font-mono text-xs text-text">{meta.referenceNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(meta.referenceNumber!, "ref-num")}
                    className="p-1 rounded-md text-muted hover:text-accent hover:bg-border/40 transition-colors cursor-pointer"
                    title="Copiar referencia"
                  >
                    {copiedKey === "ref-num" ? (
                      <Check className="w-3.5 h-3.5 text-accent" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}

              {meta?.remittanceInformation && meta.remittanceInformation.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-muted block">Información de Transferencia</span>
                  {meta.remittanceInformation.map((info, idx) => (
                    <p key={idx} className="font-mono text-xs text-text bg-bg/60 p-2 rounded border border-border/40">
                      {info}
                    </p>
                  ))}
                </div>
              )}

              {meta?.note && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-muted block">Nota Adicional</span>
                  <p className="text-xs text-text italic">{meta.note}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border/60 bg-bg/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface border border-border text-text hover:border-accent/60 font-mono text-xs transition-colors cursor-pointer"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
