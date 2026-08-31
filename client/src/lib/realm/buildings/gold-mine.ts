import type { Point } from "../projection.js";
import {
  drawIsoShadow,
  drawIsoBox
} from "./common.js";

export function drawGoldVault(
  ctx: CanvasRenderingContext2D,
  center: Point,
  level: 1 | 2 | 3,
  time = 0
): void {
  ctx.save();
  const radiusX = level === 3 ? 24 : level === 2 ? 20 : 16;
  drawIsoShadow(ctx, center, radiusX, radiusX * 0.5);

  const moundW = level === 3 ? 36 : level === 2 ? 30 : 24;
  const moundD = level === 3 ? 18 : level === 2 ? 15 : 12;
  const moundH = level === 3 ? 22 : level === 2 ? 18 : 14;

  drawIsoBox({
    ctx,
    center,
    width: moundW,
    depth: moundD,
    height: moundH,
    leftColor: "#475569",
    rightColor: "#64748B",
    topColor: "#94A3B8",
    yOffset: 2
  });

  const portalW = level === 3 ? 14 : 11;
  const portalH = level === 3 ? 16 : 12;
  const pY = center.y - 2;

  ctx.fillStyle = "#0F172A";
  ctx.beginPath();
  ctx.moveTo(center.x - portalW / 2, pY);
  ctx.lineTo(center.x - portalW / 2, pY - portalH + 3);
  ctx.lineTo(center.x, pY - portalH);
  ctx.lineTo(center.x + portalW / 2, pY - portalH + 3);
  ctx.lineTo(center.x + portalW / 2, pY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#78350F";
  ctx.fillRect(center.x - portalW / 2 - 2, pY - portalH, 3, portalH + 2);
  ctx.fillRect(center.x + portalW / 2 - 1, pY - portalH, 3, portalH + 2);
  ctx.fillRect(center.x - portalW / 2 - 2, pY - portalH - 1, portalW + 4, 3);

  ctx.fillStyle = "#B45309";
  ctx.fillRect(center.x - portalW / 2 - 1, pY - portalH + 1, 1.5, portalH);
  ctx.fillRect(center.x + portalW / 2, pY - portalH + 1, 1.5, portalH);

  drawChest(ctx, center.x + 9, center.y + 4, 8, 6);

  if (level >= 2) {
    drawWheelbarrow(ctx, center.x - 10, center.y + 5, time);
    drawGoldPiles(ctx, center.x + 3, center.y + 7, 5, time);
  } else {
    drawGoldPiles(ctx, center.x - 6, center.y + 5, 3, time);
  }

  if (level === 3) {
    drawChest(ctx, center.x + 15, center.y + 1, 7, 5);
    drawGoldIngots(ctx, center.x + 6, center.y + 8, 4, time);
    drawGoldIngots(ctx, center.x - 14, center.y + 2, 3, time);
  }

  ctx.restore();
}

function drawChest(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.save();
  ctx.fillStyle = "#78350F";
  ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.fillStyle = "#92400E";
  ctx.fillRect(x - w / 2, y - h, w * 0.4, h);

  ctx.fillStyle = "#334155";
  ctx.fillRect(x - w / 2 + 1, y - h, 1.5, h);
  ctx.fillRect(x + w / 2 - 2.5, y - h, 1.5, h);

  ctx.fillStyle = "#F59E0B";
  ctx.fillRect(x - 1, y - h * 0.6, 2, 2.5);

  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h);
  ctx.quadraticCurveTo(x, y - h - 3, x + w / 2, y - h);
  ctx.closePath();
  ctx.fillStyle = "#92400E";
  ctx.fill();
  ctx.restore();
}

function drawWheelbarrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number
): void {
  ctx.save();
  ctx.fillStyle = "#78350F";
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 5);
  ctx.lineTo(x + 5, y - 4);
  ctx.lineTo(x + 3, y - 1);
  ctx.lineTo(x - 5, y - 1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#475569";
  ctx.beginPath();
  ctx.arc(x + 5, y, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#94A3B8";
  ctx.beginPath();
  ctx.arc(x + 5, y, 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#5C3A1E";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 3);
  ctx.lineTo(x - 9, y - 1);
  ctx.stroke();

  drawGoldPiles(ctx, x - 1, y - 4, 3, time);
  ctx.restore();
}

function drawGoldPiles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  count: number,
  time: number
): void {
  ctx.save();
  const pulse = Math.sin(time * 3 + x) * 0.2;

  for (let i = 0; i < count; i++) {
    const ox = ((i % 3) - 1) * 3;
    const oy = Math.floor(i / 3) * -2;
    ctx.beginPath();
    ctx.arc(x + ox, y + oy, 2, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? "#FBBF24" : "#F59E0B";
    ctx.fill();

    if ((i + Math.floor(time * 2)) % 3 === 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + pulse})`;
      ctx.fillRect(x + ox - 0.5, y + oy - 1, 1, 1);
    }
  }
  ctx.restore();
}

function drawGoldIngots(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  count: number,
  time: number
): void {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const ix = x + (i % 2) * 5;
    const iy = y - Math.floor(i / 2) * 3;

    ctx.fillStyle = "#D97706";
    ctx.fillRect(ix, iy - 2, 4, 2.5);
    ctx.fillStyle = "#FDE047";
    ctx.fillRect(ix + 0.5, iy - 2, 3, 1);

    if (Math.sin(time * 4 + i) > 0.5) {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(ix + 2, iy - 2, 1, 1);
    }
  }
  ctx.restore();
}
