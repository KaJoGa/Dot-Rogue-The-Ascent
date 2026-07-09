import { GameState, Vector2, Camera } from '../types';
import { Player } from '../entities/player/Player';

export abstract class Weapon {
    id: string = 'weapon';
    baseDamage: number = 0;
    baseRange: number = 0;
    cooldown: number = 0;
    maxCooldown: number = 0;
    disablesRanged: boolean = false;
    moveSpeedCap?: number;
    attackSpeedCap?: number;
    attackSpeedMod: number = 0;

    /**
     * Called when the weapon is equipped by the player.
     */
    equip(player: Player): void {}

    /**
     * Called when the weapon is unequipped by the player.
     */
    unequip(player: Player): void {}

    /**
     * Called every frame. Weapons should handle input and decrement cooldowns here.
     */
    abstract update(dt: number, game: GameState, player: Player): void;

    /**
     * Optional pickup hook. Return true when the weapon consumed the ammo pickup.
     */
    onAmmoPickup(amount: number, game: GameState, player: Player): boolean { return false; }

    /**
     * Optional rendering for the weapon itself during attack.
     */
    drawAttack(ctx: CanvasRenderingContext2D, progress: number, reach: number, isReversed: boolean): void {}

    /**
     * Optional rendering for weapon-specific overlays (like enemy weakpoints).
     */
    drawOverlay(ctx: CanvasRenderingContext2D, camera: Camera, game: GameState, player: Player): void {}
}
