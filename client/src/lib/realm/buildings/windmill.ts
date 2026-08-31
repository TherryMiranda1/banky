import type { Point } from "../projection.js";
import {
  drawIsoShadow,
  drawIsoBox
} from "./common.js";

export function drawMedievalWindmill(
  ctx: CanvasRenderingContext2D,
  center: Point,
  level: 1 | 2 | 3,
  time = 0
): void {
  ctx.save();
  const radiusX = level === 3 ? 20 : 16;
  drawIsoShadow(ctx, center, radiusX, radiusX * 0.5);

  const w = level === 3 ? 22 : 18;
  const d = level === 3 ? 13 : 10;
  const h = level === 3 ? 32 : 25;

  drawIsoBox({
    ctx,
    center,
    width: w,
    depth: d,
    height: h,
    leftColor: "#64748B",
    rightColor: "#94A3B8",
    topColor: "#CBD5E1",
    yOffset: 2
  });

  drawWindmillRoof(ctx, center.x, center.y + 2 - h, w, d, 12);
  drawWindmillBlades(ctx, center.x, center.y - h + 2, level === 3 ? 20 : 16, time);

  ctx.restore();
}

function drawWindmillRoof(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  d: number,
  roofH: number
): void {
  const hw = w / 2 + 2;
  const hd = d / 2 + 1;
  const peakY = y - roofH;

  ctx.beginPath();
  ctx.moveTo(x - hw, y);
  ctx.lineTo(x, peakY);
  ctx.lineTo(x, y + hd);
  ctx.closePath();
  ctx.fillStyle = "#0F172A";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x, peakY);
  ctx.lineTo(x + hw, y);
  ctx.lineTo(x, y + hd);
  ctx.closePath();
  ctx.fillStyle = "#1E293B";
  ctx.fill();
}

function drawWindmillBlades(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  time: number
): void {
  ctx.save();
  ctx.fillStyle = "#451A03";
  ctx.beginPath();
  ctx.arc(x, y, 2.5, 0, Math.PI * 2);
  ctx.fill();

  const angle = time * 2;
  for (let i = 0; i < 4; i++) {
    const a = angle + (i * Math.PI) / 2;
    const bx = x + Math.cos(a) * length;
    const by = y + Math.sin(a) * length;

    ctx.strokeStyle = "#5C3A1E";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(bx, by);
    ctx.stroke();

    const perp = a + Math.PI / 2;
    const px = Math.cos(perp) * 3;
    const py = Math.sin(perp) * 3;

    ctx.fillStyle = "rgba(254, 243, 199, 0.85)";
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + px, by + py);
    ctx.lineTo(x + Math.cos(a) * 4 + px, y + Math.sin(a) * 4 + py);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();
}
