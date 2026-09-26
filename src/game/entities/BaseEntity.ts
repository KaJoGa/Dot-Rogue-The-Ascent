import { Entity, EntityType, GameState, Vector2, Camera } from '../types';
import { math, uid } from '../utils';
import { playHitSfx, playPlayerHitSfx } from '../audio';

export class BaseEntity implements Entity {
  id: string;
  type: EntityType = EntityType.ENVIRONMENT;
  pos: Vector2;
  vel: Vector2 = { x: 0, y: 0 };
  radius: number = 10;
  color: string = '#ffffff';
  outlineColor: string | null = null;
  outlineWidth: number = 2;
  auraColor: string | null = null;
  auraRadius: number = 0;
  hp: number = 100;
  maxHp: number = 100;
  speed: number = 100;
  damage: number = 10;
  atkSpeedMod: number = 1.0;
  attackRange: number = 70;
  isDead: boolean = false;
  invulnTimer: number = 0;
  weakpoint?: number; // 0 = Top, 1 = Bottom, 2 = Left, 3 = Right

  constructor(pos: Vector2) {
    this.id = uid();
    this.pos = pos;
  }

  update(dt: number, game: GameState) {
    this.pos = math.add(this.pos, math.mul(this.vel, dt));
  }

  applyKnockback(dir: Vector2, force: number) {
    this.vel = math.add(this.vel, math.mul(dir, force));
  }

  heal(amt: number) {
    this.hp = Math.min(this.maxHp, this.hp + amt);
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera) {
    const drawX = this.pos.x - camera.pos.x;
    const drawY = this.pos.y - camera.pos.y;

    if (this.auraColor) {
      ctx.save();
      const auraRad = this.auraRadius || this.radius * 1.5;
      const grad = ctx.createRadialGradient(drawX, drawY, this.radius, drawX, drawY, auraRad);
      grad.addColorStop(0, `${this.auraColor}aa`);
      grad.addColorStop(1, `${this.auraColor}00`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(drawX, drawY, auraRad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    if (this.outlineColor) {
      ctx.strokeStyle = this.outlineColor;
      ctx.lineWidth = this.outlineWidth;
      ctx.stroke();
    }
  }

  takeDamage(amt: number, game: GameState) {
    if (this.type === EntityType.PLAYER) {
      playPlayerHitSfx();
    } else {
      playHitSfx();
    }
    this.hp -= amt;
    game.spawnParticles(this.pos, 5, '#F87171');
    
    // DMG notification
    const settings = window.gameSettings ?? { showDmgNotif: true };
    if (settings.showDmgNotif) {
       game.addFloatingText(Math.round(amt).toString(), this.pos, '#fecaca'); // red-200
    }

    if (this.hp <= 0) {
      this.isDead = true;
      game.spawnParticles(this.pos, 20, this.color);
    }
  }
}
