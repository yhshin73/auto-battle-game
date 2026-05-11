import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { OwnedWeapon } from '../systems/WeaponSystem';
import { EffectSystem } from '../systems/EffectSystem';

export function Fireball(
  scene: Phaser.Scene,
  player: Player,
  enemies: Phaser.Physics.Arcade.Group,
  projectiles: Phaser.Physics.Arcade.Group,
  weapon: OwnedWeapon,
  _effects: EffectSystem,
): void {
  const allEnemies = (enemies.getChildren() as Enemy[]).filter(e => e.active);
  let targetAngle = -Math.PI / 2; // 기본 위쪽
  if (allEnemies.length > 0) {
    let nearest = allEnemies[0];
    let minDist = Phaser.Math.Distance.Between(player.x, player.y, nearest.x, nearest.y);
    for (const e of allEnemies) {
      const d = Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y);
      if (d < minDist) { minDist = d; nearest = e; }
    }
    targetAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  }

  const speed = 250;
  const proj = projectiles.get(player.x, player.y, 'projectile') as Projectile;
  if (!proj) return;
  proj.init(
    player.x, player.y,
    Math.cos(targetAngle) * speed, Math.sin(targetAngle) * speed,
    {
      damage: Math.floor(weapon.data.damage * weapon.damageMultiplier),
      piercing: false,
      dotDamage: 15,
      dotDuration: 2000,
      animKey: 'effect_magic2',
      displayW: 140,
      displayH: 140,
    },
  );
}
