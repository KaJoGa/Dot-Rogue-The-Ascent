import { EntityType, GameState, Vector2, Camera } from '../../types';
import { math } from '../../utils';
import { useStore } from '../../../store';
import { BaseEntity } from '../BaseEntity';
import { Sabre } from '../../weapons/Sabre';
import { Bow } from '../../weapons/Bow';
import { Weapon } from '../../weapons/Weapon';
import { PlasmaDagger } from '../../weapons/PlasmaDagger';
import { HeavyHammer } from '../../weapons/HeavyHammer';
import { HandCannon } from '../../weapons/HandCannon';

export class Player extends BaseEntity {
  type = EntityType.PLAYER;
  radius = 16;
  color = '#34D399';
  dashCooldown = 0;
  maxDashCooldown = 1.25;
  dashActiveTimer = 0;
  dashCurrentDir: Vector2 = { x: 0, y: 0 };
  invulnTimer = 0;
  regenTimer = 0;
  minAtkSpeedMod = 0.4; // Can be lowered by weapons
  attackRangeCap = 100;

  weapons: { melee: Weapon, ranged: Weapon };

  get rangedCooldown() { return this.weapons.ranged.cooldown; }
  get maxRangedCooldown() { return this.weapons.ranged.maxCooldown; }
  get meleeCooldown() { return this.weapons.melee.cooldown; }
  get maxMeleeCooldown() { return this.weapons.melee.maxCooldown; }

  stats: any; // injected from store

  /**
   * Initializes player stats and starting weapons using global store upgrades.
   */
  constructor(pos: Vector2, stats: any) {
    super(pos);
    this.stats = stats;
    let meleeWeapon: Weapon = new Sabre();
    if (stats.selectedWeapons && stats.selectedWeapons.melee === 'plasma_dagger') {
        meleeWeapon = new PlasmaDagger();
    } else if (stats.selectedWeapons && stats.selectedWeapons.melee === 'heavy_hammer') {
        meleeWeapon = new HeavyHammer();
    }
    
    let rangedWeapon: Weapon = stats.selectedWeapons?.ranged === 'hand_cannon' ? new HandCannon() : new Bow();
    
    this.weapons = {
        melee: meleeWeapon,
        ranged: rangedWeapon
    };
    
    this.damage = 10 + stats.upgrades.damage * 5 + this.weapons.melee.baseDamage + stats.runUpgrades.damage;
    
    // Trigger equip passives
    Object.values(this.weapons).forEach(w => w.equip(this));
    this.recalculateStats(false);
    this.hp = this.maxHp;
  }

  private recalculateStats(preserveHp: boolean = true) {
    const targetMaxHp = 100 + this.stats.upgrades.health * 50 + this.stats.runUpgrades.hp;
    if (preserveHp && targetMaxHp > this.maxHp) {
       this.hp += (targetMaxHp - this.maxHp);
    }
    this.maxHp = targetMaxHp;
    this.hp = Math.min(this.hp, this.maxHp);
    this.speed = Math.min(this.weapons.melee.moveSpeedCap ?? 350, 150 + this.stats.upgrades.speed * 15 + this.stats.runUpgrades.speed);
    this.atkSpeedMod = Math.max(this.minAtkSpeedMod, 0.7 + this.stats.runUpgrades.atkSpeed);
    this.attackRange = Math.min(
      this.attackRangeCap,
      50 + this.stats.upgrades.range * 4 + this.weapons.melee.baseRange + this.stats.runUpgrades.atkRange
    );
    this.damage = 10 + this.stats.upgrades.damage * 5 + this.weapons.melee.baseDamage + this.stats.runUpgrades.damage;
  }

  /**
   * Updates player stats, handles input for movement and dashing, 
   * applies health regeneration, and updates held weapons.
   */
  update(dt: number, game: GameState) {
    this.stats = useStore.getState();

    // Hot-swap Melee Weapon
    const selectedMelee = this.stats.selectedWeapons?.melee || 'sabre';
    if (this.weapons.melee.id !== selectedMelee) {
        this.weapons.melee.unequip(this);
        if (selectedMelee === 'plasma_dagger') {
            this.weapons.melee = new PlasmaDagger();
        } else if (selectedMelee === 'heavy_hammer') {
            this.weapons.melee = new HeavyHammer();
        } else {
            this.weapons.melee = new Sabre();
        }
        this.weapons.melee.equip(this);
    }
    
    // Hot-swap Ranged Weapon
    const selectedRanged = this.stats.selectedWeapons?.ranged || 'bow';
    if (selectedRanged !== 'none' && this.weapons.ranged.id !== selectedRanged) {
        this.weapons.ranged.unequip(this);
        this.weapons.ranged = selectedRanged === 'hand_cannon' ? new HandCannon() : new Bow();
        this.weapons.ranged.equip(this);
    }
    
    this.recalculateStats();

    if (this.dashActiveTimer > 0) {
      this.dashActiveTimer -= dt;
      // Fixed velocity to cover 250 pixels over 0.2s.
      this.vel = math.mul(this.dashCurrentDir, 800);
      this.invulnTimer = Math.max(this.invulnTimer, this.dashActiveTimer);

      if (this.dashActiveTimer <= 0) {
        this.vel = math.mul(this.dashCurrentDir, this.speed);
      }
    } else {
      let input = { x: 0, y: 0 };
      if (game.keys['w']) input.y -= 1;
      if (game.keys['s']) input.y += 1;
      if (game.keys['a']) input.x -= 1;
      if (game.keys['d']) input.x += 1;

      if (math.mag(input) > 0) {
        input = math.normalize(input);
        this.vel = math.lerpVector(this.vel, math.mul(input, this.speed), dt * 10);
      } else {
        this.vel = math.lerpVector(this.vel, { x: 0, y: 0 }, dt * 10);
      }

      // dash
      if (game.keys[' '] && this.dashCooldown <= 0) {
        let dashDir = { x: 0, y: 0 };
        if (game.keys['w']) dashDir.y -= 1;
        if (game.keys['s']) dashDir.y += 1;
        if (game.keys['a']) dashDir.x -= 1;
        if (game.keys['d']) dashDir.x += 1;
        
        if (math.mag(dashDir) > 0) {
          dashDir = math.normalize(dashDir);
        } else if (math.mag(this.vel) > 0) {
          dashDir = math.normalize(this.vel);
        } else {
          dashDir = { x: 1, y: 0 };
        }

        this.dashCurrentDir = dashDir;
        this.dashActiveTimer = 0.2;
        this.dashCooldown = this.maxDashCooldown;
        this.invulnTimer = 0.2;
      }
    }

    // regen
    this.regenTimer += dt;
    if (this.regenTimer >= 3) {
       this.regenTimer = 0;
       if (this.hp < this.maxHp) {
          this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.02);
       }
    }

    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;

    // Constrain to active map bounds roughly
    this.pos.x = Math.max(0, Math.min(game.width, this.pos.x));
    this.pos.y = Math.max(0, Math.min(game.height, this.pos.y));

    // Update weapons
    this.weapons.melee.update(dt, game, this);
    if (!this.weapons.melee.disablesRanged) {
      this.weapons.ranged.update(dt, game, this);
    } else {
      (window as any).currentRangedWeaponState = { id: 'locked' };
    }

    super.update(dt, game);
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera) {
    super.draw(ctx, camera);
    if (this.dashCooldown > 0) {
      const pct = 1 - (this.dashCooldown / this.maxDashCooldown);
      ctx.beginPath();
      ctx.arc(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y, this.radius + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      // draw background ring
      ctx.beginPath();
      ctx.arc(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y, this.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.2)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  takeDamage(amt: number, game: GameState) {
    if (this.invulnTimer > 0) return;
    super.takeDamage(amt, game);
    this.invulnTimer = 0.2;
  }
}
