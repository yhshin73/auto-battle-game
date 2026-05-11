export interface EnemyData {
  key: string;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  expReward: number;
  minLevel: number;
  isBoss: boolean;
  tint?: number;
  scale?: number;
}

export const ENEMY_DATA: Record<string, EnemyData> = {
  slime: {
    key: 'slime',
    name: '슬라임',
    hp: 35,
    speed: 80,
    damage: 8,
    expReward: 5,
    minLevel: 1,
    isBoss: false,
  },
  goblin: {
    key: 'goblin',
    name: '고블린',
    hp: 35,
    speed: 150,
    damage: 12,
    expReward: 7,
    minLevel: 2,
    isBoss: false,
    tint: 0x88ff88,
  },
  orc: {
    key: 'orc',
    name: '오크',
    hp: 130,
    speed: 65,
    damage: 22,
    expReward: 15,
    minLevel: 4,
    isBoss: false,
    tint: 0xaa6633,
    scale: 1.4,
  },
  mage: {
    key: 'mage',
    name: '마법사',
    hp: 70,
    speed: 75,
    damage: 18,
    expReward: 12,
    minLevel: 5,
    isBoss: false,
    tint: 0xaa88ff,
  },
  boss: {
    key: 'boss',
    name: '보스',
    hp: 800,
    speed: 55,
    damage: 45,
    expReward: 100,
    minLevel: 5,
    isBoss: true,
    tint: 0xff2222,
    scale: 2.0,
  },
};

export const LEVEL_SCALING = {
  hpMultiplier: 0,
  speedMultiplier: 0,
  speedMax: 240,
  damageMultiplier: 0,
};
