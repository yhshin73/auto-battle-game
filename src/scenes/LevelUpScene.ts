import Phaser from 'phaser';
import { WeaponData } from '../data/weapons';
import { OwnedWeapon } from '../systems/WeaponSystem';

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

    // 반투명 어두운 오버레이
    this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0);

    // 타이틀
    this.add.text(width / 2, 60, '⬆️ LEVEL UP! ⬆️', {
      fontSize: '36px',
      color: '#ffff44',
      stroke: '#000000',
      strokeThickness: 5,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 100, '✨ 무기를 선택하세요 ✨', {
      fontSize: '18px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    const cardWidth = 180;
    const cardHeight = 220;
    const gap = 20;
    const totalWidth = cardWidth * 3 + gap * 2;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;
    const cardY = height / 2 + 10;

    data.weapons.forEach((weapon, i) => {
      const x = startX + i * (cardWidth + gap);
      const isOwned = data.ownedWeapons.some(w => w.data.id === weapon.id);
      const ownedLevel = data.ownedWeapons.find(w => w.data.id === weapon.id)?.level ?? 0;

      this.createCard(x, cardY, weapon, isOwned, ownedLevel, cardWidth, cardHeight, data.onSelect);
    });
  }

  private createCard(
    x: number,
    y: number,
    weapon: WeaponData,
    isOwned: boolean,
    ownedLevel: number,
    cardWidth: number,
    cardHeight: number,
    onSelect: (id: string) => void,
  ): void {
    const borderColor = isOwned ? 0xffaa00 : 0x4444ff;
    const initialY = y + 100;

    // 카드 배경
    const bg = this.add.rectangle(x, initialY, cardWidth, cardHeight, 0x111133, 0.95)
      .setStrokeStyle(2, borderColor)
      .setInteractive({ useHandCursor: true });

    // 무기 아이콘
    const icon = this.add.image(x, initialY - 60, weapon.icon)
      .setDisplaySize(64, 64);

    // 강화 표시
    if (isOwned) {
      this.add.text(x, initialY - 90, `Lv.${ownedLevel} → Lv.${ownedLevel + 1}`, {
        fontSize: '13px',
        color: '#ffaa00',
        fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // 무기명
    const nameText = this.add.text(x, initialY - 20, weapon.name, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 설명
    const descText = this.add.text(x, initialY + 15, weapon.description, {
      fontSize: '11px',
      color: '#aaaacc',
      align: 'center',
      wordWrap: { width: cardWidth - 20 },
    }).setOrigin(0.5, 0);

    // 색상 표시 바
    this.add.rectangle(x, initialY + cardHeight / 2 - 15, cardWidth - 20, 4, weapon.color)
      .setOrigin(0.5, 0.5);

    const card = [bg, icon, nameText, descText];

    // 등장 애니메이션 (y: +100 → 0)
    this.tweens.add({
      targets: card,
      y: `-=100`,
      duration: 400,
      ease: 'Back.Out',
    });

    // 호버 효과
    bg.on('pointerover', () => {
      this.tweens.add({ targets: card, scaleX: 1.04, scaleY: 1.04, duration: 100 });
      bg.setFillStyle(0x222255);
    });
    bg.on('pointerout', () => {
      this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 100 });
      bg.setFillStyle(0x111133);
    });

    // 선택
    bg.on('pointerdown', () => {
      this.tweens.add({
        targets: card,
        alpha: 0,
        duration: 200,
        onComplete: () => onSelect(weapon.id),
      });
    });
  }
}
