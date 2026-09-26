import { EntityType, GameState, Vector2, Camera } from '../types';
import { BaseEntity } from './BaseEntity';
import { theme } from '../theme';

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
          ctx.fillStyle = theme.bg.surfaceDark; 
          ctx.fillRect(-12, -4, 12, 8); 
          
          // Knucklebow (D-guard) - Copper accent per DESIGN.md §8
          ctx.strokeStyle = theme.accent.primary; 
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-12, 4);
          ctx.quadraticCurveTo(-6, 16, 2, 6);
          ctx.stroke();

          // Crossguard - Copper accent per DESIGN.md §8
          ctx.fillStyle = theme.accent.primary;
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
          ctx.strokeStyle = theme.bg.border;
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
          
          ctx.shadowColor = theme.accent.secondary; // Teal energy glow per DESIGN.md §8
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
          
          ctx.fillStyle = '#84E7DC'; // Bright teal core
          ctx.fill();
          
          // Outline
          ctx.strokeStyle = '#3AB8AB';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          
          // Handle
          ctx.shadowBlur = 0;
          ctx.fillStyle = theme.bg.surfaceDark;
          ctx.fillRect(-15, -4, 10, 8);
          
          ctx.restore();
      } else if (this.weaponType === 'heavy_hammer') {
          ctx.save();
          ctx.translate(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y);
          ctx.rotate(-Math.PI / 4);
          ctx.scale(3.8, 3.8);
          
          // Handle
          ctx.fillStyle = theme.bg.surfaceDark;
          ctx.fillRect(-8, -4, 48, 8);
          ctx.strokeStyle = '#2B303C';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-8, -4, 48, 8);

          // Heavy metal head with Copper glow per DESIGN.md §8
          ctx.shadowColor = theme.accent.primary;
          ctx.shadowBlur = 8;
          ctx.fillStyle = theme.bg.surface;
          ctx.fillRect(34, -14, 30, 28);
          ctx.strokeStyle = theme.bg.border;
          ctx.lineWidth = 2;
          ctx.strokeRect(34, -14, 30, 28);

          // Head bands/highlights
          ctx.shadowBlur = 0;
          ctx.fillStyle = theme.accent.primary;
          ctx.fillRect(40, -12, 4, 24);
          ctx.fillRect(54, -12, 4, 24);
          
          ctx.restore();
      }
  }
}

