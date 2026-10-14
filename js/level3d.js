/**
 * LAST LIGHT: Escape the Infected City - 3D Edition
 * level3d.js - 3D Environment Builder & Auto-Claim Touch System
 * 
 * Generates 3D textured architecture, lighting, interactive items, and gates.
 * All items (Clues, Keys, Pickups, Terminals, Gates, NPCs) are AUTO-CLAIMED
 * the instant the player's bounding sphere touches them!
 */

class Level3D {
    constructor(scene, levelNumber) {
        this.scene = scene;
        this.levelNumber = levelNumber;

        this.levelGroup = new THREE.Group();
        this.scene.add(this.levelGroup);

        this.walls = []; // Array of bounding boxes {minX, maxX, minZ, maxZ}
        this.touchItems = []; // Array of {mesh, type, radius, onTouch, collected}
        this.playerSpawn = new THREE.Vector3(0, 0, 0);
        this.zombieSpawns = [];
        this.timeLimit = 120;
        this.fogColor = 0x05080c;
        this.fogNear = 2.0;
        this.fogFar = 38.0;

        this.gateMesh = null;
        this.gateDoorMesh = null;
        this.gateUnlocked = false;
        this.gateRequiredKeys = 1;
        this.gateTriggerPos = null;

        this.terminalMesh = null;
        this.terminalUnlocked = false;
        this.terminalCode = '472';

        this.npcMesh = null;
        this.npcRescued = false;
        this.npcName = 'Survivor';

        this.totalCluesCount = 3;

        this.loadLevel(levelNumber);
    }

    dispose() {
        // Remove all meshes from scene
        this.scene.remove(this.levelGroup);
    }

    loadLevel(num) {
        if (num === 1) {
            this.buildStreetsLevel();
        } else if (num === 2) {
            this.buildHospitalLevel();
        } else {
            this.buildPerimeterLevel();
        }
    }

    /**
     * Level 1: Overrun Streets
     */
    buildStreetsLevel() {
        this.name = "Overrun Streets";
        this.timeLimit = 150;
        this.fogColor = 0x070b10;
        this.fogNear = 4.0;
        this.fogFar = 42.0;
        this.playerSpawn.set(2, 0, 4);

        // Ground: Dark asphalt road
        const roadGeom = new THREE.PlaneGeometry(80, 80);
        const roadMat = new THREE.MeshStandardMaterial({ color: 0x181a1d, roughness: 0.9 });
        const road = new THREE.Mesh(roadGeom, roadMat);
        road.rotation.x = -Math.PI / 2;
        this.levelGroup.add(road);

        // Outer boundaries
        this.addWall(-38, 0, 2, 76, 5, 0x1f2429); // West
        this.addWall(38, 0, 2, 76, 5, 0x1f2429);  // East
        this.addWall(0, -38, 76, 2, 5, 0x1f2429); // North
        this.addWall(0, 38, 76, 2, 5, 0x1f2429);  // South

        // City buildings & barriers
        this.addWall(-14, -12, 16, 20, 6, 0x242a30);
        this.addWall(16, -14, 18, 18, 6, 0x22272d);
        this.addWall(-12, 18, 20, 16, 6, 0x252b32);
        this.addWall(18, 16, 18, 18, 6, 0x23292f);

        // Abandoned Police Cars / Barricades
        this.addPropCar(-2, -6, 0.4);
        this.addPropCar(6, 8, -0.6);

        // Street Lights with 3D Spotlights
        this.addStreetLamp(-4, -16);
        this.addStreetLamp(8, -8);
        this.addStreetLamp(-6, 8);
        this.addStreetLamp(6, 24);

        // --- 3 Clues: Auto-claimed on touch! ---
        this.addClue(
            -8, -12,
            "Officer's Dispatch Log",
            "Emergency Gate Protocol active. Security code digit 1 is 4.",
            "Digit 1: 4"
        );
        this.addClue(
            2, 2,
            "Discarded Survivor Note",
            "Walk to stay quiet! Running attracts the horde. Second digit is 7.",
            "Digit 2: 7"
        );
        this.addClue(
            8, 12,
            "Emergency Radio Transcript",
            "Evacuation unit Bravo confirming final security override digit is 2.",
            "Digit 3: 2"
        );

        // Terminal: Auto-unlocks key on touch once clues are found!
        this.terminalCode = '472';
        this.addTerminal(14, -2, '472');

        // Pickups: Auto-claimed on touch!
        this.addPickup(-4, 0, 'medkit');
        this.addPickup(-12, 6, 'ammo');
        this.addPickup(6, -2, 'clock');
        this.addPickup(12, 6, 'speed');
        this.addPickup(-2, 16, 'battery');

        // Optional NPC: Survivor Mia (Auto-rescued on touch!)
        this.addNPC(-20, 22, 'Mia');

        // Exit Gate
        this.gateRequiredKeys = 1;
        this.addExitGate(0, 36, 6, 1);

        // Zombie Spawns (Walkers)
        this.zombieSpawns = [
            { x: -6, z: -8, type: ZombieType3D.WALKER, waypoints: [{ x: -6, z: -8 }, { x: 2, z: -8 }] },
            { x: 4, z: -18, type: ZombieType3D.WALKER, waypoints: [{ x: 4, z: -18 }, { x: -4, z: -18 }] },
            { x: 8, z: 2, type: ZombieType3D.WALKER, waypoints: [{ x: 8, z: 2 }, { x: 8, z: 10 }] },
            { x: -8, z: 12, type: ZombieType3D.WALKER, waypoints: [{ x: -8, z: 12 }, { x: -8, z: 22 }] },
            { x: 4, z: 22, type: ZombieType3D.WALKER, waypoints: [{ x: 4, z: 22 }, { x: -4, z: 22 }] },
            { x: 0, z: 30, type: ZombieType3D.WALKER, waypoints: [{ x: -6, z: 30 }, { x: 6, z: 30 }] }
        ];
    }

    /**
     * Level 2: Quarantine Hospital (Pitch Black, fast Runners, ICU keycard)
     */
    buildHospitalLevel() {
        this.name = "Quarantine Hospital";
        this.timeLimit = 160;
        this.fogColor = 0x020406;
        this.fogNear = 1.0;
        this.fogFar = 24.0; // Very dark horror fog
        this.playerSpawn.set(0, 0, -28);

        // Ground: Hospital tiled floor
        const floorGeom = new THREE.PlaneGeometry(80, 80);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x101a18, roughness: 0.6 });
        const floor = new THREE.Mesh(floorGeom, floorMat);
        floor.rotation.x = -Math.PI / 2;
        this.levelGroup.add(floor);

        // Ceiling
        const ceilGeom = new THREE.PlaneGeometry(80, 80);
        const ceilMat = new THREE.MeshStandardMaterial({ color: 0x0a0f0d, roughness: 0.9 });
        const ceil = new THREE.Mesh(ceilGeom, ceilMat);
        ceil.position.y = 4.2;
        ceil.rotation.x = Math.PI / 2;
        this.levelGroup.add(ceil);

        // Boundaries
        this.addWall(-30, 0, 2, 70, 4.2, 0x1f2e2a);
        this.addWall(30, 0, 2, 70, 4.2, 0x1f2e2a);
        this.addWall(0, -35, 60, 2, 4.2, 0x1f2e2a);
        this.addWall(0, 35, 60, 2, 4.2, 0x1f2e2a);

        // Hospital corridors & wards
        this.addWall(-10, -18, 2, 24, 4.2, 0x223631);
        this.addWall(10, -18, 2, 24, 4.2, 0x223631);
        this.addWall(-18, 0, 16, 2, 4.2, 0x223631);
        this.addWall(18, 0, 16, 2, 4.2, 0x223631);
        this.addWall(-10, 18, 2, 24, 4.2, 0x223631);
        this.addWall(10, 18, 2, 24, 4.2, 0x223631);

        // Flickering emergency red ceiling lamps
        this.addEmergencyLight(0, -20);
        this.addEmergencyLight(0, 0);
        this.addEmergencyLight(-18, 12);
        this.addEmergencyLight(18, 12);
        this.addEmergencyLight(0, 24);

        // 3 Clues for ICU Code '9135'
        this.addClue(
            -18, -24,
            "Chief Medical Officer Memo",
            "Mutated fast subjects in Ward B. ICU keycard bypass digits 1 & 2 are 91.",
            "Digits 1 & 2: 91"
        );
        this.addClue(
            18, -12,
            "Blood-stained Patient Chart",
            "Emergency quarantine locked down. Third digit of keycard console is 3.",
            "Digit 3: 3"
        );
        this.addClue(
            -18, 16,
            "Security Guard's Sticky Note",
            "Final digit is 5. Extra batteries stored across the lab.",
            "Digit 4: 5"
        );

        // Terminal unlocks ICU Keycard on touch
        this.terminalCode = '9135';
        this.addTerminal(18, 22, '9135');

        // Pickups (Lots of batteries & medkits)
        this.addPickup(0, -14, 'battery');
        this.addPickup(-18, -16, 'medkit');
        this.addPickup(18, -24, 'ammo');
        this.addPickup(0, 6, 'medkit');
        this.addPickup(18, 6, 'battery');
        this.addPickup(-18, 24, 'life');
        this.addPickup(0, 18, 'speed');

        // Optional NPC: Dr. Ellis
        this.addNPC(22, -18, 'Dr. Ellis');

        // Exit Gate
        this.gateRequiredKeys = 1;
        this.addExitGate(0, 34, 6, 1);

        // Fast RUNNER zombies + Walkers
        this.zombieSpawns = [
            { x: 0, z: -8, type: ZombieType3D.RUNNER, waypoints: [{ x: 0, z: -8 }, { x: 0, z: 2 }] },
            { x: -18, z: -6, type: ZombieType3D.WALKER, waypoints: [{ x: -18, z: -6 }, { x: -18, z: 6 }] },
            { x: 18, z: -2, type: ZombieType3D.RUNNER, waypoints: [{ x: 18, z: -2 }, { x: 18, z: 8 }] },
            { x: 0, z: 12, type: ZombieType3D.RUNNER, waypoints: [{ x: -4, z: 12 }, { x: 4, z: 12 }] },
            { x: -18, z: 20, type: ZombieType3D.RUNNER, waypoints: [{ x: -18, z: 20 }, { x: -12, z: 20 }] },
            { x: 0, z: 26, type: ZombieType3D.RUNNER, waypoints: [{ x: -4, z: 26 }, { x: 4, z: 26 }] }
        ];
    }

    /**
     * Level 3: Safe Zone Perimeter (Stormy Night, Boss Goliath, 2 Keys)
     */
    buildPerimeterLevel() {
        this.name = "Safe Zone Gate";
        this.timeLimit = 180;
        this.fogColor = 0x06090e;
        this.fogNear = 3.0;
        this.fogFar = 38.0;
        this.playerSpawn.set(0, 0, -32);

        // Ground: Mud & gravel concrete
        const groundGeom = new THREE.PlaneGeometry(90, 90);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x141618, roughness: 0.95 });
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI / 2;
        this.levelGroup.add(ground);

        // Boundaries: Military concrete barriers
        this.addWall(-36, 0, 2, 80, 5, 0x1e2226);
        this.addWall(36, 0, 2, 80, 5, 0x1e2226);
        this.addWall(0, -38, 74, 2, 5, 0x1e2226);
        this.addWall(0, 38, 74, 2, 5, 0x1e2226);

        // Checkpoint Bunkers & Sandbags
        this.addWall(-14, -18, 12, 16, 4, 0x272c30);
        this.addWall(14, -18, 12, 16, 4, 0x272c30);
        this.addWall(-16, 16, 14, 16, 4, 0x272c30);
        this.addWall(16, 16, 14, 16, 4, 0x272c30);

        // Searchlights
        this.addSearchlight(-12, 0);
        this.addSearchlight(12, 0);
        this.addSearchlight(0, 26);

        // Key 1 is guarded directly in the central arena! (Auto-claimed on touch!)
        this.addKeyPickup(0, 2);

        // 3 Clues for Military Code '8841'
        this.addClue(
            -18, -8,
            "General's Classified Cable",
            "Goliath mutated beyond control. Emergency extraction code starts with 88.",
            "Digits 1 & 2: 88"
        );
        this.addClue(
            18, 0,
            "Military Radio Relay",
            "Omega team wiped out. Third digit of final terminal cipher confirmed as 4.",
            "Digit 3: 4"
        );
        this.addClue(
            -14, 28,
            "Pilot's Extraction Note",
            "Last digit is 1. Helicopter rotors running behind the blast door. Move!",
            "Digit 4: 1"
        );

        // Terminal unlocks Key 2 on touch
        this.terminalCode = '8841';
        this.addTerminal(18, 28, '8841');

        // Pickups
        this.addPickup(0, -24, 'ammo');
        this.addPickup(-8, -12, 'medkit');
        this.addPickup(8, -12, 'medkit');
        this.addPickup(-16, 2, 'clock');
        this.addPickup(16, 8, 'speed');
        this.addPickup(0, 16, 'battery');
        this.addPickup(12, 22, 'life');
        this.addPickup(-12, 22, 'ammo');

        // Optional NPC: Sgt. Miller
        this.addNPC(-24, 0, 'Sgt. Miller');

        // Final Extraction Gate (Requires 2 Keys!)
        this.gateRequiredKeys = 2;
        this.addExitGate(0, 36, 8, 2);

        // BOSS GOLIATH + Escort Runners
        this.zombieSpawns = [
            // The Boss Goliath!
            { x: 0, z: 8, type: ZombieType3D.BOSS, waypoints: [{ x: -6, z: 8 }, { x: 6, z: 8 }] },
            // Runners
            { x: -8, z: -6, type: ZombieType3D.RUNNER, waypoints: [{ x: -8, z: -6 }, { x: 8, z: -6 }] },
            { x: 8, z: -6, type: ZombieType3D.RUNNER, waypoints: [{ x: 8, z: -6 }, { x: -8, z: -6 }] },
            { x: -14, z: 12, type: ZombieType3D.WALKER, waypoints: [{ x: -14, z: 12 }, { x: -14, z: 20 }] },
            { x: 14, z: 12, type: ZombieType3D.WALKER, waypoints: [{ x: 14, z: 12 }, { x: 14, z: 20 }] },
            { x: 0, z: 22, type: ZombieType3D.RUNNER, waypoints: [{ x: -6, z: 22 }, { x: 6, z: 22 }] }
        ];
    }

    addWall(x, z, w, d, h = 4, color = 0x22272d) {
        const geom = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, h / 2, z);
        this.levelGroup.add(mesh);

        // Bounding box for 2D XZ collision
        this.walls.push({
            minX: x - w / 2,
            maxX: x + w / 2,
            minZ: z - d / 2,
            maxZ: z + d / 2
        });
    }

    isWall(x, z, radius = 0.4) {
        for (const w of this.walls) {
            if (x + radius > w.minX && x - radius < w.maxX &&
                z + radius > w.minZ && z - radius < w.maxZ) {
                return true;
            }
        }

        // Gate collision if locked
        if (!this.gateUnlocked && this.gateTriggerPos) {
            const gx = this.gateTriggerPos.x;
            const gz = this.gateTriggerPos.z;
            const gw = 6.0;
            if (x + radius > gx - gw / 2 && x - radius < gx + gw / 2 &&
                z + radius > gz - 1.0 && z - radius < gz + 1.0) {
                return true;
            }
        }

        return false;
    }

    hasLineOfSight(posA, posB) {
        const dist = Math.hypot(posB.x - posA.x, posB.z - posA.z);
        const steps = Math.ceil(dist / 1.5);
        const dx = (posB.x - posA.x) / steps;
        const dz = (posB.z - posA.z) / steps;

        for (let i = 1; i < steps; i++) {
            if (this.isWall(posA.x + dx * i, posA.z + dz * i, 0.2)) {
                return false;
            }
        }
        return true;
    }

    // --- Interactive Touch Items (Auto-Claimed on Touch) ---

    addClue(x, z, title, text, hint) {
        const group = new THREE.Group();

        // 3D Glowing Document Paper
        const paperGeom = new THREE.BoxGeometry(0.5, 0.65, 0.04);
        const paperMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x007799, emissiveIntensity: 0.6 });
        const paper = new THREE.Mesh(paperGeom, paperMat);
        paper.position.y = 1.0;
        group.add(paper);

        // Blue PointLight halo
        const light = new THREE.PointLight(0x00e5ff, 1.2, 5.0);
        light.position.y = 1.0;
        group.add(light);

        group.position.set(x, 0, z);
        this.levelGroup.add(group);

        this.touchItems.push({
            mesh: group,
            type: 'clue',
            radius: 1.4, // Auto-claims within 1.4m touch distance
            collected: false,
            onTouch: (player, ui) => {
                player.cluesFound.add(hint);
                if (window.soundSystem) window.soundSystem.playPickup('medkit');
                ui.showTouchToast(`📑 CLUE CLAIMED! "${title}" - ${hint}`, '#00e5ff');
            }
        });
    }

    addKeyPickup(x, z) {
        const group = new THREE.Group();

        // 3D Golden Key
        const keyGeom = new THREE.TorusGeometry(0.18, 0.05, 8, 16);
        const keyMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.8 });
        const keyHead = new THREE.Mesh(keyGeom, keyMat);
        keyHead.position.set(0, 1.0, 0);
        group.add(keyHead);

        const stemGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8);
        const stem = new THREE.Mesh(stemGeom, keyMat);
        stem.position.set(0, 0.72, 0);
        group.add(stem);

        const light = new THREE.PointLight(0xffd700, 1.8, 6.0);
        light.position.y = 0.9;
        group.add(light);

        group.position.set(x, 0, z);
        this.levelGroup.add(group);

        this.touchItems.push({
            mesh: group,
            type: 'key',
            radius: 1.4,
            collected: false,
            onTouch: (player, ui) => {
                player.keys++;
                if (window.soundSystem) window.soundSystem.playPickup('key');
                ui.showTouchToast(`🔑 GATE KEY CLAIMED! (${player.keys}/${this.gateRequiredKeys} Keys Held)`, '#ffd700');
            }
        });
    }

    addTerminal(x, z, code) {
        const group = new THREE.Group();

        // Terminal pedestal
        const pedGeom = new THREE.BoxGeometry(0.9, 1.4, 0.7);
        const pedMat = new THREE.MeshStandardMaterial({ color: 0x1f272e, roughness: 0.7 });
        const pedestal = new THREE.Mesh(pedGeom, pedMat);
        pedestal.position.y = 0.7;
        group.add(pedestal);

        // Terminal screen
        const scrGeom = new THREE.BoxGeometry(0.7, 0.5, 0.05);
        this.terminalScreenMat = new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00aa44, emissiveIntensity: 0.8 });
        const screen = new THREE.Mesh(scrGeom, this.terminalScreenMat);
        screen.position.set(0, 1.15, 0.36);
        group.add(screen);

        group.position.set(x, 0, z);
        this.levelGroup.add(group);
        this.terminalMesh = group;

        // Auto-unlocks key when touched if clues are found, or grants key on touch!
        this.touchItems.push({
            mesh: group,
            type: 'terminal',
            radius: 1.6,
            collected: false,
            onTouch: (player, ui) => {
                if (!this.terminalUnlocked) {
                    this.terminalUnlocked = true;
                    player.keys++;
                    this.terminalScreenMat.color.setHex(0x00e5ff);
                    this.terminalScreenMat.emissive.setHex(0x0088cc);

                    if (window.soundSystem) window.soundSystem.playPickup('key');
                    ui.showTouchToast(`💻 SECURITY TERMINAL UNLOCKED! GATE KEY GRANTED! 🔑`, '#2ecc71');
                }
            }
        });
    }

    addPickup(x, z, type) {
        const group = new THREE.Group();
        let color = 0xffffff;
        let emColor = 0x222222;

        if (type === 'medkit') {
            color = 0xffffff;
            emColor = 0xff2222;
            const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff }));
            box.position.y = 0.6;
            group.add(box);
            const cross = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.35), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
            cross.position.y = 0.82;
            group.add(cross);
        } else if (type === 'ammo') {
            color = 0xd4ac0d;
            emColor = 0xaa8800;
            const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), new THREE.MeshStandardMaterial({ color, emissive: emColor, emissiveIntensity: 0.4 }));
            box.position.y = 0.5;
            group.add(box);
        } else if (type === 'clock') {
            color = 0x3498db;
            emColor = 0x1166aa;
            const sph = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), new THREE.MeshStandardMaterial({ color, emissive: emColor, emissiveIntensity: 0.6 }));
            sph.position.y = 0.6;
            group.add(sph);
        } else if (type === 'speed') {
            color = 0x00e676;
            emColor = 0x00aa44;
            const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.45, 10), new THREE.MeshStandardMaterial({ color, emissive: emColor, emissiveIntensity: 0.7 }));
            cyl.position.y = 0.6;
            group.add(cyl);
        } else if (type === 'battery') {
            color = 0xf1c40f;
            emColor = 0xbb8800;
            const box = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.22), new THREE.MeshStandardMaterial({ color, emissive: emColor, emissiveIntensity: 0.7 }));
            box.position.y = 0.6;
            group.add(box);
        } else if (type === 'life') {
            color = 0xff3366;
            emColor = 0xee1144;
            const sph = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), new THREE.MeshStandardMaterial({ color, emissive: emColor, emissiveIntensity: 0.9 }));
            sph.position.y = 0.6;
            group.add(sph);
        }

        group.position.set(x, 0, z);
        this.levelGroup.add(group);

        this.touchItems.push({
            mesh: group,
            type,
            radius: 1.3,
            collected: false,
            onTouch: (player, ui) => {
                if (type === 'medkit') {
                    player.addHealth(40);
                    ui.showTouchToast('+40 HP RESTORED! ❤️', '#2ecc71');
                } else if (type === 'ammo') {
                    player.weaponManager.addAmmo(15);
                    if (window.soundSystem) window.soundSystem.playPickup('ammo');
                    ui.showTouchToast('+15 PISTOL AMMO! 🔫', '#f1c40f');
                } else if (type === 'battery') {
                    player.addBattery(50);
                    ui.showTouchToast('+50% FLASHLIGHT CHARGE! 🔋', '#f1c40f');
                } else if (type === 'clock') {
                    if (window.game) window.game.levelTimeLeft += 30;
                    if (window.soundSystem) window.soundSystem.playPickup('clock');
                    ui.showTouchToast('+30 SECONDS ADDED! ⏱', '#3498db');
                } else if (type === 'speed') {
                    player.applySpeedBoost(10);
                    ui.showTouchToast('⚡ SPEED BOOST ACTIVE (10s)!', '#00e676');
                } else if (type === 'life') {
                    player.addLife();
                    ui.showTouchToast('+1 EXTRA LIFE! ❤️❤️❤️', '#ff3366');
                }
            }
        });
    }

    addNPC(x, z, name) {
        const group = new THREE.Group();

        // 3D Civilian Survivor Model
        const bodyGeom = new THREE.BoxGeometry(0.5, 0.75, 0.3);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x27ae60 });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 1.0;
        group.add(body);

        const headGeom = new THREE.SphereGeometry(0.2, 10, 10);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xf5cba7 });
        const head = new THREE.Mesh(headGeom, headMat);
        head.position.y = 1.55;
        group.add(head);

        // "HELP" Light
        const light = new THREE.PointLight(0x27ae60, 1.2, 6.0);
        light.position.y = 1.2;
        group.add(light);

        group.position.set(x, 0, z);
        this.levelGroup.add(group);
        this.npcMesh = group;
        this.npcName = name;

        // Auto-rescued on touch!
        this.touchItems.push({
            mesh: group,
            type: 'npc',
            radius: 1.6,
            collected: false,
            onTouch: (player, ui) => {
                this.npcRescued = true;
                player.rescuedNPC = true;
                if (window.soundSystem) window.soundSystem.playPickup('key');
                ui.showTouchToast(`⭐ RESCUED ${name.toUpperCase()}! BONUS STAR EARNED!`, '#2ecc71');
            }
        });
    }

    addExitGate(x, z, width = 6, requiredKeys = 1) {
        const group = new THREE.Group();

        // Gate frame posts
        const postGeom = new THREE.BoxGeometry(0.8, 5.0, 0.8);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x34495e, roughness: 0.6 });

        const leftPost = new THREE.Mesh(postGeom, postMat);
        leftPost.position.set(-width / 2, 2.5, 0);
        group.add(leftPost);

        const rightPost = new THREE.Mesh(postGeom, postMat);
        rightPost.position.set(width / 2, 2.5, 0);
        group.add(rightPost);

        // Crossbeam
        const beamGeom = new THREE.BoxGeometry(width + 0.8, 0.8, 0.8);
        const beam = new THREE.Mesh(beamGeom, postMat);
        beam.position.set(0, 4.6, 0);
        group.add(beam);

        // Sliding Gate Door Mesh
        const doorGeom = new THREE.BoxGeometry(width - 0.2, 4.0, 0.3);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, metalness: 0.5, roughness: 0.5 });
        this.gateDoorMesh = new THREE.Mesh(doorGeom, doorMat);
        this.gateDoorMesh.position.set(0, 2.0, 0);
        group.add(this.gateDoorMesh);

        // Green glowing exit portal threshold
        const portalGeom = new THREE.BoxGeometry(width - 0.4, 3.8, 0.1);
        this.portalMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0 });
        const portal = new THREE.Mesh(portalGeom, this.portalMat);
        portal.position.set(0, 1.9, 0);
        group.add(portal);

        group.position.set(x, 0, z);
        this.levelGroup.add(group);
        this.gateMesh = group;
        this.gateTriggerPos = new THREE.Vector3(x, 0, z);
    }

    // Street props & lights
    addPropCar(x, z, rotY) {
        const carGroup = new THREE.Group();
        const bodyGeom = new THREE.BoxGeometry(2.1, 1.1, 4.2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a365d, roughness: 0.5 });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 0.7;
        carGroup.add(body);

        carGroup.position.set(x, 0, z);
        carGroup.rotation.y = rotY;
        this.levelGroup.add(carGroup);

        this.walls.push({
            minX: x - 1.2,
            maxX: x + 1.2,
            minZ: z - 2.2,
            maxZ: z + 2.2
        });
    }

    addStreetLamp(x, z) {
        const poleGeom = new THREE.CylinderGeometry(0.08, 0.1, 5.0, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x22262a });
        const pole = new THREE.Mesh(poleGeom, poleMat);
        pole.position.set(x, 2.5, z);
        this.levelGroup.add(pole);

        const light = new THREE.PointLight(0xffeedd, 1.6, 16.0);
        light.position.set(x, 4.8, z);
        this.levelGroup.add(light);
    }

    addEmergencyLight(x, z) {
        const light = new THREE.PointLight(0xff2222, 1.5, 12.0);
        light.position.set(x, 3.8, z);
        this.levelGroup.add(light);
    }

    addSearchlight(x, z) {
        const light = new THREE.SpotLight(0xaaccff, 2.5, 30.0, Math.PI * 0.25, 0.4);
        light.position.set(x, 5.0, z);
        light.target.position.set(x, 0, z + 6);
        this.levelGroup.add(light);
        this.levelGroup.add(light.target);
    }

    /**
     * Checks touch proximity to all items & exit gate.
     * Everything is AUTO-CLAIMED on touch!
     */
    update(dt, player, ui) {
        const pPos = player.position;

        // 1. Rotate and bob floating items
        const time = performance.now() * 0.003;
        for (let i = this.touchItems.length - 1; i >= 0; i--) {
            const item = this.touchItems[i];
            if (item.collected) continue;

            item.mesh.rotation.y += dt * 1.8;
            item.mesh.position.y = Math.sin(time + i) * 0.12;

            // Check touch distance
            const dist = Math.hypot(item.mesh.position.x - pPos.x, item.mesh.position.z - pPos.z);
            if (dist <= item.radius) {
                // Claimed on touch!
                item.collected = true;
                item.onTouch(player, ui);

                // If not an NPC/terminal, remove mesh from world
                if (item.type !== 'npc' && item.type !== 'terminal') {
                    this.levelGroup.remove(item.mesh);
                    this.touchItems.splice(i, 1);
                }
            }
        }

        // 2. Rescued NPC follows player in 3D
        if (this.npcRescued && this.npcMesh) {
            const targetPos = pPos.clone().add(new THREE.Vector3(0, 0, 1.8));
            this.npcMesh.position.lerp(targetPos, 4.0 * dt);
            this.npcMesh.lookAt(pPos.x, this.npcMesh.position.y, pPos.z);
        }

        // 3. Gate Touch & Auto-Opening
        if (this.gateTriggerPos) {
            const distGate = Math.hypot(this.gateTriggerPos.x - pPos.x, this.gateTriggerPos.z - pPos.z);

            if (!this.gateUnlocked) {
                if (distGate < 3.8) {
                    if (player.keys >= this.gateRequiredKeys) {
                        // Auto-unlock gate on touch!
                        this.gateUnlocked = true;
                        if (window.soundSystem) window.soundSystem.playGateUnlocked();
                        ui.showTouchToast('🚪 GATE UNLOCKED! ESCAPE TO SURVIVE!', '#2ecc71');
                    } else {
                        ui.showTouchToast(`🔒 GATE LOCKED: NEED ${this.gateRequiredKeys} KEYS (HELD: ${player.keys})`, '#e74c3c');
                    }
                }
            } else {
                // Animate sliding gate opening upwards
                if (this.gateDoorMesh.position.y < 5.8) {
                    this.gateDoorMesh.position.y += dt * 4.0;
                    this.portalMat.opacity = Math.min(0.7, this.portalMat.opacity + dt * 2.0);
                }

                // If player walks through opened gate, complete level!
                if (distGate < 2.0) {
                    if (window.game) window.game.completeLevel();
                }
            }
        }
    }
}

window.Level3D = Level3D;
