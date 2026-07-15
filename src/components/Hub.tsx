import React, { useState } from 'react';
import { useStore, GameStage } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { playHoverSfx, playClickSfx, shuffleInGamePlaylist } from '../game/audio';
import { Settings as SettingsIcon } from 'lucide-react';
import Armory from './Armory';
import SoulForge, { FORGE_THEME } from './SoulForge';

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

const HUB_THEME = {
  bgDark: '#120E1B',          // Main dark background
  cardBg: '#1F1830',          // Cards and popups background
  forgeColor: FORGE_THEME.primary,      // Soul Forge custom color
  armoryColor: '#10b981',     // Armory custom color
  borderColor: '#362A52',     // Default border color
};

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
          ? `${activeColor} text-[var(--hub-bg-dark)]` 
          : 'bg-[var(--hub-card-bg)] border-[#4A4066] hover:border-[#7C3AED]'
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

export default function Hub() {
  const { setStage, upgrades, resetRun, setBossRush, setSandbox, settings, updateSettings } = useStore();
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [isArmoryOpen, setIsArmoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isForgeHovered, setIsForgeHovered] = useState(false);

  const handleStart = () => {
    resetRun();
    setBossRush(false);
    setSandbox(false);
    shuffleInGamePlaylist();
    setStage(GameStage.PLAYING);
  };

  const inlineStyles = {
    '--hub-bg-dark': HUB_THEME.bgDark,
    '--hub-card-bg': HUB_THEME.cardBg,
    '--hub-forge': FORGE_THEME.primary,
    '--hub-armory': HUB_THEME.armoryColor,
    '--hub-border': HUB_THEME.borderColor,
  } as React.CSSProperties;

  return (
    <div style={inlineStyles} className="flex w-full h-full bg-[var(--hub-bg-dark)] text-slate-200 flex-col items-center justify-center relative font-sans overflow-hidden">
      {/* Background high-tech grid */}
      <div 
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] z-0 pointer-events-none animate-diagonal-scroll" 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)', 
          backgroundSize: '40px 40px',
          transform: 'rotate(-15deg)'
        }} 
      />

      {/* Settings Button (Top Left) */}
      <div className="absolute top-8 left-8 z-20">
         <button 
           onMouseEnter={() => playHoverSfx()}
           onClick={() => { playClickSfx(); setIsSettingsOpen(true); }}
           className="p-3 bg-[var(--hub-bg-dark)]/80 backdrop-blur-md border border-slate-800 hover:border-slate-500 hover:bg-slate-900 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all cursor-pointer group rounded"
         >
            <SettingsIcon className="w-6 h-6 text-slate-500 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
         </button>
      </div>

      {/* Currency Display (Top Right) */}
      <div className="absolute top-8 right-8 z-20 flex items-center gap-3">
         <div className="text-xs tracking-widest text-slate-500 font-mono">GOLD</div>
         <span className="text-yellow-500 font-bold tracking-widest text-xl drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
            {Math.floor(upgrades.currency)} <span className="text-sm border-l border-yellow-500/30 pl-2 ml-1">🟡</span>
         </span>
      </div>

      {/* Title */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-16 flex flex-col items-center z-10"
      >
        <h1 className="text-5xl font-black italic tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 to-purple-600 drop-shadow-lg uppercase">
           DOT ROGUE
        </h1>
        <p className="text-sm text-indigo-400/80 mt-3 tracking-[0.5em] font-mono border-b border-indigo-900/50 pb-2 px-12">THE ASCENT</p>
      </motion.div>

      {/* SOUL FORGE Access Button (Left) */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 z-20">
         <button
            onMouseEnter={() => { playHoverSfx(); setIsForgeHovered(true); }}
            onMouseLeave={() => setIsForgeHovered(false)}
            onClick={() => { playClickSfx(); setIsForgeOpen(true); }}
            className="group relative flex flex-col items-start p-6 cursor-pointer"
         >
            <div 
               className="absolute inset-0 bg-[var(--hub-card-bg)]/90 border border-[var(--hub-forge)]/20 skew-x-[-10deg] group-hover:border-[var(--hub-forge)] group-hover:bg-[var(--hub-forge)]/10 transition-all duration-300"
               style={{
                  boxShadow: isForgeHovered
                     ? `inset 0 0 30px ${getRgba(FORGE_THEME.primary, 0.4)}`
                     : `inset 0 0 15px ${getRgba(FORGE_THEME.primary, 0.05)}`
               }}
            ></div>
            <span className="relative text-[var(--hub-forge)]/70 font-mono text-[10px] tracking-[0.3em] mb-1 group-hover:text-[var(--hub-forge)] transition-colors">&gt;&gt; SYSTEM_ACCESS</span>
            <span className="relative text-white font-black uppercase tracking-[0.1em] text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] group-hover:text-amber-50">SOUL FORGE</span>
            <div className="relative w-12 h-1 bg-[var(--hub-forge)]/50 mt-3 group-hover:w-full group-hover:bg-[var(--hub-forge)] transition-all duration-500"></div>
         </button>
      </div>

      {/* ARMORY Access Button (Right) */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 z-20">
         <button
            onMouseEnter={() => playHoverSfx()}
            onClick={() => { playClickSfx(); setIsArmoryOpen(true); }}
            className="group relative flex flex-col items-end p-6 cursor-pointer text-right"
         >
            <div className="absolute inset-0 bg-[var(--hub-card-bg)]/90 border border-[var(--hub-armory)]/20 skew-x-[10deg] group-hover:border-[var(--hub-armory)]/60 group-hover:bg-[var(--hub-armory)]/10 transition-all duration-300 shadow-[inset_0_0_15px_rgba(16,185,129,0.05)] group-hover:shadow-[inset_0_0_30px_rgba(16,185,129,0.4)]"></div>
            <span className="relative text-[var(--hub-armory)]/70 font-mono text-[10px] tracking-[0.3em] mb-1 group-hover:text-[var(--hub-armory)] transition-colors">LOADOUT &gt;&gt;</span>
            <span className="relative text-white font-black uppercase tracking-[0.1em] text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] group-hover:text-emerald-50">ARMORY</span>
            <div className="relative w-12 h-1 bg-[var(--hub-armory)]/50 mt-3 group-hover:w-full group-hover:bg-[var(--hub-armory)] transition-all duration-500"></div>
         </button>
      </div>

      {/* Main DESCENT Button (Center) */}
      <div className="z-10 flex flex-col items-center mt-24">
         <motion.button 
           onMouseEnter={() => playHoverSfx()}
           onClick={() => {
             playClickSfx();
             handleStart();
           }}
           animate={{ boxShadow: ['0 0 50px rgba(99,102,241,0.4)', '0 0 100px rgba(99,102,241,0.8)', '0 0 50px rgba(99,102,241,0.4)'] }}
           transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
           className="relative w-[320px] h-[320px] flex flex-col items-center justify-center bg-gradient-to-b from-indigo-500 to-purple-800 border-4 border-indigo-400/50 rounded-full overflow-hidden group cursor-pointer pointer-events-auto"
         >
           <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out pointer-events-none" />
           <span className="relative text-5xl font-black text-white italic tracking-[0.12em] drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] pointer-events-none mb-2">
             DESCEND
           </span>
           <span className="relative text-indigo-200 tracking-[0.3em] uppercase text-xs font-bold opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none dropshadow-sm">
              INITIATE_SEQUENCE
           </span>
         </motion.button>

      </div>

      {/* Controls Footer (Bottom Right) */}
      <div className="absolute bottom-8 right-8 z-10 text-slate-500 font-mono text-[10px] tracking-[0.2em] text-right pointer-events-none">
         <div className="relative p-5 bg-[var(--hub-card-bg)]/60 backdrop-blur-sm border border-slate-800/40 shadow-2xl">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-indigo-500/50"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-indigo-500/50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-indigo-500/50"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-indigo-500/50"></div>
            
            <div className="flex flex-col gap-3 relative z-10">
               <div className="flex justify-between gap-8">
                  <span className="text-indigo-400">[WASD]</span>
                  <span className="text-slate-300">MOVE</span>
               </div>
               <div className="flex justify-between gap-8">
                  <span className="text-indigo-400">[SPACE]</span>
                  <span className="text-slate-300">DASH</span>
               </div>
               <div className="flex justify-between gap-8">
                  <span className="text-indigo-400">[L-CLICK]</span>
                  <span className="text-slate-300">FIRE</span>
               </div>
            </div>
         </div>
      </div>

      <AnimatePresence>
        {isForgeOpen && (
           <SoulForge onClose={() => setIsForgeOpen(false)} />
        )}

        {isArmoryOpen && (
           <Armory onClose={() => setIsArmoryOpen(false)} />
        )}

        {isSettingsOpen && (
            <>
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSettingsOpen(false)}
                  className="absolute inset-0 z-40 bg-[var(--hub-card-bg)]/80 backdrop-blur-sm cursor-pointer"
               />
               <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute z-50 bg-[var(--hub-card-bg)]/95 border border-[var(--hub-border)] shadow-2xl p-8 flex flex-col min-w-[360px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl"
               >
                  <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                    <h2 className="text-white text-2xl font-black italic tracking-widest uppercase">CONFIGURATION</h2>
                    <button 
                      onMouseEnter={playHoverSfx}
                      onClick={() => { playClickSfx(); setIsSettingsOpen(false); }} 
                      className="text-slate-500 hover:text-red-400 hover:border-red-500/50 transition-colors font-mono text-sm border border-slate-800 px-2.5 py-1 cursor-pointer"
                    >
                      [X]
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-6 font-mono text-sm">
                    <div className="flex items-center justify-between text-slate-300 hover:text-white group">
                       <span className="tracking-widest capitalize">Damage Numbers</span>
                       <CustomCheckbox checked={settings.showDmgNotif} onChange={(checked) => updateSettings({ showDmgNotif: checked })} />
                    </div>
                    <div className="flex items-center justify-between text-slate-300 hover:text-white group">
                       <span className="tracking-widest capitalize">Item Drop Prompts</span>
                       <CustomCheckbox checked={settings.showDropNotif} onChange={(checked) => updateSettings({ showDropNotif: checked })} />
                    </div>
                    <div className="flex items-center justify-between text-slate-300 hover:text-white group">
                       <span className="tracking-widest capitalize">Auto Skip Wave</span>
                       <CustomCheckbox checked={settings.autoSkipWave} onChange={(checked) => updateSettings({ autoSkipWave: checked })} accent="emerald" />
                    </div>
                    <div className="flex items-center justify-between text-slate-300 hover:text-white group">
                       <span className="tracking-widest capitalize">Exp Gains</span>
                       <CustomCheckbox checked={settings.showExpNotif} onChange={(checked) => updateSettings({ showExpNotif: checked })} />
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-4">
                      <span className="tracking-widest capitalize text-slate-500">Audio Volume</span>
                      
                      <div className="flex flex-col gap-2 group/slider">
                        <div className="flex justify-between items-center text-slate-300 group-hover/slider:text-white">
                          <span className="tracking-widest capitalize text-xs">BGM Volume</span>
                          <span className="text-xs font-bold text-indigo-400">{settings.bgmVolume ?? 50}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600 text-[10px] font-bold">L</span>
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
                          <span className="text-slate-600 text-[10px] font-bold">H</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 group/slider">
                        <div className="flex justify-between items-center text-slate-300 group-hover/slider:text-white">
                          <span className="tracking-widest capitalize text-xs">UI SFX Volume</span>
                          <span className="text-xs font-bold text-indigo-400">{settings.uiSfxVolume ?? 100}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600 text-[10px] font-bold">L</span>
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
                          <span className="text-slate-600 text-[10px] font-bold">H</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 group/slider">
                        <div className="flex justify-between items-center text-slate-300 group-hover/slider:text-white">
                          <span className="tracking-widest capitalize text-xs">Gameplay SFX Volume</span>
                          <span className="text-xs font-bold text-indigo-400">{settings.gameplaySfxVolume ?? 100}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600 text-[10px] font-bold">L</span>
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
                          <span className="text-slate-600 text-[10px] font-bold">H</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-4">
                      <span className="tracking-widest capitalize text-slate-500">Save Management</span>
                      <div className="flex gap-4">
                        <button 
                          onMouseEnter={playHoverSfx}
                          onClick={() => {
                            playClickSfx();
                            try {
                              const saveStr = localStorage.getItem('roguelike-game-storage');
                              if (saveStr) {
                                const blob = new Blob([saveStr], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `roguelike_save_${new Date().getTime()}.json`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              }
                            } catch (e) {
                              alert('Failed to export save data.');
                            }
                          }}
                          className="flex-1 py-2 bg-[var(--hub-card-bg)] hover:bg-[#2A2140] text-slate-300 hover:text-white transition-all border border-[var(--hub-border)] hover:border-[#7C3AED] lowercase tracking-widest text-xs rounded cursor-pointer"
                        >
                          [export save]
                        </button>
                        <label 
                          onMouseEnter={playHoverSfx}
                          className="flex-1 py-2 bg-[var(--hub-card-bg)] hover:bg-[#2A2140] text-slate-300 hover:text-white transition-all border border-[var(--hub-border)] hover:border-[#7C3AED] lowercase tracking-widest text-xs cursor-pointer text-center block rounded"
                        >
                          [import save]
                          <input 
                            type="file" 
                            accept=".json" 
                            className="hidden" 
                            onChange={(e) => {
                              playClickSfx();
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  try {
                                    const data = event.target?.result as string;
                                    JSON.parse(data); // validate
                                    localStorage.setItem('roguelike-game-storage', data);
                                    alert('Save imported successfully. The game will now reload.');
                                    window.location.reload();
                                  } catch (err) {
                                    alert('Invalid save file.');
                                  }
                                };
                                reader.readAsText(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
               </motion.div>
            </>
         )}
       </AnimatePresence>

    </div>
  );
}
