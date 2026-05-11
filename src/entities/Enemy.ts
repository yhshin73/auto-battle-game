import Phaser from 'phaser';
import { EnemyData, LEVEL_SCALING } from '../data/enemies';
import { Player } from './Player';

type EnemyAnim = 'idle' | 'walk' | 'attack' | 'hurt' | 'death';

const SPRITE_PREFIX: Record<string, string> = {
  slime:  'slime',
  goblin: 'skeleton',
  orc:    'orc',
  mage:   'archer',
  boss:   'werebear',
};

const DISPLAY_SIZE: Record<string, number> = {
  slime:  112,
  goblin: 128,
  orc:    152,
  mage:   128,
  boss:   240,
};

const BODY_CFG: Record<string, { w: number; h: number; ox: number; oy: number }> = {
  slime:  { w: 44, h: 36, ox: 28, oy: 58 },
  goblin: { w: 36, h: 52, ox: 32, oy: 44 },
  orc:    { w: 44, h: 52, ox: 28, oy: 44 },
  mage:   { w: 36, h: 52, ox: 32, oy: 44 },
  boss:   { w: 56, h: 64, ox: 22, oy: 32 },
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number = 30;
  maxHp: number = 30;
  speed: number = 80;
  damage: number = 5;
  expReward: number = 5;
  isBoss: boolean = false;

  private slowTimer: number = 0;
  private stunTimer: number = 0;
  private freezeTimer: number = 0;
  private fearTimer: number = 0;
  private separationForce = new Phaser.Math.Vector2();
  private spritePrefix: string = 'slime';
  private currentAnim: EnemyAnim = 'idle';
  private isDying: boolean = false;
  // 공격 애니메이션용 쿨다운 (연속 재생 방지)
  private attackAnimCooldown: number = 0;

  init(data: EnemyData, gameLevel: number): void {
    const scaledHp     = Math.floor(data.hp     * (1 + gameLevel * LEVEL_SCALING.hpMultiplier));
    const scaledSpeed  = Math.min(data.speed * (1 + gameLevel * LEVEL_SCALING.speedMultiplier), LEVEL_SCALING.speedMax);
    const scaledDamage = Math.floor(data.damage  * (1 + gameLevel * LEVEL_SCALING.damageMultiplier));

    this.hp        = scaledHp;
    this.maxHp     = scaledHp;
    this.speed     = scaledSpeed;
    this.damage    = scaledDamage;
    this.expReward = data.expReward;
    this.isBoss    = data.isBoss;
    this.isDying   = false;
    this.attackAnimCooldown = 0;
    this.spritePrefix = SPRITE_PREFIX[data.key] ?? 'slime';

    const sz  = DISPLAY_SIZE[data.key] ?? 64;
    const cfg = BODY_CFG[data.key] ?? { w: 40, h: 48, ox: 30, oy: 48 };
    this.setDisplaySize(sz, sz);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setEnable(true);
    body.setSize(cfg.w, cfg.h);
    body.setOffset(cfg.ox, cfg.oy);

    this.setDepth(5);
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.clearTint();
    this.clearAllStatuses();
    this.currentAnim = 'idle';

    this.setTexture(this.spritePrefix + '_idle');
    this.forceAnim('idle');
  }

  updateAI(player: Player, enemies: Phaser.Physics.Arcade.Group, delta: number): void {
    if (!this.active || this.isDying) return;

    if (this.attackAnimCooldown > 0) this.attackAnimCooldown -= delta;

    // 상태이상 타이머
    if (this.stunTimer   > 0) { this.stunTimer   -= delta; this.setVelocity(0, 0); return; }
    if (this.freezeTimer > 0) { this.freezeTimer -= delta; this.setVelocity(0, 0); return; }
    if (this.slowTimer   > 0) this.slowTimer -= delta;

    const currentSpeed = this.slowTimer > 0 ? this.speed * 0.5 : this.speed;

    // 두려움: 반대로 도망
    if (this.fearTimer > 0) {
      this.fearTimer -= delta;
      const dx = this.x - player.x;
      const dy = this.y - player.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d > 0) this.setVelocity((dx / d) * currentSpeed, (dy / d) * currentSpeed);
      this.setFlipX(dx > 0);
      this.setAnim('walk');
      return;
    }

    // 분리 벡터
    this.separationForce.set(0, 0);
    const allEnemies = enemies.getChildren() as Enemy[];
    for (const other of allEnemies) {
      if (other === this || !other.active) continue;
      const ex = this.x - other.x;
      const ey = this.y - other.y;
      const ed = Math.sqrt(ex * ex + ey * ey);
      if (ed > 0 && ed < 40) {
        this.separationForce.x += (ex / ed) * (40 - ed);
        this.separationForce.y += (ey / ed) * (40 - ed);
      }
    }

    const dx   = player.x - this.x;
    const dy   = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 항상 플레이어 방향으로 이동
    if (dist > 1) {
      const nx  = dx / dist + this.separationForce.x * 0.25;
      const ny  = dy / dist + this.separationForce.y * 0.25;
      const len = Math.sqrt(nx * nx + ny * ny);
      this.setVelocity((nx / len) * currentSpeed, (ny / len) * currentSpeed);
      this.setFlipX(dx < 0);
    } else {
      this.setVelocity(0, 0);
    }

    // 거리 기반 애니메이션: 플레이어와 충분히 가까울 때만 attack
    // (displayWidth의 약 55% — 물리 바디가 실제로 닿는 거리)
    const attackThreshold = this.displayWidth * 0.55;
    if (dist < attackThreshold && this.attackAnimCooldown <= 0) {
      this.setAnim('attack');
    } else if (dist >= attackThreshold && this.currentAnim === 'attack') {
      // 플레이어가 멀어지면 즉시 walk로 전환
      this.attackAnimCooldown = 300; // 잠깐 쿨다운
      this.setAnim('walk');
    } else if (this.currentAnim !== 'attack') {
      this.setAnim('walk');
    }
  }

  takeDamage(amount: number): boolean {
    if (this.isDying) return false;
    this.hp -= amount;

    // hurt 재생 (attack 중이어도 끊음)
    this.attackAnimCooldown = 300;
    this.forceAnim('hurt');
    this.scene.time.delayedCall(220, () => {
      if (this.active && !this.isDying) this.forceAnim('walk');
    });

    return this.hp <= 0;
  }

  die(): void {
    if (this.isDying) return;
    this.isDying = true;
    this.setVelocity(0, 0);
    (this.body as Phaser.Physics.Arcade.Body).setEnable(false);

    // active=false로 즉시 설정 → 그룹 슬롯 즉시 반환 (스폰 버그 해결)
    // visible은 유지해서 death 애니메이션은 계속 재생
    this.setActive(false);

    this.forceAnim('death');

    // 애니메이션 완료 후 화면에서도 제거
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.setVisible(false);
    });
    // 안전 타임아웃 (애니메이션 로드 실패 대비)
    this.scene.time.delayedCall(700, () => {
      if (this.isDying) this.setVisible(false);
    });
  }

  applyStun(duration: number): void   { this.stunTimer   = duration; }
  applyFreeze(duration: number): void {
    this.freezeTimer = duration;
    this.setTint(0x88ddff);
    this.scene.time.delayedCall(duration, () => { if (this.active) this.clearTint(); });
  }
  applySlow(duration: number): void   { this.slowTimer   = duration; }
  applyFear(duration: number): void   { this.fearTimer   = duration; }

  private clearAllStatuses(): void {
    this.slowTimer = 0; this.stunTimer = 0;
    this.freezeTimer = 0; this.fearTimer = 0;
    this.attackAnimCooldown = 0;
  }

  // 중복 방지 setAnim (같은 애니메이션이면 무시)
  private setAnim(anim: EnemyAnim): void {
    if (this.isDying && anim !== 'death') return;
    if (this.currentAnim === anim) return;
    this.currentAnim = anim;
    const key = `${this.spritePrefix}_${anim}`;
    if (this.scene.anims.exists(key)) this.play(key, true);
  }

  // 강제 재생 (같은 애니메이션도 다시 시작)
  private forceAnim(anim: EnemyAnim): void {
    if (this.isDying && anim !== 'death') return;
    this.currentAnim = anim;
    const key = `${this.spritePrefix}_${anim}`;
    if (this.scene.anims.exists(key)) this.play(key, true);
  }
}
