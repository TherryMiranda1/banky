import type { Point } from "./projection.js";

export function drawGroundTile(
  ctx: CanvasRenderingContext2D,
  center: Point,
  halfW: number,
  halfH: number,
  seed = 0,
  isPerimeter = false
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(center.x, center.y - halfH);
  ctx.lineTo(center.x + halfW, center.y);
  ctx.lineTo(center.x, center.y + halfH);
  ctx.lineTo(center.x - halfW, center.y);
  ctx.closePath();

  const isAlt = (seed % 3) === 0;
  const isBright = (seed % 5) === 0;
  ctx.fillStyle = isBright ? "#8DC63F" : isAlt ? "#7EB82A" : "#75AD24";
  ctx.fill();

  ctx.strokeStyle = "rgba(105, 155, 30, 0.3)";
  ctx.lineWidth = 0.75;
  ctx.stroke();

  const tuft1X = center.x - halfW * 0.3 + (seed % 7);
  const tuft1Y = center.y - halfH * 0.25 + (seed % 5);
  ctx.fillStyle = "#5E8E1E";
  ctx.fillRect(tuft1X, tuft1Y, 1.5, 3);
  ctx.fillRect(tuft1X + 2, tuft1Y - 1, 1.5, 4);

  const tuft2X = center.x + halfW * 0.25 - (seed % 6);
  const tuft2Y = center.y + halfH * 0.2 + (seed % 4);
  ctx.fillRect(tuft2X, tuft2Y, 1.5, 3.5);

  if (seed % 4 === 0) {
    ctx.fillStyle = seed % 8 === 0 ? "#FDE047" : "#FEF08A";
    ctx.fillRect(tuft1X + 5, tuft1Y + 1, 2, 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(tuft1X + 6, tuft1Y, 1, 1);
  }

  const depth = isPerimeter ? 8 : 5;
  ctx.beginPath();
  ctx.moveTo(center.x - halfW, center.y);
  ctx.lineTo(center.x, center.y + halfH);
  ctx.lineTo(center.x, center.y + halfH + depth);
  ctx.lineTo(center.x - halfW, center.y + depth);
  ctx.closePath();
  ctx.fillStyle = "#5C3E28";
  ctx.fill();

  ctx.fillStyle = "#48301E";
  ctx.fillRect(center.x - halfW, center.y + depth - 2, halfW, 2);

  ctx.beginPath();
  ctx.moveTo(center.x, center.y + halfH);
  ctx.lineTo(center.x + halfW, center.y);
  ctx.lineTo(center.x + halfW, center.y + depth);
  ctx.lineTo(center.x, center.y + halfH + depth);
  ctx.closePath();
  ctx.fillStyle = "#3F2A1A";
  ctx.fill();

  ctx.restore();
}

export function drawStonePlaza(
  ctx: CanvasRenderingContext2D,
  center: Point,
  halfW: number,
  halfH: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(center.x, center.y - halfH);
  ctx.lineTo(center.x + halfW, center.y);
  ctx.lineTo(center.x, center.y + halfH);
  ctx.lineTo(center.x - halfW, center.y);
  ctx.closePath();
  ctx.fillStyle = "#D8D0BA";
  ctx.fill();
  ctx.strokeStyle = "#B5AB92";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(center.x, center.y, halfW * 0.7, halfH * 0.7, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#C8BEA5";
  ctx.fill();
  ctx.strokeStyle = "#9E947A";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(center.x - halfW * 0.7, center.y);
  ctx.lineTo(center.x + halfW * 0.7, center.y);
  ctx.moveTo(center.x, center.y - halfH * 0.7);
  ctx.lineTo(center.x, center.y + halfH * 0.7);
  ctx.strokeStyle = "#8C836A";
  ctx.lineWidth = 0.75;
  ctx.stroke();

  const stones = [
    { dx: -halfW * 0.45, dy: -halfH * 0.45, r: 3 },
    { dx: halfW * 0.45, dy: -halfH * 0.45, r: 3 },
    { dx: -halfW * 0.45, dy: halfH * 0.45, r: 3 },
    { dx: halfW * 0.45, dy: halfH * 0.45, r: 3 }
  ];

  for (const st of stones) {
    ctx.beginPath();
    ctx.arc(center.x + st.dx, center.y + st.dy, st.r, 0, Math.PI * 2);
    ctx.fillStyle = "#B5AB92";
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(center.x - halfW, center.y);
  ctx.lineTo(center.x, center.y + halfH);
  ctx.lineTo(center.x, center.y + halfH + 6);
  ctx.lineTo(center.x - halfW, center.y + 6);
  ctx.closePath();
  ctx.fillStyle = "#877D67";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(center.x, center.y + halfH);
  ctx.lineTo(center.x + halfW, center.y);
  ctx.lineTo(center.x + halfW, center.y + 6);
  ctx.lineTo(center.x, center.y + halfH + 6);
  ctx.closePath();
  ctx.fillStyle = "#6F6652";
  ctx.fill();

  ctx.restore();
}

export function drawRoadTile(
  ctx: CanvasRenderingContext2D,
  center: Point,
  halfW: number,
  halfH: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(center.x, center.y - halfH);
  ctx.lineTo(center.x + halfW, center.y);
  ctx.lineTo(center.x, center.y + halfH);
  ctx.lineTo(center.x - halfW, center.y);
  ctx.closePath();
  ctx.fillStyle = "#C4BAA2";
  ctx.fill();
  ctx.strokeStyle = "#9E947A";
  ctx.lineWidth = 1;
  ctx.stroke();

  const pavers = [
    { x: center.x - halfW * 0.35, y: center.y - halfH * 0.3, w: 10, h: 5.5, col: "#DDD6C2" },
    { x: center.x + halfW * 0.25, y: center.y - halfH * 0.35, w: 11, h: 6, col: "#CCC2AC" },
    { x: center.x - halfW * 0.15, y: center.y + halfH * 0.2, w: 12, h: 6.5, col: "#E2DCC9" },
    { x: center.x + halfW * 0.35, y: center.y + halfH * 0.15, w: 9, h: 5, col: "#B8AE96" },
    { x: center.x, y: center.y - 2, w: 10, h: 5, col: "#D0C6B0" }
  ];

  for (const p of pavers) {
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.w * 0.5, p.h * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = p.col;
    ctx.fill();
    ctx.strokeStyle = "#8A8068";
    ctx.lineWidth = 0.75;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(center.x - halfW, center.y);
  ctx.lineTo(center.x, center.y + halfH);
  ctx.lineTo(center.x, center.y + halfH + 4);
  ctx.lineTo(center.x - halfW, center.y + 4);
  ctx.closePath();
  ctx.fillStyle = "#7B715B";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(center.x, center.y + halfH);
  ctx.lineTo(center.x + halfW, center.y);
  ctx.lineTo(center.x + halfW, center.y + 4);
  ctx.lineTo(center.x, center.y + halfH + 4);
  ctx.closePath();
  ctx.fillStyle = "#635B47";
  ctx.fill();

  ctx.restore();
}

export function drawFenceDecoration(
  ctx: CanvasRenderingContext2D,
  center: Point,
  halfW: number,
  halfH: number,
  orientation: "north" | "west" | "corner"
): void {
  ctx.save();
  const postW = 3.5;
  const postH = 13;

  if (orientation === "north" || orientation === "corner") {
    const p1 = { x: center.x - halfW * 0.5, y: center.y - halfH * 0.5 };
    const p2 = { x: center.x, y: center.y - halfH };

    ctx.strokeStyle = "#6B4423";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y - 8);
    ctx.lineTo(p2.x, p2.y - 8);
    ctx.moveTo(p1.x, p1.y - 4);
    ctx.lineTo(p2.x, p2.y - 4);
    ctx.stroke();

    drawFencePost(ctx, p1.x, p1.y, postW, postH);
    drawFencePost(ctx, p2.x, p2.y, postW, postH);
  }

  if (orientation === "west" || orientation === "corner") {
    const p1 = { x: center.x - halfW * 0.5, y: center.y - halfH * 0.5 };
    const p2 = { x: center.x - halfW, y: center.y };

    ctx.strokeStyle = "#6B4423";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y - 8);
    ctx.lineTo(p2.x, p2.y - 8);
    ctx.moveTo(p1.x, p1.y - 4);
    ctx.lineTo(p2.x, p2.y - 4);
    ctx.stroke();

    drawFencePost(ctx, p1.x, p1.y, postW, postH);
    drawFencePost(ctx, p2.x, p2.y, postW, postH);
  }

  ctx.restore();
}

function drawFencePost(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = "#8B5A2B";
  ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.fillStyle = "#5C3A1E";
  ctx.fillRect(x - w / 2, y - h, w * 0.4, h);

  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h);
  ctx.lineTo(x, y - h - 3);
  ctx.lineTo(x + w / 2, y - h);
  ctx.closePath();
  ctx.fillStyle = "#A06834";
  ctx.fill();
}
