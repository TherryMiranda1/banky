import React, { useEffect, useRef, useState } from "react";
import type { KingdomState } from "@/lib/api/kingdom";
import type { PlacedCell } from "@/lib/realm/layout";
import type { PhaserRealmEngine } from "@/lib/realm/phaser-engine";
import type { RealmAvatar } from "@/lib/realm/phaser-scene";
import { RealmHUD } from "./RealmHUD";

export interface RealmCanvasProps {
  state: KingdomState;
  selectedCell?: PlacedCell | null;
  avatar?: RealmAvatar;
  onToggleAvatar?: () => void;
  className?: string;
  onSelectCell?: (cell: PlacedCell) => void;
}

export const RealmCanvas: React.FC<RealmCanvasProps> = ({
  state,
  selectedCell = null,
  avatar = "prince",
  onToggleAvatar = () => {},
  className = "",
  onSelectCell
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<PhaserRealmEngine | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1.0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;

    import("@/lib/realm/phaser-engine").then(({ PhaserRealmEngine }) => {
      if (!isMounted || !canvasRef.current) return;

      const engine = new PhaserRealmEngine();
      engine.attach(canvasRef.current);
      engine.setAvatar(avatar);
      engine.setState(state);
      engine.setSelectedCell(selectedCell || null);
      engine.setOnSelectCell(onSelectCell || null);
      engine.onZoomChange((z) => {
        if (isMounted) setZoom(z);
      });
      engineRef.current = engine;

      const container = containerRef.current;
      if (container && typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          engine.resize();
        });
        resizeObserver.observe(container);
      }
    });

    return () => {
      isMounted = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setAvatar(avatar);
    }
  }, [avatar]);

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

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setOnSelectCell(onSelectCell || null);
    }
  }, [onSelectCell]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!engineRef.current) return;
    const cell = engineRef.current.getCellAt(e.clientX, e.clientY);
    engineRef.current.setHoveredCell(cell);
  };

  const handlePointerLeave = () => {
    if (!engineRef.current) return;
    engineRef.current.setHoveredCell(null);
  };

  const handleZoomIn = () => {
    engineRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    engineRef.current?.zoomOut();
  };

  const handleResetCamera = () => {
    engineRef.current?.resetCamera();
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[440px] sm:h-[520px] md:h-[580px] rounded-xl overflow-hidden bg-[#5c8628] border border-border flex items-center justify-center select-none ${className}`}
    >
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Floating HUD (Top & Bottom Game Overlays) */}
      <RealmHUD
        state={state}
        avatar={avatar}
        onToggleAvatar={onToggleAvatar}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetCamera={handleResetCamera}
      />
    </div>
  );
};
