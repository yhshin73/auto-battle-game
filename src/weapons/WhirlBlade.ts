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
  damageCooldown: number;        // 남은 데미지 쿨다운 ms
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
  const orbitRadius = 110;
  const bladeCount  = Math.min(weapon.level + 1, 4);  // 레벨 오를수록 검 추가 (최대 4개)
  const damage      = Math.floor(weapon.data.damage * weapon.damageMultiplier);
  const hitInterval = 400; // ms 마다 데미지

  // ── 상태 초기화 / 레벨업 시 재생성 ─────────────────────
  let state = (scene as any)[STATE_KEY] as WhirlState | undefined;

  if (!state || state.level !== weapon.level) {
    // 기존 블레이드 제거
    state?.blades.forEach(b => { b.gfx.destroy(); b.trail.destroy(); });

    const blades: BladeObj[] = [];
    for (let i = 0; i < bladeCount; i++) {
      const trail = scene.add.graphics().setDepth(11);
      const gfx   = scene.add.graphics().setDepth(12);
      blades.push({ gfx, trail });
    }
    state = {
      blades,
      angle: 0,
      level: weapon.level,
      damageCooldown: 0,
      hitCooldowns: new Map(),
    };
    (scene as any)[STATE_KEY] = state;
  }

  // ── 각도 회전 ─────────────────────────────────────────
  state.angle += delta * 0.004; // 라디안/ms → 약 230°/s

  // ── 블레이드 위치 업데이트 & 렌더링 ──────────────────
  const angleStep = (Math.PI * 2) / bladeCount;

  state.blades.forEach((blade, i) => {
    const a = state!.angle + angleStep * i;
    const bx = player.x + Math.cos(a) * orbitRadius;
    const by = player.y + Math.sin(a) * orbitRadius;

    // 잔상 (trail) — 반투명 작은 원
    blade.trail.clear();
    blade.trail.fillStyle(0x44ffff, 0.18);
    blade.trail.fillCircle(bx, by, 22);

    // 검 본체 — 밝은 청록 마름모
    blade.gfx.clear();
    // 글로우 외곽
    blade.gfx.fillStyle(0x00ccff, 0.25);
    blade.gfx.fillCircle(bx, by, 26);
    // 내부 밝은 원
    blade.gfx.fillStyle(0xaaffff, 0.9);
    blade.gfx.fillCircle(bx, by, 12);
    // 중심 흰 점
    blade.gfx.fillStyle(0xffffff, 1);
    blade.gfx.fillCircle(bx, by, 5);
  });

  // ── 데미지 쿨다운 감소 ────────────────────────────────
  state.damageCooldown -= delta;

  // 적 히트 쿨다운 감소
  for (const [enemy, cd] of state.hitCooldowns) {
    if (cd - delta <= 0) state.hitCooldowns.delete(enemy);
    else state.hitCooldowns.set(enemy, cd - delta);
  }

  if (state.damageCooldown > 0) return;
  state.damageCooldown = hitInterval;

  // ── 범위 내 적에게 데미지 ────────────────────────────
  const allEnemies = (enemies.getChildren() as Enemy[]).filter(e => e.active);

  state.blades.forEach((_, i) => {
    const a  = state!.angle + angleStep * i;
    const bx = player.x + Math.cos(a) * orbitRadius;
    const by = player.y + Math.sin(a) * orbitRadius;

    for (const enemy of allEnemies) {
      if (state!.hitCooldowns.has(enemy)) continue;
      const dist = Phaser.Math.Distance.Between(bx, by, enemy.x, enemy.y);
      if (dist <= 55) {
        const dead = enemy.takeDamage(damage);
        state!.hitCooldowns.set(enemy, hitInterval);
        if (dead) enemy.die();
      }
    }
  });
}
