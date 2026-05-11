import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { OwnedWeapon } from '../systems/WeaponSystem';
import { EffectSystem } from '../systems/EffectSystem';

export function NatureVine(
  scene: Phaser.Scene,
  player: Player,
  enemies: Phaser.Physics.Arcade.Group,
  _projectiles: Phaser.Physics.Arcade.Group,
  weapon: OwnedWeapon,
  _effects: EffectSystem,
): void {
  const allEnemies = (enemies.getChildren() as Enemy[])
    .filter(e => e.active)
    .sort((a, b) =>
      Phaser.Math.Distance.Between(player.x, player.y, a.x, a.y) -
      Phaser.Math.Distance.Between(player.x, player.y, b.x, b.y),
    )
    .slice(0, 3);

  const damage = Math.floor(weapon.data.damage * weapon.damageMultiplier);

  for (const enemy of allEnemies) {
    // 덩굴 라인 그래픽
    const g = scene.add.graphics().setDepth(7);
    g.lineStyle(3, 0x44ff44, 0.8);
    g.beginPath();
    g.moveTo(player.x, player.y);
    g.lineTo(enemy.x, enemy.y);
    g.strokePath();

    enemy.applyStun(1500);
    const dead = enemy.takeDamage(damage);

    scene.time.delayedCall(1500, () => {
      g.destroy();
      // 구속 해제 후 추가 피해
      if (enemy.active) {
        const bonusDead = enemy.takeDamage(Math.floor(damage * 0.5));
        if (bonusDead) enemy.die();
      }
    });

    if (dead) {
      scene.time.delayedCall(0, () => enemy.die());
    }
  }
}
