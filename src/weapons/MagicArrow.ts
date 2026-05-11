import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { OwnedWeapon } from '../systems/WeaponSystem';
import { EffectSystem } from '../systems/EffectSystem';

export function MagicArrow(
  scene: Phaser.Scene,
  player: Player,
  enemies: Phaser.Physics.Arcade.Group,
  projectiles: Phaser.Physics.Arcade.Group,
  weapon: OwnedWeapon,
  _effects: EffectSystem,
): void {
  const allEnemies = (enemies.getChildren() as Enemy[]).filter(e => e.active);
  let baseAngle = -Math.PI / 2;
  if (allEnemies.length > 0) {
    let nearest = allEnemies[0];
    let minDist = Phaser.Math.Distance.Between(player.x, player.y, nearest.x, nearest.y);
    for (const e of allEnemies) {
      const d = Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y);
      if (d < minDist) { minDist = d; nearest = e; }
    }
    baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  }

  const angles = [baseAngle - Math.PI / 6, baseAngle, baseAngle + Math.PI / 6];
  const speed = 300;
  const damage = Math.floor(weapon.data.damage * weapon.damageMultiplier);

  for (const angle of angles) {
    const proj = projectiles.get(player.x, player.y, 'projectile') as Projectile;
    if (!proj) continue;
    proj.init(
      player.x, player.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      { damage, piercing: false, dotDamage: 8, dotDuration: 4000 },
    );
    proj.setTint(0xaa44ff);
    proj.setDisplaySize(8, 16);
  }
}
