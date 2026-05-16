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
  // 레벨별 반경: 120 + (level-1)*30
  const radius = 120 + (weapon.level - 1) * 30;
  const duration = 3000;
  const dotDamage = weapon.data.damage;

  effects.lightSanctuary(player.x, player.y);

  const sx = player.x;
  const sy = player.y;
  const ticks = Math.floor(duration / 500);

  scene.time.addEvent({
    delay: 500,
    repeat: ticks - 1,
    callback: () => {
      const all = (enemies.getChildren() as Enemy[]).filter(e => e.active);
      for (const enemy of all) {
        const dist = Phaser.Math.Distance.Between(sx, sy, enemy.x, enemy.y);
        if (dist <= radius) {
          const dead = enemy.takeDamage(dotDamage);
          if (dead) enemy.die();
        }
      }
    },
  });
}
