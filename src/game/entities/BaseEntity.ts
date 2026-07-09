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
  hp: number = 100;
  maxHp: number = 100;
  speed: number = 100;
  damage: number = 10;
  atkSpeedMod: number = 1.0;
  attackRange: number = 70;
  isDead: boolean = false;
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
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  takeDamage(amt: number, game: GameState) {
    if (this.type === EntityType.PLAYER) {
      playPlayerHitSfx();
    } else {
      playHitSfx();
    }
    this.hp -= amt;
    game.spawnParticles(this.pos, 5, '#ff0000');
    
    // DMG notification
    const settings = (window as any).gameSettings ?? { showDmgNotif: true };
    if (settings.showDmgNotif) {
       game.addFloatingText(Math.round(amt).toString(), this.pos, '#fecaca'); // red-200
    }

    if (this.hp <= 0) {
      this.isDead = true;
      game.spawnParticles(this.pos, 20, this.color);
    }
  }
}
