import type { Player } from './entities/player/Player';

export type Vector2 = { x: number; y: number };

export enum EntityType {
  PLAYER,
  ENEMY,
  PROJECTILE,
  BOSS,
  PICKUP,
  ENVIRONMENT,
  SPECIAL_ENEMY,
  ELITE_ENEMY,
  SANDBOX_DUMMY,
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector2;
  vel: Vector2;
  radius: number;
  color: string;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  isDead: boolean;
  invulnTimer?: number;
  update(dt: number, game: GameState): void;
  draw(ctx: CanvasRenderingContext2D, camera: Camera): void;
  applyKnockback(dir: Vector2, force: number): void;
  takeDamage(amt: number, game: GameState): void;
  heal(amt: number): void;
}

export interface Camera {
  pos: Vector2;
  width: number;
  height: number;
}

export interface GameState {
  player: Player;
  entities: Entity[];
  particles: Particle[];
  width: number;
  height: number;
  level: number;
  biome: number;
  time: number;
  runTime: number;
  enemiesToSpawn: number;
  stageAnnouncementTimer: number;
  mousePos: Vector2;
  mouseScreenPos: Vector2;
  isMouseDown: boolean;
  mouseRightDown: boolean;
  keys: Record<string, boolean>;
  skipForceComplete?: boolean;
  addEntity: (e: Entity) => void;
  removeEntity: (id: string) => void;
  spawnParticles: (pos: Vector2, count: number, color: string) => void;
  floatingTexts: FloatingText[];
  addFloatingText: (text: string, pos: Vector2, color: string, groupType?: string, value?: number) => void;
  onGainAmmo: (amount: number) => void;
  onUseAmmo: () => boolean;
  onGainXp: (amount: number, isDirect?: boolean) => void;
  onGainCurrency: (amount: number) => void;
}

export interface FloatingText {
  id: string;
  text: string;
  pos: Vector2;
  vel: Vector2;
  color: string;
  life: number;
  maxLife: number;
  groupType?: string;
  groupValue?: number;
  displayValue?: number;
}

export interface Particle {
  pos: Vector2;
  vel: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export type PermanentUpgrades = {
  health: number;
  damage: number;
  speed: number;
  range: number;
  currency: number;
};

export type RunStats = {
  level: number;
  playerLevel: number;
  biome: number;
  xp: number;
  xpToNext: number;
  pendingLevelUps: number;
  currencyEarned: number;
  ammo: number;
  bossKills: number;
};

export interface RangedWeaponState {
  id: string;
  charges?: number;
  maxCharges?: number;
  chargeTimer?: number;
  chargeCooldown?: number;
}

export interface GameSettingsState {
  showDmgNotif?: boolean;
  showDropNotif?: boolean;
  showExpNotif?: boolean;
  autoSkipWave?: boolean;
  bgmVolume?: number;
  uiSfxVolume?: number;
  gameplaySfxVolume?: number;
}

declare global {
  interface Window {
    currentPlayerHp?: { current: number; max: number } | null;
    currentBossHp?: { current: number; max: number; color?: string } | null;
    currentStageTimeRemaining?: number;
    currentStageTimeMax?: number;
    currentRunTime?: number;
    canSkipWave?: boolean;
    isBossStage?: boolean;
    currentRangedWeaponState?: RangedWeaponState | null;
    gameSettings?: GameSettingsState;
    webkitAudioContext?: typeof AudioContext;
  }
}
