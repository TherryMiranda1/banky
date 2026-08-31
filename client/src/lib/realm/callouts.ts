import type { Point } from "./projection.js";
import type { PlacedCell } from "./layout.js";
import {
  drawCoinIcon,
  drawElixirBottleIcon,
  drawHeroCardIcon,
  drawBannerIcon,
  drawWarningIcon
} from "./callout-icons.js";

export interface CalloutAnchor {
  x: number;
  y: number;
  ridgeY: number;
  radius: number;
}

export function getBuildingRidgeHeight(cell: PlacedCell): number {
  if (cell.type === "treasury") return 46;
  if (!cell.building) return 24;

  const lvl = cell.building.level;
  switch (cell.building.type) {
    case "vault":
      return lvl === 3 ? 46 : lvl === 2 ? 36 : 28;
    case "library":
      return lvl === 3 ? 48 : lvl === 2 ? 40 : 30;
    case "stable":
      return lvl === 3 ? 40 : lvl === 2 ? 32 : 24;
    case "watchtower":
      return lvl === 3 ? 62 : lvl === 2 ? 52 : 42;
    case "market":
      return lvl === 3 ? 44 : lvl === 2 ? 36 : 26;
    case "tavern":
      return lvl === 3 ? 46 : lvl === 2 ? 38 : 30;
    case "granary":
      return lvl === 3 ? 44 : lvl === 2 ? 36 : 28;
    case "windmill":
      return lvl === 3 ? 54 : lvl === 2 ? 46 : 38;
    case "house":
    default:
      return lvl === 3 ? 40 : lvl === 2 ? 32 : 24;
  }
}

export function getCalloutAnchor(center: Point, cell: PlacedCell, time = 0): CalloutAnchor {
  const ridge = getBuildingRidgeHeight(cell);
  const floatY = Math.sin(time * 2.6 + cell.col * 1.4 + cell.row * 1.8) * 3.5;
  return {
    x: center.x,
    y: center.y - ridge - 20 + floatY,
    ridgeY: center.y - ridge,
    radius: 13
  };
}

export function isPointInCallout(
  clickX: number,
  clickY: number,
  center: Point,
  cell: PlacedCell,
  time = 0
): boolean {
  if (cell.type !== "building" && cell.type !== "treasury") return false;
  const anchor = getCalloutAnchor(center, cell, time);
  const dx = clickX - anchor.x;
  const dy = clickY - anchor.y;
  return dx * dx + dy * dy <= (anchor.radius + 6) * (anchor.radius + 6);
}

export function drawRpgBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  variant: "gold" | "alert" | "info" | "success" = "gold"
): void {
  ctx.save();
  ctx.font = "bold 8px monospace";
  const metrics = ctx.measureText(text);
  const padX = 4;
  const w = metrics.width + padX * 2;
  const h = 12;
  const bx = x - w / 2;
  const by = y - h / 2;

  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, 3);

  let bgGrad = ctx.createLinearGradient(bx, by, bx, by + h);
  let strokeColor = "#CA8A04";
  let textColor = "#FEF08A";

  if (variant === "alert") {
    bgGrad.addColorStop(0, "#991B1B");
    bgGrad.addColorStop(1, "#450A0A");
    strokeColor = "#EF4444";
    textColor = "#FEE2E2";
  } else if (variant === "info") {
    bgGrad.addColorStop(0, "#0369A1");
    bgGrad.addColorStop(1, "#082F49");
    strokeColor = "#38BDF8";
    textColor = "#E0F2FE";
  } else if (variant === "success") {
    bgGrad.addColorStop(0, "#15803D");
    bgGrad.addColorStop(1, "#052E16");
    strokeColor = "#4ADE80";
    textColor = "#DCFCE7";
  } else {
    bgGrad.addColorStop(0, "#854D0E");
    bgGrad.addColorStop(1, "#422006");
    strokeColor = "#FACC15";
    textColor = "#FEF9C3";
  }

  ctx.fillStyle = bgGrad;
  ctx.fill();

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = textColor;
  ctx.fillText(text, x, y + 0.5);

  ctx.restore();
}

export function drawActionBubble(
  ctx: CanvasRenderingContext2D,
  anchor: CalloutAnchor,
  isHovered: boolean,
  isSelected: boolean,
  isWarning: boolean
): void {
  ctx.save();

  const scale = isHovered || isSelected ? 1.14 : 1.0;
  ctx.translate(anchor.x, anchor.y);
  ctx.scale(scale, scale);

  if (isHovered || isSelected) {
    ctx.beginPath();
    ctx.arc(0, 0, anchor.radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = isWarning ? "rgba(239, 68, 68, 0.35)" : "rgba(250, 204, 21, 0.4)";
    ctx.fill();
  }

  ctx.beginPath();
  ctx.ellipse(0, anchor.radius + 6, anchor.radius * 0.7, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(15, 23, 42, 0.3)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, anchor.radius + 6);
  ctx.lineTo(-4, anchor.radius - 1);
  ctx.lineTo(4, anchor.radius - 1);
  ctx.closePath();
  ctx.fillStyle = isWarning ? "#991B1B" : "#B45309";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, anchor.radius, 0, Math.PI * 2);
  const borderGrad = ctx.createLinearGradient(-anchor.radius, -anchor.radius, anchor.radius, anchor.radius);
  if (isWarning) {
    borderGrad.addColorStop(0, "#EF4444");
    borderGrad.addColorStop(0.5, "#B91C1C");
    borderGrad.addColorStop(1, "#7F1D1D");
  } else {
    borderGrad.addColorStop(0, "#FDE047");
    borderGrad.addColorStop(0.5, "#CA8A04");
    borderGrad.addColorStop(1, "#854D0E");
  }
  ctx.fillStyle = borderGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, anchor.radius - 1.8, 0, Math.PI * 2);
  const innerGrad = ctx.createRadialGradient(-2, -3, 1, 0, 0, anchor.radius);
  innerGrad.addColorStop(0, "#FFFFFF");
  innerGrad.addColorStop(0.5, "#FFFBEB");
  innerGrad.addColorStop(1, "#FEF3C7");
  ctx.fillStyle = innerGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(-anchor.radius * 0.35, -anchor.radius * 0.4, anchor.radius * 0.3, anchor.radius * 0.15, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.fill();

  ctx.restore();
}

export function drawCellCallout(
  ctx: CanvasRenderingContext2D,
  center: Point,
  cell: PlacedCell,
  time: number,
  isHovered: boolean,
  isSelected: boolean
): void {
  if (cell.type !== "building" && cell.type !== "treasury") return;

  const anchor = getCalloutAnchor(center, cell, time);
  const isWarning =
    cell.building?.status === "burning" ||
    cell.building?.status === "ruined" ||
    (cell.building ? cell.building.spentPercentage > 100 : false);

  drawActionBubble(ctx, anchor, isHovered, isSelected, isWarning);

  const iconRadius = anchor.radius * 0.65;
  const iconScale = isHovered || isSelected ? 1.14 : 1.0;
  const iconX = anchor.x;
  const iconY = anchor.y;

  if (isWarning) {
    drawWarningIcon(ctx, iconX, iconY, iconRadius * 1.5 * iconScale, time);
  } else if (cell.type === "treasury" || cell.building?.type === "vault" || cell.building?.type === "house") {
    drawCoinIcon(ctx, iconX, iconY, iconRadius * iconScale, time);
  } else if (cell.building?.type === "library" || cell.building?.type === "granary" || cell.building?.type === "windmill") {
    drawElixirBottleIcon(ctx, iconX, iconY, iconRadius * 1.6 * iconScale, time);
  } else if (cell.building?.type === "stable" || cell.building?.type === "watchtower") {
    drawBannerIcon(ctx, iconX, iconY, iconRadius * 1.6 * iconScale, time);
  } else {
    drawHeroCardIcon(ctx, iconX, iconY, iconRadius * 1.5 * iconScale, time);
  }

  let badgeText = "";
  let badgeVariant: "gold" | "alert" | "info" | "success" = "gold";

  if (cell.building?.status === "burning") {
    badgeText = "FUEGO";
    badgeVariant = "alert";
  } else if (cell.building?.status === "ruined") {
    badgeText = "RUINA";
    badgeVariant = "alert";
  } else if (cell.building && cell.building.spentPercentage > 100) {
    badgeText = `${Math.round(cell.building.spentPercentage)}%`;
    badgeVariant = "alert";
  } else if (cell.type === "treasury") {
    badgeText = "TESORO";
    badgeVariant = "gold";
  } else if (cell.building?.type === "stable") {
    badgeText = "TROPAS";
    badgeVariant = "info";
  } else if (cell.building?.type === "library") {
    badgeText = "ELIXIR";
    badgeVariant = "info";
  } else if (cell.building?.level === 3) {
    badgeText = "MAX";
    badgeVariant = "success";
  }

  if (badgeText) {
    const badgeY = anchor.y - anchor.radius - 8;
    drawRpgBadge(ctx, anchor.x, badgeY, badgeText, badgeVariant);
  }
}
