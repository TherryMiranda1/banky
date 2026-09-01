import Phaser from "phaser";

export interface ResourceTarget {
  x: number;
  y: number;
  spentAmount: number;
  depth: number;
}

export interface SovereignCharacterObjects {
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  tween: Phaser.Tweens.Tween;
}

const UNIFORM_COIN_SIZE = 13;

export function ensureCoinTexture(scene: Phaser.Scene): void {
  if (scene.textures?.exists("gold_coin")) return;

  const size = 32;
  const g = scene.make.graphics({ x: 0, y: 0 });

  g.fillStyle(0x78350f, 1);
  g.fillCircle(size / 2, size / 2, 14);

  g.fillStyle(0xf59e0b, 1);
  g.fillCircle(size / 2, size / 2, 12.5);

  g.fillStyle(0xfbbf24, 1);
  g.fillCircle(size / 2, size / 2, 10.5);

  g.fillStyle(0xfef08a, 0.9);
  g.fillCircle(size / 2 - 3, size / 2 - 3, 5);

  g.lineStyle(1.5, 0xd97706, 0.9);
  g.strokeCircle(size / 2, size / 2, 8);
  g.fillStyle(0xb45309, 1);
  g.fillRect(size / 2 - 1, size / 2 - 3.5, 2, 7);

  g.generateTexture("gold_coin", size, size);
  g.destroy();
}

export function createSovereignCharacter(
  scene: Phaser.Scene,
  originX: number,
  originY: number,
  halfW: number,
  halfH: number,
  baseTileWidth: number,
  baseTileHeight: number,
  avatar: "prince" | "princess"
): SovereignCharacterObjects {
  const col = 9;
  const row = 10;
  const charSx = originX + (col - row) * halfW;
  const charSy = originY + (col + row) * halfH;
  const textureKey = avatar === "princess" ? "princess_character" : "prince_character";

  const shadow = scene.add.ellipse(
    charSx,
    charSy + 5,
    Math.floor(baseTileWidth * 0.48),
    Math.floor(baseTileHeight * 0.52),
    0x000000,
    0.35
  );
  shadow.setDepth(col + row + 1.2);

  const sprite = scene.add.image(charSx, charSy - 3, textureKey);
  sprite.setDisplaySize(Math.floor(baseTileWidth * 0.62), Math.floor(baseTileHeight * 1.3));
  sprite.setDepth(col + row + 1.5);

  const tween = scene.tweens.add({
    targets: sprite,
    y: charSy - 7,
    duration: 1100,
    ease: "Sine.easeInOut",
    yoyo: true,
    repeat: -1
  });

  return { sprite, shadow, tween };
}

function calculateCoinCount(spentAmount: number): number {
  if (spentAmount <= 80) return 1;
  if (spentAmount <= 220) return 2;
  if (spentAmount <= 500) return 3;
  if (spentAmount <= 900) return 4;
  return 5;
}

export class ResourceFlowManager {
  private scene: Phaser.Scene;
  private flowTimer: Phaser.Time.TimerEvent | null = null;
  private activeTweens: Phaser.Tweens.Tween[] = [];
  private activeCoins: Phaser.GameObjects.Image[] = [];
  private currentTargetIndex = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    ensureCoinTexture(scene);
  }

  public startFlow(
    treasuryX: number,
    treasuryY: number,
    targets: ResourceTarget[]
  ): void {
    this.stopFlow();
    if (targets.length === 0) return;

    this.currentTargetIndex = 0;

    this.flowTimer = this.scene.time.addEvent({
      delay: 2200,
      callback: () => {
        if (!this.scene?.scene?.isActive()) return;
        const target = targets[this.currentTargetIndex];
        this.emitCoinsToTarget(treasuryX, treasuryY, target);
        this.currentTargetIndex = (this.currentTargetIndex + 1) % targets.length;
      },
      loop: true,
      startAt: 600
    });
  }

  private emitCoinsToTarget(
    startX: number,
    startY: number,
    target: ResourceTarget
  ): void {
    const coinCount = calculateCoinCount(target.spentAmount);
    const originY = startY - 14;
    const targetY = target.y - 16;
    const midX = (startX + target.x) / 2;

    for (let i = 0; i < coinCount; i++) {
      const delay = i * 160;
      const arcHeight = 24 + i * 3;
      const midY = (originY + targetY) / 2 - arcHeight;

      this.scene.time.delayedCall(delay, () => {
        if (!this.scene?.scene?.isActive()) return;

        const coin = this.scene.add.image(startX, originY, "gold_coin");
        coin.setDisplaySize(UNIFORM_COIN_SIZE, UNIFORM_COIN_SIZE);
        coin.setAlpha(0);
        coin.setDepth(target.depth + 15);
        this.activeCoins.push(coin);

        const duration = 2200 + Math.random() * 200;

        const spinTween = this.scene.tweens.add({
          targets: coin,
          angle: 360,
          duration,
          ease: "Linear"
        });
        this.activeTweens.push(spinTween);

        const pathTween = this.scene.tweens.addCounter({
          from: 0,
          to: 1,
          duration,
          ease: "Sine.easeInOut",
          onUpdate: (tw) => {
            const t = tw.progress;
            const oneMinusT = 1 - t;
            const curX = oneMinusT * oneMinusT * startX + 2 * oneMinusT * t * midX + t * t * target.x;
            const curY = oneMinusT * oneMinusT * originY + 2 * oneMinusT * t * midY + t * t * targetY;

            coin.setPosition(curX, curY);

            if (t < 0.15) {
              coin.setAlpha(t / 0.15);
            } else if (t > 0.82) {
              coin.setAlpha((1 - t) / 0.18);
            } else {
              coin.setAlpha(1);
            }
          },
          onComplete: () => {
            coin.destroy();
            const coinIdx = this.activeCoins.indexOf(coin);
            if (coinIdx !== -1) this.activeCoins.splice(coinIdx, 1);
          }
        });

        this.activeTweens.push(pathTween);
      });
    }
  }

  public stopFlow(): void {
    this.flowTimer?.destroy();
    this.flowTimer = null;

    for (const tw of this.activeTweens) {
      if (tw.isPlaying()) tw.stop();
    }
    this.activeTweens = [];

    for (const coin of this.activeCoins) {
      coin.destroy();
    }
    this.activeCoins = [];
  }
}
