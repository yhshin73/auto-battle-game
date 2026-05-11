import Phaser from 'phaser';
import { DropItem } from '../entities/DropItem';
import { DROP_RATES, DropItemType } from '../data/dropItems';
import { Player } from '../entities/Player';

export class DropSystem {
  private scene: Phaser.Scene;
  private dropGroup: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, dropGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.dropGroup = dropGroup;
  }

  dropFromEnemy(x: number, y: number, expValue: number): void {
    this.spawnDrop(x, y, 'exp', expValue);

    if (Math.random() < DROP_RATES.itemDropChance) {
      const roll = Math.random();
      let type: DropItemType;
      if (roll < DROP_RATES.bombChance) type = 'bomb';
      else if (roll < DROP_RATES.bombChance + DROP_RATES.meatChance) type = 'meat';
      else type = 'magnet';
      this.spawnDrop(x + Phaser.Math.Between(-15, 15), y + Phaser.Math.Between(-15, 15), type);
    }
  }

  private spawnDrop(x: number, y: number, type: DropItemType, expValue = 5): void {
    const item = this.dropGroup.get(x, y, 'drop_exp') as DropItem;
    if (!item) return;
    item.init(x, y, type, expValue);
  }

  handlePickup(player: Player, item: DropItem, onBombExplode: (x: number, y: number) => void): void {
    if (!item.active) return;

    switch (item.itemType) {
      case 'exp':
        player.gainExp(item.expValue);
        break;

      case 'bomb':
        onBombExplode(player.x, player.y);
        break;

      case 'meat': {
        const healed = player.healPercent(0.3);
        this.showFloatingText(player.x, player.y - 30, `+${healed} HP`, 0xff8888);
        break;
      }

      case 'magnet':
        this.collectAllExp(player);
        break;
    }

    item.deactivate();
  }

  collectAllExp(player: Player): void {
    const drops = this.dropGroup.getChildren() as DropItem[];
    drops.forEach(drop => {
      if (!drop.active || drop.itemType !== 'exp') return;
      this.scene.tweens.add({
        targets: drop,
        x: player.x,
        y: player.y,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          if (drop.active) {
            player.gainExp(drop.expValue);
            drop.deactivate();
          }
        },
      });
    });
  }

  bombExplodeAll(player: Player, enemyGroup: Phaser.Physics.Arcade.Group): void {
    const enemies = enemyGroup.getChildren() as (Phaser.Physics.Arcade.Sprite & { takeDamage: (n: number) => boolean; die: () => void; expReward: number })[];
    const toKill: typeof enemies = [];

    for (const enemy of enemies) {
      if (enemy.active) toKill.push(enemy);
    }

    // 순차 처리 (연쇄 드롭 가능)
    for (const enemy of toKill) {
      this.dropFromEnemy(enemy.x, enemy.y, enemy.expReward);
      enemy.die();
      player.kills++;
    }
  }

  private showFloatingText(x: number, y: number, text: string, color: number): void {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const t = this.scene.add.text(x, y, text, {
      fontSize: '20px',
      color: hex,
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(20).setOrigin(0.5);

    this.scene.tweens.add({
      targets: t,
      y: y - 60,
      alpha: 0,
      duration: 1000,
      ease: 'Power1',
      onComplete: () => t.destroy(),
    });
  }
}
