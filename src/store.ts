import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PermanentUpgrades, RunStats } from './game/types';

/**
 * GameStage tracks the current active state of the application.
 * - HUB: Upgrading and selecting gear in the main base.
 * - PLAYING: Active combat gameplay.
 * - LEVEL_UP: Paused gameplay showing the level-up draft card selection.
 * - GAME_OVER: Player has died and shows run summary.
 * - VICTORY: Game/boss rush successfully completed.
 */
export enum GameStage {
  HUB,
  PLAYING,
  LEVEL_UP,
  GAME_OVER,
  VICTORY
}

export interface AppState {
  // Current active loadout configuration
  selectedWeapons: {
    melee: string;
    ranged: string;
  };
  setSelectedWeapon: (type: 'melee' | 'ranged', id: string) => void;
  
  // Game mode configurations
  isBossRush: boolean;
  setBossRush: (val: boolean) => void;
  isSandbox: boolean;
  setSandbox: (val: boolean) => void;
  stage: GameStage;
  setStage: (stage: GameStage) => void;

  // General pause control state
  isPaused: boolean;
  setIsPaused: (val: boolean) => void;

  // Visual/Auditory settings and helper options
  settings: {
    showDmgNotif: boolean;
    showDropNotif: boolean;
    showExpNotif: boolean;
    autoSkipWave: boolean;
    bgmVolume: number;
    uiSfxVolume: number;
    gameplaySfxVolume: number;
  };
  updateSettings: (partial: Partial<AppState['settings']>) => void;

  // Meta-progression upgrades (permanent stats in the HUB)
  upgrades: PermanentUpgrades;
  upgradeStat: (stat: keyof Omit<PermanentUpgrades, 'currency'>, cost: number) => void;
  addCurrency: (amount: number) => void;

  // Current active run gameplay progress
  runStats: RunStats;
  updateRunStats: (partial: Partial<RunStats>) => void;
  resetRun: () => void;
  gainXp: (amount: number, suppressMenu?: boolean) => void;
  triggerBossReward: () => void;

  // Current active run statistics / in-game items
  runUpgrades: { hp: number, damage: number, speed: number, atkSpeed: number, atkRange: number };
  applyRunUpgrade: (stat: keyof AppState['runUpgrades'], amount: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Loadout management
      selectedWeapons: {
        melee: 'sabre',
        ranged: 'bow',
      },
      /**
       * Updates the equipped melee or ranged weapon slot.
       */
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

      // User configurations & Audio volumes
      settings: {
        showDmgNotif: true,
        showDropNotif: true,
        showExpNotif: true,
        autoSkipWave: false,
        bgmVolume: 50,
        uiSfxVolume: 100,
        gameplaySfxVolume: 100,
      },
      /**
       * Updates general settings partially.
       */
      updateSettings: (partial) => set((state) => ({ settings: { ...state.settings, ...partial } })),

      // Meta-progression database
      upgrades: {
        health: 0,
        damage: 0,
        speed: 0,
        range: 0,
        currency: 0,
      },
      /**
       * Purchases a permanent upgrade in the Hub.
       * Subtracts currency and increments the specified stat if affordable.
       */
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
      /**
       * Grants permanent gold currency (rewards/loot).
       */
      addCurrency: (amount) => set((state) => ({
        upgrades: { ...state.upgrades, currency: state.upgrades.currency + amount }
      })),

      // In-game stats per run session
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
      /**
       * Updates run variables (XP, wave level, biome, boss kills) partially.
       */
      updateRunStats: (partial) => set((state) => ({ runStats: { ...state.runStats, ...partial } })),
      /**
       * Resets current active run variables and upgrades to default.
       * Run at the start of a brand-new game session.
       */
      resetRun: () => set({
        runStats: { level: 1, playerLevel: 1, biome: 1, xp: 0, xpToNext: 50, pendingLevelUps: 0, currencyEarned: 0, ammo: 20, bossKills: 0 },
        runUpgrades: { hp: 0, damage: 0, speed: 0, atkSpeed: 0, atkRange: 0 }
      }),
      /**
       * Adds XP to the player. Handles multiple level ups concurrently,
       * scales XP requirement with a 1.2x multiplier, and displays the level up screen.
       */
      gainXp: (amount, suppressMenu) => set((state) => {
        let { xp, xpToNext, pendingLevelUps } = state.runStats;
        let stage = state.stage;
        let playerLevel = state.runStats.playerLevel ?? 1;
        xp += amount;
        
        // Loop handles edge cases where gained XP is large enough to trigger multiple level ups
        while (xp >= xpToNext) {
          xp -= xpToNext;
          playerLevel += 1;
          pendingLevelUps = (pendingLevelUps || 0) + 1;
          xpToNext = Math.floor(50 * Math.pow(1.2, playerLevel - 1));
        }
        
        // Transition game stage to LEVEL_UP if menu display isn't suppressed
        if (pendingLevelUps > 0 && stage === GameStage.PLAYING && !suppressMenu) {
          stage = GameStage.LEVEL_UP;
        }
        
        return { runStats: { ...state.runStats, xp, xpToNext, playerLevel, pendingLevelUps }, stage };
      }),
      /**
       * Forces a bonus upgrade draft to reward the player (e.g. after beating a boss).
       */
      triggerBossReward: () => set((state) => {
        const pendingLevelUps = (state.runStats.pendingLevelUps || 0) + 1;
        return {
          runStats: { ...state.runStats, pendingLevelUps },
          stage: GameStage.LEVEL_UP
        };
      }),

      // Active temporary run upgrades drafted by leveling up
      runUpgrades: {
        hp: 0,
        damage: 0,
        speed: 0,
        atkSpeed: 0,
        atkRange: 0
      },
      /**
       * Applies a temporary stat upgrade chosen from the level-up card selection.
       * Decrements the pending levels counter, and returns to normal gameplay if no choices remain.
       */
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
      // Ensure only meta-progression, custom user settings, and selected equipment persist across sessions
      partialize: (state) => ({
        upgrades: state.upgrades,
        settings: state.settings,
        selectedWeapons: state.selectedWeapons,
      }),
    }
  )
);
