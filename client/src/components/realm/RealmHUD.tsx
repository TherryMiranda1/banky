import React, { useState, useEffect } from "react";
import type { KingdomState } from "@/lib/api/kingdom";
import type { RealmAvatar } from "@/lib/realm/phaser-scene";
import { formatCurrency } from "@/lib/format-utils";
import { ShieldCheck, ShieldAlert, Sparkles, ZoomIn, ZoomOut, RotateCcw, PieChart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface RealmHUDProps {
  state: KingdomState;
  avatar: RealmAvatar;
  onToggleAvatar: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetCamera: () => void;
}

export const RealmHUD: React.FC<RealmHUDProps> = ({
  state,
  avatar,
  onToggleAvatar,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetCamera
}) => {
  const navigate = useNavigate();
  const { summary, buildings, treasuryLevel } = state;

  const burningBuildings = buildings.filter((b) => b.status === "burning");
  const healthyBuildings = buildings.filter((b) => b.status === "healthy");
  const totalCategories = buildings.length;

  const isHealthy = burningBuildings.length === 0;
  const isPositiveSavings = summary.netSavings >= 0;

  // Live Ticker News
  const [tickerIndex, setTickerIndex] = useState(0);
  const newsItems = React.useMemo(() => {
    const list: string[] = [];
    if (burningBuildings.length > 0) {
      const names = burningBuildings.map((b) => b.categoryName).join(", ");
      list.push(`🔥 Alerta: Sobregasto en [${names}]`);
    }
    if (summary.netSavings > 0) {
      list.push(`💰 Ahorro del ciclo: +${formatCurrency(summary.netSavings)} (${summary.savingsRate.toFixed(1)}%)`);
    } else if (summary.netSavings < 0) {
      list.push(`⚠️ Déficit mensual: -${formatCurrency(Math.abs(summary.netSavings))}`);
    }
    list.push(`🏰 Tesoro Nivel ${treasuryLevel} • ${healthyBuildings.length}/${totalCategories} sectores bajo control`);
    return list;
  }, [burningBuildings, healthyBuildings, summary, treasuryLevel, totalCategories]);

  useEffect(() => {
    if (newsItems.length <= 1) return;
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % newsItems.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [newsItems.length]);

  return (
    <>
      {/* 1. TOP FLOATING HUD */}
      <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-3.5 sm:left-3.5 sm:right-3.5 flex items-center justify-between pointer-events-none z-10 gap-2">
        {/* Soberano & Nivel */}
        <button
          type="button"
          onClick={onToggleAvatar}
          className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface/85 backdrop-blur-md border border-border/80 text-text shadow-sm hover:border-accent/40 active:scale-95 transition cursor-pointer"
          title={`Soberano: ${avatar === "prince" ? "Príncipe" : "Princesa"}. Click para alternar.`}
        >
          <span className="text-sm select-none">{avatar === "prince" ? "🤴" : "👸"}</span>
          <span className="text-[11px] font-bold text-text hidden xs:inline font-mono">L{treasuryLevel}</span>
        </button>

        {/* Métrica Central: Flujo / Ahorro Neto del Ciclo */}
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1 rounded-full bg-surface/85 backdrop-blur-md border border-border/80 shadow-sm text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted text-[11px] font-medium hidden sm:inline">Ahorro:</span>
            <span
              className={`font-mono font-bold text-[12px] sm:text-[13px] ${
                isPositiveSavings ? "text-income" : "text-expense"
              }`}
            >
              {isPositiveSavings ? `+${formatCurrency(summary.netSavings)}` : `-${formatCurrency(Math.abs(summary.netSavings))}`}
            </span>
          </div>

          <div className="h-3 w-px bg-border hidden xs:block" />

          <div className="flex items-center gap-1 text-[11px] font-mono text-muted">
            <span>{summary.savingsRate.toFixed(0)}%</span>
            {summary.savingsRate >= 20 ? (
              <span className="text-income text-[10px] font-semibold">✓ Meta</span>
            ) : null}
          </div>
        </div>

        {/* Estado del Escudo / Categorías */}
        <div
          className={`pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface/85 backdrop-blur-md border text-[11px] font-medium shadow-sm ${
            isHealthy
              ? "border-income/40 text-income"
              : "border-expense/50 text-expense"
          }`}
          title={
            isHealthy
              ? "Paz en el Reino: Todas las categorías están bajo presupuesto"
              : `Alerta: ${burningBuildings.length} categoría(s) con sobregasto`
          }
        >
          {isHealthy ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-income" />
              <span className="font-mono text-[11px] hidden xs:inline">{healthyBuildings.length}/{totalCategories}</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-expense animate-pulse" />
              <span className="font-bold text-[11px]">{burningBuildings.length} Alerta</span>
            </>
          )}
        </div>
      </div>

      {/* 2. BOTTOM FLOATING HUD */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3.5 sm:left-3.5 sm:right-3.5 flex items-center justify-between pointer-events-none z-10 gap-2">
        {/* Live News Ticker */}
        <div className="pointer-events-auto max-w-[200px] xs:max-w-[260px] sm:max-w-[360px] truncate px-3 py-1.5 rounded-full bg-surface/85 backdrop-blur-md border border-border/80 shadow-sm text-[11px] text-text font-medium flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-accent shrink-0" />
          <span className="truncate">{newsItems[tickerIndex] || "Reino en calma"}</span>
        </div>

        {/* Acciones y Controles de Cámara */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-surface/85 backdrop-blur-md border border-border/80 rounded-full p-1 shadow-sm">
          {/* Botón Presupuestos */}
          <button
            type="button"
            onClick={() => navigate("/budgets")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-text hover:text-accent hover:bg-surface-elevated active:scale-95 transition cursor-pointer"
            title="Ir a Presupuestos"
          >
            <PieChart className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline text-[11px]">Presupuestos</span>
          </button>

          <div className="h-3 w-px bg-border" />

          {/* Zoom Out */}
          <button
            type="button"
            onClick={onZoomOut}
            className="w-6 h-6 flex items-center justify-center rounded-full text-muted hover:text-text hover:bg-surface-elevated active:scale-95 transition cursor-pointer"
            title="Alejar"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Badge */}
          <span className="text-[10.5px] font-mono font-medium text-text px-1 select-none min-w-[36px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          {/* Zoom In */}
          <button
            type="button"
            onClick={onZoomIn}
            className="w-6 h-6 flex items-center justify-center rounded-full text-muted hover:text-text hover:bg-surface-elevated active:scale-95 transition cursor-pointer"
            title="Acercar"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Reset Zoom */}
          <button
            type="button"
            onClick={onResetCamera}
            className="w-6 h-6 flex items-center justify-center rounded-full text-muted hover:text-accent hover:bg-surface-elevated active:scale-95 transition cursor-pointer"
            title="Restablecer vista inicial"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </>
  );
};
