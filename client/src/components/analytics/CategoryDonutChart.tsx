import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { CategoryAnalyticsItem } from "@/lib/api/budgets";

interface CategoryDonutChartProps {
  categories: CategoryAnalyticsItem[];
  uncategorizedSpent: number;
  totalSpent: number;
  period?: string;
}

interface ChartSlice {
  id: string;
  name: string;
  color: string;
  icon: string;
  spent: number;
  percentage: number;
  startAngle: number;
  endAngle: number;
  pathData: string;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function describeDonutSlice(
  x: number,
  y: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const adjustedEndAngle = endAngle - startAngle >= 359.99 ? startAngle + 359.99 : endAngle;

  const startOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, adjustedEndAngle);
  const startInner = polarToCartesian(x, y, innerRadius, adjustedEndAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);

  const arcSweep = adjustedEndAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${arcSweep} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${arcSweep} 0 ${endInner.x} ${endInner.y}`,
    "Z"
  ].join(" ");
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  categories,
  uncategorizedSpent,
  totalSpent,
  period
}) => {
  const navigate = useNavigate();
  const [hoveredSliceId, setHoveredSliceId] = useState<string | null>(null);

  const slices = useMemo<ChartSlice[]>(() => {
    if (totalSpent <= 0) return [];

    const activeItems: Array<{ id: string; name: string; color: string; icon: string; spent: number }> = [];

    for (const cat of categories) {
      if (cat.spentAmount > 0) {
        activeItems.push({
          id: cat.categoryId,
          name: cat.categoryName,
          color: cat.categoryColor || "#6b6b80",
          icon: cat.categoryIcon || "Tag",
          spent: cat.spentAmount
        });
      }
    }

    if (uncategorizedSpent > 0) {
      activeItems.push({
        id: "uncategorized",
        name: "Sin Categoría",
        color: "#6b6b80",
        icon: "HelpCircle",
        spent: uncategorizedSpent
      });
    }

    activeItems.sort((a, b) => b.spent - a.spent);

    let currentAngle = 0;
    const result: ChartSlice[] = [];

    for (const item of activeItems) {
      const slicePercentage = (item.spent / totalSpent) * 100;
      const angleSweep = (item.spent / totalSpent) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSweep;
      currentAngle = endAngle;

      const pathData = describeDonutSlice(100, 100, 85, 58, startAngle, endAngle);

      result.push({
        id: item.id,
        name: item.name,
        color: item.color,
        icon: item.icon,
        spent: item.spent,
        percentage: Math.round(slicePercentage * 10) / 10,
        startAngle,
        endAngle,
        pathData
      });
    }

    return result;
  }, [categories, uncategorizedSpent, totalSpent]);

  const activeSlice = useMemo(() => {
    if (!hoveredSliceId) return null;
    return slices.find((s) => s.id === hoveredSliceId) || null;
  }, [hoveredSliceId, slices]);

  const handleCategoryClick = (slice: ChartSlice) => {
    const categoryParam = slice.id === "uncategorized" ? "__uncategorized__" : slice.name;
    const query = new URLSearchParams();
    query.set("category", categoryParam);
    if (period) {
      query.set("period", period);
    }
    navigate(`/accounts?${query.toString()}`);
  };

  if (totalSpent <= 0 || slices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-surface/30 rounded-md border border-border text-center">
        <div className="w-10 h-10 rounded-full bg-border/40 flex items-center justify-center text-muted mb-2.5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <p className="text-xs font-semibold text-text">Sin gastos registrados</p>
        <p className="text-[11px] text-muted font-mono mt-0.5">No hay transacciones en este periodo para graficar.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-surface/30 rounded-md border border-border">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted font-mono">
            Distribución del Gasto
          </h3>
          <p className="text-[11px] text-muted font-mono">Click en una categoría para ver sus movimientos</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* SVG Donut Chart */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full transform transition-all duration-300">
            {slices.map((slice) => {
              const isHovered = hoveredSliceId === slice.id;
              return (
                <path
                  key={slice.id}
                  d={slice.pathData}
                  fill={slice.color}
                  className="transition-all duration-200 cursor-pointer origin-center"
                  style={{
                    opacity: hoveredSliceId ? (isHovered ? 1 : 0.4) : 0.92,
                    filter: isHovered ? `drop-shadow(0 0 8px ${slice.color}80)` : "none",
                    transform: isHovered ? "scale(1.03)" : "scale(1)"
                  }}
                  onMouseEnter={() => setHoveredSliceId(slice.id)}
                  onMouseLeave={() => setHoveredSliceId(null)}
                  onClick={() => handleCategoryClick(slice)}
                />
              );
            })}
          </svg>

          {/* Center Info in Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
            {activeSlice ? (
              <div className="animate-in fade-in zoom-in-95 duration-150">
                <span className="text-[9px] uppercase font-mono tracking-wider font-semibold text-muted block truncate max-w-[100px]">
                  {activeSlice.name}
                </span>
                <span className="text-sm font-bold font-mono text-text block">
                  {activeSlice.spent.toFixed(2)} €
                </span>
                <span className="text-[10px] font-mono text-accent font-semibold block">
                  {activeSlice.percentage}%
                </span>
              </div>
            ) : (
              <div>
                <span className="text-[9px] uppercase font-mono tracking-wider text-muted block">
                  Total Gasto
                </span>
                <span className="text-sm font-bold font-mono text-text block">
                  {totalSpent.toFixed(2)} €
                </span>
                <span className="text-[9px] font-mono text-muted block">
                  {slices.length} {slices.length === 1 ? "cat" : "cats"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Styled Legend List with Custom Scrollbar */}
        <div className="flex-1 w-full space-y-1.5 max-h-52 overflow-y-auto pr-1.5 custom-scrollbar">
          {slices.map((slice) => {
            const isHovered = hoveredSliceId === slice.id;
            return (
              <button
                key={slice.id}
                type="button"
                onMouseEnter={() => setHoveredSliceId(slice.id)}
                onMouseLeave={() => setHoveredSliceId(null)}
                onClick={() => handleCategoryClick(slice)}
                title={`Ver transacciones de ${slice.name}`}
                className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-all cursor-pointer group ${
                  isHovered
                    ? "bg-border/60 border border-accent/30 shadow-xs"
                    : "bg-bg/40 hover:bg-border/30 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-xs font-medium text-text truncate group-hover:text-accent transition-colors">
                    {slice.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                  <span className="text-text font-semibold">
                    {slice.spent.toFixed(2)} €
                  </span>
                  <span className="text-muted text-[10px] w-9 text-right font-medium">
                    {slice.percentage}%
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-muted group-hover:text-accent transition-colors shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
