import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { OwnedWeapon } from '../systems/WeaponSystem';
import { EffectSystem } from '../systems/EffectSystem';

export function DeathScythe(
  scene: Phaser.Scene,
  player: Player,
  enemies: Phaser.Physics.Arcade.Group,
  _projectiles: Phaser.Physics.Arcade.Group,
  weapon: OwnedWeapon,
  _effects: EffectSystem,
): void {
  const radius = 160;
  const damage = weapon.data.damage;
  const sweepDuration = 340; // ms
  // 레벨별 즉사 임계값: 10% + (level-1)*5%
  const killThreshold = 0.10 + (weapon.level - 1) * 0.05;

  // 플레이어 이동 방향 기준 낫 스윙
  const facingAngle = player.facingAngle;
  const startAngle = facingAngle - Math.PI * 0.6;
  const endAngle   = facingAngle + Math.PI * 0.6;

  const g = scene.add.graphics().setDepth(14);
  let hitEnemies = new Set<Enemy>();

  // sweep 진행도 0→1 tween
  let progress = 0;
  scene.tweens.addCounter({
    from: 0, to: 1,
    duration: sweepDuration,
    ease: 'Power2',
    onUpdate: (tw) => {
      progress = tw.getValue() as number;
      const currentAngle = startAngle + (endAngle - startAngle) * progress;

      g.clear();

      // 낫 날: 보라색 호
      g.lineStyle(8, 0x8800ff, 0.85);
      g.beginPath();
      g.arc(player.x, player.y, radius, startAngle, currentAngle, false);
      g.strokePath();

      // 낫 날 끝 빛나는 점
      const tipX = player.x + Math.cos(currentAngle) * radius;
      const tipY = player.y + Math.sin(currentAngle) * radius;
      g.fillStyle(0xcc44ff, 0.9);
      g.fillCircle(tipX, tipY, 10);
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(tipX, tipY, 4);

      // 낫 자루: 얇은 선
      g.lineStyle(3, 0x442255, 0.6);
      g.beginPath();
      g.moveTo(player.x, player.y);
      g.lineTo(
        player.x + Math.cos(startAngle) * (radius * 0.6),
        player.y + Math.sin(startAngle) * (radius * 0.6),
      );
      g.strokePath();

      // 스윙 중 적 히트 판정
      const allEnemies = (enemies.getChildren() as Enemy[]).filter(e => e.active);
      for (const enemy of allEnemies) {
        if (hitEnemies.has(enemy)) continue;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
        if (dist > radius) continue;

        // 현재 각도 범위 내에 있는지 확인
        const enemyAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
        const normalizedEnemy = normalizeAngle(enemyAngle - startAngle);
        const normalizedCurrent = normalizeAngle(currentAngle - startAngle);
        if (normalizedEnemy <= normalizedCurrent + 0.15) {
          hitEnemies.add(enemy);
          const isInstantKill = enemy.hp / enemy.maxHp <= killThreshold;
          const dead = isInstantKill || enemy.takeDamage(damage);
          if (isInstantKill) enemy.hp = 0;
          if (dead) enemy.die();
        }
      }
    },
    onComplete: () => {
      g.destroy();
    },
  });
}

function normalizeAngle(a: number): number {
  while (a < 0) a += Math.PI * 2;
  while (a > Math.PI * 2) a -= Math.PI * 2;
  return a;
}
