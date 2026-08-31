import type { Point } from "./projection.js";

export function drawShadow(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radiusX: number,
  radiusY = radiusX * 0.5
): void {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(center.x, center.y + 2, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(18, 38, 12, 0.42)";
  ctx.fill();
  ctx.restore();
}

export function drawPineTree(
  ctx: CanvasRenderingContext2D,
  center: Point,
  scale = 1
): void {
  ctx.save();
  drawShadow(ctx, center, 11 * scale, 5 * scale);

  const trunkW = 3.5 * scale;
  const trunkH = 8 * scale;
  const trunkX = center.x - trunkW / 2;
  const trunkY = center.y - trunkH + 2;

  ctx.fillStyle = "#5C3A1E";
  ctx.fillRect(trunkX, trunkY, trunkW, trunkH);
  ctx.fillStyle = "#3D2410";
  ctx.fillRect(trunkX, trunkY, trunkW * 0.4, trunkH);

  const tiers = [
    { y: center.y - 6 * scale, w: 20 * scale, h: 12 * scale, dark: "#1E543B", light: "#2D7A56", hi: "#409A6E" },
    { y: center.y - 14 * scale, w: 16 * scale, h: 11 * scale, dark: "#236346", light: "#358A62", hi: "#4BB07F" },
    { y: center.y - 22 * scale, w: 11 * scale, h: 10 * scale, dark: "#2D7A56", light: "#409A6E", hi: "#5BC490" }
  ];

  for (const tier of tiers) {
    ctx.beginPath();
    ctx.moveTo(center.x - tier.w / 2, tier.y);
    ctx.lineTo(center.x, tier.y - tier.h);
    ctx.lineTo(center.x, tier.y);
    ctx.closePath();
    ctx.fillStyle = tier.dark;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(center.x, tier.y - tier.h);
    ctx.lineTo(center.x + tier.w / 2, tier.y);
    ctx.lineTo(center.x, tier.y);
    ctx.closePath();
    ctx.fillStyle = tier.light;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(center.x, tier.y - tier.h);
    ctx.lineTo(center.x + tier.w * 0.22, tier.y - tier.h * 0.35);
    ctx.lineTo(center.x, tier.y - tier.h * 0.6);
    ctx.closePath();
    ctx.fillStyle = tier.hi;
    ctx.fill();
  }

  ctx.restore();
}

export function drawAutumnOak(
  ctx: CanvasRenderingContext2D,
  center: Point,
  scale = 1
): void {
  ctx.save();
  drawShadow(ctx, center, 14 * scale, 6 * scale);

  const trunkW = 5 * scale;
  const trunkH = 11 * scale;
  const trunkX = center.x - trunkW / 2;
  const trunkY = center.y - trunkH + 2;

  ctx.fillStyle = "#6B4423";
  ctx.fillRect(trunkX, trunkY, trunkW, trunkH);
  ctx.fillStyle = "#4A2E14";
  ctx.fillRect(trunkX, trunkY, trunkW * 0.45, trunkH);

  const crownY = center.y - 18 * scale;
  const r = 11 * scale;

  ctx.beginPath();
  ctx.arc(center.x - 5 * scale, crownY + 2 * scale, r * 0.75, 0, Math.PI * 2);
  ctx.fillStyle = "#B86514";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(center.x + 5 * scale, crownY + 2 * scale, r * 0.8, 0, Math.PI * 2);
  ctx.fillStyle = "#D97B1A";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(center.x, crownY - 3 * scale, r * 0.9, 0, Math.PI * 2);
  ctx.fillStyle = "#E59424";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(center.x - 2 * scale, crownY - 6 * scale, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = "#F5B041";
  ctx.fill();

  ctx.restore();
}

export function drawTreasureChest(
  ctx: CanvasRenderingContext2D,
  center: Point,
  scale = 1,
  time = 0
): void {
  ctx.save();
  drawShadow(ctx, center, 9 * scale, 4.5 * scale);

  const w = 12 * scale;
  const h = 8 * scale;
  const x = center.x - w / 2;
  const y = center.y - h - 1;

  const glowPulse = 0.5 + 0.5 * Math.sin(time * 3);
  ctx.beginPath();
  ctx.arc(center.x, center.y - h / 2, (10 + glowPulse * 4) * scale, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(245, 158, 11, ${0.15 + glowPulse * 0.15})`;
  ctx.fill();

  ctx.fillStyle = "#78350F";
  ctx.fillRect(x, y + 3 * scale, w, h - 3 * scale);

  ctx.beginPath();
  ctx.moveTo(x, y + 3 * scale);
  ctx.quadraticCurveTo(center.x, y - 2 * scale, x + w, y + 3 * scale);
  ctx.closePath();
  ctx.fillStyle = "#92400E";
  ctx.fill();

  ctx.fillStyle = "#334155";
  ctx.fillRect(x + 1.5 * scale, y + 2 * scale, 2 * scale, h - 2 * scale);
  ctx.fillRect(x + w - 3.5 * scale, y + 2 * scale, 2 * scale, h - 2 * scale);

  ctx.fillStyle = "#FBBF24";
  ctx.fillRect(center.x - 1.5 * scale, y + 2.5 * scale, 3 * scale, 3.5 * scale);
  ctx.fillStyle = "#0284C7";
  ctx.fillRect(center.x - 0.75 * scale, y + 3.25 * scale, 1.5 * scale, 1.5 * scale);

  ctx.restore();
}
