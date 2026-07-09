import { EntityType, GameState, Vector2, Camera } from '../types';
import { BaseEntity } from './BaseEntity';
import { Weapon } from '../weapons/Weapon';

export class MeleeSlash extends BaseEntity {
  type = EntityType.ENVIRONMENT;
  lifetime: number = 0.2; // slightly longer for smoother animation
  maxLifetime: number = 0.2;
  angle: number = 0;
  reach: number;
  isReversed: boolean;
  weapon: Weapon;
    
  owner: BaseEntity;
  animType: 'swing' | 'stab';
    
  constructor(owner: BaseEntity, angle: number, reach: number, weapon: Weapon, isReversed: boolean = false, speedMod: number = 1, animType: 'swing' | 'stab' = 'swing') {
      super(owner.pos);
      this.owner = owner;
      this.angle = angle;
      this.reach = reach;
      this.weapon = weapon;
      this.isReversed = isReversed;
      this.animType = animType;
      
      this.lifetime = animType === 'stab' ? 0.15 * speedMod : 0.2;
      this.maxLifetime = this.lifetime;
  }
    
  update(dt: number, game: GameState) {
      this.lifetime -= dt;
      if (this.lifetime <= 0) this.isDead = true;
      this.pos = this.owner.pos;
  }
    
  draw(ctx: CanvasRenderingContext2D, camera: Camera) {
      ctx.save();
      ctx.translate(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y);
      ctx.rotate(this.angle);
        
      let p = 1 - (this.lifetime / this.maxLifetime);
      
      if (this.animType === 'swing') {
          const progress = 1 - Math.pow(1 - p, 3); // Cubic Ease out for smoother swing
          const swingDir = this.isReversed ? -1 : 1;
          const arcWidth = 300 * Math.PI / 180; // 300 degrees
          
          // Rotate for the swing
          ctx.rotate((progress - 0.5) * arcWidth * swingDir);
            
          // Draw swoosh arc behind weapon from player center
          ctx.beginPath();
          if (swingDir === 1) {
              ctx.arc(0, 0, this.reach - 10, -arcWidth * progress, 0); 
          } else {
              ctx.arc(0, 0, this.reach - 10, 0, arcWidth * progress); 
          }
          ctx.strokeStyle = `rgba(255, 255, 255, ${(1-progress)*0.8})`;
          ctx.lineWidth = 12;
          ctx.stroke();

          // Delegate the weapon drawing to the weapon itself
          if (this.weapon.drawAttack) {
              this.weapon.drawAttack(ctx, progress, this.reach, this.isReversed);
          }
      } else if (this.animType === 'stab') {
          // Stabbing animation: thrust forward and pull back
          // p goes 0 -> 1. Forward during first half, back during second half
          let progress = 0;
          if (p < 0.5) {
              progress = p * 2; // Ease out
              progress = 1 - Math.pow(1 - progress, 2);
          } else {
              progress = (1 - p) * 2; // Ease in
              progress = 1 - Math.pow(1 - progress, 2);
          }
          
          // Optional: draw thrust lines instead of swoosh arc
          ctx.beginPath();
          ctx.moveTo(10, -15);
          ctx.lineTo(this.reach * progress * 0.9, 0);
          ctx.moveTo(10, 15);
          ctx.lineTo(this.reach * progress * 0.9, 0);
          const alphaText = Math.max(0, (1 - p));
          ctx.strokeStyle = `rgba(2, 132, 199, ${alphaText * 0.5})`;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Delegate to weapon (we use absolute progress (0 to 1) for the weapon's own draw method to know the visual extension)
          if (this.weapon.drawAttack) {
              this.weapon.drawAttack(ctx, progress, this.reach, this.isReversed);
          }
      }

      ctx.restore();
  }
}
