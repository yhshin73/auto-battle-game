import Phaser from 'phaser';

export interface ProjectileConfig {
  damage: number;
  pierceCount: number;     // 0 = 관통 없음, n = n회 관통
  dotDamage?: number;
  dotDuration?: number;
  freezeChance?: number;
  freezeDuration?: number;
  stunDuration?: number;
  slowDuration?: number;
  slowRatio?: number;      // 0~1, 기본 0.5
  fearChance?: number;
  fearDuration?: number;
  explodeRadius?: number;
  instantKillThreshold?: number;
  fireZoneRadius?: number;
  fireZoneDuration?: number;
  fireZoneDot?: number;
  onKill?: (enemy: Phaser.Physics.Arcade.Sprite) => void; // 적 처치 시 호출
  // 비주얼
  animKey?: string;
  tint?: number;
  displayW?: number;
  displayH?: number;
}

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  config!: ProjectileConfig;
  private hitsRemaining: number = 0;

  init(x: number, y: number, vx: number, vy: number, config: ProjectileConfig): void {
    this.config = { ...config };
    this.hitsRemaining = config.pierceCount;

    const w = config.displayW ?? 120;
    const h = config.displayH ?? 120;

    if (config.animKey && this.scene.anims.exists(config.animKey)) {
      const anim = this.scene.anims.get(config.animKey);
      const firstFrame = anim.frames[0];
      this.setTexture(firstFrame.textureKey, firstFrame.textureFrame);
      this.play(config.animKey, true);
      this.clearTint();
    } else if (this.scene.textures.exists(config.animKey ?? 'projectile')) {
      this.setTexture(config.animKey ?? 'projectile');
      this.stop();
      if (config.tint) this.setTint(config.tint); else this.clearTint();
    } else {
      this.setTexture('projectile');
      this.stop();
      if (config.tint) this.setTint(config.tint); else this.clearTint();
    }

    this.setDisplaySize(w, h);
    this.setDepth(8);
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setEnable(true);
    const bSize = 50;
    body.setSize(bSize, bSize);
    body.setOffset((100 - bSize) / 2, (100 - bSize) / 2);

    body.reset(x, y);
    body.setVelocity(vx, vy);
    this.setPosition(x, y);
  }

  // 적에게 명중했을 때 호출 — true 반환 시 투사체 비활성화
  onHitEnemy(): boolean {
    if (this.hitsRemaining <= 0) return true;
    this.hitsRemaining--;
    return this.hitsRemaining < 0;
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.stop();
    (this.body as Phaser.Physics.Arcade.Body)?.setVelocity(0, 0);
  }
}
