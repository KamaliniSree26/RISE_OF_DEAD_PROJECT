/**
 * JUNGLE SURVIVAL: ESCAPE THE INFECTED
 * Realistic 3D First-Person Jungle Zombie Survival & Escape Game Engine
 * 
 * Features:
 * - 5 Distinct Jungle Safe Places with Sequential Clues, Puzzles & Key Collection:
 *   1. Ranger Outpost Cabin -> Key #1 + Shotgun Unlocked -> Unlocks Safe Place 2
 *   2. Canopy Treehouse Shelter -> Key #2 + Ammo Cache -> Unlocks Safe Place 3
 *   3. Ancient Stone Shrine -> Key #3 + Extra Life -> Unlocks Safe Place 4
 *   4. Research Lab Bunker -> Key #4 + Assault Rifle Unlocked -> Unlocks Safe Place 5
 *   5. Military Watchtower Encampment -> Key #5 (5/5 Complete!) -> Unlocks Extraction Gate
 * - 3D Light Beacon Beam: 45m emerald light column shining into the sky for the active Safe Place
 * - Dynamic HUD Distance: Shows real-time distance in meters to target safe place
 * - Open Access Sanctuaries: No invisible collision barriers blocking entrances
 * - Instant & Intuitive Puzzle Solving: Visible code, 1-click Auto-Fill button, direct dial cycling, and automatic key collection
 * - Realistic Natural Jungle Environment: Dense trees, tropical palms, ferns, rocks, fallen logs, mud trails
 * - Bright Natural Daytime Lighting: Warm tropical sun, sky bounce, atmospheric mist (NO flashlight needed!)
 * - Realistic Infected Human Zombies: Anatomical human models, ragged clothes, natural walking sway & lunges
 * - Acoustic Zombie Awareness: Gunshot sounds attract nearby zombies
 * - Circular Navigation Map (Top-Left): Compass, dynamic RED ZOMBIE MARKERS, safe place beacons, keys, and extraction gate
 * - Multi-Level Difficulty Progression (1 to 4): Decreasing timers (5:00, 4:15, 3:30, 2:45), higher speeds,
 *   more runners, increased zombie damage, and tougher bosses
 * - Main Zombie Boss: Spawns at exit perimeter with top-center boss health bar
 */

class JungleSurvivalGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');

        // Three.js Scene, Camera, Renderer
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Level & Difficulty System
        this.currentLevel = 1;
        this.maxLevels = 4;
        this.levelConfigs = {
            1: {
                name: "RISE OF DEAD - LEVEL 1: DEEP JUNGLE BASIN",
                timeLimit: 420, // 7:00 minutes (increased duration)
                zombieCount: 14,
                zombieSpeedMult: 1.0,
                zombieDamageMult: 1.0,
                runnerChance: 0.25,
                bossHp: 650
            },
            2: {
                name: "RISE OF DEAD - LEVEL 2: ANCIENT RUINS & CANOPY",
                timeLimit: 360, // 6:00 minutes
                zombieCount: 22,
                zombieSpeedMult: 1.25,
                zombieDamageMult: 1.25,
                runnerChance: 0.40,
                bossHp: 800
            },
            3: {
                name: "RISE OF DEAD - LEVEL 3: TOXIC SWAMP & OUTPOST",
                timeLimit: 300, // 5:00 minutes
                zombieCount: 30,
                zombieSpeedMult: 1.45,
                zombieDamageMult: 1.5,
                runnerChance: 0.50,
                bossHp: 1000
            },
            4: {
                name: "RISE OF DEAD - LEVEL 4: EVACUATION PERIMETER",
                timeLimit: 240, // 4:00 minutes
                zombieCount: 38,
                zombieSpeedMult: 1.7,
                zombieDamageMult: 1.75,
                runnerChance: 0.65,
                bossHp: 1250
            }
        };

        // 5 Safe Places Configuration & Distinct Fast Mini-Game Progression Loop
        this.safePlacesData = [
            {
                id: 1,
                name: "RANGER OUTPOST CABIN",
                gameType: 'keypad',
                gameTitle: "TACTICAL 3-DIGIT OUTPOST KEYPAD",
                pos: new THREE.Vector3(-24, 0, -24),
                keyPos: new THREE.Vector3(-24, 2.6, -24),
                code: '381',
                title: "SURVIVOR FIELD JOURNAL - ENTRY 1",
                clue: "Ranger Safe Access: Enter PIN [3 - 8 - 1] on the numeric keypad to unlock.",
                footer: "ENTER PIN: [ 3 - 8 - 1 ]",
                rewardText: "💥 SHOTGUN UNLOCKED + 🔑 KEY #1 (1/5) + ❤️ FIRST AID KIT",
                unlocksWeapon: 'shotgun',
                radius: 7.5,
                completed: false,
                autoPrompted: false
            },
            {
                id: 2,
                name: "CANOPY TREEHOUSE SHELTER",
                gameType: 'radio',
                gameTitle: "EMERGENCY RADIO FREQUENCY BROADCAST",
                pos: new THREE.Vector3(26, 0, -22),
                keyPos: new THREE.Vector3(26, 2.6, -22),
                targetFreq: 142.8,
                targetBand: 'AM',
                title: "CANOPY EMERGENCY RADIO LOG - ENTRY 2",
                clue: "Evacuation Frequency Broadcast: Select Channel 3 (142.8 AM ★ EMERGENCY) to lock resonance.",
                footer: "SELECT: [ CHANNEL 3 • 142.8 MHz AM ]",
                rewardText: "🔑 KEY #2 (2/5) + 💥 HEAVY AMMO SUPPLY (+40) + ❤️ FIRST AID",
                unlocksWeapon: null,
                radius: 7.5,
                completed: false,
                autoPrompted: false
            },
            {
                id: 3,
                name: "ANCIENT STONE TEMPLE SHRINE",
                gameType: 'runes',
                gameTitle: "ANCIENT ELEMENTAL RUNE TABLETS",
                pos: new THREE.Vector3(30, 0, 12),
                keyPos: new THREE.Vector3(30, 2.2, 12),
                targetRunes: ['solar', 'serpent', 'lunar'],
                title: "ANCIENT TEMPLE ALTAR - STELE INSCRIPTION",
                clue: "Temple Creation Riddle: Touch the 3 sacred runes in order: 1. Solar (☀️), 2. Serpent (🐍), 3. Lunar (🌙).",
                footer: "TOUCH SEQUENCE: [ ☀️ SOLAR → 🐍 SERPENT → 🌙 LUNAR ]",
                rewardText: "🔑 KEY #3 (3/5) + ❤️ EXTRA LIFE (+1 LIFE) + 💥 AMMO SUPPLY",
                unlocksWeapon: null,
                radius: 7.5,
                completed: false,
                autoPrompted: false
            },
            {
                id: 4,
                name: "RESEARCH LAB BUNKER",
                gameType: 'breakers',
                gameTitle: "BIOHAZARD POWER GRID BREAKERS",
                pos: new THREE.Vector3(-26, 0, 14),
                keyPos: new THREE.Vector3(-26, 2.4, 14),
                targetBreakers: [true, false, true],
                title: "DR. MILLER'S PATHOGEN CONSOLE - POWER LOG",
                clue: "Auxiliary Power Pattern: Breaker 1 = ON, Breaker 2 = OFF, Breaker 3 = ON.",
                footer: "SWITCH PATTERN: [ ON - OFF - ON ]",
                rewardText: "🔫 M4A1 ASSAULT RIFLE UNLOCKED + 🔑 KEY #4 (4/5) + ❤️ MEDKIT",
                unlocksWeapon: 'rifle',
                radius: 7.5,
                completed: false,
                autoPrompted: false
            },
            {
                id: 5,
                name: "MILITARY WATCHTOWER ENCAMPMENT",
                gameType: 'radar',
                gameTitle: "TACTICAL RADAR EVACUATION GRID",
                pos: new THREE.Vector3(0, 0, -4),
                keyPos: new THREE.Vector3(0, 2.6, -4),
                targetSectors: ['A1', 'B2'],
                title: "MILITARY HIGH COMMAND - EVACUATION GRID",
                clue: "Mark the 2 authorized evacuation LZ sectors on the tactical radar: Sector A-1 and Sector B-2.",
                footer: "MARK SECTORS: [ A-1, B-2 ]",
                rewardText: "🔑 KEY #5 (5/5 COMPLETE!) + 💥 MAX AMMO REFILL + 🚪 EXTRACTION GATE UNLOCKED!",
                unlocksWeapon: null,
                radius: 8.0,
                completed: false,
                autoPrompted: false
            }
        ];

        // Player State
        this.playerPos = new THREE.Vector3(-14, 1.7, -18);
        this.camera.position.copy(this.playerPos);
        this.playerYaw = 0;
        this.playerPitch = 0;
        this.playerSpeed = 7.2;
        this.health = 100;
        this.maxHealth = 100;
        this.lives = 3;
        this.invulnerableTimer = 0;
        this.timeRemaining = 300;
        this.isDead = false;

        // Weapons System
        this.weapons = {
            pistol: { name: 'PISTOL', unlocked: true, clip: 12, maxClip: 12, reserve: 60, maxReserve: 120, damage: 36, cooldown: 0.22, pellets: 1, spread: 0.015 },
            shotgun: { name: 'SHOTGUN', unlocked: false, clip: 8, maxClip: 8, reserve: 32, maxReserve: 64, damage: 22, cooldown: 0.75, pellets: 7, spread: 0.075 },
            rifle: { name: 'ASSAULT RIFLE', unlocked: false, clip: 30, maxClip: 30, reserve: 90, maxReserve: 180, damage: 28, cooldown: 0.12, pellets: 1, spread: 0.025 }
        };
        this.currentWeaponKey = 'pistol';
        this.isReloading = false;
        this.lastShotTime = 0;

        // Weapon Viewmodel animation
        this.weaponGroup = null;
        this.weaponMeshInstances = {};
        this.gunRecoilZ = 0;
        this.gunRecoilRot = 0;
        this.gunBobTimer = 0;
        this.muzzleFlashTimer = 0;

        // Progression State
        this.activeSafePlaceIndex = 0; // 0 = Safe Place 1, 1 = Safe Place 2, etc.
        this.safePlacesCompleted = 0;
        this.keysFound = 0;
        this.totalKeys = 5;
        this.zombieKills = 0;
        this.totalCampaignKills = 0;
        this.exitUnlocked = false;
        this.bossSpawned = false;
        this.bossDefeated = false;
        this.gameState = 'PLAYING'; // 'PLAYING', 'PUZZLE', 'GAMEOVER', 'LEVELWIN', 'FINALWIN'

        // 5 Fast Puzzle Mini-Games State
        this.currentPuzzleSafePlace = null;
        this.keypadCode = "";
        this.radioFreq = 98.5;
        this.radioBand = 'FM';
        this.selectedRunes = [];
        this.breakerStates = [false, false, false];
        this.selectedRadarSectors = new Set();

        // Input
        this.keys = {};
        this.isPointerLocked = false;
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        this.nearInteractiveObject = null;

        // Game Object Arrays
        this.zombies = [];
        this.boss = null;
        this.keyItems = [];
        this.pickups = [];
        this.obstacles = [];
        this.particles = [];
        this.safePlaceMeshes = [];
        this.targetBeaconMesh = null;
        this.floatingKeyMesh = null;
        this.exitGateMesh = null;
        this.exitAreaBounds = { minX: -15, maxX: 15, minZ: 42, maxZ: 70 };

        // Timing & Animation
        this.lastFrameTime = performance.now();
        this.radarSweepAngle = 0;
        this.footstepTimer = 0;

        // Textures
        this.textures = this.generateProceduralTextures();

        this.init();
    }

    // =========================================================================
    // 1. PROCEDURAL REALISTIC JUNGLE TEXTURES
    // =========================================================================
    generateProceduralTextures() {
        const tex = {};

        // 1.1 Lush Jungle Terrain
        const groundCanvas = document.createElement('canvas');
        groundCanvas.width = 512;
        groundCanvas.height = 512;
        const gCtx = groundCanvas.getContext('2d');
        gCtx.fillStyle = '#262217';
        gCtx.fillRect(0, 0, 512, 512);

        for (let i = 0; i < 4000; i++) {
            const gx = Math.random() * 512;
            const gy = Math.random() * 512;
            const size = 2 + Math.random() * 6;
            const greenShade = Math.random() < 0.6 ? '#2d4e20' : (Math.random() < 0.5 ? '#3b6127' : '#1e3814');
            gCtx.fillStyle = greenShade;
            gCtx.beginPath();
            gCtx.arc(gx, gy, size, 0, Math.PI * 2);
            gCtx.fill();
        }

        for (let i = 0; i < 800; i++) {
            const lx = Math.random() * 512;
            const ly = Math.random() * 512;
            gCtx.fillStyle = Math.random() < 0.5 ? '#5c3d1f' : '#452b14';
            gCtx.beginPath();
            gCtx.ellipse(lx, ly, 4, 2, Math.random() * Math.PI, 0, Math.PI * 2);
            gCtx.fill();
        }

        tex.ground = new THREE.CanvasTexture(groundCanvas);
        tex.ground.wrapS = THREE.RepeatWrapping;
        tex.ground.wrapT = THREE.RepeatWrapping;
        tex.ground.repeat.set(16, 16);

        // 1.2 Tree Bark Texture
        const barkCanvas = document.createElement('canvas');
        barkCanvas.width = 256;
        barkCanvas.height = 512;
        const bCtx = barkCanvas.getContext('2d');
        bCtx.fillStyle = '#2b1b11';
        bCtx.fillRect(0, 0, 256, 512);

        for (let x = 0; x < 256; x += 3) {
            bCtx.strokeStyle = Math.random() < 0.5 ? '#1d120a' : '#3b2518';
            bCtx.lineWidth = 1 + Math.random() * 2;
            bCtx.beginPath();
            bCtx.moveTo(x, 0);
            bCtx.bezierCurveTo(x + (Math.random() - 0.5) * 10, 170, x + (Math.random() - 0.5) * 10, 340, x, 512);
            bCtx.stroke();
        }

        for (let i = 0; i < 60; i++) {
            bCtx.fillStyle = 'rgba(46, 78, 32, 0.6)';
            bCtx.beginPath();
            bCtx.arc(Math.random() * 256, Math.random() * 512, 6 + Math.random() * 12, 0, Math.PI * 2);
            bCtx.fill();
        }
        tex.bark = new THREE.CanvasTexture(barkCanvas);
        tex.bark.wrapS = THREE.RepeatWrapping;
        tex.bark.wrapT = THREE.RepeatWrapping;
        tex.bark.repeat.set(1, 3);

        // 1.3 Weathered Wood Planks
        const woodCanvas = document.createElement('canvas');
        woodCanvas.width = 256;
        woodCanvas.height = 256;
        const wCtx = woodCanvas.getContext('2d');
        wCtx.fillStyle = '#3a2b1c';
        wCtx.fillRect(0, 0, 256, 256);
        for (let y = 0; y < 256; y += 32) {
            wCtx.strokeStyle = '#1b140b';
            wCtx.lineWidth = 2;
            wCtx.strokeRect(0, y, 256, 32);
            for (let i = 0; i < 8; i++) {
                wCtx.strokeStyle = 'rgba(20, 14, 8, 0.4)';
                wCtx.lineWidth = 1;
                wCtx.beginPath();
                wCtx.moveTo(0, y + Math.random() * 32);
                wCtx.lineTo(256, y + Math.random() * 32);
                wCtx.stroke();
            }
        }
        tex.wood = new THREE.CanvasTexture(woodCanvas);

        return tex;
    }

    // =========================================================================
    // 2. INITIALIZATION
    // =========================================================================
    init() {
        this.setupLightingAndDaytimeAtmosphere();
        this.buildJungleEnvironment();
        this.setupWeaponViewmodels();
        this.setupSkyBeaconAndFloatingKey();
        this.setupLevelEntities();
        this.setupEventListeners();
        this.setupPuzzleModalUI();
        this.updateHUD();

        window.addEventListener('resize', () => this.onResize());
        this.animate();
    }

    onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    // =========================================================================
    // 3. BRIGHT JUNGLE DAYLIGHT (NO FLASHLIGHT REQUIRED)
    // =========================================================================
    setupLightingAndDaytimeAtmosphere() {
        this.scene.fog = new THREE.FogExp2(0x8ec8a0, 0.0075);
        this.renderer.setClearColor(0x8ec8a0);

        // Warm Tropical Sun
        this.sunLight = new THREE.DirectionalLight(0xfff5d6, 1.25);
        this.sunLight.position.set(45, 60, 25);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 180;
        const d = 60;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.sunLight.shadow.bias = -0.0005;
        this.scene.add(this.sunLight);

        // Sky & Foliage Bounce Light
        this.hemiLight = new THREE.HemisphereLight(0x7dc6e8, 0x2e4e20, 0.75);
        this.hemiLight.position.set(0, 50, 0);
        this.scene.add(this.hemiLight);

        // Ambient Light
        this.ambientLight = new THREE.AmbientLight(0x405e3b, 0.5);
        this.scene.add(this.ambientLight);

        this.scene.add(this.camera);
    }

    // =========================================================================
    // 4. JUNGLE ENVIRONMENT & 5 ACCESSIBLE SAFE PLACES
    // =========================================================================
    buildJungleEnvironment() {
        // Ground Terrain
        const groundGeom = new THREE.PlaneGeometry(180, 180, 64, 64);
        const posAttr = groundGeom.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            const vx = posAttr.getX(i);
            const vy = posAttr.getY(i);
            const elevation = Math.sin(vx * 0.05) * Math.cos(vy * 0.05) * 0.8 + Math.sin(vx * 0.1) * 0.4;
            posAttr.setZ(i, elevation);
        }
        groundGeom.computeVertexNormals();

        const groundMat = new THREE.MeshStandardMaterial({
            map: this.textures.ground,
            roughness: 0.9,
            metalness: 0.05
        });
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Perimeter Cliff Barriers (Only at outer map borders)
        this.buildNaturalCliffWall(-88, 0, 6, 180, 12);
        this.buildNaturalCliffWall(88, 0, 6, 180, 12);
        this.buildNaturalCliffWall(0, -88, 180, 6, 12);
        this.buildNaturalCliffWall(0, 88, 180, 6, 12);

        // BUILD 5 ACCESSIBLE SAFE PLACES (NO BLOCKING HITBOXES)
        this.buildSafePlace1_RangerCabin(-24, -24);
        this.buildSafePlace2_Treehouse(26, -22);
        this.buildSafePlace3_AncientShrine(30, 12);
        this.buildSafePlace4_ResearchBunker(-26, 14);
        this.buildSafePlace5_Watchtower(0, -4);

        // Exit Checkpoint & Fortified Extraction Gate
        this.buildExitPerimeter(0, 52);

        // Trees, Palms, Ferns, Rocks & Fallen Logs
        this.populateJungleFloraAndObstacles();
    }

    buildNaturalCliffWall(x, z, w, d, h) {
        const geom = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({ color: 0x1f2e22, roughness: 0.95 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, h / 2, z);
        this.scene.add(mesh);
        this.obstacles.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    }

    // --- 3D TALL SKY BEACON & FLOATING KEY ---
    setupSkyBeaconAndFloatingKey() {
        // 45m Tall Glowing Emerald Sky Beacon
        const beaconGeom = new THREE.CylinderGeometry(0.4, 0.4, 45, 12);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.55 });
        this.targetBeaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
        this.targetBeaconMesh.position.set(-24, 22.5, -24);
        this.scene.add(this.targetBeaconMesh);

        const beaconLight = new THREE.PointLight(0x00ff88, 3.0, 30.0);
        beaconLight.position.set(0, 20, 0);
        this.targetBeaconMesh.add(beaconLight);

        // 3D Floating Rotating Golden Key
        const keyGroup = new THREE.Group();
        const keyMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.95,
            roughness: 0.2,
            emissive: 0xaa8800,
            emissiveIntensity: 0.6
        });

        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.75, 8), keyMat);
        keyGroup.add(shaft);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 8, 16), keyMat);
        ring.position.y = 0.42;
        keyGroup.add(ring);

        const keyGlow = new THREE.PointLight(0xffd700, 2.5, 8.0);
        keyGlow.position.y = 0.45;
        keyGroup.add(keyGlow);

        keyGroup.position.set(-24, 2.6, -24);
        this.scene.add(keyGroup);
        this.floatingKeyMesh = keyGroup;
    }

    updateSkyBeaconAndKey() {
        if (!this.targetBeaconMesh || !this.floatingKeyMesh) return;

        if (this.activeSafePlaceIndex < 5) {
            const sp = this.safePlacesData[this.activeSafePlaceIndex];
            this.targetBeaconMesh.position.set(sp.pos.x, 22.5, sp.pos.z);
            this.targetBeaconMesh.material.color.setHex(0x00ff88);

            this.floatingKeyMesh.position.copy(sp.keyPos);
            this.floatingKeyMesh.visible = true;
        } else {
            // Extraction Gate is target!
            this.targetBeaconMesh.position.set(0, 22.5, 52);
            this.targetBeaconMesh.material.color.setHex(0x00e5ff);
            this.floatingKeyMesh.visible = false;
        }
    }

    // --- SAFE PLACE 1: RANGER CABIN (-24, -24) ---
    buildSafePlace1_RangerCabin(x, z) {
        const group = new THREE.Group();
        const wallMat = new THREE.MeshStandardMaterial({ map: this.textures.wood, roughness: 0.8 });

        const deck = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.3, 9.0), wallMat);
        deck.position.set(0, 1.4, 0);
        group.add(deck);

        const back = new THREE.Mesh(new THREE.BoxGeometry(8.6, 3.2, 0.3), wallMat);
        back.position.set(0, 3.0, -4.1);
        group.add(back);

        const left = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 8.6), wallMat);
        left.position.set(-4.1, 3.0, 0);
        group.add(left);

        const right = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 8.6), wallMat);
        right.position.set(4.1, 3.0, 0);
        group.add(right);

        // Front with wide open doorway
        const frontL = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 0.3), wallMat);
        frontL.position.set(-3.0, 3.0, 4.1);
        group.add(frontL);
        const frontR = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 0.3), wallMat);
        frontR.position.set(3.0, 3.0, 4.1);
        group.add(frontR);

        const roof = new THREE.Mesh(new THREE.ConeGeometry(6.8, 2.2, 4), new THREE.MeshStandardMaterial({ color: 0x485848 }));
        roof.position.set(0, 5.5, 0);
        roof.rotation.y = Math.PI / 4;
        group.add(roof);

        // Desk & Lockbox 1
        const desk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 1.2), wallMat);
        desk.position.set(0, 2.0, -2.6);
        group.add(desk);

        const lockbox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.45), new THREE.MeshStandardMaterial({ color: 0xb58900, metalness: 0.8 }));
        lockbox.position.set(0.4, 2.65, -2.6);
        group.add(lockbox);

        const beacon = new THREE.PointLight(0x00ff88, 2.0, 15.0);
        beacon.position.set(0, 3.4, 0);
        group.add(beacon);

        group.position.set(x, 0, z);
        this.scene.add(group);
        this.safePlaceMeshes.push({ id: 1, mesh: group, pos: new THREE.Vector3(x, 0, z), beacon });
    }

    // --- SAFE PLACE 2: CANOPY TREEHOUSE SHELTER (26, -22) ---
    buildSafePlace2_Treehouse(x, z) {
        const group = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ map: this.textures.wood, roughness: 0.85 });

        const platform = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.3, 8.5), woodMat);
        platform.position.set(0, 1.6, 0);
        group.add(platform);

        const canvasMat = new THREE.MeshStandardMaterial({ color: 0x3d5a3d, roughness: 0.7 });
        const roof = new THREE.Mesh(new THREE.ConeGeometry(6.2, 2.0, 4), canvasMat);
        roof.position.set(0, 5.2, 0);
        roof.rotation.y = Math.PI / 4;
        group.add(roof);

        const chest = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.9), woodMat);
        chest.position.set(0, 2.1, -1.8);
        group.add(chest);

        const lockbox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.4), new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.7 }));
        lockbox.position.set(0, 2.65, -1.8);
        group.add(lockbox);

        const beacon = new THREE.PointLight(0x00ff88, 1.8, 14.0);
        beacon.position.set(0, 3.5, 0);
        group.add(beacon);

        group.position.set(x, 0, z);
        this.scene.add(group);
        this.safePlaceMeshes.push({ id: 2, mesh: group, pos: new THREE.Vector3(x, 0, z), beacon });
    }

    // --- SAFE PLACE 3: ANCIENT STONE TEMPLE SHRINE (30, 12) ---
    buildSafePlace3_AncientShrine(x, z) {
        const group = new THREE.Group();
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x3a453a, roughness: 0.95 });

        const dais = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.0, 0.8, 12), stoneMat);
        dais.position.y = 0.4;
        group.add(dais);

        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const px = Math.cos(angle) * 3.4;
            const pz = Math.sin(angle) * 3.4;
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.2, 0.9), stoneMat);
            pillar.position.set(px, 2.5, pz);
            group.add(pillar);
        }

        const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.2), stoneMat);
        pedestal.position.set(0, 1.1, 0);
        group.add(pedestal);

        const lockbox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.5), new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8 }));
        lockbox.position.set(0, 1.95, 0);
        group.add(lockbox);

        const beacon = new THREE.PointLight(0x00ff88, 2.0, 14.0);
        beacon.position.set(0, 3.2, 0);
        group.add(beacon);

        group.position.set(x, 0, z);
        this.scene.add(group);
        this.safePlaceMeshes.push({ id: 3, mesh: group, pos: new THREE.Vector3(x, 0, z), beacon });
    }

    // --- SAFE PLACE 4: RESEARCH LAB BUNKER (-26, 14) ---
    buildSafePlace4_ResearchBunker(x, z) {
        const group = new THREE.Group();
        const concreteMat = new THREE.MeshStandardMaterial({ color: 0x323e38, roughness: 0.9 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x223028, metalness: 0.6, roughness: 0.4 });

        const bunker = new THREE.Mesh(new THREE.BoxGeometry(8.5, 3.6, 8.5), concreteMat);
        bunker.position.set(0, 1.8, 0);
        group.add(bunker);

        // Wide door cutout
        const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.2, 1.4), new THREE.MeshBasicMaterial({ color: 0x050a08 }));
        doorFrame.position.set(0, 1.6, 3.8);
        group.add(doorFrame);

        const consoleTable = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 1.0), metalMat);
        consoleTable.position.set(0, 1.4, -2.2);
        group.add(consoleTable);

        const lockbox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.45), new THREE.MeshStandardMaterial({ color: 0xf43f5e, metalness: 0.8 }));
        lockbox.position.set(0, 2.05, -2.2);
        group.add(lockbox);

        const beacon = new THREE.PointLight(0x00ff88, 2.0, 14.0);
        beacon.position.set(0, 2.8, 0);
        group.add(beacon);

        group.position.set(x, 0, z);
        this.scene.add(group);
        this.safePlaceMeshes.push({ id: 4, mesh: group, pos: new THREE.Vector3(x, 0, z), beacon });
    }

    // --- SAFE PLACE 5: MILITARY WATCHTOWER ENCAMPMENT (0, -4) ---
    buildSafePlace5_Watchtower(x, z) {
        const group = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x273530, metalness: 0.7, roughness: 0.4 });
        const sandbagMat = new THREE.MeshStandardMaterial({ color: 0x4a3b2c, roughness: 0.95 });

        const sandbags = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.8, 1.2, 16), sandbagMat);
        sandbags.position.y = 0.6;
        group.add(sandbags);

        const towerLegs = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 5.0, 8), metalMat);
        towerLegs.position.y = 2.5;
        group.add(towerLegs);

        const platform = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.4, 5.2), metalMat);
        platform.position.y = 5.2;
        group.add(platform);

        const safeLocker = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 1.2), metalMat);
        safeLocker.position.set(0, 1.5, 0);
        group.add(safeLocker);

        const lockbox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.5), new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 }));
        lockbox.position.set(0, 2.1, 0.5);
        group.add(lockbox);

        const beacon = new THREE.PointLight(0x00ff88, 2.4, 16.0);
        beacon.position.set(0, 4.5, 0);
        group.add(beacon);

        group.position.set(x, 0, z);
        this.scene.add(group);
        this.safePlaceMeshes.push({ id: 5, mesh: group, pos: new THREE.Vector3(x, 0, z), beacon });
    }

    // --- EXIT EXTRACTION GATE & BRIDGE ---
    buildExitPerimeter(x, z) {
        const exitGroup = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x273530, metalness: 0.6, roughness: 0.4 });

        [-7, 7].forEach(tx => {
            const tower = new THREE.Mesh(new THREE.BoxGeometry(2.0, 8.5, 2.0), metalMat);
            tower.position.set(tx, 4.25, 0);
            exitGroup.add(tower);

            const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.4, 4), metalMat);
            towerRoof.position.set(tx, 9.2, 0);
            towerRoof.rotation.y = Math.PI / 4;
            exitGroup.add(towerRoof);
        });

        const arch = new THREE.Mesh(new THREE.BoxGeometry(16.0, 1.4, 1.8), metalMat);
        arch.position.set(0, 7.8, 0);
        exitGroup.add(arch);

        const gateGeom = new THREE.BoxGeometry(12.0, 6.0, 0.5);
        const gateMat = new THREE.MeshStandardMaterial({ color: 0x802222, metalness: 0.7, roughness: 0.3 });
        this.gateDoorMesh = new THREE.Mesh(gateGeom, gateMat);
        this.gateDoorMesh.position.set(0, 3.0, 0);
        exitGroup.add(this.gateDoorMesh);

        this.exitLight = new THREE.PointLight(0xff2222, 2.4, 18.0);
        this.exitLight.position.set(0, 7.2, 1.2);
        exitGroup.add(this.exitLight);

        const heliGeom = new THREE.CylinderGeometry(6.5, 6.5, 0.2, 24);
        const heliMat = new THREE.MeshStandardMaterial({ color: 0x1a2620, roughness: 0.8 });
        const helipad = new THREE.Mesh(heliGeom, heliMat);
        helipad.position.set(0, 0.1, 14);
        exitGroup.add(helipad);

        exitGroup.position.set(x, 0, z);
        this.scene.add(exitGroup);
        this.exitGateMesh = exitGroup;

        this.gateObstacle = { minX: x - 6.5, maxX: x + 6.5, minZ: z - 1.0, maxZ: z + 1.0 };
        this.obstacles.push(this.gateObstacle);
    }

    // --- POPULATE JUNGLE VEGETATION & NATURAL OBSTACLES ---
    populateJungleFloraAndObstacles() {
        const isPath = (x, z) => {
            for (let sp of this.safePlacesData) {
                if (Math.hypot(x - sp.pos.x, z - sp.pos.z) < 9.5) return true;
            }
            if (Math.hypot(x - this.playerPos.x, z - this.playerPos.z) < 8) return true;
            if (z > 40 && Math.abs(x) < 16) return true;
            return false;
        };

        // 1. Tall Rainforest Canopy Trees
        for (let i = 0; i < 44; i++) {
            const tx = (Math.random() - 0.5) * 140;
            const tz = (Math.random() - 0.5) * 140;
            if (!isPath(tx, tz)) this.addCanopyTree(tx, tz);
        }

        // 2. Tropical Coconut Palms
        for (let i = 0; i < 32; i++) {
            const px = (Math.random() - 0.5) * 140;
            const pz = (Math.random() - 0.5) * 140;
            if (!isPath(px, pz)) this.addPalmTree(px, pz);
        }

        // 3. Dense Jungle Bushes & Ferns
        for (let i = 0; i < 70; i++) {
            const fx = (Math.random() - 0.5) * 145;
            const fz = (Math.random() - 0.5) * 145;
            if (!isPath(fx, fz)) {
                if (Math.random() < 0.6) this.addDenseBush(fx, fz);
                else this.addFernCluster(fx, fz);
            }
        }

        // 4. Mossy Boulders
        for (let i = 0; i < 28; i++) {
            const rx = (Math.random() - 0.5) * 135;
            const rz = (Math.random() - 0.5) * 135;
            if (!isPath(rx, rz)) this.addMossyRock(rx, rz);
        }

        // 5. Fallen Logs
        const logLocations = [
            { x: -10, z: -12, rot: 0.6 },
            { x: 12, z: 2, rot: -0.4 },
            { x: -18, z: 2, rot: 1.2 },
            { x: 8, z: 24, rot: -0.8 }
        ];
        logLocations.forEach(loc => this.addFallenLog(loc.x, loc.z, loc.rot));
    }

    addCanopyTree(x, z) {
        const treeGroup = new THREE.Group();
        const trunkHeight = 7.0 + Math.random() * 3.0;
        const trunkMat = new THREE.MeshStandardMaterial({ map: this.textures.bark, roughness: 0.9 });

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, trunkHeight, 8), trunkMat);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const leafMat = new THREE.MeshStandardMaterial({
            color: Math.random() < 0.5 ? 0x2d5224 : 0x38662c,
            roughness: 0.85
        });

        for (let t = 0; t < 3; t++) {
            const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6 - t * 0.5, 8, 8), leafMat);
            dome.position.set((Math.random() - 0.5) * 0.6, trunkHeight + t * 1.6, (Math.random() - 0.5) * 0.6);
            dome.scale.set(1.4, 0.85, 1.4);
            dome.castShadow = true;
            treeGroup.add(dome);
        }

        treeGroup.position.set(x, 0, z);
        this.scene.add(treeGroup);
        this.obstacles.push({ minX: x - 0.7, maxX: x + 0.7, minZ: z - 0.7, maxZ: z + 0.7 });
    }

    addPalmTree(x, z) {
        const palmGroup = new THREE.Group();
        const palmMat = new THREE.MeshStandardMaterial({ map: this.textures.bark, roughness: 0.85 });

        const trunkHeight = 6.5 + Math.random() * 2.0;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, trunkHeight, 7), palmMat);
        trunk.position.y = trunkHeight / 2;
        trunk.rotation.z = (Math.random() - 0.5) * 0.2;
        palmGroup.add(trunk);

        const frondMat = new THREE.MeshStandardMaterial({ color: 0x3b6e27, roughness: 0.8 });
        for (let f = 0; f < 8; f++) {
            const fAngle = (f * Math.PI * 2) / 8;
            const frond = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 3.2), frondMat);
            frond.position.set(Math.cos(fAngle) * 1.3, trunkHeight, Math.sin(fAngle) * 1.3);
            frond.rotation.y = fAngle;
            frond.rotation.x = 0.35;
            palmGroup.add(frond);
        }

        palmGroup.position.set(x, 0, z);
        this.scene.add(palmGroup);
        this.obstacles.push({ minX: x - 0.5, maxX: x + 0.5, minZ: z - 0.5, maxZ: z + 0.5 });
    }

    addDenseBush(x, z) {
        const bushMat = new THREE.MeshStandardMaterial({
            color: Math.random() < 0.5 ? 0x24441c : 0x305a25,
            roughness: 0.9
        });
        const scale = 0.9 + Math.random() * 0.7;
        const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 1), bushMat);
        bush.position.set(x, scale * 0.65, z);
        bush.scale.set(1.3, 0.85, 1.3);
        this.scene.add(bush);
    }

    addFernCluster(x, z) {
        const fernGroup = new THREE.Group();
        const fernMat = new THREE.MeshStandardMaterial({ color: 0x447e2f, roughness: 0.8 });
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 1.6), fernMat);
            leaf.position.set(Math.cos(angle) * 0.6, 0.4, Math.sin(angle) * 0.6);
            leaf.rotation.y = angle;
            leaf.rotation.x = 0.45;
            fernGroup.add(leaf);
        }
        fernGroup.position.set(x, 0, z);
        this.scene.add(fernGroup);
    }

    addMossyRock(x, z) {
        const scale = 0.8 + Math.random() * 1.2;
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 1), new THREE.MeshStandardMaterial({ color: 0x3a483e, roughness: 0.95 }));
        rock.position.set(x, scale * 0.6, z);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        rock.castShadow = true;
        this.scene.add(rock);

        this.obstacles.push({ minX: x - scale * 0.8, maxX: x + scale * 0.8, minZ: z - scale * 0.8, maxZ: z + scale * 0.8 });
    }

    addFallenLog(x, z, rot) {
        const logMat = new THREE.MeshStandardMaterial({ map: this.textures.bark, roughness: 0.95 });
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 5.2, 7), logMat);
        log.rotation.z = Math.PI / 2;
        log.rotation.y = rot;
        log.position.set(x, 0.35, z);
        log.castShadow = true;
        this.scene.add(log);

        this.obstacles.push({ minX: x - 1.8, maxX: x + 1.8, minZ: z - 1.8, maxZ: z + 1.8 });
    }

    // =========================================================================
    // 5. FIRST-PERSON WEAPON VIEWMODELS
    // =========================================================================
    setupWeaponViewmodels() {
        this.weaponGroup = new THREE.Group();

        // 5.1 Tactical 9mm Pistol
        const pistolGroup = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x1f2428, metalness: 0.8, roughness: 0.25 });
        const gripMat = new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.9 });

        const pSlide = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.08, 0.32), metalMat);
        pSlide.position.set(0, 0.04, -0.06);
        pistolGroup.add(pSlide);

        const pBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.18, 8), metalMat);
        pBarrel.rotation.x = Math.PI / 2;
        pBarrel.position.set(0, 0.04, -0.25);
        pistolGroup.add(pBarrel);

        const pGrip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.08), gripMat);
        pGrip.position.set(0, -0.08, 0.04);
        pGrip.rotation.x = -0.3;
        pistolGroup.add(pGrip);

        this.weaponMeshInstances['pistol'] = pistolGroup;
        this.weaponGroup.add(pistolGroup);

        // 5.2 12-Gauge Combat Shotgun
        const shotgunGroup = new THREE.Group();
        const sSteelMat = new THREE.MeshStandardMaterial({ color: 0x2b3238, metalness: 0.75, roughness: 0.3 });
        const sStockMat = new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.85 });

        const sBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.62, 8), sSteelMat);
        sBarrel.rotation.x = Math.PI / 2;
        sBarrel.position.set(0, 0.05, -0.32);
        shotgunGroup.add(sBarrel);

        const sMagTube = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.52, 8), sSteelMat);
        sMagTube.rotation.x = Math.PI / 2;
        sMagTube.position.set(0, 0.0, -0.28);
        shotgunGroup.add(sMagTube);

        const sPump = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.18, 8), sStockMat);
        sPump.rotation.x = Math.PI / 2;
        sPump.position.set(0, 0.0, -0.22);
        shotgunGroup.add(sPump);

        const sStock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.32), sStockMat);
        sStock.position.set(0, -0.04, 0.14);
        shotgunGroup.add(sStock);

        shotgunGroup.visible = false;
        this.weaponMeshInstances['shotgun'] = shotgunGroup;
        this.weaponGroup.add(shotgunGroup);

        // 5.3 M4A1 Jungle Carbine
        const rifleGroup = new THREE.Group();
        const rMat = new THREE.MeshStandardMaterial({ color: 0x181c1f, metalness: 0.7, roughness: 0.35 });
        const rReceiver = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.13, 0.44), rMat);
        rReceiver.position.set(0, 0.02, -0.1);
        rifleGroup.add(rReceiver);

        const rBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 8), rMat);
        rBarrel.rotation.x = Math.PI / 2;
        rBarrel.position.set(0, 0.05, -0.48);
        rifleGroup.add(rBarrel);

        const rMag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.09), new THREE.MeshStandardMaterial({ color: 0x0a0c0e }));
        rMag.position.set(0, -0.12, -0.06);
        rMag.rotation.x = 0.22;
        rifleGroup.add(rMag);

        const rScope = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.22, 8), rMat);
        rScope.rotation.x = Math.PI / 2;
        rScope.position.set(0, 0.11, -0.12);
        rifleGroup.add(rScope);

        rifleGroup.visible = false;
        this.weaponMeshInstances['rifle'] = rifleGroup;
        this.weaponGroup.add(rifleGroup);

        this.muzzleLight = new THREE.PointLight(0xffb300, 0, 10.0);
        this.muzzleLight.position.set(0, 0.05, -0.65);
        this.weaponGroup.add(this.muzzleLight);

        const flashGeom = new THREE.ConeGeometry(0.09, 0.28, 6);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffea75 });
        this.muzzleMesh = new THREE.Mesh(flashGeom, flashMat);
        this.muzzleMesh.rotation.x = -Math.PI / 2;
        this.muzzleMesh.position.set(0, 0.05, -0.72);
        this.muzzleMesh.visible = false;
        this.weaponGroup.add(this.muzzleMesh);

        this.weaponGroup.position.set(0.24, -0.24, -0.5);
        this.camera.add(this.weaponGroup);
    }

    // =========================================================================
    // 6. LEVEL ENTITIES & DIFFICULTY SETUP
    // =========================================================================
    setupLevelEntities() {
        const cfg = this.levelConfigs[this.currentLevel];
        this.timeRemaining = cfg.timeLimit;
        document.getElementById('hud-level-title').innerText = cfg.name;

        // Reset Progression
        this.activeSafePlaceIndex = 0;
        this.safePlacesCompleted = 0;
        this.keysFound = 0;
        this.exitUnlocked = false;
        this.bossSpawned = false;
        this.bossDefeated = false;

        this.safePlacesData.forEach(sp => {
            sp.completed = false;
            sp.autoPrompted = false;
        });

        if (this.gateDoorMesh) this.gateDoorMesh.position.y = 3.0;
        if (this.exitLight) this.exitLight.color.setHex(0xff2222);
        if (!this.obstacles.includes(this.gateObstacle)) this.obstacles.push(this.gateObstacle);

        this.updateSkyBeaconAndKey();
        this.setupPickups();
        this.spawnLevelZombies(cfg.zombieCount);
    }

    setupPickups() {
        this.pickups.forEach(p => { if (p.mesh.parent) this.scene.remove(p.mesh); });
        this.pickups = [];

        // Health Kits
        const medkitSpots = [
            new THREE.Vector3(-12, 0.6, -14),
            new THREE.Vector3(14, 0.6, -8),
            new THREE.Vector3(-6, 0.6, 6),
            new THREE.Vector3(18, 0.6, 26)
        ];
        medkitSpots.forEach(pos => {
            const group = new THREE.Group();
            const box = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.65), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 }));
            group.add(box);
            const cross = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.45), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
            cross.position.y = 0.24;
            group.add(cross);

            group.position.copy(pos);
            this.scene.add(group);
            this.pickups.push({ type: 'health', mesh: group, position: pos, amount: 40, collected: false });
        });

        // Military Ammo Crates
        const ammoSpots = [
            new THREE.Vector3(-4, 0.5, -20),
            new THREE.Vector3(12, 0.5, -16),
            new THREE.Vector3(20, 0.5, 8),
            new THREE.Vector3(-14, 0.5, 20),
            new THREE.Vector3(8, 0.5, 36)
        ];
        ammoSpots.forEach(pos => {
            const group = new THREE.Group();
            const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.38, 0.6), new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 }));
            group.add(box);

            group.position.copy(pos);
            this.scene.add(group);
            this.pickups.push({ type: 'ammo', mesh: group, position: pos, amount: 30, collected: false });
        });

        // Extra Life Pickups
        const lifeSpots = [
            new THREE.Vector3(-8, 0.6, 0),
            new THREE.Vector3(6, 0.6, 18)
        ];
        lifeSpots.forEach(pos => {
            const group = new THREE.Group();
            const heart = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.8 }));
            group.add(heart);

            group.position.copy(pos);
            this.scene.add(group);
            this.pickups.push({ type: 'life', mesh: group, position: pos, amount: 1, collected: false });
        });
    }

    // =========================================================================
    // 7. REALISTIC INFECTED HUMAN ZOMBIES
    // =========================================================================
    spawnLevelZombies(count) {
        this.zombies.forEach(z => { if (z.mesh.parent) this.scene.remove(z.mesh); });
        this.zombies = [];
        if (this.boss && this.boss.mesh.parent) this.scene.remove(this.boss.mesh);
        this.boss = null;

        const cfg = this.levelConfigs[this.currentLevel];

        for (let i = 0; i < count; i++) {
            let zx = (Math.random() - 0.5) * 130;
            let zz = (Math.random() - 0.5) * 130;
            while (Math.hypot(zx - this.playerPos.x, zz - this.playerPos.z) < 20) {
                zx = (Math.random() - 0.5) * 130;
                zz = (Math.random() - 0.5) * 130;
            }

            const isRunner = Math.random() < cfg.runnerChance;
            const isBrute = !isRunner && Math.random() < 0.25;
            const zombieType = isRunner ? 'runner' : (isBrute ? 'brute' : 'shambler');

            this.spawnInfectedZombie(zx, zz, false, zombieType);
        }
    }

    spawnInfectedZombie(x, z, isBoss = false, type = 'shambler') {
        const group = new THREE.Group();
        const scale = isBoss ? 2.4 : (type === 'brute' ? 1.25 : (type === 'runner' ? 0.95 : 1.05));

        const skinPalette = isBoss ? 0x4a1820 : (type === 'runner' ? 0x4d6150 : (type === 'brute' ? 0x3d4a3e : 0x5a6352));
        const skinMat = new THREE.MeshStandardMaterial({ color: skinPalette, roughness: 0.85 });

        const clothPalette = isBoss ? 0x1f1416 : (type === 'runner' ? 0x223545 : (type === 'brute' ? 0x2a3622 : 0x4a3224));
        const shirtMat = new THREE.MeshStandardMaterial({ color: clothPalette, roughness: 0.9 });
        const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1a2228, roughness: 0.95 });
        const bootMat = new THREE.MeshStandardMaterial({ color: 0x0f1114, roughness: 0.8 });

        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52 * scale, 0.74 * scale, 0.32 * scale), shirtMat);
        torso.position.y = 1.15 * scale;
        group.add(torso);

        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.54 * scale, 0.04 * scale);
        torso.add(headGroup);

        const skull = new THREE.Mesh(new THREE.BoxGeometry(0.32 * scale, 0.36 * scale, 0.32 * scale), skinMat);
        headGroup.add(skull);

        const eyeMat = new THREE.MeshBasicMaterial({ color: isBoss ? 0xff0000 : 0xff3322 });
        const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.06 * scale, 0.05 * scale, 0.04 * scale), eyeMat);
        leftEye.position.set(-0.08 * scale, 0.05 * scale, 0.17 * scale);
        headGroup.add(leftEye);

        const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.06 * scale, 0.05 * scale, 0.04 * scale), eyeMat);
        rightEye.position.set(0.08 * scale, 0.05 * scale, 0.17 * scale);
        headGroup.add(rightEye);

        const jawMat = new THREE.MeshStandardMaterial({ color: 0x24080a });
        const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.18 * scale, 0.08 * scale, 0.12 * scale), jawMat);
        jaw.position.set(0, -0.12 * scale, 0.14 * scale);
        headGroup.add(jaw);

        const hairMat = new THREE.MeshStandardMaterial({ color: 0x140e0b, roughness: 0.9 });
        const hair = new THREE.Mesh(new THREE.BoxGeometry(0.34 * scale, 0.12 * scale, 0.34 * scale), hairMat);
        hair.position.set(0, 0.18 * scale, -0.02 * scale);
        headGroup.add(hair);

        const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.14 * scale, 0.72 * scale, 0.14 * scale), skinMat);
        lArm.position.set(-0.36 * scale, 0.12 * scale, 0.28 * scale);
        lArm.rotation.x = -Math.PI / 2.2;
        torso.add(lArm);

        const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.14 * scale, 0.72 * scale, 0.14 * scale), skinMat);
        rArm.position.set(0.36 * scale, 0.12 * scale, 0.28 * scale);
        rArm.rotation.x = -Math.PI / 2.2;
        torso.add(rArm);

        const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18 * scale, 0.82 * scale, 0.18 * scale), pantsMat);
        lLeg.position.set(-0.14 * scale, 0.41 * scale, 0);
        group.add(lLeg);

        const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18 * scale, 0.82 * scale, 0.18 * scale), pantsMat);
        rLeg.position.set(0.14 * scale, 0.41 * scale, 0);
        group.add(rLeg);

        const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.2 * scale, 0.18 * scale, 0.26 * scale), bootMat);
        lBoot.position.set(0, -0.34 * scale, 0.04 * scale);
        lLeg.add(lBoot);

        const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.2 * scale, 0.18 * scale, 0.26 * scale), bootMat);
        rBoot.position.set(0, -0.34 * scale, 0.04 * scale);
        rLeg.add(rBoot);

        if (isBoss) {
            const spikeMat = new THREE.MeshStandardMaterial({ color: 0x11080b, roughness: 0.7 });
            const s1 = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 5), spikeMat);
            s1.position.set(-0.45, 0.4, 0);
            s1.rotation.z = Math.PI / 3;
            torso.add(s1);

            const s2 = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 5), spikeMat);
            s2.position.set(0.45, 0.4, 0);
            s2.rotation.z = -Math.PI / 3;
            torso.add(s2);
        }

        group.position.set(x, 0, z);
        this.scene.add(group);

        const cfg = this.levelConfigs[this.currentLevel];
        const baseHp = isBoss ? cfg.bossHp : (type === 'brute' ? 120 : (type === 'runner' ? 55 : 75));
        const baseSpeed = (isBoss ? 4.8 : (type === 'runner' ? 5.2 : (type === 'brute' ? 2.8 : 3.4))) * cfg.zombieSpeedMult;
        const baseDamage = (isBoss ? 32 : (type === 'brute' ? 24 : 16)) * cfg.zombieDamageMult;

        const zombieObj = {
            mesh: group,
            torso,
            headGroup,
            lArm,
            rArm,
            lLeg,
            rLeg,
            isBoss,
            type,
            health: baseHp,
            maxHealth: baseHp,
            speed: baseSpeed,
            damage: baseDamage,
            attackDist: isBoss ? 3.2 : 1.9,
            detectionRange: 40.0,
            lastAttackTime: 0,
            walkCycle: Math.random() * 10,
            isAlive: true,
            isChasing: false,
            staggerTimer: 0,
            corpseTimer: 10.0
        };

        if (isBoss) {
            this.boss = zombieObj;
        } else {
            this.zombies.push(zombieObj);
        }

        return zombieObj;
    }

    // =========================================================================
    // 8. INPUT LISTENERS
    // =========================================================================
    setupEventListeners() {
        this.canvas.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.init();
            if (this.gameState === 'PLAYING' && document.pointerLockElement !== this.canvas) {
                this.canvas.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = (document.pointerLockElement === this.canvas);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked && this.gameState === 'PLAYING') {
                this.playerYaw -= e.movementX * 0.0024;
                this.playerPitch -= e.movementY * 0.0024;
                this.playerPitch = Math.max(-1.4, Math.min(1.4, this.playerPitch));
            }
        });

        const triggerFire = (e) => {
            if (window.soundEngine) window.soundEngine.init();
            if (this.isPointerLocked && this.gameState === 'PLAYING') {
                // If player is in or looking at active safe place, clicking triggers interaction immediately
                if (this.nearInteractiveObject) {
                    this.interactWithObject(this.nearInteractiveObject);
                    return;
                }
                if (e.button === 0 || e.type === 'dblclick') {
                    this.shootWeapon();
                }
            }
        };
        document.addEventListener('mousedown', triggerFire);
        document.addEventListener('dblclick', triggerFire);

        // Click on on-screen interaction prompt to trigger action directly
        document.getElementById('interaction-prompt').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.nearInteractiveObject) {
                this.interactWithObject(this.nearInteractiveObject);
            }
        });

        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (e.code === 'KeyR' && !this.isReloading) {
                this.reloadWeapon();
            }

            if (e.code === 'Digit1') this.switchWeapon('pistol');
            if (e.code === 'Digit2') this.switchWeapon('shotgun');
            if (e.code === 'Digit3') this.switchWeapon('rifle');

            // Keyboard interaction keys: E, Space, Enter, F, Q, NumpadEnter
            if (['KeyE', 'Space', 'Enter', 'KeyF', 'KeyQ', 'NumpadEnter'].includes(e.code) && this.nearInteractiveObject && this.gameState === 'PLAYING') {
                e.preventDefault();
                this.interactWithObject(this.nearInteractiveObject);
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('wheel', (e) => {
            if (this.gameState !== 'PLAYING') return;
            const available = Object.keys(this.weapons).filter(k => this.weapons[k].unlocked);
            const currentIdx = available.indexOf(this.currentWeaponKey);
            let nextIdx = (e.deltaY > 0) ? (currentIdx + 1) : (currentIdx - 1 + available.length);
            nextIdx = nextIdx % available.length;
            this.switchWeapon(available[nextIdx]);
        });

        document.querySelectorAll('.weapon-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                const slotKey = slot.id.replace('slot-', '');
                this.switchWeapon(slotKey);
            });
        });

        document.getElementById('btn-restart-game').addEventListener('click', () => this.restartCurrentLevel());
        document.getElementById('btn-next-level').addEventListener('click', () => this.advanceToNextLevel());
        document.getElementById('btn-restart-campaign').addEventListener('click', () => this.restartFullCampaign());
    }

    // =========================================================================
    // 9. DYNAMIC PUZZLE MODAL UI & 5 FAST MINI-GAMES (EASY & EFFORTLESS)
    // =========================================================================
    setupPuzzleModalUI() {
        document.getElementById('btn-close-puzzle').addEventListener('click', () => {
            this.closePuzzleModal();
        });

        // ----------------------------------------------------
        // Mini-Game 1: Tactical Safe Keypad (Safe Place 1)
        // ----------------------------------------------------
        document.querySelectorAll('.btn-keypad').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.soundEngine) window.soundEngine.playPuzzleClick();
                const key = btn.getAttribute('data-key');
                if (key !== null) {
                    if (this.keypadCode.length < 3) {
                        this.keypadCode += key;
                        this.updateKeypadDisplay();
                        if (this.keypadCode.length === 3) {
                            this.checkPuzzleSubmission();
                        }
                    }
                }
            });
        });

        const btnKeypadDel = document.getElementById('btn-keypad-del');
        if (btnKeypadDel) {
            btnKeypadDel.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.keypadCode.length > 0) {
                    this.keypadCode = this.keypadCode.slice(0, -1);
                    this.updateKeypadDisplay();
                    if (window.soundEngine) window.soundEngine.playPuzzleClick();
                }
            });
        }

        const btnKeypadClear = document.getElementById('btn-keypad-clear');
        if (btnKeypadClear) {
            btnKeypadClear.addEventListener('click', (e) => {
                e.stopPropagation();
                this.keypadCode = "";
                this.updateKeypadDisplay();
                if (window.soundEngine) window.soundEngine.playPuzzleClick();
            });
        }

        // ----------------------------------------------------
        // Mini-Game 2: Radio Channels (Safe Place 2)
        // ----------------------------------------------------
        document.querySelectorAll('.btn-channel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.radioFreq = parseFloat(btn.getAttribute('data-freq'));
                this.radioBand = btn.getAttribute('data-band');
                document.querySelectorAll('.btn-channel').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateRadioDisplay();
                if (window.soundEngine) window.soundEngine.playPuzzleClick();
                // 1-Click Fast Unlock when Emergency Channel 3 is selected
                if (this.radioFreq === 142.8 && this.radioBand === 'AM') {
                    this.checkPuzzleSubmission();
                }
            });
        });

        // ----------------------------------------------------
        // Mini-Game 3: 3 Ancient Rune Tablets (Safe Place 3)
        // ----------------------------------------------------
        const runeIcons = { solar: '☀️', serpent: '🐍', lunar: '🌙' };
        document.querySelectorAll('.btn-rune').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const rune = btn.getAttribute('data-rune');
                if (this.selectedRunes.length < 3) {
                    this.selectedRunes.push(rune);
                    const slotIdx = this.selectedRunes.length - 1;
                    const slotEl = document.getElementById(`rune-slot-${slotIdx}`);
                    if (slotEl) {
                        slotEl.innerText = runeIcons[rune] || rune;
                        slotEl.classList.add('filled');
                    }
                    if (window.soundEngine) window.soundEngine.playPuzzleClick();
                    const feedback = document.getElementById('puzzle-feedback');
                    feedback.innerText = `RUNES TOUCHED: ${this.selectedRunes.length} / 3`;
                    feedback.className = "puzzle-feedback";
                    if (this.selectedRunes.length === 3) {
                        this.checkPuzzleSubmission();
                    }
                }
            });
        });

        const btnResetRunes = document.getElementById('btn-reset-runes');
        if (btnResetRunes) {
            btnResetRunes.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectedRunes = [];
                for (let i = 0; i < 3; i++) {
                    const slot = document.getElementById(`rune-slot-${i}`);
                    if (slot) {
                        slot.innerText = '?';
                        slot.classList.remove('filled');
                    }
                }
                if (window.soundEngine) window.soundEngine.playPuzzleClick();
                const feedback = document.getElementById('puzzle-feedback');
                feedback.innerText = "RUNES CLEARED. TOUCH 1. SOLAR, 2. SERPENT, 3. LUNAR.";
                feedback.className = "puzzle-feedback";
            });
        }

        // ----------------------------------------------------
        // Mini-Game 4: 3 Circuit Breakers (Safe Place 4)
        // ----------------------------------------------------
        for (let i = 0; i < 3; i++) {
            const btnBreaker = document.getElementById(`btn-breaker-${i}`);
            if (btnBreaker) {
                btnBreaker.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.breakerStates[i] = !this.breakerStates[i];
                    const isOn = this.breakerStates[i];
                    btnBreaker.innerText = isOn ? 'ON' : 'OFF';
                    btnBreaker.classList.toggle('on', isOn);
                    const led = document.getElementById(`breaker-led-${i}`);
                    if (led) {
                        led.classList.toggle('on', isOn);
                        led.classList.toggle('off', !isOn);
                    }
                    if (window.soundEngine) window.soundEngine.playPuzzleClick();
                    const feedback = document.getElementById('puzzle-feedback');
                    feedback.innerText = "PATTERN: [ ON - OFF - ON ]";
                    feedback.className = "puzzle-feedback";
                    if (this.breakerStates[0] === true && this.breakerStates[1] === false && this.breakerStates[2] === true) {
                        this.checkPuzzleSubmission();
                    }
                });
            }
        }

        // ----------------------------------------------------
        // Mini-Game 5: 3x3 Radar Grid (Safe Place 5)
        // ----------------------------------------------------
        this.buildRadarGrid();

        const btnResetRadar = document.getElementById('btn-reset-radar');
        if (btnResetRadar) {
            btnResetRadar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectedRadarSectors.clear();
                document.querySelectorAll('.radar-cell').forEach(c => c.classList.remove('selected'));
                const cnt = document.getElementById('radar-selected-count');
                if (cnt) cnt.innerText = "0 / 2";
                if (window.soundEngine) window.soundEngine.playPuzzleClick();
                const feedback = document.getElementById('puzzle-feedback');
                feedback.innerText = "TARGETS CLEARED. MARK SECTOR A-1 AND B-2.";
                feedback.className = "puzzle-feedback";
            });
        }

        // Master Unlock & Submit Button
        document.getElementById('btn-unlock-cache').addEventListener('click', (e) => {
            e.stopPropagation();
            this.checkPuzzleSubmission();
        });

        // Claim Reward Button
        document.getElementById('btn-claim-reward').addEventListener('click', (e) => {
            e.stopPropagation();
            this.claimPuzzleReward();
        });

        // Keyboard navigation inside puzzle modal
        window.addEventListener('keydown', (e) => {
            if (this.gameState === 'PUZZLE') {
                if (e.code === 'Enter' || e.code === 'NumpadEnter') {
                    e.preventDefault();
                    this.checkPuzzleSubmission();
                } else if (e.code === 'Escape') {
                    this.closePuzzleModal();
                } else if (this.currentPuzzleSafePlace && this.currentPuzzleSafePlace.id === 1) {
                    if (/^[0-9]$/.test(e.key)) {
                        if (this.keypadCode.length < 3) {
                            this.keypadCode += e.key;
                            this.updateKeypadDisplay();
                            if (window.soundEngine) window.soundEngine.playPuzzleClick();
                            if (this.keypadCode.length === 3) {
                                this.checkPuzzleSubmission();
                            }
                        }
                    } else if (e.key === 'Backspace') {
                        if (this.keypadCode.length > 0) {
                            this.keypadCode = this.keypadCode.slice(0, -1);
                            this.updateKeypadDisplay();
                            if (window.soundEngine) window.soundEngine.playPuzzleClick();
                        }
                    }
                }
            }
        });
    }

    updateKeypadDisplay() {
        const disp = document.getElementById('keypad-display');
        if (!disp) return;
        const code = this.keypadCode;
        let str = '';
        for (let i = 0; i < 3; i++) {
            str += (i < code.length ? code[i] : '_') + (i < 2 ? ' ' : '');
        }
        disp.innerText = str;
    }

    buildRadarGrid() {
        const grid = document.getElementById('radar-grid-container');
        if (!grid) return;
        grid.innerHTML = '';
        const rows = ['A', 'B', 'C'];
        rows.forEach(r => {
            for (let c = 1; c <= 3; c++) {
                const sectorId = `${r}${c}`;
                const cell = document.createElement('div');
                cell.className = 'radar-cell';
                cell.id = `radar-${sectorId}`;
                cell.innerText = `${r}-${c}`;
                cell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.selectedRadarSectors.has(sectorId)) {
                        this.selectedRadarSectors.delete(sectorId);
                        cell.classList.remove('selected');
                    } else if (this.selectedRadarSectors.size < 2) {
                        this.selectedRadarSectors.add(sectorId);
                        cell.classList.add('selected');
                    }
                    const cnt = document.getElementById('radar-selected-count');
                    if (cnt) cnt.innerText = `${this.selectedRadarSectors.size} / 2`;
                    if (window.soundEngine) window.soundEngine.playPuzzleClick();
                    const feedback = document.getElementById('puzzle-feedback');
                    feedback.innerText = `SECTORS MARKED: ${this.selectedRadarSectors.size} / 2`;
                    feedback.className = "puzzle-feedback";
                    if (this.selectedRadarSectors.size === 2 && this.selectedRadarSectors.has('A1') && this.selectedRadarSectors.has('B2')) {
                        this.checkPuzzleSubmission();
                    }
                });
                grid.appendChild(cell);
            }
        });
    }

    updateRadioDisplay() {
        const freqEl = document.getElementById('radio-freq-val');
        if (freqEl) freqEl.innerHTML = `${this.radioFreq.toFixed(1)} <span class="unit">MHz</span>`;
        const bandEl = document.getElementById('radio-band-val');
        if (bandEl) bandEl.innerText = `${this.radioBand} (${this.radioBand === 'AM' ? 'HIGH BAND' : 'LOW BAND'})`;

        const isTarget = (Math.abs(this.radioFreq - 142.8) < 0.1 && this.radioBand === 'AM');
        const resonancePct = isTarget ? 100 : 20;

        const pctEl = document.getElementById('signal-percent');
        if (pctEl) pctEl.innerText = `${resonancePct}%`;
        const barFill = document.getElementById('signal-bar-fill');
        if (barFill) barFill.style.width = `${resonancePct}%`;
    }

    openPuzzleModal(safePlace) {
        this.gameState = 'PUZZLE';
        this.currentPuzzleSafePlace = safePlace;

        if (document.exitPointerLock) document.exitPointerLock();

        const sp = safePlace;
        document.getElementById('puzzle-header-title').innerText = `📋 SAFE PLACE ${sp.id}: ${sp.name}`;
        document.getElementById('puzzle-modal-title').innerText = sp.title;
        document.getElementById('puzzle-modal-entry').innerText = `"${sp.clue}"`;

        // Hide all 5 mini-game views and reveal only the active one
        for (let i = 1; i <= 5; i++) {
            const view = document.getElementById(`game-view-${i}`);
            if (view) view.classList.toggle('hidden', i !== sp.id);
        }
        const gameTitleEl = document.getElementById('puzzle-game-title');
        if (gameTitleEl) gameTitleEl.innerText = sp.gameTitle;

        // Populate dynamic clue breakdown
        const clueBox = document.getElementById('clue-content');
        if (clueBox) {
            if (sp.id === 1) {
                clueBox.innerHTML = `
                    <div class="clue-item">🔢 Outpost Lockbox PIN: <strong class="clue-val">3 - 8 - 1</strong></div>
                    <div class="clue-item">⚡ Action: <strong class="clue-val">Tap 3, 8, 1 on Keypad</strong></div>
                `;
            } else if (sp.id === 2) {
                clueBox.innerHTML = `
                    <div class="clue-item">📡 Evac Channel: <strong class="clue-val">CH 3 (142.8 AM ★ EMERGENCY)</strong></div>
                    <div class="clue-item">⚡ Action: <strong class="clue-val">Click Channel 3 button</strong></div>
                `;
            } else if (sp.id === 3) {
                clueBox.innerHTML = `
                    <div class="clue-item">🗿 Sacred Order: <strong class="clue-val">☀️ SOLAR → 🐍 SERPENT → 🌙 LUNAR</strong></div>
                    <div class="clue-item">⚡ Action: <strong class="clue-val">Tap the 3 runes in order</strong></div>
                `;
            } else if (sp.id === 4) {
                clueBox.innerHTML = `
                    <div class="clue-item">⚡ Breaker Sequence: <strong class="clue-val">[ ON - OFF - ON ]</strong></div>
                    <div class="clue-item">⚡ Action: <strong class="clue-val">Switch 1 & 3 to ON (Leave 2 OFF)</strong></div>
                `;
            } else if (sp.id === 5) {
                clueBox.innerHTML = `
                    <div class="clue-item">🎯 Evac Coordinates: <strong class="clue-val">Sector A-1 & Sector B-2</strong></div>
                    <div class="clue-item">⚡ Action: <strong class="clue-val">Click cells A-1 and B-2</strong></div>
                `;
            }
        }

        document.getElementById('puzzle-modal-footer').innerHTML = `🔑 FAST CLUE: <strong style="color:#ffd700; font-size:15px;">${sp.footer}</strong>`;
        document.getElementById('puzzle-modal-rewards').innerHTML = `<span class="reward-badge">${sp.rewardText}</span>`;

        // Reset the corresponding mini-game to initial state
        if (sp.id === 1) {
            this.keypadCode = "";
            this.updateKeypadDisplay();
        } else if (sp.id === 2) {
            this.radioFreq = 98.5;
            this.radioBand = 'FM';
            document.querySelectorAll('.btn-channel').forEach(b => b.classList.remove('active'));
            this.updateRadioDisplay();
        } else if (sp.id === 3) {
            this.selectedRunes = [];
            for (let i = 0; i < 3; i++) {
                const slot = document.getElementById(`rune-slot-${i}`);
                if (slot) {
                    slot.innerText = '?';
                    slot.classList.remove('filled');
                }
            }
        } else if (sp.id === 4) {
            this.breakerStates = [false, false, false];
            for (let i = 0; i < 3; i++) {
                const btn = document.getElementById(`btn-breaker-${i}`);
                if (btn) {
                    btn.innerText = 'OFF';
                    btn.classList.remove('on');
                }
                const led = document.getElementById(`breaker-led-${i}`);
                if (led) {
                    led.classList.remove('on');
                    led.classList.add('off');
                }
            }
        } else if (sp.id === 5) {
            this.selectedRadarSectors.clear();
            document.querySelectorAll('.radar-cell').forEach(c => c.classList.remove('selected'));
            const cnt = document.getElementById('radar-selected-count');
            if (cnt) cnt.innerText = '0 / 2';
        }

        document.getElementById('puzzle-reward-banner').classList.add('hidden');
        const feedback = document.getElementById('puzzle-feedback');
        feedback.innerText = "ALIGN THE CONTROLS TO UNLOCK THE CACHE";
        feedback.className = "puzzle-feedback";

        document.getElementById('puzzle-modal').classList.remove('hidden');
    }

    closePuzzleModal() {
        document.getElementById('puzzle-modal').classList.add('hidden');
        this.gameState = 'PLAYING';
        if (this.canvas.requestPointerLock) this.canvas.requestPointerLock();
    }

    checkPuzzleSubmission() {
        const sp = this.currentPuzzleSafePlace || this.safePlacesData[this.activeSafePlaceIndex];
        if (!sp) return;

        let success = false;
        let errMsg = "❌ INCORRECT SOLUTION! REVIEW THE CLUES IN THE LOG.";

        if (sp.id === 1) {
            // Tactical Keypad
            success = (this.keypadCode === sp.code);
            if (!success) {
                errMsg = "❌ INCORRECT PIN! TAP [3], [8], [1] ON KEYPAD.";
            }
        } else if (sp.id === 2) {
            // Radio Channel Tuner
            success = (Math.abs(this.radioFreq - sp.targetFreq) < 0.1 && this.radioBand === sp.targetBand);
            if (!success) {
                errMsg = "❌ CLICK CHANNEL 3 (142.8 AM ★ EMERGENCY)!";
            }
        } else if (sp.id === 3) {
            // 3 Sacred Runes
            if (this.selectedRunes.length < 3) {
                errMsg = `❌ TOUCH ALL 3 SACRED RUNES! (${this.selectedRunes.length}/3 TOUCHED)`;
            } else if (this.selectedRunes.every((r, idx) => r === sp.targetRunes[idx])) {
                success = true;
            } else {
                errMsg = "❌ TOUCH IN SACRED ORDER: 1. SOLAR, 2. SERPENT, 3. LUNAR.";
            }
        } else if (sp.id === 4) {
            // 3 Circuit Breakers
            success = this.breakerStates.every((b, idx) => b === sp.targetBreakers[idx]);
            if (!success) {
                errMsg = "❌ FLIP SWITCH 1 AND 3 TO ON (LEAVE SWITCH 2 OFF).";
            }
        } else if (sp.id === 5) {
            // 3x3 Tactical Radar Grid
            if (this.selectedRadarSectors.size !== 2) {
                errMsg = `❌ MARK EXACTLY 2 LANDING SECTORS! (${this.selectedRadarSectors.size}/2 MARKED)`;
            } else if (sp.targetSectors.every(s => this.selectedRadarSectors.has(s))) {
                success = true;
            } else {
                errMsg = "❌ MARK SECTORS A-1 AND B-2.";
            }
        }

        const feedback = document.getElementById('puzzle-feedback');

        if (success) {
            if (window.soundEngine) window.soundEngine.playPuzzleSuccess();
            feedback.innerText = `⚡ UNLOCKED! CLAIMING KEY #${sp.id}...`;
            feedback.className = "puzzle-feedback success";
            document.getElementById('puzzle-reward-banner').classList.remove('hidden');

            setTimeout(() => {
                this.claimPuzzleReward(sp);
            }, 350);
        } else {
            if (window.soundEngine) window.soundEngine.playPuzzleClick();
            feedback.innerText = errMsg;
            feedback.className = "puzzle-feedback error";
        }
    }

    claimPuzzleReward(spOverride) {
        const sp = spOverride || this.currentPuzzleSafePlace || this.safePlacesData[this.activeSafePlaceIndex];
        if (!sp) return;

        if (sp.completed) return;
        sp.completed = true;

        this.keysFound = Math.min(this.totalKeys, this.keysFound + 1);
        this.safePlacesCompleted = Math.min(5, this.safePlacesCompleted + 1);

        if (window.soundEngine) window.soundEngine.playPickup('key');

        if (sp.unlocksWeapon && this.weapons[sp.unlocksWeapon]) {
            this.weapons[sp.unlocksWeapon].unlocked = true;
            this.weapons[sp.unlocksWeapon].reserve += 45;
            this.switchWeapon(sp.unlocksWeapon);
        }

        this.health = Math.min(this.maxHealth, this.health + 40);

        this.closePuzzleModal();

        // Advance to Next Safe Place or Unlock Extraction Gate!
        if (this.activeSafePlaceIndex < 4) {
            this.activeSafePlaceIndex++;
            const nextSP = this.safePlacesData[this.activeSafePlaceIndex];
            this.showToastNotification(`🔑 KEY #${sp.id} FOUND! (${this.keysFound}/5 KEYS) SAFE PLACE ${nextSP.id} (${nextSP.name}) MARKED!`, "#00ff88");
        } else {
            this.activeSafePlaceIndex = 5;
            this.showToastNotification("🚪 ALL 5 KEYS FOUND! HEAD TO EXTRACTION GATE (0, 52)!", "#ffd700");
        }

        this.updateSkyBeaconAndKey();
        this.updateHUD();
    }

    // =========================================================================
    // 10. WEAPON COMBAT & ACOUSTIC ZOMBIE ATTRACTION
    // =========================================================================
    switchWeapon(weaponKey) {
        if (!this.weapons[weaponKey] || !this.weapons[weaponKey].unlocked) return;
        this.currentWeaponKey = weaponKey;

        Object.keys(this.weaponMeshInstances).forEach(k => {
            this.weaponMeshInstances[k].visible = (k === weaponKey);
        });

        document.querySelectorAll('.weapon-slot').forEach(slot => {
            const slotKey = slot.id.replace('slot-', '');
            slot.classList.toggle('active', slotKey === weaponKey);
            slot.classList.toggle('locked', !this.weapons[slotKey].unlocked);
            if (this.weapons[slotKey].unlocked) {
                slot.innerHTML = `<span class="slot-num">${slot.getAttribute('data-slot')}</span> ${this.weapons[slotKey].name}`;
            }
        });

        if (window.soundEngine) window.soundEngine.playReload();
        this.updateHUD();
    }

    shootWeapon() {
        const wpn = this.weapons[this.currentWeaponKey];
        const now = performance.now() / 1000;
        if (now - this.lastShotTime < wpn.cooldown) return;
        if (this.isReloading) return;

        if (wpn.clip <= 0) {
            this.reloadWeapon();
            return;
        }

        wpn.clip--;
        this.lastShotTime = now;

        if (window.soundEngine) {
            if (this.currentWeaponKey === 'shotgun') window.soundEngine.playShotgun();
            else if (this.currentWeaponKey === 'rifle') window.soundEngine.playRifle();
            else window.soundEngine.playPistol();
        }

        // Acoustic Zombie Hearing: Gunshots alert nearby zombies
        const alertRadius = this.currentWeaponKey === 'pistol' ? 24.0 : 42.0;
        this.zombies.forEach(z => {
            if (z.isAlive) {
                const dist = Math.hypot(z.mesh.position.x - this.playerPos.x, z.mesh.position.z - this.playerPos.z);
                if (dist < alertRadius) {
                    z.isChasing = true;
                }
            }
        });

        this.gunRecoilZ = this.currentWeaponKey === 'shotgun' ? 0.12 : 0.06;
        this.gunRecoilRot = this.currentWeaponKey === 'shotgun' ? 0.22 : 0.1;
        this.muzzleFlashTimer = 0.08;
        this.muzzleMesh.visible = true;
        this.muzzleLight.intensity = 3.5;

        let hitAnyZombie = false;
        for (let p = 0; p < wpn.pellets; p++) {
            const spreadX = (Math.random() - 0.5) * wpn.spread;
            const spreadY = (Math.random() - 0.5) * wpn.spread;

            const aimDir = new THREE.Vector3(spreadX, spreadY, -1).applyQuaternion(this.camera.quaternion).normalize();
            const ray = new THREE.Raycaster(this.camera.position, aimDir, 0.1, 90);

            const targets = [];
            this.zombies.forEach(z => { if (z.isAlive) targets.push({ obj: z, mesh: z.mesh }); });
            if (this.boss && this.boss.isAlive) targets.push({ obj: this.boss, mesh: this.boss.mesh });

            for (let t of targets) {
                const intersects = ray.intersectObjects(t.mesh.children, true);
                if (intersects.length > 0) {
                    const hit = intersects[0];
                    hitAnyZombie = true;
                    this.damageZombie(t.obj, wpn.damage, hit.point);
                    break;
                }
            }
        }

        if (hitAnyZombie) {
            this.showHitmarker();
        }

        this.updateHUD();
    }

    damageZombie(zombie, damage, hitPoint) {
        zombie.health -= damage;
        zombie.staggerTimer = 0.2;
        if (window.soundEngine) window.soundEngine.playZombieHit();

        this.spawnBloodParticles(hitPoint || zombie.mesh.position);

        if (zombie.isBoss) {
            this.updateBossHealthBar();
        }

        if (zombie.health <= 0 && zombie.isAlive) {
            this.killZombie(zombie);
        }
    }

    killZombie(zombie) {
        zombie.isAlive = false;
        this.zombieKills++;
        this.totalCampaignKills++;

        zombie.mesh.rotation.x = -Math.PI / 2.2;
        zombie.mesh.position.y = 0.2;

        if (zombie.isBoss) {
            this.bossDefeated = true;
            document.getElementById('boss-hud').classList.add('hidden');
            this.showToastNotification("👑 MAIN ZOMBIE ELIMINATED! EXTRACTION PORTAL READY!", "#00ff88");
            this.unlockExitGate();
        }

        this.updateHUD();
    }

    reloadWeapon() {
        const wpn = this.weapons[this.currentWeaponKey];
        if (wpn.clip >= wpn.maxClip || wpn.reserve <= 0 || this.isReloading) return;

        this.isReloading = true;
        if (window.soundEngine) window.soundEngine.playReload();

        setTimeout(() => {
            const needed = wpn.maxClip - wpn.clip;
            const toAdd = Math.min(needed, wpn.reserve);
            wpn.clip += toAdd;
            wpn.reserve -= toAdd;
            this.isReloading = false;
            this.updateHUD();
        }, 1200);
    }

    showHitmarker() {
        const cross = document.getElementById('crosshair');
        cross.classList.add('hit');
        clearTimeout(this.hitmarkerTimeout);
        this.hitmarkerTimeout = setTimeout(() => cross.classList.remove('hit'), 120);
    }

    spawnBloodParticles(pos) {
        for (let i = 0; i < 6; i++) {
            const p = new THREE.Mesh(new THREE.SphereGeometry(0.045, 4, 4), new THREE.MeshBasicMaterial({ color: 0x990000 }));
            p.position.copy(pos);
            this.scene.add(p);

            this.particles.push({
                mesh: p,
                life: 0.45,
                vx: (Math.random() - 0.5) * 3.5,
                vy: Math.random() * 2.5 + 0.5,
                vz: (Math.random() - 0.5) * 3.5
            });
        }
    }

    // =========================================================================
    // 11. PLAYER INTERACTION & SANCTUARY CHECK
    // =========================================================================
    isPlayerInSafePlace() {
        for (let sp of this.safePlacesData) {
            if (Math.hypot(this.playerPos.x - sp.pos.x, this.playerPos.z - sp.pos.z) < sp.radius) {
                return sp;
            }
        }
        return null;
    }

    checkProximityInteractions() {
        const prompt = document.getElementById('interaction-prompt');
        const promptText = document.getElementById('prompt-text');

        // Check if player is near the currently active Safe Place
        if (this.activeSafePlaceIndex < 5) {
            const currentSP = this.safePlacesData[this.activeSafePlaceIndex];
            const dist = Math.hypot(this.playerPos.x - currentSP.pos.x, this.playerPos.z - currentSP.pos.z);

            // 1. Direct key collection if walking right into the floating key mesh (dist < 2.0m)
            if (dist < 2.0) {
                this.claimPuzzleReward(currentSP);
                return;
            }

            // 2. Auto-open Field Log & Puzzle modal when walking inside sanctuary structure (dist < 4.5m)
            if (dist < 4.5 && !currentSP.autoPrompted && this.gameState === 'PLAYING') {
                currentSP.autoPrompted = true;
                this.nearInteractiveObject = { type: 'safe_place', data: currentSP };
                this.openPuzzleModal(currentSP);
                return;
            }

            // 3. Proximity prompt detection range (dist < currentSP.radius)
            if (dist < currentSP.radius) {
                this.nearInteractiveObject = { type: 'safe_place', data: currentSP };
                promptText.innerText = `PRESS [E] / [SPACE] / [CLICK] TO OPEN LOG & UNLOCK KEY #${currentSP.id}`;
                prompt.classList.remove('hidden');
                return;
            }
        }

        // Check Exit Gate
        const distExit = Math.hypot(this.playerPos.x - 0, this.playerPos.z - 52);
        if (distExit < 7.5) {
            if (this.keysFound >= 5 && this.bossDefeated) {
                this.nearInteractiveObject = { type: 'exit' };
                promptText.innerText = "STEP INTO EXTRACTION PORTAL TO ESCAPE JUNGLE";
                prompt.classList.remove('hidden');
                return;
            } else if (this.keysFound >= 5 && !this.bossDefeated) {
                this.nearInteractiveObject = null;
                promptText.innerText = "⚠️ DEFEAT MAIN ZOMBIE BOSS TO UNLOCK PORTAL!";
                prompt.classList.remove('hidden');
                return;
            } else {
                this.nearInteractiveObject = null;
                promptText.innerText = `BLAST GATE LOCKED — FIND ALL 5 KEYS (${this.keysFound}/5)`;
                prompt.classList.remove('hidden');
                return;
            }
        }

        this.nearInteractiveObject = null;
        prompt.classList.add('hidden');
    }

    interactWithObject(obj) {
        if (!obj) return;
        if (obj.type === 'safe_place') {
            this.openPuzzleModal(obj.data);
        } else if (obj.type === 'exit') {
            this.completeLevel();
        }
    }

    // =========================================================================
    // 12. BOSS & LEVEL ADVANCEMENT
    // =========================================================================
    triggerBossEncounter() {
        if (this.bossSpawned) return;
        this.bossSpawned = true;

        if (window.soundEngine) {
            window.soundEngine.playBossRoar();
            window.soundEngine.playZombieGrowl(true);
        }

        this.spawnInfectedZombie(0, 60, true, 'boss');

        document.getElementById('hud-objective').innerText = "⚠️ DEFEAT THE MAIN ZOMBIE TO UNLOCK EXTRACTION GATE!";
        document.getElementById('boss-hud').classList.remove('hidden');
        this.updateBossHealthBar();

        this.showToastNotification("⚠️ WARNING: MAIN ZOMBIE BOSS DETECTED AT EXTRACTION GATE!", "#ff1100");
    }

    updateBossHealthBar() {
        if (!this.boss) return;
        const fill = document.getElementById('boss-health-fill');
        const ratio = Math.max(0, this.boss.health / this.boss.maxHealth);
        fill.style.width = `${ratio * 100}%`;
    }

    unlockExitGate() {
        this.exitUnlocked = true;
        if (this.gateDoorMesh) this.gateDoorMesh.position.y = 8.5;
        if (this.exitLight) this.exitLight.color.setHex(0x00ff88);

        const idx = this.obstacles.indexOf(this.gateObstacle);
        if (idx !== -1) this.obstacles.splice(idx, 1);

        if (window.soundEngine) window.soundEngine.playGateUnlock();
        document.getElementById('hud-objective').innerText = "ESCAPE THROUGH THE EXTRACTION PORTAL!";
        document.getElementById('hud-objective').classList.add('urgent');
    }

    completeLevel() {
        this.gameState = 'LEVELWIN';
        if (document.exitPointerLock) document.exitPointerLock();
        if (window.soundEngine) window.soundEngine.playWin();

        const cfg = this.levelConfigs[this.currentLevel];
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = Math.floor(this.timeRemaining % 60);
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        document.getElementById('win-level-name').innerText = `${cfg.name} COMPLETED`;
        document.getElementById('win-time').innerText = timeStr;
        document.getElementById('win-kills').innerText = this.zombieKills;
        document.getElementById('win-keys').innerText = `${this.keysFound}/5`;

        const unlockedList = Object.keys(this.weapons).filter(k => this.weapons[k].unlocked).map(k => this.weapons[k].name).join(', ');
        document.getElementById('win-weapons').innerText = unlockedList;

        if (this.currentLevel < this.maxLevels) {
            document.getElementById('level-win-modal').classList.remove('hidden');
        } else {
            document.getElementById('final-total-kills').innerText = this.totalCampaignKills;
            document.getElementById('final-win-modal').classList.remove('hidden');
        }
    }

    advanceToNextLevel() {
        document.getElementById('level-win-modal').classList.add('hidden');
        this.currentLevel++;
        this.restartLevelSetup();
    }

    restartCurrentLevel() {
        document.getElementById('game-over-modal').classList.add('hidden');
        this.restartLevelSetup();
    }

    restartFullCampaign() {
        document.getElementById('final-win-modal').classList.add('hidden');
        this.currentLevel = 1;
        this.totalCampaignKills = 0;
        this.weapons['shotgun'].unlocked = false;
        this.weapons['rifle'].unlocked = false;
        this.restartLevelSetup();
    }

    restartLevelSetup() {
        this.gameState = 'PLAYING';
        this.health = this.maxHealth;
        this.lives = 3;
        this.zombieKills = 0;
        this.playerPos.set(-14, 1.7, -18);
        this.playerYaw = 0;
        this.playerPitch = 0;

        document.getElementById('boss-hud').classList.add('hidden');

        this.setupLevelEntities();
        this.updateHUD();

        if (this.canvas.requestPointerLock) this.canvas.requestPointerLock();
    }

    // =========================================================================
    // 13. CIRCULAR NAVIGATION MAP (MINIMAP)
    // =========================================================================
    renderCircularMinimap(dt) {
        const ctx = this.minimapCtx;
        const width = this.minimapCanvas.width;
        const height = this.minimapCanvas.height;
        const radius = width / 2;
        const mapScale = 2.1;

        ctx.clearRect(0, 0, width, height);

        ctx.save();
        ctx.beginPath();
        ctx.arc(radius, radius, radius - 2, 0, Math.PI * 2);
        ctx.clip();

        ctx.fillStyle = '#06110a';
        ctx.fillRect(0, 0, width, height);

        // Radar Rings
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.15)';
        ctx.lineWidth = 1;
        [15, 30, 45].forEach(range => {
            ctx.beginPath();
            ctx.arc(radius, radius, range * mapScale, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(radius, 0); ctx.lineTo(radius, height);
        ctx.moveTo(0, radius); ctx.lineTo(width, radius);
        ctx.stroke();

        // Radar Sweep
        this.radarSweepAngle += dt * 2.4;
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(this.radarSweepAngle);
        const sweep = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        sweep.addColorStop(0, 'rgba(0, 255, 136, 0)');
        sweep.addColorStop(1, 'rgba(0, 255, 136, 0.22)');
        ctx.fillStyle = sweep;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, 0, Math.PI * 0.28);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        const toMap = (wx, wz) => {
            const dx = (wx - this.playerPos.x) * mapScale;
            const dz = (wz - this.playerPos.z) * mapScale;
            return { x: radius + dx, y: radius + dz };
        };

        // 13.1 Draw Safe Places on Minimap
        this.safePlacesData.forEach((sp, idx) => {
            const pt = toMap(sp.pos.x, sp.pos.z);
            const isTarget = (idx === this.activeSafePlaceIndex);
            const isDone = (idx < this.activeSafePlaceIndex);

            ctx.beginPath();
            if (isTarget) {
                const pulse = 5 + Math.sin(Date.now() * 0.008) * 3;
                ctx.fillStyle = '#00ff88';
                ctx.shadowColor = '#00ff88';
                ctx.shadowBlur = 10;
                ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 1.5;
                ctx.arc(pt.x, pt.y, pulse, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;

                ctx.fillStyle = '#ffffff';
                ctx.font = '800 8px sans-serif';
                ctx.fillText(`SP ${sp.id}`, pt.x - 9, pt.y - 7);
            } else if (isDone) {
                ctx.fillStyle = '#22c55e';
                ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = '#64748b';
                ctx.arc(pt.x, pt.y, 3.0, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // 13.2 Draw Exit Gate
        const exitPt = toMap(0, 52);
        ctx.fillStyle = this.exitUnlocked ? '#00ff88' : '#ff00ff';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.fillRect(exitPt.x - 7, exitPt.y - 3, 14, 6);
        ctx.shadowBlur = 0;

        // 13.3 Draw Pickups
        this.pickups.forEach(p => {
            if (!p.collected) {
                const pt = toMap(p.position.x, p.position.z);
                ctx.fillStyle = p.type === 'health' ? '#22c55e' : (p.type === 'ammo' ? '#f59e0b' : '#f43f5e');
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 3.0, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // 13.4 DYNAMIC RED ZOMBIE MARKERS (Appears within 38m, disappears when outside)
        const detectionRadius = 38.0;
        this.zombies.forEach(z => {
            if (z.isAlive) {
                const distToPlayer = Math.hypot(z.mesh.position.x - this.playerPos.x, z.mesh.position.z - this.playerPos.z);
                if (distToPlayer <= detectionRadius) {
                    const pt = toMap(z.mesh.position.x, z.mesh.position.z);
                    ctx.fillStyle = '#ff2222';
                    ctx.shadowColor = '#ff2222';
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }
        });

        // 13.5 Main Zombie Boss Marker
        if (this.boss && this.boss.isAlive) {
            const bPt = toMap(this.boss.mesh.position.x, this.boss.mesh.position.z);
            const bPulse = 7 + Math.sin(Date.now() * 0.01) * 2.5;
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(bPt.x, bPt.y, bPulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 9px sans-serif';
            ctx.fillText('BOSS', bPt.x - 12, bPt.y - 9);
            ctx.shadowBlur = 0;
        }

        // 13.6 Player Marker (Cyan Arrow at Center)
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(-this.playerYaw);
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(5, 5);
        ctx.lineTo(0, 2);
        ctx.lineTo(-5, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.restore(); // End clip

        // Bezel
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(radius, radius, radius - 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#a3c4b0';
        ctx.font = '800 10px monospace';
        ctx.fillText('N', radius - 3, 14);
        ctx.fillText('S', radius - 3, height - 6);
        ctx.fillText('W', 6, radius + 3);
        ctx.fillText('E', width - 14, radius + 3);
    }

    // =========================================================================
    // 14. HUD UPDATES & REAL-TIME DISTANCE
    // =========================================================================
    updateHUD() {
        document.getElementById('hud-health-text').innerText = `HEALTH: ${Math.max(0, Math.round(this.health))}`;
        document.getElementById('health-bar-fill').style.width = `${Math.max(0, this.health)}%`;
        document.getElementById('hud-lives').innerText = `❤️ LIVES: ${this.lives}`;

        document.getElementById('hud-safe-places').innerText = `🏕️ SAFE PLACES: ${this.safePlacesCompleted}/5`;
        document.getElementById('hud-keys').innerText = `🔑 KEYS: ${this.keysFound}/5`;
        document.getElementById('hud-kills').innerText = `🧟 ZOMBIES: ${this.zombieKills}`;

        const wpn = this.weapons[this.currentWeaponKey];
        document.getElementById('hud-ammo').innerText = `AMMO: ${wpn.clip}/${wpn.reserve}`;

        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = Math.floor(this.timeRemaining % 60);
        const timeEl = document.getElementById('hud-timer');
        timeEl.innerText = `⏱️ TIME LEFT: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        timeEl.classList.toggle('urgent', this.timeRemaining < 60);

        this.updateObjectiveDistance();
    }

    updateObjectiveDistance() {
        const objEl = document.getElementById('hud-objective');
        if (!objEl) return;
        if (this.activeSafePlaceIndex < 5) {
            const sp = this.safePlacesData[this.activeSafePlaceIndex];
            const dist = Math.round(Math.hypot(this.playerPos.x - sp.pos.x, this.playerPos.z - sp.pos.z));
            objEl.innerText = `OBJECTIVE: REACH SAFE PLACE ${sp.id} (${sp.name}) [${dist}m AWAY]`;
            objEl.classList.remove('urgent');
        } else {
            const distExit = Math.round(Math.hypot(this.playerPos.x - 0, this.playerPos.z - 52));
            objEl.innerText = `OBJECTIVE: ESCAPE THROUGH EXTRACTION GATE [${distExit}m AWAY]`;
            objEl.classList.add('urgent');
        }
    }

    showToastNotification(text, color = '#00ff88') {
        const toast = document.getElementById('touch-toast');
        toast.innerText = text;
        toast.style.borderColor = color;
        toast.classList.remove('hidden');
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => toast.classList.add('hidden'), 3200);
    }

    // =========================================================================
    // 15. MAIN ENGINE LOOP & ZOMBIE AI
    // =========================================================================
    animate() {
        requestAnimationFrame(() => this.animate());

        const now = performance.now();
        const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = now;

        if (this.gameState === 'PLAYING') {
            this.updateTimer(dt);
            this.updatePlayerMovement(dt);
            this.updateWeaponAnimation(dt);
            this.updateZombieAI(dt);
            this.updatePickups(dt);
            this.updateParticles(dt);
            this.checkProximityInteractions();
            this.updateObjectiveDistance();
        }

        // Animate Floating Sky Beacon and 3D Golden Key
        if (this.targetBeaconMesh) {
            this.targetBeaconMesh.rotation.y += dt * 1.2;
            this.targetBeaconMesh.material.opacity = 0.45 + Math.sin(now * 0.004) * 0.2;
        }
        if (this.floatingKeyMesh && this.floatingKeyMesh.visible) {
            this.floatingKeyMesh.rotation.y += dt * 2.5;
            this.floatingKeyMesh.position.y += Math.sin(now * 0.005) * 0.002;
        }

        this.renderCircularMinimap(dt);
        this.renderer.render(this.scene, this.camera);
    }

    updateTimer(dt) {
        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.triggerGameOver("TIME'S UP! YOU FAILED TO ESCAPE THE JUNGLE.");
        }
        this.updateHUD();
    }

    updatePlayerMovement(dt) {
        if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.playerYaw;
        this.camera.rotation.x = this.playerPitch;

        const moveVec = new THREE.Vector3();
        if (this.keys['ArrowUp'] || this.keys['KeyW']) moveVec.z -= 1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) moveVec.z += 1;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) moveVec.x -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) moveVec.x += 1;

        if (moveVec.lengthSq() > 0) {
            moveVec.normalize();
            moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerYaw);

            const nextX = this.playerPos.x + moveVec.x * this.playerSpeed * dt;
            const nextZ = this.playerPos.z + moveVec.z * this.playerSpeed * dt;

            if (!this.checkObstacleCollision(nextX, this.playerPos.z)) {
                this.playerPos.x = nextX;
            }
            if (!this.checkObstacleCollision(this.playerPos.x, nextZ)) {
                this.playerPos.z = nextZ;
            }

            this.footstepTimer += dt;
            if (this.footstepTimer > 0.38) {
                this.footstepTimer = 0;
                if (window.soundEngine) window.soundEngine.playFootstep();
            }

            this.gunBobTimer += dt * 10;
        } else {
            this.gunBobTimer += dt * 2.2;
        }

        this.camera.position.x = this.playerPos.x;
        this.camera.position.z = this.playerPos.z;
    }

    checkObstacleCollision(x, z) {
        const radius = 0.55;
        // Collision only with cliffs, trees and exit gate, NOT safe houses!
        for (let obs of this.obstacles) {
            if (x + radius > obs.minX && x - radius < obs.maxX &&
                z + radius > obs.minZ && z - radius < obs.maxZ) {
                return true;
            }
        }
        return false;
    }

    updateWeaponAnimation(dt) {
        if (!this.weaponGroup) return;

        if (this.gunRecoilZ > 0) {
            this.gunRecoilZ = Math.max(0, this.gunRecoilZ - dt * 1.2);
            this.gunRecoilRot = Math.max(0, this.gunRecoilRot - dt * 2.0);
        }

        if (this.muzzleFlashTimer > 0) {
            this.muzzleFlashTimer -= dt;
            if (this.muzzleFlashTimer <= 0) {
                this.muzzleMesh.visible = false;
                this.muzzleLight.intensity = 0;
            }
        }

        const bobX = Math.sin(this.gunBobTimer * 0.5) * 0.008;
        const bobY = Math.cos(this.gunBobTimer) * 0.008;

        this.weaponGroup.position.set(0.24 + bobX, -0.24 + bobY, -0.5 + this.gunRecoilZ);
        this.weaponGroup.rotation.x = this.gunRecoilRot;
    }

    updateZombieAI(dt) {
        const allZombies = [...this.zombies];
        if (this.boss) allZombies.push(this.boss);

        const playerInSafeZone = this.isPlayerInSafePlace();

        allZombies.forEach(z => {
            if (!z.isAlive) {
                if (z.corpseTimer > 0) z.corpseTimer -= dt;
                return;
            }

            const dx = this.playerPos.x - z.mesh.position.x;
            const dz = this.playerPos.z - z.mesh.position.z;
            const dist = Math.hypot(dx, dz);

            z.walkCycle += dt * (z.isChasing ? 6.5 : 2.5);
            z.lLeg.rotation.x = Math.sin(z.walkCycle) * 0.55;
            z.rLeg.rotation.x = -Math.sin(z.walkCycle) * 0.55;
            z.torso.rotation.y = Math.sin(z.walkCycle * 0.5) * 0.08;
            z.headGroup.rotation.y = Math.sin(z.walkCycle * 0.5) * 0.12;

            z.lArm.rotation.x = -Math.PI / 2.2 + Math.sin(z.walkCycle) * 0.15;
            z.rArm.rotation.x = -Math.PI / 2.2 - Math.sin(z.walkCycle) * 0.15;

            // Safe Sanctuary Check: In safe zones, zombies cannot chase or attack
            if (playerInSafeZone) {
                z.isChasing = false;
                return;
            }

            if (dist < z.detectionRange) {
                z.isChasing = true;
                const targetAngle = Math.atan2(dx, dz);
                z.mesh.rotation.y = targetAngle;

                if (dist > z.attackDist) {
                    const step = z.speed * dt;
                    const nextX = z.mesh.position.x + Math.sin(targetAngle) * step;
                    const nextZ = z.mesh.position.z + Math.cos(targetAngle) * step;

                    if (!this.checkObstacleCollision(nextX, z.mesh.position.z)) {
                        z.mesh.position.x = nextX;
                    }
                    if (!this.checkObstacleCollision(z.mesh.position.x, nextZ)) {
                        z.mesh.position.z = nextZ;
                    }
                } else {
                    const now = performance.now() / 1000;
                    if (now - z.lastAttackTime > 1.2) {
                        z.lastAttackTime = now;
                        this.zombieAttackPlayer(z);
                    }
                }
            } else {
                z.isChasing = false;
            }
        });

        // Trigger Boss encounter when player approaches exit perimeter and all 5 keys are found!
        if (this.keysFound >= 5 && !this.bossSpawned) {
            const distExit = Math.hypot(this.playerPos.x - 0, this.playerPos.z - 52);
            if (distExit < 24.0) {
                this.triggerBossEncounter();
            }
        }
    }

    zombieAttackPlayer(zombie) {
        if (this.invulnerableTimer > 0) return;

        this.health -= zombie.damage;
        this.invulnerableTimer = 0.6;

        const flash = document.getElementById('damage-flash');
        flash.style.opacity = '1';
        setTimeout(() => flash.style.opacity = '0', 160);

        if (window.soundEngine) {
            window.soundEngine.playPlayerHurt();
            window.soundEngine.playZombieGrowl(zombie.isBoss);
        }

        if (this.health <= 0) {
            this.lives--;
            if (this.lives > 0) {
                this.health = this.maxHealth;
                this.invulnerableTimer = 2.0;
                this.showToastNotification(`⚠️ YOU LOST A LIFE! (${this.lives} LIVES REMAINING)`, '#f43f5e');
            } else {
                this.triggerGameOver("YOU WERE INFECTED BY THE JUNGLE HORDE.");
            }
        }

        this.updateHUD();
    }

    triggerGameOver(reason) {
        this.gameState = 'GAMEOVER';
        if (document.exitPointerLock) document.exitPointerLock();
        if (window.soundEngine) window.soundEngine.playGameOver();

        document.getElementById('game-over-reason').innerText = reason;
        document.getElementById('game-over-kills').innerText = `ZOMBIES KILLED: ${this.zombieKills}`;
        document.getElementById('game-over-keys').innerText = `KEYS COLLECTED: ${this.keysFound}/5`;
        document.getElementById('game-over-modal').classList.remove('hidden');
    }

    updatePickups(dt) {
        const time = Date.now() * 0.003;
        this.pickups.forEach(p => {
            if (!p.collected) {
                p.mesh.rotation.y = time;
                p.mesh.position.y = p.position.y + Math.sin(time * 2) * 0.08;

                if (Math.hypot(this.playerPos.x - p.position.x, this.playerPos.z - p.position.z) < 1.4) {
                    p.collected = true;
                    this.scene.remove(p.mesh);

                    if (p.type === 'health') {
                        this.health = Math.min(this.maxHealth, this.health + p.amount);
                        if (window.soundEngine) window.soundEngine.playPickup('health');
                        this.showToastNotification(`❤️ FIRST AID PACK (+${p.amount} HP)`, '#22c55e');
                    } else if (p.type === 'ammo') {
                        Object.keys(this.weapons).forEach(k => {
                            this.weapons[k].reserve = Math.min(this.weapons[k].maxReserve, this.weapons[k].reserve + p.amount);
                        });
                        if (window.soundEngine) window.soundEngine.playPickup('item');
                        this.showToastNotification(`💥 AMMO CRATE (+${p.amount} AMMO)`, '#f59e0b');
                    } else if (p.type === 'life') {
                        this.lives = Math.min(5, this.lives + p.amount);
                        if (window.soundEngine) window.soundEngine.playPickup('key');
                        this.showToastNotification(`💖 EXTRA LIFE (+1 LIFE)`, '#f43f5e');
                    }
                    this.updateHUD();
                }
            }
        });
    }

    updateParticles(dt) {
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

// Global Engine Startup
window.addEventListener('DOMContentLoaded', () => {
    window.game = new JungleSurvivalGame();
});
