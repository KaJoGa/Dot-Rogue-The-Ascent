import { EntityType, GameState, Vector2, Camera } from '../types';
import { BaseEntity } from './BaseEntity';

export class WeaponProp extends BaseEntity {
  override type = EntityType.ENVIRONMENT;
  weaponType: 'sabre' | 'bow' | 'plasma_dagger' | 'heavy_hammer';
  
  constructor(pos: Vector2, weaponType: 'sabre' | 'bow' | 'plasma_dagger' | 'heavy_hammer') {
    super(pos);
    this.weaponType = weaponType;
    this.radius = 20;
  }
  
  update(dt: number, game: GameState) {
    // Just a static prop
  }
  
  draw(ctx: CanvasRenderingContext2D, camera: Camera) {
      if (this.weaponType === 'sabre') {
          ctx.save();
          ctx.translate(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y);
          ctx.rotate(-Math.PI / 4); // point up right
          
          // Make it big to look like a background prop
          ctx.scale(4, 4); 
          ctx.globalAlpha = 1.0;

          // Shadow/Glow
          ctx.shadowBlur = 0;
          
          // Handle
          ctx.fillStyle = '#1e293b'; 
          ctx.fillRect(-12, -4, 12, 8); 
          
          // Knucklebow (D-guard)
          ctx.strokeStyle = '#fbbf24'; 
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-12, 4);
          ctx.quadraticCurveTo(-6, 16, 2, 6);
          ctx.stroke();

          // Crossguard
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-2, -6, 4, 14);

          // Curved Sabre Blade
          ctx.fillStyle = '#cbd5e1'; 
          ctx.beginPath();
          ctx.moveTo(2, -4);
          ctx.lineTo(2, 4);
          ctx.quadraticCurveTo(35, 15, 65, -8); // Cutting edge (convex)
          ctx.quadraticCurveTo(35, 4, 2, -4);   // Back edge (concave)
          ctx.fill();

          // Fuller (groove)
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(6, -1);
          ctx.quadraticCurveTo(35, 2, 55, -4);
          ctx.stroke();
            
          ctx.restore();
      } else if (this.weaponType === 'plasma_dagger') {
          ctx.save();
          ctx.translate(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y);
          ctx.rotate(-Math.PI / 4); // point up right
          
          ctx.scale(4, 4); 
          ctx.globalAlpha = 1.0;
          
          ctx.shadowColor = '#0ea5e9'; // Cyan/Sky blue glow
          ctx.shadowBlur = 15;
          
          // Draw the sleek plasma dagger shape
          ctx.beginPath();
          ctx.moveTo(20, 0);
          ctx.lineTo(0, 5);
          ctx.lineTo(-10, 5);
          ctx.lineTo(-5, 0);
          ctx.lineTo(-10, -5);
          ctx.lineTo(0, -5);
          ctx.closePath();
          
          ctx.fillStyle = '#bae6fd'; // Bright core
          ctx.fill();
          
          // Outline
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          
          // Handle
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-15, -4, 10, 8);
          
          ctx.restore();
      } else if (this.weaponType === 'heavy_hammer') {
          ctx.save();
          ctx.translate(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y);
          ctx.rotate(-Math.PI / 4);
          ctx.scale(3.8, 3.8);
          
          // Long wooden handle
          ctx.fillStyle = '#3f2a16';
          ctx.fillRect(-8, -4, 48, 8);
          ctx.strokeStyle = '#1f1309';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-8, -4, 48, 8);

          // Heavy metal head at the front
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#475569';
          ctx.fillRect(34, -14, 30, 28);
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.strokeRect(34, -14, 30, 28);

          // Head bands/highlights
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(40, -12, 4, 24);
          ctx.fillRect(54, -12, 4, 24);
          
          ctx.restore();
      }
  }
}
