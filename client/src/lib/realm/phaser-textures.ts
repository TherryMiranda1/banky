import Phaser from "phaser";
import type { PlacedCell } from "./layout";

export function ensureProceduralTextures(scene: Phaser.Scene): void {
  // 1. Partícula de Fuego
  if (!scene.textures?.exists("fire_particle")) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture("fire_particle", 8, 8);
    g.destroy();
  }
}

export function applyBuildingStatusEffect(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Image,
  cell: PlacedCell,
  baseTileHeight: number,
  particleEmitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter>,
  key?: string,
  sx?: number,
  sy?: number
): void {
  if (cell.type === "building" && cell.building?.status === "burning") {
    sprite.setTint(0xff4444);
    sprite.setAlpha(1);

    if (key && sx !== undefined && sy !== undefined && scene.textures?.exists("fire_particle")) {
      const emitter = scene.add.particles(sx, sy - baseTileHeight * 0.3, "fire_particle", {
        speedY: { min: -35, max: -15 },
        speedX: { min: -10, max: 10 },
        scale: { start: 0.7, end: 0.1 },
        alpha: { start: 0.85, end: 0 },
        tint: [0xff3300, 0xff7700, 0xffcc00],
        lifespan: { min: 400, max: 750 },
        frequency: 120,
        quantity: 2
      });
      emitter.setDepth(cell.col + cell.row + 2);
      particleEmitters.set(key, emitter);
    }
  } else if (cell.type === "building" && cell.building?.status === "ruined") {
    sprite.setTint(0x888888);
    sprite.setAlpha(0.7);
  } else {
    sprite.clearTint();
    sprite.setAlpha(1);
  }
}
