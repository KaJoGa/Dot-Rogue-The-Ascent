import { useState } from 'react';
import { useStore, GameStage } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { playHoverSfx, playClickSfx } from '../game/audio';
import { Settings as SettingsIcon } from 'lucide-react';
import Armory from './Armory';
import SoulForge from './SoulForge';

export default function Hub() {
  const { setStage, upgrades, resetRun, setBossRush, setSandbox, settings, updateSettings } = useStore();
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [isArmoryOpen, setIsArmoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleStart = () => {
    resetRun();
    setBossRush(false);
    setSandbox(false);
    setStage(GameStage.PLAYING);
  };

  return (
    <div className="flex w-full h-full bg-[#050508] text-slate-200 flex-col items-center justify-center relative font-sans overflow-hidden">
      {/* Background high-tech grid */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #1a1a2e 1px, transparent 1px), linear-gradient(to bottom, #1a1a2e 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Settings Button (Top Left) */}
      <div className="absolute top-8 left-8 z-20">
         <button 
           onMouseEnter={() => playHoverSfx()}
           onClick={() => { playClickSfx(); setIsSettingsOpen(true); }}
           className="p-3 bg-[#050508]/80 backdrop-blur-md border border-slate-800 hover:border-slate-500 hover:bg-slate-900 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all cursor-pointer group rounded"
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
           PIXEL ROGUE
        </h1>
        <p className="text-sm text-indigo-400/80 mt-3 tracking-[0.5em] font-mono border-b border-indigo-900/50 pb-2 px-12">THE ASCENT</p>
      </motion.div>

      {/* SOUL FORGE Access Button (Left) */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 z-20">
         <button
            onMouseEnter={() => playHoverSfx()}
            onClick={() => { playClickSfx(); setIsForgeOpen(true); }}
            className="group relative flex flex-col items-start p-6 cursor-pointer"
         >
            <div className="absolute inset-0 bg-[#07070b]/90 border border-indigo-500/20 skew-x-[-10deg] group-hover:border-indigo-400 group-hover:bg-indigo-950/40 transition-all duration-300 shadow-[inset_0_0_15px_rgba(99,102,241,0.05)] group-hover:shadow-[inset_0_0_30px_rgba(99,102,241,0.4)]"></div>
            <span className="relative text-indigo-500/70 font-mono text-[10px] tracking-[0.3em] mb-1 group-hover:text-indigo-400 transition-colors">&gt;&gt; SYSTEM_ACCESS</span>
            <span className="relative text-white font-black uppercase tracking-[0.1em] text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] group-hover:text-amber-50">SOUL FORGE</span>
            <div className="relative w-12 h-1 bg-indigo-600/50 mt-3 group-hover:w-full group-hover:bg-indigo-400 transition-all duration-500"></div>
         </button>
      </div>

      {/* ARMORY Access Button (Right) */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 z-20">
         <button
            onMouseEnter={() => playHoverSfx()}
            onClick={() => { playClickSfx(); setIsArmoryOpen(true); }}
            className="group relative flex flex-col items-end p-6 cursor-pointer text-right"
         >
            <div className="absolute inset-0 bg-[#07070b]/90 border border-emerald-500/20 skew-x-[10deg] group-hover:border-emerald-400 group-hover:bg-emerald-950/40 transition-all duration-300 shadow-[inset_0_0_15px_rgba(16,185,129,0.05)] group-hover:shadow-[inset_0_0_30px_rgba(16,185,129,0.4)]"></div>
            <span className="relative text-emerald-500/70 font-mono text-[10px] tracking-[0.3em] mb-1 group-hover:text-emerald-400 transition-colors">LOADOUT &gt;&gt;</span>
            <span className="relative text-white font-black uppercase tracking-[0.1em] text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] group-hover:text-emerald-50">ARMORY</span>
            <div className="relative w-12 h-1 bg-emerald-600/50 mt-3 group-hover:w-full group-hover:bg-emerald-400 transition-all duration-500"></div>
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
         <div className="relative p-5 bg-[#050508]/60 backdrop-blur-sm border border-slate-800/40 shadow-2xl">
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
                 className="absolute inset-0 z-40 bg-[#050508]/80 backdrop-blur-md cursor-pointer"
              />
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="absolute z-50 bg-[#07070b]/95 border border-slate-700 shadow-2xl p-8 flex flex-col min-w-[360px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                 <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                   <h2 className="text-white text-2xl font-black italic tracking-widest uppercase">CONFIGURATION</h2>
                   <button onClick={() => setIsSettingsOpen(false)} className="text-slate-500 hover:text-red-400 transition-colors font-mono text-sm border border-slate-800 px-2 py-1">[X]</button>
                 </div>
                 
                 <div className="flex flex-col gap-6 font-mono text-sm">
                   <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer group">
                      <span className="tracking-widest capitalize">Damage Numbers</span>
                      <input type="checkbox" checked={settings.showDmgNotif} onChange={(e) => updateSettings({ showDmgNotif: e.target.checked })} className="w-5 h-5 accent-indigo-500 cursor-pointer" />
                   </label>
                   <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer group">
                      <span className="tracking-widest capitalize">Item Drop Prompts</span>
                      <input type="checkbox" checked={settings.showDropNotif} onChange={(e) => updateSettings({ showDropNotif: e.target.checked })} className="w-5 h-5 accent-indigo-500 cursor-pointer" />
                   </label>
                   <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer group">
                      <span className="tracking-widest capitalize">Auto Skip Wave</span>
                      <input type="checkbox" checked={settings.autoSkipWave} onChange={(e) => updateSettings({ autoSkipWave: e.target.checked })} className="w-5 h-5 accent-emerald-500 cursor-pointer" />
                   </label>
                   <label className="flex items-center justify-between text-slate-300 hover:text-white cursor-pointer group">
                      <span className="tracking-widest capitalize">Exp Gains</span>
                      <input type="checkbox" checked={settings.showExpNotif} onChange={(e) => updateSettings({ showExpNotif: e.target.checked })} className="w-5 h-5 accent-indigo-500 cursor-pointer" />
                   </label>
                   
                   <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-4">
                     <span className="tracking-widest capitalize text-slate-500">Save Management</span>
                     <div className="flex gap-4">
                       <button 
                         onClick={() => {
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
                         className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 hover:border-slate-500 lowercase tracking-widest text-xs"
                       >
                         [export save]
                       </button>
                       <label 
                         className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 hover:border-slate-500 lowercase tracking-widest text-xs cursor-pointer text-center block"
                       >
                         [import save]
                         <input 
                           type="file" 
                           accept=".json" 
                           className="hidden" 
                           onChange={(e) => {
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
