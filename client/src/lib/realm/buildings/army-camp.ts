import type { Point } from "../projection.js";
import {
  drawIsoShadow,
  drawMedievalSoldier
} from "./common.js";

export function drawArmyCamp(
  ctx: CanvasRenderingContext2D,
  center: Point,
  level: 1 | 2 | 3,
  time = 0
): void {
  ctx.save();
  const radiusX = level === 3 ? 26 : level === 2 ? 22 : 18;
  drawIsoShadow(ctx, center, radiusX, radiusX * 0.5);

  const tentX = level === 3 ? center.x - 7 : center.x - 5;
  const tentY = center.y - 4;
  drawPavilionTent(ctx, tentX, tentY, level === 3 ? 20 : 16, level === 3 ? 24 : 19, time);

  if (level === 3) {
    drawPavilionTent(ctx, center.x + 10, center.y - 10, 13, 16, time);
  }

  const fireX = level === 3 ? center.x + 8 : center.x + 6;
  const fireY = center.y + 4;
  drawCampfire(ctx, fireX, fireY, time);

  drawWeaponsRack(ctx, center.x - (level === 3 ? 16 : 12), center.y + 2);

  if (level === 1) {
    drawMedievalSoldier(ctx, center.x + 2, center.y + 7, false, time);
    drawMedievalSoldier(ctx, center.x + 12, center.y + 3, true, time);
  } else if (level === 2) {
    drawMedievalSoldier(ctx, center.x - 2, center.y + 8, false, time);
    drawMedievalSoldier(ctx, center.x + 6, center.y + 9, false, time);
    drawMedievalSoldier(ctx, center.x + 14, center.y + 5, true, time);
  } else {
    drawMedievalSoldier(ctx, center.x - 6, center.y + 9, false, time);
    drawMedievalSoldier(ctx, center.x + 2, center.y + 10, false, time);
    drawMedievalSoldier(ctx, center.x + 10, center.y + 9, true, time);
    drawMedievalSoldier(ctx, center.x + 17, center.y + 4, true, time);
  }

  ctx.restore();
}

function drawPavilionTent(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  h: number,
  time: number
): void {
  ctx.save();
  const peakY = y - h;
  const baseCenterY = y + 2;

  ctx.beginPath();
  ctx.ellipse(x, baseCenterY, r, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#1E293B";
  ctx.fill();

  const numStripes = 6;
  const stripeAngle = Math.PI / numStripes;

  for (let i = 0; i < numStripes; i++) {
    const a1 = i * stripeAngle;
    const a2 = (i + 1) * stripeAngle;
    const p1x = x + Math.cos(a1) * r;
    const p1y = baseCenterY + Math.sin(a1) * (r * 0.45);
    const p2x = x + Math.cos(a2) * r;
    const p2y = baseCenterY + Math.sin(a2) * (r * 0.45);

    ctx.beginPath();
    ctx.moveTo(x, peakY);
    ctx.lineTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? "#DC2626" : "#F8FAFC";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(x - 3, baseCenterY);
  ctx.lineTo(x, baseCenterY - 7);
  ctx.lineTo(x + 3, baseCenterY);
  ctx.closePath();
  ctx.fillStyle = "#0F172A";
  ctx.fill();

  ctx.strokeStyle = "#78350F";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, peakY + 2);
  ctx.lineTo(x, peakY - 6);
  ctx.stroke();

  const wave = Math.sin(time * 5 + x) * 1.5;
  ctx.beginPath();
  ctx.moveTo(x, peakY - 6);
  ctx.lineTo(x + 6 + wave, peakY - 4);
  ctx.lineTo(x, peakY - 2);
  ctx.closePath();
  ctx.fillStyle = "#F59E0B";
  ctx.fill();

  ctx.restore();
}

function drawCampfire(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number
): void {
  ctx.save();
  const stones = [
    { dx: -4, dy: -2 },
    { dx: 0, dy: -3 },
    { dx: 4, dy: -2 },
    { dx: 5, dy: 1 },
    { dx: 2, dy: 3 },
    { dx: -2, dy: 3 },
    { dx: -5, dy: 1 }
  ];

  ctx.fillStyle = "#64748B";
  for (const st of stones) {
    ctx.beginPath();
    ctx.arc(x + st.dx, y + st.dy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "#5C3A1E";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - 3, y + 1);
  ctx.lineTo(x + 3, y - 2);
  ctx.moveTo(x - 3, y - 2);
  ctx.lineTo(x + 3, y + 1);
  ctx.stroke();

  const flamePulse = Math.sin(time * 10) * 1.5;
  ctx.beginPath();
  ctx.arc(x, y - 2, 3 + flamePulse * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(245, 158, 11, 0.35)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - 2.5, y);
  ctx.quadraticCurveTo(x - 3, y - 4, x, y - 6 + flamePulse);
  ctx.quadraticCurveTo(x + 3, y - 4, x + 2.5, y);
  ctx.closePath();
  ctx.fillStyle = "#EA580C";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - 1.2, y);
  ctx.quadraticCurveTo(x - 1.5, y - 3, x, y - 4.5 + flamePulse);
  ctx.quadraticCurveTo(x + 1.5, y - 3, x + 1.2, y);
  ctx.closePath();
  ctx.fillStyle = "#FDE047";
  ctx.fill();

  for (let i = 0; i < 2; i++) {
    const sy = y - 7 - ((time * 12 + i * 5) % 6);
    const sx = x + Math.sin(time * 6 + i) * 2;
    ctx.fillStyle = "#FEF08A";
    ctx.fillRect(sx, sy, 1, 1);
  }

  ctx.restore();
}

function drawWeaponsRack(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): void {
  ctx.save();
  ctx.strokeStyle = "#5C3A1E";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 4, y);
  ctx.lineTo(x - 1, y - 7);
  ctx.lineTo(x + 4, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 3, y - 4);
  ctx.lineTo(x + 3, y - 4);
  ctx.stroke();

  ctx.strokeStyle = "#94A3B8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 1);
  ctx.lineTo(x - 1, y - 9);
  ctx.moveTo(x + 1, y + 1);
  ctx.lineTo(x + 2, y - 9);
  ctx.stroke();

  ctx.fillStyle = "#B91C1C";
  ctx.beginPath();
  ctx.ellipse(x, y - 2, 2.5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#FDE047";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.restore();
}
