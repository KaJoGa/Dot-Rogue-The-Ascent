import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playHoverSfx, playClickSfx } from '../game/audio';
import { Volume2, Sparkles, RotateCcw } from 'lucide-react';

interface ReadyPromptProps {
  onConfirm: () => void;
}

export default function ReadyPrompt({ onConfirm }: ReadyPromptProps) {
  const [declined, setDeclined] = useState(false);

  const handleYes = () => {
    try {
      playClickSfx();
    } catch (e) {}
    onConfirm();
  };

  const handleNo = () => {
    try {
      playClickSfx();
    } catch (e) {}
    setDeclined(true);
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="w-full h-full bg-[#0c0914] text-[#F5F3FF] flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Background ambient decorative effects */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at center, #7C3AED 0%, transparent 70%)',
          backgroundSize: '100% 100%'
        }}
      />
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 max-w-lg w-full px-6 flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          {!declined ? (
            <motion.div
              key="prompt-state"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#1F1830] border border-[#362A52] flex items-center justify-center shadow-lg shadow-[#7C3AED]/20 mb-6 text-[#7C3AED]">
                <Sparkles className="w-8 h-8" />
              </div>

              <h1 className="text-4xl font-extrabold tracking-wide mb-3 bg-gradient-to-r from-white via-[#F5F3FF] to-[#B4A9CC] bg-clip-text text-transparent">
                Ready to play?
              </h1>

              <p className="text-sm text-[#B4A9CC] mb-8 max-w-xs flex items-center justify-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#7C3AED] shrink-0" />
                <span>Audio &amp; music will begin upon entering</span>
              </p>

              <div className="flex items-center gap-4 w-full max-w-xs">
                <button
                  type="button"
                  onMouseEnter={() => {
                    try { playHoverSfx(); } catch (e) {}
                  }}
                  onClick={handleYes}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-base bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  Yes
                </button>

                <button
                  type="button"
                  onMouseEnter={() => {
                    try { playHoverSfx(); } catch (e) {}
                  }}
                  onClick={handleNo}
                  className="flex-1 py-3 px-6 rounded-xl font-medium text-base bg-[#1F1830] hover:bg-[#2B2244] border border-[#362A52] text-[#B4A9CC] hover:text-white transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  No
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="declined-state"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col items-center py-6"
            >
              <h2 className="text-2xl font-bold tracking-wide mb-3 text-[#F5F3FF]">
                Okay, See you next time perhaps.
              </h2>

              <p className="text-sm text-[#B4A9CC] opacity-60 mb-8">
                Refresh the web if you changed your mind.
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReload}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold bg-[#1F1830] hover:bg-[#2B2244] border border-[#362A52] text-[#B4A9CC] hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Refresh Web
                </button>

                <button
                  type="button"
                  onClick={() => setDeclined(false)}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                >
                  Wait, I want to play!
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
