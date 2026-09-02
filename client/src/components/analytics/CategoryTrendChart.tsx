import React, { useState, useEffect, useMemo, useRef } from "react";
import { getCategoryTrends, type CategoryTrendsResponse } from "@/lib/api/kingdom";
import { formatCurrency } from "@/lib/format-utils";
import { TrendingUp, Calendar, RefreshCw, Layers } from "lucide-react";

export interface CategoryTrendChartProps {
  initialMonths?: number;
  className?: string;
}

export const CategoryTrendChart: React.FC<CategoryTrendChartProps> = ({
  initialMonths = 6,
  className = ""
}) => {
  const [months, setMonths] = useState<number>(initialMonths);
  const [data, setData] = useState<CategoryTrendsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCategoryTrends(months);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar tendencias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [months]);

  const activeSeries = useMemo(() => {
    if (!data?.series) return [];
    if (selectedCategoryId) {
      return data.series.filter((s) => s.categoryId === selectedCategoryId);
    }
    return data.series.slice(0, 8);
  }, [data, selectedCategoryId]);

  const maxVal = useMemo(() => {
    if (!data?.series || data.series.length === 0) return 100;
    let highest = 0;
    for (const s of data.series) {
      for (const v of s.data) {
        if (v > highest) highest = v;
      }
    }
    return highest > 0 ? highest * 1.15 : 100;
  }, [data]);

  const svgHeight = 220;
  const padding = { top: 20, right: 24, bottom: 32, left: 48 };
  const chartWidth = Math.max(300, containerWidth);
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const pointsBySeries = useMemo(() => {
    if (!data?.months || data.months.length === 0) return [];
    const count = data.months.length;
    const stepX = count > 1 ? plotWidth / (count - 1) : plotWidth / 2;

    return activeSeries.map((s) => {
      const points = s.data.map((val, idx) => {
        const x = padding.left + idx * stepX;
        const y = padding.top + plotHeight - (val / maxVal) * plotHeight;
        return { x, y, val, monthIndex: idx };
      });

      let pathD = "";
      if (points.length > 0) {
        pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          const pPrev = points[i - 1];
          const pCurr = points[i];
          const cx = (pPrev.x + pCurr.x) / 2;
          pathD += ` C ${cx} ${pPrev.y}, ${cx} ${pCurr.y}, ${pCurr.x} ${pCurr.y}`;
        }
      }

      return {
        series: s,
        points,
        pathD
      };
    });
  }, [activeSeries, data, plotWidth, plotHeight, maxVal, padding.left, padding.top]);

  return (
    <div
      ref={containerRef}
      className={`rounded-md border border-border bg-surface/30 overflow-hidden ${className}`}
    >
      <div className="px-4 py-2.5 bg-surface-elevated border-b border-border flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-semibold text-text">Evolución Histórica por Categoría</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface rounded-md border border-border p-0.5 text-xs font-mono">
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                  months === m ? "bg-accent text-bg font-bold" : "text-muted hover:text-text"
                }`}
              >
                {m}m
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchData}
            title="Recargar gráfico"
            disabled={loading}
            className="p-1 rounded bg-surface border border-border text-muted hover:text-text transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-accent" : ""}`} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="h-56 flex items-center justify-center text-xs font-mono text-muted animate-pulse">
          Cargando datos de evolución...
        </div>
      ) : error ? (
        <div className="p-6 text-center text-xs font-mono text-expense">{error}</div>
      ) : !data || data.series.length === 0 ? (
        <div className="p-8 text-center space-y-1 text-muted">
          <Layers className="w-6 h-6 mx-auto mb-1 opacity-50" />
          <p className="text-xs font-medium text-text">Sin datos históricos suficientes</p>
          <p className="text-[11px] font-mono">Los datos se acumularán a medida que se importen movimientos.</p>
        </div>
      ) : (
        <div className="p-3 sm:p-4 space-y-3">
          <div className="relative overflow-x-auto select-none">
            <svg
              width={chartWidth}
              height={svgHeight}
              className="overflow-visible"
              onPointerLeave={() => setHoveredMonthIndex(null)}
            >
              {[0, 0.33, 0.66, 1].map((ratio) => {
                const y = padding.top + plotHeight * (1 - ratio);
                const val = maxVal * ratio;
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="var(--color-border, #34384d)"
                      strokeDasharray="3 3"
                      strokeOpacity={0.4}
                    />
                    <text
                      x={padding.left - 6}
                      y={y + 3}
                      fill="var(--color-muted, #8b949e)"
                      fontSize={9}
                      textAnchor="end"
                      className="font-mono"
                    >
                      {val >= 1000 ? `${(val / 1000).toFixed(1)}k€` : `${Math.round(val)}€`}
                    </text>
                  </g>
                );
              })}

              {data.monthLabels.map((label, idx) => {
                const count = data.monthLabels.length;
                const stepX = count > 1 ? plotWidth / (count - 1) : plotWidth / 2;
                const x = padding.left + idx * stepX;
                return (
                  <text
                    key={idx}
                    x={x}
                    y={svgHeight - 8}
                    fill={hoveredMonthIndex === idx ? "var(--color-text, #ffffff)" : "var(--color-muted, #8b949e)"}
                    fontSize={10}
                    fontWeight={hoveredMonthIndex === idx ? "bold" : "normal"}
                    textAnchor="middle"
                    className="font-mono cursor-pointer"
                    onPointerEnter={() => setHoveredMonthIndex(idx)}
                  >
                    {label}
                  </text>
                );
              })}

              {hoveredMonthIndex !== null && (
                <line
                  x1={padding.left + hoveredMonthIndex * (plotWidth / (data.months.length - 1))}
                  y1={padding.top}
                  x2={padding.left + hoveredMonthIndex * (plotWidth / (data.months.length - 1))}
                  y2={padding.top + plotHeight}
                  stroke="var(--color-accent, #38bdf8)"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  opacity={0.7}
                />
              )}

              {pointsBySeries.map(({ series, pathD }) => (
                <path
                  key={series.categoryId}
                  d={pathD}
                  fill="none"
                  stroke={series.categoryColor || "#38bdf8"}
                  strokeWidth={selectedCategoryId === series.categoryId ? 2.5 : 1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={selectedCategoryId && selectedCategoryId !== series.categoryId ? 0.2 : 0.85}
                  className="transition-all duration-200"
                />
              ))}

              {pointsBySeries.map(({ series, points }) =>
                points.map((pt, pIdx) => {
                  const isHoveredMonth = hoveredMonthIndex === pt.monthIndex;
                  return (
                    <circle
                      key={`${series.categoryId}-${pIdx}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={isHoveredMonth ? 4.5 : 2.5}
                      fill={series.categoryColor || "#38bdf8"}
                      stroke="#13151f"
                      strokeWidth={1.5}
                      className="cursor-pointer transition-all duration-150"
                      onPointerEnter={() => setHoveredMonthIndex(pt.monthIndex)}
                    />
                  );
                })
              )}
            </svg>
          </div>

          {hoveredMonthIndex !== null && data.monthLabels[hoveredMonthIndex] && (
            <div className="p-2.5 rounded-md bg-surface-elevated border border-border text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-100">
              <span className="font-mono font-bold text-text flex items-center gap-1">
                <Calendar className="w-3 h-3 text-accent" />
                {data.monthLabels[hoveredMonthIndex]}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                {activeSeries.map((s) => (
                  <div key={s.categoryId} className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span
                      className="w-2 h-2 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: s.categoryColor || "#38bdf8" }}
                    />
                    <span className="text-muted">{s.categoryName}:</span>
                    <span className="text-text font-semibold">
                      {formatCurrency(s.data[hoveredMonthIndex] || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryId(null)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                selectedCategoryId === null
                  ? "bg-accent/20 text-accent border-accent/40 font-semibold"
                  : "bg-surface text-muted border-border hover:text-text"
              }`}
            >
              Todas las categorías ({data.series.length})
            </button>

            {data.series.map((s) => {
              const isSelected = selectedCategoryId === s.categoryId;
              return (
                <button
                  key={s.categoryId}
                  type="button"
                  onClick={() => setSelectedCategoryId(isSelected ? null : s.categoryId)}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                    isSelected
                      ? "bg-surface-elevated text-text border-accent font-semibold"
                      : "bg-surface text-muted border-border hover:text-text hover:border-border/80"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.categoryColor || "#38bdf8" }}
                  />
                  <span>{s.categoryName}</span>
                  <span className="text-[10px] text-muted">({formatCurrency(s.total)})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
