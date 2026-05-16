import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { OwnedWeapon } from '../systems/WeaponSystem';
import { EffectSystem } from '../systems/EffectSystem';

const STATE_KEY = '__darkorb_state__';

interface DarkOrbState {
  orbs: Phaser.GameObjects.Graphics[];
  trails: Phaser.GameObjects.Graphics[];
  angle: number;
  level: number;
  damageCooldown: number;
  hitCooldowns: Map<Enemy, number>;
}

export function DarkOrb(
  scene: Phaser.Scene,
  player: Player,
  enemies: Phaser.Physics.Arcade.Group,
  _projectiles: Phaser.Physics.Arcade.Group,
  weapon: OwnedWeapon,
  _effects: EffectSystem,
): void {
  const delta = scene.game.loop.delta;
  const orbCount = weapon.level + 2; // Lv1=3, Lv2=4, ...
  const orbitRadius = 90;
  const damage = weapon.data.damage;
  const hitInterval = 500;

  // 상태 초기화/레벨업 재생성
  let state = (scene as any)[STATE_KEY] as DarkOrbState | undefined;
  if (!state || state.level !== weapon.level) {
    state?.orbs.forEach(o => o.destroy());
    state?.trails.forEach(t => t.destroy());
    const orbs: Phaser.GameObjects.Graphics[] = [];
    const trails: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < orbCount; i++) {
      trails.push(scene.add.graphics().setDepth(11));
      orbs.push(scene.add.graphics().setDepth(12));
    }
    state = { orbs, trails, angle: 0, level: weapon.level, damageCooldown: 0, hitCooldowns: new Map() };
    (scene as any)[STATE_KEY] = state;
  }

  state.angle += delta * 0.003;
  const step = (Math.PI * 2) / orbCount;

  state.orbs.forEach((orb, i) => {
    const a = state!.angle + step * i;
    const ox = player.x + Math.cos(a) * orbitRadius;
    const oy = player.y + Math.sin(a) * orbitRadius;

    state!.trails[i].clear();
    state!.trails[i].fillStyle(0x6600cc, 0.15);
    state!.trails[i].fillCircle(ox, oy, 20);

    orb.clear();
    orb.fillStyle(0x9933ff, 0.3);
    orb.fillCircle(ox, oy, 24);
    orb.fillStyle(0xcc88ff, 0.9);
    orb.fillCircle(ox, oy, 11);
    orb.fillStyle(0xffffff, 1);
    orb.fillCircle(ox, oy, 4);
  });

  state.damageCooldown -= delta;
  for (const [enemy, cd] of state.hitCooldowns) {
    if (cd - delta <= 0) state.hitCooldowns.delete(enemy);
    else state.hitCooldowns.set(enemy, cd - delta);
  }
  if (state.damageCooldown > 0) return;
  state.damageCooldown = hitInterval;

  const allEnemies = (enemies.getChildren() as Enemy[]).filter(e => e.active);
  state.orbs.forEach((_, i) => {
    const a = state!.angle + step * i;
    const ox = player.x + Math.cos(a) * orbitRadius;
    const oy = player.y + Math.sin(a) * orbitRadius;

    for (const enemy of allEnemies) {
      if (state!.hitCooldowns.has(enemy)) continue;
      const dist = Phaser.Math.Distance.Between(ox, oy, enemy.x, enemy.y);
      if (dist <= 50) {
        const dead = enemy.takeDamage(damage);
        enemy.applyFear(2000); // 항상 공포 2초
        state!.hitCooldowns.set(enemy, hitInterval);
        if (dead) enemy.die();
      }
    }
  });
}
