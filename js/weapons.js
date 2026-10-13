/**
 * LAST LIGHT: Escape the Infected City
 * weapons.js - Arsenal & Projectile Management
 * 
 * Handles weapons (Bat, Pistol, Flare) and active projectiles/effects.
 */

class Bullet {
    constructor(x, y, vx, vy, damage = 45) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.radius = 3.5;
        this.distanceTravelled = 0;
        this.maxDistance = 550;
        this.active = true;
    }

    update(dt, level) {
        if (!this.active) return;

        const stepX = this.vx * dt;
        const stepY = this.vy * dt;
        const newX = this.x + stepX;
        const newY = this.y + stepY;

        // Check level wall collision
        if (level.isWall(newX, newY, this.radius)) {
            this.active = false;
            // Spawn spark particles on wall impact
            if (window.game && window.game.particleSystem) {
                window.game.particleSystem.spawnWallSparks(newX, newY);
            }
            return;
        }

        this.x = newX;
        this.y = newY;
        this.distanceTravelled += Math.hypot(stepX, stepY);

        if (this.distanceTravelled >= this.maxDistance) {
            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.fillStyle = '#ffea75';
        ctx.shadowColor = '#ffb300';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Bullet streak trail
        ctx.strokeStyle = 'rgba(255, 230, 100, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - (this.vx * 0.02), this.y - (this.vy * 0.02));
        ctx.stroke();
        ctx.restore();
    }
}

class FlareProjectile {
    constructor(startX, startY, targetX, targetY) {
        this.x = startX;
        this.y = startY;
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = 360;
        this.totalDist = Math.hypot(targetX - startX, targetY - startY);
        this.currentDist = 0;
        this.isAirborne = true;
        this.active = true;
        this.burnTimer = 7.0; // Burns for 7 seconds once landed
        this.radius = 6;
        this.lureRadius = 320; // Attracts zombies within 320px
    }

    update(dt, level) {
        if (!this.active) return;

        if (this.isAirborne) {
            const dx = this.targetX - this.startX;
            const dy = this.targetY - this.startY;
            const dirX = dx / (this.totalDist || 1);
            const dirY = dy / (this.totalDist || 1);

            const move = this.speed * dt;
            this.x += dirX * move;
            this.y += dirY * move;
            this.currentDist += move;

            // Stop at walls or destination
            if (this.currentDist >= this.totalDist || level.isWall(this.x, this.y, this.radius)) {
                this.isAirborne = false;
            }
        } else {
            // Burning on ground
            this.burnTimer -= dt;
            if (this.burnTimer <= 0) {
                this.active = false;
            }

            // Spawn smoke & spark particles
            if (window.game && window.game.particleSystem && Math.random() < 0.45) {
                window.game.particleSystem.spawnFlareSparks(this.x, this.y);
            }
        }
    }

    render(ctx) {
        if (!this.active) return;
        ctx.save();

        if (this.isAirborne) {
            // Flying flare with flame tail
            ctx.fillStyle = '#ff2200';
            ctx.shadowColor = '#ff5500';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Ground flare with bright burning radius
            const pulse = 1 + Math.sin(Date.now() * 0.02) * 0.15;
            const glowGradient = ctx.createRadialGradient(this.x, this.y, 4, this.x, this.y, 70 * pulse);
            glowGradient.addColorStop(0, 'rgba(255, 60, 0, 0.9)');
            glowGradient.addColorStop(0.5, 'rgba(255, 120, 0, 0.4)');
            glowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 70 * pulse, 0, Math.PI * 2);
            ctx.fill();

            // Flare cylinder stick
            ctx.fillStyle = '#ff1100';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
            ctx.fill();

            // Sputtering core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Subtle lure ring ripple
            const lureRing = (Date.now() % 1200) / 1200;
            ctx.strokeStyle = `rgba(255, 100, 0, ${0.4 * (1 - lureRing)})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.lureRadius * lureRing, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

class WeaponManager {
    constructor() {
        this.weapons = {
            bat: {
                name: 'Baseball Bat',
                type: 'melee',
                durability: 8,
                maxDurability: 8,
                damage: 40,
                range: 65,
                arc: Math.PI * 0.55, // 100 degrees
                cooldown: 0.42,
                noise: 50, // Quiet swing, louder on hit
                icon: '🏏'
            },
            pistol: {
                name: '9mm Pistol',
                type: 'ranged',
                ammo: 12,
                maxAmmo: 30,
                damage: 50,
                bulletSpeed: 750,
                cooldown: 0.35,
                noise: 330, // Very loud gunshot
                icon: '🔫'
            },
            flare: {
                name: 'Distraction Flare',
                type: 'throwable',
                count: 3,
                maxCount: 6,
                cooldown: 0.8,
                noise: 280, // Lures zombies
                icon: '🧨'
            }
        };

        this.currentWeapon = 'bat';
        this.lastAttackTime = 0;
        this.bullets = [];
        this.flares = [];
    }

    selectWeapon(key) {
        if (this.weapons[key]) {
            this.currentWeapon = key;
            return true;
        }
        return false;
    }

    cycleWeapon() {
        const order = ['bat', 'pistol', 'flare'];
        const currentIdx = order.indexOf(this.currentWeapon);
        const nextIdx = (currentIdx + 1) % order.length;
        this.currentWeapon = order[nextIdx];
    }

    getActiveWeaponData() {
        return this.weapons[this.currentWeapon];
    }

    addAmmo(amount) {
        this.weapons.pistol.ammo = Math.min(this.weapons.pistol.maxAmmo, this.weapons.pistol.ammo + amount);
    }

    addFlares(amount) {
        this.weapons.flare.count = Math.min(this.weapons.flare.maxCount, this.weapons.flare.count + amount);
    }

    repairBat(amount = 8) {
        this.weapons.bat.durability = Math.min(this.weapons.bat.maxDurability, this.weapons.bat.durability + amount);
    }

    /**
     * Attempts to attack with currently selected weapon
     * Returns noise radius generated (0 if attack failed/cooldown)
     */
    attack(player, targetWorldX, targetWorldY, level, zombies) {
        const now = performance.now() / 1000;
        const weapon = this.weapons[this.currentWeapon];

        if (now - this.lastAttackTime < weapon.cooldown) {
            return 0;
        }

        // Aim angle
        const aimAngle = Math.atan2(targetWorldY - player.y, targetWorldX - player.x);

        if (this.currentWeapon === 'bat') {
            if (weapon.durability <= 0) {
                if (window.soundSystem) window.soundSystem.playBeep(false);
                return 0;
            }

            this.lastAttackTime = now;
            if (window.soundSystem) window.soundSystem.playBatSwing();

            // Melee swing visual trigger on player
            player.triggerSwingAnimation(aimAngle);

            let hitAny = false;
            let finalNoise = weapon.noise;

            // Check hit against zombies in arc
            zombies.forEach(z => {
                if (!z.isAlive) return;
                const dist = Math.hypot(z.x - player.x, z.y - player.y);
                if (dist <= weapon.range + z.radius) {
                    const angleToZombie = Math.atan2(z.y - player.y, z.x - player.x);
                    let angleDiff = Math.abs(aimAngle - angleToZombie);
                    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                    if (angleDiff <= weapon.arc / 2) {
                        // Direct hit!
                        hitAny = true;
                        z.takeDamage(weapon.damage, player.x, player.y);
                        // Knockback
                        const knockForce = 130;
                        z.applyKnockback(Math.cos(aimAngle) * knockForce, Math.sin(aimAngle) * knockForce);
                    }
                }
            });

            if (hitAny) {
                weapon.durability--;
                finalNoise = 120; // Hitting flesh/bones makes more noise
                if (window.soundSystem) window.soundSystem.playBatHit();
                if (window.game && window.game.camera) window.game.camera.shake(3, 0.15);
            }

            return finalNoise;
        } 
        else if (this.currentWeapon === 'pistol') {
            if (weapon.ammo <= 0) {
                if (window.soundSystem) window.soundSystem.playBeep(false);
                return 0;
            }

            this.lastAttackTime = now;
            weapon.ammo--;

            if (window.soundSystem) window.soundSystem.playGunshot();
            if (window.game && window.game.camera) window.game.camera.shake(5, 0.18);

            // Muzzle flash on player
            player.triggerMuzzleFlash(aimAngle);

            // Spawn bullet
            const speed = weapon.bulletSpeed;
            const spawnDist = player.radius + 8;
            const spawnX = player.x + Math.cos(aimAngle) * spawnDist;
            const spawnY = player.y + Math.sin(aimAngle) * spawnDist;
            const bullet = new Bullet(
                spawnX,
                spawnY,
                Math.cos(aimAngle) * speed,
                Math.sin(aimAngle) * speed,
                weapon.damage
            );
            this.bullets.push(bullet);

            return weapon.noise;
        } 
        else if (this.currentWeapon === 'flare') {
            if (weapon.count <= 0) {
                if (window.soundSystem) window.soundSystem.playBeep(false);
                return 0;
            }

            this.lastAttackTime = now;
            weapon.count--;

            if (window.soundSystem) window.soundSystem.playFlareIgnite();

            // Clamp max throw distance to 300px
            const maxThrow = 320;
            const dist = Math.hypot(targetWorldX - player.x, targetWorldY - player.y);
            let destX = targetWorldX;
            let destY = targetWorldY;
            if (dist > maxThrow) {
                const ratio = maxThrow / dist;
                destX = player.x + (targetWorldX - player.x) * ratio;
                destY = player.y + (targetWorldY - player.y) * ratio;
            }

            const flare = new FlareProjectile(player.x, player.y, destX, destY);
            this.flares.push(flare);

            return weapon.noise;
        }

        return 0;
    }

    update(dt, level, zombies) {
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(dt, level);

            // Check zombie collision
            if (b.active) {
                for (const z of zombies) {
                    if (z.isAlive) {
                        const dist = Math.hypot(z.x - b.x, z.y - b.y);
                        if (dist <= z.radius + b.radius) {
                            z.takeDamage(b.damage, b.x - b.vx * 0.05, b.y - b.vy * 0.05);
                            b.active = false;
                            // Push zombie back slightly
                            z.applyKnockback(b.vx * 0.08, b.vy * 0.08);
                            break;
                        }
                    }
                }
            }

            if (!b.active) {
                this.bullets.splice(i, 1);
            }
        }

        // Update flares
        for (let i = this.flares.length - 1; i >= 0; i--) {
            const f = this.flares[i];
            f.update(dt, level);
            if (!f.active) {
                this.flares.splice(i, 1);
            }
        }
    }

    render(ctx) {
        this.flares.forEach(f => f.render(ctx));
        this.bullets.forEach(b => b.render(ctx));
    }
}

window.WeaponManager = WeaponManager;
window.Bullet = Bullet;
window.FlareProjectile = FlareProjectile;
