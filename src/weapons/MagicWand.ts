import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { OwnedWeapon } from '../systems/WeaponSystem';
import { EffectSystem } from '../systems/EffectSystem';

export function MagicWand(
  scene: Phaser.Scene,
  player: Player,
  enemies: Phaser.Physics.Arcade.Group,
  projectiles: Phaser.Physics.Arcade.Group,
  weapon: OwnedWeapon,
  _effects: EffectSystem,
): void {
  const allEnemies = (enemies.getChildren() as Enemy[]).filter(e => e.active);
  if (allEnemies.length === 0) return;

  let nearest = allEnemies[0];
  let minDist = Phaser.Math.Distance.Between(player.x, player.y, nearest.x, nearest.y);
  for (const e of allEnemies) {
    const d = Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y);
    if (d < minDist) { minDist = d; nearest = e; }
  }

  const dx = nearest.x - player.x;
  const dy = nearest.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const speed = 280;

  const proj = projectiles.get(player.x, player.y, 'projectile') as Projectile;
  if (!proj) return;
  proj.init(player.x, player.y, (dx / dist) * speed, (dy / dist) * speed, {
    damage: Math.floor(weapon.data.damage * weapon.damageMultiplier),
    piercing: false,
    slowDuration: 3000,
    animKey: 'effect_magic1',
    displayW: 130,
    displayH: 130,
  });
}
