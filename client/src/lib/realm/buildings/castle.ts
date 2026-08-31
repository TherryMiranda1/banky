import type { Point } from "../projection.js";
import {
  drawIsoShadow,
  drawIsoBox,
  drawIsoCylinder,
  drawConicalRoof,
  drawMedievalSoldier
} from "./common.js";

export function drawCastleTreasury(
  ctx: CanvasRenderingContext2D,
  center: Point,
  level: 1 | 2 | 3,
  time = 0
): void {
  ctx.save();

  if (level === 1) {
    drawCastleLevel1(ctx, center, time);
  } else if (level === 2) {
    drawCastleLevel2(ctx, center, time);
  } else {
    drawCastleLevel3(ctx, center, time);
  }

  ctx.restore();
}

function drawCastleLevel1(
  ctx: CanvasRenderingContext2D,
  center: Point,
  time: number
): void {
  drawIsoShadow(ctx, center, 22, 11);

  drawIsoBox({
    ctx,
    center,
    width: 26,
    depth: 14,
    height: 14,
    leftColor: "#64748B",
    rightColor: "#94A3B8",
    topColor: "#CBD5E1",
    yOffset: 3
  });

  drawIsoBox({
    ctx,
    center,
    width: 20,
    depth: 10,
    height: 16,
    leftColor: "#475569",
    rightColor: "#64748B",
    topColor: "#94A3B8",
    yOffset: -11
  });

  drawIsoCylinder(
    ctx,
    { x: center.x, y: center.y - 27 },
    9,
    4.5,
    14,
    "#334155",
    "#64748B",
    "#94A3B8"
  );

  drawConicalRoof(
    ctx,
    { x: center.x, y: center.y - 41 },
    11,
    5.5,
    18,
    0,
    "#0284C7"
  );

  ctx.fillStyle = "#451A03";
  ctx.fillRect(center.x - 3, center.y - 6, 6, 8);
  ctx.strokeStyle = "#78350F";
  ctx.lineWidth = 1;
  ctx.strokeRect(center.x - 3, center.y - 6, 6, 8);

  ctx.fillStyle = "#FDE047";
  ctx.fillRect(center.x - 1, center.y - 32, 2, 4);

  drawMedievalSoldier(ctx, center.x + 10, center.y + 4, true, time);
}

function drawCastleLevel2(
  ctx: CanvasRenderingContext2D,
  center: Point,
  time: number
): void {
  drawIsoShadow(ctx, center, 32, 16);

  drawIsoBox({
    ctx,
    center,
    width: 42,
    depth: 22,
    height: 12,
    leftColor: "#475569",
    rightColor: "#64748B",
    topColor: "#94A3B8",
    yOffset: 4
  });

  drawIsoBox({
    ctx,
    center,
    width: 24,
    depth: 12,
    height: 22,
    leftColor: "#334155",
    rightColor: "#475569",
    topColor: "#64748B",
    yOffset: -8
  });

  const towerOffsets = [
    { x: -14, y: 1 },
    { x: 14, y: -2 }
  ];

  for (const t of towerOffsets) {
    const tCenter = { x: center.x + t.x, y: center.y + t.y };
    drawIsoCylinder(
      ctx,
      tCenter,
      7,
      3.5,
      32,
      "#334155",
      "#64748B",
      "#94A3B8"
    );

    drawConicalRoof(
      ctx,
      { x: tCenter.x, y: tCenter.y - 32 },
      8.5,
      4.25,
      16,
      0,
      "#0284C7"
    );

    ctx.fillStyle = "#FDE047";
    ctx.fillRect(tCenter.x - 1, tCenter.y - 20, 2, 3);
  }

  drawCastleGate(ctx, center.x, center.y - 2, 8, 12);
  drawBanner(ctx, center.x, center.y - 32, time, "#F59E0B");

  drawMedievalSoldier(ctx, center.x - 12, center.y + 6, false, time);
  drawMedievalSoldier(ctx, center.x + 12, center.y + 6, true, time);
}

function drawCastleLevel3(
  ctx: CanvasRenderingContext2D,
  center: Point,
  time: number
): void {
  drawIsoShadow(ctx, center, 42, 21);

  drawIsoBox({
    ctx,
    center,
    width: 52,
    depth: 26,
    height: 14,
    leftColor: "#334155",
    rightColor: "#475569",
    topColor: "#64748B",
    yOffset: 6
  });

  drawIsoBox({
    ctx,
    center,
    width: 32,
    depth: 16,
    height: 28,
    leftColor: "#1E293B",
    rightColor: "#334155",
    topColor: "#475569",
    yOffset: -8
  });

  drawIsoCylinder(
    ctx,
    { x: center.x, y: center.y - 36 },
    11,
    5.5,
    18,
    "#334155",
    "#64748B",
    "#94A3B8"
  );

  drawConicalRoof(
    ctx,
    { x: center.x, y: center.y - 54 },
    13,
    6.5,
    22,
    0,
    "#0284C7"
  );

  const bastions = [
    { x: -20, y: 3 },
    { x: 20, y: 1 },
    { x: -10, y: -9 },
    { x: 10, y: -11 }
  ];

  for (const b of bastions) {
    const bCenter = { x: center.x + b.x, y: center.y + b.y };
    drawIsoCylinder(
      ctx,
      bCenter,
      6.5,
      3.25,
      28,
      "#334155",
      "#64748B",
      "#94A3B8"
    );

    drawConicalRoof(
      ctx,
      { x: bCenter.x, y: bCenter.y - 28 },
      7.5,
      3.75,
      14,
      0,
      "#0284C7"
    );

    ctx.fillStyle = "#FDE047";
    ctx.fillRect(bCenter.x - 1, bCenter.y - 18, 2, 3);
  }

  drawCastleGate(ctx, center.x, center.y - 1, 10, 15);
  drawBanner(ctx, center.x, center.y - 56, time, "#F59E0B");

  drawMedievalSoldier(ctx, center.x - 18, center.y + 9, false, time);
  drawMedievalSoldier(ctx, center.x + 18, center.y + 9, true, time);
  drawMedievalSoldier(ctx, center.x, center.y + 11, false, time);
}

function drawCastleGate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const hw = w / 2;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - hw, y);
  ctx.lineTo(x - hw, y - h + hw);
  ctx.quadraticCurveTo(x, y - h, x + hw, y - h + hw);
  ctx.lineTo(x + hw, y);
  ctx.closePath();
  ctx.fillStyle = "#3E2723";
  ctx.fill();
  ctx.strokeStyle = "#1A0F0D";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.strokeStyle = "#5D4037";
  ctx.lineWidth = 0.75;
  for (let i = -hw + 2; i < hw; i += 2.5) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i, y - h + 4);
    ctx.stroke();
  }

  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 0.8;
  for (let row = y - 3; row > y - h + 3; row -= 3) {
    ctx.beginPath();
    ctx.moveTo(x - hw + 1, row);
    ctx.lineTo(x + hw - 1, row);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBanner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = "#78350F";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + 6);
  ctx.lineTo(x, y - 18);
  ctx.stroke();

  const wave1 = Math.sin(time * 5) * 2.5;
  const wave2 = Math.cos(time * 5) * 2;

  ctx.beginPath();
  ctx.moveTo(x, y - 18);
  ctx.lineTo(x + 11 + wave1, y - 16 + wave2);
  ctx.lineTo(x + 8 + wave1, y - 11);
  ctx.lineTo(x + 11 + wave1, y - 6 - wave2);
  ctx.lineTo(x, y - 8);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "#B45309";
  ctx.lineWidth = 0.75;
  ctx.stroke();

  ctx.fillStyle = "#FEF08A";
  ctx.beginPath();
  ctx.arc(x + 5 + wave1 * 0.5, y - 12, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y - 19, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = "#FDE047";
  ctx.fill();

  ctx.restore();
}
