import React from 'react';
import { motion } from 'motion/react';
import { playHoverSfx, playClickSfx } from '../game/audio';
import { useStore } from '../store';

const statConfig = [
  { id: 'health', label: 'HP', baseCost: 3, mult: 1.8, maxLevel: 10, icon: '❤️', effect: '+50 Max HP' },
  { id: 'damage', label: 'Damage', baseCost: 3, mult: 1.8, maxLevel: 10, icon: '⚔️', effect: '+5 Damage' },
  { id: 'range', label: 'Range', baseCost: 30, mult: 1.8, maxLevel: 5, icon: '🎯', effect: '+4 Attack Range' },
  { id: 'speed', label: 'M.Speed', baseCost: 20, mult: 1.8, maxLevel: 5, icon: '⚡', effect: '+15 Movement Speed' }
];

export default function SoulForge({ onClose }: { onClose: () => void }) {
    const { upgrades, upgradeStat } = useStore();

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
               initial={{ opacity: 0, x: -50 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -50 }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="absolute left-0 top-0 bottom-0 w-[420px] z-50 bg-[#07070b]/95 border-r border-indigo-500/50 shadow-[30px_0_60px_-10px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
            >
               {/* Internal grid overlay */}
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

               <div className="relative z-10 flex flex-col h-full">
                  <div className="p-8 border-b border-indigo-900/40 bg-gradient-to-b from-indigo-950/20 to-transparent flex justify-between items-start">
                     <div>
                        <h2 className="text-2xl font-black uppercase tracking-[0.15em] text-white flex items-center gap-3 mb-2">
                           <span className="text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]">⚒️</span> SOUL FORGE
                        </h2>
                        <div className="text-[10px] font-mono text-indigo-400/80 tracking-[0.25em] uppercase border-l-2 border-indigo-500/50 pl-2">UPGRADE_MODULES</div>
                     </div>
                     <button 
                       onClick={onClose}
                       className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer font-mono text-sm border border-slate-800 hover:border-red-400/50 px-2.5 py-1"
                     >
                       [ESC]
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                     {statConfig.map((stat, idx) => {
                        const level = upgrades[stat.id as keyof typeof upgrades];
                        const isMaxed = level >= stat.maxLevel;
                        const cost = Math.floor(stat.baseCost * Math.pow(stat.mult, level));
                        const canAfford = !isMaxed && upgrades.currency >= cost;

                        return (
                           <motion.div 
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: idx * 0.05 }}
                             key={stat.id} 
                             className={`relative p-5 flex flex-col gap-4 group transition-all duration-300
                              ${isMaxed ? 'bg-[#050B14] border-l-2 border-cyan-500/70' 
                                : canAfford ? 'bg-[#0a0a0f] border-l-2 border-indigo-500/70 hover:bg-[#0c0c16] hover:translate-x-1' 
                                : 'bg-[#050508]/90 border-l-2 border-slate-800 grayscale-[40%]'}`}
                           >
                              {/* Inner glow edge */}
                              {canAfford && !isMaxed && <div className="absolute inset-0 opacity-0 group-hover:opacity-100 shadow-[inset_0_0_25px_rgba(99,102,241,0.15)] transition-opacity pointer-events-none" />}

                              <div className="relative flex justify-between items-start">
                                 <div className="flex flex-col gap-1">
                                    <h3 className={`font-black text-sm tracking-[0.15em] uppercase ${isMaxed ? 'text-cyan-50' : 'text-slate-200'} drop-shadow-sm`}>{stat.label}</h3>
                                    <div className={`text-[10px] font-mono tracking-widest mt-1 ${isMaxed ? 'text-cyan-400/80' : 'text-slate-500'}`}>EFFECT: {stat.effect}</div>
                                 </div>
                                 
                                 {isMaxed ? (
                                    <div className="px-3 py-1.5 bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono tracking-[0.2em] relative overflow-hidden shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                                      <div className="absolute inset-0 bg-cyan-400/20 animate-pulse" />
                                      <span className="relative z-10">[MAXED]</span>
                                    </div>
                                 ) : (
                                    <button 
                                      onMouseEnter={() => playHoverSfx()}
                                      onClick={() => {
                                        playClickSfx();
                                        upgradeStat(stat.id as any, cost);
                                      }}
                                      disabled={!canAfford}
                                      className={`px-3 py-2 text-[10px] font-mono tracking-[0.15em] transition-all cursor-pointer border flex flex-col items-center gap-1 min-w-[90px]
                                       ${canAfford ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.15)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                                       : 'bg-transparent border-amber-900/30 text-amber-600/80 cursor-not-allowed drop-shadow-[0_0_8px_rgba(180,83,9,0.2)]'}`}
                                    >
                                      {!canAfford && <span className="text-[12px] opacity-70">🔒</span>}
                                      <span>{cost} 🟡</span>
                                    </button>
                                 )}
                              </div>

                              {/* Segmented Energy Pips */}
                              <div className="flex gap-[3px] w-full pt-2 border-t border-slate-800/50 z-10 mt-1">
                                 {Array.from({ length: stat.maxLevel }).map((_, i) => (
                                    <div 
                                       key={i} 
                                       className={`flex-1 h-1.5 skew-x-[-20deg] transition-all duration-300 ${i < level 
                                         ? (isMaxed ? 'bg-cyan-400 shadow-[0_0_8px_theme(colors.cyan.400)]' : 'bg-indigo-500 shadow-[0_0_8px_theme(colors.indigo.500)]') 
                                         : 'bg-slate-900 border border-slate-800/50'}`} 
                                    />
                                 ))}
                              </div>
                           </motion.div>
                        );
                     })}
                  </div>
               </div>
            </motion.div>
        </>
    );
}
