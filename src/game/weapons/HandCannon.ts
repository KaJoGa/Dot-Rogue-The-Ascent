import { GameState, Vector2, Camera, EntityType } from '../types';
import { Player } from '../entities/player/Player';
import { Weapon } from './Weapon';
import { math, checkCollision } from '../utils';
import { BaseEntity } from '../entities/BaseEntity';
import { playHandCannonSfx, playHandCannonChargeSfx } from '../audio';

const CHARGE_CONFIG = [
    { damage: 50, radius: 25, color: '#38bdf8' },
    { damage: 100, radius: 50, color: '#22c55e' },
    { damage: 150, radius: 100, color: '#a78bfa' },
    { damage: 300, radius: 200, color: '#f59e0b' },
    { damage: 500, radius: 400, color: '#ef4444' },
];

class HandCannonBlast extends BaseEntity {
    type = EntityType.ENVIRONMENT;
    age = 0;
    lifetime = 0.28;

    constructor(pos: Vector2, private blastRadius: number, private blastColor: string) {
        super(pos);
        this.radius = blastRadius;
        this.color = blastColor;
    }

    update(dt: number) {
        this.age += dt;
        if (this.age >= this.lifetime) this.isDead = true;
    }

    draw(ctx: CanvasRenderingContext2D, camera: Camera) {
        const p = Math.min(1, this.age / this.lifetime);
        const radius = this.blastRadius * (0.35 + p * 0.65);
        const alpha = 1 - p;

        ctx.save();
        ctx.translate(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y);
        ctx.strokeStyle = this.blastColor;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = this.blastColor;
        ctx.globalAlpha = alpha * 0.18;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class HandCannonShell extends BaseEntity {
    type = EntityType.PROJECTILE;
    lifetime = 1.2;
    exploded = false;

    constructor(
        pos: Vector2,
        private target: Vector2,
        dir: Vector2,
        private blastDamage: number,
        private blastRadius: number,
        private blastColor: string,
    ) {
        super(pos);
        this.vel = math.mul(dir, 700);
        this.radius = 7;
        this.color = blastColor;
    }

    update(dt: number, game: GameState) {
        this.lifetime -= dt;
        const prevPos = { x: this.pos.x, y: this.pos.y };
        super.update(dt, game);

        if (this.lifetime <= 0 || this.pos.x < 0 || this.pos.x > game.width || this.pos.y < 0 || this.pos.y > game.height) {
            this.explode(game);
            return;
        }

        if (math.dist(prevPos, this.target) <= math.dist(prevPos, this.pos) || math.dist(this.pos, this.target) < this.radius + 4) {
            this.pos = { ...this.target };
            this.explode(game);
            return;
        }

        const travel = math.dist(prevPos, this.pos);
        const steps = Math.max(1, Math.ceil(travel / this.radius));
        for (let i = 1; i <= steps; i++) {
            const checkPos = math.lerpVector(prevPos, this.pos, i / steps);
            for (const ent of game.entities) {
                if (ent.id === this.id || ent.type === EntityType.PICKUP) continue;
                if (
                    ent.type === EntityType.ENEMY ||
                    ent.type === EntityType.BOSS ||
                    ent.type === EntityType.SPECIAL_ENEMY ||
                    ent.type === EntityType.ELITE_ENEMY ||
                    ent.type === EntityType.SANDBOX_DUMMY
                ) {
                    if (checkCollision(checkPos, this.radius, ent.pos, ent.radius)) {
                        this.pos = checkPos;
                        this.explode(game);
                        return;
                    }
                }
            }
        }
    }

    private explode(game: GameState) {
        if (this.exploded) return;
        this.exploded = true;
        this.isDead = true;
        game.spawnParticles(this.pos, 18, this.blastColor);
        game.addEntity(new HandCannonBlast({ ...this.pos }, this.blastRadius, this.blastColor));

        for (const ent of game.entities) {
            if (
                ent.type === EntityType.ENEMY ||
                ent.type === EntityType.BOSS ||
                ent.type === EntityType.SPECIAL_ENEMY ||
                ent.type === EntityType.ELITE_ENEMY ||
                ent.type === EntityType.SANDBOX_DUMMY
            ) {
                if ((ent as any).invulnTimer > 0) continue;
                if (math.dist(this.pos, ent.pos) <= this.blastRadius + ent.radius) {
                    ent.takeDamage(this.blastDamage, game);
                    const pushDir = math.normalize(math.sub(ent.pos, this.pos));
                    ent.applyKnockback(pushDir, 220);
                }
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D, camera: Camera) {
        ctx.save();
        ctx.translate(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y);
        const angle = Math.atan2(this.vel.y, this.vel.x);
        ctx.rotate(angle);
        ctx.shadowColor = this.blastColor;
        ctx.shadowBlur = 12;
        ctx.fillStyle = this.blastColor;
        ctx.fillRect(-8, -4, 16, 8);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(2, -2, 6, 4);
        ctx.restore();
    }
}

export class HandCannon extends Weapon {
    id = 'hand_cannon';
    maxCharges = 5;
    charges = 1;
    chargeCooldown = 7;
    chargeTimer = 7;

    update(dt: number, game: GameState, player: Player) {
        if (this.charges < this.maxCharges) {
            this.chargeTimer -= dt;
            while (this.chargeTimer <= 0 && this.charges < this.maxCharges) {
                this.charges += 1;
                playHandCannonChargeSfx();
                this.chargeTimer += this.chargeCooldown;
            }
        } else {
            this.chargeTimer = this.chargeCooldown;
        }

        this.maxCooldown = this.chargeCooldown;
        this.cooldown = this.charges >= this.maxCharges ? 0 : this.chargeTimer;

        if (game.mouseRightDown) {
            this.attack(game, player);
            game.mouseRightDown = false;
        }

        (window as any).currentRangedWeaponState = {
            id: this.id,
            charges: this.charges,
            maxCharges: this.maxCharges,
            chargeTimer: this.charges >= this.maxCharges ? 0 : this.chargeTimer,
            chargeCooldown: this.chargeCooldown,
        };
    }

    attack(game: GameState, player: Player) {
        if (this.charges <= 0) {
            game.addFloatingText('NO CHARGE!', { x: player.pos.x, y: player.pos.y - 30 }, '#ef4444');
            return;
        }

        const chargeCount = Math.min(this.maxCharges, this.charges);
        const config = CHARGE_CONFIG[chargeCount - 1];
        const dir = math.normalize(math.sub(game.mousePos, player.pos));
        if (dir.x === 0 && dir.y === 0) return;

        playHandCannonSfx(chargeCount);
        game.addEntity(new HandCannonShell({ ...player.pos }, { ...game.mousePos }, dir, config.damage, config.radius, config.color));

        this.charges = 0;
        this.chargeTimer = this.chargeCooldown;
    }

    onAmmoPickup(amount: number, game: GameState, player: Player): boolean {
        if (this.charges >= this.maxCharges) {
            return true;
        }
        this.chargeTimer = Math.max(0, this.chargeTimer - amount);
        return true;
    }
}
