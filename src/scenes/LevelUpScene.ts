import Phaser from 'phaser';
import { WeaponData } from '../data/weapons';
import { OwnedWeapon, getUpgradeDescription } from '../systems/WeaponSystem';

interface LevelUpData {
  weapons: WeaponData[];
  ownedWeapons: OwnedWeapon[];
  onSelect: (weaponId: string) => void;
}

export class LevelUpScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelUpScene' });
  }

  create(data: LevelUpData): void {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x000000, 0.78).setOrigin(0);

    this.add.text(width / 2, 52, '⬆️ LEVEL UP! ⬆️', {
      fontSize: '34px', color: '#ffff44',
      stroke: '#000000', strokeThickness: 5, fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 92, '✨ 무기를 선택하세요 ✨', {
      fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5);

    const cardW = 192;
    const cardH = 250;
    const gap   = 18;
    const totalW = cardW * 3 + gap * 2;
    const startX = (width - totalW) / 2 + cardW / 2;
    const cardY  = height / 2 + 20;

    data.weapons.forEach((weapon, i) => {
      const x = startX + i * (cardW + gap);
      const owned = data.ownedWeapons.find(w => w.data.id === weapon.id);
      const isOwned = !!owned;
      const ownedLevel = owned?.level ?? 0;
      this.createCard(x, cardY, weapon, isOwned, ownedLevel, cardW, cardH, data.onSelect);
    });
  }

  private createCard(
    x: number, y: number,
    weapon: WeaponData,
    isOwned: boolean,
    ownedLevel: number,
    cardW: number,
    cardH: number,
    onSelect: (id: string) => void,
  ): void {
    const borderColor = isOwned ? 0xffaa00 : 0x3355dd;
    const initialY = y + 80;

    const bg = this.add.rectangle(x, initialY, cardW, cardH, 0x0f0f28, 0.97)
      .setStrokeStyle(2, borderColor)
      .setInteractive({ useHandCursor: true });

    const icon = this.add.image(x, initialY - 78, weapon.icon).setDisplaySize(52, 52);

    // 레벨 배지 (보유 시)
    let levelBadge: Phaser.GameObjects.Text | null = null;
    if (isOwned) {
      levelBadge = this.add.text(x, initialY - 110, `Lv.${ownedLevel} → Lv.${ownedLevel + 1}`, {
        fontSize: '12px', color: '#ffbb00', fontStyle: 'bold',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5);
    }

    const nameText = this.add.text(x, initialY - 38, weapon.name, {
      fontSize: '15px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    const descText = this.add.text(x, initialY - 14, weapon.description, {
      fontSize: '10px', color: '#aaaacc', align: 'center',
      wordWrap: { width: cardW - 16 },
    }).setOrigin(0.5, 0);

    // ── 강화 효과 설명 박스 (보유 시) ─────────────────
    const upgradeObjs: Phaser.GameObjects.GameObject[] = [];
    if (isOwned) {
      const upg = getUpgradeDescription(weapon.id, ownedLevel);

      const boxBg = this.add.rectangle(x, initialY + 72, cardW - 16, 66, 0x001100, 0.9)
        .setStrokeStyle(1, 0x33aa33, 0.8);

      const curLabel = this.add.text(x, initialY + 47, '현재', {
        fontSize: '9px', color: '#888888',
      }).setOrigin(0.5);
      const curText = this.add.text(x, initialY + 58, upg.current, {
        fontSize: '10px', color: '#aaddaa', align: 'center',
        wordWrap: { width: cardW - 24 },
      }).setOrigin(0.5, 0);

      const nextLabel = this.add.text(x, initialY + 84, '강화 후', {
        fontSize: '9px', color: '#44ff44',
      }).setOrigin(0.5);
      const nextText = this.add.text(x, initialY + 95, upg.next, {
        fontSize: '10px', color: '#44ff44', fontStyle: 'bold', align: 'center',
        wordWrap: { width: cardW - 24 },
      }).setOrigin(0.5, 0);

      upgradeObjs.push(boxBg, curLabel, curText, nextLabel, nextText);
    }

    // 색상 바
    const colorBar = this.add.rectangle(x, initialY + cardH / 2 - 12, cardW - 18, 3, weapon.color);

    const card = [
      bg, icon, nameText, descText, colorBar,
      ...(levelBadge ? [levelBadge] : []),
      ...upgradeObjs,
    ];

    // 등장 애니메이션
    this.tweens.add({ targets: card, y: '-=80', duration: 380, ease: 'Back.Out' });

    // 호버
    bg.on('pointerover', () => {
      this.tweens.add({ targets: card, scaleX: 1.04, scaleY: 1.04, duration: 90 });
      bg.setFillStyle(0x1a1a44);
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 90 });
      bg.setFillStyle(0x0f0f28);
    });

    // 선택
    bg.on('pointerdown', () => {
      this.tweens.add({ targets: card, alpha: 0, duration: 180, onComplete: () => onSelect(weapon.id) });
    });
  }
}
