import type { Point } from "../projection.js";
import {
  drawIsoShadow,
  drawIsoBox
} from "./common.js";

export function drawElixirCollector(
  ctx: CanvasRenderingContext2D,
  center: Point,
  level: 1 | 2 | 3,
  time = 0
): void {
  ctx.save();
  const radiusX = level === 3 ? 22 : level === 2 ? 18 : 15;
  drawIsoShadow(ctx, center, radiusX, radiusX * 0.5);

  const baseW = level === 3 ? 28 : level === 2 ? 24 : 20;
  const baseD = level === 3 ? 14 : level === 2 ? 12 : 10;

  drawIsoBox({
    ctx,
    center,
    width: baseW,
    depth: baseD,
    height: 8,
    leftColor: "#78350F",
    rightColor: "#92400E",
    topColor: "#B45309",
    yOffset: 2
  });

  const flaskY = center.y - 18;
  const flaskR = level === 3 ? 12 : level === 2 ? 10 : 8;

  drawWoodenStruts(ctx, center.x, flaskY + flaskR, flaskR + 3, 10);
  drawGlassFlask(ctx, center.x, flaskY, flaskR, time, level);
  drawCopperPipes(ctx, center.x, flaskY, flaskR, level);

  if (level >= 2) {
    drawPressureGauge(ctx, center.x + baseW * 0.35, center.y - 8, time);
  }

  ctx.restore();
}

function drawWoodenStruts(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.save();
  ctx.strokeStyle = "#5C3A1E";
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(x - w, y + h);
  ctx.lineTo(x - w * 0.4, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w, y + h);
  ctx.lineTo(x + w * 0.4, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y + h + 2);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.restore();
}

function drawGlassFlask(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  time: number,
  level: number
): void {
  ctx.save();

  const glowR = r * 1.5;
  const glow = ctx.createRadialGradient(x, y, r * 0.3, x, y, glowR);
  glow.addColorStop(0, "rgba(56, 189, 248, 0.4)");
  glow.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, glowR, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r - 1, 0, Math.PI * 2);
  ctx.clip();

  const fillLevel = y + r * 0.3;
  const wave = Math.sin(time * 3) * 1.5;

  ctx.beginPath();
  ctx.moveTo(x - r, y + r);
  ctx.lineTo(x - r, fillLevel + wave);
  ctx.quadraticCurveTo(x, fillLevel - wave, x + r, fillLevel + wave);
  ctx.lineTo(x + r, y + r);
  ctx.closePath();

  const liqGrad = ctx.createLinearGradient(x, fillLevel, x, y + r);
  liqGrad.addColorStop(0, "#38BDF8");
  liqGrad.addColorStop(0.5, "#0284C7");
  liqGrad.addColorStop(1, "#1D4ED8");
  ctx.fillStyle = liqGrad;
  ctx.fill();

  for (let i = 0; i < (level === 3 ? 6 : 3); i++) {
    const bubbleY = ((time * 15 + i * 7) % (r * 1.3));
    const bx = x + Math.sin(time * 4 + i * 2) * (r * 0.45);
    const by = y + r * 0.7 - bubbleY;
    ctx.beginPath();
    ctx.arc(bx, by, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(224, 242, 254, 0.85)";
    ctx.fill();
  }

  ctx.restore();

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(186, 230, 253, 0.7)";
  ctx.lineWidth = 1.25;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.3, Math.PI, Math.PI * 1.5);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

function drawCopperPipes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  level: number
): void {
  ctx.save();
  ctx.strokeStyle = "#B45309";
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(x + r * 0.7, y - r * 0.5);
  ctx.quadraticCurveTo(x + r * 1.5, y - r * 0.8, x + r * 1.4, y + r * 0.8);
  ctx.stroke();

  ctx.strokeStyle = "#F59E0B";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (level === 3) {
    ctx.strokeStyle = "#B45309";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y - r * 0.5);
    ctx.quadraticCurveTo(x - r * 1.5, y - r * 0.8, x - r * 1.4, y + r * 0.8);
    ctx.stroke();

    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawPressureGauge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "#FDE68A";
  ctx.fill();
  ctx.strokeStyle = "#B45309";
  ctx.lineWidth = 1;
  ctx.stroke();

  const needleAngle = Math.PI * 0.75 + Math.sin(time * 5) * 0.5;
  ctx.strokeStyle = "#DC2626";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(needleAngle) * 2.5, y + Math.sin(needleAngle) * 2.5);
  ctx.stroke();
  ctx.restore();
}
