/**
 * LAST LIGHT: Escape the Infected City
 * main.js - Core 3D Third-Person Game Engine & State Orchestration
 * 
 * Coordinates Three.js rendering, third-person player controller,
 * interactive searching with progress bar, zombie AI & horde pressure,
 * sound synthesizer, survivor journal [J], and level progression.
 */

import * as THREE from './three.module.js';
import { AudioManager } from './audio.js';
import { Player } from './player.js';
import { ZombieManager } from './zombie.js';
import { Level } from './level.js';
import { UIManager } from './ui.js';

class InputController {
    constructor(canvas) {
        this.canvas = canvas;
        this.keysDown = {};
        this.keysPressed = {};
        this.mouseButtonsPressed = {};
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        this.isPointerLocked = false;

        this.setupListeners();
    }

    setupListeners() {
        this.canvas.addEventListener('click', () => {
            if (window.game && window.game.audio) window.game.audio.init();
            if (document.pointerLockElement !== this.canvas) {
                this.canvas.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = (document.pointerLockElement === this.canvas);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.mouseDeltaX += e.movementX;
                this.mouseDeltaY += e.movementY;
            }
        });

        document.addEventListener('mousedown', (e) => {
            if (window.game && window.game.audio) window.game.audio.init();
            this.mouseButtonsPressed[e.button] = true;
        });

        document.addEventListener('keydown', (e) => {
            if (!this.keysDown[e.code]) {
                this.keysPressed[e.code] = true;
            }
            this.keysDown[e.code] = true;

            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keysDown[e.code] = false;
        });

        window.addEventListener('wheel', () => {
            if (window.game && window.game.player) {
                window.game.player.cycleWeapon();
            }
        }, { passive: true });
    }

    isKeyDown(code) {
        return !!this.keysDown[code];
    }

    wasKeyPressed(code) {
        return !!this.keysPressed[code] || 
               !!this.keysPressed[`Key${code.toUpperCase()}`] || 
               !!this.keysPressed[`Digit${code}`];
    }

    wasMouseButtonPressed(btn = 0) {
        return !!this.mouseButtonsPressed[btn];
    }

    resetFrame() {
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        this.keysPressed = {};
        this.mouseButtonsPressed = {};
    }
}

class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    spawnBlood(x, y, z, count = 16) {
        for (let i = 0; i < count; i++) {
            const geom = new THREE.BoxGeometry(0.06, 0.06, 0.06);
            const mat = new THREE.MeshBasicMaterial({ color: Math.random() < 0.4 ? 0x880a0a : 0xb30000 });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(x, y, z);
            this.scene.add(mesh);

            const speed = 1.5 + Math.random() * 4.0;
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                mesh,
                vx: Math.cos(angle) * speed,
                vy: (Math.random() - 0.2) * 3.0,
                vz: Math.sin(angle) * speed,
                life: 0.6 + Math.random() * 0.4
            });
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            p.mesh.position.x += p.vx * dt;
            p.mesh.position.y += p.vy * dt;
            p.mesh.position.z += p.vz * dt;
            p.vy -= 9.8 * dt;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }
    }
}

export class GameEngine {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        window.addEventListener('resize', () => this.onResize());

        this.input = new InputController(this.canvas);
        this.audio = new AudioManager();
        this.ui = new UIManager();
        this.particles = new ParticleSystem(this.scene);

        // Core Game State
        this.state = 'PROLOGUE';
        this.currentLevelNumber = 1;
        this.level = null;
        this.player = null;
        this.zombieManager = new ZombieManager(this.scene);

        this.levelTimeLeft = 180;
        this.totalScore = 0;
        this.levelZombiesKilled = 0;
        this.searchAudioCooldown = 0;

        // Active searchable object being searched
        this.activeSearchTarget = null;

        this.lastFrameTime = performance.now();
        this.setupEventListeners();
    }

    onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    setupEventListeners() {
        // Prologue Start
        const startBtn = document.getElementById('btn-start-game');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.audio.init();
                const modal = document.getElementById('prologue-modal');
                if (modal) modal.classList.add('hidden');
                this.loadLevel(1);
            });
        }

        // Pause Menu
        const resumeBtn = document.getElementById('btn-resume');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.togglePause(false));
        }

        const soundBtn = document.getElementById('btn-toggle-sound');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                const muted = this.audio.toggleMute();
                soundBtn.innerText = muted ? 'UNMUTE SOUND' : 'MUTE SOUND';
            });
        }

        // Close Journal Button
        const closeJournalBtn = document.getElementById('btn-close-journal');
        if (closeJournalBtn) {
            closeJournalBtn.addEventListener('click', () => {
                this.ui.toggleJournal(this.player, false);
                this.state = 'PLAYING';
            });
        }
    }

    initGame() {
        // Run cinematic intro
        this.ui.startTypewriterIntro();
        this.startLoop();
    }

    loadLevel(num) {
        this.currentLevelNumber = num;

        // Cleanup previous
        if (this.level) this.level.dispose();
        this.zombieManager.clear();

        // Build 3D Level
        this.level = new Level(this.scene, num);
        this.levelTimeLeft = this.level.timeLimit;
        this.levelZombiesKilled = 0;

        // Set Fog & Clear Color
        this.scene.fog = new THREE.Fog(this.level.fogColor, this.level.fogNear, this.level.fogFar);
        this.renderer.setClearColor(this.level.fogColor);

        // Realistic Lighting
        if (!this.directionalLight) {
            this.directionalLight = new THREE.DirectionalLight(0xaaccff, 0.65);
            this.directionalLight.position.set(20, 40, 20);
            this.scene.add(this.directionalLight);

            this.ambientLight = new THREE.AmbientLight(0x242d38, 0.45);
            this.scene.add(this.ambientLight);
        }

        // Player instance
        if (!this.player) {
            this.player = new Player(this.scene, this.camera);
        } else {
            this.player.keys = 0;
            this.player.cluesFound = [];
        }
        this.player.resetPosition(this.level.playerSpawn.x, 0, this.level.playerSpawn.z);

        // Load Level Zombies
        this.zombieManager.loadZombies(this.level.zombieSpawns);

        this.state = 'PLAYING';
        this.ui.showToast(`ENTERED: ${this.level.name.toUpperCase()} — FIND ${this.level.gateRequiredKeys} KEYS TO ESCAPE`, '#00e5ff');
    }

    recordZombieKilled(type) {
        this.levelZombiesKilled++;
        const pts = (type === 'boss' ? 600 : (type === 'brute' ? 150 : (type === 'runner' ? 80 : 50)));
        this.totalScore += pts;
        this.ui.showToast(`+${pts} PTS: INFECTED ELIMINATED!`, '#2ecc71');
    }

    togglePause(forceState = null) {
        if (this.state !== 'PLAYING' && this.state !== 'PAUSED') return;

        const isPaused = forceState !== null ? forceState : (this.state !== 'PAUSED');
        this.state = isPaused ? 'PAUSED' : 'PLAYING';
        this.ui.togglePause(isPaused);

        if (isPaused && document.exitPointerLock) {
            document.exitPointerLock();
        } else if (!isPaused && this.canvas.requestPointerLock) {
            this.canvas.requestPointerLock();
        }
    }

    triggerGameOver(reason) {
        this.state = 'GAME_OVER';
        if (document.exitPointerLock) document.exitPointerLock();
        this.audio.playGameOver();
        this.ui.showGameOver(reason, () => {
            this.loadLevel(this.currentLevelNumber);
        });
    }

    completeLevel() {
        this.state = 'LEVEL_CLEAR';
        if (document.exitPointerLock) document.exitPointerLock();
        this.audio.playVictory();

        // Calculate score
        const timePoints = Math.max(0, Math.floor(this.levelTimeLeft) * 10);
        const healthPoints = Math.floor(this.player.health) * 5;
        const zombiePoints = this.levelZombiesKilled * 50;
        const cluePoints = this.player.cluesFound.length * 100;
        const levelScore = timePoints + healthPoints + zombiePoints + cluePoints;
        this.totalScore += levelScore;

        const searchedCount = this.level.searchables.filter(s => s.isSearched).length;

        const stats = {
            levelNumber: this.currentLevelNumber,
            timeLeft: this.levelTimeLeft,
            timeLeftRatio: this.levelTimeLeft / this.level.timeLimit,
            health: this.player.health,
            healthRatio: this.player.health / this.player.maxHealth,
            timePoints,
            healthPoints,
            keysHeld: this.player.keys,
            requiredKeys: this.level.gateRequiredKeys,
            cluesFound: this.player.cluesFound.length,
            zombiesKilled: this.levelZombiesKilled,
            zombiePoints,
            searchedRatio: searchedCount / this.level.searchables.length,
            finalScore: levelScore
        };

        this.ui.showLevelClear(stats, () => {
            if (this.currentLevelNumber < 3) {
                this.loadLevel(this.currentLevelNumber + 1);
            } else {
                this.state = 'VICTORY';
                this.audio.playVictory();
                this.ui.showVictory(this.totalScore, () => {
                    this.totalScore = 0;
                    this.loadLevel(1);
                });
            }
        });
    }

    startLoop() {
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    gameLoop(ts) {
        const dt = Math.min((ts - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = ts;

        this.update(dt);
        this.render();

        this.input.resetFrame();
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    update(dt) {
        // Pause toggle
        if (this.input.wasKeyPressed('Escape')) {
            if (this.state === 'JOURNAL') {
                this.ui.toggleJournal(this.player, false);
                this.state = 'PLAYING';
            } else {
                this.togglePause();
            }
        }

        // Journal toggle [J]
        if (this.input.wasKeyPressed('KeyJ') || this.input.wasKeyPressed('j')) {
            if (this.state === 'PLAYING') {
                this.state = 'JOURNAL';
                if (document.exitPointerLock) document.exitPointerLock();
                this.ui.toggleJournal(this.player, true);
            } else if (this.state === 'JOURNAL') {
                this.state = 'PLAYING';
                if (this.canvas.requestPointerLock) this.canvas.requestPointerLock();
                this.ui.toggleJournal(this.player, false);
            }
        }

        if (this.state !== 'PLAYING') {
            this.ui.update(dt);
            return;
        }

        // Level Countdown Timer
        this.levelTimeLeft -= dt;
        if (this.levelTimeLeft <= 0) {
            this.levelTimeLeft = 0;
            this.triggerGameOver('Time expired! City perimeter sterilized.');
            return;
        }

        // Weapon switching (1, 2, 3 or Q)
        if (this.input.wasKeyPressed('1')) this.player.selectWeapon('bat');
        if (this.input.wasKeyPressed('2')) this.player.selectWeapon('pistol');
        if (this.input.wasKeyPressed('3')) this.player.selectWeapon('flare');
        if (this.input.wasKeyPressed('q') || this.input.wasKeyPressed('Q')) this.player.cycleWeapon();

        // Flashlight toggle (F)
        if (this.input.wasKeyPressed('f') || this.input.wasKeyPressed('F')) {
            this.player.toggleFlashlight(this.audio);
        }

        // Attack input (Left click or Space attack)
        if (this.input.wasMouseButtonPressed(0)) {
            this.player.attack(this.zombieManager.zombies, this.audio, this.particles);
        }

        // Update Player & Third-Person Camera
        this.player.update(dt, this.input, this.level, this.audio);

        // Update Level & Gate opening
        this.level.update(dt);

        // Update Zombies & Dynamic Horde Pressure
        this.zombieManager.update(dt, this.player, this.player.activeFlares, this.level, this.audio);

        // Dynamic soundtrack intensification
        const chasingCount = this.zombieManager.getChasingCount();
        this.audio.updateMusicIntensity(chasingCount, dt);

        // Update Particles
        this.particles.update(dt);

        // Interactive Searching Mechanics
        this.updateSearchingInteraction(dt);

        // Exit Gate Interaction
        this.updateGateInteraction();

        // UI & HUD updates
        this.ui.update(dt);
        this.ui.updateHUD(this.player, this.level, this.levelTimeLeft, this.totalScore);
        this.ui.updateCompass(this.player, this.level.searchables);
    }

    /**
     * Searching containers, cars, crates with progress bar [E]
     */
    updateSearchingInteraction(dt) {
        let nearbyObject = null;
        let closestDist = Infinity;

        // Find closest unsearched object
        this.level.searchables.forEach(obj => {
            if (!obj.isSearched) {
                const dist = this.player.position.distanceTo(obj.position);
                if (dist <= obj.radius && dist < closestDist) {
                    closestDist = dist;
                    nearbyObject = obj;
                }
            }
        });

        const isHoldingE = this.input.isKeyDown('KeyE') || this.input.isKeyDown('e');

        if (nearbyObject && isHoldingE) {
            this.activeSearchTarget = nearbyObject;
            nearbyObject.searchProgress += dt / nearbyObject.searchDuration;

            // Audio rummage
            this.searchAudioCooldown -= dt;
            if (this.searchAudioCooldown <= 0) {
                this.searchAudioCooldown = 0.28;
                this.audio.playSearchRummage();
            }

            this.ui.updateSearchBar(nearbyObject.name, nearbyObject.searchProgress);

            // Completed search!
            if (nearbyObject.searchProgress >= 1.0) {
                nearbyObject.isSearched = true;
                this.ui.updateSearchBar(nearbyObject.name, 1.0);
                this.grantSearchReward(nearbyObject);
                this.activeSearchTarget = null;
            }
        } else {
            // Cancel search progress if released
            if (this.activeSearchTarget) {
                this.activeSearchTarget.searchProgress = 0;
                this.activeSearchTarget = null;
            }

            if (nearbyObject) {
                this.ui.showToast(`[E] SEARCH ${nearbyObject.name.toUpperCase()}`, '#f1c40f');
            }
            this.ui.updateSearchBar('', 0);
        }
    }

    grantSearchReward(obj) {
        const r = obj.reward;

        if (r.type === 'key') {
            this.player.keys++;
            this.audio.playItemFound('key');
            this.ui.showToast(`🔑 FOUND KEY: ${r.name.toUpperCase()}! (${this.player.keys}/${this.level.gateRequiredKeys} Keys)`, '#ffd700');
        } else if (r.type === 'clue') {
            this.player.cluesFound.push(r);
            this.audio.playItemFound('clue');
            this.ui.showToast(`📑 FOUND CLUE: "${r.title}" (Press J to view Journal)`, '#00e5ff');
        } else if (r.type === 'medkit') {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + r.amount);
            this.audio.playItemFound('medkit');
            this.ui.showToast(`❤️ FOUND MEDICAL SUPPLIES (+${r.amount} HP)!`, '#2ecc71');
        } else if (r.type === 'ammo') {
            this.player.weapons.pistol.ammo = Math.min(this.player.weapons.pistol.maxAmmo, this.player.weapons.pistol.ammo + r.amount);
            this.audio.playItemFound('item');
            this.ui.showToast(`🔫 FOUND AMMUNITION (+${r.amount} ROUNDS)!`, '#f1c40f');
        } else {
            this.ui.showToast(`EMPTY: Nothing of use inside ${obj.name}.`, '#95a5a6');
        }
    }

    /**
     * Exit gate inspection and level clearance
     */
    updateGateInteraction() {
        if (!this.level.gatePos) return;

        const distGate = Math.hypot(this.level.gatePos.x - this.player.position.x, this.level.gatePos.z - this.player.position.z);

        if (!this.level.gateUnlocked) {
            if (distGate < 3.8) {
                if (this.player.keys >= this.level.gateRequiredKeys) {
                    this.level.gateUnlocked = true;
                    this.audio.playGateUnlocked();
                    this.ui.showToast('🚪 GATE UNLOCKED! ESCAPE THROUGH THE PORTAL!', '#2ecc71');
                } else {
                    const needed = this.level.gateRequiredKeys - this.player.keys;
                    this.ui.showToast(`🔒 GATE LOCKED: Need ${needed} more ${needed === 1 ? 'key' : 'keys'}!`, '#e74c3c');
                }
            }
        } else {
            // Step through open gate
            if (distGate < 2.2) {
                this.completeLevel();
            }
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

// Global Launch
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameEngine();
    window.game.initGame();
});
