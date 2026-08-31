import type { KingdomState } from "../api/kingdom.js";
import { gridToScreen, screenToGrid, type ProjectionConfig } from "./projection.js";
import { GRID_SIZE, generateKingdomLayout, type PlacedCell } from "./layout.js";
import {
  drawGroundTile,
  drawRoadTile,
  drawStonePlaza,
  drawFenceDecoration
} from "./tiles.js";
import { drawSelectionHighlight } from "./overlay.js";
import { drawPineTree, drawAutumnOak, drawTreasureChest } from "./nature.js";
import { drawTreasury, drawBuilding } from "./buildings/index.js";
import { RealmAnimator, type Particle, type Caravan } from "./animator.js";
import { renderAtmosphere, renderCaravans, renderParticles } from "./effects.js";
import { drawCellCallout, isPointInCallout } from "./callouts.js";

export class RealmEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private state: KingdomState | null = null;
  private animator = new RealmAnimator();

  private baseTileWidth = 64;
  private baseTileHeight = 32;
  private time = 0;

  private hoveredCell: PlacedCell | null = null;
  private selectedCell: PlacedCell | null = null;

  private particles: Particle[] = [];
  private caravans: Caravan[] = [
    { progress: 0.1, speed: 0.12, direction: "north" },
    { progress: 0.6, speed: 0.15, direction: "west" }
  ];

  public attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.resize();

    this.animator.start((dt) => {
      this.update(dt);
      this.render();
    });
  }

  public setState(state: KingdomState): void {
    this.state = state;
    this.render();
  }

  public setHoveredCell(cell: PlacedCell | null): void {
    this.hoveredCell = cell;
  }

  public setSelectedCell(cell: PlacedCell | null): void {
    this.selectedCell = cell;
  }

  public getCellAt(clientX: number, clientY: number): PlacedCell | null {
    if (!this.canvas || !this.state) return null;
    const rect = this.canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const width = rect.width || 600;
    const height = rect.height || 400;
    const halfH = this.baseTileHeight / 2;
    const originX = width / 2;
    const originY = height / 2 - (GRID_SIZE * halfH) / 2 + 10;

    const config: ProjectionConfig = {
      tileWidth: this.baseTileWidth,
      tileHeight: this.baseTileHeight,
      originX,
      originY
    };

    const cells = generateKingdomLayout(this.state);

    for (let i = cells.length - 1; i >= 0; i--) {
      const cell = cells[i];
      if (cell.type === "building" || cell.type === "treasury") {
        const point = gridToScreen(cell.col, cell.row, config);
        if (isPointInCallout(clickX, clickY, point, cell, this.time)) {
          return cell;
        }
        const dx = Math.abs(clickX - point.x);
        const dy = clickY - point.y;
        if (dx <= this.baseTileWidth / 2 && dy >= -48 && dy <= this.baseTileHeight / 2) {
          return cell;
        }
      }
    }

    const { col, row } = screenToGrid(clickX, clickY, config);
    return cells.find((c) => c.col === col && c.row === row) || null;
  }

  public resize(): void {
    if (!this.canvas || !this.ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 400;

    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);

    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);

    const scale = Math.min(width / 480, height / 360, 1.2);
    this.baseTileWidth = Math.max(48, Math.floor(64 * scale));
    this.baseTileHeight = Math.floor(this.baseTileWidth / 2);

    this.render();
  }

  private update(dt: number): void {
    if (!this.state) return;
    this.time += dt;

    for (const c of this.caravans) {
      c.progress += c.speed * dt;
      if (c.progress > 1) {
        c.progress = 0;
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    if (this.particles.length < 35) {
      this.spawnAmbientParticles();
    }
  }

  private spawnAmbientParticles(): void {
    if (!this.canvas || !this.state) return;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 400;
    const halfH = this.baseTileHeight / 2;
    const config: ProjectionConfig = {
      tileWidth: this.baseTileWidth,
      tileHeight: this.baseTileHeight,
      originX: width / 2,
      originY: height / 2 - (GRID_SIZE * halfH) / 2 + 10
    };

    const cells = generateKingdomLayout(this.state);
    for (const cell of cells) {
      const point = gridToScreen(cell.col, cell.row, config);
      if (cell.type === "building" && cell.building?.status === "burning") {
        this.particles.push({
          x: point.x + (Math.random() * 8 - 4),
          y: point.y - 30,
          vx: Math.random() * 6 - 3,
          vy: -(10 + Math.random() * 15),
          alpha: 0.8,
          size: 2 + Math.random() * 3,
          life: 0,
          maxLife: 0.8 + Math.random() * 0.6,
          color: Math.random() > 0.4 ? "#F59E0B" : "#EF4444"
        });
      } else if (cell.decoration === "chest" && Math.random() < 0.08) {
        this.particles.push({
          x: point.x + (Math.random() * 12 - 6),
          y: point.y - 6,
          vx: Math.random() * 4 - 2,
          vy: -(4 + Math.random() * 8),
          alpha: 0.9,
          size: 1.5 + Math.random() * 2,
          life: 0,
          maxLife: 0.9,
          color: "#FDE047"
        });
      }
    }
  }

  public render(): void {
    if (!this.canvas || !this.ctx || !this.state) return;

    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 400;
    const ctx = this.ctx;

    renderAtmosphere(ctx, width, height, this.state.health);

    const halfW = this.baseTileWidth / 2;
    const halfH = this.baseTileHeight / 2;
    const originX = width / 2;
    const originY = height / 2 - (GRID_SIZE * halfH) / 2 + 10;

    const config: ProjectionConfig = {
      tileWidth: this.baseTileWidth,
      tileHeight: this.baseTileHeight,
      originX,
      originY
    };

    const cells = generateKingdomLayout(this.state);

    for (const cell of cells) {
      const point = gridToScreen(cell.col, cell.row, config);
      if (cell.type === "road") {
        drawRoadTile(ctx, point, halfW, halfH);
      } else if (cell.type === "treasury") {
        drawStonePlaza(ctx, point, halfW, halfH);
      } else {
        const seed = cell.col * 7 + cell.row * 13;
        drawGroundTile(ctx, point, halfW, halfH, seed, cell.isPerimeter);
      }
    }

    for (const cell of cells) {
      const point = gridToScreen(cell.col, cell.row, config);
      if (cell.decoration === "fence_n") {
        drawFenceDecoration(ctx, point, halfW, halfH, "north");
      } else if (cell.decoration === "fence_w") {
        drawFenceDecoration(ctx, point, halfW, halfH, "west");
      } else if (cell.decoration === "fence_corner") {
        drawFenceDecoration(ctx, point, halfW, halfH, "corner");
      }
    }

    if (this.selectedCell) {
      const p = gridToScreen(this.selectedCell.col, this.selectedCell.row, config);
      drawSelectionHighlight(ctx, p, halfW, halfH, "#0284C7");
    } else if (this.hoveredCell) {
      const p = gridToScreen(this.hoveredCell.col, this.hoveredCell.row, config);
      drawSelectionHighlight(ctx, p, halfW, halfH, "rgba(2, 132, 199, 0.45)");
    }

    renderCaravans(ctx, this.caravans, config, this.state.summary.totalIncome > 0);

    for (const cell of cells) {
      const point = gridToScreen(cell.col, cell.row, config);

      if (cell.decoration === "pine") {
        drawPineTree(ctx, point, 1.05);
      } else if (cell.decoration === "autumn_oak") {
        drawAutumnOak(ctx, point, 1.05);
      } else if (cell.decoration === "chest") {
        drawTreasureChest(ctx, point, 1, this.time);
      }

      if (cell.type === "treasury") {
        drawTreasury(ctx, point, this.state.treasuryLevel, this.time);
      } else if (cell.type === "building" && cell.building) {
        drawBuilding(ctx, point, cell.building, this.time);
      }
    }

    for (const cell of cells) {
      if (cell.type === "building" || cell.type === "treasury") {
        const point = gridToScreen(cell.col, cell.row, config);
        const isHovered = this.hoveredCell?.col === cell.col && this.hoveredCell?.row === cell.row;
        const isSelected = this.selectedCell?.col === cell.col && this.selectedCell?.row === cell.row;
        drawCellCallout(ctx, point, cell, this.time, isHovered, isSelected);
      }
    }

    renderParticles(ctx, this.particles);
  }

  public destroy(): void {
    this.animator.stop();
    this.canvas = null;
    this.ctx = null;
    this.state = null;
    this.hoveredCell = null;
    this.selectedCell = null;
    this.particles = [];
  }
}
