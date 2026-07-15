import React from 'react';
import { motion } from 'motion/react';
import { playHoverSfx, playClickSfx } from '../game/audio';
import { useStore } from '../store';
import { Lock } from 'lucide-react';

// Define local theme colors to manage them cleanly in one place
const ARMORY_THEME = {
  primary: '#10b981',         // Main armory emerald green color
  primaryHover: '#34d399',    // Brighter version for active highlights
  bgDark: '#1F1830',          // Dark background base
  muted: '#6B6480',           // Muted greyish purple for locked elements
};

export default function Armory({ onClose }: { onClose: () => void }) {
    const { selectedWeapons, setSelectedWeapon } = useStore();
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
                              onMouseEnter={() => playHoverSfx()}
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
                              onMouseEnter={() => playHoverSfx()}
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
                              onMouseEnter={() => playHoverSfx()}
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
                              onMouseEnter={() => { if (!isHammerEquipped) playHoverSfx(); }}
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
                              onMouseEnter={() => { if (!isHammerEquipped) playHoverSfx(); }}
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
                           
                           <div className="p-4 border-l-2 border-[var(--armory-muted)]/30 bg-[var(--armory-bg-dark)]/80 flex justify-between items-center cursor-not-allowed">
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
