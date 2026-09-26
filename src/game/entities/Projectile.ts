import { EntityType, GameState, Vector2, Camera } from '../types';
import { math, checkCollision } from '../utils';
import { BaseEntity } from './BaseEntity';
import { theme } from '../theme';

export class Projectile extends BaseEntity {
  type = EntityType.PROJECTILE;
  isFriendly: boolean;
  lifetime = 20; // almost infinite (20 seconds)

  constructor(pos: Vector2, dir: Vector2, isFriendly: boolean, damage: number, speed: number) {
    super(pos);
    this.isFriendly = isFriendly;
    this.vel = math.mul(dir, speed);
    this.damage = damage;
    this.radius = 4;
    this.color = isFriendly ? theme.accent.secondary : theme.accent.danger;
  }

  update(dt: number, game: GameState) {
    this.lifetime -= dt;
    if (this.lifetime <= 0) this.isDead = true;
    if (this.pos.x < 0 || this.pos.x > game.width || this.pos.y < 0 || this.pos.y > game.height) {
        this.isDead = true;
    }
    super.update(dt, game);

    // Collision check
    const steps = Math.ceil(math.dist({x:0, y:0}, math.mul(this.vel, dt)) / this.radius);
    for (let step = 1; step <= steps; step++) {
       const checkPos = math.lerpVector(math.sub(this.pos, math.mul(this.vel, dt)), this.pos, step/steps);
       let collided = false;

       // Check player collision for enemy projectiles
       if (!this.isFriendly) {
         if (checkCollision(checkPos, this.radius * 0.8, game.player.pos, game.player.radius)) {
            game.player.takeDamage(this.damage, game);
            this.isDead = true;
            collided = true;
         }
       }

       if (!collided) {
         for (const ent of game.entities) {
           if (ent.id === this.id || ent.type === EntityType.PICKUP) continue;
           if (this.isFriendly && (ent.type === EntityType.ENEMY || ent.type === EntityType.BOSS || ent.type === EntityType.SPECIAL_ENEMY || ent.type === EntityType.ELITE_ENEMY || ent.type === EntityType.SANDBOX_DUMMY)) {
             if (checkCollision(checkPos, this.radius + 8, ent.pos, ent.radius)) {
               if ((ent.invulnTimer ?? 0) > 0) {
                 this.isDead = true;
                 collided = true;
                 break;
               }
               ent.takeDamage(this.damage, game);
               this.isDead = true;
               collided = true;
               break;
             }
           }
         }
       }
       if (collided) break;
    }
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera) {
    ctx.save();
    ctx.translate(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y);
    const angle = Math.atan2(this.vel.y, this.vel.x);
    ctx.rotate(angle);
    
    ctx.fillStyle = this.color;
    ctx.beginPath();
    // Arrow shape
    ctx.moveTo(12, 0); // Tip
    ctx.lineTo(-6, 6); // Bottom right
    ctx.lineTo(-2, 0); // Inner middle
    ctx.lineTo(-6, -6); // Top right
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
}
