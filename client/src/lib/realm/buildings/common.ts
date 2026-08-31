import type { Point } from "../projection.js";

export function adjustBrightness(hex: string, percent: number): string {
  let color = hex.replace(/^#/, "");
  if (color.length === 3) {
    color = color.split("").map((c) => c + c).join("");
  }
  if (color.length !== 6) return hex;

  const num = parseInt(color, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function drawIsoShadow(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radiusX: number,
  radiusY = radiusX * 0.5
): void {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(center.x, center.y + 2, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(15, 30, 10, 0.45)";
  ctx.fill();
  ctx.restore();
}

export interface IsoBoxOptions {
  ctx: CanvasRenderingContext2D;
  center: Point;
  width: number;
  depth: number;
  height: number;
  leftColor: string;
  rightColor: string;
  topColor: string;
  yOffset?: number;
}

export function drawIsoBox({
  ctx,
  center,
  width,
  depth,
  height,
  leftColor,
  rightColor,
  topColor,
  yOffset = 0
}: IsoBoxOptions): void {
  const hw = width / 2;
  const hd = depth / 2;
  const baseY = center.y + yOffset;
  const topY = baseY - height;

  ctx.beginPath();
  ctx.moveTo(center.x - hw, baseY);
  ctx.lineTo(center.x, baseY + hd);
  ctx.lineTo(center.x, topY + hd);
  ctx.lineTo(center.x - hw, topY);
  ctx.closePath();
  ctx.fillStyle = leftColor;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 0.75;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(center.x, baseY + hd);
  ctx.lineTo(center.x + hw, baseY);
  ctx.lineTo(center.x + hw, topY);
  ctx.lineTo(center.x, topY + hd);
  ctx.closePath();
  ctx.fillStyle = rightColor;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 0.75;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(center.x, topY - hd);
  ctx.lineTo(center.x + hw, topY);
  ctx.lineTo(center.x, topY + hd);
  ctx.lineTo(center.x - hw, topY);
  ctx.closePath();
  ctx.fillStyle = topColor;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 0.75;
  ctx.stroke();
}

export function drawIsoCylinder(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radiusX: number,
  radiusY: number,
  height: number,
  darkColor: string,
  lightColor: string,
  topColor: string,
  yOffset = 0
): void {
  const baseY = center.y + yOffset;
  const topY = baseY - height;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(center.x, baseY, radiusX, radiusY, 0, 0, Math.PI);
  ctx.lineTo(center.x - radiusX, topY);
  ctx.ellipse(center.x, topY, radiusX, radiusY, 0, Math.PI, 0, true);
  ctx.lineTo(center.x + radiusX, baseY);
  ctx.closePath();

  const grad = ctx.createLinearGradient(center.x - radiusX, 0, center.x + radiusX, 0);
  grad.addColorStop(0, darkColor);
  grad.addColorStop(0.4, lightColor);
  grad.addColorStop(1, darkColor);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 0.75;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(center.x, topY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fillStyle = topColor;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 0.75;
  ctx.stroke();
  ctx.restore();
}

export function drawConicalRoof(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radiusX: number,
  radiusY: number,
  roofHeight: number,
  yOffset: number,
  color: string
): void {
  const baseY = center.y + yOffset;
  const peakY = baseY - roofHeight;
  const dark = adjustBrightness(color, -35);
  const light = adjustBrightness(color, 15);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(center.x - radiusX, baseY);
  ctx.lineTo(center.x, peakY);
  ctx.lineTo(center.x, baseY + radiusY);
  ctx.closePath();
  ctx.fillStyle = dark;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(center.x, peakY);
  ctx.lineTo(center.x + radiusX, baseY);
  ctx.lineTo(center.x, baseY + radiusY);
  ctx.closePath();
  ctx.fillStyle = light;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(center.x - radiusX, baseY);
  ctx.quadraticCurveTo(center.x, baseY + radiusY * 1.6, center.x + radiusX, baseY);
  ctx.lineTo(center.x, peakY);
  ctx.closePath();
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 0.75;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(center.x, peakY - 1.5, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "#F59E0B";
  ctx.fill();
  ctx.restore();
}

export function drawMedievalSoldier(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facingLeft = false,
  time = 0
): void {
  ctx.save();
  const dir = facingLeft ? -1 : 1;
  const bob = Math.sin(time * 4 + x) * 0.75;

  ctx.beginPath();
  ctx.ellipse(x, y + 1, 3.5, 1.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fill();

  ctx.fillStyle = "#334155";
  ctx.fillRect(x - 1.5, y - 4 + bob, 1.2, 4);
  ctx.fillRect(x + 0.3, y - 4 + bob, 1.2, 4);

  ctx.fillStyle = "#64748B";
  ctx.fillRect(x - 2.5, y - 9 + bob, 5, 5.5);

  ctx.fillStyle = "#94A3B8";
  ctx.beginPath();
  ctx.arc(x, y - 11 + bob, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#CBD5E1";
  ctx.fillRect(x - (dir > 0 ? 0.5 : 1.5), y - 12 + bob, 1.2, 2.5);

  ctx.save();
  ctx.translate(x + dir * 3.5, y - 7 + bob);
  ctx.beginPath();
  ctx.moveTo(0, -3.5);
  ctx.lineTo(dir * 2.5, -2);
  ctx.lineTo(dir * 2, 3.5);
  ctx.lineTo(0, 5);
  ctx.lineTo(-dir * 2, 3.5);
  ctx.lineTo(-dir * 2.5, -2);
  ctx.closePath();
  ctx.fillStyle = "#0284C7";
  ctx.fill();
  ctx.strokeStyle = "#FDE047";
  ctx.lineWidth = 0.75;
  ctx.stroke();

  ctx.fillStyle = "#FDE047";
  ctx.fillRect(-0.5, -1, 1, 3);
  ctx.restore();

  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - dir * 2.5, y - 5 + bob);
  ctx.lineTo(x - dir * 4, y - 12 + bob);
  ctx.stroke();

  ctx.restore();
}

export function drawRuinCracks(
  ctx: CanvasRenderingContext2D,
  center: Point,
  w: number,
  h: number
): void {
  ctx.save();
  ctx.strokeStyle = "#0F172A";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(center.x - w * 0.3, center.y - h * 0.7);
  ctx.lineTo(center.x - w * 0.1, center.y - h * 0.4);
  ctx.lineTo(center.x - w * 0.25, center.y - h * 0.2);
  ctx.lineTo(center.x - w * 0.05, center.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(center.x + w * 0.2, center.y - h * 0.6);
  ctx.lineTo(center.x + w * 0.35, center.y - h * 0.3);
  ctx.lineTo(center.x + w * 0.15, center.y - h * 0.1);
  ctx.stroke();

  ctx.fillStyle = "#15803D";
  ctx.beginPath();
  ctx.ellipse(center.x - w * 0.2, center.y - 2, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(center.x + w * 0.25, center.y - h * 0.35, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawVolumetricFire(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number
): void {
  ctx.save();
  const flameH = 14 + Math.sin(time * 12) * 3;
  const flameW = 8 + Math.cos(time * 10) * 2;

  ctx.beginPath();
  ctx.moveTo(x - flameW, y);
  ctx.quadraticCurveTo(x - flameW * 1.2, y - flameH * 0.6, x, y - flameH);
  ctx.quadraticCurveTo(x + flameW * 1.2, y - flameH * 0.6, x + flameW, y);
  ctx.closePath();
  ctx.fillStyle = "#DC2626";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - flameW * 0.65, y);
  ctx.quadraticCurveTo(x - flameW * 0.7, y - flameH * 0.6, x + Math.sin(time * 8) * 2, y - flameH * 0.85);
  ctx.quadraticCurveTo(x + flameW * 0.7, y - flameH * 0.6, x + flameW * 0.65, y);
  ctx.closePath();
  ctx.fillStyle = "#F59E0B";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - flameW * 0.3, y);
  ctx.quadraticCurveTo(x - flameW * 0.3, y - flameH * 0.4, x, y - flameH * 0.55);
  ctx.quadraticCurveTo(x + flameW * 0.3, y - flameH * 0.4, x + flameW * 0.3, y);
  ctx.closePath();
  ctx.fillStyle = "#FEF08A";
  ctx.fill();

  for (let i = 0; i < 3; i++) {
    const sparkX = x + Math.sin(time * 15 + i * 2) * 7;
    const sparkY = y - flameH - 3 - ((time * 30 + i * 8) % 12);
    ctx.fillStyle = "#FDE047";
    ctx.fillRect(sparkX, sparkY, 1.5, 1.5);
  }

  ctx.restore();
}
