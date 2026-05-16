import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { OwnedWeapon } from '../systems/WeaponSystem';
import { EffectSystem } from '../systems/EffectSystem';

export function Fireball(
  scene: Phaser.Scene,
  player: Player,
  enemies: Phaser.Physics.Arcade.Group,
  projectiles: Phaser.Physics.Arcade.Group,
  weapon: OwnedWeapon,
  _effects: EffectSystem,
): void {
  const all = (enemies.getChildren() as Enemy[]).filter(e => e.active);
  let targetAngle = -Math.PI / 2;
  if (all.length > 0) {
    const nearest = all.reduce((a, b) =>
      Phaser.Math.Distance.Between(player.x, player.y, a.x, a.y) <
      Phaser.Math.Distance.Between(player.x, player.y, b.x, b.y) ? a : b,
    );
    targetAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  }

  // 레벨별 화염 영역 반경: 80 + (level-1)*30
  const fireRadius = 80 + (weapon.level - 1) * 30;

  const speed = 240;
  const proj = projectiles.get(player.x, player.y, 'effect_magic2') as Projectile;
  if (!proj) return;
  proj.init(
    player.x, player.y,
    Math.cos(targetAngle) * speed, Math.sin(targetAngle) * speed,
    {
      damage: weapon.data.damage,
      pierceCount: 0,
      fireZoneRadius: fireRadius,
      fireZoneDuration: 3000,
      fireZoneDot: 10,
      animKey: 'effect_magic2',
      displayW: 120,
      displayH: 120,
    },
  );
}
