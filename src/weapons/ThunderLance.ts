import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { OwnedWeapon } from '../systems/WeaponSystem';
import { EffectSystem } from '../systems/EffectSystem';

export function ThunderLance(
  scene: Phaser.Scene,
  player: Player,
  enemies: Phaser.Physics.Arcade.Group,
  _projectiles: Phaser.Physics.Arcade.Group,
  weapon: OwnedWeapon,
  effects: EffectSystem,
): void {
  const allEnemies = (enemies.getChildren() as Enemy[]).filter(e => e.active);
  let targetAngle = -Math.PI / 2;
  if (allEnemies.length > 0) {
    let nearest = allEnemies[0];
    let minDist = Phaser.Math.Distance.Between(player.x, player.y, nearest.x, nearest.y);
    for (const e of allEnemies) {
      const d = Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y);
      if (d < minDist) { minDist = d; nearest = e; }
    }
    targetAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  }

  const range = 600;
  const ex = player.x + Math.cos(targetAngle) * range;
  const ey = player.y + Math.sin(targetAngle) * range;
  effects.thunderLine(player.x, player.y, ex, ey);

  const damage = Math.floor(weapon.data.damage * weapon.damageMultiplier);
  for (const enemy of allEnemies) {
    const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
    if (dist > range) continue;

    // 직선 위에 있는지 확인 (선까지의 거리 < 30)
    const cross = Math.abs(
      (enemy.x - player.x) * Math.sin(targetAngle) -
      (enemy.y - player.y) * Math.cos(targetAngle),
    );
    if (cross < 30) {
      const dead = enemy.takeDamage(damage);
      enemy.applyStun(500);
      if (dead) enemy.die();
    }
  }
}
