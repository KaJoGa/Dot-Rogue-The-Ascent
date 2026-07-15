import { GameState, Vector2, Camera, EntityType } from '../types';
import { Player } from '../entities/player/Player';
import { Weapon } from './Weapon';
import { math } from '../utils';
import { BaseEntity } from '../entities/BaseEntity';
import { Projectile } from '../entities/Projectile';
import { playHammerSmashSfx } from '../audio';

class HammerDebris extends Projectile {
    spin = Math.random() * Math.PI * 2;

    constructor(pos: Vector2, dir: Vector2, damage: number) {
        super(pos, dir, true, damage, 420);
        this.radius = 6;
        this.color = '#a16207';
        this.lifetime = 0.9;
    }

    update(dt: number, game: GameState) {
        this.spin += dt * 12;
        super.update(dt, game);
    }

    draw(ctx: CanvasRenderingContext2D, camera: Camera) {
        ctx.save();
        ctx.translate(this.pos.x - camera.pos.x, this.pos.y - camera.pos.y);
        ctx.rotate(this.spin);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(7, -3);
        ctx.lineTo(2, 7);
        ctx.lineTo(-7, 4);
        ctx.lineTo(-5, -6);
        ctx.lineTo(3, -8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

class HammerSmash extends BaseEntity {
    type = EntityType.ENVIRONMENT;
    age = 0;
    lifetime: number;
    hitIds = new Set<string>();
    stages: Array<{ time: number; factor: number; triggered: boolean }>;

    constructor(
        pos: Vector2,
        private angle: number,
        private gripDistance: number,
        private baseRadius: number,
        private smashDamage: number,
        private passiveActive: boolean
    ) {
        super(pos);
        this.radius = baseRadius;
        this.lifetime = passiveActive ? 0.86 : 0.36;
        this.stages = passiveActive
            ? [
                { time: 0, factor: 1, triggered: false },
                { time: 0.24, factor: 2, triggered: false },
                { time: 0.48, factor: 4, triggered: false },
              ]
            : [{ time: 0, factor: 1, triggered: false }];
    }

    update(dt: number, game: GameState) {
        this.age += dt;
        for (const stage of this.stages) {
            if (!stage.triggered && this.age >= stage.time) {
                stage.triggered = true;
                this.hitEnemies(game, this.baseRadius * stage.factor);
            }
        }

        if (this.age >= this.lifetime) {
            this.isDead = true;
        }
    }

    private hitEnemies(game: GameState, radius: number) {
        for (const ent of game.entities) {
            if (this.hitIds.has(ent.id)) continue;
            if (
                ent.type === EntityType.ENEMY ||
                ent.type === EntityType.BOSS ||
                ent.type === EntityType.SPECIAL_ENEMY ||
                ent.type === EntityType.ELITE_ENEMY ||
                ent.type === EntityType.SANDBOX_DUMMY
            ) {
                if ((ent as any).invulnTimer > 0) continue;
                if (math.dist(this.pos, ent.pos) <= radius + ent.radius) {
                    this.hitIds.add(ent.id);
                    ent.takeDamage(this.smashDamage, game);
                    const pushDir = math.normalize(math.sub(ent.pos, this.pos));
                    ent.applyKnockback(pushDir, 260);
                }
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D, camera: Camera) {
        const x = this.pos.x - camera.pos.x;
        const y = this.pos.y - camera.pos.y;

        ctx.save();
        ctx.translate(x, y);

        const impactAlpha = Math.max(0, 1 - this.age / this.lifetime);
        ctx.fillStyle = `rgba(120, 53, 15, ${0.22 * impactAlpha})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.baseRadius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        for (const stage of this.stages) {
            if (this.age < stage.time) continue;
            const localAge = Math.min(1, (this.age - stage.time) / 0.25);
            const radius = this.baseRadius * stage.factor * (0.85 + localAge * 0.15);
            const alpha = Math.max(0, 1 - localAge);
            ctx.strokeStyle = `rgba(245, 158, 11, ${0.75 * alpha})`;
            ctx.lineWidth = 4 - localAge * 2;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = `rgba(120, 53, 15, ${0.7 * alpha})`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 10; i++) {
                const angle = (Math.PI * 2 * i) / 10 + stage.factor;
                const inner = radius * 0.25;
                const outer = radius * (0.7 + (i % 3) * 0.08);
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
                ctx.lineTo(Math.cos(angle + 0.08) * outer, Math.sin(angle + 0.08) * outer);
                ctx.stroke();
            }
        }

        const swingP = Math.min(1, this.age / 0.22);
        const easedSwing = 1 - Math.pow(1 - swingP, 3);
        const windupHeight = 56;
        const aimX = Math.cos(this.angle);
        const aimY = Math.sin(this.angle);
        const headStartBack = this.gripDistance * 0.65;
        const headX = -aimX * headStartBack * (1 - easedSwing);
        const headY = -aimY * headStartBack * (1 - easedSwing) - (1 - easedSwing) * windupHeight;
        const gripX = -aimX * this.gripDistance;
        const gripY = -aimY * this.gripDistance;

        ctx.save();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(gripX, gripY);
        ctx.lineTo(headX, headY);
        ctx.stroke();

        ctx.translate(headX, headY);
        ctx.rotate(this.angle);
        ctx.shadowColor = '#FBBF24';
        ctx.shadowBlur = this.passiveActive ? 14 : 0;

        const headGradient = ctx.createLinearGradient(-22, -22, 22, 22);
        headGradient.addColorStop(0, '#334155');
        headGradient.addColorStop(0.45, '#64748b');
        headGradient.addColorStop(1, '#1e293b');
        ctx.fillStyle = headGradient;
        ctx.fillRect(-22, -22, 44, 44);

        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(-22, -22, 44, 44);

        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-17, -16, 34, 4);
        ctx.fillRect(-17, 12, 34, 4);

        ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(16, 0);
        ctx.moveTo(0, -16);
        ctx.lineTo(0, 16);
        ctx.stroke();

        ctx.fillStyle = 'rgba(226, 232, 240, 0.45)';
        ctx.fillRect(-17, -17, 7, 34);
        ctx.restore();

        if (this.age < 0.22) {
            ctx.strokeStyle = `rgba(203, 213, 225, ${0.45 * (1 - swingP)})`;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(-aimX * headStartBack, -aimY * headStartBack - windupHeight);
            ctx.lineTo(headX, headY);
            ctx.stroke();
        }

        ctx.fillStyle = `rgba(251, 191, 36, ${0.25 * impactAlpha})`;
        ctx.beginPath();
        ctx.arc(headX, headY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class HeavyHammer extends Weapon {
    id = 'heavy_hammer';
    baseDamage = 20;
    baseRange = 10;
    attackSpeedMod = 0.4;
    attackSpeedCap = 0.9;
    moveSpeedCap = 250;
    disablesRanged = true;

    update(dt: number, game: GameState, player: Player) {
        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }

        if (this.cooldown <= 0) {
            const rawCooldown = 0.7 + this.attackSpeedMod + player.stats.runUpgrades.atkSpeed;
            const finalCooldown = Math.max(this.attackSpeedCap, rawCooldown);
            const excessSpeed = Math.max(0, this.attackSpeedCap - rawCooldown);
            const moveSpeedRaw = 150 + player.stats.upgrades.speed * 15 + player.stats.runUpgrades.speed;
            const moveSpeedOverflowDamage = Math.max(0, moveSpeedRaw - (this.moveSpeedCap ?? 250));
            const bonusDamage = excessSpeed * 100 + moveSpeedOverflowDamage;
            const totalDamage = player.damage + bonusDamage;
            const passiveActive = totalDamage >= 200;
            const baseRadius = 25 + player.attackRange / 2 + (passiveActive ? 20 : 0);
            const attackDir = math.normalize(math.sub(game.mousePos, player.pos));
            const angle = Math.atan2(attackDir.y, attackDir.x);
            const impactOffset = baseRadius * 0.8;
            const impactPos = {
                x: player.pos.x + attackDir.x * impactOffset,
                y: player.pos.y + attackDir.y * impactOffset
            };
            const gripDistance = Math.max(8, impactOffset - player.radius);

            playHammerSmashSfx(passiveActive);
            game.addEntity(new HammerSmash(impactPos, angle, gripDistance, baseRadius, totalDamage, passiveActive));

            if (passiveActive) {
                for (let i = 0; i < 5; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dir = { x: Math.cos(angle), y: Math.sin(angle) };
                    game.addEntity(new HammerDebris(impactPos, dir, totalDamage * 0.3));
                }
            }

            this.maxCooldown = finalCooldown;
            this.cooldown = this.maxCooldown;
        }
    }
}
