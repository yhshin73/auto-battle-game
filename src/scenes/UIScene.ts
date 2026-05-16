import Phaser from 'phaser';
import { OwnedWeapon } from '../systems/WeaponSystem';

const BAR_X    = 12;
const HP_Y     = 12;
const EXP_Y    = 36;
const BAR_W    = 210;
const HP_H     = 16;
const EXP_H    = 10;

export class UIScene extends Phaser.Scene {
  private hpBar!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private expBar!: Phaser.GameObjects.Rectangle;
  private expText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private weaponIcons: Phaser.GameObjects.Container[] = [];
  private vignetteLeft!: Phaser.GameObjects.Rectangle;
  private vignetteRight!: Phaser.GameObjects.Rectangle;
  private vignetteTop!: Phaser.GameObjects.Rectangle;
  private vignetteBottom!: Phaser.GameObjects.Rectangle;
  private lowHp: boolean = false;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // ── HP 바 ─────────────────────────────────────────
    this.add.rectangle(BAR_X, HP_Y, BAR_W, HP_H, 0x330000).setOrigin(0);
    this.hpBar = this.add.rectangle(BAR_X + 1, HP_Y + 1, BAR_W - 2, HP_H - 2, 0xee2222).setOrigin(0);
    this.hpText = this.add.text(BAR_X + BAR_W + 6, HP_Y, 'HP 100/100', {
      fontSize: '12px', color: '#ffaaaa',
    }).setOrigin(0, 0);

    // ── EXP 바 (HP 바 바로 아래) ──────────────────────
    this.add.text(BAR_X, EXP_Y - 1, 'EXP', {
      fontSize: '9px', color: '#88ff88',
    }).setOrigin(0, 1);
    this.add.rectangle(BAR_X, EXP_Y, BAR_W, EXP_H, 0x002200).setOrigin(0);
    this.expBar = this.add.rectangle(BAR_X + 1, EXP_Y + 1, 0, EXP_H - 2, 0x22ee44).setOrigin(0);
    this.expText = this.add.text(BAR_X + BAR_W + 6, EXP_Y, '0 / 50', {
      fontSize: '11px', color: '#88ff88',
    }).setOrigin(0, 0);

    // ── 우측 상단 정보 ────────────────────────────────
    this.levelText = this.add.text(width - 12, 12, '⬆️ Lv.1', {
      fontSize: '17px', color: '#ffff44', fontStyle: 'bold',
    }).setOrigin(1, 0);

    this.timeText = this.add.text(width - 12, 36, '⏱️ 0:00', {
      fontSize: '13px', color: '#aaaaff',
    }).setOrigin(1, 0);

    this.killsText = this.add.text(width - 12, 56, '💀 처치: 0', {
      fontSize: '13px', color: '#ffffff',
    }).setOrigin(1, 0);

    // ── 비녜트 (HP 30% 이하 경고) ────────────────────
    this.vignetteLeft   = this.add.rectangle(0,     0,      60,    height, 0xff0000, 0).setOrigin(0);
    this.vignetteRight  = this.add.rectangle(width, 0,      60,    height, 0xff0000, 0).setOrigin(1, 0);
    this.vignetteTop    = this.add.rectangle(0,     0,      width, 60,     0xff0000, 0).setOrigin(0);
    this.vignetteBottom = this.add.rectangle(0,     height, width, 60,     0xff0000, 0).setOrigin(0, 1);

    // 이벤트 리스너
    this.events.on('hp-change',      this.onHpChange,      this);
    this.events.on('exp-change',     this.onExpChange,     this);
    this.events.on('level-change',   this.onLevelChange,   this);
    this.events.on('time-change',    this.onTimeChange,    this);
    this.events.on('kills-change',   this.onKillsChange,   this);
    this.events.on('weapons-change', this.onWeaponsChange, this);
  }

  private onHpChange({ hp, max }: { hp: number; max: number }): void {
    const ratio = Math.max(0, hp / max);
    this.tweens.add({ targets: this.hpBar, width: Math.floor((BAR_W - 2) * ratio), duration: 150 });
    this.hpText.setText(`HP ${hp}/${max}`);

    const isLow = ratio <= 0.3;
    if (isLow !== this.lowHp) {
      this.lowHp = isLow;
      const vignettes = [this.vignetteLeft, this.vignetteRight, this.vignetteTop, this.vignetteBottom];
      if (isLow) {
        this.tweens.add({ targets: vignettes, alpha: 0.25, duration: 500, yoyo: true, repeat: -1 });
      } else {
        this.tweens.killTweensOf(vignettes);
        vignettes.forEach(v => v.setAlpha(0));
      }
    }
  }

  private onExpChange({ exp, max }: { exp: number; max: number }): void {
    const ratio = max > 0 ? exp / max : 0;
    this.tweens.add({ targets: this.expBar, width: Math.floor((BAR_W - 2) * ratio), duration: 200 });
    const remaining = max - exp;
    this.expText.setText(`${exp} / ${max}  (${remaining} 남음)`);
  }

  private onLevelChange({ level }: { level: number }): void {
    this.levelText.setText(`⬆️ Lv.${level}`);
    this.tweens.add({ targets: this.expBar, scaleY: 1.6, duration: 180, yoyo: true });
  }

  private onTimeChange({ time }: { time: number }): void {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    this.timeText.setText(`⏱️ ${mins}:${secs.toString().padStart(2, '0')}`);
  }

  private onKillsChange({ kills }: { kills: number }): void {
    this.killsText.setText(`💀 처치: ${kills}`);
  }

  private onWeaponsChange({ weapons }: { weapons: OwnedWeapon[] }): void {
    this.weaponIcons.forEach(c => c.destroy());
    this.weaponIcons = [];
    const { height } = this.scale;
    weapons.forEach((weapon, i) => {
      const x = 12 + i * 44;
      const y = height - 56;
      const bg = this.add.rectangle(0, 0, 38, 38, 0x222244, 0.8).setStrokeStyle(1, 0x4444ff);
      const icon = this.add.image(0, 0, weapon.data.icon).setDisplaySize(28, 28);
      const lv = this.add.text(14, 14, `${weapon.level}`, {
        fontSize: '11px', color: '#ffff44', fontStyle: 'bold',
      }).setOrigin(1, 1);
      this.weaponIcons.push(this.add.container(x, y, [bg, icon, lv]));
    });
  }
}
