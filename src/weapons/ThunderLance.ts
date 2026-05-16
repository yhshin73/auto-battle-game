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
  const all = (enemies.getChildren() as Enemy[]).filter(e => e.active);
  let targetAngle = -Math.PI / 2;
  if (all.length > 0) {
    const nearest = all.reduce((a, b) =>
      Phaser.Math.Distance.Between(player.x, player.y, a.x, a.y) <
      Phaser.Math.Distance.Between(player.x, player.y, b.x, b.y) ? a : b,
    );
    targetAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  }

  const range = 600;
  const ex = player.x + Math.cos(targetAngle) * range;
  const ey = player.y + Math.sin(targetAngle) * range;
  effects.thunderLine(player.x, player.y, ex, ey);

  // 레벨별 기절 시간: 0.5s + (level-1)*0.5s
  const stunDuration = 500 + (weapon.level - 1) * 500;
  const damage = weapon.data.damage;

  for (const enemy of all) {
    const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
    if (dist > range) continue;
    const cross = Math.abs(
      (enemy.x - player.x) * Math.sin(targetAngle) -
      (enemy.y - player.y) * Math.cos(targetAngle),
    );
    if (cross < 30) {
      const dead = enemy.takeDamage(damage);
      enemy.applyStun(stunDuration);
      if (dead) enemy.die();
    }
  }
}
