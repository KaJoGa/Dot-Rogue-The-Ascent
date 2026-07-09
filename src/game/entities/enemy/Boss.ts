import { EntityType, GameState, Vector2, Camera } from '../../types';
import { math, checkCollision } from '../../utils';
import { useStore } from '../../../store';
import { playBossDropSfx, playBossSpreadSfx, startBossRapidFireLoopSfx, stopBossRapidFireLoopSfx } from '../../audio';
import { BaseEntity } from '../BaseEntity';
import { Enemy } from './Enemy';
import { Projectile } from '../Projectile';
import { Pickup } from '../Pickup';

export class Boss extends Enemy {
  type = EntityType.BOSS;
  color = '#991b1b';
  abilityTimer = 5;
  invulnTimer = 0;
  fireDelay = 0;
  targetAngles: number[] = [];
  phase2Triggered = false;
  phase2Active = false;
  phase2Angle = 0;

  isSpawning = true;
  spawnTimer = 1.3;
  hasLanded = false;

  constructor(pos: Vector2, level: number) {
    super(pos, level);
    this.radius = 32;
    const isBossRush = useStore.getState().isBossRush;
    const bossCount = isBossRush ? level : Math.max(1, Math.floor(level / 10));
    const bossIndex = bossCount - 1;
    this.hp = this.maxHp = 1000 + bossIndex * 200;
    this.damage = 30 + bossIndex * 5;
    this.speed = 150; 
  }

  update(dt: number, game: GameState) {
    if (this.isSpawning) {
      this.spawnTimer -= dt;
      
      if (this.spawnTimer <= 0.5 && !this.hasLanded) {
        this.hasLanded = true;
        
        playBossDropSfx();
        game.spawnParticles(this.pos, 50, '#94a3b8'); // Dust effect

        const impactRadius = this.radius * 3.5;
        const dist = math.dist(this.pos, game.player.pos);
        
        if (dist < impactRadius + game.player.radius) {
          game.player.takeDamage(this.damage * 0.1, game);
          let push = math.normalize(math.sub(game.player.pos, this.pos));
          if (push.x === 0 && push.y === 0) {
              push = { x: 1, y: 0 };
          }
          game.player.applyKnockback(push, 2000); // Knockback
        }
      }

      if (this.hasLanded) {
        // Player separation
        if (checkCollision(this.pos, this.radius, game.player.pos, game.player.radius)) {
          const dist = math.dist(this.pos, game.player.pos);
          const overlap = (this.radius + game.player.radius) - dist;
          if (overlap > 0) {
            let push = math.normalize(math.sub(game.player.pos, this.pos));
            if (push.x === 0 && push.y === 0) {
                push = { x: 1, y: 0 };
            }
            game.player.pos = math.add(game.player.pos, math.mul(push, overlap));
          }
        }
      }

      if (this.spawnTimer <= 0) {
        this.isSpawning = false;
      }
      return;
    }

    this.abilityTimer -= dt;

    if (!this.phase2Triggered && this.hp <= this.maxHp * 0.5) {
       this.phase2Triggered = true;
       this.phase2Active = true;
       this.invulnTimer = 4;
       this.abilityTimer = 9999;
       this.fireDelay = 0;
       this.targetAngles = [];
       // Shoot sequence initiates toward the player's current position
       const dirToPlayer = math.normalize(math.sub(game.player.pos, this.pos));
       this.phase2Angle = Math.atan2(dirToPlayer.y, dirToPlayer.x);
       
       startBossRapidFireLoopSfx();
    }

    if (this.phase2Active && this.invulnTimer > 0) {
       this.invulnTimer -= dt;
       this.fireDelay -= dt;
       if (this.fireDelay <= 0) {
           this.fireDelay = 4 / 36; // 36 shots over 4 seconds
           const angle = this.phase2Angle;
           const dir = { x: Math.cos(angle), y: Math.sin(angle) };
           const p = new Projectile(this.pos, dir, false, this.damage, 500);
           game.addEntity(p);
           
           // front and back (twin arrow) simultaneously
           const dir2 = { x: Math.cos(angle + Math.PI), y: Math.sin(angle + Math.PI) };
           const p2 = new Projectile(this.pos, dir2, false, this.damage, 500);
           game.addEntity(p2);
           
           this.phase2Angle += Math.PI * 2 / 36; // 10 degrees (360/36)
       }
       this.vel = math.lerpVector(this.vel, {x:0, y:0}, dt * 5);
       
       this.separateFromEnemies(dt, game);
       this.handlePlayerCollision(game);
       BaseEntity.prototype.update.call(this, dt, game);
       
       // Handle exiting phase 2 ability state
       if (this.invulnTimer <= 0) {
           this.abilityTimer = 0; // reset the normal ability cooldown immediately
           this.phase2Active = false;
           stopBossRapidFireLoopSfx();
       }
       return;
    }

    if (this.invulnTimer > 0) {
       this.invulnTimer -= dt;
       
       if (this.fireDelay > 0) {
          this.fireDelay -= dt;
          if (this.fireDelay <= 0) {
             // Fire 10 arrows
             playBossSpreadSfx();
             for (const angle of this.targetAngles) {
                 const dir = { x: Math.cos(angle), y: Math.sin(angle) };
                 const p = new Projectile(this.pos, dir, false, this.damage, 1000);
                 game.addEntity(p);
             }
          }
       }
       
       // Stop moving when invulnerable
       this.vel = math.lerpVector(this.vel, {x:0, y:0}, dt * 5);
    } else {
       if (this.abilityTimer <= 0) {
           this.abilityTimer = 5;
           this.invulnTimer = 0.5; // Aiming state for 0.5 second
           this.fireDelay = 0.5; // fires arrows AFTER 0.5 second aiming state
           this.targetAngles = [];
           const count = this.phase2Triggered ? 20 : 10;
           // Generates targeting lines symmetrically
           for (let i = 0; i < count; i++) {
               this.targetAngles.push(Math.PI * 2 * (i / count));
           }
       }
    }
       
     // Normal follow
     if (this.invulnTimer <= 0) {
         const dir = math.normalize(math.sub(game.player.pos, this.pos));
         this.vel = math.mul(dir, this.speed);
     }
     
      this.separateFromEnemies(dt, game);
      this.handlePlayerCollision(game);
      BaseEntity.prototype.update.call(this, dt, game);
  }
  
  takeDamage(amt: number, game: GameState) {
     if (this.isSpawning) return;
     if (this.invulnTimer > 0) return;
     BaseEntity.prototype.takeDamage.call(this, amt, game);
     if (this.isDead) {
         stopBossRapidFireLoopSfx();
         const activeState = useStore.getState();
         const isBossRush = activeState.isBossRush;
         const level = activeState.runStats.level;
         const bossCount = isBossRush ? level : Math.max(1, Math.floor(level / 10));
         const bossIndex = bossCount - 1;
         const mult = bossIndex + 1; // 100% more per prior boss clear!
         activeState.updateRunStats({ bossKills: activeState.runStats.bossKills + 1 });
         
         for(let i=0; i<10 * mult; i++) game.addEntity(new Pickup(math.add(this.pos, {x: math.randomRange(-40,40), y:math.randomRange(-40,40)}), 0, 1));
         for(let i=0; i<10 * mult; i++) game.addEntity(new Pickup(math.add(this.pos, {x: math.randomRange(-40,40), y:math.randomRange(-40,40)}), 3, 1));
         for(let i=0; i<20 * mult; i++) game.addEntity(new Pickup(math.add(this.pos, {x: math.randomRange(-40,40), y:math.randomRange(-40,40)}), 1, 1));
     }
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera) {
      if (this.isSpawning) {
          ctx.save();
          ctx.translate(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y);
          
          const impactRadius = this.radius * 3.5;
          const blink = Math.floor(this.spawnTimer * 10) % 2 === 0;

          if (!this.hasLanded && blink) {
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.arc(0, 0, impactRadius, 0, Math.PI * 2);
              ctx.stroke();
              
              ctx.fillStyle = '#ef4444';
              ctx.font = 'bold 16px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText("Warning, Boss Spawning", 0, -impactRadius - 10);
          }
          
          if (!this.hasLanded) {
              // Draw falling boss effect
              const pct = Math.max(0, (this.spawnTimer - 0.5) / 0.8); // 1.0 to 0.0
              const fallCurve = Math.pow(pct, 3); // Accelerates drop, cubic looks more like gravity
              
              // Fall from above
              const yOffset = -1200 * fallCurve;
              ctx.translate(0, yOffset);
              
              // Start slightly bigger when high up
              const scale = 1 + pct * 1.5; 
              ctx.scale(scale, scale);
              
              ctx.globalAlpha = Math.min(1, 1.5 - pct); // Fades in quickly at start
          } else {
              // It has landed, just draw it normally on the ground
              ctx.translate(0, 0);
              ctx.scale(1, 1);
              ctx.globalAlpha = 1;
          }
          
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.closePath();
          
          if (this.hasLanded) {
              // draw invulnerability shield
              ctx.beginPath();
              ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
              ctx.strokeStyle = '#fde047'; // yellow-300
              ctx.lineWidth = 3;
              // blink shield
              if (Math.floor(this.spawnTimer * 10) % 2 === 0) {
                  ctx.stroke();
              }
          }
          
          ctx.restore();
          return;
      }

      super.draw(ctx, camera);
      
      if (this.invulnTimer > 0) {
         ctx.save();
         ctx.translate(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y);
         // draw invulnerability shield
         ctx.beginPath();
         ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
         ctx.strokeStyle = '#fde047'; // yellow-300
         ctx.lineWidth = 3;
         // blink shield
         if (Math.floor(this.invulnTimer * 10) % 2 === 0) {
             ctx.stroke();
         }
         
         if (this.fireDelay > 0) { // draw target lines
             ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)'; // red-500 semi transparent
             ctx.lineWidth = 2;
             for (const angle of this.targetAngles) {
                 ctx.beginPath();
                 ctx.moveTo(0, 0);
                 ctx.lineTo(Math.cos(angle) * 1000, Math.sin(angle) * 1000); // long line
                 ctx.stroke();
             }
         }
         ctx.restore();
      }
  }
}
