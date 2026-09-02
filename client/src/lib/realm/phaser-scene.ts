import Phaser from "phaser";
import type { KingdomState } from "@/lib/api/kingdom";
import { GRID_SIZE, generateKingdomLayout, type PlacedCell } from "./layout";
import { getSpriteKey, TREASURY_KEY } from "./sprite-map";
import { createBuildingCallout } from "./phaser-callouts";
import { RealmCameraController } from "./phaser-controls";
import { ensureProceduralTextures, applyBuildingStatusEffect } from "./phaser-textures";
import { SCENE_KEY, REALM_ASSET_KEYS } from "./phaser-assets";
import { ResourceFlowManager, type ResourceTarget, createSovereignCharacter } from "./phaser-effects";

export { SCENE_KEY };
export type RealmAvatar = "prince" | "princess";

export class PhaserRealmScene extends Phaser.Scene {
  private kingdomState: KingdomState | null = null;
  private selectedCell: PlacedCell | null = null;
  private hoveredCell: PlacedCell | null = null;
  private onSelectCellCallback: ((cell: PlacedCell) => void) | null = null;
  private avatar: RealmAvatar = "prince";
  private cameraController: RealmCameraController | null = null;
  private resourceFlowManager: ResourceFlowManager | null = null;

  private groundImages: Phaser.GameObjects.Image[] = [];
  private buildingSprites = new Map<string, Phaser.GameObjects.Image>();
  private calloutContainers = new Map<string, Phaser.GameObjects.Container>();
  private particleEmitters = new Map<string, Phaser.GameObjects.Particles.ParticleEmitter>();
  private cellMap = new Map<string, PlacedCell>();

  private characterSprite: Phaser.GameObjects.Image | null = null;
  private characterShadow: Phaser.GameObjects.Ellipse | null = null;
  private characterTween: Phaser.Tweens.Tween | null = null;

  private baseTileWidth = 112;
  private baseTileHeight = 56;

  constructor() {
    super({ key: SCENE_KEY });
  }

  public preload(): void {
    for (const asset of REALM_ASSET_KEYS) {
      this.load.image(asset.key, asset.path);
    }
  }

  public create(): void {
    ensureProceduralTextures(this);
    this.recalculateDimensions();
    this.cameraController = new RealmCameraController(this);
    this.resourceFlowManager = new ResourceFlowManager(this);
    this.rebuildGrid();
  }

  public updateState(state: KingdomState): void {
    this.kingdomState = state;
    if (this.scene?.isActive?.()) this.rebuildGrid();
  }

  public setAvatar(avatar: RealmAvatar): void {
    this.avatar = avatar;
    if (this.characterSprite?.active) {
      const textureKey = avatar === "princess" ? "princess_character" : "prince_character";
      this.characterSprite.setTexture(textureKey);
    }
  }

  public setSelectedCell(cell: PlacedCell | null): void {
    this.selectedCell = cell;
  }

  public getSelectedCell(): PlacedCell | null {
    return this.selectedCell;
  }

  public setHoveredCell(cell: PlacedCell | null): void {
    const prevKey = this.hoveredCell ? `${this.hoveredCell.col},${this.hoveredCell.row}` : null;
    const nextKey = cell ? `${cell.col},${cell.row}` : null;
    if (prevKey === nextKey) return;

    if (prevKey) {
      const prevSprite = this.buildingSprites.get(prevKey);
      const prevCell = this.cellMap.get(prevKey);
      if (prevSprite && prevCell) {
        applyBuildingStatusEffect(this, prevSprite, prevCell, this.baseTileHeight, this.particleEmitters);
      }
    }

    this.hoveredCell = cell;
    if (nextKey) {
      const nextSprite = this.buildingSprites.get(nextKey);
      if (nextSprite) nextSprite.setTint(0xdddddd);
    }
  }

  public getHoveredCell(): PlacedCell | null {
    return this.hoveredCell;
  }

  public setOnSelectCell(callback: ((cell: PlacedCell) => void) | null): void {
    this.onSelectCellCallback = callback;
  }

  public zoomIn(): number {
    return this.cameraController?.zoomIn() ?? 1;
  }

  public zoomOut(): number {
    return this.cameraController?.zoomOut() ?? 1;
  }

  public resetCamera(): void {
    this.cameraController?.resetCamera();
  }

  public getZoom(): number {
    return this.cameraController?.getZoom() ?? 1;
  }

  public onZoomChange(callback: (zoom: number) => void): (() => void) | undefined {
    return this.cameraController?.onZoomChange(callback);
  }

  public handleResize(width?: number, height?: number): void {
    if (!this.scene?.isActive?.()) return;
    this.recalculateDimensions(width, height);
    this.rebuildGrid();
  }

  private recalculateDimensions(customWidth?: number, customHeight?: number): void {
    const width = customWidth || this.scale?.width || 600;
    const height = customHeight || this.scale?.height || 400;
    const scale = Math.min(width / 480, height / 360, 1.3);
    this.baseTileWidth = Math.max(84, Math.floor(112 * scale));
    this.baseTileHeight = Math.floor(this.baseTileWidth / 2);
  }

  private rebuildGrid(): void {
    this.cleanupGameObjects();
    if (!this.kingdomState || !this.scale) return;

    const width = this.scale.width || 600;
    const height = this.scale.height || 400;
    const halfW = this.baseTileWidth / 2;
    const halfH = this.baseTileHeight / 2;

    const centerCol = Math.floor(GRID_SIZE / 2);
    const centerRow = Math.floor(GRID_SIZE / 2);
    const originX = width / 2;
    const originY = height / 2 - (centerCol + centerRow) * halfH;

    const cells = generateKingdomLayout(this.kingdomState);
    const buildingTargets: ResourceTarget[] = [];
    let treasuryX = originX;
    let treasuryY = originY + (centerCol + centerRow) * halfH;

    for (const cell of cells) {
      const sx = originX + (cell.col - cell.row) * halfW;
      const sy = originY + (cell.col + cell.row) * halfH;
      const key = `${cell.col},${cell.row}`;
      const depth = cell.col + cell.row;

      this.cellMap.set(key, cell);

      // 1. Suelo Base (Césped o Suelo con Rocas)
      const baseTileKey = cell.type === "road" || cell.type === "plaza" ? "ground_rocks" : "ground";
      const ground = this.add.image(sx, sy, baseTileKey);
      ground.setDisplaySize(this.baseTileWidth, this.baseTileHeight);
      ground.setDepth(depth);
      this.groundImages.push(ground);

      // 2. Elementos Naturales Superpuestos (Árboles, Rocas, Agua)
      if (cell.type === "tree" || cell.type === "rock" || cell.type === "water") {
        const prop = this.add.image(sx, sy, cell.type);
        prop.setDisplaySize(this.baseTileWidth, this.baseTileHeight);
        prop.setDepth(depth + 1);
        this.groundImages.push(prop);
      }

      // 3. Edificios y Tesoro Superpuestos (+50% escala)
      if (cell.type === "building" || cell.type === "treasury") {
        const spriteKey = cell.type === "treasury" ? TREASURY_KEY : getSpriteKey(cell.building);
        const buildingW = Math.round(this.baseTileWidth * 1.5);
        const buildingH = Math.round(this.baseTileHeight * 1.5);

        if (cell.type === "treasury") {
          treasuryX = sx;
          treasuryY = sy;
        } else if (cell.building) {
          buildingTargets.push({
            x: sx,
            y: sy,
            spentAmount: cell.building.spentAmount,
            depth
          });
        }

        const sprite = this.add.image(sx, sy, spriteKey);
        sprite.setDisplaySize(buildingW, buildingH);
        sprite.setDepth(depth + 1);
        sprite.setInteractive({ useHandCursor: true });

        applyBuildingStatusEffect(this, sprite, cell, this.baseTileHeight, this.particleEmitters, key, sx, sy);

        sprite.on("pointerover", () => this.setHoveredCell(cell));
        sprite.on("pointerout", () => this.setHoveredCell(null));
        sprite.on("pointerup", () => {
          if (!this.cameraController?.isCurrentlyDragging()) {
            this.onSelectCellCallback?.(cell);
          }
        });

        this.buildingSprites.set(key, sprite);

        if (cell.type === "building" && cell.building) {
          const callout = createBuildingCallout(
            this,
            cell,
            sx,
            sy - Math.round(buildingH * 0.65),
            () => {
              if (!this.cameraController?.isCurrentlyDragging()) {
                this.onSelectCellCallback?.(cell);
              }
            },
            (hovered) => this.setHoveredCell(hovered ? cell : null)
          );
          if (callout) {
            callout.setDepth(depth + 20);
            this.calloutContainers.set(key, callout);
          }
        }
      }
    }

    const { sprite, shadow, tween } = createSovereignCharacter(
      this,
      originX,
      originY,
      halfW,
      halfH,
      this.baseTileWidth,
      this.baseTileHeight,
      this.avatar
    );
    this.characterSprite = sprite;
    this.characterShadow = shadow;
    this.characterTween = tween;

    this.resourceFlowManager?.startFlow(treasuryX, treasuryY, buildingTargets);
  }

  private cleanupGameObjects(): void {
    this.resourceFlowManager?.stopFlow();

    for (const img of this.groundImages) img.destroy();
    this.groundImages = [];

    for (const emitter of this.particleEmitters.values()) emitter.destroy();
    this.particleEmitters.clear();

    for (const container of this.calloutContainers.values()) container.destroy();
    this.calloutContainers.clear();

    for (const sprite of this.buildingSprites.values()) sprite.destroy();
    this.buildingSprites.clear();
    this.cellMap.clear();

    this.characterTween?.destroy();
    this.characterTween = null;
    this.characterShadow?.destroy();
    this.characterShadow = null;
    this.characterSprite?.destroy();
    this.characterSprite = null;
  }

  public getCellAt(clientX: number, clientY: number): PlacedCell | null {
    if (!this.kingdomState || this.cameraController?.isCurrentlyDragging()) return null;
    const canvas = this.game?.canvas;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 400;
    const halfW = this.baseTileWidth / 2;
    const halfH = this.baseTileHeight / 2;

    const centerCol = Math.floor(GRID_SIZE / 2);
    const centerRow = Math.floor(GRID_SIZE / 2);
    const originX = width / 2;
    const originY = height / 2 - (centerCol + centerRow) * halfH;

    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    const worldPoint = this.cameras.main.getWorldPoint(screenX, screenY);
    const relX = worldPoint.x - originX;
    const relY = worldPoint.y - originY;

    const col = Math.floor((relY / halfH + relX / halfW) / 2);
    const row = Math.floor((relY / halfH - relX / halfW) / 2);

    return this.cellMap.get(`${col},${row}`) || null;
  }
}
