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
  // 레벨별: 구속 대상 = 1 + 2*(level-1), 피해 배율 = 1.5 + 0.1*(level-1)
  const maxTargets = 1 + 2 * (weapon.level - 1);
  const bonusDamageRatio = 1.5 + 0.1 * (weapon.level - 1);
  const stunDuration = 1500;
  const damage = weapon.data.damage;

  const targets = (enemies.getChildren() as Enemy[])
    .filter(e => e.active)
    .sort((a, b) =>
      Phaser.Math.Distance.Between(player.x, player.y, a.x, a.y) -
      Phaser.Math.Distance.Between(player.x, player.y, b.x, b.y),
    )
    .slice(0, maxTargets);

  for (const enemy of targets) {
    // 덩굴 라인 시각 효과
    const g = scene.add.graphics().setDepth(7);
    g.lineStyle(3, 0x44ff44, 0.8);
    g.beginPath();
    g.moveTo(player.x, player.y);
    g.lineTo(enemy.x, enemy.y);
    g.strokePath();

    enemy.applyStun(stunDuration);
    const dead = enemy.takeDamage(damage);

    scene.time.delayedCall(stunDuration, () => {
      g.destroy();
      if (enemy.active) {
        const bonusDmg = Math.floor(damage * bonusDamageRatio);
        const bonusDead = enemy.takeDamage(bonusDmg);
        if (bonusDead) enemy.die();
      }
    });

    if (dead) scene.time.delayedCall(0, () => enemy.die());
  }
}
