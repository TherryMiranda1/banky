import Phaser from "phaser";

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 1.8;
export const DEFAULT_ZOOM = 1.0;
export const ZOOM_STEP = 0.2;
const DRAG_THRESHOLD = 6;

export class RealmCameraController {
  private scene: Phaser.Scene;
  private camera: Phaser.Cameras.Scene2D.Camera;

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartScrollX = 0;
  private dragStartScrollY = 0;

  private initialPinchDistance: number | null = null;
  private initialPinchZoom = 1.0;

  private onZoomChangeCallbacks = new Set<(zoom: number) => void>();
  private zoomTween: Phaser.Tweens.Tween | null = null;
  private panTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;
    this.camera.setZoom(DEFAULT_ZOOM);
    this.setupListeners();
  }

  private setupListeners(): void {
    const input = this.scene.input;

    // 1. Wheel Zoom
    input.on("wheel", (
      pointer: Phaser.Input.Pointer,
      _gameObjects: unknown[],
      _deltaX: number,
      deltaY: number
    ) => {
      const zoomFactor = deltaY < 0 ? 1.12 : 0.88;
      this.applyZoom(this.camera.zoom * zoomFactor, pointer.x, pointer.y);
    });

    // 2. Pointer Down (Mouse click / Touch start)
    input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.isDragging = false;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.dragStartScrollX = this.camera.scrollX;
      this.dragStartScrollY = this.camera.scrollY;

      // Detect multitouch pinch start
      if (input.pointer1.isDown && input.pointer2.isDown) {
        const dx = input.pointer1.x - input.pointer2.x;
        const dy = input.pointer1.y - input.pointer2.y;
        this.initialPinchDistance = Math.hypot(dx, dy);
        this.initialPinchZoom = this.camera.zoom;
      }
    });

    // 3. Pointer Move (Mouse drag / Touch move)
    input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      // Handle pinch-to-zoom on mobile
      if (input.pointer1.isDown && input.pointer2.isDown && this.initialPinchDistance) {
        const dx = input.pointer1.x - input.pointer2.x;
        const dy = input.pointer1.y - input.pointer2.y;
        const currentDistance = Math.hypot(dx, dy);
        if (currentDistance > 0) {
          const ratio = currentDistance / this.initialPinchDistance;
          const newZoom = Phaser.Math.Clamp(this.initialPinchZoom * ratio, MIN_ZOOM, MAX_ZOOM);
          const midX = (input.pointer1.x + input.pointer2.x) / 2;
          const midY = (input.pointer1.y + input.pointer2.y) / 2;
          this.applyZoom(newZoom, midX, midY);
        }
        return;
      }

      // Handle single pointer drag
      if (!pointer.isDown) return;

      const dist = Math.hypot(pointer.x - this.dragStartX, pointer.y - this.dragStartY);
      if (dist > DRAG_THRESHOLD) {
        this.isDragging = true;
      }

      if (this.isDragging) {
        const deltaX = (pointer.x - this.dragStartX) / this.camera.zoom;
        const deltaY = (pointer.y - this.dragStartY) / this.camera.zoom;

        const maxPanX = Math.max(380, (this.camera.width || 600) * 0.9);
        const maxPanY = Math.max(300, (this.camera.height || 400) * 0.9);

        const targetScrollX = Phaser.Math.Clamp(
          this.dragStartScrollX - deltaX,
          -maxPanX,
          maxPanX
        );
        const targetScrollY = Phaser.Math.Clamp(
          this.dragStartScrollY - deltaY,
          -maxPanY,
          maxPanY
        );

        this.camera.setScroll(targetScrollX, targetScrollY);
      }
    });

    // 4. Pointer Up (Mouse release / Touch end)
    input.on("pointerup", () => {
      this.initialPinchDistance = null;
      // Allow slight cooldown so click handlers can inspect isDragging
      setTimeout(() => {
        this.isDragging = false;
      }, 50);
    });
  }

  public applyZoom(targetZoom: number, focusX?: number, focusY?: number): void {
    const clampedZoom = Phaser.Math.Clamp(targetZoom, MIN_ZOOM, MAX_ZOOM);
    if (Math.abs(clampedZoom - this.camera.zoom) < 0.001) return;

    if (focusX !== undefined && focusY !== undefined) {
      // Zoom toward cursor/pinch midpoint
      const worldBefore = this.camera.getWorldPoint(focusX, focusY);
      this.camera.setZoom(clampedZoom);
      const worldAfter = this.camera.getWorldPoint(focusX, focusY);
      this.camera.scrollX += worldBefore.x - worldAfter.x;
      this.camera.scrollY += worldBefore.y - worldAfter.y;
    } else {
      this.camera.setZoom(clampedZoom);
    }

    this.clampPanBounds();
    this.notifyZoomChange();
  }

  public zoomIn(step = ZOOM_STEP): number {
    const targetZoom = Phaser.Math.Clamp(this.camera.zoom + step, MIN_ZOOM, MAX_ZOOM);
    this.animateZoom(targetZoom);
    return targetZoom;
  }

  public zoomOut(step = ZOOM_STEP): number {
    const targetZoom = Phaser.Math.Clamp(this.camera.zoom - step, MIN_ZOOM, MAX_ZOOM);
    this.animateZoom(targetZoom);
    return targetZoom;
  }

  public resetCamera(animated = true): void {
    if (this.zoomTween) this.zoomTween.destroy();
    if (this.panTween) this.panTween.destroy();

    if (!animated) {
      this.camera.setZoom(DEFAULT_ZOOM);
      this.camera.setScroll(0, 0);
      this.notifyZoomChange();
      return;
    }

    this.scene.tweens.add({
      targets: this.camera,
      zoom: DEFAULT_ZOOM,
      scrollX: 0,
      scrollY: 0,
      duration: 320,
      ease: "Cubic.easeOut",
      onUpdate: () => this.notifyZoomChange(),
      onComplete: () => this.notifyZoomChange()
    });
  }

  private animateZoom(targetZoom: number): void {
    if (this.zoomTween) this.zoomTween.destroy();
    this.zoomTween = this.scene.tweens.add({
      targets: this.camera,
      zoom: targetZoom,
      duration: 200,
      ease: "Cubic.easeOut",
      onUpdate: () => {
        this.clampPanBounds();
        this.notifyZoomChange();
      },
      onComplete: () => {
        this.clampPanBounds();
        this.notifyZoomChange();
      }
    });
  }

  private clampPanBounds(): void {
    const maxPanX = Math.max(380, (this.camera.width || 600) * 0.9);
    const maxPanY = Math.max(300, (this.camera.height || 400) * 0.9);
    this.camera.scrollX = Phaser.Math.Clamp(this.camera.scrollX, -maxPanX, maxPanX);
    this.camera.scrollY = Phaser.Math.Clamp(this.camera.scrollY, -maxPanY, maxPanY);
  }

  public getZoom(): number {
    return this.camera.zoom;
  }

  public isCurrentlyDragging(): boolean {
    return this.isDragging;
  }

  public onZoomChange(callback: (zoom: number) => void): () => void {
    this.onZoomChangeCallbacks.add(callback);
    callback(this.camera.zoom);
    return () => {
      this.onZoomChangeCallbacks.delete(callback);
    };
  }

  private notifyZoomChange(): void {
    for (const cb of this.onZoomChangeCallbacks) {
      cb(this.camera.zoom);
    }
  }

  public destroy(): void {
    if (this.zoomTween) this.zoomTween.destroy();
    if (this.panTween) this.panTween.destroy();
    this.onZoomChangeCallbacks.clear();
  }
}
