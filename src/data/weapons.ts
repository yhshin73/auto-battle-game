export interface WeaponData {
  id: string;
  name: string;
  description: string;
  damage: number;
  cooldown: number;  // ms
  icon: string;
  color: number;
}

export const WEAPON_DATA: WeaponData[] = [
  {
    id: 'magic_wand',
    name: '마법 지팡이',
    description: '가장 가까운 적을 자동 추적. 맞은 적 이동속도 50% 감소 3초.',
    damage: 20,
    cooldown: 833,
    icon: 'icon_wand',
    color: 0xffff44,
  },
  {
    id: 'fireball',
    name: '파이어볼',
    description: '정방향 불덩이 발사. 맞은 적에게 2초 DoT 15/초.',
    damage: 25,
    cooldown: 1200,
    icon: 'icon_fire',
    color: 0xff4400,
  },
  {
    id: 'thunder_lance',
    name: '번개 창',
    description: '관통하는 전기 창 일직선 발사. 경로 전체 적 0.5초 기절.',
    damage: 35,
    cooldown: 2000,
    icon: 'icon_thunder',
    color: 0xffff00,
  },
  {
    id: 'whirl_blade',
    name: '회오리 검',
    description: '플레이어 주변 공전하는 검기. 범위 반경 80px.',
    damage: 18,
    cooldown: 0,
    icon: 'icon_blade',
    color: 0x44ffff,
  },
  {
    id: 'magic_arrow',
    name: '마법 화살',
    description: '3방향 동시 발사. 명중 시 DoT 8/초 x 4초.',
    damage: 22,
    cooldown: 1000,
    icon: 'icon_arrow',
    color: 0xaa44ff,
  },
  {
    id: 'bomb_throw',
    name: '폭탄 투척',
    description: '랜덤 위치 투척 후 폭발. 폭발 반경 100px.',
    damage: 60,
    cooldown: 3000,
    icon: 'icon_bomb',
    color: 0xff8800,
  },
  {
    id: 'ice_spear',
    name: '아이스 스피어',
    description: '냉각 창 발사. 30% 확률로 2초 빙결.',
    damage: 30,
    cooldown: 1500,
    icon: 'icon_ice',
    color: 0x88ddff,
  },
  {
    id: 'nature_vine',
    name: '자연의 덩굴',
    description: '최대 3마리 구속 1.5초. 구속 중 피해 +50%.',
    damage: 15,
    cooldown: 4000,
    icon: 'icon_vine',
    color: 0x44ff44,
  },
  {
    id: 'death_scythe',
    name: '사신의 낫',
    description: '180도 반원 관통 공격. HP 10% 이하 적 즉사.',
    damage: 50,
    cooldown: 2500,
    icon: 'icon_scythe',
    color: 0x8800ff,
  },
  {
    id: 'light_sanctuary',
    name: '빛의 성소',
    description: '반경 120px 신성한 영역 생성. 범위 내 적 DoT 20/초.',
    damage: 20,
    cooldown: 5000,
    icon: 'icon_light',
    color: 0xffffaa,
  },
  {
    id: 'dark_orb',
    name: '암흑 구체',
    description: '플레이어 주변 3개 공전. 공포 부여 시 적 도주.',
    damage: 28,
    cooldown: 0,
    icon: 'icon_orb',
    color: 0x6600cc,
  },
];
