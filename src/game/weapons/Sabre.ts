import { GameState, Vector2, Camera } from '../types';
import { Player } from '../entities/player/Player';
import { Weapon, WeaponMetadata } from './Weapon';
import { math } from '../utils';
import { playSabreSfx, playSabreReverseSfx } from '../audio';
import { MeleeSlash } from '../entities/MeleeSlash';
import { BaseEntity } from '../entities/BaseEntity';
import { EntityType } from '../types';

export class Sabre extends Weapon {
    static readonly metadata: WeaponMetadata = {
        name: 'A SABRE',
        type: 'Melee',
        damage: '15',
        damageVal: 15,
        range: 'Medium (70px)',
        rangeVal: 70,
        speed: 'Normal (0.85s)',
        speedVal: 0.85,
        special: 'Fires dual swing paths when attack speed is capped.',
        color: '#10b981',
    };

    id = 'sabre';
    baseDamage = 15;
    baseRange = 10;
    swingReversed = false;

    update(dt: number, game: GameState, player: Player) {
        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }

        if (this.cooldown <= 0) {
            // Sabre Weapon Atk.Speed is +0.15s
            const rawCooldown = 0.7 + 0.15 + player.stats.runUpgrades.atkSpeed;
            const minCooldown = 0.5;
            const finalCooldown = Math.max(minCooldown, rawCooldown);
            const excessSpeed = Math.max(0, minCooldown - rawCooldown);
            
            const isCapped = finalCooldown <= minCooldown;
            const reverseSwing = isCapped && this.swingReversed;
            if (isCapped) {
                this.swingReversed = !this.swingReversed;
            } else {
                this.swingReversed = false;
            }

            const bonusDamage = excessSpeed * 100;
            const bonusRange = excessSpeed * 50;

            const animSpeedMod = finalCooldown / 0.85;
            this.attack(game, player, game.mousePos, reverseSwing, animSpeedMod, bonusRange, bonusDamage);
            this.maxCooldown = finalCooldown;
            this.cooldown = this.maxCooldown;
        }
    }

    attack(game: GameState, player: Player, targetPos?: Vector2, isReversed: boolean = false, speedMod: number = 1, bonusRange: number = 0, bonusDamage: number = 0) {
        if (isReversed) {
            playSabreReverseSfx(speedMod);
        } else {
            playSabreSfx(speedMod);
        }
        
        const target = targetPos || game.mousePos;
        const attackDir = math.normalize(math.sub(target, player.pos));
        const attackRange = Math.min(player.attackRangeCap, player.attackRange + bonusRange);

        const angle = Math.atan2(attackDir.y, attackDir.x);
        game.addEntity(new MeleeSlash(player, angle, player.radius + attackRange, this, isReversed, speedMod));

        const maxAngleDiff = 150 * Math.PI / 180;

        for (const ent of game.entities) {
            if (ent.type === EntityType.ENEMY || ent.type === EntityType.BOSS || ent.type === EntityType.SPECIAL_ENEMY || ent.type === EntityType.ELITE_ENEMY || ent.type === EntityType.SANDBOX_DUMMY) {
                if (math.dist(player.pos, ent.pos) < player.radius + ent.radius + attackRange) {
                    const targetDir = math.normalize(math.sub(ent.pos, player.pos));
                    const angleToTarget = Math.atan2(targetDir.y, targetDir.x);
                    let diff = angleToTarget - angle;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;

                    if (Math.abs(diff) <= maxAngleDiff) {
                        if ((ent.invulnTimer ?? 0) > 0) continue;
                        ent.takeDamage(player.damage + bonusDamage, game);
                        const pushDir = math.normalize(math.sub(ent.pos, player.pos));
                        ent.applyKnockback(pushDir, 160);
                    }
                }
            }
        }
    }

drawAttack(ctx: CanvasRenderingContext2D, progress: number, reach: number, isReversed: boolean) {
    const reachScale = reach / 86; // 86 is the base reach (16 player radius + 70 base attack range)

    ctx.save();

    // Move the sabre away from the player center
    ctx.translate(20 * reachScale, 0);

    // Scale the sabre model based on reach and flip vertically when reversed
    ctx.scale(reachScale, isReversed ? -reachScale : reachScale);

    // -------------------------------------------------------------------------
    // Utility functions for building a blade from one shared center curve
    // -------------------------------------------------------------------------
    const cubicPoint = (
        t: number,
        p0: { x: number; y: number },
        p1: { x: number; y: number },
        p2: { x: number; y: number },
        p3: { x: number; y: number }
    ) => {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const t2 = t * t;

        return {
            x:
                mt2 * mt * p0.x +
                3 * mt2 * t * p1.x +
                3 * mt * t2 * p2.x +
                t2 * t * p3.x,
            y:
                mt2 * mt * p0.y +
                3 * mt2 * t * p1.y +
                3 * mt * t2 * p2.y +
                t2 * t * p3.y,
        };
    };

    const cubicTangent = (
        t: number,
        p0: { x: number; y: number },
        p1: { x: number; y: number },
        p2: { x: number; y: number },
        p3: { x: number; y: number }
    ) => {
        const mt = 1 - t;

        return {
            x:
                3 * mt * mt * (p1.x - p0.x) +
                6 * mt * t * (p2.x - p1.x) +
                3 * t * t * (p3.x - p2.x),
            y:
                3 * mt * mt * (p1.y - p0.y) +
                6 * mt * t * (p2.y - p1.y) +
                3 * t * t * (p3.y - p2.y),
        };
    };

    const normalize = (x: number, y: number) => {
        const len = Math.hypot(x, y) || 1;
        return { x: x / len, y: y / len };
    };

    // -------------------------------------------------------------------------
    // Handle
    // -------------------------------------------------------------------------
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-12, -4, 12, 8);

    // -------------------------------------------------------------------------
    // Crossguard
    // Slightly extended into the handle and blade so it visually locks better
    // -------------------------------------------------------------------------
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-2.5, -6, 5, 14);

    // -------------------------------------------------------------------------
    // Knucklebow / D-guard
    // The endpoint is aligned a bit more carefully to the crossguard area
    // -------------------------------------------------------------------------
    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(-10.5, 2.5);
    ctx.quadraticCurveTo(-5.5, 15.5, 0.5, 4.5);
    ctx.stroke();
    ctx.restore();

    // -------------------------------------------------------------------------
    // Blade centerline definition
    // All blade-related geometry will be derived from this single curve
    // -------------------------------------------------------------------------
    const p0 = { x: 4, y: 0 };
    const p1 = { x: 22, y: -2 };
    const p2 = { x: 46, y: -14 };
    const p3 = { x: 64, y: -25 };

    const samples = 18;
    const leftSide: { x: number; y: number }[] = [];
    const rightSide: { x: number; y: number }[] = [];
    const fullerPoints: { x: number; y: number }[] = [];

    for (let i = 0; i <= samples; i++) {
        const t = i / samples;

        const pt = cubicPoint(t, p0, p1, p2, p3);
        const tan = cubicTangent(t, p0, p1, p2, p3);
        const n = normalize(-tan.y, tan.x);

        // Blade width tapers toward the tip, naturally converging to 0 at the very tip for a sharp edge
        const baseWidth = 4.5 * (1 - t) + 1.5 * t;
        const width = t > 0.85 ? baseWidth * (1 - (t - 0.85) / 0.15) : baseWidth;

        // Build blade body from the same centerline
        leftSide.push({
            x: pt.x + n.x * width,
            y: pt.y + n.y * width,
        });

        rightSide.push({
            x: pt.x - n.x * width,
            y: pt.y - n.y * width,
        });

        // Fuller (groove) shifted towards the spine (negative n.y)
        if (t >= 0.08 && t <= 0.82) {
            fullerPoints.push({
                x: pt.x - n.x * 0.8,
                y: pt.y - n.y * 0.8,
            });
        }
    }

    // -------------------------------------------------------------------------
    // Blade gradient
    // -------------------------------------------------------------------------
    const bladeGradient = ctx.createLinearGradient(4, 2, 64, -24);
    bladeGradient.addColorStop(0, '#cbd5e1');    // Darker metal near the base
    bladeGradient.addColorStop(0.6, '#dbe4ee');  // Mid-tone
    bladeGradient.addColorStop(0.85, '#eef3f8'); // Bright zone
    bladeGradient.addColorStop(1, '#ffffff');    // Sharp highlight near the tip

    // -------------------------------------------------------------------------
    // Build blade path
    // -------------------------------------------------------------------------
    const bladePath = new Path2D();
    bladePath.moveTo(leftSide[0].x, leftSide[0].y);

    for (let i = 1; i < leftSide.length; i++) {
        bladePath.lineTo(leftSide[i].x, leftSide[i].y);
    }

    // Since width converges to 0.0, the tip is naturally sharp
    for (let i = rightSide.length - 1; i >= 0; i--) {
        bladePath.lineTo(rightSide[i].x, rightSide[i].y);
    }
    bladePath.closePath();

    // -------------------------------------------------------------------------
    // Draw the blade 
    // -------------------------------------------------------------------------
    ctx.save();
    ctx.fillStyle = bladeGradient;
    
    // Fallback shadow logic: Avoid shadow mapping artifacts on flipped matrices
    if (!isReversed) {
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(251, 191, 36, 0.25)';
    }
    ctx.fill(bladePath);
    ctx.restore();

    // -------------------------------------------------------------------------
    // Optional subtle blade outline for cleaner separation
    // -------------------------------------------------------------------------
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 0.8;
    ctx.stroke(bladePath);
    ctx.restore();

    // -------------------------------------------------------------------------
    // Fuller / blade groove
    // -------------------------------------------------------------------------
    if (fullerPoints.length > 1) {
        ctx.save();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(fullerPoints[0].x, fullerPoints[0].y);

        for (let i = 1; i < fullerPoints.length; i++) {
            ctx.lineTo(fullerPoints[i].x, fullerPoints[i].y);
        }

        ctx.stroke();
        ctx.restore();
    }

    ctx.restore();
}
}
