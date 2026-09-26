import { EntityType, GameState, Vector2 } from '../../types';
import { math } from '../../utils';
import { BaseEntity } from '../BaseEntity';
import { Enemy } from './Enemy';
import { Pickup } from '../Pickup';
import { theme } from '../../theme';

export class SpecialEnemy extends Enemy {
  type = EntityType.SPECIAL_ENEMY;
  color = theme.enemies.special;
  outlineColor = '#8EEBBA';
  outlineWidth = 3;

  constructor(pos: Vector2, level: number) {
    super(pos, level);
    this.maxHp = 50; 
    this.hp = this.maxHp;
    this.damage = 1 + level * 1.5;
    this.speed = 150;
    this.baseSpeed = this.speed;
    this.radius = 12;
  }
  
  takeDamage(amt: number, game: GameState) {
    BaseEntity.prototype.takeDamage.call(this, amt, game);
    if (this.isDead) {
      game.addEntity(new Pickup(this.pos, 0, 1)); // 1 XP gem
      game.addEntity(new Pickup(math.add(this.pos, {x: 5, y: 5}), 4)); // 1 Health pack
    }
  }
}
