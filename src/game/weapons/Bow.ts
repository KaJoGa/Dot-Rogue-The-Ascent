import { GameState } from '../types';
import { Player } from '../entities/player/Player';
import { Weapon, WeaponMetadata } from './Weapon';
import { math } from '../utils';
import { playBowSfx } from '../audio';
import { Projectile } from '../entities/Projectile';

export class Bow extends Weapon {
    static readonly metadata: WeaponMetadata = {
        name: 'A BOW',
        type: 'Ranged',
        damage: '12',
        damageVal: 12,
        range: 'Long (350px)',
        rangeVal: 350,
        speed: 'Medium (0.45s)',
        speedVal: 0.45,
        special: 'Rapid fire on hold. Consumes 1 Ammo per shot.',
        color: '#cbd5e1',
    };

    id = 'bow';
    update(dt: number, game: GameState, player: Player) {
        (window as any).currentRangedWeaponState = null;
        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }

        if (game.mouseRightDown && this.cooldown <= 0) {
            this.attack(game, player);
            const rawCooldown = player.atkSpeedMod; // Bow adds 0s to base attack speed
            this.maxCooldown = Math.max(player.minAtkSpeedMod, rawCooldown);
            this.cooldown = this.maxCooldown;
        }
    }

    attack(game: GameState, player: Player) {
        if (!game.onUseAmmo()) {
            game.addFloatingText('OUT OF AMMO!', {x: player.pos.x, y: player.pos.y - 30}, '#F87171');
            return;
        }
        playBowSfx();
        const worldMouse = game.mousePos;
        const attackDir = math.normalize(math.sub(worldMouse, player.pos));
        const proj = new Projectile(player.pos, attackDir, true, player.damage * 0.70, 520);
        game.addEntity(proj);
    }
}
