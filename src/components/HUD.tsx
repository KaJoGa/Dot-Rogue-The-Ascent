import React, { useState, useEffect } from 'react';
import { useStore, GameStage } from '../store';
import { Pause, Lock, Volume1, Volume2 } from 'lucide-react';
import { playHoverSfx, playClickSfx } from '../game/audio';
import { RangedWeaponState } from '../game/types';

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
  const { stage, runStats, upgrades, runUpgrades, selectedWeapons, isPaused, setIsPaused, setStage, settings, updateSettings, isSandbox } = useStore();
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

  const [playerHp, setPlayerHp] = useState({ current: 0, max: 100 });
  const [bossHp, setBossHp] = useState<{ current: number, max: number, color?: string } | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [canSkipWave, setCanSkipWave] = useState<boolean>(false);
  const [showWaveSkipped, setShowWaveSkipped] = useState<boolean>(false);
  const [rangedWeaponState, setRangedWeaponState] = useState<RangedWeaponState | null>(null);

  const triggerSkipWave = () => {
     playClickSfx();
     setCanSkipWave(false);
     window.dispatchEvent(new Event('skip-stage'));
  };

  useEffect(() => {
     let timer: ReturnType<typeof setTimeout> | null = null;
     const handleWaveSkipped = () => {
        setShowWaveSkipped(true);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
           setShowWaveSkipped(false);
        }, 2000);
     };

     window.addEventListener('wave-skipped', handleWaveSkipped);
     return () => {
        window.removeEventListener('wave-skipped', handleWaveSkipped);
        if (timer) clearTimeout(timer);
     };
  }, []);

  useEffect(() => {
     if (stage !== GameStage.PLAYING) {
        setShowWaveSkipped(false);
     }
  }, [stage]);

  useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
        if (stage !== GameStage.PLAYING) return;
        if (e.key === 'Escape') {
           if (showQuitConfirm) setShowQuitConfirm(false);
           else {
               const newPausedState = !isPaused;
               setIsPaused(newPausedState);
               setShowSettings(newPausedState);
           }
        } else if (e.key.toLowerCase() === 'e' && canSkipWave && !isPaused && !showWaveSkipped) {
           if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
           triggerSkipWave();
        }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, isPaused, showSettings, showQuitConfirm, canSkipWave, showWaveSkipped, setIsPaused]);

  useEffect(() => {
     const interval = setInterval(() => {
         const hpEvt = window.currentPlayerHp;
         if (hpEvt) {
             setPlayerHp(hpEvt);
         }
         const bossHpEvt = window.currentBossHp;
         if (bossHpEvt) {
             setBossHp(bossHpEvt);
         } else {
             setBossHp(null);
         }
         const remainingTimeEvt = window.currentStageTimeRemaining;
         if (typeof remainingTimeEvt === 'number') {
             setRemainingTime(remainingTimeEvt);
         }
         const canSkipEvt = window.canSkipWave;
         setCanSkipWave(!!canSkipEvt);
         setRangedWeaponState(window.currentRangedWeaponState ?? null);
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
         {/* Wave Skip Container */}
         {canSkipWave && !showWaveSkipped && (
            <div className="mt-2 bg-[var(--hud-bg-dark)]/90 border border-indigo-500/40 backdrop-blur-md px-4 py-2 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col items-center gap-1.5 pointer-events-auto select-none">
               <span className="text-xs font-bold text-white tracking-wider">Skip Wave?</span>
               <button 
                  type="button"
                  onClick={triggerSkipWave}
                  onMouseEnter={() => playHoverSfx()}
                  className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 border border-indigo-400/50 hover:border-indigo-300 px-4 py-1 rounded-lg text-white text-xs font-bold uppercase tracking-widest shadow-[0_0_12px_rgba(99,102,241,0.3)] transition-all cursor-pointer pointer-events-auto"
               >
                  Yes [e]
               </button>
               <span className="text-[10px] text-white/50 tracking-normal">
                  Auto skip can be toggled in settings
               </span>
            </div>
         )}

         {/* Wave Skipped Notification in same position */}
         {showWaveSkipped && (
            <div className="mt-2 bg-[var(--hud-bg-dark)]/90 border border-emerald-500/50 backdrop-blur-md px-5 py-2.5 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.3)] flex items-center justify-center pointer-events-none select-none">
               <span className="text-xs font-black text-emerald-400 uppercase tracking-widest animate-pulse">
                  Wave Skipped!
               </span>
            </div>
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
                            <div className="flex flex-col gap-4 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
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
                   
                   <div className="mt-2 pt-4 border-t border-slate-800 flex flex-col gap-4 w-full">
                     <span className="tracking-widest capitalize text-[11px] text-slate-500 font-bold font-mono">Audio Volume</span>
                     
                     <div className="flex flex-col gap-1.5 group/slider font-mono w-full">
                       <div className="flex justify-between items-center text-slate-300 group-hover/slider:text-white text-xs">
                         <span className="tracking-widest capitalize">BGM Volume</span>
                         <span className="font-bold text-indigo-400">{settings.bgmVolume ?? 50}%</span>
                       </div>
                       <div className="flex items-center gap-3">
                         <Volume1 className="w-4 h-4 text-slate-500 shrink-0" />
                         <input 
                           type="range"
                           min="0"
                           max="100"
                           value={settings.bgmVolume ?? 50}
                           onChange={(e) => updateSettings({ bgmVolume: Number(e.target.value) })}
                           className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded cursor-pointer appearance-none outline-none"
                           style={{
                             background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${settings.bgmVolume ?? 50}%, #1e293b ${settings.bgmVolume ?? 50}%, #1e293b 100%)`
                           }}
                         />
                         <Volume2 className="w-4 h-4 text-slate-500 shrink-0" />
                       </div>
                     </div>

                     <div className="flex flex-col gap-1.5 group/slider font-mono w-full">
                       <div className="flex justify-between items-center text-slate-300 group-hover/slider:text-white text-xs">
                         <span className="tracking-widest capitalize">UI SFX Volume</span>
                         <span className="font-bold text-indigo-400">{settings.uiSfxVolume ?? 100}%</span>
                       </div>
                       <div className="flex items-center gap-3">
                         <Volume1 className="w-4 h-4 text-slate-500 shrink-0" />
                         <input 
                           type="range"
                           min="0"
                           max="100"
                           value={settings.uiSfxVolume ?? 100}
                           onChange={(e) => updateSettings({ uiSfxVolume: Number(e.target.value) })}
                           className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded cursor-pointer appearance-none outline-none"
                           style={{
                             background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${settings.uiSfxVolume ?? 100}%, #1e293b ${settings.uiSfxVolume ?? 100}%, #1e293b 100%)`
                           }}
                         />
                         <Volume2 className="w-4 h-4 text-slate-500 shrink-0" />
                       </div>
                     </div>

                     <div className="flex flex-col gap-1.5 group/slider font-mono w-full">
                       <div className="flex justify-between items-center text-slate-300 group-hover/slider:text-white text-xs">
                         <span className="tracking-widest capitalize">Gameplay SFX Volume</span>
                         <span className="font-bold text-indigo-400">{settings.gameplaySfxVolume ?? 100}%</span>
                       </div>
                       <div className="flex items-center gap-3">
                         <Volume1 className="w-4 h-4 text-slate-500 shrink-0" />
                         <input 
                           type="range"
                           min="0"
                           max="100"
                           value={settings.gameplaySfxVolume ?? 100}
                           onChange={(e) => updateSettings({ gameplaySfxVolume: Number(e.target.value) })}
                           className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded cursor-pointer appearance-none outline-none"
                           style={{
                             background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${settings.gameplaySfxVolume ?? 100}%, #1e293b ${settings.gameplaySfxVolume ?? 100}%, #1e293b 100%)`
                           }}
                         />
                         <Volume2 className="w-4 h-4 text-slate-500 shrink-0" />
                       </div>
                     </div>
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
