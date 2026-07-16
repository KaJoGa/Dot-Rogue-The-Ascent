import { Weapon, WeaponMetadata } from './Weapon';
import { GameState, Vector2, EntityType, Camera } from '../types';
import { Player } from '../entities/player/Player';
import { math } from '../utils';
import { playPlasmaSfx, playPlasmaCritSfx } from '../audio';
import { MeleeSlash } from '../entities/MeleeSlash';
import { BaseEntity } from '../entities/BaseEntity';

export class PlasmaDagger extends Weapon {
    static readonly metadata: WeaponMetadata = {
        name: 'PLASMA DAGGER',
        type: 'Melee',
        damage: '1 - 25',
        damageVal: 13,
        range: 'Short (35px)',
        rangeVal: 35,
        speed: 'Fast (0.15s)',
        speedVal: 0.15,
        special: 'Agile Momentum (-0.5s dash CD). Weakpoint hits deal 1.9x critical damage.',
        color: '#34d399',
    };

    id = 'plasma_dagger';
    baseDamage = 1;
    private readonly nonCritDamageMultiplier = 0.7;
    private readonly critDamageMultiplier = 1.9;
    private readonly cappedDamageMultiplier = 1.2;
    private readonly weakpointAngleWidth = 4 * Math.PI / 9;
    private readonly weakpointIndicatorAngleWidth = 4 * Math.PI / 9;
    // Plasma dagger attacks very fast; lowering max cooldown logic handled in equip() via base modifiers
    // Range is short
    baseRange = 5;
    
    // We keep track of attack states
    isAttacking = false;
    attackProgress = 0;
    attackDuration = 0.15; // Fast stab
    isDualDaggerActive = false;
    
    equip(player: Player): void {
        super.equip(player);
        // Passive #1: Agile Momentum
        // Reduces player's dash cooldown limit by 0.5s
        player.maxDashCooldown = Math.max(0.1, player.maxDashCooldown - 0.5);
        player.minAtkSpeedMod = Math.max(0.1, player.minAtkSpeedMod - 0.1);
        player.attackRangeCap = 80;
    }

    unequip(player: Player): void {
        super.unequip(player);
        // Remove Agile Momentum
        player.maxDashCooldown += 0.5;
        player.minAtkSpeedMod += 0.1;
        player.attackRangeCap = 100;
    }

    /**
     * Initializes the random weakness spot for an enemy.
     * 0 = Top, 1 = Bottom, 2 = Left, 3 = Right.
     */
    spawnEnemyWeakpoint(enemy: BaseEntity): void {
        if (enemy.weakpoint === undefined) {
            enemy.weakpoint = Math.floor(Math.random() * 4);
        }
    }

    /**
     * Checks if the thrust hits the designated weakness spot angle for Passive #2.
     */
    checkAttackCollision(player: Player, enemy: BaseEntity, attackAngle: number): boolean {
        if (enemy.weakpoint === undefined) return false;

        const dirToEnemy = math.normalize(math.sub(enemy.pos, player.pos));
        const angleToEnemy = Math.atan2(dirToEnemy.y, dirToEnemy.x);
        
        // Attack hit angle is roughly attackAngle
        // Let's determine where the enemy's weakpoint is in world space based on the enemy center
        // 0 = Top (-Math.PI/2), 1 = Bottom (Math.PI/2), 2 = Left (Math.PI or -Math.PI), 3 = Right (0)
        let weakpointAngle = 0;
        switch (enemy.weakpoint) {
            case 0: weakpointAngle = -Math.PI / 2; break; // Top
            case 1: weakpointAngle = Math.PI / 2; break;  // Bottom
            case 2: weakpointAngle = Math.PI; break;      // Left
            case 3: weakpointAngle = 0; break;            // Right
        }

        // To hit the weakpoint, the player's attack must come from the direction exposing the weakpoint
        // i.e., hitting from above if the weakpoint is on Top.
        // So angleToEnemy should be close to weakpointAngle (meaning player is directly "above" striking down? No, if weakpoint is top, player needs to be attacking down (attackAngle roughly Math.PI/2) and hitting the top side).
        // Actually, let's simplify: the angle from the enemy to the player should roughly match weakpointAngle.
        // E.g., if weakpoint is Left (Math.PI), the player should be on the Left side of the enemy attacking Right.
        const angleFromEnemyToPlayer = Math.atan2(-dirToEnemy.y, -dirToEnemy.x);
        
        // Difference between where the player is and where the weakpoint is
        let diff = Math.abs(angleFromEnemyToPlayer - weakpointAngle);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        
        return diff <= this.weakpointAngleWidth / 2;
    }

    drawOverlay(ctx: CanvasRenderingContext2D, camera: Camera, game: GameState, player: Player): void {
        for (const ent of game.entities) {
            if (ent.type === EntityType.ENEMY || ent.type === EntityType.BOSS || ent.type === EntityType.ELITE_ENEMY || ent.type === EntityType.SPECIAL_ENEMY || ent.type === EntityType.SANDBOX_DUMMY) {
                this.renderWeakpoint(ctx, ent, camera);
            }
        }
    }

    /**
     * Draws the enlarged body-outline arc for the enemy weak spot.
     */
    renderWeakpoint(ctx: CanvasRenderingContext2D, enemy: BaseEntity, camera?: Camera): void {
        if (enemy.weakpoint === undefined || enemy.isDead) return;

        let angle = 0;
        switch (enemy.weakpoint) {
            case 0: angle = -Math.PI / 2; break;
            case 1: angle = Math.PI / 2; break;
            case 2: angle = Math.PI; break;
            case 3: angle = 0; break;
        }

        ctx.save();
        const x = enemy.pos.x - (camera?.pos.x || 0);
        const y = enemy.pos.y - (camera?.pos.y || 0);
        const outlineRadius = enemy.radius + 6;
        
        ctx.beginPath();
        ctx.arc(x, y, outlineRadius, angle - this.weakpointIndicatorAngleWidth / 2, angle + this.weakpointIndicatorAngleWidth / 2);
        ctx.strokeStyle = '#22D3EE'; // Cyan-500
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#22D3EE';
        ctx.shadowBlur = 8;
        ctx.stroke();
        
        ctx.restore();
    }

    update(dt: number, game: GameState, player: Player): void {
        this.cooldown -= dt;
        
        // Passively add weakpoints to enemies
        game.entities.forEach(ent => {
            if (ent.type === EntityType.ENEMY || ent.type === EntityType.ELITE_ENEMY || ent.type === EntityType.BOSS || ent.type === EntityType.SPECIAL_ENEMY || ent.type === EntityType.SANDBOX_DUMMY) {
                this.spawnEnemyWeakpoint(ent);
            }
        });

        if (this.isAttacking) {
            this.attackProgress += dt;
            if (this.attackProgress >= this.attackDuration) {
                this.isAttacking = false;
                this.attackProgress = 0;
            }
        }

        if (this.cooldown <= 0 && !this.isAttacking) {
            const attackRange = player.attackRange;
            
            // attack
            const targetPos = game.mousePos;
            const attackDir = math.normalize(math.sub(targetPos, player.pos));
            const angle = Math.atan2(attackDir.y, attackDir.x);
            
            // Atk Speed limit modifier implemented
            // The weapon base atk speed modifier is -0.1s interval
            const rawCooldown = 0.7 - 0.1 + player.stats.runUpgrades.atkSpeed;
            const finalCooldown = Math.max(player.minAtkSpeedMod, rawCooldown);
            this.isDualDaggerActive = rawCooldown <= player.minAtkSpeedMod;
            
            const animSpeedMod = finalCooldown / 0.55;
            
            this.attackDuration = 0.15 * animSpeedMod;
            this.maxCooldown = finalCooldown;
            this.isAttacking = true;
            this.attackProgress = 0;

            const finalAttackRange = attackRange;

            const totalDamage = player.damage * (this.isDualDaggerActive ? this.cappedDamageMultiplier : 1);
            playPlasmaSfx();
            
            // MeleeSlash expects an entity owner, angle, reach... and handles its own collision, but since we have custom Weakpoint logic, we can do collision right here instead of relying on MeleeSlash default arc.
            // Still add a slash for visual effects
            game.addEntity(new MeleeSlash(player, angle, player.radius + finalAttackRange, this, false, animSpeedMod, 'stab'));

            const bladeReach = player.radius + finalAttackRange;
            const perpendicular = { x: -attackDir.y, y: attackDir.x };
            const bladeStartDistance = player.radius * 0.4;
            const bladeEnd = math.add(player.pos, math.mul(attackDir, bladeReach));
            const bladeSegments = this.isDualDaggerActive
                ? [-12, 12].map(offset => ({
                    start: math.add(
                        math.add(player.pos, math.mul(attackDir, bladeStartDistance)),
                        math.mul(perpendicular, offset)
                    ),
                    end: bladeEnd
                }))
                : [{
                    start: math.add(player.pos, math.mul(attackDir, bladeStartDistance)),
                    end: bladeEnd
                }];
            const bladeHitRadius = 10;
            const distanceToSegment = (point: Vector2, start: Vector2, end: Vector2) => {
                const segment = math.sub(end, start);
                const lenSq = segment.x * segment.x + segment.y * segment.y;
                if (lenSq === 0) return math.dist(point, start);
                const t = Math.max(0, Math.min(1, ((point.x - start.x) * segment.x + (point.y - start.y) * segment.y) / lenSq));
                const closest = {
                    x: start.x + segment.x * t,
                    y: start.y + segment.y * t
                };
                return math.dist(point, closest);
            };
            const distanceToBlade = (point: Vector2) => Math.min(
                ...bladeSegments.map(segment => distanceToSegment(point, segment.start, segment.end))
            );
        
            for (const ent of game.entities) {
                if (ent === player || ent.isDead) continue;
                if (ent.type === EntityType.ENEMY || ent.type === EntityType.BOSS || ent.type === EntityType.ELITE_ENEMY || ent.type === EntityType.SPECIAL_ENEMY || ent.type === EntityType.SANDBOX_DUMMY) {
                    if (distanceToBlade(ent.pos) <= ent.radius + bladeHitRadius) {
                            // Hit!
                            if ((ent as any).invulnTimer > 0) continue;
                            
                            // Check for Critical Hit
                            const isCrit = this.checkAttackCollision(player, ent, angle);
                            const appliedDamage = totalDamage * (isCrit ? this.critDamageMultiplier : this.nonCritDamageMultiplier);
                            
                            if (isCrit) {
                                playPlasmaCritSfx();
                                // Add a text pop-up for crit
                                game.addFloatingText('CRIT!', ent.pos, '#22D3EE', '', Math.floor(appliedDamage));
                                
                                // Weakpoints regenerate after being hit
                                ent.weakpoint = Math.floor(Math.random() * 4);
                            }
                            
                            ent.takeDamage(appliedDamage, game);
                            const pushDir = math.normalize(math.sub(ent.pos, player.pos));
                            ent.applyKnockback(pushDir, 200); // Sharp pushback
                    }
                }
            }
            
            // maxCooldown is already set earlier to finalCooldown
            this.cooldown = this.maxCooldown;
        } // close if (this.cooldown <= 0)
    }

    drawAttack(ctx: CanvasRenderingContext2D, progress: number, reach: number, isReversed: boolean): void {
        // We draw the plasma dagger thrust
        // Instead of swinging, it thrusts forward using absolute progress 0->1->0 handled by MeleeSlash
        const thrustDist = progress * reach * 0.8;
        const drawDaggerModel = () => {
            // Blade Glow
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
        };
        
        ctx.save();
        if (this.isDualDaggerActive) {
            const sideOffset = 12 * (1 - progress * 0.65);
            const inwardAngle = 0.16 * (1 - progress * 0.35);
            ctx.save();
            ctx.translate(thrustDist, -sideOffset);
            ctx.rotate(inwardAngle);
            drawDaggerModel();
            ctx.restore();

            ctx.save();
            ctx.translate(thrustDist, sideOffset);
            ctx.rotate(-inwardAngle);
            drawDaggerModel();
            ctx.restore();
        } else {
            ctx.translate(thrustDist, 0); // Stabbing forward
            drawDaggerModel();
        }
        
        ctx.restore();
    }
}
