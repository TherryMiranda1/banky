export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface Caravan {
  progress: number; // 0 to 1
  speed: number;
  direction: "north" | "south" | "east" | "west";
}

export class RealmAnimator {
  private isRunning = false;
  private animFrameId: number | null = null;
  private onTickCallback: ((deltaTime: number) => void) | null = null;
  private lastTime = 0;

  public start(onTick: (deltaTime: number) => void): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.onTickCallback = onTick;
    this.lastTime = performance.now();

    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.loop(this.lastTime);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
  }

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      if (this.animFrameId !== null) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
    } else if (this.isRunning && this.animFrameId === null) {
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  };

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.onTickCallback) {
      this.onTickCallback(deltaTime);
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };
}
