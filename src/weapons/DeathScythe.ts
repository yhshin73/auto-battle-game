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
  const radius = 150;
  const damage = Math.floor(weapon.data.damage * weapon.damageMultiplier);
  const allEnemies = (enemies.getChildren() as Enemy[]).filter(e => e.active);

  // 낫 스윙 이펙트
  const g = scene.add.graphics().setDepth(9);
  g.lineStyle(4, 0x8800ff, 0.9);
  g.beginPath();
  g.arc(player.x, player.y, radius, -Math.PI * 0.75, Math.PI * 0.75, false);
  g.strokePath();
  scene.time.delayedCall(300, () => g.destroy());

  for (const enemy of allEnemies) {
    const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
    if (dist > radius) continue;

    // 180도 범위 (앞쪽)
    const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
    if (Math.abs(angle) > Math.PI * 0.75) continue;

    // HP 10% 이하 즉사
    const isInstantKill = enemy.hp / enemy.maxHp <= 0.1;
    const dead = isInstantKill ? true : enemy.takeDamage(damage);
    if (isInstantKill) enemy.hp = 0;
    if (dead) enemy.die();
  }
}
