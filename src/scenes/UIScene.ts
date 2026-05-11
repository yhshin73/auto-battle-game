import Phaser from 'phaser';
import { OwnedWeapon } from '../systems/WeaponSystem';

export class UIScene extends Phaser.Scene {
  private hpBar!: Phaser.GameObjects.Rectangle;
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private expBar!: Phaser.GameObjects.Rectangle;
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

    // HP 바 배경
    this.hpBarBg = this.add.rectangle(12, 12, 200, 18, 0x440000).setOrigin(0);
    this.hpBar = this.add.rectangle(13, 13, 198, 16, 0xff2222).setOrigin(0);
    this.hpText = this.add.text(14, 32, 'HP: 100 / 100', {
      fontSize: '13px',
      color: '#ffaaaa',
    });

    // EXP 바 (화면 하단 전체 폭)
    this.add.rectangle(0, height - 10, width, 10, 0x003300).setOrigin(0);
    this.expBar = this.add.rectangle(0, height - 10, 0, 10, 0x00ff44).setOrigin(0);

    // 우측 상단 정보
    this.levelText = this.add.text(width - 12, 12, '⬆️ Lv.1', {
      fontSize: '17px',
      color: '#ffff44',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    this.timeText = this.add.text(width - 12, 36, '⏱️ 0:00', {
      fontSize: '13px',
      color: '#aaaaff',
    }).setOrigin(1, 0);

    this.killsText = this.add.text(width - 12, 56, '💀 처치: 0', {
      fontSize: '13px',
      color: '#ffffff',
    }).setOrigin(1, 0);

    // 비녜트 (HP 30% 이하 경고)
    this.vignetteLeft = this.add.rectangle(0, 0, 60, height, 0xff0000, 0).setOrigin(0);
    this.vignetteRight = this.add.rectangle(width, 0, 60, height, 0xff0000, 0).setOrigin(1, 0);
    this.vignetteTop = this.add.rectangle(0, 0, width, 60, 0xff0000, 0).setOrigin(0);
    this.vignetteBottom = this.add.rectangle(0, height, width, 60, 0xff0000, 0).setOrigin(0, 1);

    // 이벤트 리스너 (GameScene이 emit)
    this.events.on('hp-change', this.onHpChange, this);
    this.events.on('exp-change', this.onExpChange, this);
    this.events.on('level-change', this.onLevelChange, this);
    this.events.on('time-change', this.onTimeChange, this);
    this.events.on('kills-change', this.onKillsChange, this);
    this.events.on('weapons-change', this.onWeaponsChange, this);
  }

  private onHpChange({ hp, max }: { hp: number; max: number }): void {
    const ratio = hp / max;
    const barWidth = Math.floor(196 * ratio);
    this.tweens.add({
      targets: this.hpBar,
      width: barWidth,
      duration: 150,
    });
    this.hpText.setText(`HP: ${hp} / ${max}`);

    const isLow = ratio <= 0.3;
    if (isLow !== this.lowHp) {
      this.lowHp = isLow;
      const alpha = isLow ? 0.25 : 0;
      if (isLow) {
        this.tweens.add({
          targets: [this.vignetteLeft, this.vignetteRight, this.vignetteTop, this.vignetteBottom],
          alpha: 0.25,
          duration: 500,
          yoyo: true,
          repeat: -1,
        });
      } else {
        this.tweens.killTweensOf([this.vignetteLeft, this.vignetteRight, this.vignetteTop, this.vignetteBottom]);
        [this.vignetteLeft, this.vignetteRight, this.vignetteTop, this.vignetteBottom]
          .forEach(v => v.setAlpha(0));
      }
    }
  }

  private onExpChange({ exp, max }: { exp: number; max: number }): void {
    const { width } = this.scale;
    const ratio = exp / max;
    this.tweens.add({
      targets: this.expBar,
      width: width * ratio,
      duration: 200,
    });
  }

  private onLevelChange({ level }: { level: number }): void {
    this.levelText.setText(`⬆️ Lv.${level}`);

    // HP 바 확장 Tween
    this.tweens.add({
      targets: this.hpBar,
      scaleY: 1.5,
      duration: 200,
      yoyo: true,
    });
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
    // 기존 아이콘 제거
    this.weaponIcons.forEach(icon => icon.destroy());
    this.weaponIcons = [];

    const { height } = this.scale;
    weapons.forEach((weapon, i) => {
      const x = 12 + i * 44;
      const y = height - 60;

      const bg = this.add.rectangle(0, 0, 38, 38, 0x222244, 0.8).setStrokeStyle(1, 0x4444ff);
      const icon = this.add.image(0, 0, weapon.data.icon);
      icon.setDisplaySize(30, 30);
      const levelText = this.add.text(14, 14, `${weapon.level}`, {
        fontSize: '11px',
        color: '#ffff44',
        fontStyle: 'bold',
      }).setOrigin(1, 1);

      const container = this.add.container(x, y, [bg, icon, levelText]);
      this.weaponIcons.push(container);
    });
  }
}
