/**
 * JUNGLE ZOMBIE SURVIVAL - Procedural Sound Effects & Audio Engine
 * Uses Web Audio API to procedurally generate all sound effects
 * (pistol, shotgun blast, assault rifle burst, reloads, zombie human groans & attacks,
 * boss roar, jungle ambiance with birds & cicadas, puzzle clicks & success chimes,
 * footsteps on grass/mud, hitmarkers, health & key pickups).
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.ambientGain = null;
        this.ambientFilter = null;
        this.isAmbiencePlaying = false;
        this.birdTimer = null;
    }

    init() {
        if (this.ctx) {
            this.resume();
            return;
        }
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.ambientGain = this.ctx.createGain();
            this.ambientGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
            this.ambientGain.connect(this.masterGain);

            this.startJungleAmbience();
        } catch (e) {
            console.warn("AudioContext init error:", e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // --- JUNGLE AMBIENCE: BREEZE, CICADAS, PROCEDURAL BIRD CALLS ---
    startJungleAmbience() {
        if (!this.ctx || this.isAmbiencePlaying) return;
        this.isAmbiencePlaying = true;
        const now = this.ctx.currentTime;

        // 1. Warm Jungle Breeze Drone
        this.ambientFilter = this.ctx.createBiquadFilter();
        this.ambientFilter.type = 'lowpass';
        this.ambientFilter.frequency.setValueAtTime(280, now);

        const oscBreeze1 = this.ctx.createOscillator();
        oscBreeze1.type = 'sine';
        oscBreeze1.frequency.setValueAtTime(55, now);

        const oscBreeze2 = this.ctx.createOscillator();
        oscBreeze2.type = 'triangle';
        oscBreeze2.frequency.setValueAtTime(82, now);

        oscBreeze1.connect(this.ambientFilter);
        oscBreeze2.connect(this.ambientFilter);
        this.ambientFilter.connect(this.ambientGain);

        oscBreeze1.start();
        oscBreeze2.start();

        // 2. High-Frequency Tropical Cicadas / Crickets
        const cicadaGain = this.ctx.createGain();
        cicadaGain.gain.setValueAtTime(0.04, now);
        cicadaGain.connect(this.ambientGain);

        const cicadaFilter = this.ctx.createBiquadFilter();
        cicadaFilter.type = 'bandpass';
        cicadaFilter.frequency.setValueAtTime(4500, now);
        cicadaFilter.Q.setValueAtTime(8.0, now);
        cicadaFilter.connect(cicadaGain);

        const cicadaOsc = this.ctx.createOscillator();
        cicadaOsc.type = 'sawtooth';
        cicadaOsc.frequency.setValueAtTime(4200, now);
        cicadaOsc.connect(cicadaFilter);
        cicadaOsc.start();

        // 3. Periodic Tropical Bird Chirps
        const scheduleBirdChirp = () => {
            if (!this.ctx || !this.isAmbiencePlaying) return;
            const delay = 4000 + Math.random() * 8000;
            this.birdTimer = setTimeout(() => {
                this.playBirdChirp();
                scheduleBirdChirp();
            }, delay);
        };
        scheduleBirdChirp();
    }

    playBirdChirp() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const baseFreq = 2200 + Math.random() * 800;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.1, now + 0.16);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ambientGain);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    // --- WEAPONS SOUNDS ---

    // 1. Pistol: Crisp punchy 9mm crack
    playPistol() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Sharp noise transient
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.08));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.9, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);

        // Low kick pop
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.8, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // 2. Shotgun: Thunderous heavy boom + mechanical pump click
    playShotgun() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Heavy explosive boom
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.35);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(1.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);

        // Deep sub-bass thud
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.28);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(1.1, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.32);

        // Mechanical pump-action slide click after 0.28s
        setTimeout(() => {
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            const clickOsc = this.ctx.createOscillator();
            clickOsc.type = 'square';
            clickOsc.frequency.setValueAtTime(700, t);
            clickOsc.frequency.setValueAtTime(450, t + 0.05);

            const clickGain = this.ctx.createGain();
            clickGain.gain.setValueAtTime(0.2, t);
            clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

            clickOsc.connect(clickGain);
            clickGain.connect(this.masterGain);
            clickOsc.start(t);
            clickOsc.stop(t + 0.12);
        }, 280);
    }

    // 3. Assault Rifle: Snappy rapid military carbine crack
    playRifle() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        const bufferSize = Math.floor(this.ctx.sampleRate * 0.14);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.07));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1800, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(1.0, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);

        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.09);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.7, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.11);
    }

    // Backward-compatible playGunshot
    playGunshot(weaponType = 'pistol') {
        if (weaponType === 'shotgun') this.playShotgun();
        else if (weaponType === 'rifle') this.playRifle();
        else this.playPistol();
    }

    // Reload sound
    playReload() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Magazine slide eject -> insert -> slide lock
        [0.0, 0.28, 0.62].forEach((offset, idx) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(idx === 1 ? 550 : (idx === 2 ? 880 : 720), now + offset);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.3, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + offset);
            osc.stop(now + offset + 0.11);
        });
    }

    // --- ZOMBIE & BOSS SOUNDS ---

    // Realistic infected human groans & snarls
    playZombieGrowl(isBoss = false) {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        const baseFreq = isBoss ? 50 : (100 + Math.random() * 45);
        const dur = isBoss ? 1.1 : 0.48;

        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.linearRampToValueAtTime(baseFreq * (isBoss ? 0.6 : 0.75), now + dur);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isBoss ? 210 : 360, now);
        filter.Q.setValueAtTime(4.0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(isBoss ? 0.85 : 0.38, now + 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + dur + 0.05);
    }

    // Boss heavy battle roar
    playBossRoar() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(42, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + 1.4);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 1.55);
    }

    // Zombie hit impact thud
    playZombieHit() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(48, now + 0.1);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    // Player damage hurt grunt
    playPlayerHurt() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(170, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.22);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.26);
    }

    // Footstep on jungle dirt / leaves
    playFootstep() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        const dur = 0.055;
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(360, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(now);
    }

    // --- PUZZLE SOUNDS ---

    // Combination dial click
    playPuzzleClick() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(950, now + 0.02);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.07);
    }

    // Puzzle Solved mystery fanfare
    playPuzzleSuccess() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Ascending harmonic chime: C5, E5, G5, C6
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.38, now + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.6);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.65);
        });
    }

    // --- PICKUPS & GATE ---

    playPickup(type = 'item') {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        let notes = [523.25, 659.25, 783.99]; // Item
        if (type === 'key') {
            notes = [587.33, 739.99, 880.0, 1174.66]; // Key
        } else if (type === 'health') {
            notes = [440.0, 554.37, 659.25]; // Health
        } else if (type === 'weapon') {
            notes = [392.0, 493.88, 587.33, 783.99]; // Weapon
        }

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.32, now + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.26);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.28);
        });
    }

    playGateUnlock() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        [392.0, 523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.09);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.35, now + idx * 0.09);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.45);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + idx * 0.09);
            osc.stop(now + idx * 0.09 + 0.5);
        });
    }

    playWin() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        [523.25, 659.25, 783.99, 1046.5].forEach(freq => {
            const osc = this.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 2.7);
        });
    }

    playGameOver() {
        if (!this.ctx || this.isMuted) return;
        this.resume();
        const now = this.ctx.currentTime;

        [140, 115, 90].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.35);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.45, now + idx * 0.35);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.35 + 0.85);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + idx * 0.35);
            osc.stop(now + idx * 0.35 + 0.9);
        });
    }
}

window.soundEngine = new SoundEngine();

