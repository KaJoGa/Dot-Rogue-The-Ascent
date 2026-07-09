import { EntityType, GameState, Vector2 } from '../../types';
import { math, checkCollision } from '../../utils';
import { BaseEntity } from '../BaseEntity';
import { Pickup } from '../Pickup';

export class Enemy extends BaseEntity {
  type = EntityType.ENEMY;
  color = '#ef4444';
  targetTimer = 0;
  baseSpeed: number;

  constructor(pos: Vector2, level: number) {
    super(pos);
    this.radius = 14;
    this.hp = this.maxHp = 20 + level * 5;
    this.damage = 5 + level * 1.5;
    this.baseSpeed = this.speed = 120;
  }

  update(dt: number, game: GameState) {
    this.updateAI(dt, game);
    this.separateFromEnemies(dt, game);
    this.handlePlayerCollision(game);
    super.update(dt, game);
  }

  /**
   * Updates enemy ai logic, such as targeting the player.
   */
  updateAI(dt: number, game: GameState) {
    this.targetTimer -= dt;
    if (this.targetTimer <= 0) {
       this.targetTimer = 0.5;
       const dir = math.normalize(math.sub(game.player.pos, this.pos));
       this.vel = math.mul(dir, this.speed);
    }
  }

  /**
   * Pushes the enemy away from other enemies to prevent stacking.
   */
  separateFromEnemies(dt: number, game: GameState) {
    for (const ent of game.entities) {
      if ((ent.type === EntityType.ENEMY || ent.type === EntityType.SPECIAL_ENEMY || ent.type === EntityType.ELITE_ENEMY || ent.type === EntityType.BOSS) && ent.id !== this.id) {
         const dist = math.dist(this.pos, ent.pos);
         // Dynamic distance checking based on both entity radii
         if (dist < this.radius + ent.radius + 5) {
            const push = math.normalize(math.sub(this.pos, ent.pos));
            this.pos = math.add(this.pos, math.mul(push, dt * 50));
         }
      }
    }
  }

  /**
   * Applies damage and knockback to the player upon contact.
   */
  handlePlayerCollision(game: GameState) {
    if (checkCollision(this.pos, this.radius, game.player.pos, game.player.radius)) {
       game.player.takeDamage(this.damage, game);
       const dir = math.normalize(math.sub(game.player.pos, this.pos));
       game.player.applyKnockback(dir, 270);
    }
  }

  takeDamage(amt: number, game: GameState) {
    BaseEntity.prototype.takeDamage.call(this, amt, game);
    if (this.isDead) {
      game.addEntity(new Pickup(this.pos, 0, 1)); // xp
      
      // 5% chance to drop 1-3 gold
      if (Math.random() < 0.05) {
          const goldAmt = Math.floor(Math.random() * 3) + 1;
          for(let i=0; i<goldAmt; i++) game.addEntity(new Pickup(math.add(this.pos, {x: math.randomRange(-15,15), y:math.randomRange(-15,15)}), 1, 1));
      }
      
      // 50% chance to drop 1 ammo
      if (Math.random() < 0.50) {
          game.addEntity(new Pickup(math.add(this.pos, {x: -5, y: -5}), 3, 1)); // ammo
      }
    }
  }
}
