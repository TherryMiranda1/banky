import type { Point } from "../projection.js";
import {
  drawIsoShadow,
  drawIsoBox,
  adjustBrightness
} from "./common.js";

export function drawMedievalHouse(
  ctx: CanvasRenderingContext2D,
  center: Point,
  level: 1 | 2 | 3,
  time = 0,
  accentColor = "#0284C7"
): void {
  ctx.save();
  const radiusX = level === 3 ? 22 : level === 2 ? 18 : 14;
  drawIsoShadow(ctx, center, radiusX, radiusX * 0.5);

  const w = level === 3 ? 28 : level === 2 ? 22 : 18;
  const d = level === 3 ? 16 : level === 2 ? 13 : 10;
  const h = level === 3 ? 22 : level === 2 ? 17 : 13;

  drawIsoBox({
    ctx,
    center,
    width: w,
    depth: d,
    height: h,
    leftColor: "#D1D5DB",
    rightColor: "#F3F4F6",
    topColor: "#E5E7EB",
    yOffset: 2
  });

  drawTimberFraming(ctx, center.x, center.y + 2, w, d, h);
  drawPitchedRoof(ctx, center.x, center.y + 2 - h, w, d, level === 3 ? 16 : 12, accentColor);
  drawWindow(ctx, center.x + w * 0.25, center.y - h * 0.4, 4, 5, time);

  if (level >= 2) {
    drawChimney(ctx, center.x - w * 0.3, center.y - h - 6, time);
  }

  ctx.restore();
}

export function drawMedievalGranary(
  ctx: CanvasRenderingContext2D,
  center: Point,
  level: 1 | 2 | 3,
  _time = 0
): void {
  ctx.save();
  const radiusX = level === 3 ? 22 : 17;
  drawIsoShadow(ctx, center, radiusX, radiusX * 0.5);

  const w = level === 3 ? 26 : 20;
  const d = level === 3 ? 14 : 11;
  const h = level === 3 ? 20 : 15;

  drawIsoBox({
    ctx,
    center,
    width: w,
    depth: d,
    height: h,
    leftColor: "#92400E",
    rightColor: "#B45309",
    topColor: "#D97706",
    yOffset: 2
  });

  drawPitchedRoof(ctx, center.x, center.y + 2 - h, w, d, 14, "#78350F");

  drawGrainBags(ctx, center.x + w * 0.35, center.y + 4, level);
  drawBarrel(ctx, center.x - w * 0.35, center.y + 3);

  ctx.restore();
}

export function drawMedievalTavern(
  ctx: CanvasRenderingContext2D,
  center: Point,
  level: 1 | 2 | 3,
  time = 0
): void {
  ctx.save();
  const radiusX = level === 3 ? 24 : 19;
  drawIsoShadow(ctx, center, radiusX, radiusX * 0.5);

  const w = level === 3 ? 30 : 24;
  const d = level === 3 ? 16 : 13;
  const h = level === 3 ? 22 : 17;

  drawIsoBox({
    ctx,
    center,
    width: w,
    depth: d,
    height: h,
    leftColor: "#78350F",
    rightColor: "#92400E",
    topColor: "#B45309",
    yOffset: 2
  });

  drawTimberFraming(ctx, center.x, center.y + 2, w, d, h);
  drawPitchedRoof(ctx, center.x, center.y + 2 - h, w, d, 14, "#DC2626");
  drawTavernSign(ctx, center.x + w * 0.45, center.y - h * 0.3, time);
  drawChimney(ctx, center.x - w * 0.3, center.y - h - 5, time);

  ctx.restore();
}

function drawPitchedRoof(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  d: number,
  roofH: number,
  color: string
): void {
  const hw = w / 2 + 2;
  const hd = d / 2 + 1;
  const peakY = y - roofH;

  const dark = adjustBrightness(color, -30);
  const light = adjustBrightness(color, 10);

  ctx.beginPath();
  ctx.moveTo(x - hw, y);
  ctx.lineTo(x, peakY);
  ctx.lineTo(x, y + hd);
  ctx.closePath();
  ctx.fillStyle = dark;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x, peakY);
  ctx.lineTo(x + hw, y);
  ctx.lineTo(x, y + hd);
  ctx.closePath();
  ctx.fillStyle = light;
  ctx.fill();
}

function drawTimberFraming(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  d: number,
  h: number
): void {
  const hw = w / 2;
  const hd = d / 2;
  ctx.save();
  ctx.strokeStyle = "#451A03";
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.moveTo(x - hw, y);
  ctx.lineTo(x - hw, y - h);
  ctx.moveTo(x, y + hd);
  ctx.lineTo(x, y + hd - h);
  ctx.moveTo(x + hw, y);
  ctx.lineTo(x + hw, y - h);
  ctx.stroke();

  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x, y + hd - h * 0.5);
  ctx.lineTo(x + hw, y - h * 0.5);
  ctx.moveTo(x - hw, y - h * 0.5);
  ctx.lineTo(x, y + hd - h * 0.5);
  ctx.stroke();
  ctx.restore();
}

function drawWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  time: number
): void {
  ctx.save();
  const flicker = Math.sin(time * 6 + x) * 0.15 + 0.85;
  ctx.fillStyle = `rgba(253, 224, 71, ${flicker})`;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.strokeStyle = "#451A03";
  ctx.lineWidth = 0.75;
  ctx.strokeRect(x - w / 2, y - h / 2, w, h);
  ctx.restore();
}

function drawChimney(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number
): void {
  ctx.save();
  ctx.fillStyle = "#475569";
  ctx.fillRect(x - 2, y, 4, 8);
  ctx.fillStyle = "#64748B";
  ctx.fillRect(x - 2.5, y - 1, 5, 2);

  for (let i = 0; i < 2; i++) {
    const puffY = y - 3 - ((time * 8 + i * 6) % 12);
    const puffX = x + Math.sin(time * 3 + i) * 2;
    const puffR = 1.5 + ((y - puffY) / 12) * 2;
    ctx.beginPath();
    ctx.arc(puffX, puffY, puffR, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(226, 232, 240, 0.4)";
    ctx.fill();
  }
  ctx.restore();
}

function drawGrainBags(ctx: CanvasRenderingContext2D, x: number, y: number, count: number): void {
  ctx.save();
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = "#FDE68A";
    ctx.beginPath();
    ctx.ellipse(x + (i % 2) * 3, y - i * 2, 2.5, 3.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#D97706";
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawBarrel(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.fillStyle = "#78350F";
  ctx.beginPath();
  ctx.ellipse(x, y - 2, 3, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(x - 2.5, y - 3);
  ctx.lineTo(x + 2.5, y - 3);
  ctx.moveTo(x - 2.5, y - 1);
  ctx.lineTo(x + 2.5, y - 1);
  ctx.stroke();
  ctx.restore();
}

function drawTavernSign(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  ctx.save();
  const sway = Math.sin(time * 3) * 0.1;
  ctx.translate(x, y);
  ctx.rotate(sway);

  ctx.strokeStyle = "#451A03";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(4, 0);
  ctx.lineTo(4, 3);
  ctx.stroke();

  ctx.fillStyle = "#F59E0B";
  ctx.fillRect(2, 3, 5, 4);
  ctx.strokeStyle = "#78350F";
  ctx.strokeRect(2, 3, 5, 4);

  ctx.restore();
}
