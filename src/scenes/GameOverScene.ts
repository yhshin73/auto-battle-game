import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';

interface GameOverData {
  kills: number;
  level: number;
  time: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add.rectangle(0, 0, width, height, 0x000000, 0).setOrigin(0);

    // 페이드인
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // 점수 계산
    const score = data.kills * 10 + data.level * 50 + data.time;
    const isNewRecord = score > SaveManager.getHighScore();
    SaveManager.saveHighScore(score);

    // 게임 오버 텍스트
    this.add.text(cx, cy - 150, '💀 GAME OVER 💀', {
      fontSize: '48px',
      color: '#ff2222',
      stroke: '#000000',
      strokeThickness: 6,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    if (isNewRecord) {
      this.add.text(cx, cy - 95, '🏆 NEW RECORD! 🏆', {
        fontSize: '22px',
        color: '#ffff44',
        fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    // 결과
    const mins = Math.floor(data.time / 60);
    const secs = data.time % 60;
    const results = [
      `⏱️  생존 시간:  ${mins}분 ${secs}초`,
      `⚔️  처치 수:    ${data.kills}마리`,
      `⬆️  달성 레벨:  Lv.${data.level}`,
      `🏅  총 점수:    ${score}`,
    ];

    results.forEach((line, i) => {
      this.add.text(cx, cy - 50 + i * 32, line, {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    });

    // 버튼들
    this.createButton(cx - 80, cy + 110, '재도전', 0x224422, () => {
      this.scene.stop();
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });

    this.createButton(cx + 80, cy + 110, '메인 메뉴', 0x222244, () => {
      this.scene.stop();
      this.scene.start('MainMenuScene');
    });
  }

  private createButton(x: number, y: number, label: string, color: number, onClick: () => void): void {
    const btn = this.add.rectangle(x, y, 130, 44, color)
      .setStrokeStyle(1, 0x888888)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setAlpha(0.8));
    btn.on('pointerout', () => btn.setAlpha(1));
    btn.on('pointerdown', onClick);
  }
}
