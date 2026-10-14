/**
 * LAST LIGHT: Escape the Infected City - 3D Edition
 * ui3d.js - Tactical 3D HUD, Auto-Claim Toast System & Debriefing Screens
 */

class UI3DManager {
    constructor() {
        this.toastQueue = [];
        this.activeToastTimer = 0;
        this.damageFlashTimer = 0;
        this.toastEl = document.getElementById('touch-toast');
        this.damageFlashEl = document.getElementById('damage-flash');
    }

    showTouchToast(text, color = '#00e5ff') {
        if (!this.toastEl) return;
        this.toastEl.innerText = text;
        this.toastEl.style.borderColor = color;
        this.toastEl.style.boxShadow = `0 0 20px ${color}`;
        this.toastEl.classList.remove('hidden');
        this.activeToastTimer = 3.2;
    }

    triggerDamageFlash() {
        if (!this.damageFlashEl) return;
        this.damageFlashTimer = 0.35;
        this.damageFlashEl.style.opacity = '0.6';
    }

    update(dt) {
        if (this.activeToastTimer > 0) {
            this.activeToastTimer -= dt;
            if (this.activeToastTimer <= 0 && this.toastEl) {
                this.toastEl.classList.add('hidden');
            }
        }

        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= dt;
            if (this.damageFlashEl) {
                this.damageFlashEl.style.opacity = (this.damageFlashTimer / 0.35 * 0.6).toString();
            }
        }
    }

    updateHUD(player, level, timeLeft, totalScore) {
        // Health
        const hpEl = document.getElementById('hud-hp-val');
        const hpBar = document.getElementById('hud-hp-bar');
        if (hpEl) hpEl.innerText = `${Math.round(player.health)}/${player.maxHealth}`;
        if (hpBar) {
            const ratio = Math.max(0, player.health / player.maxHealth);
            hpBar.style.width = `${ratio * 100}%`;
            hpBar.style.backgroundColor = ratio > 0.5 ? '#2ecc71' : (ratio > 0.25 ? '#f39c12' : '#e74c3c');
        }

        // Lives Hearts
        const livesEl = document.getElementById('hud-lives-val');
        if (livesEl) {
            let str = '';
            for (let i = 0; i < player.maxLives; i++) {
                str += i < player.lives ? '❤️ ' : '🖤 ';
            }
            livesEl.innerText = str;
        }

        // Stamina
        const stamBar = document.getElementById('hud-stam-bar');
        if (stamBar) {
            stamBar.style.width = `${(player.stamina / player.maxStamina) * 100}%`;
        }

        // Battery
        const battBar = document.getElementById('hud-batt-bar');
        const battText = document.getElementById('hud-batt-text');
        if (battBar) {
            battBar.style.width = `${(player.battery / player.maxBattery) * 100}%`;
            battBar.style.backgroundColor = player.flashlightOn ? '#f1c40f' : '#7f8c8d';
        }
        if (battText) {
            battText.innerText = `LIGHT [F]: ${player.flashlightOn ? 'ON' : 'OFF'}`;
        }

        // Countdown Timer
        const timerEl = document.getElementById('hud-timer-val');
        if (timerEl) {
            const mins = Math.floor(Math.max(0, timeLeft) / 60);
            const secs = Math.floor(Math.max(0, timeLeft) % 60);
            timerEl.innerText = `⏱ ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            timerEl.style.color = timeLeft < 30 ? '#ff2222' : '#ffffff';
        }

        // Keys Held
        const keysEl = document.getElementById('hud-keys-val');
        if (keysEl) {
            keysEl.innerText = `🔑 KEYS: ${player.keys} / ${level.gateRequiredKeys}`;
        }

        // Clues Scavenged
        const cluesEl = document.getElementById('hud-clues-val');
        if (cluesEl) {
            cluesEl.innerText = `📑 CLUES: ${player.cluesFound.size} / ${level.totalCluesCount}`;
        }

        // Clue Hints summary board
        const clueHintsEl = document.getElementById('hud-clue-hints');
        if (clueHintsEl) {
            if (player.cluesFound.size === 0) {
                clueHintsEl.innerText = 'Explore and TOUCH clues to reveal gate code';
            } else {
                clueHintsEl.innerText = Array.from(player.cluesFound).join(' | ');
            }
        }

        // Weapons HUD
        const wm = player.weaponManager;
        const batEl = document.getElementById('hud-wpn-bat');
        const gunEl = document.getElementById('hud-wpn-gun');
        const flareEl = document.getElementById('hud-wpn-flare');

        if (batEl) {
            batEl.className = wm.currentWeapon === 'bat' ? 'weapon-slot active' : 'weapon-slot';
            document.getElementById('hud-bat-stat').innerText = `${wm.weapons.bat.durability}/${wm.weapons.bat.maxDurability}`;
        }
        if (gunEl) {
            gunEl.className = wm.currentWeapon === 'pistol' ? 'weapon-slot active' : 'weapon-slot';
            document.getElementById('hud-gun-stat').innerText = `${wm.weapons.pistol.ammo} RDS`;
        }
        if (flareEl) {
            flareEl.className = wm.currentWeapon === 'flare' ? 'weapon-slot active' : 'weapon-slot';
            document.getElementById('hud-flare-stat').innerText = `${wm.weapons.flare.count} LEFT`;
        }
    }

    showLevelClearModal(stats) {
        if (window.soundSystem) window.soundSystem.playVictory();

        let stars = 1;
        if (stats.timeLeftRatio > 0.25 || stats.healthRatio > 0.5) stars++;
        if (stats.cluesFound >= stats.totalClues && stats.rescuedNPC) stars++;
        stars = Math.min(3, stars);

        const levelKey = `lastlight_3d_level_${stats.levelNumber}_best`;
        const prevBest = parseInt(localStorage.getItem(levelKey) || '0', 10);
        const isNewRecord = stats.finalScore > prevBest;
        if (isNewRecord) {
            localStorage.setItem(levelKey, stats.finalScore.toString());
        }

        const modal = document.getElementById('level-clear-modal');
        if (modal) {
            document.getElementById('stars-display').innerHTML = '★'.repeat(stars) + '☆'.repeat(3 - stars);
            document.getElementById('stat-time-left').innerText = `${Math.floor(stats.timeLeft)}s (+${stats.timePoints} pts)`;
            document.getElementById('stat-health').innerText = `${Math.floor(stats.health)}% (+${stats.healthPoints} pts)`;
            document.getElementById('stat-clues').innerText = `${stats.cluesFound}/${stats.totalClues}`;
            document.getElementById('stat-zombies').innerText = `${stats.zombiesKilled} (+${stats.zombiePoints} pts)`;
            document.getElementById('stat-npc').innerText = stats.rescuedNPC ? 'RESCUED (+500 pts)' : 'N/A';
            document.getElementById('stat-total-score').innerText = `${stats.finalScore} PTS ${isNewRecord ? '★ NEW RECORD!' : ''}`;

            const nextBtn = document.getElementById('btn-next-level');
            if (nextBtn) {
                nextBtn.innerText = stats.levelNumber === 3 ? 'FINISH CAMPAIGN >>>' : 'NEXT LEVEL >>>';
            }

            modal.classList.remove('hidden');
        }
    }

    showGameOverModal(reason) {
        if (window.soundSystem) window.soundSystem.playGameOver();
        const modal = document.getElementById('game-over-modal');
        if (modal) {
            document.getElementById('game-over-reason').innerText = reason || 'Killed by infected swarm';
            modal.classList.remove('hidden');
        }
    }

    showGameWinModal(totalScore) {
        if (window.soundSystem) window.soundSystem.playVictory();
        const modal = document.getElementById('game-win-modal');
        if (modal) {
            document.getElementById('total-escape-score').innerText = `${totalScore} POINTS`;
            modal.classList.remove('hidden');
        }
    }
}

window.UI3DManager = UI3DManager;
