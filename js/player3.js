/**
 * LAST LIGHT: Escape the Infected City - 3D Edition
 * player3d.js - 3D First-Person Controller, Flashlight & Attributes
 * 
 * Manages 3D first-person camera movement, mouse-look / pointer-lock,
 * walking vs sprinting noise generation, 3D flashlight beam, stamina, health, and 3 lives.
 */

class Player3D {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;

        this.position = new THREE.Vector3(0, 1.7, 0); // eye height = 1.7m
        this.camera.position.copy(this.position);

        this.yaw = 0;   // horizontal rotation
        this.pitch = 0; // vertical rotation

        // Movement speeds
        this.walkSpeed = 5.2;
        this.runSpeed = 9.2;
        this.currentSpeed = this.walkSpeed;
        this.isRunning = false;

        // Stamina
        this.stamina = 100;
        this.maxStamina = 100;
        this.staminaDrain = 26;
        this.staminaRecover = 20;

        // Health & Lives
        this.maxHealth = 100;
        this.health = 100;
        this.lives = 3;
        this.maxLives = 3;
        this.invulnerableTimer = 0;

        // Speed boost power-up
        this.speedBoostTimer = 0;

        // Noise radius (for zombie hearing)
        this.noiseRadius = 0;
        this.footstepTimer = 0;

        // Flashlight (3D SpotLight attached to camera)
        this.flashlightOn = true;
        this.battery = 100;
        this.maxBattery = 100;
        this.batteryDrainRate = 1.2;

        this.flashlight = new THREE.SpotLight(0xfff5e6, 3.2, 38.0, Math.PI * 0.28, 0.45);
        this.flashlight.position.set(0, 0, 0);
        this.camera.add(this.flashlight);

        this.flashlightTarget = new THREE.Object3D();
        this.flashlightTarget.position.set(0, 0, -5);
        this.camera.add(this.flashlightTarget);
        this.flashlight.target = this.flashlightTarget;

        // Head bobbing
        this.headBobTimer = 0;
        this.baseEyeHeight = 1.7;

        // Inventory
        this.keys = 0;
        this.cluesFound = new Set();
        this.rescuedNPC = false;

        // 3D Weapon Arsenal
        this.weaponManager = new Weapon3DManager(this.camera, this.scene);
    }

    resetPosition(x, z) {
        this.position.set(x, this.baseEyeHeight, z);
        this.camera.position.copy(this.position);
        this.health = this.maxHealth;
        this.invulnerableTimer = 2.5;
        this.noiseRadius = 0;
    }

    addHealth(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        if (window.soundSystem) window.soundSystem.playPickup('medkit');
    }

    addLife() {
        if (this.lives < this.maxLives) {
            this.lives++;
            if (window.soundSystem) window.soundSystem.playPickup('life');
        }
    }

    addBattery(amount = 50) {
        this.battery = Math.min(this.maxBattery, this.battery + amount);
        if (window.soundSystem) window.soundSystem.playPickup('ammo');
    }

    applySpeedBoost(duration = 10) {
        this.speedBoostTimer = duration;
        if (window.soundSystem) window.soundSystem.playPickup('clock');
    }

    toggleFlashlight() {
        if (this.battery > 0) {
            this.flashlightOn = !this.flashlightOn;
            this.flashlight.intensity = this.flashlightOn ? 3.2 : 0;
            if (window.soundSystem) window.soundSystem.playBeep(this.flashlightOn);
        }
    }

    takeDamage(amount, fromPos) {
        if (this.invulnerableTimer > 0) return false;

        this.health -= amount;
        this.invulnerableTimer = 1.0;

        if (window.soundSystem) window.soundSystem.playPlayerHurt();
        if (window.game && window.game.ui) {
            window.game.ui.triggerDamageFlash();
        }

        if (this.health <= 0) {
            this.handleDeath();
            return true;
        }

        return false;
    }

    handleDeath() {
        this.lives--;
        if (this.lives > 0) {
            // Respawn at spawn point
            this.health = this.maxHealth;
            if (window.game && window.game.level) {
                this.resetPosition(window.game.level.playerSpawn.x, window.game.level.playerSpawn.z);
            }
            if (window.game && window.game.ui) {
                window.game.ui.showTouchToast(`YOU DIED! ${this.lives} LIVES REMAINING!`, '#ff4444');
            }
        } else {
            if (window.game) {
                window.game.triggerGameOver('Overwhelmed by infected swarm');
            }
        }
    }

    update(dt, input, level, zombies, particleSystem) {
        // Invulnerability
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
        }

        // Speed boost
        if (this.speedBoostTimer > 0) {
            this.speedBoostTimer -= dt;
        }

        // Flashlight battery
        if (this.flashlightOn && this.battery > 0) {
            this.battery -= this.batteryDrainRate * dt;
            if (this.battery <= 0) {
                this.battery = 0;
                this.flashlightOn = false;
                this.flashlight.intensity = 0;
            }
        }

        // Weapon switching (1, 2, 3 or Q)
        if (input.wasKeyPressed('1')) this.weaponManager.selectWeapon('bat');
        if (input.wasKeyPressed('2')) this.weaponManager.selectWeapon('pistol');
        if (input.wasKeyPressed('3')) this.weaponManager.selectWeapon('flare');
        if (input.wasKeyPressed('q') || input.wasKeyPressed('Q')) this.weaponManager.cycleWeapon();

        // Flashlight toggle (F)
        if (input.wasKeyPressed('f') || input.wasKeyPressed('F')) {
            this.toggleFlashlight();
        }

        // Mouse Look Rotation (Pointer Lock or fallback arrow keys)
        this.yaw -= input.mouseDeltaX * 0.0022;
        this.pitch -= input.mouseDeltaY * 0.0022;
        this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));

        // Keyboard look fallback (Arrow keys)
        if (input.isKeyDown('ArrowLeft')) this.yaw += 2.0 * dt;
        if (input.isKeyDown('ArrowRight')) this.yaw -= 2.0 * dt;
        if (input.isKeyDown('ArrowUp')) this.pitch = Math.min(Math.PI / 2.2, this.pitch + 1.8 * dt);
        if (input.isKeyDown('ArrowDown')) this.pitch = Math.max(-Math.PI / 2.2, this.pitch - 1.8 * dt);

        this.camera.rotation.set(0, 0, 0);
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;

        // Movement Direction
        let moveForward = 0;
        let moveRight = 0;

        if (input.isKeyDown('KeyW')) moveForward += 1;
        if (input.isKeyDown('KeyS')) moveForward -= 1;
        if (input.isKeyDown('KeyA')) moveRight -= 1;
        if (input.isKeyDown('KeyD')) moveRight += 1;

        const isMoving = (moveForward !== 0 || moveRight !== 0);

        // Sprinting
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

        let speed = this.isRunning ? this.runSpeed : this.walkSpeed;
        if (this.speedBoostTimer > 0) speed *= 1.35;
        this.currentSpeed = speed;

        if (isMoving) {
            // Forward and Right vectors on XZ plane
            const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
            const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

            const moveDir = new THREE.Vector3()
                .addScaledVector(forward, moveForward)
                .addScaledVector(right, moveRight)
                .normalize();

            const stepX = moveDir.x * speed * dt;
            const stepZ = moveDir.z * speed * dt;

            // X-axis wall collision
            if (!level.isWall(this.position.x + stepX, this.position.z, 0.45)) {
                this.position.x += stepX;
            }
            // Z-axis wall collision
            if (!level.isWall(this.position.x, this.position.z + stepZ, 0.45)) {
                this.position.z += stepZ;
            }

            // Head bobbing & footsteps
            this.headBobTimer += dt * (this.isRunning ? 16 : 10);
            this.camera.position.y = this.baseEyeHeight + Math.sin(this.headBobTimer) * (this.isRunning ? 0.08 : 0.04);

            this.footstepTimer -= dt;
            if (this.footstepTimer <= 0) {
                this.footstepTimer = this.isRunning ? 0.28 : 0.46;
                if (window.soundSystem) window.soundSystem.playFootstep(this.isRunning);
                this.noiseRadius = this.isRunning ? 22.0 : 6.0;
            }
        } else {
            this.camera.position.y = this.baseEyeHeight;
            this.footstepTimer = 0.1;
        }

        this.camera.position.x = this.position.x;
        this.camera.position.z = this.position.z;

        // Attack Handling (Left Click or Space)
        if (input.wasMouseButtonPressed(0) || input.wasKeyPressed('Space')) {
            const noise = this.weaponManager.attack(this, zombies, particleSystem);
            if (noise > 0) {
                this.noiseRadius = Math.max(this.noiseRadius, noise * 0.1);
            }
        }

        // Update Weapons & Projectiles
        this.weaponManager.update(dt, particleSystem);

        // Noise radius decay
        this.noiseRadius = Math.max(0, this.noiseRadius - 15.0 * dt);
    }
}

window.Player3D = Player3D;
