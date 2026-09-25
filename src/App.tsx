/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import HUD from './components/HUD';
import Hub from './components/Hub';
import LevelUpMenu from './components/LevelUpMenu';
import GameOver from './components/GameOver';
import GameArea from './game/GameArea';
import ReadyPrompt from './components/ReadyPrompt';
import { useStore, GameStage } from './store';
import { updateBgmState } from './game/audio';

export default function App() {
  const stage = useStore((state) => state.stage);
  const level = useStore((state) => state.runStats.level);
  const [hasStarted, setHasStarted] = useState(false);
  const [scale, setScale] = useState(1);
  const BASE_WIDTH = 1280;
  const BASE_HEIGHT = 720;
  const MIN_SCALE = 0.5;

  useEffect(() => {
    const handleResize = () => {
      // Calculate scale to fit viewport dynamically
      const scaleX = window.innerWidth / BASE_WIDTH;
      const scaleY = window.innerHeight / BASE_HEIGHT;
      let newScale = Math.min(scaleX, scaleY);
      
      // Clamp to prevent the screen from being minimized excessively
      newScale = Math.max(MIN_SCALE, newScale);
      
      setScale(newScale);
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('resize', handleResize);
    document.addEventListener('contextmenu', handleContextMenu);
    
    handleResize();
    return () => {
       window.removeEventListener('resize', handleResize);
       document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  useEffect(() => {
    if (hasStarted) {
      updateBgmState(stage, level);
    }
  }, [hasStarted, stage, level]);

  const handleStartGame = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const tempCtx = new AudioContextClass();
        if (tempCtx.state === 'suspended') {
          tempCtx.resume();
        }
      }
    } catch (e) {}

    setHasStarted(true);
    updateBgmState(stage, level);
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative select-none flex items-center justify-center">
       {/* Wrapper with scaled dimensions so flexbox doesn't overflow */}
       <div style={{ width: BASE_WIDTH * scale, height: BASE_HEIGHT * scale }} className="relative flex items-center justify-center">
         <div 
           className="absolute bg-black overflow-hidden origin-center ring-1 ring-slate-800"
           style={{ 
              width: BASE_WIDTH, 
              height: BASE_HEIGHT, 
              transform: `scale(${scale})`
           }}
         >
           {!hasStarted ? (
             <ReadyPrompt onConfirm={handleStartGame} />
           ) : (
             <>
               {stage === GameStage.HUB && <Hub />}
               {(stage === GameStage.PLAYING || stage === GameStage.LEVEL_UP || stage === GameStage.GAME_OVER) && (
                 <GameArea />
               )}
               {(stage === GameStage.PLAYING || stage === GameStage.LEVEL_UP) && <HUD />}
               {stage === GameStage.LEVEL_UP && <LevelUpMenu />}
               {stage === GameStage.GAME_OVER && <GameOver />}
             </>
           )}
         </div>
       </div>
    </div>
  );
}
