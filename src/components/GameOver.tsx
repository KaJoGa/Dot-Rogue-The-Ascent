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
          <h1 className="text-6xl font-black text-[#F47B81] mb-2 italic tracking-widest drop-shadow-[0_0_20px_rgba(244,123,129,0.8)]">YOU DIED</h1>
          <p className="text-[#C7CAD1] font-mono mb-12">The depths claimed you.</p>

          <div className="bg-[#373D4A] border border-[#7F899F] p-8 rounded-xl flex flex-col gap-4 text-left max-w-sm mx-auto shadow-2xl relative overflow-hidden">
             
             <div className="flex justify-between items-center border-b border-[#7F899F]/40 pb-2">
                <span className="text-[#C7CAD1] font-bold uppercase text-sm">Deepest Biome</span>
                <span className="text-[#F7F5F0] font-mono text-xl">{runStats.biome}</span>
             </div>
             <div className="flex justify-between items-center border-b border-[#7F899F]/40 pb-2">
                <span className="text-[#C7CAD1] font-bold uppercase text-sm">Max Level</span>
                <span className="text-[#F7F5F0] font-mono text-xl">{runStats.level}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[#C7CAD1] font-bold uppercase text-sm">Gold Extracted</span>
                <span className="text-[#FBCC56] font-mono text-xl">+{runStats.currencyEarned} 🟡</span>
             </div>

             <button 
                onMouseEnter={playHoverSfx}
                onClick={() => { playClickSfx(); setStage(GameStage.HUB); }}
                className="mt-6 font-bold w-full p-4 bg-[#F3933F] hover:bg-[#F5A358] rounded-lg text-[#F7F5F0] transition-colors border border-[#F3933F] shadow-lg shadow-orange-500/20 cursor-pointer"
             >
                RETURN TO HUB
             </button>
          </div>
       </motion.div>
    </div>
  );
}
