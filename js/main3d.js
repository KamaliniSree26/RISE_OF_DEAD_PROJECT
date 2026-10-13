/**
 * LAST LIGHT: Escape the Infected City - 3D Edition
 * main3d.js - Core 3D Engine, PointerLock Input, Particle Simulation & Game Loop
 */

const GameState3D = {
    PROLOGUE: 'PROLOGUE',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    LEVEL_CLEAR: 'LEVEL_CLEAR',
    GAME_OVER: 'GAME_OVER',
    GAME_WIN: 'GAME_WIN'
};

class Input3DManager {
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
        // Pointer Lock on Canvas Click
        this.canvas.addEventListener('click', () => {
            if (window.soundSystem) window.soundSystem.init();
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
            if (window.soundSystem) window.soundSystem.init();
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
                window.game.player.weaponManager.cycleWeapon();
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

class ParticleSystem3D {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    spawnBlood(x, y, z, count = 16) {
        for (let i = 0; i < count; i++) {
            const geom = new THREE.BoxGeometry(0.06, 0.06, 0.06);
            const mat = new THREE.MeshBasicMaterial({ color: Math.random() < 0.4 ? 0x880808 : 0xaa0000 });
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

    spawnSparks(x, y, z, color = 0xffaa00) {
        for (let i = 0; i < 8; i++) {
            const geom = new THREE.BoxGeometry(0.04, 0.04, 0.04);
            const mat = new THREE.MeshBasicMaterial({ color });
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(x, y, z);
            this.scene.add(mesh);

            const speed = 2.0 + Math.random() * 3.5;
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                mesh,
                vx: Math.cos(angle) * speed,
                vy: Math.random() * 3.0,
                vz: Math.sin(angle) * speed,
                life: 0.4
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
            p.vy -= 9.8 * dt; // gravity

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }
    }
}

class GameEngine3D {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        window.addEventListener('resize', () => this.onResize());

        this.input = new Input3DManager(this.canvas);
        this.particleSystem = new ParticleSystem3D(this.scene);
        this.ui = new UI3DManager();

        this.state = GameState3D.PROLOGUE;
        this.currentLevelNumber = 1;
        this.level = null;
        this.player = null;
        this.zombies = [];
        this.levelTimeLeft = 150;
        this.totalScore = 0;
        this.levelZombiesKilled = 0;

        this.lastFrameTime = performance.now();
        this.setupUIHandlers();
    }

    onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    setupUIHandlers() {
        // Start Game
        const startBtn = document.getElementById('btn-start-game');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (window.soundSystem) window.soundSystem.init();
                document.getElementById('prologue-modal').classList.add('hidden');
                this.loadLevel(1);
            });
        }

        // Next Level
        const nextBtn = document.getElementById('btn-next-level');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                document.getElementById('level-clear-modal').classList.add('hidden');
                if (this.currentLevelNumber < 3) {
                    this.loadLevel(this.currentLevelNumber + 1);
                } else {
                    this.state = GameState3D.GAME_WIN;
                    this.ui.showGameWinModal(this.totalScore);
                }
            });
        }

        // Restart
        const restartBtn = document.getElementById('btn-restart-game');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                document.getElementById('game-over-modal').classList.add('hidden');
                this.loadLevel(this.currentLevelNumber);
            });
        }

        const winRestartBtn = document.getElementById('btn-win-restart');
        if (winRestartBtn) {
            winRestartBtn.addEventListener('click', () => {
                document.getElementById('game-win-modal').classList.add('hidden');
                this.totalScore = 0;
                this.loadLevel(1);
            });
        }

        // Pause Menu
        const resumeBtn = document.getElementById('btn-resume');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.togglePause(false));
        }

        const soundToggle = document.getElementById('btn-toggle-sound');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                if (window.soundSystem) {
                    const muted = window.soundSystem.toggleMute();
                    soundToggle.innerText = muted ? 'UNMUTE SOUND' : 'MUTE SOUND';
                }
            });
        }
    }

    loadLevel(num) {
        this.currentLevelNumber = num;

        // Clean up previous level meshes
        if (this.level) {
            this.level.dispose();
        }
        this.zombies.forEach(z => {
            if (z.mesh && z.mesh.parent) this.scene.remove(z.mesh);
        });
        this.zombies = [];

        // Build 3D Level
        this.level = new Level3D(this.scene, num);
        this.levelTimeLeft = this.level.timeLimit;
        this.levelZombiesKilled = 0;

        // Configure atmospheric fog
        this.scene.fog = new THREE.Fog(this.level.fogColor, this.level.fogNear, this.level.fogFar);
        this.renderer.setClearColor(this.level.fogColor);

        // Player setup
        if (!this.player) {
            this.player = new Player3D(this.camera, this.scene);
        } else {
            this.player.keys = 0;
            this.player.cluesFound.clear();
            this.player.rescuedNPC = false;
        }
        this.player.resetPosition(this.level.playerSpawn.x, this.level.playerSpawn.z);

        // Ambient Scene Light
        if (!this.ambientLight) {
            this.ambientLight = new THREE.AmbientLight(0x222a33, 0.4);
            this.scene.add(this.ambientLight);
        }

        // Spawn 3D Zombies
        this.zombies = this.level.zombieSpawns.map(s => new Zombie3D(this.scene, s.x, s.z, s.type, s.waypoints));

        if (window.soundSystem) {
            window.soundSystem.setAmbientIntensity(num);
        }

        this.state = GameState3D.PLAYING;
        this.ui.showTouchToast(`ENTERED: ${this.level.name.toUpperCase()} (TOUCH ITEMS TO CLAIM)`, '#00e5ff');
    }

    recordZombieKilled(type) {
        this.levelZombiesKilled++;
        const points = (type === ZombieType3D.BOSS ? 500 : (type === ZombieType3D.RUNNER ? 75 : 50));
        this.totalScore += points;
        this.ui.showTouchToast(`+${points} PTS: INFECTED ELIMINATED!`, '#2ecc71');
    }

    togglePause(forceState = null) {
        if (this.state !== GameState3D.PLAYING && this.state !== GameState3D.PAUSED) return;

        const isPaused = forceState !== null ? forceState : (this.state !== GameState3D.PAUSED);
        this.state = isPaused ? GameState3D.PAUSED : GameState3D.PLAYING;

        const modal = document.getElementById('pause-modal');
        if (modal) {
            if (isPaused) {
                modal.classList.remove('hidden');
                if (document.exitPointerLock) document.exitPointerLock();
            } else {
                modal.classList.add('hidden');
                if (this.canvas.requestPointerLock) this.canvas.requestPointerLock();
            }
        }
    }

    triggerGameOver(reason) {
        this.state = GameState3D.GAME_OVER;
        if (document.exitPointerLock) document.exitPointerLock();
        this.ui.showGameOverModal(reason);
    }

    completeLevel() {
        this.state = GameState3D.LEVEL_CLEAR;
        if (document.exitPointerLock) document.exitPointerLock();

        const timePoints = Math.max(0, Math.floor(this.levelTimeLeft) * 10);
        const healthPoints = Math.floor(this.player.health) * 5;
        const zombiePoints = this.levelZombiesKilled * 50;
        const cluePoints = this.player.cluesFound.size * 100;
        const npcPoints = this.player.rescuedNPC ? 500 : 0;
        const levelScore = timePoints + healthPoints + zombiePoints + cluePoints + npcPoints;
        this.totalScore += levelScore;

        const stats = {
            levelNumber: this.currentLevelNumber,
            timeLeft: this.levelTimeLeft,
            timeLeftRatio: this.levelTimeLeft / this.level.timeLimit,
            health: this.player.health,
            healthRatio: this.player.health / this.player.maxHealth,
            timePoints,
            healthPoints,
            zombiesKilled: this.levelZombiesKilled,
            zombiePoints,
            cluesFound: this.player.cluesFound.size,
            totalClues: this.level.totalCluesCount,
            rescuedNPC: this.player.rescuedNPC,
            finalScore: levelScore
        };

        this.ui.showLevelClearModal(stats);
    }

    start() {
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
        // Pause Toggle
        if (this.input.wasKeyPressed('Escape') || this.input.wasKeyPressed('KeyP')) {
            this.togglePause();
        }

        if (this.state !== GameState3D.PLAYING) {
            this.ui.update(dt);
            return;
        }

        // Countdown Timer
        this.levelTimeLeft -= dt;
        if (this.levelTimeLeft <= 0) {
            this.levelTimeLeft = 0;
            this.triggerGameOver('Time expired! Evacuation gate sealed & sector sterilized.');
            return;
        }

        // Update Player & Weapons
        this.player.update(dt, this.input, this.level, this.zombies, this.particleSystem);

        // Update Level & Auto-Claim Touch Collisions
        this.level.update(dt, this.player, this.ui);

        // Update 3D Zombies
        this.zombies.forEach(z => z.update(dt, this.player, this.player.weaponManager.activeFlares, this.level));

        // Update 3D Particles
        this.particleSystem.update(dt);

        // Update UI
        this.ui.update(dt);
        this.ui.updateHUD(this.player, this.level, this.levelTimeLeft, this.totalScore);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

// Global Launch
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameEngine3D();
    window.game.start();
});
