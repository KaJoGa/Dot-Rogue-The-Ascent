import { EntityType, GameState, Vector2 } from '../../types';
import { math, checkCollision } from '../../utils';
import { BaseEntity } from '../BaseEntity';
import { Enemy } from './Enemy';
import { Projectile } from '../Projectile';
import { Pickup } from '../Pickup';
import { theme } from '../../theme';

export class EliteEnemy extends Enemy {
  type = EntityType.ELITE_ENEMY;
  color = theme.enemies.elite;
  outlineColor = '#A3CBFC';
  outlineWidth = 3;
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
    this.attackTimer -= dt;
    
    const distToPlayer = math.dist(game.player.pos, this.pos);
    let desiredVel = {x: 0, y: 0};

    // Only move towards player if further than 300 units
    if (distToPlayer > 300) {
        const dir = math.normalize(math.sub(game.player.pos, this.pos));
        desiredVel = math.mul(dir, this.speed);
    }

    // Smooth but snappy interpolation to remove sluggish delay
    this.vel = math.lerpVector(this.vel, desiredVel, dt * 10);
    
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
