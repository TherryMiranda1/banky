export function drawCoinIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  time = 0
): void {
  ctx.save();
  ctx.translate(x, y);

  const bob = Math.sin(time * 3) * 0.5;
  ctx.translate(0, bob);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  const outerGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
  outerGrad.addColorStop(0, "#FDE047");
  outerGrad.addColorStop(0.5, "#EAB308");
  outerGrad.addColorStop(1, "#CA8A04");
  ctx.fillStyle = outerGrad;
  ctx.fill();

  ctx.strokeStyle = "#854D0E";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
  const innerGrad = ctx.createLinearGradient(-radius, radius, radius, -radius);
  innerGrad.addColorStop(0, "#CA8A04");
  innerGrad.addColorStop(0.5, "#EAB308");
  innerGrad.addColorStop(1, "#FEF08A");
  ctx.fillStyle = innerGrad;
  ctx.fill();

  ctx.strokeStyle = "#A16207";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.font = `bold ${Math.round(radius * 0.95)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#78350F";
  ctx.fillText("¢", 0, 0.5);

  ctx.beginPath();
  ctx.ellipse(-radius * 0.35, -radius * 0.35, radius * 0.25, radius * 0.12, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.fill();

  ctx.restore();
}

export function drawElixirBottleIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  time = 0
): void {
  ctx.save();
  ctx.translate(x, y);

  const bob = Math.sin(time * 3 + 1) * 0.5;
  ctx.translate(0, bob);

  const w = size * 0.9;
  const h = size * 1.1;

  ctx.fillStyle = "#78350F";
  ctx.fillRect(-w * 0.2, -h * 0.55, w * 0.4, h * 0.15);

  ctx.fillStyle = "#92400E";
  ctx.fillRect(-w * 0.25, -h * 0.42, w * 0.5, h * 0.08);

  ctx.beginPath();
  ctx.moveTo(-w * 0.18, -h * 0.35);
  ctx.lineTo(w * 0.18, -h * 0.35);
  ctx.lineTo(w * 0.45, -h * 0.05);
  ctx.bezierCurveTo(w * 0.52, h * 0.4, -w * 0.52, h * 0.4, -w * 0.45, -h * 0.05);
  ctx.closePath();

  const glassGrad = ctx.createLinearGradient(-w * 0.5, -h * 0.5, w * 0.5, h * 0.5);
  glassGrad.addColorStop(0, "rgba(224, 242, 254, 0.85)");
  glassGrad.addColorStop(0.3, "rgba(56, 189, 248, 0.7)");
  glassGrad.addColorStop(0.7, "rgba(14, 165, 233, 0.85)");
  glassGrad.addColorStop(1, "rgba(2, 132, 199, 0.95)");
  ctx.fillStyle = glassGrad;
  ctx.fill();

  ctx.strokeStyle = "rgba(186, 230, 253, 0.9)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const swirl = Math.sin(time * 4) * (w * 0.1);
  ctx.beginPath();
  ctx.arc(swirl, h * 0.08, w * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(240, 249, 255, 0.75)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-w * 0.3, -h * 0.05);
  ctx.quadraticCurveTo(-w * 0.35, h * 0.2, -w * 0.15, h * 0.3);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.restore();
}

export function drawHeroCardIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  time = 0
): void {
  ctx.save();
  ctx.translate(x, y);

  const bob = Math.sin(time * 3 + 2) * 0.5;
  ctx.translate(0, bob);

  const w = size * 0.95;
  const h = size * 1.15;

  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 2.5);
  const cardGrad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  cardGrad.addColorStop(0, "#475569");
  cardGrad.addColorStop(0.5, "#1E293B");
  cardGrad.addColorStop(1, "#0F172A");
  ctx.fillStyle = cardGrad;
  ctx.fill();

  ctx.strokeStyle = "#F59E0B";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-w * 0.32, -h * 0.15);
  ctx.lineTo(-w * 0.2, -h * 0.35);
  ctx.lineTo(0, -h * 0.18);
  ctx.lineTo(w * 0.2, -h * 0.35);
  ctx.lineTo(w * 0.32, -h * 0.15);
  ctx.closePath();
  ctx.fillStyle = "#A855F7";
  ctx.fill();
  ctx.strokeStyle = "#E9D5FF";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, h * 0.1, w * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = "#EF4444";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, h * 0.1, w * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = "#FCA5A5";
  ctx.fill();

  ctx.restore();
}

export function drawBannerIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  time = 0
): void {
  ctx.save();
  ctx.translate(x, y);

  const wave = Math.sin(time * 4) * 1.5;
  const w = size * 1.1;
  const h = size * 1.0;

  ctx.fillStyle = "#78350F";
  ctx.fillRect(-w * 0.45, -h * 0.5, w * 0.1, h);

  ctx.beginPath();
  ctx.arc(-w * 0.4, -h * 0.5, w * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = "#F59E0B";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-w * 0.35, -h * 0.45);
  ctx.lineTo(w * 0.4 + wave * 0.4, -h * 0.45);
  ctx.lineTo(w * 0.2 + wave * 0.6, -h * 0.05);
  ctx.lineTo(w * 0.4 + wave * 0.4, h * 0.35);
  ctx.lineTo(-w * 0.35, h * 0.35);
  ctx.closePath();

  const flagGrad = ctx.createLinearGradient(-w * 0.35, -h * 0.45, w * 0.4, h * 0.35);
  flagGrad.addColorStop(0, "#DC2626");
  flagGrad.addColorStop(0.5, "#B91C1C");
  flagGrad.addColorStop(1, "#991B1B");
  ctx.fillStyle = flagGrad;
  ctx.fill();

  ctx.strokeStyle = "#FDE047";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-w * 0.15, 0);
  ctx.lineTo(w * 0.1, -h * 0.12);
  ctx.lineTo(w * 0.22, -h * 0.2);
  ctx.lineTo(w * 0.22, h * 0.08);
  ctx.lineTo(w * 0.1, 0);
  ctx.closePath();
  ctx.fillStyle = "#FBBF24";
  ctx.fill();

  ctx.restore();
}

export function drawWarningIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  time = 0
): void {
  ctx.save();
  ctx.translate(x, y);

  const pulse = Math.sin(time * 5) * 0.8;
  const s = size * 0.95;

  ctx.beginPath();
  ctx.moveTo(0, -s * 0.55 + pulse);
  ctx.lineTo(s * 0.5, s * 0.45 + pulse);
  ctx.lineTo(-s * 0.5, s * 0.45 + pulse);
  ctx.closePath();

  const warnGrad = ctx.createLinearGradient(0, -s * 0.5, 0, s * 0.5);
  warnGrad.addColorStop(0, "#EF4444");
  warnGrad.addColorStop(1, "#B91C1C");
  ctx.fillStyle = warnGrad;
  ctx.fill();

  ctx.strokeStyle = "#FEE2E2";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(-s * 0.06, -s * 0.15 + pulse, s * 0.12, s * 0.3);
  ctx.beginPath();
  ctx.arc(0, s * 0.3 + pulse, s * 0.07, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
