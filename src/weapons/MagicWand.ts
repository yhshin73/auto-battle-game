import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { OwnedWeapon } from '../systems/WeaponSystem';
import { EffectSystem } from '../systems/EffectSystem';

function getNearestEnemy(player: Player, enemies: Phaser.Physics.Arcade.Group): Enemy | null {
  const all = (enemies.getChildren() as Enemy[]).filter(e => e.active);
  if (all.length === 0) return null;
  return all.reduce((nearest, e) => {
    return Phaser.Math.Distance.Between(player.x, player.y, e.x, e.y) <
      Phaser.Math.Distance.Between(player.x, player.y, nearest.x, nearest.y)
      ? e : nearest;
  });
}

export function MagicWand(
  scene: Phaser.Scene,
  player: Player,
  enemies: Phaser.Physics.Arcade.Group,
  projectiles: Phaser.Physics.Arcade.Group,
  weapon: OwnedWeapon,
  _effects: EffectSystem,
): void {
  const nearest = getNearestEnemy(player, enemies);
  const baseAngle = nearest
    ? Math.atan2(nearest.y - player.y, nearest.x - player.x)
    : -Math.PI / 2;

  const speed = 280;
  const projCount = weapon.level; // Lv1=1개, Lv2=2개, ...
  const spreadAngle = 0.25; // 라디안

  for (let i = 0; i < projCount; i++) {
    const offset = projCount === 1 ? 0 : (i - (projCount - 1) / 2) * spreadAngle;
    const angle = baseAngle + offset;

    const proj = projectiles.get(player.x, player.y, 'effect_magic1') as Projectile;
    if (!proj) continue;
    proj.init(player.x, player.y, Math.cos(angle) * speed, Math.sin(angle) * speed, {
      damage: weapon.data.damage,
      pierceCount: 0,
      slowDuration: 2000,
      slowRatio: 0.7, // 30% 감소 = 속도 70% 유지
      animKey: 'effect_magic1',
      displayW: 100,
      displayH: 100,
    });
  }
}
