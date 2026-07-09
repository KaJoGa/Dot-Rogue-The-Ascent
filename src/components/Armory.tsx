import React from 'react';
import { motion } from 'motion/react';
import { playHoverSfx, playClickSfx } from '../game/audio';
import { useStore } from '../store';

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

    return (
        <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={onClose}
               className="absolute inset-0 z-40 bg-[#050508]/80 backdrop-blur-md cursor-pointer"
            />
            
            <motion.div 
               initial={{ opacity: 0, x: 50 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 50 }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="absolute right-0 top-0 bottom-0 w-[420px] z-50 bg-[#07070b]/95 border-l border-emerald-500/50 shadow-[-30px_0_60px_-10px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
            >
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to left, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

               <div className="relative z-10 flex flex-col h-full">
                  <div className="p-8 border-b border-emerald-900/40 bg-gradient-to-b from-emerald-950/20 to-transparent flex justify-between items-start">
                     <button 
                       onClick={onClose}
                       className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer font-mono text-sm border border-slate-800 hover:border-red-400/50 px-2.5 py-1"
                     >
                       [ESC]
                     </button>
                     <div className="text-right">
                        <h2 className="text-2xl font-black uppercase tracking-[0.15em] text-white flex items-center justify-end gap-3 mb-2">
                           ARMORY <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">⚔️</span>
                        </h2>
                        <div className="text-[10px] font-mono text-emerald-400/80 tracking-[0.25em] uppercase border-r-2 border-emerald-500/50 pr-2">EQUIPMENT_LOADOUT</div>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
                     {/* MELEE SELECTION */}
                     <div className="flex flex-col gap-4">
                        <h3 className="text-emerald-500/70 font-mono text-xs tracking-[0.2em] border-b border-emerald-900/30 pb-2">MELEE_WEAPON</h3>
                        <div className="flex flex-col gap-3">
                           <div 
                              onClick={() => { playClickSfx(); selectMelee('sabre'); }}
                              className={`p-4 border-l-2 cursor-pointer transition-all duration-300 relative overflow-hidden flex justify-between items-center group
                                ${selectedWeapons.melee === 'sabre' 
                                  ? 'bg-emerald-950/40 border-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' 
                                  : 'bg-[#0a0a0f] border-slate-800 hover:bg-[#0c0c16] hover:border-emerald-500/50'}`}
                           >
                              <div className="flex flex-col relative z-10">
                                 <span className={`font-black tracking-widest ${selectedWeapons.melee === 'sabre' ? 'text-emerald-400' : 'text-slate-300'}`}>A SABRE</span>
                                 <span className="text-[10px] font-mono text-slate-500 mt-1">Just a regular Sabre... or is it?</span>
                              </div>
                              {selectedWeapons.melee === 'sabre' && (
                                 <span className="text-emerald-400 text-[10px] font-mono tracking-widest animate-pulse relative z-10">[EQUIPPED]</span>
                              )}
                           </div>

                           <div 
                              onClick={() => { playClickSfx(); selectMelee('plasma_dagger'); }}
                              className={`p-4 border-l-2 cursor-pointer transition-all duration-300 relative overflow-hidden flex justify-between items-center group
                                ${selectedWeapons.melee === 'plasma_dagger' 
                                  ? 'bg-emerald-950/40 border-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' 
                                  : 'bg-[#0a0a0f] border-slate-800 hover:bg-[#0c0c16] hover:border-emerald-500/50'}`}
                           >
                              <div className="flex flex-col relative z-10">
                                 <span className={`font-black tracking-widest ${selectedWeapons.melee === 'plasma_dagger' ? 'text-emerald-400' : 'text-slate-300'}`}>PLASMA DAGGER</span>
                                 <span className="text-[10px] font-mono text-slate-500 mt-1">High-tech surgical stabs.</span>
                              </div>
                              {selectedWeapons.melee === 'plasma_dagger' && (
                                 <span className="text-emerald-400 text-[10px] font-mono tracking-widest animate-pulse relative z-10">[EQUIPPED]</span>
                              )}
                           </div>
                           
                           <div 
                              onClick={() => { playClickSfx(); selectMelee('heavy_hammer'); }}
                              className={`p-4 border-l-2 cursor-pointer transition-all duration-300 relative overflow-hidden flex justify-between items-center group
                                ${selectedWeapons.melee === 'heavy_hammer' 
                                  ? 'bg-emerald-950/40 border-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' 
                                  : 'bg-[#0a0a0f] border-slate-800 hover:bg-[#0c0c16] hover:border-emerald-500/50'}`}
                           >
                              <div className="flex flex-col relative z-10">
                                 <span className={`font-black tracking-widest ${selectedWeapons.melee === 'heavy_hammer' ? 'text-emerald-400' : 'text-slate-300'}`}>HEAVY HAMMER</span>
                                 <span className="text-[10px] font-mono text-slate-500 mt-1">Slow AoE smash. Locks ranged weapons.</span>
                              </div>
                              {selectedWeapons.melee === 'heavy_hammer' && (
                                 <span className="text-emerald-400 text-[10px] font-mono tracking-widest animate-pulse relative z-10">[EQUIPPED]</span>
                              )}
                           </div>
                        </div>
                     </div>

                     {/* RANGED SELECTION */}
                     <div className="flex flex-col gap-4">
                        <h3 className="text-emerald-500/70 font-mono text-xs tracking-[0.2em] border-b border-emerald-900/30 pb-2">RANGED_WEAPON</h3>
                        <div className="flex flex-col gap-3">
                           <div 
                              onClick={() => { if (!isHammerEquipped) { playClickSfx(); setSelectedWeapon('ranged', 'bow'); } }}
                              className={`p-4 border-l-2 transition-all duration-300 relative overflow-hidden flex justify-between items-center group
                                ${isHammerEquipped
                                  ? 'bg-[#050508]/80 border-slate-800 opacity-50 grayscale cursor-not-allowed'
                                  : selectedWeapons.ranged === 'bow' 
                                  ? 'bg-emerald-950/40 border-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' 
                                  : 'bg-[#0a0a0f] border-slate-800 hover:bg-[#0c0c16] hover:border-emerald-500/50 cursor-pointer'}`}
                           >
                              <div className="flex flex-col relative z-10">
                                 <span className={`font-black tracking-widest ${selectedWeapons.ranged === 'bow' && !isHammerEquipped ? 'text-emerald-400' : 'text-slate-300'}`}>A BOW</span>
                                 <span className="text-[10px] font-mono text-slate-500 mt-1">{isHammerEquipped ? 'Locked by Heavy Hammer.' : 'Regular bow.'}</span>
                              </div>
                              {selectedWeapons.ranged === 'bow' && !isHammerEquipped && (
                                 <span className="text-emerald-400 text-[10px] font-mono tracking-widest animate-pulse relative z-10">[EQUIPPED]</span>
                              )}
                           </div>

                           <div 
                              onClick={() => { if (!isHammerEquipped) { playClickSfx(); setSelectedWeapon('ranged', 'hand_cannon'); } }}
                              className={`p-4 border-l-2 transition-all duration-300 relative overflow-hidden flex justify-between items-center group
                                ${isHammerEquipped
                                  ? 'bg-[#050508]/80 border-slate-800 opacity-50 grayscale cursor-not-allowed'
                                  : selectedWeapons.ranged === 'hand_cannon'
                                  ? 'bg-emerald-950/40 border-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]'
                                  : 'bg-[#0a0a0f] border-slate-800 hover:bg-[#0c0c16] hover:border-emerald-500/50 cursor-pointer'}`}
                           >
                              <div className="flex flex-col relative z-10">
                                 <span className={`font-black tracking-widest ${selectedWeapons.ranged === 'hand_cannon' && !isHammerEquipped ? 'text-emerald-400' : 'text-slate-300'}`}>HAND CANNON</span>
                                 <span className="text-[10px] font-mono text-slate-500 mt-1">{isHammerEquipped ? 'Locked by Heavy Hammer.' : 'Rechargeable energy cannon.'}</span>
                              </div>
                              {selectedWeapons.ranged === 'hand_cannon' && !isHammerEquipped && (
                                 <span className="text-emerald-400 text-[10px] font-mono tracking-widest animate-pulse relative z-10">[EQUIPPED]</span>
                              )}
                           </div>
                           
                           <div className="p-4 border-l-2 border-slate-800 bg-[#050508]/80 opacity-50 grayscale flex justify-between items-center cursor-not-allowed">
                              <div className="flex flex-col">
                                 <span className="font-black tracking-widest text-slate-500">AKIMBO</span>
                                 <span className="text-[10px] font-mono text-slate-600 mt-1">Requires Blueprint [LOCKED]</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-600 tracking-widest">LOCKED</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
        </>
    );
}
