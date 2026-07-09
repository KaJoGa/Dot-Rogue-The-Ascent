import { EntityType, GameState, Vector2, Camera } from '../types';
import { math } from '../utils';
import { BaseEntity } from './BaseEntity';
import { playGoldPickupSfx } from '../audio';

export class Pickup extends BaseEntity {
  type = EntityType.PICKUP;
  pType: number; // 0 = xp, 1 = currency, 2 = hp, 3 = ammo
  value: number;
  lifeTimer = 10;
  absorbedCount = 1;

  constructor(pos: Vector2, pType: number, value: number = 1) {
    super(pos);
    this.pType = pType;
    this.value = value;
    this.radius = pType === 2 || pType === 4 ? 8 : pType === 3 ? 5 : 4;
    this.color = pType === 0 ? '#3b82f6' : pType === 1 ? '#eab308' : pType === 3 ? '#d97706' : pType === 4 ? '#22c55e' : '#ef4444';
  }

  update(dt: number, game: GameState) {
     const dist = math.dist(this.pos, game.player.pos);
     
     if (dist < 100) {
         const dir = math.normalize(math.sub(game.player.pos, this.pos));
         this.pos = math.add(this.pos, math.mul(dir, dt * 250));
     }

     if (dist < this.radius + game.player.radius) {
         this.isDead = true;
         // Handle pickup effect via game callbacks conceptually
         // We will just do it directly for now:
         const settings = (window as any).gameSettings ?? { showDropNotif: true, showExpNotif: true };

         if (this.pType === 0) {
             (game as any).onGainXp(this.value * 10, false);
             if (settings.showExpNotif) game.addFloatingText('', this.pos, '#60a5fa', 'XP', this.value * 10);
         }
         if (this.pType === 1) {
             playGoldPickupSfx();
             (game as any).onGainCurrency(this.value);
             if (settings.showDropNotif) game.addFloatingText('', this.pos, '#eab308', 'Gold', this.value);
         }
         if (this.pType === 2) {
             const healAmt = Math.floor(game.player.maxHp * 0.50);
             game.player.heal(healAmt);
             if (settings.showDropNotif) game.addFloatingText('', this.pos, '#4ade80', 'HP', healAmt);
         }
         if (this.pType === 3) {
             const isHandCannon = game.player?.weapons?.ranged?.id === 'hand_cannon';
             game.onGainAmmo(this.value);
             if (settings.showDropNotif) {
                if (isHandCannon) {
                   game.addFloatingText(`-${this.value}s Charge`, this.pos, '#38bdf8');
                } else {
                   game.addFloatingText('', this.pos, '#fb923c', 'Ammo', this.value);
                }
             }
         }
         if (this.pType === 4) {
             const healAmt = Math.floor(game.player.maxHp * 0.50);
             game.player.heal(healAmt);
             if (settings.showDropNotif) game.addFloatingText('', this.pos, '#22c55e', 'HP', healAmt);
         }
     }
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera) {
      if (this.pType === 4 || this.pType === 2) { 
         // Draw a simple medical cross
         ctx.save();
         ctx.translate(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y);
         ctx.fillStyle = this.color;
         // horizontal bar
         ctx.fillRect(-this.radius, -this.radius/3, this.radius*2, this.radius*0.66);
         // vertical bar
         ctx.fillRect(-this.radius/3, -this.radius, this.radius*0.66, this.radius*2);
         ctx.restore();
      } else if (this.pType === 3) { // Draw ammo differently (small arrow tip)
         ctx.save();
         ctx.translate(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y);
         ctx.rotate(this.lifeTimer * 5); // spin slowly
         ctx.fillStyle = this.color;
         ctx.beginPath();
         ctx.moveTo(0, -6);
         ctx.lineTo(4, 4);
         ctx.lineTo(-4, 4);
         ctx.closePath();
         ctx.fill();
         ctx.restore();
      } else {
         super.draw(ctx, camera);
      }
  }
}
