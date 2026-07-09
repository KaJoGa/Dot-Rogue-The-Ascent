import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PermanentUpgrades, RunStats } from './game/types';

export enum GameStage {
  HUB,
  PLAYING,
  LEVEL_UP,
  GAME_OVER,
  VICTORY
}

interface AppState {
  selectedWeapons: {
    melee: string;
    ranged: string;
  };
  setSelectedWeapon: (type: 'melee' | 'ranged', id: string) => void;
  
  isBossRush: boolean;
  setBossRush: (val: boolean) => void;
  isSandbox: boolean;
  setSandbox: (val: boolean) => void;
  stage: GameStage;
  setStage: (stage: GameStage) => void;

  isPaused: boolean;
  setIsPaused: (val: boolean) => void;

  settings: {
    showDmgNotif: boolean;
    showDropNotif: boolean;
    showExpNotif: boolean;
    autoSkipWave: boolean;
  };
  updateSettings: (partial: Partial<AppState['settings']>) => void;

  upgrades: PermanentUpgrades;
  upgradeStat: (stat: keyof Omit<PermanentUpgrades, 'currency'>, cost: number) => void;
  addCurrency: (amount: number) => void;

  runStats: RunStats;
  updateRunStats: (partial: Partial<RunStats>) => void;
  resetRun: () => void;
  gainXp: (amount: number, suppressMenu?: boolean) => void;
  triggerBossReward: () => void;

  runUpgrades: { hp: number, damage: number, speed: number, atkSpeed: number, atkRange: number };
  applyRunUpgrade: (stat: keyof AppState['runUpgrades'], amount: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedWeapons: {
        melee: 'sabre',
        ranged: 'bow',
      },
      setSelectedWeapon: (type, id) => set((state) => ({
        selectedWeapons: { ...state.selectedWeapons, [type]: id }
      })),

      isBossRush: false,
      setBossRush: (val) => set({ isBossRush: val }),
      isSandbox: false,
      setSandbox: (val) => set({ isSandbox: val }),
      stage: GameStage.HUB,
      setStage: (stage) => set({ stage }),

      isPaused: false,
      setIsPaused: (val) => set({ isPaused: val }),

      settings: {
        showDmgNotif: true,
        showDropNotif: true,
        showExpNotif: true,
        autoSkipWave: false,
      },
      updateSettings: (partial) => set((state) => ({ settings: { ...state.settings, ...partial } })),

      upgrades: {
        health: 0,
        damage: 0,
        speed: 0,
        range: 0,
        currency: 0,
      },
      upgradeStat: (stat, cost) => set((state) => {
        if (state.upgrades.currency >= cost) {
          return {
            upgrades: {
              ...state.upgrades,
              currency: state.upgrades.currency - cost,
              [stat]: state.upgrades[stat] + 1
            }
          };
        }
        return state;
      }),
      addCurrency: (amount) => set((state) => ({
        upgrades: { ...state.upgrades, currency: state.upgrades.currency + amount }
      })),

      runStats: {
        level: 1,
        playerLevel: 1,
        biome: 1,
        xp: 0,
        xpToNext: 50,
        pendingLevelUps: 0,
        currencyEarned: 0,
        ammo: 20,
        bossKills: 0
      },
      updateRunStats: (partial) => set((state) => ({ runStats: { ...state.runStats, ...partial } })),
      resetRun: () => set({
        runStats: { level: 1, playerLevel: 1, biome: 1, xp: 0, xpToNext: 50, pendingLevelUps: 0, currencyEarned: 0, ammo: 20, bossKills: 0 },
        runUpgrades: { hp: 0, damage: 0, speed: 0, atkSpeed: 0, atkRange: 0 }
      }),
      gainXp: (amount, suppressMenu) => set((state) => {
        let { xp, xpToNext, pendingLevelUps } = state.runStats;
        let stage = state.stage;
        let playerLevel = state.runStats.playerLevel ?? 1;
        xp += amount;
        
        while (xp >= xpToNext) {
          xp -= xpToNext;
          playerLevel += 1;
          pendingLevelUps = (pendingLevelUps || 0) + 1;
          xpToNext = Math.floor(50 * Math.pow(1.3, playerLevel - 1));
        }
        
        if (pendingLevelUps > 0 && stage === GameStage.PLAYING && !suppressMenu) {
          stage = GameStage.LEVEL_UP;
        }
        
        return { runStats: { ...state.runStats, xp, xpToNext, playerLevel, pendingLevelUps }, stage };
      }),
      triggerBossReward: () => set((state) => {
        const pendingLevelUps = (state.runStats.pendingLevelUps || 0) + 1;
        return {
          runStats: { ...state.runStats, pendingLevelUps },
          stage: GameStage.LEVEL_UP
        };
      }),

      runUpgrades: {
        hp: 0,
        damage: 0,
        speed: 0,
        atkSpeed: 0,
        atkRange: 0
      },
      applyRunUpgrade: (stat, amount: number) => set((state) => {
        let newUpgrades = { ...state.runUpgrades };
        newUpgrades[stat] += amount;
        
        const newPendingLevelUps = Math.max(0, (state.runStats.pendingLevelUps || 0) - 1);
        
        return {
          runUpgrades: newUpgrades,
          runStats: { ...state.runStats, pendingLevelUps: newPendingLevelUps },
          stage: newPendingLevelUps > 0 ? GameStage.LEVEL_UP : GameStage.PLAYING
        };
      })
    }),
    {
      name: 'roguelike-game-storage',
      partialize: (state) => ({
        upgrades: state.upgrades,
        settings: state.settings,
        selectedWeapons: state.selectedWeapons,
      }),
    }
  )
);
