import { GameState, Vector2, EntityType } from '../../types';
import { math } from '../../utils';
import { BaseEntity } from '../BaseEntity';
import { theme } from '../../theme';

export class SandboxDummy extends BaseEntity {
  override type = EntityType.SANDBOX_DUMMY;
  damageTaken = 0;

  hitFlashTimer: number = 0;

  constructor(pos: Vector2) {
    super(pos);
    this.radius = 25;
    this.hp = 999999999;
    this.maxHp = 999999999;
  }

  override update(dt: number, game: GameState) {
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    // Dummy does not move
    this.vel = {x: 0, y: 0};
    super.update(dt, game);
  }

  override takeDamage(amt: number, game: GameState) {
    super.takeDamage(amt, game);
    this.damageTaken += amt;
    this.hitFlashTimer = 0.1;

    // reset HP if low just in case
    if (this.hp < 100000000) {
       this.hp = 999999999;
    }
  }

  override draw(ctx: CanvasRenderingContext2D, camera: { pos: Vector2 }) {
    ctx.save();
    ctx.translate(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y);
    
    // Draw crosshair/target marking
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = theme.bg.surface;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = theme.accent.danger;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = theme.accent.danger;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = theme.text.primary;
    ctx.fill();
    
    // Render total damage taken above it
    if (this.damageTaken > 0) {
       ctx.fillStyle = theme.accent.danger;
       ctx.font = 'bold 16px monospace';
       ctx.textAlign = 'center';
       ctx.fillText("Total DMG: " + Math.round(this.damageTaken), 0, -this.radius - 10);
    }
    
    // Hit flash
    if (this.hitFlashTimer > 0) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = `rgba(255, 255, 255, ${this.hitFlashTimer * 10})`;
      ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
      ctx.globalCompositeOperation = 'source-over';
    }
    
    ctx.restore();
  }
}
