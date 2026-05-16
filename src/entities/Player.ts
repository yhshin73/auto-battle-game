import Phaser from 'phaser';

type PlayerAnim = 'idle' | 'walk' | 'attack' | 'hurt' | 'death';

export interface PlayerConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp: number = 100;
  maxHp: number = 100;
  speed: number = 180;
  exp: number = 0;
  level: number = 1;
  kills: number = 0;
  isInvincible: boolean = false;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private onDeath?: () => void;
  private onLevelUp?: () => void;
  private onExpChange?: (exp: number, maxExp: number) => void;
  private onHpChange?: (hp: number, maxHp: number) => void;
  private expForNextLevel: number = 50;
  private hitCooldown: number = 0;
  private currentAnim: PlayerAnim = 'idle';
  private isDead: boolean = false;
  facingAngle: number = -Math.PI / 2; // 마지막 이동 방향 (라디안)

  constructor(config: PlayerConfig) {
    super(config.scene, config.x, config.y, 'wizard_idle');
    config.scene.add.existing(this);
    config.scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDepth(10);
    this.setDisplaySize(144, 144);

    // 물리 바디를 시각 크기보다 작게 (발 부분 기준)
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(40, 48);
    body.setOffset(30, 44);

    const keyboard = config.scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      up:    keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left:  keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      down:  keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.playAnim('idle');
  }

  setCallbacks(callbacks: {
    onDeath?: () => void;
    onLevelUp?: () => void;
    onExpChange?: (exp: number, maxExp: number) => void;
    onHpChange?: (hp: number, maxHp: number) => void;
  }): void {
    this.onDeath = callbacks.onDeath;
    this.onLevelUp = callbacks.onLevelUp;
    this.onExpChange = callbacks.onExpChange;
    this.onHpChange = callbacks.onHpChange;
  }

  update(delta: number): void {
    if (this.isDead) return;
    if (this.hitCooldown > 0) this.hitCooldown -= delta;

    // hurt/attack 애니메이션 재생 중이면 이동 입력만 처리
    if (this.currentAnim === 'hurt' || this.currentAnim === 'attack') return;

    const vx =
      (this.cursors.left.isDown  || this.wasd.left.isDown  ? -1 : 0) +
      (this.cursors.right.isDown || this.wasd.right.isDown ?  1 : 0);
    const vy =
      (this.cursors.up.isDown    || this.wasd.up.isDown    ? -1 : 0) +
      (this.cursors.down.isDown  || this.wasd.down.isDown  ?  1 : 0);

    const moving = vx !== 0 || vy !== 0;

    if (moving) {
      const len = Math.sqrt(vx * vx + vy * vy);
      this.setVelocity((vx / len) * this.speed, (vy / len) * this.speed);
      if (vx !== 0) this.setFlipX(vx < 0);
      this.facingAngle = Math.atan2(vy, vx); // 이동 방향 기록
      this.playAnim('walk');
    } else {
      this.setVelocity(0, 0);
      this.playAnim('idle');
    }
  }

  takeDamage(amount: number): void {
    if (this.isInvincible || this.hitCooldown > 0 || this.isDead) return;
    this.hp = Math.max(0, this.hp - amount);
    this.hitCooldown = 600;
    this.onHpChange?.(this.hp, this.maxHp);

    if (this.hp <= 0) {
      this.die();
      return;
    }

    this.playAnim('hurt');
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (!this.isDead) this.playAnim('idle');
    });
  }

  private die(): void {
    if (this.isDead) return;
    this.isDead = true;
    this.setVelocity(0, 0);
    this.playAnim('death');
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.onDeath?.();
    });
  }

  gainExp(amount: number): void {
    this.exp += amount;
    this.onExpChange?.(this.exp, this.expForNextLevel);
    if (this.exp >= this.expForNextLevel) {
      this.exp -= this.expForNextLevel;
      this.levelUp();
    }
  }

  private levelUp(): void {
    this.level++;
    this.maxHp += 20;
    this.hp = Math.min(this.hp + 20, this.maxHp);

    const baseExpTable = [50, 100, 180, 280, 400];
    if (this.level - 1 < baseExpTable.length) {
      this.expForNextLevel = baseExpTable[this.level - 1];
    } else {
      this.expForNextLevel = Math.floor(this.expForNextLevel * 1.5);
    }

    this.onHpChange?.(this.hp, this.maxHp);
    this.onExpChange?.(this.exp, this.expForNextLevel);
    this.onLevelUp?.();
  }

  getExpForNextLevel(): number { return this.expForNextLevel; }

  healPercent(percent: number): number {
    const amount = Math.floor(this.maxHp * percent);
    const healed = Math.min(amount, this.maxHp - this.hp);
    this.hp += healed;
    this.onHpChange?.(this.hp, this.maxHp);
    return healed;
  }

  private playAnim(anim: PlayerAnim): void {
    if (this.currentAnim === anim) return;
    this.currentAnim = anim;
    this.play(`wizard_${anim}`, true);
  }
}
