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
    return generateAdjacentPeriods(base, 6, 2);
  }, [selectedPeriod, currentPeriod]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -180 : 180;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className={`p-1.5 sm:p-2 rounded-xl bg-surface/80 border border-border/70 flex items-center gap-1.5 shadow-sm ${className}`}>
      {/* Scroll Left Button */}
      <button
        type="button"
        onClick={() => handleScroll("left")}
        aria-label="Anterior"
        className="shrink-0 p-1 rounded-lg bg-surface border border-border text-muted hover:text-text hover:border-accent/40 transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {/* Horizontal Pills Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {periods.map((period) => {
          const info = formatCyclePeriod(period, cutoffDay);
          const isSelected = period === selectedPeriod;

          return (
            <button
              key={period}
              type="button"
              onClick={() => onSelectPeriod(period)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-left transition-all duration-150 cursor-pointer flex items-center gap-1.5 border text-xs font-medium ${
                isSelected
                  ? "bg-accent text-bg border-accent font-semibold shadow-[0_0_12px_rgba(0,229,160,0.3)]"
                  : info.isCurrent
                  ? "bg-surface border-accent/40 text-text hover:border-accent/80"
                  : "bg-bg/40 border-border/70 text-muted hover:text-text hover:border-border"
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

      {/* Scroll Right Button */}
      <button
        type="button"
        onClick={() => handleScroll("right")}
        aria-label="Siguiente"
        className="shrink-0 p-1 rounded-lg bg-surface border border-border text-muted hover:text-text hover:border-accent/40 transition-colors cursor-pointer"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* Go to current cycle button */}
      {selectedPeriod !== currentPeriod && (
        <button
          type="button"
          onClick={() => onSelectPeriod(currentPeriod)}
          title="Ir al ciclo actual"
          className="shrink-0 p-1 px-2 rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors text-[11px] font-mono flex items-center gap-1 cursor-pointer"
        >
          <Sparkles className="w-3 h-3" />
          <span className="hidden sm:inline">Actual</span>
        </button>
      )}
    </div>
  );
};

