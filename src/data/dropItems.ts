export type DropItemType = 'exp' | 'bomb' | 'meat' | 'magnet';

export interface DropItemData {
  type: DropItemType;
  color: number;
  scale: number;
  lifetime: number;  // ms, 0 = infinite
}

export const DROP_ITEM_DATA: Record<DropItemType, DropItemData> = {
  exp: {
    type: 'exp',
    color: 0x00ff88,
    scale: 0.5,
    lifetime: 10000,
  },
  bomb: {
    type: 'bomb',
    color: 0xff4400,
    scale: 0.8,
    lifetime: 10000,
  },
  meat: {
    type: 'meat',
    color: 0xff8888,
    scale: 0.8,
    lifetime: 10000,
  },
  magnet: {
    type: 'magnet',
    color: 0xaaaaff,
    scale: 0.8,
    lifetime: 10000,
  },
};

export const DROP_RATES = {
  itemDropChance: 0.05,    // 5%
  bombChance: 0.333,
  meatChance: 0.333,
  magnetChance: 0.334,
};
