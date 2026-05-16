import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { ENEMY_DATA } from '../data/enemies';

export class SpawnSystem {
  private scene: Phaser.Scene;
  private enemyGroup: Phaser.Physics.Arcade.Group;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private spawnInterval: number = 2500;  // 시작 2.5초 간격
  private spawnCount: number = 2;        // 시작 한 번에 2마리
  private countTimer!: Phaser.Time.TimerEvent;
  private gameLevel: number = 1;
  private elapsed: number = 0;
  private onBossTrigger?: () => void;

  constructor(scene: Phaser.Scene, enemyGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.enemyGroup = enemyGroup;
    this.setupTimers();
  }

  setOnBossTrigger(cb: () => void): void {
    this.onBossTrigger = cb;
  }

  private setupTimers(): void {
    this.spawnTimer = this.scene.time.addEvent({
      delay: this.spawnInterval,
      callback: this.spawnWave,
      callbackScope: this,
      loop: true,
    });

    // 20초마다 스폰 수 +1, 최대 20마리
    this.countTimer = this.scene.time.addEvent({
      delay: 20000,
      callback: () => {
        this.spawnCount = Math.min(this.spawnCount + 1, 20);
      },
      loop: true,
    });
  }

  private spawnWave(): void {
    const currentEnemies = (this.enemyGroup.getChildren() as Enemy[]).filter(e => e.active).length;
    const toSpawn = Math.min(this.spawnCount, 80 - currentEnemies);
    for (let i = 0; i < toSpawn; i++) {
      this.spawnEnemy();
    }
  }

  private spawnEnemy(): void {
    const { width, height } = this.scene.scale;
    const camera = this.scene.cameras.main;
    const cx = camera.scrollX + width / 2;
    const cy = camera.scrollY + height / 2;
    const margin = 80;

    // 4방향 랜덤 등장
    let x: number, y: number;
    const side = Phaser.Math.Between(0, 3);
    if (side === 0) { x = cx + Phaser.Math.Between(-width / 2, width / 2); y = cy - height / 2 - margin; }
    else if (side === 1) { x = cx + Phaser.Math.Between(-width / 2, width / 2); y = cy + height / 2 + margin; }
    else if (side === 2) { x = cx - width / 2 - margin; y = cy + Phaser.Math.Between(-height / 2, height / 2); }
    else { x = cx + width / 2 + margin; y = cy + Phaser.Math.Between(-height / 2, height / 2); }

    const type = this.selectEnemyType();
    const data = ENEMY_DATA[type];
    // 적 종류에 맞는 기본 텍스처로 get
    const prefixMap: Record<string, string> = {
      slime: 'slime', goblin: 'skeleton', orc: 'orc', mage: 'archer', boss: 'werebear',
    };
    const texKey = (prefixMap[type] ?? 'slime') + '_idle';
    const enemy = this.enemyGroup.get(x, y, texKey) as Enemy;
    if (!enemy) return;
    enemy.init(data, this.gameLevel);
  }

  private selectEnemyType(): string {
    const available = Object.values(ENEMY_DATA)
      .filter(d => !d.isBoss && d.minLevel <= this.gameLevel)
      .map(d => d.key);
    return available[Phaser.Math.Between(0, available.length - 1)];
  }

  spawnBoss(): void {
    const { width, height } = this.scene.scale;
    const camera = this.scene.cameras.main;
    const x = camera.scrollX + width / 2;
    const y = camera.scrollY - height / 2 - 80;

    const boss = this.enemyGroup.get(x, y, 'werebear_idle') as Enemy;
    if (!boss) return;
    boss.init(ENEMY_DATA['boss'], this.gameLevel);
    this.onBossTrigger?.();
  }

  onLevelUp(newLevel: number): void {
    this.gameLevel = newLevel;
    // 스폰 간격 감소
    const newInterval = Math.max(800, 2500 - (newLevel - 1) * 150);
    if (newInterval !== this.spawnInterval) {
      this.spawnInterval = newInterval;
      this.spawnTimer.reset({
        delay: this.spawnInterval,
        callback: this.spawnWave,
        callbackScope: this,
        loop: true,
      });
    }

    // 5레벨 배수마다 보스 스폰
    if (newLevel % 5 === 0) {
      this.scene.time.delayedCall(2000, () => this.spawnBoss());
    }
  }

  update(delta: number): void {
    this.elapsed += delta;
  }

  destroy(): void {
    this.spawnTimer?.destroy();
    this.countTimer?.destroy();
  }
}
