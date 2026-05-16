import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { DropItem } from '../entities/DropItem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { DropSystem } from '../systems/DropSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { EffectSystem } from '../systems/EffectSystem';

// 맵 크기 (월드 좌표)
const MAP_W = 3200;
const MAP_H = 2000;
const WALL  = 96; // 벽 두께(픽셀)

export class GameScene extends Phaser.Scene {
  player!: Player;
  enemyGroup!: Phaser.Physics.Arcade.Group;
  projectileGroup!: Phaser.Physics.Arcade.Group;
  dropGroup!: Phaser.Physics.Arcade.Group;

  private spawnSystem!: SpawnSystem;
  private dropSystem!: DropSystem;
  weaponSystem!: WeaponSystem;
  private effectSystem!: EffectSystem;
  private hpBarGraphics!: Phaser.GameObjects.Graphics;

  private gameTime: number = 0;
  private isGameOver: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // ── 배경 바닥 타일 ────────────────────────────────
    this.add.tileSprite(0, 0, MAP_W, MAP_H, 'bg_tile').setOrigin(0).setDepth(0);

    // ── 벽 (4면) ─────────────────────────────────────
    this.buildWalls();

    // ── 물리 월드 경계 설정 ───────────────────────────
    this.physics.world.setBounds(WALL, WALL, MAP_W - WALL * 2, MAP_H - WALL * 2);

    // ── 물리 그룹 ─────────────────────────────────────
    this.enemyGroup = this.physics.add.group({
      classType: Enemy,
      defaultKey: 'slime_idle',
      maxSize: 500,   // 죽는 애니메이션 재생 중인 슬롯까지 여유 확보
      runChildUpdate: false,
    });
    this.projectileGroup = this.physics.add.group({
      classType: Projectile,
      defaultKey: 'projectile',
      maxSize: 150,
      runChildUpdate: false,
    });
    this.dropGroup = this.physics.add.group({
      classType: DropItem,
      maxSize: 200,
      runChildUpdate: false,
    });

    // ── 플레이어 (맵 중앙) ────────────────────────────
    this.player = new Player({ scene: this, x: MAP_W / 2, y: MAP_H / 2 });
    this.player.setCollideWorldBounds(true);
    this.player.setCallbacks({
      onDeath:    () => this.onPlayerDeath(),
      onLevelUp:  () => this.onPlayerLevelUp(),
      onExpChange:(exp, max) => this.emitUI('exp-change', { exp, max }),
      onHpChange: (hp, max)  => this.emitUI('hp-change', { hp, max }),
    });

    // ── 카메라 ────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // ── 적 HP 바 그래픽 ──────────────────────────────
    this.hpBarGraphics = this.add.graphics().setDepth(25);

    // ── 시스템 ────────────────────────────────────────
    this.effectSystem  = new EffectSystem(this);
    this.spawnSystem   = new SpawnSystem(this, this.enemyGroup);
    this.dropSystem    = new DropSystem(this, this.dropGroup);
    this.weaponSystem  = new WeaponSystem(
      this, this.player, this.enemyGroup, this.projectileGroup, this.effectSystem,
    );
    this.spawnSystem.setOnBossTrigger(() => this.effectSystem.bossSpawn());

    this.setupCollisions();
    this.weaponSystem.applyWeapon('magic_wand');

    this.time.delayedCall(100, () => {
      this.emitUI('hp-change',   { hp: this.player.hp,  max: this.player.maxHp });
      this.emitUI('exp-change',  { exp: this.player.exp, max: this.player.getExpForNextLevel() });
      this.emitUI('level-change',{ level: this.player.level });
      this.emitUI('kills-change',{ kills: 0 });
    });
  }

  // ── 벽 생성 ──────────────────────────────────────────
  private buildWalls(): void {
    const rects = [
      { x: 0,           y: 0,           w: MAP_W, h: WALL },           // 상단
      { x: 0,           y: MAP_H - WALL,w: MAP_W, h: WALL },           // 하단
      { x: 0,           y: 0,           w: WALL,  h: MAP_H },           // 좌측
      { x: MAP_W - WALL,y: 0,           w: WALL,  h: MAP_H },           // 우측
    ];
    for (const r of rects) {
      this.add.tileSprite(r.x, r.y, r.w, r.h, 'wall_tile').setOrigin(0).setDepth(1);
    }

    // 경계선 (밝은 테두리)
    const g = this.add.graphics().setDepth(2);
    g.lineStyle(3, 0x4444aa, 0.8);
    g.strokeRect(WALL, WALL, MAP_W - WALL * 2, MAP_H - WALL * 2);
  }

  // ── 충돌 설정 ─────────────────────────────────────────
  private setupCollisions(): void {
    // 적 ↔ 플레이어 (데미지만 처리, 공격 애니메이션은 Enemy.updateAI에서)
    this.physics.add.overlap(
      this.player,
      this.enemyGroup,
      (_p, e) => {
        const enemy = e as Enemy;
        if (!enemy.active) return;
        (this.player).takeDamage(enemy.damage);
      },
    );

    // 투사체 ↔ 적
    this.physics.add.overlap(
      this.projectileGroup,
      this.enemyGroup,
      (proj, enemy) => {
        const p = proj as Projectile;
        const e = enemy as Enemy;
        if (!p.active || !e.active) return;

        const damage = p.config.damage;
        const dead = e.takeDamage(damage);
        this.effectSystem.floatingDamage(e.x, e.y - e.displayHeight * 0.6, damage);

        if (p.config.slowDuration)  e.applySlow(p.config.slowDuration, p.config.slowRatio);
        if (p.config.stunDuration)  e.applyStun(p.config.stunDuration);
        if (p.config.freezeChance && Math.random() < p.config.freezeChance) {
          e.applyFreeze(p.config.freezeDuration ?? 2000);
          this.effectSystem.iceFreeze(e.x, e.y);
        }
        if (p.config.dotDamage && p.config.dotDuration) {
          this.applyDot(e, p.config.dotDamage, p.config.dotDuration);
        }
        // 착탄 화염 영역
        if (p.config.fireZoneRadius && p.config.fireZoneDot) {
          this.effectSystem.fireZone(
            e.x, e.y,
            p.config.fireZoneRadius,
            p.config.fireZoneDuration ?? 3000,
            p.config.fireZoneDot,
            this.enemyGroup,
            (enemy) => this.killEnemy(enemy as Enemy),
          );
        }
        if (p.config.fearChance && Math.random() < p.config.fearChance) {
          e.applyFear(p.config.fearDuration ?? 2000);
        }

        if (dead) this.killEnemy(e);
        if (p.onHitEnemy()) p.deactivate();
      },
    );

    // 드롭 ↔ 플레이어
    this.physics.add.overlap(
      this.player,
      this.dropGroup,
      (_p, item) => {
        const drop = item as DropItem;
        if (!drop.active) return;
        this.dropSystem.handlePickup(this.player, drop, (x, y) => {
          this.dropSystem.bombExplodeAll(this.player, this.enemyGroup);
          this.effectSystem.bombExplosion(x, y);
          this.emitUI('kills-change', { kills: this.player.kills });
        });
        this.emitUI('kills-change', { kills: this.player.kills });
      },
    );
  }

  private applyDot(enemy: Enemy, damage: number, duration: number): void {
    const ticks = Math.floor(duration / 500);
    for (let i = 0; i < ticks; i++) {
      this.time.delayedCall(500 * (i + 1), () => {
        if (!enemy.active) return;
        const dead = enemy.takeDamage(damage);
        if (dead) this.killEnemy(enemy);
      });
    }
  }

  private killEnemy(enemy: Enemy): void {
    if (!enemy.active) return;
    this.dropSystem.dropFromEnemy(enemy.x, enemy.y, enemy.expReward);
    this.player.kills++;
    enemy.die();
    this.emitUI('kills-change', { kills: this.player.kills });
  }

  // ── 적 HP 바 렌더링 ──────────────────────────────────
  private drawHPBars(): void {
    this.hpBarGraphics.clear();
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    for (const e of enemies) {
      if (!e.active || !e.visible) continue;
      const ratio = Math.max(0, e.hp / e.maxHp);
      const barW  = e.displayWidth * 0.38;
      const barH  = e.isBoss ? 4 : 2;
      const bx    = e.x - barW / 2;
      const by    = e.y - e.displayHeight / 2 - barH - 2;

      // 배경
      this.hpBarGraphics.fillStyle(0x000000, 0.75);
      this.hpBarGraphics.fillRect(bx, by, barW, barH);
      // HP 색상: 녹 → 주 → 빨
      const color = ratio > 0.5 ? 0x44ee44 : ratio > 0.25 ? 0xffaa00 : 0xff2222;
      this.hpBarGraphics.fillStyle(color, 1);
      this.hpBarGraphics.fillRect(bx, by, barW * ratio, barH);
      // 테두리
      this.hpBarGraphics.lineStyle(1, 0xffffff, 0.3);
      this.hpBarGraphics.strokeRect(bx, by, barW, barH);
    }
  }

  // ── 게임 이벤트 ───────────────────────────────────────
  private onPlayerDeath(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.time.delayedCall(600, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', {
        kills: this.player.kills,
        level: this.player.level,
        time:  Math.floor(this.gameTime / 1000),
      });
    });
  }

  private onPlayerLevelUp(): void {
    this.effectSystem.levelUpFlash(this.player.x, this.player.y - 80);
    this.emitUI('level-change', { level: this.player.level });
    this.scene.pause();
    this.scene.launch('LevelUpScene', {
      weapons:      this.weaponSystem.getRandomWeaponChoices(3),
      ownedWeapons: this.weaponSystem.ownedWeapons,
      onSelect: (weaponId: string) => {
        this.weaponSystem.applyWeapon(weaponId);
        this.emitUI('weapons-change', { weapons: this.weaponSystem.ownedWeapons });
        this.scene.stop('LevelUpScene');
        this.scene.resume('GameScene');
      },
    });
    this.spawnSystem.onLevelUp(this.player.level);
  }

  private emitUI(event: string, data: object): void {
    const ui = this.scene.get('UIScene');
    if (ui) ui.events.emit(event, data);
  }

  // ── 메인 루프 ─────────────────────────────────────────
  update(time: number, delta: number): void {
    if (this.isGameOver) return;

    this.gameTime += delta;
    this.emitUI('time-change', { time: Math.floor(this.gameTime / 1000) });

    this.player.update(delta);

    // 적 AI
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (enemy.active) enemy.updateAI(this.player, this.enemyGroup, delta);
    }

    // 드롭 업데이트
    const drops = this.dropGroup.getChildren() as DropItem[];
    for (const drop of drops) {
      if (drop.active) drop.update(delta);
    }

    // 화면 밖 투사체 제거 (맵 경계 기준)
    const projs = this.projectileGroup.getChildren() as Projectile[];
    for (const proj of projs) {
      if (!proj.active) continue;
      if (proj.x < 0 || proj.x > MAP_W || proj.y < 0 || proj.y > MAP_H) {
        proj.deactivate();
      }
    }

    // 적 HP 바 렌더링
    this.drawHPBars();

    // 무기 발사
    this.weaponSystem.fireAllWeapons(time);
    this.spawnSystem.update(delta);
  }
}
