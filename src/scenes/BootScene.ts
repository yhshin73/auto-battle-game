import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    SaveManager.getSettings(); // 설정값 초기화
    this.scene.start('PreloadScene');
  }
}
