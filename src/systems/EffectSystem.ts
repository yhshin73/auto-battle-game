import Phaser from 'phaser';

export class EffectSystem {
  private scene: Phaser.Scene;
  private activeEmitters: number = 0;
  private readonly MAX_EMITTERS = 10;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  bombExplosion(x: number, y: number): void {
    this.scene.cameras.main.shake(500, 0.03);

    // 충격파 원
    const shockwave = this.scene.add.circle(x, y, 10, 0xff6600, 0.8).setDepth(15);
    this.scene.tweens.add({
      targets: shockwave,
      radius: 100,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => shockwave.destroy(),
    });

    this.spawnParticleBurst(x, y, 0xff4400, 20, 200, 500);
  }

  iceFreeze(x: number, y: number): void {
    this.spawnParticleBurst(x, y, 0x88ddff, 8, 60, 400);
  }

  iceBreak(x: number, y: number): void {
    this.spawnParticleBurst(x, y, 0xaaeeff, 12, 100, 500);
  }

  expCollect(x: number, y: number): void {
    const glow = this.scene.add.circle(x, y, 15, 0x00ff88, 0.6).setDepth(12);
    this.scene.tweens.add({
      targets: glow,
      radius: 30,
      alpha: 0,
      duration: 300,
      onComplete: () => glow.destroy(),
    });
  }

  levelUpFlash(x: number, y: number): void {
    const text = this.scene.add.text(x, y, '⬆️ LEVEL UP! ⬆️', {
      fontSize: '36px',
      color: '#ffff44',
      stroke: '#000000',
      strokeThickness: 5,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    this.scene.tweens.add({
      targets: text,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  bossSpawn(): void {
    this.scene.cameras.main.zoomTo(1.5, 500, 'Power2', true, (_: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        this.scene.time.delayedCall(300, () => {
          this.scene.cameras.main.zoomTo(1.0, 400, 'Power2');
        });
      }
    });
  }

  lightSanctuary(x: number, y: number): void {
    const circle = this.scene.add.circle(x, y, 120, 0xffffaa, 0.15).setDepth(4);
    const border = this.scene.add.circle(x, y, 120, 0xffffaa, 0).setDepth(4)
      .setStrokeStyle(2, 0xffffaa, 0.6);
    this.scene.tweens.add({
      targets: [circle, border],
      alpha: 0,
      duration: 3000,
      onComplete: () => { circle.destroy(); border.destroy(); },
    });
  }

  private spawnParticleBurst(x: number, y: number, color: number, count: number, spread: number, lifetime: number): void {
    if (this.activeEmitters >= this.MAX_EMITTERS) return;
    this.activeEmitters++;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Phaser.Math.Between(30, spread);
      const px = x + Math.cos(angle) * 5;
      const py = y + Math.sin(angle) * 5;

      const hex = '#' + color.toString(16).padStart(6, '0');
      const particle = this.scene.add.circle(px, py, Phaser.Math.Between(3, 8), color).setDepth(12);

      this.scene.tweens.add({
        targets: particle,
        x: px + Math.cos(angle) * speed,
        y: py + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: lifetime,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }

    this.scene.time.delayedCall(lifetime, () => {
      this.activeEmitters = Math.max(0, this.activeEmitters - 1);
    });
  }

  floatingDamage(x: number, y: number, damage: number, isCrit = false): void {
    const text = this.scene.add.text(
      x + Phaser.Math.Between(-20, 20),
      y - 20,
      isCrit ? `${damage}!` : String(damage),
      {
        fontSize: isCrit ? '22px' : '16px',
        color: isCrit ? '#ffff00' : '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      },
    ).setDepth(20).setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Power1',
      onComplete: () => text.destroy(),
    });
  }

  vignetteWarning(active: boolean): void {
    // UIScene에서 HP 바 빨간 테두리로 처리
  }

  thunderLine(x1: number, y1: number, x2: number, y2: number): void {
    const g = this.scene.add.graphics().setDepth(9);
    g.lineStyle(3, 0xffff44, 1);
    g.beginPath();
    g.moveTo(x1, y1);

    // 지그재그 번개
    const dist = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const segments = Math.floor(dist / 20);
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;
    for (let i = 1; i < segments; i++) {
      const jitter = Phaser.Math.Between(-15, 15);
      g.lineTo(x1 + dx * i + jitter, y1 + dy * i + jitter);
    }
    g.lineTo(x2, y2);
    g.strokePath();

    this.scene.time.delayedCall(200, () => g.destroy());
  }
}
