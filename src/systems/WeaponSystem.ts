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
  damageMultiplier: number;
  cooldownMultiplier: number;
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
  magic_wand: MagicWand,
  fireball: Fireball,
  thunder_lance: ThunderLance,
  whirl_blade: WhirlBlade,
  magic_arrow: MagicArrow,
  bomb_throw: BombThrow,
  ice_spear: IceSpear,
  nature_vine: NatureVine,
  death_scythe: DeathScythe,
  light_sanctuary: LightSanctuary,
  dark_orb: DarkOrb,
};

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
      existing.damageMultiplier *= 1.15;
      existing.cooldownMultiplier *= 0.9;
    } else {
      const data = WEAPON_DATA.find(d => d.id === weaponId);
      if (!data) return;
      this.ownedWeapons.push({
        data,
        level: 1,
        damageMultiplier: 1,
        cooldownMultiplier: 1,
        lastFired: 0,
      });
    }
  }

  fireAllWeapons(time: number): void {
    for (const weapon of this.ownedWeapons) {
      const effectiveCooldown = weapon.data.cooldown * weapon.cooldownMultiplier;
      if (effectiveCooldown === 0 || time - weapon.lastFired >= effectiveCooldown) {
        const handler = WEAPON_HANDLERS[weapon.data.id];
        if (handler) {
          handler(this.scene, this.player, this.enemyGroup, this.projectileGroup, weapon, this.effects);
          if (effectiveCooldown > 0) weapon.lastFired = time;
        }
      }
    }
  }

  getRandomWeaponChoices(count = 3): WeaponData[] {
    const all = [...WEAPON_DATA];
    const choices: WeaponData[] = [];
    const shuffled = all.sort(() => Math.random() - 0.5);
    for (const w of shuffled) {
      if (choices.length >= count) break;
      choices.push(w);
    }
    return choices;
  }
}
