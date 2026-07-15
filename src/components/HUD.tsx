import React, { useState, useEffect } from 'react';
import { useStore, GameStage } from '../store';
import { Pause, Lock } from 'lucide-react';
import { playHoverSfx, playClickSfx } from '../game/audio';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  accent?: 'indigo' | 'emerald';
}

function CustomCheckbox({ checked, onChange, accent = 'indigo' }: CheckboxProps) {
  const activeColor = accent === 'emerald' ? 'bg-emerald-500 border-emerald-500' : 'bg-indigo-500 border-indigo-500';
  return (
    <button
      type="button"
      onMouseEnter={() => playHoverSfx()}
      onClick={() => {
        playClickSfx();
        onChange(!checked);
      }}
      className={`w-5 h-5 border-[1.5px] rounded flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none select-none
        ${checked 
          ? `${activeColor} text-[#120E1B]` 
          : 'bg-[var(--hud-bg-dark)] border-[#4A4066] hover:border-[#7C3AED]'
        }`}
    >
      {checked && (
        <svg className="w-3.5 h-3.5 stroke-white stroke-[3.5]" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      )}
    </button>
  );
}

const HUD_THEME = {
  bgDark: '#1F1830',
  bgAccent: '#2A2140',
  borderColor: '#362A52',
  muted: '#6B6480',
};

export default function HUD() {
  const { runStats, upgrades, runUpgrades, selectedWeapons, isPaused, setIsPaused, setStage, settings, updateSettings, isSandbox } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);

  const inlineStyles = {
    '--hud-bg-dark': HUD_THEME.bgDark,
    '--hud-bg-accent': HUD_THEME.bgAccent,
    '--hud-border-color': HUD_THEME.borderColor,
    '--hud-muted': HUD_THEME.muted,
  } as React.CSSProperties;

  const formatStat = (num: number) => {
    const rounded = Math.round(num * 1000) / 1000;
    return rounded.toString();
  };

  useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
           if (showQuitConfirm) setShowQuitConfirm(false);
           else {
               const newPausedState = !isPaused;
               setIsPaused(newPausedState);
               setShowSettings(newPausedState);
           }
        }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, showSettings, showQuitConfirm, setIsPaused]);

  // Try to find the player from GameState if we could, but react doesn't know. 
  // Wait, React doesn't directly know the Player HP because it changes every frame via Canvas.
  // One way is to poll it or just use Zustond. But the prompt says "Show player HP bar". 
  // Wait I should add HP to runStats? Or give an event interval for React.
  // Actually, since React needs to render HP, and we just removed it from canvas, we can use a custom event.
  const [playerHp, setPlayerHp] = useState({ current: 0, max: 100 });
  const [bossHp, setBossHp] = useState<{ current: number, max: number, color?: string } | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [canSkipWave, setCanSkipWave] = useState<boolean>(false);
  const [rangedWeaponState, setRangedWeaponState] = useState<any>(null);

  useEffect(() => {
     const interval = setInterval(() => {
         const hpEvt = (window as any).currentPlayerHp;
         if (hpEvt) {
             setPlayerHp(hpEvt);
         }
         const bossHpEvt = (window as any).currentBossHp;
         if (bossHpEvt) {
             setBossHp(bossHpEvt);
         } else {
             setBossHp(null);
         }
         const remainingTimeEvt = (window as any).currentStageTimeRemaining;
         if (typeof remainingTimeEvt === 'number') {
             setRemainingTime(remainingTimeEvt);
         }
         const canSkipEvt = (window as any).canSkipWave;
         setCanSkipWave(!!canSkipEvt);
         setRangedWeaponState((window as any).currentRangedWeaponState ?? null);
     }, 100);
     return () => clearInterval(interval);
  }, []);

  const xpPercent = Math.min(100, Math.max(0, (runStats.xp / runStats.xpToNext) * 100));

  const toggleSettings = () => {
     const newPausedState = !isPaused;
     setIsPaused(newPausedState);
     setShowSettings(newPausedState);
  };

  const handleQuitClick = () => {
     setShowQuitConfirm(true);
  };

  const cancelQuit = () => {
     setShowQuitConfirm(false);
  };

  const confirmQuit = () => {
     setShowQuitConfirm(false);
     setShowSettings(false);
     setIsPaused(false);
     setStage(GameStage.HUB);
  };

  const hpPct = Math.max(0, playerHp.current / playerHp.max) * 100;
  const isHeavyHammer = selectedWeapons.melee === 'heavy_hammer';
  const meleeBaseDamage = selectedWeapons.melee === 'plasma_dagger' ? 1 : isHeavyHammer ? 20 : 15;
  const meleeBaseRange = selectedWeapons.melee === 'plasma_dagger' ? 5 : isHeavyHammer ? 10 : 10;
  const meleeAttackSpeedMod = selectedWeapons.melee === 'plasma_dagger' ? -0.1 : isHeavyHammer ? 0.4 : selectedWeapons.melee === 'sabre' ? 0.15 : 0;
  const attackRangeCap = selectedWeapons.melee === 'plasma_dagger' ? 80 : 100;
  const attackSpeedCap = selectedWeapons.melee === 'plasma_dagger' ? 0.3 : isHeavyHammer ? 0.9 : selectedWeapons.melee === 'sabre' ? 0.5 : 0.4;
  const speedCap = isHeavyHammer ? 250 : 350;
  const rawSpeed = 150 + upgrades.speed * 15 + runUpgrades.speed;
  const totalAttackCooldown = Math.max(attackSpeedCap, 0.7 + meleeAttackSpeedMod + runUpgrades.atkSpeed);
  const hammerOverflowDamage = isHeavyHammer ? Math.max(0, attackSpeedCap - (0.7 + meleeAttackSpeedMod + runUpgrades.atkSpeed)) * 100 : 0;
  const hammerSpeedOverflowDamage = isHeavyHammer ? Math.max(0, rawSpeed - speedCap) : 0;
  const totalAttackRange = Math.min(attackRangeCap, 50 + (upgrades.range || 0) * 4 + meleeBaseRange + (runUpgrades.atkRange || 0));
  const isHandCannon = selectedWeapons.ranged === 'hand_cannon' && !isHeavyHammer;
  const handCannonCharges = rangedWeaponState?.id === 'hand_cannon' ? rangedWeaponState.charges : 1;
  const handCannonMaxCharges = rangedWeaponState?.id === 'hand_cannon' ? rangedWeaponState.maxCharges : 5;
  const handCannonTimer = rangedWeaponState?.id === 'hand_cannon' ? rangedWeaponState.chargeTimer : 8;

  const formatTime = (timeInSeconds: number) => {
     const m = Math.floor(timeInSeconds / 60);
     const s = Math.floor(timeInSeconds % 60);
     return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
    <div style={inlineStyles} className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between font-sans">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
         <div className="bg-[var(--hud-bg-dark)]/80 border border-[var(--hud-border-color)] backdrop-blur-sm px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-xs uppercase tracking-wider">Time</span>
            <span className="text-xl font-mono font-bold text-white tracking-widest">{formatTime(remainingTime)}</span>
         </div>
         {canSkipWave && (
            <button 
               onClick={() => window.dispatchEvent(new Event('skip-stage'))}
               className="mt-2 bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-500/50 hover:border-indigo-400 backdrop-blur-md px-4 py-1.5 rounded shadow-[0_0_15px_rgba(99,102,241,0.3)] text-indigo-100 text-xs font-bold uppercase tracking-widest animate-pulse transition-all cursor-pointer pointer-events-auto"
            >
               Skip Wave [Y]
            </button>
         )}
      </div>
      {bossHp && (
         <div className="absolute top-24 left-1/2 -translate-x-1/2 w-96 flex flex-col items-center">
            <span className="text-[#F87171] font-black italic tracking-widest uppercase mb-1 drop-shadow-md">Boss</span>
            <div className="w-full bg-[var(--hud-bg-accent)] border-2 border-[var(--hud-border-color)] h-6 shrink-0 relative overflow-hidden rounded shadow-lg">
              <div className="h-full transition-all duration-100 ease-linear" style={{ width: `${Math.max(0, bossHp.current / bossHp.max) * 100}%`, backgroundColor: bossHp.color || '#E24B4A' }} />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white tracking-widest drop-shadow-md font-mono">
                {Math.ceil(bossHp.current)} / {bossHp.max}
              </div>
            </div>
         </div>
      )}
      <div className="p-4 flex justify-between items-start">
        <div className="flex flex-col gap-2">
           {!isSandbox && (
             <div className="text-2xl font-black italic tracking-tighter text-white drop-shadow-md">
               STAGE {runStats.level}
             </div>
           )}
           {isSandbox && (
             <div className="text-2xl font-black italic tracking-tighter text-emerald-400 drop-shadow-md">
               SANDBOX
             </div>
           )}

           {/* Player HP Bar */}
           <div className="w-64 bg-[var(--hud-bg-accent)] border-2 border-[var(--hud-border-color)] h-6 shrink-0 relative overflow-hidden rounded shadow-md pointer-events-auto">
             <div className="h-full bg-[#F87171] transition-all duration-100 ease-linear" style={{ width: `${hpPct}%` }} />
             <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white tracking-widest drop-shadow-md font-mono">
               HP {Math.ceil(playerHp.current)} / {playerHp.max}
             </div>
           </div>

           <div 
             className={`flex flex-col bg-[var(--hud-bg-dark)]/60 rounded font-mono text-slate-300 border border-[var(--hud-border-color)] shadow-sm max-w-max pointer-events-auto cursor-pointer select-none transition-all duration-200 ease-in-out ${statsExpanded ? 'p-3 text-sm gap-2' : 'p-2 text-xs grid grid-cols-1 gap-1'} hover:bg-[var(--hud-bg-accent)] hover:border-[#7C3AED]`}
             onMouseEnter={playHoverSfx}
             onClick={() => {
                playClickSfx();
                setStatsExpanded(prev => !prev);
             }}
           >
              <div>HP: {formatStat(100 + upgrades.health * 50 + runUpgrades.hp)} {statsExpanded ? <span className="text-slate-500">(base = 100, hub = +{upgrades.health * 50}) </span> : ''}<span className="text-blue-400">({runUpgrades.hp >= 0 ? '+' : ''}{formatStat(runUpgrades.hp)})</span></div>
              <div>Damage: {formatStat(10 + upgrades.damage * 5 + meleeBaseDamage + runUpgrades.damage + hammerOverflowDamage + hammerSpeedOverflowDamage)} {statsExpanded ? <span className="text-slate-500">(base = 10, hub = +{upgrades.damage * 5}, weapon = +{meleeBaseDamage}{hammerOverflowDamage + hammerSpeedOverflowDamage > 0 ? `, overflow = +${formatStat(hammerOverflowDamage + hammerSpeedOverflowDamage)}` : ''}) </span> : ''}<span className="text-red-400">({runUpgrades.damage >= 0 ? '+' : ''}{formatStat(runUpgrades.damage)})</span></div>
              <div>Speed: {formatStat(Math.min(speedCap, rawSpeed))} {statsExpanded ? <span className="text-slate-500">(base = 150, hub = +{upgrades.speed * 15}) </span> : ''}<span className="text-green-400">({runUpgrades.speed >= 0 ? '+' : ''}{formatStat(runUpgrades.speed)})</span>{rawSpeed >= speedCap ? ' [MAXED]' : ''}</div>
              <div>Atk Speed: {formatStat(totalAttackCooldown)}s {statsExpanded ? <span className="text-slate-500">(base = 0.7s, weapon = {meleeAttackSpeedMod >= 0 ? '+' : ''}{formatStat(meleeAttackSpeedMod)}s) </span> : ''}<span className="text-yellow-400">({runUpgrades.atkSpeed > 0 ? '+' : ''}{formatStat(runUpgrades.atkSpeed)}s)</span>{totalAttackCooldown <= attackSpeedCap ? ' [MAXED]' : ''}</div>
              <div>Melee Range: {formatStat(totalAttackRange)} {statsExpanded ? <span className="text-slate-500">(base = 50, hub = +{(upgrades.range || 0) * 4}, weapon = +{meleeBaseRange}) </span> : ''}<span className="text-purple-400">({(runUpgrades.atkRange || 0) >= 0 ? '+' : ''}{formatStat(runUpgrades.atkRange || 0)})</span>{totalAttackRange >= attackRangeCap ? ' [MAXED]' : ''}</div>
           </div>
        </div>
        
        <div className="text-right flex flex-col gap-2 items-end">
           <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded border border-yellow-500/50 font-bold shadow-md">
              {runStats.currencyEarned} Gold
           </div>
           
           <div className={isHeavyHammer ? "bg-[var(--hud-bg-dark)] text-[var(--hud-muted)] px-3 py-1 rounded border border-[var(--hud-muted)]/30 font-bold shadow-md flex items-center gap-1.5" : "bg-orange-500/20 text-orange-400 px-3 py-1 rounded border border-orange-500/50 font-bold shadow-md"}>
               {isHeavyHammer
                 ? (
                     <>
                        <Lock className="w-3.5 h-3.5 text-[var(--hud-muted)]" />
                        <span>Ranged Locked</span>
                     </>
                   )
                 : isHandCannon
                   ? `HC ${handCannonCharges}/${handCannonMaxCharges}${handCannonCharges < handCannonMaxCharges ? ` ${Math.ceil(handCannonTimer)}s` : ''}`
                   : `🏹 ${runStats.ammo ?? 20}`}
            </div>

           <button 
             onMouseEnter={playHoverSfx}
             onClick={() => { playClickSfx(); toggleSettings(); }}
             className="pointer-events-auto bg-[var(--hud-bg-dark)]/80 hover:bg-[var(--hud-bg-accent)] text-slate-300 border border-[var(--hud-border-color)] p-2 rounded shadow-md transition-colors"
           >
             <Pause className="w-5 h-5 fill-current" />
           </button>
        </div>
      </div>
      
      {/* Experience Bar at bottom center */}
      {!isSandbox && (
        <div className="w-full max-w-xl mx-auto mb-6 p-4 pointer-events-auto">
           <div className="h-6 w-full bg-[var(--hud-bg-dark)] rounded-full border border-[var(--hud-border-color)] shadow-lg relative overflow-hidden group">
              <div 
                 className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-200"
                 style={{ width: `${xpPercent}%` }}
              />
              <div className="absolute inset-0 flex justify-center items-center text-xs font-bold text-white drop-shadow-md tracking-wider">
                 <span>LVL {runStats.playerLevel ?? 1} — {Math.floor(runStats.xp)} / {runStats.xpToNext} XP</span>
              </div>
           </div>
        </div>
      )}
    </div>
    
    {(isPaused || showSettings) && (
       <div style={inlineStyles} className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto">
          {showQuitConfirm ? (
             <div className="bg-[var(--hud-bg-dark)] border border-[var(--hud-border-color)] p-8 rounded-xl shadow-2xl flex flex-col items-center max-w-sm text-center">
                <h2 className="text-[#F87171] text-2xl font-black italic mb-2 tracking-widest">GIVE UP?</h2>
                <p className="text-slate-400 font-mono mb-8 text-sm">All current run progress and temporary upgrades will be lost. Gold collected will be kept.</p>
                <div className="flex gap-4 w-full">
                   <button onMouseEnter={playHoverSfx} onClick={() => { playClickSfx(); cancelQuit(); }} className="flex-1 bg-[var(--hud-bg-accent)] hover:bg-[var(--hud-bg-accent)] text-white py-3 rounded-lg font-bold border border-[var(--hud-border-color)] transition">CANCEL</button>
                   <button onMouseEnter={playHoverSfx} onClick={() => { playClickSfx(); confirmQuit(); }} className="flex-1 bg-[#F87171] hover:bg-red-500 text-white py-3 rounded-lg font-bold border border-red-500 shadow-lg shadow-red-500/20 transition">QUIT</button>
                </div>
             </div>
          ) : showSettings ? (
             <div className="bg-[var(--hud-bg-dark)] border border-[var(--hud-border-color)] p-8 rounded-xl shadow-2xl flex flex-col min-w-[320px] max-w-sm">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-white text-2xl font-black italic tracking-widest uppercase">PAUSE</h2>
                   {/* button removed */}
                </div>
                
                <div className="flex flex-col gap-4 mb-8">
                   <div className="flex items-center justify-between text-slate-300 font-semibold text-sm">
                      <span>Damage Numbers</span>
                      <CustomCheckbox checked={settings.showDmgNotif} onChange={(checked) => updateSettings({ showDmgNotif: checked })} />
                   </div>
                   <div className="flex items-center justify-between text-slate-300 font-semibold text-sm">
                      <span>Item Drop Prompts</span>
                      <CustomCheckbox checked={settings.showDropNotif} onChange={(checked) => updateSettings({ showDropNotif: checked })} />
                   </div>
                   <div className="flex items-center justify-between text-slate-300 font-semibold text-sm">
                      <span>Auto Skip Wave</span>
                      <CustomCheckbox checked={settings.autoSkipWave} onChange={(checked) => updateSettings({ autoSkipWave: checked })} accent="emerald" />
                   </div>
                   <div className="flex items-center justify-between text-slate-300 font-semibold text-sm">
                      <span>Exp Gains</span>
                      <CustomCheckbox checked={settings.showExpNotif} onChange={(checked) => updateSettings({ showExpNotif: checked })} />
                   </div>
                 </div>

                <button onMouseEnter={playHoverSfx} onClick={() => { playClickSfx(); toggleSettings(); }} className="w-full bg-[#7C3AED] hover:opacity-80 text-white py-3 rounded-lg font-bold shadow-lg mb-4 transition uppercase tracking-widest text-sm">Resume</button>

                <button onMouseEnter={playHoverSfx} onClick={() => { playClickSfx(); setShowQuitConfirm(true); }} className="w-full bg-[#F87171]/20 hover:bg-[#F87171]/40 text-red-400 py-3 rounded-lg font-bold border border-[var(--hud-border-color)] transition uppercase tracking-widest text-sm">Return to Hub</button>
             </div>
          ) : (
             <div className="bg-[var(--hud-bg-dark)] border border-[var(--hud-border-color)] p-8 rounded-xl shadow-2xl flex flex-col items-center min-w-[300px]">
                <h2 className="text-white text-3xl font-black italic mb-8 tracking-widest uppercase">Paused</h2>
                <button onMouseEnter={playHoverSfx} onClick={() => { playClickSfx(); setIsPaused(false); }} className="w-full bg-[#7C3AED] hover:opacity-80 text-white py-3 rounded-lg font-bold shadow-lg mb-4 transition uppercase tracking-widest text-sm">Resume</button>
             </div>
          )}
       </div>
    )}
    </>
  );
}
