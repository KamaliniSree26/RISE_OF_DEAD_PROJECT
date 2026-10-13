/**
 * LAST LIGHT: Escape the Infected City - 3D Edition
 * weapons3d.js - 3D Viewmodels, Projectiles & Arsenal System
 * 
 * Implements 3D weapon viewmodels mounted to camera, melee swing arcs,
 * raycasted bullet hit-detection with 3D particle impacts, and physical 3D throwable flares.
 */

class Weapon3DManager {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;

        this.weapons = {
            bat: {
                name: 'Baseball Bat',
                type: 'melee',
                durability: 10,
                maxDurability: 10,
                damage: 45,
                range: 3.5,
                cooldown: 0.4,
                noise: 40,
                icon: '🏏'
            },
            pistol: {
                name: '9mm Pistol',
                type: 'ranged',
                ammo: 15,
                maxAmmo: 30,
                damage: 55,
                range: 45,
                cooldown: 0.3,
                noise: 300,
                icon: '🔫'
            },
            flare: {
                name: 'Distraction Flare',
                type: 'throwable',
                count: 3,
                maxCount: 6,
                cooldown: 0.7,
                noise: 250,
                icon: '🧨'
            }
        };

        this.currentWeapon = 'bat';
        this.lastAttackTime = 0;

        // Viewmodel container attached to camera
        this.viewmodelGroup = new THREE.Group();
        this.camera.add(this.viewmodelGroup);
        this.scene.add(this.camera);

        // 3D Meshes for each weapon
        this.batMesh = null;
        this.pistolMesh = null;
        this.muzzleFlashLight = null;
        this.flareMesh = null;

        // Animation states
        this.isSwinging = false;
        this.swingProgress = 0;
        this.isRecoiling = false;
        this.recoilProgress = 0;

        // Active 3D thrown flares
        this.activeFlares = [];

        this.buildViewmodels();
    }

    buildViewmodels() {
        // --- 1. 3D Baseball Bat ---
        this.batMesh = new THREE.Group();
        const batMat = new THREE.MeshStandardMaterial({ color: 0xc68642, roughness: 0.6 });
        const batGripMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.9 });

        // Bat barrel
        const batGeom = new THREE.CylinderGeometry(0.045, 0.025, 0.8, 12);
        const batBody = new THREE.Mesh(batGeom, batMat);
        batBody.position.y = 0.25;
        this.batMesh.add(batBody);

        // Handle grip tape
        const gripGeom = new THREE.CylinderGeometry(0.026, 0.025, 0.25, 12);
        const grip = new THREE.Mesh(gripGeom, batGripMat);
        grip.position.y = -0.22;
        this.batMesh.add(grip);

        this.batMesh.position.set(0.38, -0.32, -0.6);
        this.batMesh.rotation.set(0.4, -0.4, -0.6);
        this.viewmodelGroup.add(this.batMesh);

        // --- 2. 3D Pistol ---
        this.pistolMesh = new THREE.Group();
        const gunBodyMat = new THREE.MeshStandardMaterial({ color: 0x222629, metalness: 0.7, roughness: 0.3 });
        const gunGripMat = new THREE.MeshStandardMaterial({ color: 0x111315, roughness: 0.8 });

        // Slide
        const slideGeom = new THREE.BoxGeometry(0.07, 0.08, 0.28);
        const slide = new THREE.Mesh(slideGeom, gunBodyMat);
        slide.position.set(0, 0.04, -0.05);
        this.pistolMesh.add(slide);

        // Grip
        const pGripGeom = new THREE.BoxGeometry(0.065, 0.16, 0.09);
        const pGrip = new THREE.Mesh(pGripGeom, gunGripMat);
        pGrip.position.set(0, -0.07, 0.04);
        pGrip.rotation.x = -0.2;
        this.pistolMesh.add(pGrip);

        // Muzzle Flash Light
        this.muzzleFlashLight = new THREE.PointLight(0xffaa22, 0, 8);
        this.muzzleFlashLight.position.set(0, 0.05, -0.22);
        this.pistolMesh.add(this.muzzleFlashLight);

        this.pistolMesh.position.set(0.32, -0.26, -0.55);
        this.pistolMesh.rotation.set(0, 0.05, 0);
        this.pistolMesh.visible = false;
        this.viewmodelGroup.add(this.pistolMesh);

        // --- 3. 3D Flare Viewmodel ---
        this.flareMesh = new THREE.Group();
        const flareCylMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.5 });
        const flareCapMat = new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xff5500, emissiveIntensity: 0.8 });

        const flareGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.32, 10);
        const flareBody = new THREE.Mesh(flareGeom, flareCylMat);
        this.flareMesh.add(flareBody);

        const tipGeom = new THREE.ConeGeometry(0.032, 0.08, 10);
        const tip = new THREE.Mesh(tipGeom, flareCapMat);
        tip.position.y = 0.18;
        this.flareMesh.add(tip);

        this.flareMesh.position.set(0.35, -0.28, -0.55);
        this.flareMesh.rotation.set(0.3, 0, -0.3);
        this.flareMesh.visible = false;
        this.viewmodelGroup.add(this.flareMesh);
    }

    selectWeapon(key) {
        if (!this.weapons[key]) return;
        this.currentWeapon = key;
        this.batMesh.visible = (key === 'bat');
        this.pistolMesh.visible = (key === 'pistol');
        this.flareMesh.visible = (key === 'flare');
    }

    cycleWeapon() {
        const order = ['bat', 'pistol', 'flare'];
        const nextIdx = (order.indexOf(this.currentWeapon) + 1) % order.length;
        this.selectWeapon(order[nextIdx]);
    }

    addAmmo(amount) {
        this.weapons.pistol.ammo = Math.min(this.weapons.pistol.maxAmmo, this.weapons.pistol.ammo + amount);
    }

    addFlares(amount) {
        this.weapons.flare.count = Math.min(this.weapons.flare.maxCount, this.weapons.flare.count + amount);
    }

    repairBat(amount = 10) {
        this.weapons.bat.durability = Math.min(this.weapons.bat.maxDurability, this.weapons.bat.durability + amount);
    }

    getActiveWeaponData() {
        return this.weapons[this.currentWeapon];
    }

    /**
     * Executes attack. Returns noise generated (0 if failed/on cooldown).
     */
    attack(player, zombies, particleSystem) {
        const now = performance.now() / 1000;
        const w = this.weapons[this.currentWeapon];

        if (now - this.lastAttackTime < w.cooldown) return 0;

        if (this.currentWeapon === 'bat') {
            if (w.durability <= 0) {
                if (window.soundSystem) window.soundSystem.playBeep(false);
                return 0;
            }

            this.lastAttackTime = now;
            this.isSwinging = true;
            this.swingProgress = 0;

            if (window.soundSystem) window.soundSystem.playBatSwing();

            // Melee raycast/cone hit check
            const hitZombie = this.checkMeleeHit(player, zombies, w.range);
            let noise = w.noise;

            if (hitZombie) {
                w.durability--;
                hitZombie.takeDamage(w.damage, player.position);
                noise = 120; // Hitting body makes louder thud
                if (window.soundSystem) window.soundSystem.playBatHit();
                if (particleSystem) {
                    particleSystem.spawnBlood(hitZombie.mesh.position.x, hitZombie.mesh.position.y + 1.2, hitZombie.mesh.position.z, 20);
                }
            }

            return noise;
        } 
        else if (this.currentWeapon === 'pistol') {
            if (w.ammo <= 0) {
                if (window.soundSystem) window.soundSystem.playBeep(false);
                return 0;
            }

            this.lastAttackTime = now;
            w.ammo--;
            this.isRecoiling = true;
            this.recoilProgress = 0;
            this.muzzleFlashLight.intensity = 4.0;

            if (window.soundSystem) window.soundSystem.playGunshot();

            // Raycast forward from camera center
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
            raycaster.far = w.range;

            // Gather zombie hitboxes
            const zombieMeshes = zombies.filter(z => z.isAlive).map(z => z.mesh);
            const intersects = raycaster.intersectObjects(zombieMeshes, true);

            if (intersects.length > 0) {
                const hit = intersects[0];
                // Find corresponding zombie instance
                let topObj = hit.object;
                while (topObj.parent && !topObj.userData.zombieInstance) {
                    topObj = topObj.parent;
                }
                const zInstance = topObj.userData.zombieInstance;
                if (zInstance && zInstance.isAlive) {
                    zInstance.takeDamage(w.damage, player.position);
                    if (particleSystem) {
                        particleSystem.spawnBlood(hit.point.x, hit.point.y, hit.point.z, 22);
                    }
                }
            } else {
                // Check wall impact
                if (particleSystem) {
                    const dir = new THREE.Vector3();
                    this.camera.getWorldDirection(dir);
                    const sparkPos = player.position.clone().add(dir.multiplyScalar(8));
                    particleSystem.spawnSparks(sparkPos.x, sparkPos.y + 1, sparkPos.z);
                }
            }

            return w.noise; // Gunshot is very loud (300)
        } 
        else if (this.currentWeapon === 'flare') {
            if (w.count <= 0) {
                if (window.soundSystem) window.soundSystem.playBeep(false);
                return 0;
            }

            this.lastAttackTime = now;
            w.count--;

            if (window.soundSystem) window.soundSystem.playFlareIgnite();

            // Spawn 3D thrown flare
            this.throwFlare(player);
            return w.noise;
        }

        return 0;
    }

    checkMeleeHit(player, zombies, range) {
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        camDir.y = 0;
        camDir.normalize();

        let closestZombie = null;
        let closestDist = range;

        zombies.forEach(z => {
            if (!z.isAlive) return;
            const toZ = new THREE.Vector3().subVectors(z.mesh.position, player.position);
            toZ.y = 0;
            const dist = toZ.length();

            if (dist <= range) {
                toZ.normalize();
                const dot = camDir.dot(toZ);
                if (dot > 0.55 && dist < closestDist) { // ~60 degree frontal cone
                    closestDist = dist;
                    closestZombie = z;
                }
            }
        });

        return closestZombie;
    }

    throwFlare(player) {
        const flareObj = new THREE.Group();

        // 3D burning stick
        const stickGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8);
        const stickMat = new THREE.MeshStandardMaterial({ color: 0xee1111, roughness: 0.4 });
        const stick = new THREE.Mesh(stickGeom, stickMat);
        flareObj.add(stick);

        // Core glowing fire tip
        const fireTipGeom = new THREE.SphereGeometry(0.07, 8, 8);
        const fireTipMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const fireTip = new THREE.Mesh(fireTipGeom, fireTipMat);
        fireTip.position.y = 0.2;
        flareObj.add(fireTip);

        // Bright red 3D PointLight
        const light = new THREE.PointLight(0xff2200, 3.5, 18);
        light.position.y = 0.2;
        flareObj.add(light);

        // Initial throw position and velocity
        const throwDir = new THREE.Vector3();
        this.camera.getWorldDirection(throwDir);

        flareObj.position.copy(player.position).add(new THREE.Vector3(0, 1.4, 0));
        this.scene.add(flareObj);

        this.activeFlares.push({
            mesh: flareObj,
            velocity: throwDir.multiplyScalar(14).add(new THREE.Vector3(0, 3.5, 0)),
            lifeTime: 8.0, // Burns for 8 seconds
            lureRadius: 22.0, // Attracts zombies in 22m radius
            active: true
        });
    }

    update(dt, particleSystem) {
        // 1. Weapon Animations
        if (this.isSwinging) {
            this.swingProgress += dt * 6.5;
            if (this.swingProgress < 1.0) {
                // Sweep bat forward and across
                const progress = this.swingProgress;
                this.batMesh.rotation.set(0.4 - Math.sin(progress * Math.PI) * 1.5, -0.4 + Math.sin(progress * Math.PI) * 1.8, -0.6);
                this.batMesh.position.x = 0.38 - Math.sin(progress * Math.PI) * 0.5;
            } else {
                this.isSwinging = false;
                this.batMesh.rotation.set(0.4, -0.4, -0.6);
                this.batMesh.position.set(0.38, -0.32, -0.6);
            }
        }

        if (this.isRecoiling) {
            this.recoilProgress += dt * 12.0;
            if (this.recoilProgress < 1.0) {
                const kick = Math.sin(this.recoilProgress * Math.PI) * 0.12;
                this.pistolMesh.position.z = -0.55 + kick;
                this.pistolMesh.rotation.x = kick * 1.5;
                this.muzzleFlashLight.intensity = Math.max(0, 4.0 * (1 - this.recoilProgress * 3));
            } else {
                this.isRecoiling = false;
                this.pistolMesh.position.z = -0.55;
                this.pistolMesh.rotation.x = 0;
                this.muzzleFlashLight.intensity = 0;
            }
        }

        // 2. Thrown Flares Physics & Lure
        for (let i = this.activeFlares.length - 1; i >= 0; i--) {
            const f = this.activeFlares[i];
            f.lifeTime -= dt;

            // Gravity & velocity
            f.velocity.y -= 18 * dt; // gravity
            f.mesh.position.addScaledVector(f.velocity, dt);

            // Ground bounce
            if (f.mesh.position.y <= 0.15) {
                f.mesh.position.y = 0.15;
                f.velocity.y = -f.velocity.y * 0.35;
                f.velocity.x *= 0.7;
                f.velocity.z *= 0.7;
            }

            // Spawn 3D flare sparks & smoke
            if (particleSystem && Math.random() < 0.6) {
                particleSystem.spawnSparks(f.mesh.position.x, f.mesh.position.y + 0.2, f.mesh.position.z, 0xff5500);
            }

            // Flare expiration
            if (f.lifeTime <= 0) {
                this.scene.remove(f.mesh);
                this.activeFlares.splice(i, 1);
            }
        }
    }
}

window.Weapon3DManager = Weapon3DManager;
