import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Sparkles } from 'lucide-react';

interface ReadyPromptProps {
  onConfirm: () => void;
}

export default function ReadyPrompt({ onConfirm }: ReadyPromptProps) {
  const [declined, setDeclined] = useState(false);

  const handleYes = () => {
    onConfirm();
  };

  const handleNo = () => {
    setDeclined(true);
  };

  return (
    <div className="w-full h-full bg-[#444B5A] text-[#F7F5F0] flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Background ambient decorative effects */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at center, #F3933F 0%, transparent 70%)',
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
              <div className="w-16 h-16 rounded-2xl bg-[#373D4A] border border-[#7F899F] flex items-center justify-center shadow-lg shadow-black/20 mb-6 text-[#F3933F]">
                <Sparkles className="w-8 h-8" />
              </div>

              <h1 className="text-4xl font-extrabold tracking-wide mb-3 text-[#F7F5F0]">
                Ready to play?
              </h1>

              <p className="text-sm text-[#C7CAD1] mb-8 max-w-xs flex items-center justify-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#F3933F] shrink-0" />
                <span>Audio &amp; music will begin upon entering</span>
              </p>

              <div className="flex items-center gap-4 w-full max-w-xs">
                <button
                  type="button"
                  onClick={handleYes}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-base bg-[#F3933F] hover:bg-[#F5A358] text-[#F7F5F0] shadow-lg shadow-orange-500/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  Yes
                </button>

                <button
                  type="button"
                  onClick={handleNo}
                  className="flex-1 py-3 px-6 rounded-xl font-medium text-base bg-[#373D4A] hover:bg-[#5C657A] border border-[#7F899F] text-[#C7CAD1] hover:text-[#F7F5F0] transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
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
              <h2 className="text-2xl font-bold tracking-wide mb-3 text-[#F7F5F0]">
                Okay, See you next time perhaps.
              </h2>

              <p className="text-sm text-[#C7CAD1] opacity-75 mb-6">
                Click this text below if you changed your mind.
              </p>

              <div>
                <button
                  type="button"
                  onClick={() => setDeclined(false)}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg text-sm font-semibold text-[#5FDDD0] hover:text-[#84E7DC] hover:underline cursor-pointer transition-colors"
                >
                  Wait, actually i want to play.
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
