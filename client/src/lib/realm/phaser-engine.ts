import Phaser from "phaser";
import type { KingdomState } from "@/lib/api/kingdom";
import type { PlacedCell } from "./layout";
import { PhaserRealmScene, type RealmAvatar } from "./phaser-scene";

export class PhaserRealmEngine {
  private game: Phaser.Game | null = null;
  private scene: PhaserRealmScene | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private pendingState: KingdomState | null = null;
  private pendingSelectedCell: PlacedCell | null = null;
  private pendingHoveredCell: PlacedCell | null = null;
  private pendingAvatar: RealmAvatar = "prince";
  private pendingOnSelectCell: ((cell: PlacedCell) => void) | null = null;
  private zoomChangeListeners = new Set<(zoom: number) => void>();

  public attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const rect = canvas.getBoundingClientRect();
    const width = Math.floor(rect.width || 600);
    const height = Math.floor(rect.height || 400);

    const scene = new PhaserRealmScene();
    this.scene = scene;

    const isWebGL = (() => {
      try {
        const testCanvas = document.createElement("canvas");
        return Boolean(
          window.WebGLRenderingContext &&
            (testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl"))
        );
      } catch {
        return false;
      }
    })();

    const config: Phaser.Types.Core.GameConfig = {
      type: isWebGL ? Phaser.WEBGL : Phaser.CANVAS,
      canvas: canvas,
      width,
      height,
      transparent: true,
      scene: [scene],
      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.NO_CENTER
      },
      render: {
        pixelArt: false,
        antialias: true
      },
      callbacks: {
        postBoot: () => {
          if (this.scene) {
            this.scene.setAvatar(this.pendingAvatar);
            if (this.pendingState) {
              this.scene.updateState(this.pendingState);
            }
            if (this.pendingSelectedCell) {
              this.scene.setSelectedCell(this.pendingSelectedCell);
            }
            if (this.pendingHoveredCell) {
              this.scene.setHoveredCell(this.pendingHoveredCell);
            }
            if (this.pendingOnSelectCell) {
              this.scene.setOnSelectCell(this.pendingOnSelectCell);
            }
            for (const cb of this.zoomChangeListeners) {
              this.scene.onZoomChange(cb);
            }
          }
        }
      }
    };

    this.game = new Phaser.Game(config);
  }

  public setAvatar(avatar: RealmAvatar): void {
    this.pendingAvatar = avatar;
    if (this.scene) {
      this.scene.setAvatar(avatar);
    }
  }

  public setOnSelectCell(callback: ((cell: PlacedCell) => void) | null): void {
    this.pendingOnSelectCell = callback;
    if (this.scene) {
      this.scene.setOnSelectCell(callback);
    }
  }

  public setState(state: KingdomState): void {
    this.pendingState = state;
    if (this.scene) {
      this.scene.updateState(state);
    }
  }

  public setSelectedCell(cell: PlacedCell | null): void {
    this.pendingSelectedCell = cell;
    if (this.scene) {
      this.scene.setSelectedCell(cell);
    }
  }

  public setHoveredCell(cell: PlacedCell | null): void {
    this.pendingHoveredCell = cell;
    if (this.scene) {
      this.scene.setHoveredCell(cell);
    }
  }

  public zoomIn(): number {
    return this.scene ? this.scene.zoomIn() : 1;
  }

  public zoomOut(): number {
    return this.scene ? this.scene.zoomOut() : 1;
  }

  public resetCamera(): void {
    if (this.scene) {
      this.scene.resetCamera();
    }
  }

  public getZoom(): number {
    return this.scene ? this.scene.getZoom() : 1;
  }

  public onZoomChange(callback: (zoom: number) => void): () => void {
    this.zoomChangeListeners.add(callback);
    let unsubscribe: (() => void) | undefined;
    if (this.scene) {
      unsubscribe = this.scene.onZoomChange(callback);
    }
    return () => {
      this.zoomChangeListeners.delete(callback);
      if (unsubscribe) unsubscribe();
    };
  }

  public getCellAt(clientX: number, clientY: number): PlacedCell | null {
    if (this.scene) {
      return this.scene.getCellAt(clientX, clientY);
    }
    return null;
  }

  public resize(): void {
    if (!this.game || !this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.floor(rect.width || 600);
    const height = Math.floor(rect.height || 400);

    this.game.scale.resize(width, height);
    if (this.scene) {
      this.scene.handleResize(width, height);
    }
  }

  public destroy(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
    this.scene = null;
    this.canvas = null;
    this.pendingState = null;
    this.pendingSelectedCell = null;
    this.pendingHoveredCell = null;
    this.zoomChangeListeners.clear();
  }
}
