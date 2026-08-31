import type { Building } from "../../api/kingdom.js";
import type { Point } from "../projection.js";
import { drawCastleTreasury } from "./castle.js";
import { drawGoldVault } from "./gold-mine.js";
import { drawElixirCollector } from "./elixir-collector.js";
import { drawArmyCamp } from "./army-camp.js";
import { drawWatchtower } from "./watchtower.js";
import { drawHeroAltar } from "./hero-altar.js";
import {
  drawMedievalHouse,
  drawMedievalGranary,
  drawMedievalTavern
} from "./town.js";
import { drawMedievalWindmill } from "./windmill.js";
import {
  drawRuinCracks,
  drawVolumetricFire
} from "./common.js";

export { drawCastleTreasury } from "./castle.js";
export { drawGoldVault } from "./gold-mine.js";
export { drawElixirCollector } from "./elixir-collector.js";
export { drawArmyCamp } from "./army-camp.js";
export { drawWatchtower } from "./watchtower.js";
export { drawHeroAltar } from "./hero-altar.js";
export {
  drawMedievalHouse,
  drawMedievalGranary,
  drawMedievalTavern
} from "./town.js";
export { drawMedievalWindmill } from "./windmill.js";

export function drawTreasury(
  ctx: CanvasRenderingContext2D,
  center: Point,
  level: 1 | 2 | 3,
  time = 0
): void {
  drawCastleTreasury(ctx, center, level, time);
}

export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  center: Point,
  building: Building,
  time = 0
): void {
  ctx.save();

  switch (building.type) {
    case "vault":
      drawGoldVault(ctx, center, building.level, time);
      break;

    case "library":
      drawElixirCollector(ctx, center, building.level, time);
      break;

    case "stable":
      drawArmyCamp(ctx, center, building.level, time);
      break;

    case "watchtower":
      drawWatchtower(ctx, center, building.level, time);
      break;

    case "market":
      drawHeroAltar(ctx, center, building.level, time);
      break;

    case "tavern":
      drawMedievalTavern(ctx, center, building.level, time);
      break;

    case "granary":
      drawMedievalGranary(ctx, center, building.level, time);
      break;

    case "windmill":
      drawMedievalWindmill(ctx, center, building.level, time);
      break;

    case "house":
    default:
      drawMedievalHouse(
        ctx,
        center,
        building.level,
        time,
        building.categoryColor || "#0284C7"
      );
      break;
  }

  if (building.status === "ruined") {
    const w = building.level === 3 ? 28 : 20;
    const h = building.level === 3 ? 24 : 18;
    drawRuinCracks(ctx, center, w, h);
    ctx.fillStyle = "rgba(15, 23, 42, 0.4)";
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, w * 0.6, w * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (building.status === "burning") {
    const fireY = center.y - (building.level === 3 ? 28 : 20);
    drawVolumetricFire(ctx, center.x - 4, fireY, time);
    drawVolumetricFire(ctx, center.x + 5, fireY + 4, time + 0.5);
    drawVolumetricSmoke(ctx, center.x, fireY - 10, time);
  }

  ctx.restore();
}

function drawVolumetricSmoke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number
): void {
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const puffAge = ((time * 2 + i * 0.8) % 3) / 3;
    const px = x + Math.sin(time * 3 + i * 1.5) * (8 * puffAge) + (i % 2 === 0 ? -3 : 3);
    const py = y - puffAge * 30;
    const pr = 4 + puffAge * 8;
    const alpha = (1 - puffAge) * 0.45;

    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(30, 41, 59, ${alpha})`;
    ctx.fill();
  }
  ctx.restore();
}
