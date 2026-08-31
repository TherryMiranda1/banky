import type { Point } from "./projection.js";

export function drawSelectionHighlight(
  ctx: CanvasRenderingContext2D,
  center: Point,
  halfW: number,
  halfH: number,
  color = "#0284C7"
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(center.x, center.y - halfH - 2);
  ctx.lineTo(center.x + halfW + 4, center.y);
  ctx.lineTo(center.x, center.y + halfH + 2);
  ctx.lineTo(center.x - halfW - 4, center.y);
  ctx.closePath();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = `${color}28`;
  ctx.fill();
  ctx.restore();
}
