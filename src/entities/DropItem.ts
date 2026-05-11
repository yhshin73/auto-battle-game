import Phaser from 'phaser';
import { DropItemType } from '../data/dropItems';

export class DropItem extends Phaser.Physics.Arcade.Sprite {
  itemType!: DropItemType;
  expValue: number = 5;
  private lifetime: number = 10000;
  private elapsed: number = 0;

  init(x: number, y: number, type: DropItemType, expValue = 5): void {
    this.setPosition(x, y);
    this.itemType = type;
    this.expValue = expValue;
    this.elapsed = 0;
    this.lifetime = Infinity;  // 시간이 지나도 사라지지 않음
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.setDepth(3);
    this.body?.reset(x, y);
    (this.body as Phaser.Physics.Arcade.Body)?.setVelocity(0, 0);

    // 타입별 이모지 텍스처
    const textureMap: Record<DropItemType, string> = {
      exp: 'drop_exp',
      bomb: 'drop_bomb',
      meat: 'drop_meat',
      magnet: 'drop_magnet',
    };
    const sizeMap: Record<DropItemType, number> = {
      exp: 22,
      bomb: 28,
      meat: 28,
      magnet: 28,
    };
    const texKey = textureMap[type];
    if (this.scene.textures.exists(texKey)) this.setTexture(texKey);
    this.clearTint();
    const sz = sizeMap[type];
    this.setDisplaySize(sz, sz);
  }

  update(_delta: number): void {
    // 영구 유지 — 소멸 없음
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
  }
}
