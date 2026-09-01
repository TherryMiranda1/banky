import Phaser from "phaser";
import type { PlacedCell } from "./layout";

export function createBuildingCallout(
  scene: Phaser.Scene,
  cell: PlacedCell,
  x: number,
  y: number,
  onSelect: () => void,
  onHover: (hovered: boolean) => void
): Phaser.GameObjects.Container | null {
  if (cell.type !== "building" || !cell.building) {
    return null;
  }

  const building = cell.building;
  const fullCategoryName = building.categoryName || "Gasto";
  const spentAmountText = `${Math.round(building.spentAmount)} €`;

  let strokeColor = 0x22c55e;
  if (building.status === "burning") {
    strokeColor = 0xef4444;
  } else if (building.status === "ruined") {
    strokeColor = 0xf59e0b;
  }

  const container = scene.add.container(x, y);

  // 1. Chip Principal Compacto
  const chipWidth = Math.max(48, spentAmountText.length * 7 + 16);
  const chipHeight = 18;
  const radius = 4;

  const bg = scene.add.graphics();
  bg.fillStyle(0x0f172a, 0.94);
  bg.fillRoundedRect(-chipWidth / 2, -chipHeight / 2, chipWidth, chipHeight, radius);
  bg.lineStyle(1.5, strokeColor, 1);
  bg.strokeRoundedRect(-chipWidth / 2, -chipHeight / 2, chipWidth, chipHeight, radius);
  container.add(bg);

  // Texto con resolución 3x (Anti-aliasing nítido en zoom y pantallas Retina)
  const amountText = scene.add.text(0, 0, spentAmountText, {
    fontFamily: "JetBrains Mono, monospace",
    fontSize: "9px",
    fontStyle: "bold",
    color: "#f8fafc",
    align: "center"
  });
  amountText.setResolution(3);
  amountText.setOrigin(0.5, 0.5);
  container.add(amountText);

  // 2. Tooltip Flotante con Categoría Completa (On-Hover)
  const tooltipContainer = scene.add.container(0, -chipHeight / 2 - 12);
  tooltipContainer.setVisible(false);

  const tooltipWidth = fullCategoryName.length * 6 + 16;
  const tooltipHeight = 16;

  const tooltipBg = scene.add.graphics();
  tooltipBg.fillStyle(0x1e293b, 0.96);
  tooltipBg.fillRoundedRect(-tooltipWidth / 2, -tooltipHeight / 2, tooltipWidth, tooltipHeight, 3);
  tooltipBg.lineStyle(1, 0x475569, 0.8);
  tooltipBg.strokeRoundedRect(-tooltipWidth / 2, -tooltipHeight / 2, tooltipWidth, tooltipHeight, 3);
  tooltipContainer.add(tooltipBg);

  const tooltipText = scene.add.text(0, 0, fullCategoryName, {
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "8.5px",
    fontStyle: "bold",
    color: "#cbd5e1",
    align: "center"
  });
  tooltipText.setResolution(3);
  tooltipText.setOrigin(0.5, 0.5);
  tooltipContainer.add(tooltipText);

  container.add(tooltipContainer);

  // 3. Área Interactiva
  const hitArea = scene.add.rectangle(0, 0, chipWidth, chipHeight, 0x000000, 0);
  hitArea.setInteractive({ useHandCursor: true });

  hitArea.on("pointerover", () => {
    tooltipContainer.setVisible(true);
    onHover(true);
  });

  hitArea.on("pointerout", () => {
    tooltipContainer.setVisible(false);
    onHover(false);
  });

  hitArea.on("pointerdown", () => {
    onSelect();
  });

  container.add(hitArea);

  return container;
}
