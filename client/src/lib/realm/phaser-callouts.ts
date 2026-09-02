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
  const categoryName = (building.categoryName || "Gasto").toUpperCase();
  const spentAmountText = `${Math.round(building.spentAmount).toLocaleString("es-ES")} €`;

  let frameColor = 0x92400e; // Madera / Bronce dorado
  let highlightBorderColor = 0xb45309;
  let categoryTextColor = "#fef3c7"; // Pergamino cálido

  if (building.status === "burning") {
    frameColor = 0xef4444; // Fuego / Alerta
    highlightBorderColor = 0xdc2626;
    categoryTextColor = "#fca5a5";
  } else if (building.status === "ruined") {
    frameColor = 0xd97706; // Ámbar / Peligro
    highlightBorderColor = 0xb45309;
    categoryTextColor = "#fde68a";
  }

  const container = scene.add.container(Math.round(x), Math.round(y));

  // Multiplicador de resolución nativa para máxima nitidez (Retina / 4K)
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 2;
  const textResolution = Math.max(4, Math.round(dpr * 2.5));

  // 1. Texto de Categoría (Pergamino Dorado con Trazo Definido)
  const categoryText = scene.add.text(0, -7, categoryName, {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: "9.5px",
    fontStyle: "bold",
    color: categoryTextColor,
    stroke: "#1a0802",
    strokeThickness: 2,
    align: "center",
    shadow: {
      offsetX: 0,
      offsetY: 1,
      color: "#000000",
      blur: 0,
      fill: true
    }
  });
  categoryText.setResolution(textResolution);
  categoryText.setOrigin(0.5, 0.5);

  // 2. Texto de Importe Monetario (JetBrains Mono / Consolas con Alto Contraste)
  const amountText = scene.add.text(0, 6, spentAmountText, {
    fontFamily: "'JetBrains Mono', 'Consolas', 'Courier New', monospace",
    fontSize: "11px",
    fontStyle: "bold",
    color: "#fde047",
    stroke: "#1a0802",
    strokeThickness: 2.2,
    align: "center",
    shadow: {
      offsetX: 0,
      offsetY: 1,
      color: "#000000",
      blur: 0,
      fill: true
    }
  });
  amountText.setResolution(textResolution);
  amountText.setOrigin(0.5, 0.5);

  // Cálculo de dimensiones del Cartel de Madera
  const badgeWidth = Math.max(74, Math.ceil(Math.max(categoryText.width, amountText.width) + 20));
  const badgeHeight = 30;
  const radius = 5;

  // 3. Renderizado del Cartel de Madera Medieval
  const bg = scene.add.graphics();

  function drawWoodSign(isHovered = false) {
    bg.clear();

    const hw = badgeWidth / 2;
    const hh = badgeHeight / 2;

    // Sombra del cartel sobre el edificio
    bg.fillStyle(0x000000, 0.55);
    bg.fillRoundedRect(-hw + 1, -hh + 2, badgeWidth, badgeHeight, radius);

    // Marco exterior de madera oscura
    bg.fillStyle(isHovered ? 0x3d1704 : 0x270f03, 1);
    bg.fillRoundedRect(-hw, -hh, badgeWidth, badgeHeight, radius);

    // Tablón central de madera de roble
    bg.fillStyle(isHovered ? 0x5c2609 : 0x451a03, 1);
    bg.fillRoundedRect(-hw + 1.5, -hh + 1.5, badgeWidth - 3, badgeHeight - 3, radius - 1);

    // Bisel superior iluminado de madera
    bg.fillStyle(0x78350f, 0.75);
    bg.fillRect(-hw + 3, -hh + 2, badgeWidth - 6, 2);

    // Borde de refuerzo / herraje
    bg.lineStyle(1.5, frameColor, isHovered ? 1 : 0.85);
    bg.strokeRoundedRect(-hw, -hh, badgeWidth, badgeHeight, radius);

    // Grabado divisor horizontal en la madera
    bg.lineStyle(1, isHovered ? 0x78350f : 0x270f03, 0.8);
    bg.lineBetween(-hw + 8, 0, hw - 8, 0);

    // Clavos / Remaches de forja en las 4 esquinas
    const nailColor = isHovered ? 0xd97706 : 0x1c1917;
    const nailBorder = highlightBorderColor;

    const nailPositions = [
      { x: -hw + 4.5, y: -hh + 4.5 },
      { x: hw - 4.5, y: -hh + 4.5 },
      { x: -hw + 4.5, y: hh - 4.5 },
      { x: hw - 4.5, y: hh - 4.5 }
    ];

    nailPositions.forEach((pos) => {
      bg.fillStyle(nailColor, 1);
      bg.fillCircle(pos.x, pos.y, 1.5);
      bg.lineStyle(0.5, nailBorder, 0.9);
      bg.strokeCircle(pos.x, pos.y, 1.5);
    });
  }

  drawWoodSign(false);

  container.add(bg);
  container.add(categoryText);
  container.add(amountText);

  // 4. Hit Area Interactiva (Click & Hover)
  const hitArea = scene.add.rectangle(0, 0, badgeWidth, badgeHeight, 0x000000, 0);
  hitArea.setInteractive({ useHandCursor: true });

  hitArea.on("pointerover", () => {
    drawWoodSign(true);
    categoryText.setColor("#ffffff");
    amountText.setColor("#ffffff");
    onHover(true);
  });

  hitArea.on("pointerout", () => {
    drawWoodSign(false);
    categoryText.setColor(categoryTextColor);
    amountText.setColor("#fde047");
    onHover(false);
  });

  hitArea.on("pointerup", () => {
    onSelect();
  });

  container.add(hitArea);

  return container;
}
