import React, { useState } from "react";
import { useKingdom } from "@/hooks/useKingdom";
import type { Building } from "@/lib/api/kingdom";
import { generateKingdomLayout, type PlacedCell } from "@/lib/realm/layout";
import { RealmCanvas } from "./RealmCanvas";
import { RealmGameHUD } from "./RealmGameHUD";
import { RealmBottomBar } from "./RealmBottomBar";
import { RealmLegend } from "./RealmLegend";
import { BuildingDetailModal, type TreasuryDetail } from "./BuildingDetailModal";
import { AlertCircle, RefreshCw } from "lucide-react";

export interface RealmViewProps {
  period: string;
  activeAccountsCount?: number;
  totalAccountsCount?: number;
  onOpenCashModal?: () => void;
  onSync?: () => Promise<void>;
  isSyncing?: boolean;
}

export const RealmView: React.FC<RealmViewProps> = ({
  period,
  activeAccountsCount,
  totalAccountsCount,
  onOpenCashModal,
  onSync,
  isSyncing
}) => {
  const { state, isLoading, error, refresh } = useKingdom(period);
  const [selectedCell, setSelectedCell] = useState<PlacedCell | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedTreasury, setSelectedTreasury] = useState<TreasuryDetail | null>(null);

  const handleSelectCell = (cell: PlacedCell) => {
    if (!state) return;
    setSelectedCell(cell);
    if (cell.type === "building" && cell.building) {
      setSelectedTreasury(null);
      setSelectedBuilding(cell.building);
    } else if (cell.type === "treasury") {
      setSelectedBuilding(null);
      setSelectedTreasury({
        level: state.treasuryLevel,
        totalBalanceEur: state.summary.totalBalanceEur,
        netSavings: state.summary.netSavings,
        savingsRate: state.summary.savingsRate
      });
    }
  };

  const handleSelectBuilding = (building: Building) => {
    if (!state) return;
    const cells = generateKingdomLayout(state);
    const matchingCell = cells.find((c) => c.type === "building" && c.building?.id === building.id) || null;
    setSelectedCell(matchingCell);
    setSelectedTreasury(null);
    setSelectedBuilding(building);
  };

  const handleCloseModal = () => {
    setSelectedCell(null);
    setSelectedBuilding(null);
    setSelectedTreasury(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-24 rounded-xl bg-surface/50 border border-border" />
        <div className="h-[420px] rounded-xl bg-surface/30 border border-border" />
        <div className="h-14 rounded-xl bg-surface/40 border border-border" />
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="p-8 rounded-xl bg-surface border border-expense/30 text-center space-y-4 max-w-md mx-auto my-8">
        <div className="w-10 h-10 rounded-full bg-expense/10 text-expense flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-text">Error al cargar el Reino</h3>
          <p className="text-xs text-muted font-mono">{error || "No se pudo recuperar el estado"}</p>
        </div>
        <button
          type="button"
          onClick={() => refresh()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-bg font-semibold text-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* Top Resource & Player Bar */}
      <RealmGameHUD
        state={state}
        activeAccountsCount={activeAccountsCount}
        totalAccountsCount={totalAccountsCount}
        onOpenCashModal={onOpenCashModal}
        onSync={onSync}
        isSyncing={isSyncing}
      />

      {/* Medieval Isometric World Canvas */}
      <RealmCanvas
        state={state}
        selectedCell={selectedCell}
        onSelectCell={handleSelectCell}
      />

      {/* Bottom Bar & Guild News Feed */}
      <RealmBottomBar state={state} />

      {/* Building Inventory Accordion */}
      <RealmLegend
        buildings={state.buildings}
        selectedBuildingId={selectedBuilding?.id}
        onSelectBuilding={handleSelectBuilding}
      />

      {/* RPG Detail Card Modal */}
      <BuildingDetailModal
        building={selectedBuilding}
        treasury={selectedTreasury}
        onClose={handleCloseModal}
      />
    </div>
  );
};
