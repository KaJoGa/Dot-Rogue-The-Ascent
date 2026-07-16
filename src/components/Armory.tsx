import React from 'react';
import { motion } from 'motion/react';
import { playHoverSfx, playClickSfx } from '../game/audio';
import { useStore } from '../store';
import { Lock, ChevronsDown } from 'lucide-react';

// Define local theme colors to manage them cleanly in one place
const ARMORY_THEME = {
  primary: '#10b981',         // Main armory emerald green color
  primaryHover: '#34d399',    // Brighter version for active highlights
  bgDark: '#1F1830',          // Dark background base
  muted: '#6B6480',           // Muted greyish purple for locked elements
};

interface WeaponStats {
  name: string;
  type: 'Melee' | 'Ranged' | 'Locked';
  damage: string;
  range: string;
  speed: string;
  special: string;
  color: string;
}

const WEAPON_STATS_DATA: Record<string, WeaponStats> = {
  sabre: {
    name: 'A SABRE',
    type: 'Melee',
    damage: '15',
    range: 'Medium (70px)',
    speed: 'Fast (0.85s)',
    special: 'Fires dual swing paths when attack speed is capped.',
    color: '#10b981',
  },
  plasma_dagger: {
    name: 'PLASMA DAGGER',
    type: 'Melee',
    damage: '1 - 25',
    range: 'Short (35px)',
    speed: 'V. Fast (0.15s)',
    special: 'Agile Momentum (-0.5s dash CD). Weakpoint hits deal 1.9x critical damage.',
    color: '#34d399',
  },
  heavy_hammer: {
    name: 'HEAVY HAMMER',
    type: 'Melee',
    damage: '20',
    range: 'Medium (70px)',
    speed: 'Slow (1.2s)',
    special: 'Creates debris shockwave for AoE. Disables Ranged weapon equip.',
    color: '#f59e0b',
  },
  bow: {
    name: 'A BOW',
    type: 'Ranged',
    damage: '12',
    range: 'Long (350px)',
    speed: 'Medium (0.45s)',
    special: 'Rapid fire on hold. Consumes 1 Ammo per shot.',
    color: '#cbd5e1',
  },
  hand_cannon: {
    name: 'HAND CANNON',
    type: 'Ranged',
    damage: '50 - 500',
    range: 'Gigantic (500px)',
    speed: 'Charged (0.3s-1.5s)',
    special: 'Hold to charge. Multi-tier blasts deal extreme AoE damage but use up to 5 Ammo.',
    color: '#a78bfa',
  },
  akimbo: {
    name: 'AKIMBO',
    type: 'Locked',
    damage: '???',
    range: '???',
    speed: '???',
    special: 'Requires blueprint decryption. Locked.',
    color: '#6B6480',
  }
};

export default function Armory({ onClose }: { onClose: () => void }) {
    const { selectedWeapons, setSelectedWeapon } = useStore();
    const [hoveredWeapon, setHoveredWeapon] = React.useState<string | null>(null);
    const isHammerEquipped = selectedWeapons.melee === 'heavy_hammer';

    const selectMelee = (id: string) => {
        setSelectedWeapon('melee', id);
        if (id === 'heavy_hammer') {
            setSelectedWeapon('ranged', 'none');
        } else if (selectedWeapons.ranged === 'none') {
            setSelectedWeapon('ranged', 'bow');
        }
    };

    // Map theme colors to CSS variables so child elements can consume them in Tailwind
    const inlineStyles = {
      '--armory-primary': ARMORY_THEME.primary,
      '--armory-primary-hover': ARMORY_THEME.primaryHover,
      '--armory-bg-dark': ARMORY_THEME.bgDark,
      '--armory-muted': ARMORY_THEME.muted,
    } as React.CSSProperties;

    // Retrieve active loadout stats
    const meleeEquippedStats = WEAPON_STATS_DATA[selectedWeapons.melee] || WEAPON_STATS_DATA.sabre;
    const getRangedEquippedStats = () => {
      if (selectedWeapons.melee === 'heavy_hammer') {
        return {
          name: 'LOCKED',
          type: 'Locked' as const,
          damage: '0',
          range: 'None',
          speed: 'None',
          special: 'Disabled by Heavy Hammer. Equip Sabre or Plasma Dagger to unlock.',
          color: '#6B6480',
        };
      }
      return WEAPON_STATS_DATA[selectedWeapons.ranged] || WEAPON_STATS_DATA.bow;
    };
    const rangedEquippedStats = getRangedEquippedStats();

    // Hover logic
    const hoveredStats = hoveredWeapon ? WEAPON_STATS_DATA[hoveredWeapon] : null;
    const isMeleeHovered = hoveredWeapon === 'sabre' || hoveredWeapon === 'plasma_dagger' || hoveredWeapon === 'heavy_hammer';
    const isRangedHovered = hoveredWeapon === 'bow' || hoveredWeapon === 'hand_cannon' || hoveredWeapon === 'akimbo';
    const showComparison = hoveredWeapon && hoveredStats && (
      (isMeleeHovered && hoveredWeapon !== selectedWeapons.melee) ||
      (isRangedHovered && (selectedWeapons.melee === 'heavy_hammer' || hoveredWeapon !== selectedWeapons.ranged))
    );

    return (
        <>
            <motion.div 
               style={inlineStyles}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={onClose}
               className="absolute inset-0 z-40 bg-[var(--armory-bg-dark)]/80 backdrop-blur-sm cursor-pointer"
            />

            {/* FLOATING COMPARISON PANEL ON THE LEFT (Slide with the drawer) */}
            <motion.div
               style={inlineStyles}
               initial={{ opacity: 0, x: 30 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 30 }}
               transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.05 }}
               className="hidden lg:flex absolute right-[440px] top-1/2 -translate-y-1/2 z-50 flex-col gap-3 items-center w-[330px] pointer-events-none select-none"
            >
               {/* TOP CONTAINER: Equipped loadout (Always shown) */}
               <div className="w-full bg-slate-950/95 border border-[var(--armory-primary)]/40 p-5 rounded-lg shadow-[-20px_20px_40px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col gap-4 relative">
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[var(--armory-primary)]/50"></div>
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--armory-primary)]/50"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[var(--armory-primary)]/50"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[var(--armory-primary)]/50"></div>

                  <div className="flex justify-between items-center border-b border-[var(--armory-primary)]/20 pb-2">
                     <span className="text-[var(--armory-primary-hover)] font-mono text-[10px] font-black tracking-[0.25em] uppercase">ACTIVE LOADOUT</span>
                     <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">[EQUIPPED]</span>
                  </div>

                  <div className="flex flex-col gap-3">
                     {/* Melee Slot */}
                     <div className="bg-slate-900/40 p-3 rounded border border-slate-800/60 flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 tracking-wider">
                           <span>MELEE_SLOT</span>
                           <span className="text-[var(--armory-primary-hover)]">ACTIVE</span>
                        </div>
                        <div className="flex justify-between items-baseline mt-0.5">
                           <span className="text-white font-black uppercase text-xs tracking-wider">{meleeEquippedStats.name}</span>
                           <span className="text-[9px] font-mono text-emerald-400">DMG: {meleeEquippedStats.damage}</span>
                        </div>
                        <p className="text-[9px] font-mono text-slate-400 leading-tight mt-1">{meleeEquippedStats.special}</p>
                     </div>

                     {/* Ranged Slot */}
                     <div className={`p-3 rounded border flex flex-col gap-1 transition-all duration-300 ${selectedWeapons.melee === 'heavy_hammer' ? 'bg-slate-950/50 border-red-950/45 opacity-60' : 'bg-slate-900/40 border-slate-800/60'}`}>
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 tracking-wider">
                           <span>RANGED_SLOT</span>
                           {selectedWeapons.melee === 'heavy_hammer' ? (
                              <span className="text-red-400">DISABLED</span>
                           ) : (
                              <span className="text-[var(--armory-primary-hover)]">ACTIVE</span>
                           )}
                        </div>
                        <div className="flex justify-between items-baseline mt-0.5">
                           <span className="text-white font-black uppercase text-xs tracking-wider">{rangedEquippedStats.name}</span>
                           <span className="text-[9px] font-mono text-emerald-400">DMG: {rangedEquippedStats.damage}</span>
                        </div>
                        <p className="text-[9px] font-mono text-slate-400 leading-tight mt-1">{rangedEquippedStats.special}</p>
                     </div>
                  </div>
               </div>

               {/* MIDDLE INDICATOR: Chevron down (only shown when comparison is active) */}
               <div className={`transition-all duration-300 flex flex-col items-center justify-center ${showComparison ? 'opacity-100 scale-100 h-10' : 'opacity-0 scale-75 h-0 overflow-hidden'}`}>
                  <ChevronsDown className="w-8 h-8 text-[var(--armory-primary-hover)]/80 animate-bounce" style={{ filter: 'drop-shadow(0 0 6px var(--armory-primary))' }} />
               </div>

               {/* BOTTOM CONTAINER: Hovered stats comparison */}
               <div className={`w-full bg-slate-950/95 border border-[var(--armory-primary)]/40 p-5 rounded-lg shadow-[-20px_20px_40px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col gap-3 relative transition-all duration-300 ${showComparison ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none h-0 overflow-hidden py-0 border-none'}`}>
                  {showComparison && hoveredStats && (
                     <>
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[var(--armory-primary)]/50"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--armory-primary)]/50"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[var(--armory-primary)]/50"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[var(--armory-primary)]/50"></div>

                        <div className="flex justify-between items-center border-b border-[var(--armory-primary)]/20 pb-2">
                           <span className="text-amber-400 font-mono text-[10px] font-black tracking-[0.25em] uppercase">COMPARISON TARGET</span>
                           <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">[HOVERED]</span>
                        </div>

                        <div className="flex flex-col gap-2">
                           <div className="flex justify-between items-baseline">
                              <span className="text-white font-black uppercase text-base tracking-wide">{hoveredStats.name}</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                 {hoveredStats.type}
                              </span>
                           </div>

                           <div className="grid grid-cols-3 gap-2 mt-1">
                              <div className="bg-slate-900/60 p-2 rounded border border-slate-800/50 flex flex-col items-center">
                                 <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">DAMAGE</span>
                                 <span className="text-xs font-mono font-bold text-white mt-0.5">{hoveredStats.damage}</span>
                              </div>
                              <div className="bg-slate-900/60 p-2 rounded border border-slate-800/50 flex flex-col items-center">
                                 <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">RANGE</span>
                                 <span className="text-xs font-mono font-bold text-white mt-0.5 truncate max-w-full text-center">{hoveredStats.range.split(' ')[0]}</span>
                              </div>
                              <div className="bg-slate-900/60 p-2 rounded border border-slate-800/50 flex flex-col items-center">
                                 <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">SPEED</span>
                                 <span className="text-xs font-mono font-bold text-white mt-0.5 truncate max-w-full text-center">{hoveredStats.speed.split(' ')[0]}</span>
                              </div>
                           </div>

                           <div className="flex flex-col gap-1 mt-1 bg-slate-900/40 p-2.5 rounded border border-slate-800/30">
                              <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">SPECIAL CAPABILITY</span>
                              <span className="text-[10px] font-mono text-slate-300 leading-relaxed">{hoveredStats.special}</span>
                           </div>
                        </div>
                     </>
                  )}
               </div>
            </motion.div>
            
            <motion.div 
               style={inlineStyles}
               initial={{ opacity: 0, x: 50 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 50 }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="absolute right-0 top-0 bottom-0 w-[420px] z-50 bg-[var(--armory-bg-dark)]/95 border-l border-[var(--armory-primary)]/50 shadow-[-30px_0_60px_-10px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
            >
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to left, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

               <div className="relative z-10 flex flex-col h-full">
                  <div className="p-8 border-b border-[var(--armory-primary)]/20 bg-gradient-to-b from-[var(--armory-primary)]/10 to-transparent flex justify-between items-start">
                     <button 
                        onMouseEnter={playHoverSfx}
                        onClick={() => { playClickSfx(); onClose(); }}
                        className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer font-mono text-sm border border-slate-800 hover:border-red-400/50 px-2.5 py-1"
                      >
                        [ESC]
                      </button>
                     <div className="text-right">
                        <h2 className="text-2xl font-black uppercase tracking-[0.15em] text-white flex items-center justify-end gap-3 mb-2">
                           ARMORY <span className="text-[var(--armory-primary-hover)]" style={{ filter: 'drop-shadow(0 0 8px var(--armory-primary))' }}>⚔️</span>
                        </h2>
                        <div className="text-[10px] font-mono text-[var(--armory-primary-hover)]/80 tracking-[0.25em] uppercase border-r-2 border-[var(--armory-primary)]/50 pr-2">EQUIPMENT_LOADOUT</div>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-8">
                     {/* MELEE SELECTION */}
                     <div className="flex flex-col gap-4">
                        <h3 className="text-[var(--armory-primary)]/70 font-mono text-xs tracking-[0.2em] border-b border-[var(--armory-primary)]/30 pb-2">MELEE_WEAPON</h3>
                        <div className="flex flex-col gap-3">
                           <div 
                              onClick={() => { playClickSfx(); selectMelee('sabre'); }}
                              onMouseEnter={() => { playHoverSfx(); setHoveredWeapon('sabre'); }}
                              onMouseLeave={() => setHoveredWeapon(null)}
                              className={`p-4 border-l-2 cursor-pointer transition-all duration-300 relative overflow-hidden flex justify-between items-center group
                                ${selectedWeapons.melee === 'sabre' 
                                  ? 'bg-[var(--armory-primary)]/10 border-[var(--armory-primary)] shadow-[inset_0_0_20px_var(--armory-primary)]/10' 
                                  : 'bg-[var(--armory-bg-dark)] border-slate-800 hover:bg-[var(--armory-bg-dark)] hover:border-[var(--armory-primary)]/50'}`}
                           >
                              <div className="flex flex-col relative z-10">
                                 <span className={`font-black tracking-widest ${selectedWeapons.melee === 'sabre' ? 'text-[var(--armory-primary-hover)]' : 'text-slate-300'}`}>A SABRE</span>
                                 <span className="text-[10px] font-mono text-slate-500 mt-1">Just a regular Sabre... or is it?</span>
                              </div>
                              {selectedWeapons.melee === 'sabre' && (
                                 <span className="text-[var(--armory-primary-hover)] text-[10px] font-mono tracking-widest animate-pulse relative z-10">[EQUIPPED]</span>
                              )}
                           </div>

                           <div 
                              onClick={() => { playClickSfx(); selectMelee('plasma_dagger'); }}
                              onMouseEnter={() => { playHoverSfx(); setHoveredWeapon('plasma_dagger'); }}
                              onMouseLeave={() => setHoveredWeapon(null)}
                              className={`p-4 border-l-2 cursor-pointer transition-all duration-300 relative overflow-hidden flex justify-between items-center group
                                ${selectedWeapons.melee === 'plasma_dagger' 
                                  ? 'bg-[var(--armory-primary)]/10 border-[var(--armory-primary)] shadow-[inset_0_0_20px_var(--armory-primary)]/10' 
                                  : 'bg-[var(--armory-bg-dark)] border-slate-800 hover:bg-[var(--armory-bg-dark)] hover:border-[var(--armory-primary)]/50'}`}
                           >
                              <div className="flex flex-col relative z-10">
                                 <span className={`font-black tracking-widest ${selectedWeapons.melee === 'plasma_dagger' ? 'text-[var(--armory-primary-hover)]' : 'text-slate-300'}`}>PLASMA DAGGER</span>
                                 <span className="text-[10px] font-mono text-slate-500 mt-1">High-tech surgical stabs.</span>
                              </div>
                              {selectedWeapons.melee === 'plasma_dagger' && (
                                 <span className="text-[var(--armory-primary-hover)] text-[10px] font-mono tracking-widest animate-pulse relative z-10">[EQUIPPED]</span>
                              )}
                           </div>
                           
                           <div 
                              onClick={() => { playClickSfx(); selectMelee('heavy_hammer'); }}
                              onMouseEnter={() => { playHoverSfx(); setHoveredWeapon('heavy_hammer'); }}
                              onMouseLeave={() => setHoveredWeapon(null)}
                              className={`p-4 border-l-2 cursor-pointer transition-all duration-300 relative overflow-hidden flex justify-between items-center group
                                ${selectedWeapons.melee === 'heavy_hammer' 
                                  ? 'bg-[var(--armory-primary)]/10 border-[var(--armory-primary)] shadow-[inset_0_0_20px_var(--armory-primary)]/10' 
                                  : 'bg-[var(--armory-bg-dark)] border-slate-800 hover:bg-[var(--armory-bg-dark)] hover:border-[var(--armory-primary)]/50'}`}
                           >
                              <div className="flex flex-col relative z-10">
                                 <span className={`font-black tracking-widest ${selectedWeapons.melee === 'heavy_hammer' ? 'text-[var(--armory-primary-hover)]' : 'text-slate-300'}`}>HEAVY HAMMER</span>
                                 <span className="text-[10px] font-mono text-slate-500 mt-1">Slow AoE smash. Locks ranged weapons.</span>
                              </div>
                              {selectedWeapons.melee === 'heavy_hammer' && (
                                 <span className="text-[var(--armory-primary-hover)] text-[10px] font-mono tracking-widest animate-pulse relative z-10">[EQUIPPED]</span>
                              )}
                           </div>
                        </div>
                     </div>

                     {/* RANGED SELECTION */}
                     <div className="flex flex-col gap-4">
                        <h3 className="text-[var(--armory-primary)]/70 font-mono text-xs tracking-[0.2em] border-b border-[var(--armory-primary)]/30 pb-2">RANGED_WEAPON</h3>
                        <div className="flex flex-col gap-3">
                           <div 
                              onClick={() => { if (!isHammerEquipped) { playClickSfx(); setSelectedWeapon('ranged', 'bow'); } }}
                              onMouseEnter={() => { 
                                if (!isHammerEquipped) {
                                  playHoverSfx(); 
                                  setHoveredWeapon('bow');
                                }
                              }}
                              onMouseLeave={() => setHoveredWeapon(null)}
                              className={`p-4 border-l-2 transition-all duration-300 relative overflow-hidden flex justify-between items-center group
                                ${isHammerEquipped
                                  ? 'bg-[var(--armory-bg-dark)]/80 border-slate-800 opacity-50 grayscale cursor-not-allowed'
                                  : selectedWeapons.ranged === 'bow' 
                                  ? 'bg-[var(--armory-primary)]/10 border-[var(--armory-primary)] shadow-[inset_0_0_20px_var(--armory-primary)]/10' 
                                  : 'bg-[var(--armory-bg-dark)] border-slate-800 hover:bg-[var(--armory-bg-dark)] hover:border-[var(--armory-primary)]/50 cursor-pointer'}`}
                           >
                              <div className="flex flex-col relative z-10">
                                 <span className={`font-black tracking-widest ${selectedWeapons.ranged === 'bow' && !isHammerEquipped ? 'text-[var(--armory-primary-hover)]' : 'text-slate-300'}`}>A BOW</span>
                                 <span className="text-[10px] font-mono text-slate-500 mt-1">{isHammerEquipped ? 'Locked by Heavy Hammer.' : 'Regular bow.'}</span>
                              </div>
                              {selectedWeapons.ranged === 'bow' && !isHammerEquipped && (
                                 <span className="text-[var(--armory-primary-hover)] text-[10px] font-mono tracking-widest animate-pulse relative z-10">[EQUIPPED]</span>
                              )}
                           </div>

                           <div 
                              onClick={() => { if (!isHammerEquipped) { playClickSfx(); setSelectedWeapon('ranged', 'hand_cannon'); } }}
                              onMouseEnter={() => { 
                                if (!isHammerEquipped) {
                                  playHoverSfx(); 
                                  setHoveredWeapon('hand_cannon');
                                }
                              }}
                              onMouseLeave={() => setHoveredWeapon(null)}
                              className={`p-4 border-l-2 transition-all duration-300 relative overflow-hidden flex justify-between items-center group
                                ${isHammerEquipped
                                  ? 'bg-[var(--armory-bg-dark)]/80 border-slate-800 opacity-50 grayscale cursor-not-allowed'
                                  : selectedWeapons.ranged === 'hand_cannon'
                                  ? 'bg-[var(--armory-primary)]/10 border-[var(--armory-primary)] shadow-[inset_0_0_20px_var(--armory-primary)]/10'
                                  : 'bg-[var(--armory-bg-dark)] border-slate-800 hover:bg-[var(--armory-bg-dark)] hover:border-[var(--armory-primary)]/50 cursor-pointer'}`}
                           >
                              <div className="flex flex-col relative z-10">
                                 <span className={`font-black tracking-widest ${selectedWeapons.ranged === 'hand_cannon' && !isHammerEquipped ? 'text-[var(--armory-primary-hover)]' : 'text-slate-300'}`}>HAND CANNON</span>
                                 <span className="text-[10px] font-mono text-slate-500 mt-1">{isHammerEquipped ? 'Locked by Heavy Hammer.' : 'Rechargeable energy cannon.'}</span>
                              </div>
                              {selectedWeapons.ranged === 'hand_cannon' && !isHammerEquipped && (
                                 <span className="text-[var(--armory-primary-hover)] text-[10px] font-mono tracking-widest animate-pulse relative z-10">[EQUIPPED]</span>
                              )}
                           </div>
                           
                           <div 
                              onMouseEnter={() => { playHoverSfx(); setHoveredWeapon('akimbo'); }}
                              onMouseLeave={() => setHoveredWeapon(null)}
                              className="p-4 border-l-2 border-[var(--armory-muted)]/30 bg-[var(--armory-bg-dark)]/80 flex justify-between items-center cursor-not-allowed"
                           >
                               <div className="flex flex-col">
                                  <span className="font-black tracking-widest text-[var(--armory-muted)]">AKIMBO</span>
                                  <span className="text-[10px] font-mono text-[var(--armory-muted)]/80 mt-1">Requires Blueprint [LOCKED]</span>
                               </div>
                               <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--armory-muted)]/10 border border-[var(--armory-muted)]/30 rounded text-[var(--armory-muted)] text-[10px] font-mono tracking-widest">
                                  <Lock className="w-3 h-3 text-[var(--armory-muted)]" />
                                  <span>LOCKED</span>
                                </div>
                             </div>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
        </>
    );
}
