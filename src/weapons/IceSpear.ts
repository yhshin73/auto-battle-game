import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { OwnedWeapon } from '../systems/WeaponSystem';
import { EffectSystem } from '../systems/EffectSystem';

export function IceSpear(
  scene: Phaser.Scene,
  player: Player,
  enemies: Phaser.Physics.Arcade.Group,
  projectiles: Phaser.Physics.Arcade.Group,
  weapon: OwnedWeapon,
  _effects: EffectSystem,
): void {
  const all = (enemies.getChildren() as Enemy[]).filter(e => e.active);
  let baseAngle = -Math.PI / 2;
  if (all.length > 0) {
    const nearest = all.reduce((a, b) =>
      Phaser.Math.Distance.Between(player.x, player.y, a.x, a.y) <
      Phaser.Math.Distance.Between(player.x, player.y, b.x, b.y) ? a : b,
    );
    baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  }

  // 레벨별: 투사체 수 = level, 빙결 시간 = 2000 + (level-1)*500ms
  const projCount = weapon.level;
  const freezeDuration = 2000 + (weapon.level - 1) * 500;
  const spread = 0.2;
  const speed = 320;

  for (let i = 0; i < projCount; i++) {
    const offset = projCount === 1 ? 0 : (i - (projCount - 1) / 2) * spread;
    const angle = baseAngle + offset;

    const proj = projectiles.get(player.x, player.y, 'projectile') as Projectile;
    if (!proj) continue;
    proj.init(
      player.x, player.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      {
        damage: weapon.data.damage,
        pierceCount: 0,
        freezeChance: 1.0,
        freezeDuration,
        tint: 0x88ddff,
        displayW: 80,
        displayH: 28,
      },
    );
    proj.setRotation(angle);
  }
}
