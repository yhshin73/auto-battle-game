import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { OwnedWeapon } from '../systems/WeaponSystem';
import { EffectSystem } from '../systems/EffectSystem';

const STATE_KEY = '__whirl_state__';

interface BladeObj {
  gfx: Phaser.GameObjects.Graphics;
  trail: Phaser.GameObjects.Graphics;
}

interface WhirlState {
  blades: BladeObj[];
  angle: number;
  level: number;
  damageCooldown: number;
  hitCooldowns: Map<Enemy, number>;
}

export function WhirlBlade(
  scene: Phaser.Scene,
  player: Player,
  enemies: Phaser.Physics.Arcade.Group,
  _projectiles: Phaser.Physics.Arcade.Group,
  weapon: OwnedWeapon,
  _effects: EffectSystem,
): void {
  const delta = scene.game.loop.delta;
  const bladeCount  = weapon.level + 1; // Lv1=2개, Lv2=3개, ...
  const orbitRadius = 110;
  const damage      = weapon.data.damage;
  const hitInterval = 400;

  // 상태 초기화 / 레벨업 재생성
  let state = (scene as any)[STATE_KEY] as WhirlState | undefined;
  if (!state || state.level !== weapon.level) {
    state?.blades.forEach(b => { b.gfx.destroy(); b.trail.destroy(); });
    const blades: BladeObj[] = [];
    for (let i = 0; i < bladeCount; i++) {
      blades.push({
        trail: scene.add.graphics().setDepth(11),
        gfx:   scene.add.graphics().setDepth(12),
      });
    }
    state = { blades, angle: 0, level: weapon.level, damageCooldown: 0, hitCooldowns: new Map() };
    (scene as any)[STATE_KEY] = state;
  }

  state.angle += delta * 0.004; // 회전 속도
  const step = (Math.PI * 2) / bladeCount;

  state.blades.forEach((blade, i) => {
    const a  = state!.angle + step * i;
    const bx = player.x + Math.cos(a) * orbitRadius;
    const by = player.y + Math.sin(a) * orbitRadius;

    // 잔상 (trail)
    blade.trail.clear();
    blade.trail.fillStyle(0x88ccff, 0.12);
    blade.trail.fillCircle(bx, by, 24);

    // ── 검 그래픽 ──────────────────────────────────
    blade.gfx.clear();

    // 검 방향은 공전 접선 방향 (a + PI/2)
    const swordAngle = a + Math.PI / 2;
    const cos = Math.cos(swordAngle);
    const sin = Math.sin(swordAngle);

    // 검날 (얇은 마름모, 길이 34px)
    const len = 17;
    const wid = 4;
    const p1x = bx + cos * len;  const p1y = by + sin * len;   // 끝
    const p2x = bx - cos * wid;  const p2y = by - sin * wid;   // 좌
    const p3x = bx - cos * len;  const p3y = by - sin * len;   // 아래
    const p4x = bx + cos * wid;  const p4y = by + sin * wid;   // 우

    blade.gfx.fillStyle(0xddeeff, 0.95);
    blade.gfx.fillTriangle(p1x, p1y, p2x - sin * wid, p2y + cos * wid, p3x, p3y);
    blade.gfx.fillTriangle(p1x, p1y, p4x - sin * wid, p4y + cos * wid, p3x, p3y);

    // 검날 중심선 (반짝임)
    blade.gfx.lineStyle(2, 0xffffff, 0.7);
    blade.gfx.beginPath();
    blade.gfx.moveTo(p1x, p1y);
    blade.gfx.lineTo(p3x, p3y);
    blade.gfx.strokePath();

    // 자루 (갈색 짧은 막대)
    const hiltLen = 8;
    blade.gfx.lineStyle(5, 0xaa6633, 1);
    blade.gfx.beginPath();
    blade.gfx.moveTo(p3x - cos * 2,             p3y - sin * 2);
    blade.gfx.lineTo(p3x - cos * (2 + hiltLen),  p3y - sin * (2 + hiltLen));
    blade.gfx.strokePath();

    // 코등이 (가로선)
    blade.gfx.lineStyle(4, 0xccaa55, 1);
    const guardX = p3x - cos * 4;
    const guardY = p3y - sin * 4;
    blade.gfx.beginPath();
    blade.gfx.moveTo(guardX - sin * 7, guardY + cos * 7);
    blade.gfx.lineTo(guardX + sin * 7, guardY - cos * 7);
    blade.gfx.strokePath();
  });

  // 데미지 쿨다운
  state.damageCooldown -= delta;
  for (const [enemy, cd] of state.hitCooldowns) {
    if (cd - delta <= 0) state.hitCooldowns.delete(enemy);
    else state.hitCooldowns.set(enemy, cd - delta);
  }
  if (state.damageCooldown > 0) return;
  state.damageCooldown = hitInterval;

  const allEnemies = (enemies.getChildren() as Enemy[]).filter(e => e.active);
  state.blades.forEach((_, i) => {
    const a  = state!.angle + step * i;
    const bx = player.x + Math.cos(a) * orbitRadius;
    const by = player.y + Math.sin(a) * orbitRadius;

    for (const enemy of allEnemies) {
      if (state!.hitCooldowns.has(enemy)) continue;
      const dist = Phaser.Math.Distance.Between(bx, by, enemy.x, enemy.y);
      if (dist <= 60) {
        const dead = enemy.takeDamage(damage);
        state!.hitCooldowns.set(enemy, hitInterval);
        if (dead) enemy.die();
      }
    }
  });
}
