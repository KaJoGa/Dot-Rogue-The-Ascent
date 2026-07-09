import { useStore, GameStage } from '../store';
import { motion } from 'motion/react';
import { playHoverSfx, playClickSfx } from '../game/audio';

export default function GameOver() {
  const { setStage, runStats } = useStore();

  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center z-50 flex-col font-sans">
       <motion.div 
         initial={{ scale: 0.8, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         transition={{ type: 'spring', bounce: 0.5 }}
         className="text-center"
       >
          <h1 className="text-6xl font-black text-red-600 mb-2 italic tracking-widest drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">YOU DIED</h1>
          <p className="text-slate-400 font-mono mb-12">The depths claimed you.</p>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl flex flex-col gap-4 text-left max-w-sm mx-auto shadow-2xl relative overflow-hidden">
             
             <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-500 font-bold uppercase text-sm">Deepest Biome</span>
                <span className="text-white font-mono text-xl">{runStats.biome}</span>
             </div>
             <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-slate-500 font-bold uppercase text-sm">Max Level</span>
                <span className="text-white font-mono text-xl">{runStats.level}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold uppercase text-sm">Gold Extracted</span>
                <span className="text-yellow-400 font-mono text-xl">+{runStats.currencyEarned} 🟡</span>
             </div>

             <button 
                onMouseEnter={playHoverSfx}
                onClick={() => { playClickSfx(); setStage(GameStage.HUB); }}
                className="mt-6 font-bold w-full p-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors border border-slate-600 shadow-md cursor-pointer"
             >
                RETURN TO HUB
             </button>
          </div>
       </motion.div>
    </div>
  );
}
