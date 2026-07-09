import { EntityType, GameState, Vector2 } from '../../types';
import { math, checkCollision } from '../../utils';
import { BaseEntity } from '../BaseEntity';
import { Enemy } from './Enemy';
import { Projectile } from '../Projectile';
import { Pickup } from '../Pickup';

export class EliteEnemy extends Enemy {
  type = EntityType.ELITE_ENEMY;
  color = '#3b82f6'; // blue-500
  attackTimer = 0;

  constructor(pos: Vector2, level: number) {
    super(pos, level);
    this.maxHp = 30 + level * 2;
    this.hp = this.maxHp;
    this.damage = 10 + level * 5;
    this.speed = 100;
    this.baseSpeed = this.speed;
    this.radius = 16;
  }

  updateAI(dt: number, game: GameState) {
    this.targetTimer -= dt;
    this.attackTimer -= dt;
    
    const distToPlayer = math.dist(game.player.pos, this.pos);

    if (this.targetTimer <= 0) {
       this.targetTimer = 0.5;
       if (distToPlayer > 300) {
           const dir = math.normalize(math.sub(game.player.pos, this.pos));
           this.vel = math.mul(dir, this.speed);
       } else {
           this.vel = math.lerpVector(this.vel, {x:0, y:0}, 0.5); // stop or slow down
       }
    }
    
    if (this.attackTimer <= 0) {
        this.attackTimer = 3.0;
        const dir = math.normalize(math.sub(game.player.pos, this.pos));
        const proj = new Projectile(this.pos, dir, false, this.damage, 200);
        game.addEntity(proj);
    }
  }

  takeDamage(amt: number, game: GameState) {
    BaseEntity.prototype.takeDamage.call(this, amt, game);
    if (this.isDead) {
      for(let i=0; i<3; i++) game.addEntity(new Pickup(math.add(this.pos, {x: math.randomRange(-15,15), y:math.randomRange(-15,15)}), 0, 1)); // 3 xp
      
      if (Math.random() < 0.20) { // 20% chance to drop 5~10 gold
          const goldAmt = Math.floor(Math.random() * 6) + 5;
          for(let i=0; i<goldAmt; i++) game.addEntity(new Pickup(math.add(this.pos, {x: math.randomRange(-20,20), y:math.randomRange(-20,20)}), 1, 1));
      }
      
      if (Math.random() < 0.70) { // 70% chance to drop 3~5 ammo
          const ammoAmt = Math.floor(Math.random() * 3) + 3;
          for(let i=0; i<ammoAmt; i++) game.addEntity(new Pickup(math.add(this.pos, {x: math.randomRange(-20,20), y:math.randomRange(-20,20)}), 3, 1));
      }
    }
  }
}
