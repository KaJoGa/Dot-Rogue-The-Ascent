import { useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { motion } from 'motion/react';
import { playHoverSfx, playClickSfx, playLevelUpSfx } from '../game/audio';

const RARITIES = [
  { name: 'Common', level: 0, color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/50', weight: 50 },
  { name: 'Uncommon', level: 1, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/50', weight: 30 },
  { name: 'Rare', level: 2, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/50', weight: 16 },
  { name: 'Epic', level: 3, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/50', weight: 3 },
  { name: 'Legendary', level: 4, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', weight: 1 },
];

function getRandomRarity() {
  if (useStore.getState().isBossRush) return RARITIES[4]; // Always Legendary
  const sum = RARITIES.reduce((acc, r) => acc + r.weight, 0);
  let rand = Math.random() * sum;
  for (const r of RARITIES) {
    if (rand < r.weight) return r;
    rand -= r.weight;
  }
  return RARITIES[0];
}

export default function LevelUpMenu() {
  const { applyRunUpgrade, runStats, upgrades, runUpgrades, selectedWeapons } = useStore();

  const baseStats = useMemo(() => {
    const stats: Array<{ id: 'hp' | 'damage' | 'speed' | 'atkSpeed', label: string, suffix: string, amounts: number[] }> = [
      { id: 'hp' as const, label: 'Max Health', suffix: ' HP', amounts: [5, 10, 20, 35, 50] },
      { id: 'damage' as const, label: 'Damage', suffix: ' DMG', amounts: [3, 6, 10, 15, 20] },
    ];
    
    const speedCap = selectedWeapons.melee === 'heavy_hammer' ? 250 : 350;
    const currentSpeed = 150 + upgrades.speed * 15 + runUpgrades.speed;
    if (currentSpeed < speedCap || selectedWeapons.melee === 'heavy_hammer') {
      stats.push({ id: 'speed' as const, label: 'Movement Speed', suffix: ' SPD', amounts: [3, 5, 7, 10, 15] });
    }

    const attackSpeedCap = selectedWeapons.melee === 'plasma_dagger' ? 0.3 : selectedWeapons.melee === 'heavy_hammer' ? 0.9 : selectedWeapons.melee === 'sabre' ? 0.5 : 0.4;
    const weaponAttackSpeedMod = selectedWeapons.melee === 'plasma_dagger' ? -0.1 : selectedWeapons.melee === 'heavy_hammer' ? 0.4 : selectedWeapons.melee === 'sabre' ? 0.15 : 0;
    const currentAttackCooldown = 0.7 + weaponAttackSpeedMod + runUpgrades.atkSpeed;
    if (currentAttackCooldown > attackSpeedCap) {
      stats.push({ id: 'atkSpeed' as const, label: 'Attack Speed', suffix: 's Atk Spd', amounts: [-0.02, -0.04, -0.06, -0.08, -0.12] });
    }
    
    return stats;
  }, [upgrades.speed, runUpgrades.speed, runUpgrades.atkSpeed, selectedWeapons.melee]);

  const selectedOptions = useMemo(() => {
    const shuffledStats = [...baseStats].sort(() => 0.5 - Math.random()).slice(0, 3);
    return shuffledStats.map(stat => {
      const rarity = getRandomRarity();
      const amount = stat.amounts[rarity.level];
      return {
        ...stat,
        rarity,
        amount
      };
    });
  }, [runStats.pendingLevelUps]); // Roll again if we have more level ups

  useEffect(() => {
    playLevelUpSfx();
  }, [runStats.pendingLevelUps]);

  return (
    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
       <motion.div 
         initial={{ scale: 0.9, opacity: 0, y: 20 }}
         animate={{ scale: 1, opacity: 1, y: 0 }}
         key={`level-up-${runStats.pendingLevelUps}`} // Force re-animation
         className="bg-[#1F1830] border border-[#362A52] p-8 rounded-xl max-w-2xl w-full flex flex-col items-center shadow-2xl relative"
       >
          <h2 className="text-3xl font-black text-white italic tracking-widest mb-2 uppercase">
            Level Up! {runStats.pendingLevelUps > 1 ? `(${runStats.pendingLevelUps - 1} pending)` : ''}
          </h2>
          <p className="text-[#B4A9CC] mb-8 font-mono text-sm">Choose a boost for this run</p>

          <div className="flex w-full gap-4">
             {selectedOptions.map((opt, i) => (
                <button 
                  key={i}
                  onMouseEnter={() => playHoverSfx()}
                  onClick={() => {
                     playClickSfx();
                     applyRunUpgrade(opt.id, opt.amount);
                  }}
                  className={`flex-1 flex flex-col items-center justify-center p-4 ${opt.rarity.bg} hover:bg-[#2A2140] border ${opt.rarity.border} rounded-lg transition-all group relative overflow-hidden text-center`}
                >
                   <div className={`mb-1 font-bold tracking-widest uppercase text-xs ${opt.rarity.color}`}>
                     {opt.rarity.name}
                   </div>
                   <h3 className="text-white font-bold text-lg mb-1">{opt.label}</h3>
                   <span className={`font-mono font-bold text-sm ${opt.rarity.color}`}>
                     {opt.amount > 0 ? '+' : ''}{opt.amount}{opt.suffix}
                   </span>
                </button>
             ))}
          </div>
       </motion.div>
    </div>
  );
}
