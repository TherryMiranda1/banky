import type { Point } from "../projection.js";
import {
  drawIsoShadow,
  drawIsoBox
} from "./common.js";

export function drawHeroAltar(
  ctx: CanvasRenderingContext2D,
  center: Point,
  level: 1 | 2 | 3,
  time = 0
): void {
  ctx.save();
  const radiusX = level === 3 ? 24 : level === 2 ? 20 : 16;
  drawIsoShadow(ctx, center, radiusX, radiusX * 0.5);

  const baseW = level === 3 ? 34 : level === 2 ? 28 : 22;
  const baseD = level === 3 ? 18 : level === 2 ? 14 : 11;

  drawIsoBox({
    ctx,
    center,
    width: baseW,
    depth: baseD,
    height: 5,
    leftColor: "#334155",
    rightColor: "#475569",
    topColor: "#64748B",
    yOffset: 3
  });

  drawIsoBox({
    ctx,
    center,
    width: baseW * 0.75,
    depth: baseD * 0.75,
    height: 6,
    leftColor: "#1E293B",
    rightColor: "#334155",
    topColor: "#475569",
    yOffset: -2
  });

  drawRunicGlow(ctx, center.x, center.y - 4, baseW * 0.35, time);

  if (level === 1) {
    drawBrazier(ctx, center.x, center.y - 7, 5, time);
    drawHeroPedestal(ctx, center.x, center.y - 6, level, time);
  } else if (level === 2) {
    drawBrazier(ctx, center.x - 9, center.y - 3, 4, time);
    drawBrazier(ctx, center.x + 9, center.y - 3, 4, time);
    drawHeroPedestal(ctx, center.x, center.y - 8, level, time);
  } else {
    drawBrazier(ctx, center.x - 12, center.y - 3, 4.5, time);
    drawBrazier(ctx, center.x + 12, center.y - 3, 4.5, time);
    drawAltarPillars(ctx, center.x, center.y - 8, baseW * 0.35);
    drawHeroPedestal(ctx, center.x, center.y - 12, level, time);
  }

  ctx.restore();
}

function drawRunicGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  time: number
): void {
  ctx.save();
  const pulse = Math.sin(time * 3) * 0.3 + 0.7;

  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.5, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(56, 189, 248, ${0.5 * pulse})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  const runes = 4;
  for (let i = 0; i < runes; i++) {
    const angle = (i * Math.PI * 2) / runes + time * 0.5;
    const rx = x + Math.cos(angle) * (radius * 0.7);
    const ry = y + Math.sin(angle) * (radius * 0.35);

    ctx.fillStyle = `rgba(125, 211, 252, ${0.8 * pulse})`;
    ctx.fillRect(rx - 1, ry - 1, 2, 2);
  }
  ctx.restore();
}

function drawBrazier(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  time: number
): void {
  ctx.save();
  ctx.fillStyle = "#1E293B";
  ctx.beginPath();
  ctx.moveTo(x - size, y - size);
  ctx.lineTo(x + size, y - size);
  ctx.lineTo(x + size * 0.4, y);
  ctx.lineTo(x - size * 0.4, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 0.75;
  ctx.stroke();

  const flameH = size * 1.6 + Math.sin(time * 12 + x) * 2;
  const flameW = size * 0.8 + Math.cos(time * 10 + y) * 1.5;

  ctx.beginPath();
  ctx.moveTo(x - flameW, y - size);
  ctx.quadraticCurveTo(x - flameW * 1.2, y - size - flameH * 0.6, x, y - size - flameH);
  ctx.quadraticCurveTo(x + flameW * 1.2, y - size - flameH * 0.6, x + flameW, y - size);
  ctx.closePath();
  ctx.fillStyle = "#38BDF8";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - flameW * 0.5, y - size);
  ctx.quadraticCurveTo(x - flameW * 0.6, y - size - flameH * 0.6, x, y - size - flameH * 0.85);
  ctx.quadraticCurveTo(x + flameW * 0.6, y - size - flameH * 0.6, x + flameW * 0.5, y - size);
  ctx.closePath();
  ctx.fillStyle = "#BAE6FD";
  ctx.fill();

  ctx.restore();
}

function drawHeroPedestal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  level: number,
  time: number
): void {
  ctx.save();
  ctx.fillStyle = "#D97706";
  ctx.fillRect(x - 3, y - 6, 6, 6);
  ctx.fillStyle = "#FBBF24";
  ctx.fillRect(x - 2.5, y - 6, 5, 2);

  const floatY = Math.sin(time * 3) * 2;

  if (level === 1) {
    ctx.strokeStyle = "#FDE047";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x, y - 14 + floatY);
    ctx.stroke();

    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.arc(x, y - 14 + floatY, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (level === 2) {
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x, y - 16 + floatY);
    ctx.stroke();

    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 3, y - 12 + floatY);
    ctx.lineTo(x + 3, y - 12 + floatY);
    ctx.stroke();

    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(x, y - 14 + floatY, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#FBBF24";
    ctx.beginPath();
    ctx.arc(x, y - 14 + floatY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#D97706";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#0284C7";
    ctx.beginPath();
    ctx.arc(x, y - 14 + floatY, 2, 0, Math.PI * 2);
    ctx.fill();

    const haloPulse = Math.sin(time * 4) * 2;
    ctx.strokeStyle = "rgba(254, 240, 138, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y - 14 + floatY, 7 + haloPulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawAltarPillars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  span: number
): void {
  ctx.save();
  ctx.fillStyle = "#334155";
  ctx.fillRect(x - span - 2, y - 16, 4, 16);
  ctx.fillRect(x + span - 2, y - 16, 4, 16);

  ctx.fillStyle = "#475569";
  ctx.fillRect(x - span - 3, y - 18, 6, 3);
  ctx.fillRect(x + span - 3, y - 18, 6, 3);
  ctx.restore();
}
