import React, { useEffect, useRef } from "react";
import type { KingdomState } from "@/lib/api/kingdom";
import type { PlacedCell } from "@/lib/realm/layout";
import { RealmEngine } from "@/lib/realm/engine";

export interface RealmCanvasProps {
  state: KingdomState;
  selectedCell?: PlacedCell | null;
  className?: string;
  onSelectCell?: (cell: PlacedCell) => void;
}

export const RealmCanvas: React.FC<RealmCanvasProps> = ({
  state,
  selectedCell = null,
  className = "",
  onSelectCell
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<RealmEngine | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new RealmEngine();
    engine.attach(canvas);
    engine.setState(state);
    engine.setSelectedCell(selectedCell || null);
    engineRef.current = engine;

    const container = containerRef.current;
    let resizeObserver: ResizeObserver | null = null;

    if (container && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        engine.resize();
      });
      resizeObserver.observe(container);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setState(state);
    }
  }, [state]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSelectedCell(selectedCell || null);
    }
  }, [selectedCell]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!engineRef.current) return;
    const cell = engineRef.current.getCellAt(e.clientX, e.clientY);
    engineRef.current.setHoveredCell(cell);
  };

  const handlePointerLeave = () => {
    if (!engineRef.current) return;
    engineRef.current.setHoveredCell(null);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !onSelectCell) return;
    const cell = engineRef.current.getCellAt(e.clientX, e.clientY);
    if (cell && (cell.type === "building" || cell.type === "treasury")) {
      onSelectCell(cell);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[360px] sm:h-[460px] rounded-lg overflow-hidden bg-[#547E19] border border-border flex items-center justify-center ${className}`}
    >
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerUp={handlePointerUp}
        className="w-full h-full block cursor-pointer touch-none"
      />
    </div>
  );
};


