/**
 * LAST LIGHT: Escape the Infected City
 * zombie.js - Humanoid Zombie AI, Types & Horde Pressure Spawning
 * 
 * Features realistic humanoid zombie models with torn clothes, uneven walking animations
 * (shamble, limp, lunge), vision cone + hearing perception, FSM states (Patrol, Investigate,
 * Chase, Attack, Stunned, Dead), and dynamic time-based horde spawning.
 */

import * as THREE from './three.module.js';

export const ZombieType = {
    WALKER: 'walker',
    RUNNER: 'runner',
    BRUTE: 'brute',
    BOSS: 'boss'
};

export const ZombieState = {
    PATROL: 'PATROL',
    INVESTIGATE: 'INVESTIGATE',
    CHASE: 'CHASE',
    ATTACK: 'ATTACK',
    STUNNED: 'STUNNED',
    DEAD: 'DEAD'
};

export class Zombie {
    constructor(scene, x, z, type = ZombieType.WALKER, waypoints = []) {
        this.scene = scene;
        this.type = type;
        this.position = new THREE.Vector3(x, 0, z);
        this.spawnX = x;
        this.spawnZ = z;
        this.waypoints = waypoints.length > 0 ? waypoints : [{ x, z }];
        this.currentWaypointIdx = 0;
        this.state = ZombieState.PATROL;

        this.rotationY = Math.random() * Math.PI * 2;
        this.animTime = Math.random() * 10;
        this.isAlive = true;
        this.corpseTimer = 12.0;

        // Knockback velocity
        this.vx = 0;
        this.vz = 0;

        // Type specs
        if (type === ZombieType.RUNNER) {
            this.speed = 7.6;
            this.maxHealth = 65;
            this.damage = 18;
            this.sightRange = 26.0;
            this.sightAngle = Math.PI * 0.7; // 126 deg
            this.hearingRange = 30.0;
            this.attackDist = 1.7;
            this.skinColor = 0x8b8579;
            this.clothColor = 0x3d2b27;
            this.scale = 0.95;
        } else if (type === ZombieType.BRUTE) {
            this.speed = 3.6;
            this.maxHealth = 220;
            this.damage = 35;
            this.sightRange = 24.0;
            this.sightAngle = Math.PI * 0.6;
            this.hearingRange = 28.0;
            this.attackDist = 2.4;
            this.skinColor = 0x4d5345;
            this.clothColor = 0x1f2429;
            this.scale = 1.5;
        } else if (type === ZombieType.BOSS) {
            this.speed = 4.4;
            this.maxHealth = 550;
            this.damage = 45;
            this.sightRange = 36.0;
            this.sightAngle = Math.PI * 2.0; // omni-directional
            this.hearingRange = 40.0;
            this.attackDist = 3.0;
            this.skinColor = 0x5a1827;
            this.clothColor = 0x181214;
            this.scale = 2.4;
            this.chargeTimer = 5.0;
            this.isCharging = false;
        } else {
            // Standard Walker
            this.speed = 2.8;
            this.maxHealth = 85;
            this.damage = 22;
            this.sightRange = 20.0;
            this.sightAngle = Math.PI * 0.55;
            this.hearingRange = 22.0;
            this.attackDist = 1.7;
            this.skinColor = 0x4f6350;
            this.clothColor = 0x222d36;
            this.scale = 1.0;
        }

        this.health = this.maxHealth;
        this.lastAttackTime = 0;
        this.stunTimer = 0;
        this.growlTimer = 3.0 + Math.random() * 5.0;
        this.targetPos = new THREE.Vector3(x, 0, z);
        this.loseTargetTimer = 0;

        // Build Humanoid Mesh
        this.mesh = this.buildHumanoidZombieMesh();
        this.mesh.position.copy(this.position);
        this.mesh.scale.set(this.scale, this.scale, this.scale);
        this.scene.add(this.mesh);
    }

    /**
     * Builds realistic humanoid zombie with torn clothes & rotting skin
     */
    buildHumanoidZombieMesh() {
        const root = new THREE.Group();

        // PBR Rotting Materials
        const skinMat = new THREE.MeshStandardMaterial({ color: this.skinColor, roughness: 0.85 });
        const clothMat = new THREE.MeshStandardMaterial({ color: this.clothColor, roughness: 0.95 });
        const pantsMat = new THREE.MeshStandardMaterial({ color: 0x191d21, roughness: 0.9 });
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1100 });
        const bloodMat = new THREE.MeshStandardMaterial({ color: 0x7a0c0c, roughness: 0.4 });

        // Pelvis & torn pants
        const pelvisGeom = new THREE.BoxGeometry(0.42, 0.22, 0.26);
        this.pelvis = new THREE.Mesh(pelvisGeom, pantsMat);
        this.pelvis.position.y = 0.92;
        root.add(this.pelvis);

        // Torso with torn clothing & blood stains
        const torsoGeom = new THREE.BoxGeometry(0.46, 0.52, 0.28);
        this.torso = new THREE.Mesh(torsoGeom, clothMat);
        this.torso.position.y = 0.36;
        this.pelvis.add(this.torso);

        // Exposed rotting chest/ribs wound
        const woundGeom = new THREE.BoxGeometry(0.24, 0.2, 0.04);
        const wound = new THREE.Mesh(woundGeom, bloodMat);
        wound.position.set(0.06, 0.08, 0.14);
        this.torso.add(wound);

        // Asymmetrical Head tilted forward
        const neckGeom = new THREE.CylinderGeometry(0.09, 0.1, 0.12, 8);
        const neck = new THREE.Mesh(neckGeom, skinMat);
        neck.position.set(0, 0.3, 0.04);
        neck.rotation.x = 0.15;
        this.torso.add(neck);

        const headGeom = new THREE.BoxGeometry(0.32, 0.36, 0.34);
        this.head = new THREE.Mesh(headGeom, skinMat);
        this.head.position.y = 0.16;
        this.head.rotation.z = -0.12; // tilted eerie zombie neck
        neck.add(this.head);

        // Glowing red sunken eyes
        const eyeGeom = new THREE.BoxGeometry(0.05, 0.04, 0.03);
        const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
        leftEye.position.set(-0.08, 0.04, 0.17);
        this.head.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
        rightEye.position.set(0.08, 0.04, 0.17);
        this.head.add(rightEye);

        // Limbs (Asymmetrical shambling posture)
        const armGeom = new THREE.BoxGeometry(0.14, 0.65, 0.14);

        // Left Arm (Torn sleeve)
        this.leftArm = new THREE.Group();
        this.leftArm.position.set(-0.31, 0.2, 0);
        const lArmMesh = new THREE.Mesh(armGeom, skinMat);
        lArmMesh.position.y = -0.28;
        this.leftArm.add(lArmMesh);
        this.torso.add(this.leftArm);

        // Right Arm (Reaching forward claw)
        this.rightArm = new THREE.Group();
        this.rightArm.position.set(0.31, 0.2, 0);
        const rArmMesh = new THREE.Mesh(armGeom, skinMat);
        rArmMesh.position.y = -0.28;
        this.rightArm.add(rArmMesh);
        this.torso.add(this.rightArm);

        // Legs
        const legGeom = new THREE.BoxGeometry(0.16, 0.78, 0.16);

        this.leftLeg = new THREE.Group();
        this.leftLeg.position.set(-0.14, -0.1, 0);
        const lLegMesh = new THREE.Mesh(legGeom, pantsMat);
        lLegMesh.position.y = -0.38;
        this.leftLeg.add(lLegMesh);
        this.pelvis.add(this.leftLeg);

        this.rightLeg = new THREE.Group();
        this.rightLeg.position.set(0.14, -0.1, 0);
        const rLegMesh = new THREE.Mesh(legGeom, pantsMat);
        rLegMesh.position.y = -0.38;
        this.rightLeg.add(rLegMesh);
        this.pelvis.add(this.rightLeg);

        return root;
    }

    takeDamage(amount, fromPos, audioManager, particleSystem) {
        if (!this.isAlive) return;

        this.health -= amount;

        // Knockback away from damage
        const dir = new THREE.Vector3().subVectors(this.position, fromPos);
        dir.y = 0;
        dir.normalize();
        const force = (this.type === ZombieType.BOSS ? 2.5 : 7.0);
        this.vx += dir.x * force;
        this.vz += dir.z * force;

        // Stagger / Stun
        this.state = ZombieState.STUNNED;
        this.stunTimer = (this.type === ZombieType.BOSS ? 0.15 : 0.4);

        // Target damage location immediately
        this.targetPos.copy(fromPos);
        this.loseTargetTimer = 6.0;

        if (audioManager) {
            audioManager.playZombieGrowl(this.position.distanceTo(fromPos), this.type === ZombieType.BOSS);
        }

        if (particleSystem) {
            particleSystem.spawnBlood(this.position.x, this.position.y + 1.2, this.position.z, this.type === ZombieType.BOSS ? 28 : 16);
        }

        if (this.health <= 0) {
            this.handleDeath();
        }
    }

    handleDeath() {
        this.isAlive = false;
        this.state = ZombieState.DEAD;

        // Realistic collapse: tip backward onto ground
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 0.2;

        if (window.game) {
            window.game.recordZombieKilled(this.type);
        }
    }

    update(dt, player, flares, level, audioManager) {
        if (!this.isAlive) {
            this.corpseTimer -= dt;
            if (this.corpseTimer <= 0 && this.mesh.parent) {
                this.scene.remove(this.mesh);
            }
            return;
        }

        // Apply knockback damping
        this.position.x += this.vx * dt;
        this.position.z += this.vz * dt;
        this.vx *= Math.pow(0.04, dt);
        this.vz *= Math.pow(0.04, dt);

        // Wall pushback
        if (level.isWall(this.position.x, this.position.z, 0.4 * this.scale)) {
            this.vx = -this.vx * 0.5;
            this.vz = -this.vz * 0.5;
        }

        // Periodic distance growls
        this.growlTimer -= dt;
        if (this.growlTimer <= 0) {
            this.growlTimer = 4.0 + Math.random() * 5.0;
            const distP = this.position.distanceTo(player.position);
            if (distP < 28.0 && audioManager) {
                audioManager.playZombieGrowl(distP, this.type === ZombieType.BOSS);
            }
        }

        // Check burning flare lures
        let activeLure = null;
        let closestLureDist = Infinity;
        for (const f of flares) {
            const distF = this.position.distanceTo(f.mesh.position);
            if (distF <= f.lureRadius && distF < closestLureDist) {
                closestLureDist = distF;
                activeLure = f;
            }
        }

        // Sensory perception against player
        const distToPlayer = this.position.distanceTo(player.position);
        const toPlayer = new THREE.Vector3().subVectors(player.position, this.position);
        toPlayer.y = 0;
        toPlayer.normalize();

        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);
        const inVisionCone = (forward.dot(toPlayer) >= Math.cos(this.sightAngle / 2)) && (distToPlayer <= this.sightRange);
        const playerHeard = (distToPlayer <= this.hearingRange) && (player.noiseRadius >= distToPlayer * 0.7);
        const canSee = inVisionCone && level.hasLineOfSight(this.position, player.position);

        // Priority 1: Burning Flare Lure
        if (activeLure && distToPlayer > 3.0) {
            this.state = ZombieState.INVESTIGATE;
            this.targetPos.copy(activeLure.mesh.position);
            this.loseTargetTimer = 3.0;
        }
        // Priority 2: Direct line of sight
        else if (canSee) {
            this.state = ZombieState.CHASE;
            this.targetPos.copy(player.position);
            this.loseTargetTimer = 4.5;
        }
        // Priority 3: Noise heard
        else if (playerHeard && this.state !== ZombieState.CHASE) {
            this.state = ZombieState.INVESTIGATE;
            this.targetPos.copy(player.position);
            this.loseTargetTimer = 4.0;
        }

        // Boss rage charge sprint mechanic
        if (this.type === ZombieType.BOSS && this.state === ZombieState.CHASE) {
            this.chargeTimer -= dt;
            if (this.chargeTimer <= 0) {
                this.isCharging = true;
                if (this.chargeTimer <= -2.0) {
                    this.chargeTimer = 6.0;
                    this.isCharging = false;
                }
            } else {
                this.isCharging = false;
            }
        }

        // Execute FSM
        this.executeState(dt, player, level, audioManager);

        // Synchronize 3D mesh
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotationY;

        // Animate humanoid limbs
        this.updateLimbAnimations(dt);
    }

    executeState(dt, player, level, audioManager) {
        const now = performance.now() / 1000;
        const currentSpeed = (this.isCharging ? 9.5 : this.speed);

        if (this.state === ZombieState.STUNNED) {
            this.stunTimer -= dt;
            if (this.stunTimer <= 0) {
                this.state = ZombieState.CHASE;
            }
            return;
        }

        switch (this.state) {
            case ZombieState.PATROL: {
                const wp = this.waypoints[this.currentWaypointIdx];
                const wpVec = new THREE.Vector3(wp.x, 0, wp.z);
                const dist = this.position.distanceTo(wpVec);

                if (dist < 1.6) {
                    this.currentWaypointIdx = (this.currentWaypointIdx + 1) % this.waypoints.length;
                } else {
                    this.moveTowards(wpVec, currentSpeed * 0.55, dt, level);
                }
                break;
            }

            case ZombieState.INVESTIGATE: {
                const dist = this.position.distanceTo(this.targetPos);
                if (dist < 2.0) {
                    this.loseTargetTimer -= dt;
                    if (this.loseTargetTimer <= 0) {
                        this.state = ZombieState.PATROL;
                    }
                } else {
                    this.moveTowards(this.targetPos, currentSpeed * 0.8, dt, level);
                }
                break;
            }

            case ZombieState.CHASE: {
                const distToPlayer = this.position.distanceTo(player.position);

                if (distToPlayer <= this.attackDist) {
                    this.state = ZombieState.ATTACK;
                } else {
                    this.moveTowards(this.targetPos, currentSpeed, dt, level);

                    if (!level.hasLineOfSight(this.position, player.position)) {
                        this.loseTargetTimer -= dt;
                        if (this.loseTargetTimer <= 0) {
                            this.state = ZombieState.PATROL;
                        }
                    }
                }
                break;
            }

            case ZombieState.ATTACK: {
                const dist = this.position.distanceTo(player.position);

                if (now - this.lastAttackTime >= 0.75) {
                    this.lastAttackTime = now;
                    player.takeDamage(this.damage, audioManager);
                }

                if (dist > this.attackDist + 0.9) {
                    this.state = ZombieState.CHASE;
                    this.targetPos.copy(player.position);
                }
                break;
            }
        }
    }

    moveTowards(target, moveSpeed, dt, level) {
        const toTarget = new THREE.Vector3().subVectors(target, this.position);
        toTarget.y = 0;
        const dist = toTarget.length();
        if (dist < 0.1) return;

        toTarget.normalize();

        // Smooth yaw rotation
        const targetAngle = Math.atan2(toTarget.x, toTarget.z);
        let diff = targetAngle - this.rotationY;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.rotationY += diff * Math.min(1.0, 7.5 * dt);

        // Translation with collision check
        const stepX = toTarget.x * moveSpeed * dt;
        const stepZ = toTarget.z * moveSpeed * dt;

        if (!level.isWall(this.position.x + stepX, this.position.z, 0.42 * this.scale)) {
            this.position.x += stepX;
        }
        if (!level.isWall(this.position.x, this.position.z + stepZ, 0.42 * this.scale)) {
            this.position.z += stepZ;
        }

        this.animTime += dt * moveSpeed * 1.5;
    }

    /**
     * Natural uneven zombie shambling/limping animation
     */
    updateLimbAnimations(dt) {
        if (!this.isAlive) return;

        const cycle = this.animTime;

        if (this.type === ZombieType.RUNNER) {
            // Aggressive hunched sprint
            this.torso.rotation.x = 0.35;
            this.leftLeg.rotation.x = Math.sin(cycle) * 0.8;
            this.rightLeg.rotation.x = -Math.sin(cycle) * 0.8;
            this.leftArm.rotation.x = -1.2 + Math.sin(cycle) * 0.3;
            this.rightArm.rotation.x = -1.2 - Math.sin(cycle) * 0.3;
        } else {
            // Shambling limp (one leg drags slightly)
            const leftLimp = Math.sin(cycle) * 0.55;
            const rightLimp = -Math.sin(cycle * 0.85) * 0.4;
            this.leftLeg.rotation.x = leftLimp;
            this.rightLeg.rotation.x = rightLimp;

            // Arms reach out in front
            const armReach = (this.state === ZombieState.CHASE || this.state === ZombieState.ATTACK) ? -1.3 : -0.75;
            this.leftArm.rotation.x = armReach + Math.sin(cycle * 0.5) * 0.15;
            this.rightArm.rotation.x = armReach - Math.sin(cycle * 0.5) * 0.15;

            // Head bob / tilt
            this.head.rotation.x = Math.sin(cycle) * 0.1;
        }
    }
}

/**
 * Manages all zombies and time-based horde spawning
 */
export class ZombieManager {
    constructor(scene) {
        this.scene = scene;
        this.zombies = [];
        this.hordeSpawnTimer = 25.0; // Spawns new zombie reinforcements every 25s
    }

    loadZombies(spawns) {
        this.clear();
        this.zombies = spawns.map(s => new Zombie(this.scene, s.x, s.z, s.type, s.waypoints));
    }

    clear() {
        this.zombies.forEach(z => {
            if (z.mesh && z.mesh.parent) this.scene.remove(z.mesh);
        });
        this.zombies = [];
    }

    getChasingCount() {
        return this.zombies.filter(z => z.isAlive && (z.state === ZombieState.CHASE || z.state === ZombieState.ATTACK)).length;
    }

    update(dt, player, flares, level, audioManager) {
        // Update all zombies
        this.zombies.forEach(z => z.update(dt, player, flares, level, audioManager));

        // Rising pressure: Dynamic horde spawning as time passes
        this.hordeSpawnTimer -= dt;
        if (this.hordeSpawnTimer <= 0) {
            this.hordeSpawnTimer = 22.0;
            this.spawnReinforcementZombie(level, player);
        }
    }

    spawnReinforcementZombie(level, player) {
        if (this.zombies.length >= 24) return; // Cap for performance

        // Spawn at safe distance (25-35m away from player)
        const angle = Math.random() * Math.PI * 2;
        const dist = 26.0 + Math.random() * 8.0;
        const spawnX = player.position.x + Math.cos(angle) * dist;
        const spawnZ = player.position.z + Math.sin(angle) * dist;

        if (!level.isWall(spawnX, spawnZ, 0.5)) {
            const type = (level.levelNumber === 2 && Math.random() < 0.6) ? ZombieType.RUNNER : ZombieType.WALKER;
            const newZombie = new Zombie(this.scene, spawnX, spawnZ, type, [{ x: spawnX, z: spawnZ }, { x: player.position.x, z: player.position.z }]);
            this.zombies.push(newZombie);
        }
    }
}
