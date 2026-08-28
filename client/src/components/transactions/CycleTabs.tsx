import React, { useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import {
  generateAdjacentPeriods,
  formatCyclePeriod,
  getCurrentPeriod
} from "@/lib/cycle-utils";

interface CycleTabsProps {
  selectedPeriod: string;
  cutoffDay?: number;
  onSelectPeriod: (period: string) => void;
  className?: string;
}

export const CycleTabs: React.FC<CycleTabsProps> = ({
  selectedPeriod,
  cutoffDay = 1,
  onSelectPeriod,
  className = ""
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentPeriod = useMemo(() => getCurrentPeriod(cutoffDay), [cutoffDay]);

  const periods = useMemo(() => {
    const base = selectedPeriod || currentPeriod;
    return generateAdjacentPeriods(base, 5, 2);
  }, [selectedPeriod, currentPeriod]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -160 : 160;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className={`p-1.5 rounded-2xl bg-surface/60 border border-border/60 flex items-center gap-1.5 shadow-sm backdrop-blur-sm ${className}`}>
      <button
        type="button"
        onClick={() => handleScroll("left")}
        aria-label="Anterior"
        className="shrink-0 p-1.5 rounded-xl bg-surface/80 border border-border/80 text-muted hover:text-text hover:border-border transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth"
      >
        {periods.map((period) => {
          const info = formatCyclePeriod(period, cutoffDay);
          const isSelected = period === selectedPeriod;

          return (
            <button
              key={period}
              type="button"
              onClick={() => onSelectPeriod(period)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-left transition-all duration-150 cursor-pointer flex items-center gap-1.5 border text-xs font-medium ${
                isSelected
                  ? "bg-accent text-bg border-accent font-semibold shadow-xs"
                  : info.isCurrent
                  ? "bg-surface border-accent/40 text-text hover:border-accent/80"
                  : "bg-surface/40 border-border/50 text-muted hover:text-text hover:border-border"
              }`}
            >
              <span>{info.label}</span>
              {info.isCurrent && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => handleScroll("right")}
        aria-label="Siguiente"
        className="shrink-0 p-1.5 rounded-xl bg-surface/80 border border-border/80 text-muted hover:text-text hover:border-border transition-colors cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {selectedPeriod !== currentPeriod && (
        <button
          type="button"
          onClick={() => onSelectPeriod(currentPeriod)}
          title="Ir al ciclo actual"
          className="shrink-0 px-2.5 py-1.5 rounded-xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors text-[11px] font-mono flex items-center gap-1 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Actual</span>
        </button>
      )}
    </div>
  );
};
