import { useStore, GameStage } from '../store';

let audioCtx: AudioContext | null = null;
let uiGainNode: GainNode | null = null;
let gameplayGainNode: GainNode | null = null;

const getOscillator = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    if (!uiGainNode) {
        uiGainNode = audioCtx.createGain();
        uiGainNode.connect(audioCtx.destination);
    }
    if (!gameplayGainNode) {
        gameplayGainNode = audioCtx.createGain();
        gameplayGainNode.connect(audioCtx.destination);
    }
    
    // Dynamically update volumes on the sub-mix channels
    try {
        const settings = useStore.getState().settings;
        uiGainNode.gain.setValueAtTime((settings.uiSfxVolume ?? 100) / 100, audioCtx.currentTime);
        gameplayGainNode.gain.setValueAtTime((settings.gameplaySfxVolume ?? 100) / 100, audioCtx.currentTime);
    } catch (e) {
        uiGainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gameplayGainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    }

    return audioCtx;
};

export const getDestination = (isUi: boolean = false): AudioNode => {
    const ctx = getOscillator();
    if (isUi) {
        return uiGainNode || ctx.destination;
    } else {
        return gameplayGainNode || ctx.destination;
    }
};

export const updateSfxVolumes = () => {
    if (audioCtx && uiGainNode && gameplayGainNode) {
        try {
            const settings = useStore.getState().settings;
            uiGainNode.gain.setValueAtTime((settings.uiSfxVolume ?? 100) / 100, audioCtx.currentTime);
            gameplayGainNode.gain.setValueAtTime((settings.gameplaySfxVolume ?? 100) / 100, audioCtx.currentTime);
        } catch (e) {}
    }
};

export const playSabreSfx = (speedMod: number = 1) => {
    try {
        const ctx = getOscillator();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const duration = Math.max(0.05, 0.15 * speedMod);
        const peakTime = duration * 0.2;

        // frequency sweep from 400 to 100 for a deeper whoosh
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration);
        
        // white noise buffer for whoosh
        const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        
        // Lowpass filter for the noise
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(300, ctx.currentTime + duration);
        
        // Envelope for noise
        noiseGain.gain.setValueAtTime(0, ctx.currentTime);
        noiseGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + peakTime);
        noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
        
        // Envelope for oscillator
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + peakTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(getDestination(false));
        
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(getDestination(false));
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
        noise.start(ctx.currentTime);
    } catch (e) {
        console.warn('Audio play failed', e);
    }
};

export const playSabreReverseSfx = (speedMod: number = 1) => {
    try {
        const ctx = getOscillator();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const duration = Math.max(0.05, 0.15 * speedMod);
        const peakTime = duration * 0.8;

        // frequency sweep from 100 to 400 for a reverse whoosh
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + duration);
        
        // white noise buffer for whoosh
        const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        
        // Lowpass filter for the noise
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(1500, ctx.currentTime + duration);
        
        // Envelope for noise
        noiseGain.gain.setValueAtTime(0, ctx.currentTime);
        noiseGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + peakTime);
        noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
        
        // Envelope for oscillator
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + peakTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(getDestination(false));
        
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(getDestination(false));
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
        noise.start(ctx.currentTime);
    } catch (e) {
        console.warn('Audio play failed', e);
    }
};

export const playBowSfx = () => {
    try {
        const ctx = getOscillator();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.15);
        
        // Snap noise
        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.1, ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(getDestination(false));

        noise.connect(noiseGain);
        noiseGain.connect(getDestination(false));
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
        noise.start(ctx.currentTime);
    } catch (e) {
        console.warn('Audio play failed', e);
    }
};

export const playLevelUpSfx = () => {
    try {
        const ctx = getOscillator();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'square';

        const t = ctx.currentTime;
        osc1.frequency.setValueAtTime(440, t);
        osc1.frequency.setValueAtTime(554.37, t + 0.1);
        osc1.frequency.setValueAtTime(659.25, t + 0.2);
        osc1.frequency.setValueAtTime(880, t + 0.3);

        osc2.frequency.setValueAtTime(440, t); 
        osc2.frequency.setValueAtTime(554.37, t + 0.1); 
        osc2.frequency.setValueAtTime(659.25, t + 0.2); 
        osc2.frequency.setValueAtTime(880, t + 0.3); 

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.04, t + 0.05);
        gain.gain.setValueAtTime(0.04, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(getDestination(false));

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.6);
        osc2.stop(t + 0.6);
    } catch (e) {}
};

export const playHoverSfx = () => {
    try {
        const ctx = getOscillator();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(getDestination(true));
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
};

export const playClickSfx = () => {
    try {
        const ctx = getOscillator();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(getDestination(true));
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
};

export const playBossDropSfx = () => {
    try {
        const ctx = getOscillator();
        
        // Impact oscillator (Thud)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        
        const t = ctx.currentTime;
        
        // Pitch drop for heavy feel
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 0.4);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(1.0, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        
        // Filter to remove harsh highs and keep it bassy
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, t);
        filter.frequency.exponentialRampToValueAtTime(50, t + 0.5);

        // Rumble noise (bugghhhh)
        const bufferSize = ctx.sampleRate * 0.8;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, t);
        noiseGain.gain.linearRampToValueAtTime(0.8, t + 0.05);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        // start somewhat low, then drop it so it sounds like a bass rumble
        noiseFilter.frequency.setValueAtTime(400, t);
        noiseFilter.frequency.exponentialRampToValueAtTime(40, t + 0.8);

        // Connections
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(getDestination(false));

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(getDestination(false));

        osc.start(t);
        osc.stop(t + 0.5);
        noise.start(t);
        noise.stop(t + 0.8);
    } catch (e) {}
};

export const playHitSfx = () => {
    try {
        const ctx = getOscillator();
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        
        noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.1);

        noise.connect(noiseGain);
        noiseGain.connect(getDestination(false));
        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + 0.1);
    } catch (e) {}
};

export const playPlayerHitSfx = () => {
    try {
        const ctx = getOscillator();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        const t = ctx.currentTime;
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.connect(gain);
        gain.connect(getDestination(false));
        osc.start(t);
        osc.stop(t + 0.15);
    } catch (e) {}
};

export const playGoldPickupSfx = () => {
    try {
        const ctx = getOscillator();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const t = ctx.currentTime;
        osc.frequency.setValueAtTime(987.77, t); // B5
        osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.connect(gain);
        gain.connect(getDestination(false));
        osc.start(t);
        osc.stop(t + 0.3);
    } catch (e) {}
};

export const playGameOverSfx = () => {
    try {
        const ctx = getOscillator();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';

        const t = ctx.currentTime;
        osc1.frequency.setValueAtTime(200, t);
        osc1.frequency.exponentialRampToValueAtTime(20, t + 1);
        osc2.frequency.setValueAtTime(190, t);
        osc2.frequency.exponentialRampToValueAtTime(15, t + 1);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 1);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(getDestination(false));

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 1);
        osc2.stop(t + 1);
    } catch (e) {}
};

export const playBossSpreadSfx = () => {
    try {
        const ctx = getOscillator();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        const t = ctx.currentTime;
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.4);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.4);
        
        osc.connect(gain);
        gain.connect(getDestination(false));
        osc.start(t);
        osc.stop(t + 0.4);
    } catch (e) {}
};

export const playPlasmaSfx = () => {
    try {
        const ctx = getOscillator();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(getDestination(false));
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
};

export const playPlasmaCritSfx = () => {
    try {
        const ctx = getOscillator();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'square';
        osc2.type = 'sawtooth';
        
        osc1.frequency.setValueAtTime(800, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.15);
        osc2.frequency.setValueAtTime(1000, ctx.currentTime);
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.15);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(getDestination(false));
        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.15);
        osc2.stop(ctx.currentTime + 0.15);
    } catch(e) {}
};

export const playHammerSmashSfx = (passiveActive: boolean = false) => {
    try {
        const ctx = getOscillator();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(passiveActive ? 95 : 75, t);
        osc.frequency.exponentialRampToValueAtTime(24, t + 0.35);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, t);
        filter.frequency.exponentialRampToValueAtTime(70, t + 0.35);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(passiveActive ? 0.36 : 0.26, t + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.42);

        const duration = passiveActive ? 0.45 : 0.28;
        const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const n = Math.random() * 2 - 1;
            const env = Math.exp(-(i / bufferSize) * 8);
            data[i] = n * env;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(500, t);
        noiseGain.gain.setValueAtTime(passiveActive ? 0.28 : 0.18, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.005, t + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(getDestination(false));
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(getDestination(false));

        osc.start(t);
        osc.stop(t + 0.42);
        noise.start(t);
        noise.stop(t + duration);
    } catch(e) {}
};

export const playHandCannonSfx = (charges: number = 1) => {
    try {
        const ctx = getOscillator();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'square';
        osc.frequency.setValueAtTime(260 + charges * 90, t);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.22);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600 + charges * 250, t);
        filter.frequency.exponentialRampToValueAtTime(260, t + 0.22);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.08 + charges * 0.035, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.24);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(getDestination(false));
        osc.start(t);
        osc.stop(t + 0.24);
    } catch(e) {}
};

export const playHandCannonChargeSfx = () => {
    try {
        const ctx = getOscillator();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(980, t + 0.12);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.045, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.14);
        osc.connect(gain);
        gain.connect(getDestination(false));
        osc.start(t);
        osc.stop(t + 0.14);
    } catch(e) {}
};

let rapidFireSource: AudioBufferSourceNode | null = null;

export const startBossRapidFireLoopSfx = () => {
    try {
        if (rapidFireSource) return;
        const ctx = getOscillator();
        
        const duration = 4 / 36; // exact time between shots based on Boss.ts
        const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            const t = i / ctx.sampleRate;
            const freq = 500 * Math.exp(-t * 20); 
            const wave = Math.sin(2 * Math.PI * freq * t);
            // soften attack and decay
            let env = 1.0;
            if (t < 0.02) {
                env = t / 0.02; // attack
            } else {
                env = Math.exp(-(t - 0.02) * 30); // decay
            }
            data[i] = wave * env * 0.1;
        }
        
        rapidFireSource = ctx.createBufferSource();
        rapidFireSource.buffer = buffer;
        rapidFireSource.loop = true;
        
        rapidFireSource.connect(getDestination(false));
        rapidFireSource.start();
    } catch (e) {}
};

export const stopBossRapidFireLoopSfx = () => {
    try {
        if (rapidFireSource) {
            rapidFireSource.stop();
            rapidFireSource.disconnect();
            rapidFireSource = null;
        }
    } catch (e) {}
};

// --- BACKGROUND MUSIC (BGM) MANAGER ---
let currentBgm: HTMLAudioElement | null = null;
let currentBgmType: 'HUB' | 'IN_GAME' | 'BOSS' | null = null;
let playlist: string[] = [];
let playlistIndex: number = 0;
let fadeInInterval: any = null;
const TARGET_VOLUME = 0.4; // 40% volume for background music

export const getBgmTargetVolume = (): number => {
    try {
        const bgmVol = useStore.getState().settings.bgmVolume ?? 50;
        return (bgmVol / 100) * TARGET_VOLUME;
    } catch (e) {
        return 0.5 * TARGET_VOLUME;
    }
};

export const updateBgmVolume = () => {
    if (currentBgm) {
        try {
            currentBgm.volume = getBgmTargetVolume();
        } catch (e) {}
    }
};

// Subscribe to store settings to handle dynamic volume changes immediately
try {
    useStore.subscribe((state) => {
        updateSfxVolumes();
        updateBgmVolume();
    });
} catch (e) {
    console.warn('Failed to subscribe to volume settings changes:', e);
}

const fadeIn = (audio: HTMLAudioElement, durationMs: number = 3000) => {
    if (fadeInInterval) {
        clearInterval(fadeInInterval);
    }
    audio.volume = 0;
    const startTime = performance.now();
    fadeInInterval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const ratio = Math.min(1, elapsed / durationMs);
        const currentTarget = getBgmTargetVolume();
        audio.volume = ratio * currentTarget;
        if (ratio >= 1) {
            clearInterval(fadeInInterval);
            fadeInInterval = null;
        }
    }, 50);
};

export const stopAllBgm = () => {
    if (fadeInInterval) {
        clearInterval(fadeInInterval);
        fadeInInterval = null;
    }
    if (currentBgm) {
        try {
            currentBgm.pause();
            currentBgm.currentTime = 0;
            currentBgm.onended = null;
            currentBgm.onerror = null;
        } catch (e) {
            console.warn('Failed to stop BGM:', e);
        }
        currentBgm = null;
    }
    currentBgmType = null;
};

export const shuffleInGamePlaylist = () => {
    const tracks = [
        '/music/ingame_bgm_1.mp3',
        '/music/ingame_bgm_2.mp3',
        '/music/ingame_bgm_3.mp3'
    ];
    // Fisher-Yates shuffle
    for (let i = tracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = tracks[i];
        tracks[i] = tracks[j];
        tracks[j] = temp;
    }
    playlist = tracks;
    playlistIndex = 0;
    console.log('Shuffled in-game BGM playlist:', playlist);
};

export const updateBgmState = (stage: GameStage, level: number) => {
    try {
        if (stage === GameStage.HUB) {
            if (currentBgmType === 'HUB') return;
            stopAllBgm();
            
            const audio = new Audio('/music/hub_bgm_1.mp3');
            audio.loop = true;
            currentBgm = audio;
            currentBgmType = 'HUB';
            
            audio.play().catch(err => console.log('BGM playback blocked/failed', err));
            fadeIn(audio);
        } else if (stage === GameStage.PLAYING || stage === GameStage.LEVEL_UP) {
            const isBoss = level % 10 === 0;
            if (isBoss) {
                if (currentBgmType === 'BOSS') return;
                stopAllBgm();
                
                const audio = new Audio('/music/boss_bgm_1.mp3');
                audio.loop = true;
                currentBgm = audio;
                currentBgmType = 'BOSS';
                
                audio.play().catch(err => console.log('BGM playback blocked/failed', err));
                fadeIn(audio);
            } else {
                if (currentBgmType === 'IN_GAME') return;
                stopAllBgm();
                
                if (playlist.length === 0) {
                    shuffleInGamePlaylist();
                }
                
                currentBgmType = 'IN_GAME';
                
                let loadFailCount = 0;
                const playPlaylistTrack = () => {
                    if (fadeInInterval) {
                        clearInterval(fadeInInterval);
                        fadeInInterval = null;
                    }
                    if (currentBgm) {
                        try {
                            currentBgm.pause();
                            currentBgm.currentTime = 0;
                            currentBgm.onended = null;
                            currentBgm.onerror = null;
                        } catch (e) {}
                    }
                    
                    if (playlist.length === 0) return;
                    const trackPath = playlist[playlistIndex];
                    const audio = new Audio(trackPath);
                    audio.loop = false;
                    audio.onended = () => {
                        loadFailCount = 0;
                        playlistIndex = (playlistIndex + 1) % playlist.length;
                        playPlaylistTrack();
                    };
                    audio.onerror = () => {
                        console.warn(`BGM track failed to load: ${trackPath}. Skipping to next track.`);
                        loadFailCount++;
                        if (loadFailCount < playlist.length) {
                            playlistIndex = (playlistIndex + 1) % playlist.length;
                            playPlaylistTrack();
                        }
                    };
                    
                    currentBgm = audio;
                    audio.play().then(() => {
                        loadFailCount = 0;
                    }).catch(err => {
                        console.log('BGM playlist playback blocked/failed', err);
                        if (audio.error) {
                            loadFailCount++;
                            if (loadFailCount < playlist.length) {
                                playlistIndex = (playlistIndex + 1) % playlist.length;
                                playPlaylistTrack();
                            }
                        }
                    });
                    fadeIn(audio);
                };
                
                playPlaylistTrack();
            }
        } else {
            // GAME_OVER, VICTORY, etc.
            stopAllBgm();
        }
    } catch (e) {
        console.warn('Error in updateBgmState:', e);
    }
};
