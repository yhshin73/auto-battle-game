import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { WEAPON_DATA, WeaponData } from '../data/weapons';
import { EffectSystem } from './EffectSystem';
import { MagicWand } from '../weapons/MagicWand';
import { Fireball } from '../weapons/Fireball';
import { ThunderLance } from '../weapons/ThunderLance';
import { WhirlBlade } from '../weapons/WhirlBlade';
import { MagicArrow } from '../weapons/MagicArrow';
import { BombThrow } from '../weapons/BombThrow';
import { IceSpear } from '../weapons/IceSpear';
import { NatureVine } from '../weapons/NatureVine';
import { DeathScythe } from '../weapons/DeathScythe';
import { LightSanctuary } from '../weapons/LightSanctuary';
import { DarkOrb } from '../weapons/DarkOrb';

export interface OwnedWeapon {
  data: WeaponData;
  level: number;
  lastFired: number;
}

export type WeaponFn = (
  scene: Phaser.Scene,
  player: Player,
  enemies: Phaser.Physics.Arcade.Group,
  projectiles: Phaser.Physics.Arcade.Group,
  weapon: OwnedWeapon,
  effects: EffectSystem,
) => void;

const WEAPON_HANDLERS: Record<string, WeaponFn> = {
  magic_wand:      MagicWand,
  fireball:        Fireball,
  thunder_lance:   ThunderLance,
  whirl_blade:     WhirlBlade,
  magic_arrow:     MagicArrow,
  bomb_throw:      BombThrow,
  ice_spear:       IceSpear,
  nature_vine:     NatureVine,
  death_scythe:    DeathScythe,
  light_sanctuary: LightSanctuary,
  dark_orb:        DarkOrb,
};

// 무기별 고유 강화 설명
export function getUpgradeDescription(
  weaponId: string,
  level: number,
): { current: string; next: string } {
  const lv = level;
  const map: Record<string, (l: number) => { current: string; next: string }> = {
    magic_wand:      l => ({ current: `투사체 ${l}개 | 슬로우 30% 2초`, next: `투사체 ${l + 1}개` }),
    fireball:        l => ({ current: `화염 영역 반경 ${80 + (l - 1) * 30}px`, next: `반경 ${80 + l * 30}px` }),
    thunder_lance:   l => ({ current: `기절 ${0.5 * l}초`, next: `기절 ${0.5 * (l + 1)}초` }),
    whirl_blade:     l => ({ current: `검 ${l + 1}개`, next: `검 ${l + 2}개` }),
    magic_arrow:     l => ({ current: `${l}회 관통`, next: `${l + 1}회 관통` }),
    bomb_throw:      l => ({ current: `폭발 반경 ${100 + (l - 1) * 30}px`, next: `반경 ${100 + l * 30}px` }),
    ice_spear:       l => ({ current: `투사체 ${l}개 | 빙결 ${1 + 0.5 * (l - 1)}초`, next: `투사체 ${l + 1}개 | 빙결 ${1 + 0.5 * l}초` }),
    nature_vine:     l => ({ current: `${1 + 2 * (l - 1)}마리 구속 | 피해 +${50 + 10 * (l - 1)}%`, next: `${1 + 2 * l}마리 | +${50 + 10 * l}%` }),
    death_scythe:    l => ({ current: `HP ${10 + 5 * (l - 1)}% 이하 즉사`, next: `HP ${10 + 5 * l}% 이하 즉사` }),
    light_sanctuary: l => ({ current: `반경 ${120 + 30 * (l - 1)}px`, next: `반경 ${120 + 30 * l}px` }),
    dark_orb:        l => ({ current: `오브 ${l + 2}개 | 공포 2초`, next: `오브 ${l + 3}개` }),
  };
  return map[weaponId]?.(lv) ?? { current: `Lv.${lv}`, next: `Lv.${lv + 1}` };
}

export class WeaponSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private enemyGroup: Phaser.Physics.Arcade.Group;
  private projectileGroup: Phaser.Physics.Arcade.Group;
  private effects: EffectSystem;
  ownedWeapons: OwnedWeapon[] = [];

  constructor(
    scene: Phaser.Scene,
    player: Player,
    enemyGroup: Phaser.Physics.Arcade.Group,
    projectileGroup: Phaser.Physics.Arcade.Group,
    effects: EffectSystem,
  ) {
    this.scene = scene;
    this.player = player;
    this.enemyGroup = enemyGroup;
    this.projectileGroup = projectileGroup;
    this.effects = effects;
  }

  applyWeapon(weaponId: string): void {
    const existing = this.ownedWeapons.find(w => w.data.id === weaponId);
    if (existing) {
      existing.level++;
    } else {
      const data = WEAPON_DATA.find(d => d.id === weaponId);
      if (!data) return;
      this.ownedWeapons.push({ data, level: 1, lastFired: 0 });
    }
  }

  fireAllWeapons(time: number): void {
    for (const weapon of this.ownedWeapons) {
      const cooldown = weapon.data.cooldown;
      if (cooldown === 0 || time - weapon.lastFired >= cooldown) {
        const handler = WEAPON_HANDLERS[weapon.data.id];
        if (handler) {
          handler(this.scene, this.player, this.enemyGroup, this.projectileGroup, weapon, this.effects);
          if (cooldown > 0) weapon.lastFired = time;
        }
      }
    }
  }

  getRandomWeaponChoices(count = 3): WeaponData[] {
    const shuffled = [...WEAPON_DATA].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
