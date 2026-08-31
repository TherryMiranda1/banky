import React, { useState } from "react";
import type { Building } from "@/lib/api/kingdom";
import { formatCurrency } from "@/lib/format-utils";
import { ChevronDown, ChevronUp, Flame, AlertCircle } from "lucide-react";

export interface RealmLegendProps {
  buildings: Building[];
  selectedBuildingId?: string | null;
  onSelectBuilding?: (building: Building) => void;
}

export const RealmLegend: React.FC<RealmLegendProps> = ({
  buildings,
  selectedBuildingId,
  onSelectBuilding
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  if (buildings.length === 0) return null;

  return (
    <div className="rounded-lg bg-surface border border-border overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-surface-elevated/40 hover:bg-surface-elevated/80 transition-colors text-left cursor-pointer"
      >
        <span className="font-semibold text-text">
          Edificios & Estructuras del Reino ({buildings.length})
        </span>
        <span className="text-muted">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {isOpen && (
        <div className="divide-y divide-border max-h-64 overflow-y-auto">
          {buildings.map((b) => {
            const isBurning = b.status === "burning";
            const isRuined = b.status === "ruined";
            const isSelected = selectedBuildingId === b.id;

            return (
              <div
                key={b.id}
                onClick={() => onSelectBuilding?.(b)}
                className={`flex items-center justify-between px-3.5 py-2 transition-colors cursor-pointer ${
                  isSelected ? "bg-accent/10 border-l-2 border-l-accent" : "hover:bg-surface-elevated/30"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: b.categoryColor || "#38bdf8" }}
                  />
                  <div className="truncate">
                    <span className="font-medium text-text">{b.categoryName}</span>
                    <span className="text-[11px] text-muted font-mono ml-2">
                      (Nvl. {b.level})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-right shrink-0">
                  <div className="text-muted text-[11px]">
                    {b.budgetAmount > 0 ? (
                      <span>
                        {formatCurrency(b.spentAmount)} / {formatCurrency(b.budgetAmount)}
                      </span>
                    ) : (
                      <span>{formatCurrency(b.spentAmount)}</span>
                    )}
                  </div>

                  {isBurning && (
                    <span className="inline-flex items-center gap-1 text-expense text-[11px] font-semibold">
                      <Flame className="w-3 h-3 animate-pulse" />
                      <span>{b.spentPercentage.toFixed(0)}%</span>
                    </span>
                  )}

                  {isRuined && (
                    <span className="inline-flex items-center gap-1 text-amber-400 text-[11px]">
                      <AlertCircle className="w-3 h-3" />
                      <span>Sin budget</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

