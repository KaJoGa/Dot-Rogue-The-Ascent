import { useEffect, useRef } from 'react';
import { useStore, GameStage } from '../store';
import { Player, Enemy, Boss, SpecialEnemy, EliteEnemy, Pickup } from './entities';
import { GameState, Entity, EntityType, Particle, Vector2, Camera } from './types';
import { Weapon } from './weapons/Weapon';
import { math, uid } from './utils';
import { generateLevel } from './LevelGenerator';
import { playGameOverSfx, stopBossRapidFireLoopSfx } from './audio';
import { theme } from './theme';

export default function GameArea() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const store = useStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const view = { logicalWidth: 800, logicalHeight: 600, dpr: 1 };

    // Make canvas physically match its container size
    const resizeCanvas = () => {
       if (!canvas.parentElement) return;
       const rect = canvas.parentElement.getBoundingClientRect();
       const dpr = window.devicePixelRatio || 1;
       
       view.logicalWidth = rect.width;
       view.logicalHeight = rect.height;
       view.dpr = dpr;
       
       canvas.width = rect.width * dpr;
       canvas.height = rect.height * dpr;
    };
    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    if (canvas.parentElement) {
       resizeObserver.observe(canvas.parentElement);
    }

    let animationId: number;
    let lastTime = performance.now();

    // Game State Object for loop
    const state: GameState & { onGainXp: (a: number, s?: boolean) => void, onGainCurrency: (a: number) => void } = {
      player: new Player({ x: 850, y: 650 }, useStore.getState()),
      entities: [],
      particles: [],
      floatingTexts: [],
      addFloatingText: (text: string, pos: Vector2, color: string, groupType?: string, value?: number) => {
         const spread = 20;
         
         if (groupType && value !== undefined) {
             const existing = state.floatingTexts.find(t => t.groupType === groupType && t.life > (t.maxLife - 0.5));
             if (existing) {
                 existing.groupValue = (existing.groupValue || 0) + value;
                 existing.life = existing.maxLife; // refresh decay timer
                 existing.pos = { x: pos.x, y: pos.y - 20 }; // snap to new position slightly higher
                 return;
             }
         }
         
         state.floatingTexts.push({ 
            id: uid(), 
            text: value !== undefined ? `+${value} ${groupType}` : text, 
            pos: { x: pos.x + math.randomRange(-spread, spread), y: pos.y + math.randomRange(-spread, spread) }, 
            vel: { x: math.randomRange(-30, 30), y: math.randomRange(-60, -30) },
            color, 
            life: 1.5, maxLife: 1.5,
            groupType,
            groupValue: value,
            displayValue: value
         });
      },
      width: 1600,
      height: 1200,
      level: useStore.getState().runStats.level,
      biome: useStore.getState().runStats.biome,
      enemiesToSpawn: 0,
      stageAnnouncementTimer: 0,
      mousePos: { x: 0, y: 0 },
      mouseScreenPos: { x: 0, y: 0 },
      isMouseDown: false,
      mouseRightDown: false,
      keys: {},
      time: 0,
      runTime: 0,
      addEntity: (e: Entity) => state.entities.push(e),
      removeEntity: (id: string) => {
        state.entities = state.entities.filter(e => e.id !== id);
      },
      spawnParticles: (pos: Vector2, count: number, color: string) => {
        for (let i = 0; i < count; i++) {
           state.particles.push({
             pos: { x: pos.x, y: pos.y },
             vel: { x: math.randomRange(-100, 100), y: math.randomRange(-100, 100) },
             life: 1,
             maxLife: 1,
             color,
             size: math.randomRange(2, 5)
           });
        }
      },
      onGainXp: (amount: number, suppressMenu?: boolean) => {
        useStore.getState().gainXp(amount, suppressMenu);
      },
      onGainCurrency: (amount: number) => {
        useStore.getState().updateRunStats({ currencyEarned: useStore.getState().runStats.currencyEarned + amount });
        useStore.getState().addCurrency(amount);
      },
      onGainAmmo: (amount: number) => {
        const ranged = state.player?.weapons?.ranged;
        if (ranged?.onAmmoPickup?.(amount, state, state.player)) {
          return;
        }
        const current = useStore.getState().runStats.ammo ?? 20;
        useStore.getState().updateRunStats({ ammo: current + amount });
      },
      onUseAmmo: () => {
        const current = useStore.getState().runStats.ammo ?? 0;
        if (current > 0) {
           useStore.getState().updateRunStats({ ammo: current - 1 });
           return true;
        }
        return false;
      }
    };

    window.currentRunTime = 0;

    // Load level
    generateLevel(state);

    const camera: Camera = { 
      pos: { 
        x: state.player.pos.x - view.logicalWidth / 2, 
        y: state.player.pos.y - view.logicalHeight / 2 
      }, 
      width: view.logicalWidth, 
      height: view.logicalHeight 
    };
    camera.pos.x = Math.max(0, Math.min(state.width - camera.width, camera.pos.x));
    camera.pos.y = Math.max(0, Math.min(state.height - camera.height, camera.pos.y));

    const clearInputState = () => {
      Object.keys(state.keys).forEach(k => { state.keys[k] = false; });
      state.isMouseDown = false;
      state.mouseRightDown = false;
      if (state.player) {
        state.player.vel = { x: 0, y: 0 };
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => { 
      const currentStage = useStore.getState().stage;
      const isPaused = useStore.getState().isPaused;
      if (currentStage === GameStage.PLAYING && !isPaused) {
        state.keys[e.key.toLowerCase()] = true; 
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { 
      state.keys[e.key.toLowerCase()] = false; 
    };
    const handleMouseMove = (e: MouseEvent) => {
       const rect = canvas.getBoundingClientRect();
       state.mouseScreenPos = {
         x: e.clientX - rect.left,
         y: e.clientY - rect.top
       };
    };
    const handleMouseDown = (e: MouseEvent) => {
       const currentStage = useStore.getState().stage;
       const isPaused = useStore.getState().isPaused;
       if (currentStage !== GameStage.PLAYING || isPaused) return;
       if (e.button === 0) state.isMouseDown = true;
       if (e.button === 2) state.mouseRightDown = true;
    };
    const handleMouseUp = (e: MouseEvent) => {
       if (e.button === 0) state.isMouseDown = false;
       if (e.button === 2) state.mouseRightDown = false;
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleBlur = () => clearInputState();

    const handleSkipStage = () => {
        const isBoss = state.level % 10 === 0 || useStore.getState().isBossRush;
        if (state.skipForceComplete || isBoss) return;
        state.time = 60; // trigger the timeout directly
        state.skipForceComplete = true; // custom flag for force complete
        // Preserve all living enemies on wave skip
        window.dispatchEvent(new CustomEvent('wave-skipped'));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('skip-stage', handleSkipStage);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('blur', handleBlur);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('contextmenu', handleContextMenu);

    let spawnTimer = 0;
    let levelClearDelay = 1.5;
    let stageSpecialEnemySpawned = false;
    let stageSpecialEnemyRoll = Math.random() < 0.5;
    let stageEliteEnemySpawned = false;

    const loop = (time: number) => {
      // Handle pausing if checking level up
      const currentStage = useStore.getState().stage;
      const isPaused = useStore.getState().isPaused;

      if (currentStage !== GameStage.PLAYING || isPaused) {
          clearInputState();
          lastTime = time; // prevent large dt buildup
          animationId = requestAnimationFrame(loop);
          return;
      }

      const dt = Math.min((time - lastTime) / 1000, 0.1); // cap dt
      lastTime = time;
      state.time += dt;
      state.runTime += dt;
      window.currentRunTime = state.runTime;
      
      const isBossRush = useStore.getState().isBossRush;
      const isSandbox = useStore.getState().isSandbox;
      const isBossStage = !isSandbox && (state.level % 10 === 0 || isBossRush);
      window.isBossStage = isBossStage;

      const maxStageTime = isBossStage ? 0 : 60;
      const remainingTime = isBossStage ? 0 : Math.max(0, maxStageTime - state.time);
      window.currentStageTimeRemaining = remainingTime;
      window.currentStageTimeMax = maxStageTime;
      window.canSkipWave = !isBossStage && !isSandbox && remainingTime <= 40 && !useStore.getState().settings?.autoSkipWave;
      const specialSpawnValid = !isBossRush && !isSandbox && state.level > 1 && state.level % 2 === 1 && !stageSpecialEnemySpawned && stageSpecialEnemyRoll;
      const eliteSpawnValid = !isBossRush && !isSandbox && state.level % 3 === 0 && state.level % 10 !== 0 && !stageEliteEnemySpawned;
      
      if (state.enemiesToSpawn > 0 || specialSpawnValid || eliteSpawnValid) {
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
           spawnTimer = Math.max(0.05, (1.5 - state.level * 0.05) * 0.25);
           
           if (eliteSpawnValid) {
               stageEliteEnemySpawned = true;
               
               // Spawn first elite
               const angle1 = Math.random() * Math.PI * 2;
               const dist1 = 400 + Math.random() * 400; // 400 to 800
               const pos1 = {
                    x: state.player.pos.x + Math.cos(angle1) * dist1,
                    y: state.player.pos.y + Math.sin(angle1) * dist1
               };
               pos1.x = Math.max(50, Math.min(state.width - 50, pos1.x));
               pos1.y = Math.max(50, Math.min(state.height - 50, pos1.y));
               state.addEntity(new EliteEnemy(pos1, state.level));

               // Spawn second elite on the opposite side to prevent perfect overlapping
               const angle2 = angle1 + Math.PI;
               const pos2 = {
                    x: state.player.pos.x + Math.cos(angle2) * dist1,
                    y: state.player.pos.y + Math.sin(angle2) * dist1
               };
               pos2.x = Math.max(50, Math.min(state.width - 50, pos2.x));
               pos2.y = Math.max(50, Math.min(state.height - 50, pos2.y));
               state.addEntity(new EliteEnemy(pos2, state.level));
           } else if (specialSpawnValid) {
               stageSpecialEnemySpawned = true;
               const angle = Math.random() * Math.PI * 2;
               const dist = 400 + Math.random() * 400;
               const pos = {
                    x: state.player.pos.x + Math.cos(angle) * dist,
                    y: state.player.pos.y + Math.sin(angle) * dist
               };
               pos.x = Math.max(50, Math.min(state.width - 50, pos.x));
               pos.y = Math.max(50, Math.min(state.height - 50, pos.y));
               state.addEntity(new SpecialEnemy(pos, state.level));
           } else if (state.enemiesToSpawn > 0) {
               state.enemiesToSpawn--;
               
               const spawnMethod = Math.random() < 0.7 ? "radius" : "border";
               const pos = { x: 0, y: 0 };
               if (spawnMethod === "radius") {
                   const angle = Math.random() * Math.PI * 2;
                   const distance = 400 + Math.random() * 400; // 400 to 800 units away
                   pos.x = state.player.pos.x + Math.cos(angle) * distance;
                   pos.y = state.player.pos.y + Math.sin(angle) * distance;
               } else {
                   const side = Math.floor(Math.random() * 4);
                   if (side === 0) {
                       pos.x = Math.random() * state.width;
                       pos.y = 10;
                   } else if (side === 1) {
                       pos.x = state.width - 10;
                       pos.y = Math.random() * state.height;
                   } else if (side === 2) {
                       pos.x = Math.random() * state.width;
                       pos.y = state.height - 10;
                   } else {
                       pos.x = 10;
                       pos.y = Math.random() * state.height;
                   }
               }

               pos.x = Math.max(50, Math.min(state.width - 50, pos.x));
               pos.y = Math.max(50, Math.min(state.height - 50, pos.y));
               state.addEntity(new Enemy(pos, state.level));
           }
        }
      }

      // Update
      state.player.update(dt, state);
      if (state.player.isDead) { // Game Over Check
         const currentStage = useStore.getState().stage;
         if (currentStage !== GameStage.GAME_OVER) {
             stopBossRapidFireLoopSfx();
             playGameOverSfx();
             useStore.getState().setStage(GameStage.GAME_OVER);
         }
      }

      // Propagate state to window for react components/entities
      window.currentPlayerHp = { current: state.player.hp, max: state.player.maxHp };
      const boss = state.entities.find((e) => e.type === EntityType.BOSS);
      if (boss) {
          window.currentBossHp = { current: boss.hp, max: boss.maxHp, color: boss.color };
      } else {
          window.currentBossHp = null;
      }
      window.gameSettings = useStore.getState().settings;

      state.entities.forEach(e => e.update(dt, state));
      state.entities = state.entities.filter(e => !e.isDead);

      // Merge Pickups to reduce lag and audio burst
      const pickups = state.entities.filter(e => e instanceof Pickup) as Pickup[];
      const mergePickupsByType = (pType: number) => {
         const typed = pickups.filter(p => !p.isDead && p.pType === pType);
         for (let i = 0; i < typed.length; i++) {
             const base = typed[i];
             if (base.isDead || base.absorbedCount >= 10) continue;
             
             for (let j = i + 1; j < typed.length; j++) {
                 const other = typed[j];
                 if (other.isDead || other.absorbedCount >= 10) continue;
                 
                 if (math.dist(base.pos, other.pos) < 150) {
                     if (base.absorbedCount + other.absorbedCount <= 10) {
                         base.value += other.value;
                         base.absorbedCount += other.absorbedCount;
                         other.isDead = true;
                         
                         if (pType === 0 || pType === 1) base.radius = Math.min(15, 3 + base.absorbedCount);
                         else base.radius = Math.min(20, 6 + base.absorbedCount);
                         
                         if (base.absorbedCount >= 10) break;
                     }
                 }
             }
         }
      };
      
      mergePickupsByType(0); // XP
      mergePickupsByType(1); // Currency
      mergePickupsByType(2); // HP
      mergePickupsByType(3); // Ammo
      mergePickupsByType(4); // Big HP
      
      state.entities = state.entities.filter(e => !e.isDead);

      // Check level clear
      if (!isSandbox) {
          const activeEnemies = state.entities.filter((e) => 
              e.type === EntityType.BOSS || 
              e.type === EntityType.ENEMY || 
              e.type === EntityType.SPECIAL_ENEMY || 
              e.type === EntityType.ELITE_ENEMY
          ).length;
          
          const maxStageTime = state.level % 10 === 0 ? 120 : 60;
          const remainingTime = Math.max(0, maxStageTime - state.time);
          const autoSkip = useStore.getState().settings?.autoSkipWave;
          const canSkip = remainingTime <= 40;
          
          let skipTriggered = !isBossStage && state.skipForceComplete;
          if (!isBossStage && canSkip) {
             if (state.keys['e'] || state.keys['y'] || autoSkip) {
                state.keys['e'] = false;
                state.keys['y'] = false;
                if (!state.skipForceComplete) {
                   state.skipForceComplete = true;
                   // Do NOT clear living enemies - keep them alive for the next stage!
                   window.dispatchEvent(new CustomEvent('wave-skipped'));
                }
                skipTriggered = true;
             }
          }
          const timerEnded = !isBossStage && remainingTime <= 0;
          const enemiesCleared = isBossStage 
              ? state.entities.filter(e => e.type === EntityType.BOSS).length === 0
              : (state.enemiesToSpawn <= 0 && activeEnemies === 0);
          
          if (enemiesCleared || timerEnded || skipTriggered) {
              advanceLevel();
          }
      }

      state.particles.forEach(p => {
         p.pos = math.add(p.pos, math.mul(p.vel, dt));
         p.life -= dt;
      });
      state.particles = state.particles.filter(p => p.life > 0);

      state.floatingTexts.forEach(ft => {
          ft.pos.x += ft.vel.x * dt;
          ft.pos.y += ft.vel.y * dt;
          ft.life -= dt;
          if (ft.groupType && ft.groupValue !== undefined && ft.displayValue !== undefined) {
              if (ft.displayValue < ft.groupValue) {
                  ft.displayValue = Math.min(ft.groupValue, ft.displayValue + dt * Math.max(10, (ft.groupValue - ft.displayValue) * 10));
                  ft.text = `+${Math.floor(ft.displayValue)} ${ft.groupType}`;
              }
          }
      });
      state.floatingTexts = state.floatingTexts.filter(ft => ft.life > 0);

      // Camera follow player
      camera.width = view.logicalWidth;
      camera.height = view.logicalHeight;
      camera.pos.x = math.lerp(camera.pos.x, state.player.pos.x - camera.width / 2, dt * 5);
      camera.pos.y = math.lerp(camera.pos.y, state.player.pos.y - camera.height / 2, dt * 5);

      // Clamp camera
      camera.pos.x = Math.max(0, Math.min(Math.max(0, state.width - camera.width), camera.pos.x));
      camera.pos.y = Math.max(0, Math.min(Math.max(0, state.height - camera.height), camera.pos.y));

      // Update world mousePos based on clamped camera
      state.mousePos = {
         x: state.mouseScreenPos.x + camera.pos.x,
         y: state.mouseScreenPos.y + camera.pos.y
      };

      // Apply DPR scaling
      ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);

      // Background tiles
      const isSandboxRender = useStore.getState().isSandbox;
      ctx.fillStyle = isSandboxRender ? '#f1f5f9' : '#373D4A'; // soft white for sandbox, dark slate void background otherwise
      ctx.fillRect(0, 0, view.logicalWidth, view.logicalHeight);

      if (!isSandboxRender) {
         // Simple pseudo-procedural grid floor
         const tileSize = 40;
         const startX = Math.max(0, Math.floor(camera.pos.x / tileSize) * tileSize);
         const startY = Math.max(0, Math.floor(camera.pos.y / tileSize) * tileSize);
         const endX = Math.min(state.width, camera.pos.x + camera.width);
         const endY = Math.min(state.height, camera.pos.y + camera.height);

         for (let x = startX; x < endX; x += tileSize) {
            for (let y = startY; y < endY; y += tileSize) {
               // Procedural determinism based on coordinates
               const seed = (x * 73856093 ^ y * 19349663) % 100;
               if (seed < 80) {
                  ctx.fillStyle = theme.bg.background; // normal slate floor #444B5A
               } else if (seed < 95) {
                  ctx.fillStyle = '#3E4452'; // slightly darker slate tile
               } else {
                  ctx.fillStyle = '#4B5364'; // slightly lighter slate tile
               }
               
               ctx.fillRect(x - camera.pos.x, y - camera.pos.y, tileSize - 1, tileSize - 1);
            }
         }
      }

      // Map bounds
      ctx.strokeStyle = theme.bg.border;
      ctx.lineWidth = 4;
      ctx.strokeRect(-camera.pos.x, -camera.pos.y, state.width, state.height);

      // Entities
      state.entities.forEach(e => e.draw(ctx, camera));
      state.player.draw(ctx, camera);
      
      // Weapon Overlays
      if (state.player.weapons) {
          Object.values(state.player.weapons).forEach((w: Weapon) => {
              if (w.drawOverlay) w.drawOverlay(ctx, camera, state, state.player);
          });
      }

      // Particles
      state.particles.forEach(p => {
         ctx.fillStyle = p.color;
         ctx.globalAlpha = p.life / p.maxLife;
         ctx.beginPath();
         ctx.arc(p.pos.x - camera.pos.x, p.pos.y - camera.pos.y, p.size, 0, Math.PI*2);
         ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Floating texts
      state.floatingTexts.forEach(ft => {
         ctx.save();
         ctx.globalAlpha = Math.max(0, Math.min(1, ft.life / ft.maxLife));
         ctx.fillStyle = ft.color;
         ctx.font = 'bold 20px monospace';
         ctx.textAlign = 'center';
         ctx.strokeStyle = 'rgba(0,0,0,0.8)';
         ctx.lineWidth = 3;
         ctx.strokeText(ft.text, ft.pos.x - camera.pos.x, ft.pos.y - camera.pos.y);
         ctx.fillText(ft.text, ft.pos.x - camera.pos.x, ft.pos.y - camera.pos.y);
         ctx.restore();
      });

      // Crosshair ranged recharge bar
      const p = state.player;
      if (p && p.rangedCooldown > 0 && p.maxRangedCooldown > 0) {
          const mX = state.mouseScreenPos.x;
          const mY = state.mouseScreenPos.y + 25; // 25px below cursor
          const barW = 30;
          const barH = 5;
          const pct = Math.max(0, Math.min(1, 1 - (p.rangedCooldown / p.maxRangedCooldown)));
          const rangedState = window.currentRangedWeaponState;
          const isHandCannon = rangedState?.id === 'hand_cannon';
          const chargeColors = [theme.accent.secondary, theme.accent.success, theme.enemies.elite, theme.accent.gold, theme.accent.primary];
          const chargeLevel = isHandCannon ? Math.max(1, Math.min(5, rangedState.charges || 1)) : 1;
          const isFullHandCannon = isHandCannon && rangedState.charges >= rangedState.maxCharges;
          const outlinePulse = isHandCannon && chargeLevel >= 3 ? Math.sin(state.runTime * 28) * 1.5 : 0;
          
          ctx.save();
          if (isFullHandCannon) {
              const glowRadius = 18 + Math.sin(state.runTime * 8) * 3;
              const glow = ctx.createRadialGradient(mX, mY + barH / 2, 0, mX, mY + barH / 2, glowRadius);
              glow.addColorStop(0, `${chargeColors[4]}aa`);
              glow.addColorStop(1, `${chargeColors[4]}00`);
              ctx.fillStyle = glow;
              ctx.beginPath();
              ctx.arc(mX, mY + barH / 2, glowRadius, 0, Math.PI * 2);
              ctx.fill();
          }
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(mX - barW/2 - 1 - Math.max(0, outlinePulse), mY - 1 - Math.max(0, outlinePulse), barW + 2 + Math.max(0, outlinePulse) * 2, barH + 2 + Math.max(0, outlinePulse) * 2);
          ctx.fillStyle = isHandCannon ? chargeColors[chargeLevel - 1] : theme.accent.secondary;
          ctx.fillRect(mX - barW/2, mY, barW * pct, barH);
          if (isHandCannon) {
              ctx.strokeStyle = chargeColors[chargeLevel - 1];
              ctx.lineWidth = chargeLevel >= 3 ? 2.5 : 1;
              ctx.strokeRect(mX - barW/2 - 2, mY - 2, barW + 4, barH + 4);
          }
          ctx.restore();
      }

      // Draw stage announcement
      if (state.stageAnnouncementTimer > 0) {
         state.stageAnnouncementTimer -= dt;
         ctx.save();
         ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, state.stageAnnouncementTimer)})`;
         ctx.font = 'bold 64px sans-serif';
         ctx.textAlign = 'center';
         ctx.shadowColor = 'rgba(0,0,0,0.8)';
         ctx.shadowBlur = 10;
         ctx.shadowOffsetX = 4;
         ctx.shadowOffsetY = 4;
         ctx.fillText(state.level % 10 === 0 ? `BOSS STAGE` : `STAGE ${state.level}`, camera.width / 2, camera.height / 2 - 50);
         
         ctx.font = '24px monospace';
         ctx.fillStyle = `rgba(165, 180, 252, ${Math.min(1, state.stageAnnouncementTimer)})`; // indigo-300
         ctx.fillText(`Biome ${state.biome}`, camera.width / 2, camera.height / 2 + 10);
         ctx.restore();
      }

      // Lighting (Darkness mask)
      const isSandboxLight = useStore.getState().isSandbox;
      if (!isSandboxLight) {
          const overlayCtx = document.createElement('canvas').getContext('2d');
          if (overlayCtx) {
              overlayCtx.canvas.width = view.logicalWidth * view.dpr;
              overlayCtx.canvas.height = view.logicalHeight * view.dpr;
              overlayCtx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
              overlayCtx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Brighter ambient
              overlayCtx.fillRect(0, 0, camera.width, camera.height);
    
              overlayCtx.globalCompositeOperation = 'destination-out';
              
              // Player light
              const drawLight = (pos: Vector2, radius: number) => {
                 const grad = overlayCtx.createRadialGradient(
                    pos.x - camera.pos.x, pos.y - camera.pos.y, 0,
                    pos.x - camera.pos.x, pos.y - camera.pos.y, radius
                 );
                 grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                 grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                 overlayCtx.fillStyle = grad;
                 overlayCtx.beginPath();
                 overlayCtx.arc(pos.x - camera.pos.x, pos.y - camera.pos.y, radius, 0, Math.PI * 2);
                 overlayCtx.fill();
              };
    
              drawLight(state.player.pos, 150);
              state.entities.forEach(e => {
                 if (e.type === 2) drawLight(e.pos, 80); // Projectile light
                 if (e.type === 4) drawLight(e.pos, 50); // Pickup light
                 if (e.type === 3) drawLight(e.pos, 200); // Boss light
              });
    
              ctx.save();
              ctx.resetTransform();
              ctx.drawImage(overlayCtx.canvas, 0, 0, overlayCtx.canvas.width, overlayCtx.canvas.height);
              ctx.restore();
          }
      }

      // HUD overlay handled by React

      animationId = requestAnimationFrame(loop);
    };

    const advanceLevel = () => {
       const runStats = useStore.getState().runStats;
       const isBossRush = useStore.getState().isBossRush;
       const isSandbox = useStore.getState().isSandbox;

       let nextLevel = runStats.level + 1;
       let nextBiome = runStats.biome;
       
       const reward = 10 + Math.floor(runStats.level * 1.5);
       state.onGainCurrency(reward);
       
       if (nextLevel > nextBiome * 10) {
           nextBiome++;
       }
       useStore.getState().updateRunStats({ level: nextLevel, biome: nextBiome });
       state.level = nextLevel;
       state.biome = nextBiome;
       state.time = 0;
       state.skipForceComplete = false;
       state.keys['e'] = false;
       state.keys['y'] = false;
       
       if (useStore.getState().isBossRush) {
           useStore.getState().triggerBossReward();
       } else if (useStore.getState().runStats.pendingLevelUps > 0) {
           useStore.getState().setStage(GameStage.LEVEL_UP);
       }
       
       stageSpecialEnemySpawned = false;
       stageSpecialEnemyRoll = Math.random() < 0.5;
       stageEliteEnemySpawned = false;
       
       generateLevel(state);
       camera.pos.x = Math.max(0, Math.min(Math.max(0, state.width - camera.width), camera.pos.x));
       camera.pos.y = Math.max(0, Math.min(Math.max(0, state.height - camera.height), camera.pos.y));
       state.addFloatingText(`Stage Cleared! +${reward} Gold`, {x: state.player.pos.x, y: state.player.pos.y - 40}, theme.accent.gold);
    }

    animationId = requestAnimationFrame(loop);

    return () => {
       stopBossRapidFireLoopSfx();
       state.entities = [];
       state.particles = [];
       state.floatingTexts = [];
       window.currentPlayerHp = null;
       window.currentBossHp = null;
       window.canSkipWave = false;
       window.isBossStage = false;
       cancelAnimationFrame(animationId);
       resizeObserver.disconnect();
       window.removeEventListener('keydown', handleKeyDown);
       window.removeEventListener('keyup', handleKeyUp);
       window.removeEventListener('skip-stage', handleSkipStage);
       window.removeEventListener('mouseup', handleMouseUp);
       window.removeEventListener('blur', handleBlur);
       canvas.removeEventListener('mousemove', handleMouseMove);
       canvas.removeEventListener('mousedown', handleMouseDown);
       canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div className="absolute inset-0 bg-[#373D4A] overflow-hidden">
       <canvas 
          ref={canvasRef} 
          className="absolute inset-0 cursor-crosshair w-full h-full bg-[#444B5A]"
       />
    </div>
  );
}
