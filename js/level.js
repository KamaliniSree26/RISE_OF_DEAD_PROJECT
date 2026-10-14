/**
 * LAST LIGHT: Escape the Infected City
 * level.js - 3D Environments, Searchable Objects & Gate Progression
 * 
 * Defines 3 distinct 3D locations:
 * - Level 1: The Streets (Night city, wet roads, 2 keys, tutorial hints)
 * - Level 2: The Hospital (Indoor dark wards, lockers, 3 keys, flashlight needed)
 * - Level 3: The Safe Zone Gate (Military ruins, searchlights, 4 keys, Boss Goliath)
 * 
 * Features interactive searchable objects (crates, cars, lockers, cabinets, bins)
 * with a progress bar, clues, journal entries, and locked exit gates.
 */

import * as THREE from './three.module.js';

export class SearchableObject {
    constructor(id, type, name, position, reward) {
        this.id = id;
        this.type = type; // 'crate', 'car', 'locker', 'cabinet', 'drawer', 'bin'
        this.name = name;
        this.position = position;
        this.reward = reward; // { type: 'key'|'clue'|'ammo'|'medkit'|'battery'|'clock'|'life'|'empty', data: ... }
        this.isSearched = false;
        this.searchProgress = 0; // 0 to 1
        this.searchDuration = 1.2; // seconds
        this.radius = 2.4; // interaction radius
        this.mesh = null;
    }
}

export class Level {
    constructor(scene, levelNumber) {
        this.scene = scene;
        this.levelNumber = levelNumber;

        this.levelGroup = new THREE.Group();
        this.scene.add(this.levelGroup);

        this.walls = []; // Bounding boxes {minX, maxX, minZ, maxZ}
        this.searchables = []; // Array of SearchableObject instances
        this.playerSpawn = new THREE.Vector3(0, 0, 0);
        this.zombieSpawns = [];
        this.timeLimit = 180;

        // Gate
        this.gateMesh = null;
        this.gateDoorMesh = null;
        this.gateUnlocked = false;
        this.gateRequiredKeys = 2;
        this.gatePos = new THREE.Vector3(0, 0, 0);

        // Environment visuals
        this.fogColor = 0x05070a;
        this.fogNear = 2.0;
        this.fogFar = 38.0;

        this.loadLevelData(levelNumber);
    }

    dispose() {
        this.scene.remove(this.levelGroup);
    }

    loadLevelData(num) {
        if (num === 1) {
            this.buildStreetsLevel();
        } else if (num === 2) {
            this.buildHospitalLevel();
        } else {
            this.buildMilitaryLevel();
        }
    }

    /**
     * Level 1: The Streets (Night city, wet roads, 2 keys, tutorial feel)
     */
    buildStreetsLevel() {
        this.name = "The Streets";
        this.subtitle = "Downtown Sector 4 - Search vehicles and crates for 2 keys";
        this.timeLimit = 180;
        this.gateRequiredKeys = 2;
        this.fogColor = 0x070c12;
        this.fogNear = 4.0;
        this.fogFar = 42.0;
        this.playerSpawn.set(0, 0, -20);

        // Ground: Wet asphalt with specular reflections
        const roadGeom = new THREE.PlaneGeometry(80, 80);
        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x14181c,
            roughness: 0.35, // wet sheen
            metalness: 0.1
        });
        const road = new THREE.Mesh(roadGeom, roadMat);
        road.rotation.x = -Math.PI / 2;
        this.levelGroup.add(road);

        // Outer City Boundaries (Tall concrete walls)
        this.addWall(-38, 0, 2, 76, 7, 0x1a2128);
        this.addWall(38, 0, 2, 76, 7, 0x1a2128);
        this.addWall(0, -38, 76, 2, 7, 0x1a2128);
        this.addWall(0, 38, 76, 2, 7, 0x1a2128);

        // Downtown Commercial Buildings with glowing windows
        this.addBuilding(-16, -14, 18, 20, 8);
        this.addBuilding(16, -14, 18, 20, 8);
        this.addBuilding(-16, 16, 18, 18, 8);
        this.addBuilding(16, 16, 18, 18, 8);

        // Street Lamps with warm 3D point lights
        this.addStreetLamp(-4, -14);
        this.addStreetLamp(6, -6);
        this.addStreetLamp(-6, 8);
        this.addStreetLamp(6, 20);

        // Road Barricades & Debris
        this.addWall(0, 6, 12, 1.2, 1.8, 0x3d352e);

        // Searchable Objects (2 Keys + Clues + Supplies hidden inside!)
        this.addSearchableCar(
            1, -4, -6, 0.4,
            { type: 'key', name: 'Brass Key #1' },
            "Abandoned Police Cruiser"
        );
        this.addSearchableCrate(
            2, 8, -12,
            { type: 'clue', title: "Officer's Radio Log", hint: "Key #1 is stashed in the squad car trunk near the main junction." },
            "Supply Crate"
        );
        this.addSearchableBin(
            3, -8, 2,
            { type: 'ammo', amount: 12 },
            "Metal Dumpster"
        );
        this.addSearchableCar(
            4, 8, 8, -0.5,
            { type: 'key', name: 'Gate Key #2' },
            "Wrecked Civilian Sedan"
        );
        this.addSearchableCrate(
            5, -12, 18,
            { type: 'clue', title: "Survivor's Scrawled Note", hint: "Key #2 was lost near the wrecked red sedan past the barricade." },
            "Military Footlocker"
        );
        this.addSearchableCrate(
            6, 12, 2,
            { type: 'medkit', amount: 40 },
            "Emergency Medical Kit"
        );

        // Exit Gate at North Roadblock
        this.gatePos.set(0, 0, 36);
        this.addExitGate(0, 36, 6.0, 2);

        // Zombie Spawns (Slow Walkers)
        this.zombieSpawns = [
            { x: -6, z: -10, type: 'walker', waypoints: [{ x: -6, z: -10 }, { x: 2, z: -10 }] },
            { x: 4, z: -2, type: 'walker', waypoints: [{ x: 4, z: -2 }, { x: -4, z: -2 }] },
            { x: -8, z: 8, type: 'walker', waypoints: [{ x: -8, z: 8 }, { x: -8, z: 18 }] },
            { x: 6, z: 14, type: 'walker', waypoints: [{ x: 6, z: 14 }, { x: -2, z: 14 }] },
            { x: 0, z: 26, type: 'walker', waypoints: [{ x: -4, z: 26 }, { x: 4, z: 26 }] }
        ];
    }

    /**
     * Level 2: The Hospital (Indoor dark corridors, medical lockers, 3 keys)
     */
    buildHospitalLevel() {
        this.name = "The Hospital";
        this.subtitle = "Quarantine Ward B - Search lockers and cabinets for 3 keys";
        this.timeLimit = 200;
        this.gateRequiredKeys = 3;
        this.fogColor = 0x020406;
        this.fogNear = 1.0;
        this.fogFar = 26.0;
        this.playerSpawn.set(0, 0, -28);

        // Hospital Tiled Floor
        const floorGeom = new THREE.PlaneGeometry(80, 80);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x121b18, roughness: 0.5 });
        const floor = new THREE.Mesh(floorGeom, floorMat);
        floor.rotation.x = -Math.PI / 2;
        this.levelGroup.add(floor);

        // Hospital Ceiling
        const ceilGeom = new THREE.PlaneGeometry(80, 80);
        const ceilMat = new THREE.MeshStandardMaterial({ color: 0x0b100e, roughness: 0.9 });
        const ceil = new THREE.Mesh(ceilGeom, ceilMat);
        ceil.position.y = 4.2;
        ceil.rotation.x = Math.PI / 2;
        this.levelGroup.add(ceil);

        // Boundaries
        this.addWall(-32, 0, 2, 72, 4.2, 0x1f2e29);
        this.addWall(32, 0, 2, 72, 4.2, 0x1f2e29);
        this.addWall(0, -36, 64, 2, 4.2, 0x1f2e29);
        this.addWall(0, 36, 64, 2, 4.2, 0x1f2e29);

        // Hospital Corridor Walls & Wards
        this.addWall(-10, -18, 2, 24, 4.2, 0x243630);
        this.addWall(10, -18, 2, 24, 4.2, 0x243630);
        this.addWall(-18, 0, 16, 2, 4.2, 0x243630);
        this.addWall(18, 0, 16, 2, 4.2, 0x243630);
        this.addWall(-10, 18, 2, 24, 4.2, 0x243630);
        this.addWall(10, 18, 2, 24, 4.2, 0x243630);

        // Flickering Emergency Red Ceiling Lights
        this.addEmergencyLight(0, -20);
        this.addEmergencyLight(0, 0);
        this.addEmergencyLight(-18, 12);
        this.addEmergencyLight(18, 12);
        this.addEmergencyLight(0, 24);

        // Searchable Objects (3 Keys + Clues + Medkits)
        this.addSearchableLocker(
            1, -16, -24,
            { type: 'key', name: 'ICU Keycard #1' },
            "Doctor's Wall Locker"
        );
        this.addSearchableCabinet(
            2, 18, -14,
            { type: 'clue', title: "Chief Medical Memo", hint: "Keycard #1 is in the staff lockers in the west wing." },
            "Medicine Cabinet"
        );
        this.addSearchableCabinet(
            3, -18, -8,
            { type: 'medkit', amount: 50 },
            "First Aid Cabinet"
        );
        this.addSearchableDrawer(
            4, 18, 6,
            { type: 'key', name: 'ICU Keycard #2' },
            "Nurse Station Desk"
        );
        this.addSearchableCrate(
            5, -18, 18,
            { type: 'clue', title: "Patient Transfer Chart", hint: "Keycard #2 was left on the nurse station desk in the east ward." },
            "Biohazard Bin"
        );
        this.addSearchableLocker(
            6, 18, 24,
            { type: 'key', name: 'ICU Keycard #3' },
            "Security Supply Locker"
        );
        this.addSearchableCrate(
            7, 0, 12,
            { type: 'ammo', amount: 15 },
            "Storage Crate"
        );

        // Exit Airlock Gate
        this.gatePos.set(0, 0, 34);
        this.addExitGate(0, 34, 6.0, 3);

        // Zombies: Fast RUNNERS + Walkers
        this.zombieSpawns = [
            { x: 0, z: -8, type: 'runner', waypoints: [{ x: 0, z: -8 }, { x: 0, z: 2 }] },
            { x: -18, z: -4, type: 'walker', waypoints: [{ x: -18, z: -4 }, { x: -18, z: 6 }] },
            { x: 18, z: -2, type: 'runner', waypoints: [{ x: 18, z: -2 }, { x: 18, z: 8 }] },
            { x: 0, z: 14, type: 'runner', waypoints: [{ x: -4, z: 14 }, { x: 4, z: 14 }] },
            { x: -18, z: 22, type: 'runner', waypoints: [{ x: -18, z: 22 }, { x: -10, z: 22 }] },
            { x: 0, z: 26, type: 'walker', waypoints: [{ x: -4, z: 26 }, { x: 4, z: 26 }] }
        ];
    }

    /**
     * Level 3: The Safe Zone Gate (Military ruins, searchlights, 4 keys, Boss Goliath)
     */
    buildMilitaryLevel() {
        this.name = "The Safe Zone Gate";
        this.subtitle = "Perimeter Omega - Search ruins for 4 keys to open the final blast gate";
        this.timeLimit = 220;
        this.gateRequiredKeys = 4;
        this.fogColor = 0x06090f;
        this.fogNear = 3.0;
        this.fogFar = 40.0;
        this.playerSpawn.set(0, 0, -32);

        // Mud & gravel concrete ground
        const groundGeom = new THREE.PlaneGeometry(90, 90);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x15181b, roughness: 0.95 });
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI / 2;
        this.levelGroup.add(ground);

        // Military Blast Walls
        this.addWall(-38, 0, 2, 84, 6, 0x22272c);
        this.addWall(38, 0, 2, 84, 6, 0x22272c);
        this.addWall(0, -40, 78, 2, 6, 0x22272c);
        this.addWall(0, 40, 78, 2, 6, 0x22272c);

        // Checkpoint Bunkers & Sandbags
        this.addWall(-16, -18, 14, 16, 4, 0x2b3137);
        this.addWall(16, -18, 14, 16, 4, 0x2b3137);
        this.addWall(-16, 16, 14, 16, 4, 0x2b3137);
        this.addWall(16, 16, 14, 16, 4, 0x2b3137);

        // Military Searchlights sweeping the grounds
        this.addSearchlight(-12, 0);
        this.addSearchlight(12, 0);
        this.addSearchlight(0, 24);

        // Searchable Objects (4 Keys + Supplies)
        this.addSearchableCar(
            1, -6, -20, 0.2,
            { type: 'key', name: 'Military Key #1' },
            "Overturned Humvee"
        );
        this.addSearchableCrate(
            2, 16, -8,
            { type: 'clue', title: "Commander's Classified Dispatch", hint: "Key #1 is inside the overturned Humvee at the south perimeter." },
            "Munitions Crate"
        );
        this.addSearchableCrate(
            3, -16, 2,
            { type: 'key', name: 'Military Key #2' },
            "Steel Supply Locker"
        );
        this.addSearchableCrate(
            4, 16, 4,
            { type: 'clue', title: "Sergeant's Radio Relay", hint: "Key #2 was stashed in the steel locker by bunker Alpha." },
            "Ammo Footlocker"
        );
        this.addSearchableCar(
            5, -6, 20, -0.4,
            { type: 'key', name: 'Military Key #3' },
            "Armored Transport Truck"
        );
        this.addSearchableCrate(
            6, 16, 24,
            { type: 'key', name: 'Military Key #4' },
            "Command Desk Terminal"
        );
        this.addSearchableCrate(
            7, 0, -10,
            { type: 'medkit', amount: 50 },
            "Field Medic Station"
        );

        // Final Blast Gate
        this.gatePos.set(0, 0, 38);
        this.addExitGate(0, 38, 8.0, 4);

        // Spawns: BOSS GOLIATH + Runners + Brutes
        this.zombieSpawns = [
            // The Boss Goliath!
            { x: 0, z: 8, type: 'boss', waypoints: [{ x: -6, z: 8 }, { x: 6, z: 8 }] },
            // Brute
            { x: -14, z: -4, type: 'brute', waypoints: [{ x: -14, z: -4 }, { x: -8, z: -4 }] },
            { x: 14, z: -4, type: 'brute', waypoints: [{ x: 14, z: -4 }, { x: 8, z: -4 }] },
            // Fast Runners
            { x: -8, z: 16, type: 'runner', waypoints: [{ x: -8, z: 16 }, { x: 0, z: 16 }] },
            { x: 8, z: 16, type: 'runner', waypoints: [{ x: 8, z: 16 }, { x: 0, z: 16 }] },
            { x: 0, z: 26, type: 'runner', waypoints: [{ x: -4, z: 26 }, { x: 4, z: 26 }] }
        ];
    }

    addBuilding(x, z, w, d, h) {
        this.addWall(x, z, w, d, h, 0x222a32);

        // Glowing yellow windows on building facade
        const winMat = new THREE.MeshBasicMaterial({ color: 0xffd27d });
        for (let row = 1; row < h - 1; row += 2.2) {
            const winMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.05), winMat);
            winMesh.position.set(x, row, z + d / 2 + 0.03);
            this.levelGroup.add(winMesh);
        }
    }

    addWall(x, z, w, d, h = 4, color = 0x222830) {
        const geom = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, h / 2, z);
        this.levelGroup.add(mesh);

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

        // Gate collision if closed
        if (!this.gateUnlocked && this.gatePos) {
            const gw = 7.0;
            if (x + radius > this.gatePos.x - gw / 2 && x - radius < this.gatePos.x + gw / 2 &&
                z + radius > this.gatePos.z - 1.2 && z - radius < this.gatePos.z + 1.2) {
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

    // --- Searchable Objects Builders ---

    addSearchableCrate(id, x, z, reward, name = "Supply Crate") {
        const group = new THREE.Group();
        const crateGeom = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        const crateMat = new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.8 });
        const mesh = new THREE.Mesh(crateGeom, crateMat);
        mesh.position.y = 0.6;
        group.add(mesh);

        // Interaction aura light
        const light = new THREE.PointLight(0x00e5ff, 0.6, 3.5);
        light.position.y = 1.4;
        group.add(light);

        group.position.set(x, 0, z);
        this.levelGroup.add(group);

        const obj = new SearchableObject(id, 'crate', name, new THREE.Vector3(x, 0, z), reward);
        obj.mesh = group;
        this.searchables.push(obj);

        this.walls.push({ minX: x - 0.6, maxX: x + 0.6, minZ: z - 0.6, maxZ: z + 0.6 });
    }

    addSearchableCar(id, x, z, rotY, reward, name = "Abandoned Vehicle") {
        const group = new THREE.Group();
        const bodyGeom = new THREE.BoxGeometry(2.2, 1.1, 4.4);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1f344d, roughness: 0.5 });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 0.7;
        group.add(body);

        const light = new THREE.PointLight(0x00e5ff, 0.6, 4.0);
        light.position.y = 1.6;
        group.add(light);

        group.position.set(x, 0, z);
        group.rotation.y = rotY;
        this.levelGroup.add(group);

        const obj = new SearchableObject(id, 'car', name, new THREE.Vector3(x, 0, z), reward);
        obj.mesh = group;
        this.searchables.push(obj);

        this.walls.push({ minX: x - 1.2, maxX: x + 1.2, minZ: z - 2.2, maxZ: z + 2.2 });
    }

    addSearchableLocker(id, x, z, reward, name = "Metal Locker") {
        const group = new THREE.Group();
        const lockerGeom = new THREE.BoxGeometry(0.8, 2.2, 0.7);
        const lockerMat = new THREE.MeshStandardMaterial({ color: 0x3d4b54, roughness: 0.6 });
        const mesh = new THREE.Mesh(lockerGeom, lockerMat);
        mesh.position.y = 1.1;
        group.add(mesh);

        const light = new THREE.PointLight(0x00e5ff, 0.6, 3.5);
        light.position.y = 2.0;
        group.add(light);

        group.position.set(x, 0, z);
        this.levelGroup.add(group);

        const obj = new SearchableObject(id, 'locker', name, new THREE.Vector3(x, 0, z), reward);
        obj.mesh = group;
        this.searchables.push(obj);

        this.walls.push({ minX: x - 0.45, maxX: x + 0.45, minZ: z - 0.4, maxZ: z + 0.4 });
    }

    addSearchableCabinet(id, x, z, reward, name = "Medical Cabinet") {
        const group = new THREE.Group();
        const cabGeom = new THREE.BoxGeometry(1.2, 1.6, 0.6);
        const cabMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, roughness: 0.4 });
        const mesh = new THREE.Mesh(cabGeom, cabMat);
        mesh.position.y = 0.8;
        group.add(mesh);

        const light = new THREE.PointLight(0x00e5ff, 0.6, 3.5);
        light.position.y = 1.6;
        group.add(light);

        group.position.set(x, 0, z);
        this.levelGroup.add(group);

        const obj = new SearchableObject(id, 'cabinet', name, new THREE.Vector3(x, 0, z), reward);
        obj.mesh = group;
        this.searchables.push(obj);

        this.walls.push({ minX: x - 0.65, maxX: x + 0.65, minZ: z - 0.35, maxZ: z + 0.35 });
    }

    addSearchableDrawer(id, x, z, reward, name = "Desk Drawer") {
        const group = new THREE.Group();
        const deskGeom = new THREE.BoxGeometry(1.4, 0.9, 0.9);
        const deskMat = new THREE.MeshStandardMaterial({ color: 0x4a3c31, roughness: 0.7 });
        const mesh = new THREE.Mesh(deskGeom, deskMat);
        mesh.position.y = 0.45;
        group.add(mesh);

        const light = new THREE.PointLight(0x00e5ff, 0.6, 3.5);
        light.position.y = 1.2;
        group.add(light);

        group.position.set(x, 0, z);
        this.levelGroup.add(group);

        const obj = new SearchableObject(id, 'drawer', name, new THREE.Vector3(x, 0, z), reward);
        obj.mesh = group;
        this.searchables.push(obj);

        this.walls.push({ minX: x - 0.75, maxX: x + 0.75, minZ: z - 0.5, maxZ: z + 0.5 });
    }

    addSearchableBin(id, x, z, reward, name = "Dumpster") {
        const group = new THREE.Group();
        const binGeom = new THREE.BoxGeometry(2.0, 1.3, 1.2);
        const binMat = new THREE.MeshStandardMaterial({ color: 0x27ae60, roughness: 0.8 });
        const mesh = new THREE.Mesh(binGeom, binMat);
        mesh.position.y = 0.65;
        group.add(mesh);

        const light = new THREE.PointLight(0x00e5ff, 0.6, 3.5);
        light.position.y = 1.5;
        group.add(light);

        group.position.set(x, 0, z);
        this.levelGroup.add(group);

        const obj = new SearchableObject(id, 'bin', name, new THREE.Vector3(x, 0, z), reward);
        obj.mesh = group;
        this.searchables.push(obj);

        this.walls.push({ minX: x - 1.1, maxX: x + 1.1, minZ: z - 0.65, maxZ: z + 0.65 });
    }

    addExitGate(x, z, width = 6.0, requiredKeys = 2) {
        const group = new THREE.Group();

        // Steel Posts
        const postGeom = new THREE.BoxGeometry(0.8, 5.2, 0.8);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });

        const leftPost = new THREE.Mesh(postGeom, postMat);
        leftPost.position.set(-width / 2, 2.6, 0);
        group.add(leftPost);

        const rightPost = new THREE.Mesh(postGeom, postMat);
        rightPost.position.set(width / 2, 2.6, 0);
        group.add(rightPost);

        // Top Arch
        const beamGeom = new THREE.BoxGeometry(width + 0.8, 0.8, 0.8);
        const beam = new THREE.Mesh(beamGeom, postMat);
        beam.position.set(0, 4.8, 0);
        group.add(beam);

        // Sliding Gate Barrier
        const doorGeom = new THREE.BoxGeometry(width - 0.2, 4.2, 0.3);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d, metalness: 0.6, roughness: 0.4 });
        this.gateDoorMesh = new THREE.Mesh(doorGeom, doorMat);
        this.gateDoorMesh.position.set(0, 2.1, 0);
        group.add(this.gateDoorMesh);

        // Green glowing exit portal threshold
        const portalGeom = new THREE.BoxGeometry(width - 0.4, 4.0, 0.1);
        this.portalMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0 });
        const portal = new THREE.Mesh(portalGeom, this.portalMat);
        portal.position.set(0, 2.0, 0);
        group.add(portal);

        group.position.set(x, 0, z);
        this.levelGroup.add(group);
        this.gateMesh = group;
    }

    addStreetLamp(x, z) {
        const poleGeom = new THREE.CylinderGeometry(0.08, 0.1, 5.0, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x22262a });
        const pole = new THREE.Mesh(poleGeom, poleMat);
        pole.position.set(x, 2.5, z);
        this.levelGroup.add(pole);

        const light = new THREE.PointLight(0xffeedd, 1.8, 18.0);
        light.position.set(x, 4.8, z);
        this.levelGroup.add(light);
    }

    addEmergencyLight(x, z) {
        const light = new THREE.PointLight(0xff2222, 1.5, 12.0);
        light.position.set(x, 3.8, z);
        this.levelGroup.add(light);
    }

    addSearchlight(x, z) {
        const light = new THREE.SpotLight(0xaaccff, 2.8, 32.0, Math.PI * 0.25, 0.4);
        light.position.set(x, 5.2, z);
        light.target.position.set(x, 0, z + 6);
        this.levelGroup.add(light);
        this.levelGroup.add(light.target);
    }

    update(dt) {
        // Animate gate opening upwards when unlocked
        if (this.gateUnlocked && this.gateDoorMesh) {
            if (this.gateDoorMesh.position.y < 6.2) {
                this.gateDoorMesh.position.y += dt * 3.5;
                this.portalMat.opacity = Math.min(0.7, this.portalMat.opacity + dt * 2.0);
            }
        }
    }
}
