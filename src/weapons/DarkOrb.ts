import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { OwnedWeapon } from '../systems/WeaponSystem';
import { EffectSystem } from '../systems/EffectSystem';

// cooldown=0이므로 매 update() 호출 — 실제 오브가 있을 때는 GameScene이 별도 처리
// 여기서는 호출 시 주변 적에게 공포+피해 적용
export function DarkOrb(
  scene: Phaser.Scene,
  player: Player,
  enemies: Phaser.Physics.Arcade.Group,
  _projectiles: Phaser.Physics.Arcade.Group,
  weapon: OwnedWeapon,
  _effects: EffectSystem,
): void {
  const orbitRadius = 60;
  const damage = Math.floor(weapon.data.damage * weapon.damageMultiplier * 0.016); // per frame
  const allEnemies = (enemies.getChildren() as Enemy[]).filter(e => e.active);

  for (const enemy of allEnemies) {
    const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
    if (dist <= orbitRadius + 20) {
      const dead = enemy.takeDamage(damage);
      if (Math.random() < 0.01) enemy.applyFear(2000);
      if (dead) enemy.die();
    }
  }
}
