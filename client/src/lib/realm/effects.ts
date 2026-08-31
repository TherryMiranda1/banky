import type { ProjectionConfig } from "./projection.js";
import { gridToScreen } from "./projection.js";
import type { Caravan, Particle } from "./animator.js";

export function renderAtmosphere(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  health: string
): void {
  const bgGradient = ctx.createRadialGradient(
    width / 2,
    height * 0.45,
    30,
    width / 2,
    height * 0.5,
    Math.max(width, height) * 0.75
  );

  bgGradient.addColorStop(0, "#82BD2E");
  bgGradient.addColorStop(0.5, "#6E9F24");
  bgGradient.addColorStop(1, "#547E19");

  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  if (health === "crisis") {
    ctx.fillStyle = "rgba(239, 68, 68, 0.12)";
    ctx.fillRect(0, 0, width, height);
  } else if (health === "struggling") {
    ctx.fillStyle = "rgba(245, 158, 11, 0.08)";
    ctx.fillRect(0, 0, width, height);
  }
}

export function renderCaravans(
  ctx: CanvasRenderingContext2D,
  caravans: Caravan[],
  config: ProjectionConfig,
  hasIncome: boolean
): void {
  if (!hasIncome) return;

  ctx.save();
  for (const c of caravans) {
    const startCol = c.direction === "north" ? 3 : 1;
    const startRow = c.direction === "north" ? 1 : 3;
    const targetCol = 3;
    const targetRow = 3;

    const col = startCol + (targetCol - startCol) * c.progress;
    const row = startRow + (targetRow - startRow) * c.progress;
    const p = gridToScreen(col, row, config);

    ctx.beginPath();
    ctx.arc(p.x, p.y - 2, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#F59E0B";
    ctx.fill();
    ctx.strokeStyle = "#78350F";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
): void {
  ctx.save();
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.fill();
  }
  ctx.restore();
}
