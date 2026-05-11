import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { OwnedWeapon } from '../systems/WeaponSystem';
import { EffectSystem } from '../systems/EffectSystem';

export function BombThrow(
  scene: Phaser.Scene,
  player: Player,
  enemies: Phaser.Physics.Arcade.Group,
  _projectiles: Phaser.Physics.Arcade.Group,
  weapon: OwnedWeapon,
  effects: EffectSystem,
): void {
  const { width, height } = scene.scale;
  const camera = scene.cameras.main;
  const targetX = camera.scrollX + Phaser.Math.Between(100, width - 100);
  const targetY = camera.scrollY + Phaser.Math.Between(100, height - 100);

  const bomb = scene.add.circle(player.x, player.y, 10, 0xff4400).setDepth(9);

  scene.tweens.add({
    targets: bomb,
    x: targetX,
    y: targetY,
    duration: 600,
    ease: 'Power1',
    onComplete: () => {
      bomb.destroy();
      effects.bombExplosion(targetX, targetY);

      const damage = Math.floor(weapon.data.damage * weapon.damageMultiplier);
      const radius = 100;
      const allEnemies = (enemies.getChildren() as Enemy[]).filter(e => e.active);
      for (const enemy of allEnemies) {
        const dist = Phaser.Math.Distance.Between(targetX, targetY, enemy.x, enemy.y);
        if (dist <= radius) {
          const dead = enemy.takeDamage(damage);
          if (dead) enemy.die();
        }
      }
    },
  });
}
