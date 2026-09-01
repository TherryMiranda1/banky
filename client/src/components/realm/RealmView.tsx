import React, { useState } from "react";
import { useKingdom } from "@/hooks/useKingdom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage";
import type { RealmAvatar } from "@/lib/realm/phaser-scene";
import type { Building } from "@/lib/api/kingdom";
import { type PlacedCell } from "@/lib/realm/layout";
import { RealmCanvas } from "./RealmCanvas";
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
  period
}) => {
  const { state, isLoading, error, refresh } = useKingdom(period);
  const [avatar, setAvatar] = useLocalStorage<RealmAvatar>(STORAGE_KEYS.REALM_AVATAR, "prince");
  const [selectedCell, setSelectedCell] = useState<PlacedCell | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedTreasury, setSelectedTreasury] = useState<TreasuryDetail | null>(null);

  const handleToggleAvatar = () => {
    setAvatar((prev) => (prev === "prince" ? "princess" : "prince"));
  };

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

  const handleCloseModal = () => {
    setSelectedCell(null);
    setSelectedBuilding(null);
    setSelectedTreasury(null);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-[460px] sm:h-[540px] rounded-xl bg-surface/40 border border-border" />
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
    <div className="w-full animate-in fade-in duration-200">
      {/* Canvas Principal con HUD Inmersivo Flotante */}
      <RealmCanvas
        state={state}
        avatar={avatar}
        onToggleAvatar={handleToggleAvatar}
        selectedCell={selectedCell}
        onSelectCell={handleSelectCell}
      />

      {/* Modal de Detalle de Edificio / Tesoro */}
      <BuildingDetailModal
        building={selectedBuilding}
        treasury={selectedTreasury}
        onClose={handleCloseModal}
      />
    </div>
  );
};
