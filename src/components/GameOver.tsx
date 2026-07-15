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
          <h1 className="text-6xl font-black text-[#F87171] mb-2 italic tracking-widest drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">YOU DIED</h1>
          <p className="text-[#B4A9CC] font-mono mb-12">The depths claimed you.</p>

          <div className="bg-[#1F1830] border border-[#362A52] p-8 rounded-xl flex flex-col gap-4 text-left max-w-sm mx-auto shadow-2xl relative overflow-hidden">
             
             <div className="flex justify-between items-center border-b border-[#362A52] pb-2">
                <span className="text-[#B4A9CC] font-bold uppercase text-sm">Deepest Biome</span>
                <span className="text-white font-mono text-xl">{runStats.biome}</span>
             </div>
             <div className="flex justify-between items-center border-b border-[#362A52] pb-2">
                <span className="text-[#B4A9CC] font-bold uppercase text-sm">Max Level</span>
                <span className="text-white font-mono text-xl">{runStats.level}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[#B4A9CC] font-bold uppercase text-sm">Gold Extracted</span>
                <span className="text-[#FBBF24] font-mono text-xl">+{runStats.currencyEarned} 🟡</span>
             </div>

             <button 
                onMouseEnter={playHoverSfx}
                onClick={() => { playClickSfx(); setStage(GameStage.HUB); }}
                className="mt-6 font-bold w-full p-4 bg-[#2A2140] hover:bg-[#362A52] rounded-lg text-white transition-colors border border-[#7C3AED] shadow-md cursor-pointer"
             >
                RETURN TO HUB
             </button>
          </div>
       </motion.div>
    </div>
  );
}
