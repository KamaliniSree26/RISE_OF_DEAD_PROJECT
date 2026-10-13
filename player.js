/**
 * LAST LIGHT: Escape the Infected City
 * player.js - Realistic Human Survivor & Third-Person Controller
 * 
 * Implements a detailed humanoid survivor model, natural animation state machine,
 * over-the-shoulder third-person camera with wall-collision avoidance,
 * searching mechanics, weapons arsenal, noise system, and stamina/health.
 */

import * as THREE from './three.module.js';

export class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        // Position & physics
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3();
        this.rotationY = 0; // facing direction

        // Speeds
        this.walkSpeed = 4.8;
        this.runSpeed = 8.8;
        this.currentSpeed = this.walkSpeed;
        this.isRunning = false;
        this.isGrounded = true;
        this.jumpVelocityY = 0;

        // Attributes
        this.maxHealth = 100;
        this.health = 100;
        this.lives = 3;
        this.maxLives = 3;
        this.invulnerableTimer = 0;

        // Stamina
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaDrain = 25;
        this.staminaRecover = 18;

        // Noise radius (in meters)
        this.noiseRadius = 0;
        this.footstepTimer = 0;

        // Flashlight
        this.flashlightOn = true;
        this.flashlight = null;

        // Inventory
        this.keys = 0;
        this.cluesFound = []; // Array of clue objects {id, title, hint}
        this.weapons = {
            bat: { name: 'Baseball Bat', type: 'melee', durability: 10, maxDurability: 10, damage: 45, range: 2.8, cooldown: 0.4 },
            pistol: { name: '9mm Pistol', type: 'ranged', ammo: 15, maxAmmo: 30, damage: 55, range: 40, cooldown: 0.35 },
            flare: { name: 'Distraction Flare', type: 'throwable', count: 3, maxCount: 6, cooldown: 0.8 }
        };
        this.currentWeapon = 'bat';
        this.lastAttackTime = 0;

        // Thrown flares
        this.activeFlares = [];

        // Third-person camera controls
        this.cameraDistance = 3.6;
        this.cameraTargetDistance = 3.6;
        this.cameraHeight = 1.6;
        this.cameraSideOffset = 0.55; // Over-the-right-shoulder
        this.cameraYaw = 0;
        this.cameraPitch = 0.15; // slightly looking down

        // Animations
        this.animTime = 0;
        this.swingTimer = 0;
        this.recoilTimer = 0;

        // Build 3D Human Survivor Model
        this.mesh = this.buildHumanoidModel();
        this.scene.add(this.mesh);

        // Flashlight setup
        this.setupFlashlight();
    }

    /**
     * Builds a detailed procedural human survivor model
     */
    buildHumanoidModel() {
        const root = new THREE.Group();

        // PBR Materials
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.65 });
        const jacketMat = new THREE.MeshStandardMaterial({ color: 0x243342, roughness: 0.75 }); // rugged jacket
        const jeansMat = new THREE.MeshStandardMaterial({ color: 0x1b242e, roughness: 0.85 });  // denim jeans
        const vestMat = new THREE.MeshStandardMaterial({ color: 0x141a20, roughness: 0.8 });   // tactical vest
        const bootMat = new THREE.MeshStandardMaterial({ color: 0x2b1e16, roughness: 0.7 });   // leather boots
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
        const backpackMat = new THREE.MeshStandardMaterial({ color: 0x3d3a2d, roughness: 0.8 });

        // Pelvis / Hips
        const pelvisGeom = new THREE.BoxGeometry(0.42, 0.22, 0.26);
        this.pelvis = new THREE.Mesh(pelvisGeom, jeansMat);
        this.pelvis.position.y = 0.92;
        root.add(this.pelvis);

        // Torso / Jacket
        const torsoGeom = new THREE.BoxGeometry(0.46, 0.52, 0.28);
        this.torso = new THREE.Mesh(torsoGeom, jacketMat);
        this.torso.position.y = 0.36;
        this.pelvis.add(this.torso);

        // Tactical Vest
        const vestGeom = new THREE.BoxGeometry(0.48, 0.42, 0.31);
        const vest = new THREE.Mesh(vestGeom, vestMat);
        vest.position.set(0, -0.02, 0);
        this.torso.add(vest);

        // Tactical Backpack on back
        const packGeom = new THREE.BoxGeometry(0.34, 0.42, 0.18);
        const backpack = new THREE.Mesh(packGeom, backpackMat);
        backpack.position.set(0, 0.02, -0.22);
        this.torso.add(backpack);

        // Neck & Head
        const neckGeom = new THREE.CylinderGeometry(0.09, 0.1, 0.12, 8);
        const neck = new THREE.Mesh(neckGeom, skinMat);
        neck.position.y = 0.3;
        this.torso.add(neck);

        const headGeom = new THREE.SphereGeometry(0.16, 12, 10);
        this.head = new THREE.Mesh(headGeom, skinMat);
        this.head.position.y = 0.15;
        neck.add(this.head);

        // Hair / Tactical Cap
        const hairGeom = new THREE.SphereGeometry(0.165, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
        const hair = new THREE.Mesh(hairGeom, hairMat);
        hair.position.y = 0.02;
        this.head.add(hair);

        // Left Arm
        this.leftArm = new THREE.Group();
        this.leftArm.position.set(-0.31, 0.2, 0);
        const lUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.3, 8), jacketMat);
        lUpper.position.y = -0.15;
        this.leftArm.add(lUpper);
        const lFore = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.28, 8), skinMat);
        lFore.position.y = -0.38;
        this.leftArm.add(lFore);
        this.torso.add(this.leftArm);

        // Right Arm (Holds active weapon)
        this.rightArm = new THREE.Group();
        this.rightArm.position.set(0.31, 0.2, 0);
        const rUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.3, 8), jacketMat);
        rUpper.position.y = -0.15;
        this.rightArm.add(rUpper);
        const rFore = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.28, 8), skinMat);
        rFore.position.y = -0.38;
        this.rightArm.add(rFore);
        this.torso.add(this.rightArm);

        // Weapon Meshes held in right hand
        this.heldBat = this.buildHeldBatMesh();
        this.heldPistol = this.buildHeldPistolMesh();
        this.heldFlare = this.buildHeldFlareMesh();
        this.rightArm.add(this.heldBat);
        this.rightArm.add(this.heldPistol);
        this.rightArm.add(this.heldFlare);
        this.updateHeldWeaponVisibility();

        // Left Leg
        this.leftLeg = new THREE.Group();
        this.leftLeg.position.set(-0.14, -0.1, 0);
        const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.42, 8), jeansMat);
        lThigh.position.y = -0.21;
        this.leftLeg.add(lThigh);
        const lShin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.38, 8), jeansMat);
        lShin.position.y = -0.58;
        this.leftLeg.add(lShin);
        const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.26), bootMat);
        lBoot.position.set(0, -0.8, 0.05);
        this.leftLeg.add(lBoot);
        this.pelvis.add(this.leftLeg);

        // Right Leg
        this.rightLeg = new THREE.Group();
        this.rightLeg.position.set(0.14, -0.1, 0);
        const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.42, 8), jeansMat);
        rThigh.position.y = -0.21;
        this.rightLeg.add(rThigh);
        const rShin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.38, 8), jeansMat);
        rShin.position.y = -0.58;
        this.rightLeg.add(rShin);
        const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.26), bootMat);
        rBoot.position.set(0, -0.8, 0.05);
        this.rightLeg.add(rBoot);
        this.pelvis.add(this.rightLeg);

        return root;
    }

    buildHeldBatMesh() {
        const group = new THREE.Group();
        const batGeom = new THREE.CylinderGeometry(0.045, 0.025, 0.85, 8);
        const batMat = new THREE.MeshStandardMaterial({ color: 0xba7a38, roughness: 0.6 });
        const mesh = new THREE.Mesh(batGeom, batMat);
        mesh.position.set(0, -0.48, 0.2);
        mesh.rotation.x = Math.PI * 0.4;
        group.add(mesh);
        return group;
    }

    buildHeldPistolMesh() {
        const group = new THREE.Group();
        const bodyGeom = new THREE.BoxGeometry(0.06, 0.14, 0.22);
        const gunMat = new THREE.MeshStandardMaterial({ color: 0x1f2326, metalness: 0.8, roughness: 0.3 });
        const mesh = new THREE.Mesh(bodyGeom, gunMat);
        mesh.position.set(0, -0.52, 0.12);
        group.add(mesh);
        return group;
    }

    buildHeldFlareMesh() {
        const group = new THREE.Group();
        const flareGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8);
        const flareMat = new THREE.MeshStandardMaterial({ color: 0xd90429 });
        const mesh = new THREE.Mesh(flareGeom, flareMat);
        mesh.position.set(0, -0.48, 0.1);
        group.add(mesh);
        return group;
    }

    updateHeldWeaponVisibility() {
        if (this.heldBat) this.heldBat.visible = (this.currentWeapon === 'bat');
        if (this.heldPistol) this.heldPistol.visible = (this.currentWeapon === 'pistol');
        if (this.heldFlare) this.heldFlare.visible = (this.currentWeapon === 'flare');
    }

    setupFlashlight() {
        this.flashlight = new THREE.SpotLight(0xfff7e6, 3.5, 42.0, Math.PI * 0.28, 0.45);
        this.flashlight.position.set(0.18, 0.25, 0.2);
        this.torso.add(this.flashlight);

        this.flashlightTarget = new THREE.Object3D();
        this.flashlightTarget.position.set(0, 0, 10);
        this.torso.add(this.flashlightTarget);
        this.flashlight.target = this.flashlightTarget;
    }

    toggleFlashlight(audioManager) {
        this.flashlightOn = !this.flashlightOn;
        this.flashlight.intensity = this.flashlightOn ? 3.5 : 0;
        if (audioManager) audioManager.playFootstep('tile', false);
    }

    selectWeapon(type) {
        if (this.weapons[type]) {
            this.currentWeapon = type;
            this.updateHeldWeaponVisibility();
        }
    }

    cycleWeapon() {
        const order = ['bat', 'pistol', 'flare'];
        const nextIdx = (order.indexOf(this.currentWeapon) + 1) % order.length;
        this.selectWeapon(order[nextIdx]);
    }

    resetPosition(x, y, z) {
        this.position.set(x, y, z);
        this.mesh.position.copy(this.position);
        this.health = this.maxHealth;
        this.invulnerableTimer = 2.5;
        this.noiseRadius = 0;
    }

    takeDamage(amount, audioManager) {
        if (this.invulnerableTimer > 0) return false;

        this.health -= amount;
        this.invulnerableTimer = 1.0;

        if (audioManager) audioManager.playPlayerHurt();

        if (this.health <= 0) {
            this.handleDeath(audioManager);
            return true;
        }
        return false;
    }

    handleDeath(audioManager) {
        this.lives--;
        if (this.lives > 0) {
            this.health = this.maxHealth;
            this.invulnerableTimer = 3.0;
            if (window.game && window.game.level) {
                this.resetPosition(window.game.level.playerSpawn.x, 0, window.game.level.playerSpawn.z);
            }
        } else {
            if (window.game) {
                window.game.triggerGameOver('Overwhelmed by infected');
            }
        }
    }

    /**
     * Executes attack based on current weapon
     */
    attack(zombies, audioManager, particleSystem) {
        const now = performance.now() / 1000;
        const w = this.weapons[this.currentWeapon];

        if (now - this.lastAttackTime < w.cooldown) return;

        if (this.currentWeapon === 'bat') {
            if (w.durability <= 0) return;

            this.lastAttackTime = now;
            this.swingTimer = 0.35;
            if (audioManager) audioManager.playBatSwing();

            // Cone attack in front of player
            const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
            let hitAny = false;

            zombies.forEach(z => {
                if (!z.isAlive) return;
                const toZ = new THREE.Vector3().subVectors(z.position, this.position);
                toZ.y = 0;
                const dist = toZ.length();

                if (dist <= w.range) {
                    toZ.normalize();
                    const dot = forward.dot(toZ);
                    if (dot > 0.45) { // ~65 deg forward arc
                        hitAny = true;
                        z.takeDamage(w.damage, this.position, audioManager, particleSystem);
                    }
                }
            });

            if (hitAny) {
                w.durability--;
                if (audioManager) audioManager.playBatHit();
                this.noiseRadius = Math.max(this.noiseRadius, 8.0);
            } else {
                this.noiseRadius = Math.max(this.noiseRadius, 2.5);
            }
        } 
        else if (this.currentWeapon === 'pistol') {
            if (w.ammo <= 0) return;

            this.lastAttackTime = now;
            w.ammo--;
            this.recoilTimer = 0.2;
            if (audioManager) audioManager.playGunshot();

            // Loud noise attracts zombies!
            this.noiseRadius = 32.0;

            // Forward raycast bullet
            const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
            let hitZombie = null;
            let closestDist = w.range;

            zombies.forEach(z => {
                if (!z.isAlive) return;
                const toZ = new THREE.Vector3().subVectors(z.position, this.position);
                const dist = toZ.length();
                if (dist < closestDist) {
                    toZ.normalize();
                    if (forward.dot(toZ) > 0.85) {
                        closestDist = dist;
                        hitZombie = z;
                    }
                }
            });

            if (hitZombie) {
                hitZombie.takeDamage(w.damage, this.position, audioManager, particleSystem);
            }
        } 
        else if (this.currentWeapon === 'flare') {
            if (w.count <= 0) return;

            this.lastAttackTime = now;
            w.count--;
            if (audioManager) audioManager.playFlareIgnite();

            // Throw flare forward
            const throwDir = new THREE.Vector3(0, 0.4, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY).normalize();
            this.throwFlare(throwDir);
        }
    }

    throwFlare(dir) {
        const flareGroup = new THREE.Group();

        // 3D burning stick
        const cyl = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8),
            new THREE.MeshStandardMaterial({ color: 0xee2222, roughness: 0.5 })
        );
        flareGroup.add(cyl);

        // Core flame & red point light
        const light = new THREE.PointLight(0xff2200, 3.5, 20.0);
        light.position.y = 0.18;
        flareGroup.add(light);

        flareGroup.position.copy(this.position).add(new THREE.Vector3(0, 1.2, 0));
        this.scene.add(flareGroup);

        this.activeFlares.push({
            mesh: flareGroup,
            velocity: dir.multiplyScalar(15.0),
            lifeTime: 8.0,
            lureRadius: 24.0
        });
    }

    /**
     * Updates physics, third-person camera, animations, and noise decay
     */
    update(dt, input, level, audioManager) {
        // Invulnerability decay
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
            this.mesh.visible = (Math.floor(performance.now() / 80) % 2 === 0);
        } else {
            this.mesh.visible = true;
        }

        // Camera rotation from mouse delta
        this.cameraYaw -= input.mouseDeltaX * 0.0024;
        this.cameraPitch -= input.mouseDeltaY * 0.0024;
        this.cameraPitch = Math.max(-0.6, Math.min(0.85, this.cameraPitch));

        // Fallback arrow keys for camera
        if (input.isKeyDown('ArrowLeft')) this.cameraYaw += 2.0 * dt;
        if (input.isKeyDown('ArrowRight')) this.cameraYaw -= 2.0 * dt;
        if (input.isKeyDown('ArrowUp')) this.cameraPitch = Math.min(0.85, this.cameraPitch + 1.8 * dt);
        if (input.isKeyDown('ArrowDown')) this.cameraPitch = Math.max(-0.6, this.cameraPitch - 1.8 * dt);

        // Movement relative to camera orientation
        let moveX = 0;
        let moveZ = 0;
        if (input.isKeyDown('KeyW')) moveZ += 1;
        if (input.isKeyDown('KeyS')) moveZ -= 1;
        if (input.isKeyDown('KeyA')) moveX -= 1;
        if (input.isKeyDown('KeyD')) moveX += 1;

        const isMoving = (moveX !== 0 || moveZ !== 0);

        // Sprinting logic
        const wantsToRun = input.isKeyDown('ShiftLeft') || input.isKeyDown('ShiftRight');
        if (wantsToRun && isMoving && this.stamina > 5) {
            this.isRunning = true;
            this.stamina = Math.max(0, this.stamina - this.staminaDrain * dt);
        } else {
            this.isRunning = false;
            if (!wantsToRun) {
                this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRecover * dt);
            }
        }

        this.currentSpeed = this.isRunning ? this.runSpeed : this.walkSpeed;

        if (isMoving) {
            // Camera planar forward & right
            const camForward = new THREE.Vector3(Math.sin(this.cameraYaw), 0, Math.cos(this.cameraYaw));
            const camRight = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));

            const moveDir = new THREE.Vector3()
                .addScaledVector(camForward, moveZ)
                .addScaledVector(camRight, moveX)
                .normalize();

            // Smooth character rotation toward move direction
            const targetRotY = Math.atan2(moveDir.x, moveDir.z);
            let diff = targetRotY - this.rotationY;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.rotationY += diff * Math.min(1.0, 12.0 * dt);

            // Step with collision check
            const stepX = moveDir.x * this.currentSpeed * dt;
            const stepZ = moveDir.z * this.currentSpeed * dt;

            if (!level.isWall(this.position.x + stepX, this.position.z, 0.4)) {
                this.position.x += stepX;
            }
            if (!level.isWall(this.position.x, this.position.z + stepZ, 0.4)) {
                this.position.z += stepZ;
            }

            // Footstep audio & noise
            this.footstepTimer -= dt;
            if (this.footstepTimer <= 0) {
                this.footstepTimer = this.isRunning ? 0.28 : 0.46;
                const surface = level.levelNumber === 2 ? 'tile' : (level.levelNumber === 3 ? 'gravel' : 'asphalt');
                if (audioManager) audioManager.playFootstep(surface, this.isRunning);
                this.noiseRadius = this.isRunning ? 16.0 : 4.0;
            }

            this.animTime += dt * (this.isRunning ? 18.0 : 10.0);
        } else {
            this.footstepTimer = 0.1;
            this.animTime += dt * 2.0; // gentle breathing
        }

        // Jump / Vault (Spacebar)
        if (input.wasKeyPressed('Space') && this.isGrounded) {
            this.jumpVelocityY = 5.2;
            this.isGrounded = false;
        }

        // Gravity
        if (!this.isGrounded) {
            this.position.y += this.jumpVelocityY * dt;
            this.jumpVelocityY -= 16.0 * dt;
            if (this.position.y <= 0) {
                this.position.y = 0;
                this.isGrounded = true;
                this.jumpVelocityY = 0;
            }
        }

        // Apply mesh transform
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotationY;

        // Animate humanoid limbs
        this.updateHumanoidAnimations(isMoving, dt);

        // Update Third-Person Camera with smooth spring-arm and wall-avoidance
        this.updateThirdPersonCamera(level, dt);

        // Update active flares
        for (let i = this.activeFlares.length - 1; i >= 0; i--) {
            const f = this.activeFlares[i];
            f.lifeTime -= dt;
            f.velocity.y -= 14.0 * dt; // gravity
            f.mesh.position.addScaledVector(f.velocity, dt);

            if (f.mesh.position.y <= 0.15) {
                f.mesh.position.y = 0.15;
                f.velocity.y = -f.velocity.y * 0.3;
                f.velocity.x *= 0.7;
                f.velocity.z *= 0.7;
            }

            if (f.lifeTime <= 0) {
                this.scene.remove(f.mesh);
                this.activeFlares.splice(i, 1);
            }
        }

        // Decay noise radius
        this.noiseRadius = Math.max(0, this.noiseRadius - 12.0 * dt);
    }

    /**
     * Natural humanoid walk/run/swing animations
     */
    updateHumanoidAnimations(isMoving, dt) {
        if (isMoving) {
            const stride = Math.sin(this.animTime);
            // Counter-swinging legs
            this.leftLeg.rotation.x = stride * (this.isRunning ? 0.8 : 0.5);
            this.rightLeg.rotation.x = -stride * (this.isRunning ? 0.8 : 0.5);

            // Arm pump
            this.leftArm.rotation.x = -stride * (this.isRunning ? 0.7 : 0.4);
            if (this.swingTimer <= 0) {
                this.rightArm.rotation.x = stride * (this.isRunning ? 0.7 : 0.4);
            }

            // Torso slight forward lean when sprinting
            this.torso.rotation.x = this.isRunning ? 0.2 : 0.05;
        } else {
            // Idle breathing
            const breath = Math.sin(this.animTime) * 0.04;
            this.torso.position.y = 0.36 + breath;
            this.leftLeg.rotation.x = 0;
            this.rightLeg.rotation.x = 0;
            this.leftArm.rotation.x = 0;
            this.torso.rotation.x = 0;
        }

        // Weapon swing animation
        if (this.swingTimer > 0) {
            this.swingTimer -= dt;
            const progress = (0.35 - this.swingTimer) / 0.35;
            this.rightArm.rotation.x = -0.6 + Math.sin(progress * Math.PI) * 1.8;
            this.rightArm.rotation.z = Math.sin(progress * Math.PI) * 0.8;
        } else {
            this.rightArm.rotation.z = 0;
        }

        // Pistol recoil animation
        if (this.recoilTimer > 0) {
            this.recoilTimer -= dt;
            this.rightArm.rotation.x = -1.2 + Math.sin(this.recoilTimer * 20) * 0.3;
        }
    }

    /**
     * Over-the-shoulder third-person camera with wall collision raycasting
     */
    updateThirdPersonCamera(level, dt) {
        // Player focus point (head / shoulder height)
        const focusPoint = this.position.clone().add(new THREE.Vector3(0, this.cameraHeight, 0));

        // Desired camera position in spherical coordinates relative to player
        const cosPitch = Math.cos(this.cameraPitch);
        const sinPitch = Math.sin(this.cameraPitch);
        const sinYaw = Math.sin(this.cameraYaw);
        const cosYaw = Math.cos(this.cameraYaw);

        // Over-the-shoulder right offset
        const sideVector = new THREE.Vector3(cosYaw, 0, -sinYaw).multiplyScalar(this.cameraSideOffset);

        const camDir = new THREE.Vector3(
            -sinYaw * cosPitch,
            sinPitch,
            -cosYaw * cosPitch
        ).normalize();

        const desiredCamPos = focusPoint.clone()
            .add(sideVector)
            .addScaledVector(camDir, this.cameraTargetDistance);

        // Raycast / line check between focusPoint and desiredCamPos to prevent wall clipping
        let actualDist = this.cameraTargetDistance;
        const testSteps = 12;
        for (let i = 1; i <= testSteps; i++) {
            const frac = i / testSteps;
            const testPos = focusPoint.clone().lerp(desiredCamPos, frac);
            if (level.isWall(testPos.x, testPos.z, 0.25)) {
                actualDist = Math.max(1.0, this.cameraTargetDistance * (frac - 0.1));
                break;
            }
        }

        this.cameraDistance += (actualDist - this.cameraDistance) * 10.0 * dt;

        const finalCamPos = focusPoint.clone()
            .add(sideVector)
            .addScaledVector(camDir, this.cameraDistance);

        this.camera.position.lerp(finalCamPos, 14.0 * dt);
        this.camera.lookAt(focusPoint.clone().add(sideVector.multiplyScalar(0.5)));
    }
}
