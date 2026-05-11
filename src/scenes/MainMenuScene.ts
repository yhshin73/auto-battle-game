import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // 배경
    this.add.rectangle(0, 0, width, height, 0x0d0d1a).setOrigin(0);

    // 별 배경
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const r = Phaser.Math.Between(1, 3);
      this.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.2, 0.8));
    }

    // 타이틀
    this.add.text(cx, cy - 130, '⚔️ 서바이버 디펜스 ⚔️', {
      fontSize: '44px',
      color: '#ffffff',
      stroke: '#000088',
      strokeThickness: 6,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 80, '🧙 SURVIVOR DEFENSE 🧙', {
      fontSize: '17px',
      color: '#8888ff',
    }).setOrigin(0.5);

    // 최고 점수
    const highScore = SaveManager.getHighScore();
    this.add.text(cx, cy - 32, `🏆 최고 점수: ${highScore}`, {
      fontSize: '18px',
      color: '#ffff88',
    }).setOrigin(0.5);

    // 시작 버튼
    const startBtn = this.add.rectangle(cx, cy + 40, 200, 50, 0x4444ff, 1)
      .setInteractive({ useHandCursor: true });
    const startText = this.add.text(cx, cy + 40, '게임 시작', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    startBtn.on('pointerover', () => startBtn.setFillStyle(0x6666ff));
    startBtn.on('pointerout', () => startBtn.setFillStyle(0x4444ff));
    startBtn.on('pointerdown', () => this.startGame());

    // 조작법
    this.add.text(cx, cy + 130, '🕹️ WASD / 방향키로 이동\n👾 적을 피하며 생존하세요!\n💎 EXP 획득 → ⬆️ 레벨업 → 🪄 무기 강화', {
      fontSize: '13px',
      color: '#888888',
      align: 'center',
    }).setOrigin(0.5);

    // 반짝임 애니메이션
    this.tweens.add({
      targets: startText,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  private startGame(): void {
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }
}
