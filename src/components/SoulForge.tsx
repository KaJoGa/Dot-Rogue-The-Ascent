import React from 'react';
import { motion } from 'motion/react';
import { playHoverSfx, playClickSfx } from '../game/audio';
import { useStore } from '../store';
import { Lock } from 'lucide-react';

const statConfig = [
  { id: 'health', label: 'HP', baseCost: 3, mult: 1.8, maxLevel: 10, icon: '❤️', effect: '+50 Max HP' },
  { id: 'damage', label: 'Damage', baseCost: 3, mult: 1.8, maxLevel: 10, icon: '⚔️', effect: '+5 Damage' },
  { id: 'range', label: 'Range', baseCost: 30, mult: 1.8, maxLevel: 5, icon: '🎯', effect: '+4 Attack Range' },
  { id: 'speed', label: 'M.Speed', baseCost: 20, mult: 1.8, maxLevel: 5, icon: '⚡', effect: '+15 Movement Speed' }
];

// Define local theme colors to manage them cleanly in one place
export const FORGE_THEME = {
  primary: '#e7e716',         // Main color
  primaryHover: '#a3a33e',    // For active hovers
  bgDark: '#1F1830',          // Background base
  muted: '#6B6480',           // Locked elements
  accentText: '#d2d28a',      
};

// Helper to convert hex to rgba
function getRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  let r = 140, g = 140, b = 52;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function SoulForge({ onClose }: { onClose: () => void }) {
    const { upgrades, upgradeStat } = useStore();

    // Map theme colors to CSS variables so child elements can consume them in Tailwind
    const inlineStyles = {
      '--forge-primary': FORGE_THEME.primary,
      '--forge-primary-hover': FORGE_THEME.primaryHover,
      '--forge-bg-dark': FORGE_THEME.bgDark,
      '--forge-muted': FORGE_THEME.muted,
      '--forge-accent-text': FORGE_THEME.accentText,
      '--forge-primary-glow-015': getRgba(FORGE_THEME.primary, 0.15),
      '--forge-primary-glow-04': getRgba(FORGE_THEME.primary, 0.4),
      '--forge-primary-glow-06': getRgba(FORGE_THEME.primary, 0.6),
    } as React.CSSProperties;

    return (
        <>
            <motion.div 
               style={inlineStyles}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={onClose}
               className="absolute inset-0 z-40 bg-[var(--forge-bg-dark)]/80 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
               style={inlineStyles}
               initial={{ opacity: 0, x: -50 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -50 }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="absolute left-0 top-0 bottom-0 w-[420px] z-50 bg-[var(--forge-bg-dark)]/95 border-r border-[var(--forge-primary)]/50 shadow-[30px_0_60px_-10px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
            >
               {/* Internal grid overlay */}
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

               <div className="relative z-10 flex flex-col h-full">
                  <div className="p-8 border-b border-[var(--forge-primary)]/20 bg-gradient-to-b from-[var(--forge-primary)]/10 to-transparent flex justify-between items-start">
                     <div>
                        <h2 className="text-2xl font-black uppercase tracking-[0.15em] text-white flex items-center gap-3 mb-2">
                           <span className="text-[var(--forge-primary)]" style={{ filter: `drop-shadow(0 0 8px ${getRgba(FORGE_THEME.primary, 0.5)})` }}>⚒️</span> SOUL FORGE
                        </h2>
                        <div className="text-[10px] font-mono text-[var(--forge-primary)]/80 tracking-[0.25em] uppercase border-l-2 border-[var(--forge-primary)]/50 pl-2">UPGRADE_MODULES</div>
                     </div>
                     <button 
                        onMouseEnter={playHoverSfx}
                        onClick={() => { playClickSfx(); onClose(); }}
                        className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer font-mono text-sm border border-slate-800 hover:border-red-400/50 px-2.5 py-1"
                      >
                        [ESC]
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
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
                             onMouseEnter={() => playHoverSfx()}
                             className={`relative p-5 flex flex-col gap-4 group transition-all duration-300
                              ${isMaxed ? 'bg-[var(--forge-bg-dark)] border-l-2 border-cyan-500/70' 
                                : canAfford ? 'bg-[var(--forge-bg-dark)] border-l-2 border-[var(--forge-primary)]/70 hover:bg-[var(--forge-bg-dark)] hover:translate-x-1' 
                                : 'bg-[var(--forge-bg-dark)]/90 border-l-2 border-slate-800/40 grayscale-[40%]'}`}
                           >
                              {/* Inner glow edge */}
                              {canAfford && !isMaxed && <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ boxShadow: `inset 0 0 25px ${getRgba(FORGE_THEME.primary, 0.15)}` }} />}

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
                                      className={`px-3 py-2 text-[10px] font-mono tracking-[0.15em] transition-all cursor-pointer border flex flex-col items-center justify-center gap-1 min-w-[90px] rounded
                                       ${canAfford ? 'bg-[var(--forge-primary)]/10 border-[var(--forge-primary)]/40 text-[var(--forge-accent-text)] hover:bg-[var(--forge-primary)] hover:text-[#120E1B] hover:border-[var(--forge-primary)] shadow-[0_0_10px_var(--forge-primary-glow-015)] hover:shadow-[0_0_20px_var(--forge-primary-glow-04)]' 
                                       : 'bg-[var(--forge-bg-dark)] border-[var(--forge-muted)]/20 text-[var(--forge-muted)]/60 cursor-not-allowed flex flex-col items-center justify-center'}`}
                                    >
                                      {!canAfford && <Lock className="w-3 h-3 text-[var(--forge-muted)]" />}
                                      <span className={!canAfford ? 'text-[var(--forge-muted)]/75 font-bold' : ''}>{cost} 🟡</span>
                                    </button>
                                 )}
                              </div>

                              {/* Segmented Energy Pips */}
                              <div className="flex gap-[3px] w-full pt-2 border-t border-slate-800/50 z-10 mt-1">
                                 {Array.from({ length: stat.maxLevel }).map((_, i) => (
                                    <div 
                                       key={i} 
                                       className={`flex-1 h-1.5 skew-x-[-20deg] transition-all duration-300 ${i < level 
                                         ? (isMaxed ? 'bg-cyan-400 shadow-[0_0_8px_theme(colors.cyan.400)]' : 'bg-[var(--forge-primary)] shadow-[0_0_8px_var(--forge-primary-glow-06)]') 
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
