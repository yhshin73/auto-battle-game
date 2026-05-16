import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { OwnedWeapon } from '../systems/WeaponSystem';
import { EffectSystem } from '../systems/EffectSystem';

export function DeathScythe(
  scene: Phaser.Scene,
  player: Player,
  enemies: Phaser.Physics.Arcade.Group,
  _projectiles: Phaser.Physics.Arcade.Group,
  weapon: OwnedWeapon,
  _effects: EffectSystem,
): void {
  const bladeRadius   = 165;          // 낫 길이(플레이어~날 끝)
  const sweepAngle    = Math.PI;      // 180도 스윙
  const sweepDuration = 380;          // ms
  const damage        = weapon.data.damage;
  const killThreshold = 0.10 + (weapon.level - 1) * 0.05;

  // 가장 가까운 적 방향을 스윙 중심으로
  const allEnemies = (enemies.getChildren() as Enemy[]).filter(e => e.active);
  let targetAngle = player.facingAngle; // 적 없으면 이동 방향
  if (allEnemies.length > 0) {
    const nearest = allEnemies.reduce((a, b) =>
      Phaser.Math.Distance.Between(player.x, player.y, a.x, a.y) <
      Phaser.Math.Distance.Between(player.x, player.y, b.x, b.y) ? a : b,
    );
    targetAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  }

  // 스윙 시작각(-90°) → 목표 방향 → 끝각(+90°)
  const startAngle = targetAngle - sweepAngle / 2;
  const endAngle   = targetAngle + sweepAngle / 2;

  const g = scene.add.graphics().setDepth(16);
  const hitEnemies = new Set<Enemy>();

  scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration: sweepDuration,
    ease: 'Sine.easeInOut',
    onUpdate: (tw) => {
      const progress     = tw.getValue() as number;
      const currentAngle = startAngle + sweepAngle * progress;

      // 날 끝 좌표
      const tipX = player.x + Math.cos(currentAngle) * bladeRadius;
      const tipY = player.y + Math.sin(currentAngle) * bladeRadius;

      g.clear();

      // ── 스윙 잔상 (지나온 궤적) ──────────────────
      g.lineStyle(22, 0x4400aa, 0.18);
      g.beginPath();
      g.arc(player.x, player.y, bladeRadius, startAngle, currentAngle, false);
      g.strokePath();

      // ── 낫 날 (두꺼운 보라 호) ───────────────────
      g.lineStyle(14, 0x8800ee, 0.88);
      g.beginPath();
      g.arc(player.x, player.y, bladeRadius, startAngle, currentAngle, false);
      g.strokePath();

      // ── 날 안쪽 밝은 에지 ────────────────────────
      g.lineStyle(4, 0xdd66ff, 1.0);
      g.beginPath();
      const edgeStart = Math.max(startAngle, currentAngle - 0.55);
      g.arc(player.x, player.y, bladeRadius - 8, edgeStart, currentAngle, false);
      g.strokePath();

      // ── 자루 (플레이어 → 날 끝) ──────────────────
      g.lineStyle(5, 0x331144, 0.95);
      g.beginPath();
      g.moveTo(player.x, player.y);
      g.lineTo(tipX, tipY);
      g.strokePath();

      // ── 날 끝 글로우 ─────────────────────────────
      g.fillStyle(0xcc44ff, 0.5);
      g.fillCircle(tipX, tipY, 18);
      g.fillStyle(0xffffff, 0.95);
      g.fillCircle(tipX, tipY, 7);

      // ── 낫 갈고리 표현 (호 시작점에 짧은 직선) ──
      const hookX = player.x + Math.cos(startAngle) * bladeRadius;
      const hookY = player.y + Math.sin(startAngle) * bladeRadius;
      if (progress < 0.15) {
        g.lineStyle(4, 0xaa44cc, 0.6);
        g.beginPath();
        g.moveTo(hookX, hookY);
        g.lineTo(
          hookX + Math.cos(startAngle + Math.PI / 2) * 20,
          hookY + Math.sin(startAngle + Math.PI / 2) * 20,
        );
        g.strokePath();
      }

      // ── 스윙 범위 내 적 히트 판정 ────────────────
      for (const enemy of allEnemies) {
        if (!enemy.active || hitEnemies.has(enemy)) continue;

        const dist = Phaser.Math.Distance.Between(player.x, player.y, enemy.x, enemy.y);
        if (dist > bladeRadius + 30 || dist < 20) continue;

        // 현재 스윙된 각도 범위 안에 있는지 확인
        const enemyAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
        if (isAngleInArc(enemyAngle, startAngle, currentAngle)) {
          hitEnemies.add(enemy);
          const isInstantKill = enemy.hp / enemy.maxHp <= killThreshold;
          const dead = isInstantKill || enemy.takeDamage(damage);
          if (isInstantKill) enemy.hp = 0;
          if (dead) enemy.die();
        }
      }
    },
    onComplete: () => {
      // 사라질 때 페이드아웃
      scene.tweens.add({
        targets: g,
        alpha: 0,
        duration: 150,
        onComplete: () => g.destroy(),
      });
    },
  });
}

// 각도가 startAngle~endAngle 호 범위 안인지 확인
function isAngleInArc(angle: number, start: number, end: number): boolean {
  // 각도를 start 기준으로 정규화
  const sweep   = normalizeAngle(end - start);
  const toAngle = normalizeAngle(angle - start);
  return toAngle <= sweep + 0.1;
}

function normalizeAngle(a: number): number {
  const two_pi = Math.PI * 2;
  return ((a % two_pi) + two_pi) % two_pi;
}
