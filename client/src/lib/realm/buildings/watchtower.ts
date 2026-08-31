import type { Point } from "../projection.js";
import {
  drawIsoShadow,
  drawIsoBox,
  drawConicalRoof
} from "./common.js";

export function drawWatchtower(
  ctx: CanvasRenderingContext2D,
  center: Point,
  level: 1 | 2 | 3,
  time = 0
): void {
  ctx.save();
  const radiusX = level === 3 ? 20 : level === 2 ? 16 : 13;
  drawIsoShadow(ctx, center, radiusX, radiusX * 0.5);

  const towerH = level === 3 ? 38 : level === 2 ? 30 : 24;

  if (level >= 2) {
    drawIsoBox({
      ctx,
      center,
      width: level === 3 ? 18 : 14,
      depth: level === 3 ? 10 : 8,
      height: level === 3 ? 12 : 8,
      leftColor: "#475569",
      rightColor: "#64748B",
      topColor: "#94A3B8",
      yOffset: 2
    });
  }

  const baseLegY = center.y + (level >= 2 ? (level === 3 ? -10 : -6) : 2);
  const platY = center.y - towerH;
  const legSpan = level === 3 ? 9 : 7;
  const topSpan = level === 3 ? 7 : 5.5;

  ctx.strokeStyle = "#5C3A1E";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(center.x - legSpan, baseLegY);
  ctx.lineTo(center.x - topSpan, platY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(center.x + legSpan, baseLegY);
  ctx.lineTo(center.x + topSpan, platY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(center.x, baseLegY + 2);
  ctx.lineTo(center.x, platY);
  ctx.stroke();

  ctx.lineWidth = 1.2;
  const midY = (baseLegY + platY) / 2;
  ctx.beginPath();
  ctx.moveTo(center.x - legSpan * 0.9, baseLegY - 4);
  ctx.lineTo(center.x + legSpan * 0.5, midY);
  ctx.moveTo(center.x + legSpan * 0.9, baseLegY - 4);
  ctx.lineTo(center.x - legSpan * 0.5, midY);

  ctx.moveTo(center.x - legSpan * 0.5, midY);
  ctx.lineTo(center.x + topSpan * 0.8, platY + 4);
  ctx.moveTo(center.x + legSpan * 0.5, midY);
  ctx.lineTo(center.x - topSpan * 0.8, platY + 4);
  ctx.stroke();

  drawLadder(ctx, center.x - legSpan - 1, baseLegY + 1, platY, time);

  drawIsoBox({
    ctx,
    center: { x: center.x, y: platY },
    width: level === 3 ? 20 : 16,
    depth: level === 3 ? 12 : 9,
    height: 3,
    leftColor: "#78350F",
    rightColor: "#92400E",
    topColor: "#B45309",
    yOffset: 0
  });

  drawRailing(ctx, center.x, platY, level === 3 ? 18 : 14, 5);
  drawArcher(ctx, center.x, platY - 3, time);

  drawConicalRoof(
    ctx,
    { x: center.x, y: platY - 14 },
    level === 3 ? 11 : 9,
    level === 3 ? 5.5 : 4.5,
    14,
    0,
    "#78350F"
  );

  ctx.restore();
}

function drawLadder(
  ctx: CanvasRenderingContext2D,
  x: number,
  bottomY: number,
  topY: number,
  _time: number
): void {
  ctx.save();
  ctx.strokeStyle = "#854D0E";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x, bottomY);
  ctx.lineTo(x + 2, topY);
  ctx.moveTo(x + 3, bottomY);
  ctx.lineTo(x + 5, topY);
  ctx.stroke();

  const numRungs = 6;
  for (let i = 0; i < numRungs; i++) {
    const t = i / (numRungs - 1);
    const ry = bottomY + (topY - bottomY) * t;
    const rx = x + 2 * t;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + 3, ry);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRailing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.save();
  ctx.strokeStyle = "#5C3A1E";
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h);
  ctx.lineTo(x, y - h + 2);
  ctx.lineTo(x + w / 2, y - h);
  ctx.stroke();

  for (let i = -w / 2 + 1; i <= w / 2 - 1; i += 3.5) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i, y - h);
    ctx.stroke();
  }
  ctx.restore();
}

function drawArcher(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number
): void {
  ctx.save();
  const bob = Math.sin(time * 3) * 0.5;

  ctx.fillStyle = "#15803D";
  ctx.fillRect(x - 1.5, y - 6 + bob, 3, 5);

  ctx.fillStyle = "#FBBF24";
  ctx.beginPath();
  ctx.arc(x, y - 8 + bob, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#166534";
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 9 + bob);
  ctx.lineTo(x + 2, y - 9 + bob);
  ctx.lineTo(x, y - 12 + bob);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#B45309";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x + 3, y - 6 + bob, 4, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.stroke();

  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x + 3 + Math.cos(-Math.PI * 0.4) * 4, y - 6 + bob + Math.sin(-Math.PI * 0.4) * 4);
  ctx.lineTo(x + 3 + Math.cos(Math.PI * 0.4) * 4, y - 6 + bob + Math.sin(Math.PI * 0.4) * 4);
  ctx.stroke();

  ctx.restore();
}
