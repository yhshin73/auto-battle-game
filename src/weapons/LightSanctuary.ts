import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { OwnedWeapon } from '../systems/WeaponSystem';
import { EffectSystem } from '../systems/EffectSystem';

export function LightSanctuary(
  scene: Phaser.Scene,
  player: Player,
  enemies: Phaser.Physics.Arcade.Group,
  _projectiles: Phaser.Physics.Arcade.Group,
  weapon: OwnedWeapon,
  effects: EffectSystem,
): void {
  const radius = 120;
  const duration = 3000;
  const dotDamage = Math.floor(weapon.data.damage * weapon.damageMultiplier);

  effects.lightSanctuary(player.x, player.y);

  const snapshotX = player.x;
  const snapshotY = player.y;

  // DoT 틱 (500ms마다)
  let ticks = 0;
  const maxTicks = duration / 500;
  const timer = scene.time.addEvent({
    delay: 500,
    repeat: maxTicks - 1,
    callback: () => {
      ticks++;
      const allEnemies = (enemies.getChildren() as Enemy[]).filter(e => e.active);
      for (const enemy of allEnemies) {
        const dist = Phaser.Math.Distance.Between(snapshotX, snapshotY, enemy.x, enemy.y);
        if (dist <= radius) {
          const dead = enemy.takeDamage(dotDamage);
          if (dead) enemy.die();
        }
      }
    },
  });
}
