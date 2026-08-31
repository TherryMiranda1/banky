import React from "react";
import type { Building } from "@/lib/api/kingdom";
import { formatCurrency } from "@/lib/format-utils";
import { Crown, Flame, AlertCircle, X, CheckCircle2, ChevronRight, Shield, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface TreasuryDetail {
  level: number;
  totalBalanceEur: number;
  netSavings: number;
  savingsRate: number;
}

export interface BuildingDetailModalProps {
  building: Building | null;
  treasury: TreasuryDetail | null;
  onClose: () => void;
}

export const BuildingDetailModal: React.FC<BuildingDetailModalProps> = ({
  building,
  treasury,
  onClose
}) => {
  const navigate = useNavigate();

  if (!building && !treasury) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 pointer-events-auto">
      <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-[#13151f] border border-[#34384d] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-muted hover:text-text hover:bg-surface-elevated transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {treasury ? (
          <div className="space-y-4">
            {/* Header / Avatar */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-400 via-amber-600 to-amber-950 p-0.5 shadow-lg flex items-center justify-center shrink-0">
                <div className="w-full h-full rounded-[10px] bg-[#1a1408] flex items-center justify-center text-amber-400">
                  <Crown className="w-6 h-6" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-text">Tesoro Real</h3>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                    Nivel {treasury.level}/3
                  </span>
                </div>
                <p className="text-xs text-muted font-sans">Bóveda central de almacenamiento y reservas</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="p-3.5 rounded-xl bg-[#181a26] border border-[#2b2f44] space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-muted font-sans">Balance Consolidado:</span>
                <span className="text-amber-300 font-bold text-sm">
                  {formatCurrency(treasury.totalBalanceEur)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted font-sans">Ahorro Neto Mensual:</span>
                <span
                  className={`font-semibold ${
                    treasury.netSavings >= 0 ? "text-income" : "text-expense"
                  }`}
                >
                  {treasury.netSavings >= 0 ? "+" : ""}
                  {formatCurrency(treasury.netSavings)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted font-sans">Tasa de Ahorro:</span>
                <span className="text-accent font-semibold">{treasury.savingsRate.toFixed(1)}%</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/accounts");
                }}
                className="py-2 px-3 rounded-lg bg-[#202334] hover:bg-[#292d42] text-text font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Ver Cuentas</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/budgets");
                }}
                className="py-2 px-3 rounded-lg bg-accent text-[#0a0a0f] font-bold text-xs flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer"
              >
                <span>Presupuestos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : building ? (
          <div className="space-y-4">
            {/* Header / Avatar */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl p-0.5 shadow-lg flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: `${building.categoryColor}20`,
                  borderColor: `${building.categoryColor}50`
                }}
              >
                <div
                  className="w-full h-full rounded-[10px] flex items-center justify-center font-bold text-lg"
                  style={{
                    backgroundColor: "#161824",
                    color: building.categoryColor || "#38bdf8"
                  }}
                >
                  🏰
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-text truncate">{building.categoryName}</h3>
                  <span className="px-2 py-0.5 rounded bg-[#202334] text-muted text-[10px] font-mono font-bold shrink-0">
                    Nivel {building.level}/3
                  </span>
                </div>
                <p className="text-xs text-muted font-sans">Estructura del sector de {building.categoryName}</p>
              </div>
            </div>

            {/* RPG Budget Bar */}
            <div className="p-3.5 rounded-xl bg-[#181a26] border border-[#2b2f44] space-y-3 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-muted font-sans">Gasto en el Ciclo:</span>
                <span className="text-text font-bold text-sm">
                  {formatCurrency(building.spentAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted font-sans">Límite Presupuestario:</span>
                <span className="text-text">{formatCurrency(building.budgetAmount)}</span>
              </div>

              {building.budgetAmount > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted font-sans">Consumo de Capacidad:</span>
                    <span
                      className={`font-bold ${
                        building.spentPercentage > 100 ? "text-expense" : "text-emerald-400"
                      }`}
                    >
                      {building.spentPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#0d0f17] overflow-hidden border border-[#2b2e40]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        building.spentPercentage > 100
                          ? "bg-linear-to-r from-rose-600 to-rose-400"
                          : "bg-linear-to-r from-emerald-600 to-emerald-400"
                      }`}
                      style={{ width: `${Math.min(100, building.spentPercentage)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Status Alert Banner */}
            {building.status === "burning" && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                <Flame className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
                <div>
                  <div className="font-bold">¡Incendio por Sobregasto!</div>
                  <div className="text-[11px] text-rose-300/80">
                    Se superó el presupuesto asignado para esta categoría.
                  </div>
                </div>
              </div>
            )}

            {building.status === "ruined" && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold">Estructura en Ruinas</div>
                  <div className="text-[11px] text-amber-300/80">
                    Hay gastos acumulados pero no se configuró un presupuesto.
                  </div>
                </div>
              </div>
            )}

            {building.status === "healthy" && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold">Defensas Intactas</div>
                  <div className="text-[11px] text-emerald-300/80">
                    Los gastos se mantienen dentro del límite establecido.
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/accounts");
                }}
                className="py-2 px-3 rounded-lg bg-[#202334] hover:bg-[#292d42] text-text font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Ver Movimientos</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/budgets");
                }}
                className="py-2 px-3 rounded-lg bg-accent text-[#0a0a0f] font-bold text-xs flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer"
              >
                <span>Ajustar Límite</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
