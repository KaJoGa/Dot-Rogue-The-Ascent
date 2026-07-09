import { GameState } from './types';
import { Boss, EliteEnemy, SandboxDummy, WeaponProp } from './entities';
import { useStore } from '../store';

const NORMAL_WORLD_WIDTH = 1700;
const NORMAL_WORLD_HEIGHT = 1300;
const BOSS_RUSH_WORLD_SIZE = 2000;

export const generateLevel = (state: GameState) => {
    const isBossRush = useStore.getState().isBossRush;
    const isSandbox = useStore.getState().isSandbox;

    // Keep world dimensions stable across stage transitions.
    if (isBossRush) {
        state.width = BOSS_RUSH_WORLD_SIZE;
        state.height = BOSS_RUSH_WORLD_SIZE;
        // Keep the player somewhat near the center where bosses spawn
        if (state.level === 1) {
             state.player.pos = { x: state.width / 2, y: state.height / 2 + 300 };
        }
    } else {
        state.width = NORMAL_WORLD_WIDTH;
        state.height = NORMAL_WORLD_HEIGHT;
    }
    
    const mapCenter = { x: state.width / 2, y: state.height / 2 };
    state.enemiesToSpawn = 0;
    state.stageAnnouncementTimer = 3;
    // Removed state.entities = []; to allow entities (enemies/pickups) to persist across stages
    
    if (isSandbox) {
        state.addEntity(new WeaponProp({ x: mapCenter.x - 450, y: mapCenter.y - 200 }, 'heavy_hammer'));
        state.addEntity(new WeaponProp({ x: mapCenter.x - 150, y: mapCenter.y - 200 }, 'sabre'));
        state.addEntity(new WeaponProp({ x: mapCenter.x + 150, y: mapCenter.y - 200 }, 'plasma_dagger'));
        state.addEntity(new SandboxDummy(mapCenter));
    } else if (state.level % 10 === 0 || isBossRush) {
        // Boss floor
        const boss = new Boss(mapCenter, state.level);
        state.addEntity(boss);
    } else {
        // Regular enemies spawned overtime
        state.enemiesToSpawn = 5 + (state.level - 1) * 3;
    }
}
