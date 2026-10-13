/**
 * LAST LIGHT: Escape the Infected City - 3D Edition
 * zombie3d.js - 3D Animated Zombie Meshes & FSM AI
 * 
 * Supports Walkers, fast Runners, and the hulking Boss Goliath.
 * Features 3D limb animation, line-of-sight checks, hearing sensitivity,
 * flare lure attraction, and ragdoll death fall.
 */

const ZombieType3D = {
    WALKER: 'walker',
    RUNNER: 'runner',
    BOSS: 'boss'
};

const ZombieState3D = {
    PATROL: 'PATROL',
    INVESTIGATE: 'INVESTIGATE',
    CHASE: 'CHASE',
    ATTACK: 'ATTACK',
    RETURN: 'RETURN'
};

class Zombie3D {
    constructor(scene, x, z, type = ZombieType3D.WALKER, waypoints = []) {
        this.scene = scene;
        this.type = type;
        this.waypoints = waypoints.length > 0 ? waypoints : [{ x, z }];
        this.currentWaypointIdx = 0;
        this.state = ZombieState3D.PATROL;

        this.isAlive = true;
        this.corpseTimer = 10.0;
        this.animTime = Math.random() * 10;
        this.growlTimer = 3.0 + Math.random() * 5.0;

        // Knockback velocity
        this.vx = 0;
        this.vz = 0;

        // Type specs
        if (type === ZombieType3D.RUNNER) {
            this.speed = 7.5;
            this.maxHealth = 60;
            this.damage = 18;
            this.sightRange = 26.0;
            this.hearingRange = 28.0;
            this.attackDist = 1.6;
            this.skinColor = 0xb5998f;
            this.shirtColor = 0x5b3a29;
            this.scale = 0.95;
        } else if (type === ZombieType3D.BOSS) {
            this.speed = 4.2;
            this.maxHealth = 500;
            this.damage = 40;
            this.sightRange = 32.0;
            this.hearingRange = 36.0;
            this.attackDist = 2.8;
            this.skinColor = 0x5d1e2e;
            this.shirtColor = 0x221319;
            this.scale = 2.1;
            this.chargeTimer = 5.0;
            this.isCharging = false;
        } else {
            // Walker
            this.speed = 3.0;
            this.maxHealth = 85;
            this.damage = 22;
            this.sightRange = 20.0;
            this.hearingRange = 22.0;
            this.attackDist = 1.7;
            this.skinColor = 0x486b4f;
            this.shirtColor = 0x2c3e50;
            this.scale = 1.0;
        }

        this.health = this.maxHealth;
        this.lastAttackTime = 0;
        this.targetPos = new THREE.Vector3(x, 0, z);
        this.loseTargetTimer = 0;

        this.mesh = this.buildZombieMesh();
        this.mesh.position.set(x, 0, z);
        this.mesh.scale.set(this.scale, this.scale, this.scale);
        this.mesh.userData.zombieInstance = this;
        this.scene.add(this.mesh);
    }

    buildZombieMesh() {
        const root = new THREE.Group();

        const skinMat = new THREE.MeshStandardMaterial({ color: this.skinColor, roughness: 0.8 });
        const shirtMat = new THREE.MeshStandardMaterial({ color: this.shirtColor, roughness: 0.9 });
        const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.9 });
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        // Torso
        const torsoGeom = new THREE.BoxGeometry(0.55, 0.75, 0.32);
        this.torsoMesh = new THREE.Mesh(torsoGeom, shirtMat);
        this.torsoMesh.position.y = 1.15;
        root.add(this.torsoMesh);

        // Head
        const headGeom = new THREE.BoxGeometry(0.35, 0.38, 0.35);
        this.headMesh = new THREE.Mesh(headGeom, skinMat);
        this.headMesh.position.set(0, 0.58, 0.05);
        this.torsoMesh.add(this.headMesh);

        // Glowing red eyes
        const eyeGeom = new THREE.BoxGeometry(0.06, 0.05, 0.04);
        const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
        leftEye.position.set(-0.09, 0.05, 0.18);
        this.headMesh.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
        rightEye.position.set(0.09, 0.05, 0.18);
        this.headMesh.add(rightEye);

        // Arms (Joints at shoulders)
        const armGeom = new THREE.BoxGeometry(0.18, 0.75, 0.18);

        this.leftArmGroup = new THREE.Group();
        this.leftArmGroup.position.set(-0.38, 0.28, 0);
        const lArm = new THREE.Mesh(armGeom, skinMat);
        lArm.position.y = -0.32;
        this.leftArmGroup.add(lArm);
        this.torsoMesh.add(this.leftArmGroup);

        this.rightArmGroup = new THREE.Group();
        this.rightArmGroup.position.set(0.38, 0.28, 0);
        const rArm = new THREE.Mesh(armGeom, skinMat);
        rArm.position.y = -0.32;
        this.rightArmGroup.add(rArm);
        this.torsoMesh.add(this.rightArmGroup);

        // Legs
        const legGeom = new THREE.BoxGeometry(0.22, 0.8, 0.22);

        this.leftLegGroup = new THREE.Group();
        this.leftLegGroup.position.set(-0.16, 0.78, 0);
        const lLeg = new THREE.Mesh(legGeom, pantsMat);
        lLeg.position.y = -0.4;
        this.leftLegGroup.add(lLeg);
        root.add(this.leftLegGroup);

        this.rightLegGroup = new THREE.Group();
        this.rightLegGroup.position.set(0.16, 0.78, 0);
        const rLeg = new THREE.Mesh(legGeom, pantsMat);
        rLeg.position.y = -0.4;
        this.rightLegGroup.add(rLeg);
        root.add(this.rightLegGroup);

        return root;
    }

    takeDamage(amount, fromPos) {
        if (!this.isAlive) return;

        this.health -= amount;

        // Knockback away from attacker
        const dir = new THREE.Vector3().subVectors(this.mesh.position, fromPos);
        dir.y = 0;
        dir.normalize();
        this.vx += dir.x * (this.type === ZombieType3D.BOSS ? 2.5 : 6.0);
        this.vz += dir.z * (this.type === ZombieType3D.BOSS ? 2.5 : 6.0);

        // Immediately enter chase
        this.state = ZombieState3D.CHASE;
        this.targetPos.copy(fromPos);
        this.loseTargetTimer = 6.0;

        if (window.soundSystem) {
            window.soundSystem.playZombieGrowl(this.type === ZombieType3D.BOSS);
        }

        if (this.health <= 0) {
            this.handleDeath();
        }
    }

    handleDeath() {
        this.isAlive = false;

        // Death fall animation: tilt backwards onto ground
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 0.2;

        if (window.game) {
            window.game.recordZombieKilled(this.type);
        }
    }

    update(dt, player, flares, level) {
        if (!this.isAlive) {
            this.corpseTimer -= dt;
            if (this.corpseTimer <= 0 && this.mesh.parent) {
                this.scene.remove(this.mesh);
            }
            return;
        }

        // Apply knockback damping
        this.mesh.position.x += this.vx * dt;
        this.mesh.position.z += this.vz * dt;
        this.vx *= Math.pow(0.05, dt);
        this.vz *= Math.pow(0.05, dt);

        // Periodic growls
        this.growlTimer -= dt;
        if (this.growlTimer <= 0) {
            this.growlTimer = 4.0 + Math.random() * 5.0;
            const distP = this.mesh.position.distanceTo(player.position);
            if (distP < 24.0 && window.soundSystem) {
                window.soundSystem.playZombieGrowl(this.type === ZombieType3D.BOSS);
            }
        }

        // Check burning flare lures
        let activeLure = null;
        let closestLureDist = Infinity;
        for (const f of flares) {
            if (f.active) {
                const distF = this.mesh.position.distanceTo(f.mesh.position);
                if (distF <= f.lureRadius && distF < closestLureDist) {
                    closestLureDist = distF;
                    activeLure = f;
                }
            }
        }

        // Sensory perception against player
        const distToPlayer = this.mesh.position.distanceTo(player.position);
        const playerHeard = (distToPlayer <= this.hearingRange) && (player.noiseRadius >= distToPlayer * 10);
        const canSee = distToPlayer <= this.sightRange && level.hasLineOfSight(this.mesh.position, player.position);

        // Priority 1: Attracted to burning flare
        if (activeLure && distToPlayer > 3.0) {
            this.state = ZombieState3D.INVESTIGATE;
            this.targetPos.copy(activeLure.mesh.position);
            this.loseTargetTimer = 3.0;
        }
        // Priority 2: Direct Sight
        else if (canSee) {
            this.state = ZombieState3D.CHASE;
            this.targetPos.copy(player.position);
            this.loseTargetTimer = 4.0;
        }
        // Priority 3: Noise heard
        else if (playerHeard && this.state !== ZombieState3D.CHASE) {
            this.state = ZombieState3D.INVESTIGATE;
            this.targetPos.copy(player.position);
            this.loseTargetTimer = 4.0;
        }

        // Boss rage charge sprint mechanic
        if (this.type === ZombieType3D.BOSS && this.state === ZombieState3D.CHASE) {
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
        this.executeState(dt, player, level);

        // Update 3D limb animations
        this.updateAnimations(dt);
    }

    executeState(dt, player, level) {
        const now = performance.now() / 1000;
        const currentSpeed = (this.isCharging ? 9.5 : this.speed);

        switch (this.state) {
            case ZombieState3D.PATROL: {
                const wp = this.waypoints[this.currentWaypointIdx];
                const wpVec = new THREE.Vector3(wp.x, 0, wp.z);
                const dist = this.mesh.position.distanceTo(wpVec);

                if (dist < 1.5) {
                    this.currentWaypointIdx = (this.currentWaypointIdx + 1) % this.waypoints.length;
                } else {
                    this.moveTowards(wpVec, currentSpeed * 0.55, dt, level);
                }
                break;
            }

            case ZombieState3D.INVESTIGATE: {
                const dist = this.mesh.position.distanceTo(this.targetPos);
                if (dist < 2.0) {
                    this.loseTargetTimer -= dt;
                    if (this.loseTargetTimer <= 0) {
                        this.state = ZombieState3D.RETURN;
                    }
                } else {
                    this.moveTowards(this.targetPos, currentSpeed * 0.8, dt, level);
                }
                break;
            }

            case ZombieState3D.CHASE: {
                const distToPlayer = this.mesh.position.distanceTo(player.position);

                if (distToPlayer <= this.attackDist) {
                    this.state = ZombieState3D.ATTACK;
                } else {
                    this.moveTowards(this.targetPos, currentSpeed, dt, level);

                    if (!level.hasLineOfSight(this.mesh.position, player.position)) {
                        this.loseTargetTimer -= dt;
                        if (this.loseTargetTimer <= 0) {
                            this.state = ZombieState3D.RETURN;
                        }
                    }
                }
                break;
            }

            case ZombieState3D.ATTACK: {
                const dist = this.mesh.position.distanceTo(player.position);

                // Strike player
                if (now - this.lastAttackTime >= 0.7) {
                    this.lastAttackTime = now;
                    player.takeDamage(this.damage, this.mesh.position);
                }

                if (dist > this.attackDist + 0.8) {
                    this.state = ZombieState3D.CHASE;
                    this.targetPos.copy(player.position);
                }
                break;
            }

            case ZombieState3D.RETURN: {
                const home = this.waypoints[0] || { x: this.mesh.position.x, z: this.mesh.position.z };
                const homeVec = new THREE.Vector3(home.x, 0, home.z);
                const dist = this.mesh.position.distanceTo(homeVec);

                if (dist < 2.0) {
                    this.state = ZombieState3D.PATROL;
                    this.currentWaypointIdx = 0;
                } else {
                    this.moveTowards(homeVec, currentSpeed * 0.55, dt, level);
                }
                break;
            }
        }
    }

    moveTowards(target, moveSpeed, dt, level) {
        const toTarget = new THREE.Vector3().subVectors(target, this.mesh.position);
        toTarget.y = 0;
        const dist = toTarget.length();
        if (dist < 0.1) return;

        toTarget.normalize();

        // Smooth rotation to face target
        const targetAngle = Math.atan2(toTarget.x, toTarget.z);
        this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetAngle, 8 * dt);

        // Collision-checked translation
        const stepX = toTarget.x * moveSpeed * dt;
        const stepZ = toTarget.z * moveSpeed * dt;

        if (!level.isWall(this.mesh.position.x + stepX, this.mesh.position.z, 0.45 * this.scale)) {
            this.mesh.position.x += stepX;
        }
        if (!level.isWall(this.mesh.position.x, this.mesh.position.z + stepZ, 0.45 * this.scale)) {
            this.mesh.position.z += stepZ;
        }

        this.animTime += dt * moveSpeed * 1.5;
    }

    updateAnimations(dt) {
        if (!this.isAlive) return;

        // Limb swing
        const swing = Math.sin(this.animTime);
        this.leftLegGroup.rotation.x = swing * 0.6;
        this.rightLegGroup.rotation.x = -swing * 0.6;

        // Arms reach forward menacingly
        const armReach = (this.state === ZombieState3D.CHASE || this.state === ZombieState3D.ATTACK) ? -1.3 : -0.7;
        this.leftArmGroup.rotation.x = armReach + swing * 0.2;
        this.rightArmGroup.rotation.x = armReach - swing * 0.2;

        // Head twitch for runners
        if (this.type === ZombieType3D.RUNNER) {
            this.headMesh.rotation.y = Math.sin(this.animTime * 3) * 0.2;
            this.headMesh.rotation.z = Math.cos(this.animTime * 2.5) * 0.15;
        }
    }
}

window.Zombie3D = Zombie3D;
window.ZombieType3D = ZombieType3D;
window.ZombieState3D = ZombieState3D;
