import React, { useState, useEffect } from "react";
import type { KingdomState } from "@/lib/api/kingdom";
import { formatCurrency } from "@/lib/format-utils";
import { Swords, Scroll, ShoppingBag, ShieldCheck, Sparkles, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface RealmBottomBarProps {
  state: KingdomState;
}

export const RealmBottomBar: React.FC<RealmBottomBarProps> = ({ state }) => {
  const navigate = useNavigate();
  const [activeTickerIndex, setActiveTickerIndex] = useState<number>(0);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState<boolean>(false);
  const [isQuestsModalOpen, setIsQuestsModalOpen] = useState<boolean>(false);

  const { summary, health, buildings, events, treasuryLevel } = state;

  const burningBuildings = buildings.filter((b) => b.status === "burning");
  const ruinedBuildings = buildings.filter((b) => b.status === "ruined");
  const healthyBuildings = buildings.filter((b) => b.status === "healthy");

  const newsItems = React.useMemo(() => {
    const list: string[] = [];

    if (burningBuildings.length > 0) {
      const names = burningBuildings.map((b) => b.categoryName).join(", ");
      list.push(`🔥 Alerta de la Guardia: Sobregasto activo en [${names}]. ¡Revisá tus presupuestos!`);
    }

    if (ruinedBuildings.length > 0) {
      const names = ruinedBuildings.map((b) => b.categoryName).join(", ");
      list.push(`⚠️ Ruinas sin planificar: Gastos registrados en [${names}] sin presupuesto asignado.`);
    }

    if (summary.netSavings > 0) {
      list.push(
        `💰 Caravana de Prosperidad: El reino acumula +${formatCurrency(
          summary.netSavings
        )} de ahorro este ciclo.`
      );
    } else {
      list.push(
        `⚔️ Defensa del Tesoro: El balance mensual está en déficit (-${formatCurrency(
          Math.abs(summary.netSavings)
        )}).`
      );
    }

    list.push(`🏰 Tesoro Real Nivel ${treasuryLevel}: Custodiando ${formatCurrency(summary.totalBalanceEur)}.`);

    if (healthyBuildings.length > 0) {
      list.push(
        `🛡️ Paz en las Fronteras: ${healthyBuildings.length} sectores del reino operan bajo su presupuesto.`
      );
    }

    events.forEach((ev) => {
      if (ev.kind === "fire") {
        list.push(`🔥 Incendio financiero en el sector de ${ev.categoryName}.`);
      } else if (ev.kind === "caravan") {
        list.push(`🐪 Caravana mercante reporta ${ev.count} nuevas transacciones ingresadas.`);
      }
    });

    return list;
  }, [summary, buildings, events, treasuryLevel, burningBuildings, ruinedBuildings, healthyBuildings]);

  useEffect(() => {
    if (newsItems.length <= 1) return;
    const interval = setInterval(() => {
      setActiveTickerIndex((prev) => (prev + 1) % newsItems.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [newsItems.length]);

  const quests = React.useMemo(() => {
    return [
      {
        id: "savings_rate",
        title: "Tasa de Ahorro Real",
        desc: "Mantené un ahorro mensual superior al 20%.",
        progress: `${summary.savingsRate.toFixed(1)}% / 20.0%`,
        isCompleted: summary.savingsRate >= 20
      },
      {
        id: "no_burn",
        title: "Paz en las Murallas",
        desc: "Evitá sobrepasar presupuestos en todas las categorías.",
        progress: `${healthyBuildings.length} / ${buildings.length} saludables`,
        isCompleted: burningBuildings.length === 0 && buildings.length > 0
      },
      {
        id: "treasury_guard",
        title: "Fortaleza del Tesoro",
        desc: "Alcanzá un balance consolidado superior a 10.000 €.",
        progress: `${formatCurrency(summary.totalBalanceEur)} / 10.000 €`,
        isCompleted: summary.totalBalanceEur >= 10000
      }
    ];
  }, [summary, buildings, healthyBuildings, burningBuildings]);

  const pendingQuestsCount = quests.filter((q) => !q.isCompleted).length;

  return (
    <>
      <div className="w-full bg-[#12141a]/95 backdrop-blur-md border border-[#2a2d3d] rounded-xl p-2 sm:p-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-2">
        {/* Battle / Strategy Quick Button */}
        <button
          type="button"
          onClick={() => setIsStrategyModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-linear-to-r from-rose-950/80 to-[#1f1624] hover:from-rose-900/90 hover:to-[#2b1e32] border border-rose-500/40 text-rose-300 font-semibold text-xs shadow-md transition-all cursor-pointer min-h-[34px]"
        >
          <Swords className="w-4 h-4 text-rose-400" />
          <span className="hidden sm:inline">Estrategia</span>
        </button>

        {/* Guild News Ticker */}
        <div className="flex-1 min-w-[200px] max-w-2xl bg-[#171924] border border-[#2f3347] px-3 py-1.5 rounded-lg overflow-hidden flex items-center gap-2 shadow-inner">
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold tracking-wider uppercase shrink-0 font-mono">
            Guild News
          </span>
          <div className="text-xs text-[#d0d3e2] truncate font-sans animate-in fade-in duration-300">
            {newsItems[activeTickerIndex] || "El reino prospera en calma."}
          </div>
        </div>

        {/* Action Controls: Shop & Quests */}
        <div className="flex items-center gap-1.5">
          {/* Quests Scroll Button */}
          <button
            type="button"
            onClick={() => setIsQuestsModalOpen(true)}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1d2c] hover:bg-[#23273c] border border-[#373b53] text-[#c9ccd9] font-medium text-xs shadow-md transition-colors cursor-pointer min-h-[34px]"
            title="Misiones del Reino"
          >
            <Scroll className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Misiones</span>
            {pendingQuestsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-black font-black text-[9px] flex items-center justify-center font-mono">
                {pendingQuestsCount}
              </span>
            )}
          </button>

          {/* Shop / Budgets Button */}
          <button
            type="button"
            onClick={() => navigate("/budgets")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-md transition-all cursor-pointer min-h-[34px]"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Presupuestos</span>
          </button>
        </div>
      </div>

      {/* Strategy / Health Modal */}
      {isStrategyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#13151f] border border-[#34384d] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242738] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <Swords className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text">Informe Estratégico del Reino</h3>
                  <p className="text-[11px] text-muted font-mono">Diagnóstico del Ciclo Activo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStrategyModalOpen(false)}
                className="p-1 rounded-md text-muted hover:text-text hover:bg-surface-elevated cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-lg bg-[#1a1d2a] border border-[#2b2f42]">
                <span className="text-muted font-sans">Estado General:</span>
                <span className="font-bold text-accent uppercase tracking-wider">{health}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-[#1a1d2a] border border-[#2b2f42]">
                <span className="text-muted font-sans">Ingresos Registrados:</span>
                <span className="font-bold text-income">{formatCurrency(summary.totalIncome)}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-[#1a1d2a] border border-[#2b2f42]">
                <span className="text-muted font-sans">Gastos Totales:</span>
                <span className="font-bold text-expense">{formatCurrency(summary.totalSpent)}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-[#1a1d2a] border border-[#2b2f42]">
                <span className="text-muted font-sans">Presupuesto Asignado:</span>
                <span className="font-bold text-text">{formatCurrency(summary.totalBudgeted)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsStrategyModalOpen(false);
                  navigate("/budgets");
                }}
                className="w-full py-2 px-3 rounded-lg bg-accent text-[#0a0a0f] font-bold text-xs flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer"
              >
                <span>Optimizar Presupuestos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quests Modal */}
      {isQuestsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#13151f] border border-[#34384d] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242738] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Scroll className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text">Misiones del Ciclo</h3>
                  <p className="text-[11px] text-muted font-mono">Metas para fortificar el Reino</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuestsModalOpen(false)}
                className="p-1 rounded-md text-muted hover:text-text hover:bg-surface-elevated cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {quests.map((q) => (
                <div
                  key={q.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 ${
                    q.isCompleted
                      ? "bg-emerald-950/20 border-emerald-500/30"
                      : "bg-[#181a26] border-[#2c3044]"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      q.isCompleted
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-[#25293d] text-muted"
                    }`}
                  >
                    {q.isCompleted ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-text">{q.title}</h4>
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          q.isCompleted ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {q.isCompleted ? "Completada" : "En curso"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted">{q.desc}</p>
                    <p className="text-[10px] font-mono text-muted/80">{q.progress}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsQuestsModalOpen(false)}
                className="w-full py-2 px-3 rounded-lg bg-[#202334] hover:bg-[#282c42] text-text font-semibold text-xs transition-colors cursor-pointer"
              >
                Cerrar Pergamino
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
