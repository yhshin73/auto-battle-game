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
  const all = (enemies.getChildren() as Enemy[]).filter(e => e.active);
  let baseAngle = -Math.PI / 2;
  if (all.length > 0) {
    const nearest = all.reduce((a, b) =>
      Phaser.Math.Distance.Between(player.x, player.y, a.x, a.y) <
      Phaser.Math.Distance.Between(player.x, player.y, b.x, b.y) ? a : b,
    );
    baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  }

  const angles = [baseAngle - Math.PI / 6, baseAngle, baseAngle + Math.PI / 6];
  const speed = 340;
  const pierceCount = weapon.level; // Lv1=1회, Lv2=2회, ...

  for (const angle of angles) {
    const proj = projectiles.get(player.x, player.y, 'arrow') as Projectile;
    if (!proj) continue;
    proj.init(
      player.x, player.y,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      {
        damage: weapon.data.damage,
        pierceCount,
        tint: 0xcc88ff,
        displayW: 72,
        displayH: 24,
      },
    );
    // 화살 방향으로 스프라이트 회전
    proj.setRotation(angle);
  }
}
