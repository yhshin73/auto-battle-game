import Phaser from 'phaser';

export interface ProjectileConfig {
  damage: number;
  piercing: boolean;
  dotDamage?: number;
  dotDuration?: number;
  freezeChance?: number;
  stunDuration?: number;
  slowDuration?: number;
  fearChance?: number;
  explodeRadius?: number;
  instantKillThreshold?: number;
  // 비주얼
  animKey?: string;   // PreloadScene에서 등록된 anim key (e.g. 'effect_magic1')
  tint?: number;
  displayW?: number;
  displayH?: number;
}

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  config!: ProjectileConfig;

  init(x: number, y: number, vx: number, vy: number, config: ProjectileConfig): void {
    this.config = { ...config };

    const w = config.displayW ?? 120;
    const h = config.displayH ?? 120;

    // 애니메이션 스프라이트 적용
    if (config.animKey && this.scene.anims.exists(config.animKey)) {
      // animKey의 첫 프레임 텍스처 키로 세팅 후 애니메이션 재생
      const anim = this.scene.anims.get(config.animKey);
      const firstFrame = anim.frames[0];
      this.setTexture(firstFrame.textureKey, firstFrame.textureFrame);
      this.play(config.animKey, true);
      this.clearTint();
    } else {
      // 폴백: 단색 원형 텍스처
      if (this.scene.textures.exists('projectile')) {
        this.setTexture('projectile');
      }
      this.stop();
      if (config.tint) this.setTint(config.tint);
      else this.clearTint();
    }

    this.setDisplaySize(w, h);
    this.setDepth(8);
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);

    // 물리 바디: 텍스처 프레임(100x100) 기준으로 중앙에 충분한 크기 설정
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setEnable(true);
    const bSize = 50;
    body.setSize(bSize, bSize);
    body.setOffset((100 - bSize) / 2, (100 - bSize) / 2);

    body.reset(x, y);
    body.setVelocity(vx, vy);
    this.setPosition(x, y);
  }

  onHitEnemy(): boolean {
    return !this.config.piercing;
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.stop();
    (this.body as Phaser.Physics.Arcade.Body)?.setVelocity(0, 0);
  }
}
