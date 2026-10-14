/**
 * LAST LIGHT: Escape the Infected City
 * ui.js - Cinematic Prologue, Minimalist HUD, Search Bar & Journal System
 * 
 * Manages cinematic intro typed text, health/stamina/lives HUD, subtle compass,
 * noise radar, searching progress bar, item toasts, survivor journal [J],
 * pause menu, and 1-3 star debriefing screens.
 */

export class UIManager {
    constructor() {
        this.activeModal = null; // 'prologue', 'pause', 'journal', 'levelClear', 'gameOver', 'victory'
        this.toastTimer = 0;
        this.damageFlashTimer = 0;

        // Elements
        this.prologueModal = document.getElementById('prologue-modal');
        this.typewriterTextEl = document.getElementById('typewriter-text');
        this.prologueBtn = document.getElementById('btn-start-game');

        this.pauseModal = document.getElementById('pause-modal');
        this.journalModal = document.getElementById('journal-modal');
        this.journalContentEl = document.getElementById('journal-content');

        this.levelClearModal = document.getElementById('level-clear-modal');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.victoryModal = document.getElementById('game-win-modal');

        this.searchContainer = document.getElementById('search-container');
        this.searchBarFill = document.getElementById('search-bar-fill');
        this.searchLabel = document.getElementById('search-label');

        this.toastEl = document.getElementById('touch-toast');
        this.damageFlashEl = document.getElementById('damage-flash');
        this.compassNeedle = document.getElementById('compass-needle');
    }

    /**
     * Starts typed cinematic intro
     */
    startTypewriterIntro(onComplete) {
        if (!this.typewriterTextEl) {
            if (onComplete) onComplete();
            return;
        }

        const fullText = "Day 0. The sirens went quiet. The streets belong to the infected. A radio crackles: 'Safe Zone is still open. Find the keys. Find the gate. Hurry.' The countdown has begun.";
        this.typewriterTextEl.innerText = '';
        let idx = 0;

        const typeInterval = setInterval(() => {
            if (idx < fullText.length) {
                this.typewriterTextEl.innerText += fullText[idx];
                idx++;
            } else {
                clearInterval(typeInterval);
                if (this.prologueBtn) {
                    this.prologueBtn.classList.remove('hidden');
                    this.prologueBtn.focus();
                }
            }
        }, 32);
    }

    showToast(text, color = '#00e5ff') {
        if (!this.toastEl) return;
        this.toastEl.innerText = text;
        this.toastEl.style.borderColor = color;
        this.toastEl.style.boxShadow = `0 0 20px ${color}`;
        this.toastEl.classList.remove('hidden');
        this.toastTimer = 3.5;
    }

    triggerDamageFlash() {
        if (!this.damageFlashEl) return;
        this.damageFlashTimer = 0.35;
        this.damageFlashEl.style.opacity = '0.7';
    }

    update(dt) {
        if (this.toastTimer > 0) {
            this.toastTimer -= dt;
            if (this.toastTimer <= 0 && this.toastEl) {
                this.toastEl.classList.add('hidden');
            }
        }

        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= dt;
            if (this.damageFlashEl) {
                this.damageFlashEl.style.opacity = (this.damageFlashTimer / 0.35 * 0.7).toString();
            }
        }
    }

    /**
     * Updates search interaction progress bar
     */
    updateSearchBar(objectName, progress) {
        if (!this.searchContainer) return;

        if (progress > 0 && progress < 1.0) {
            this.searchContainer.classList.remove('hidden');
            if (this.searchLabel) this.searchLabel.innerText = `SEARCHING ${objectName.toUpperCase()}...`;
            if (this.searchBarFill) this.searchBarFill.style.width = `${progress * 100}%`;
        } else {
            this.searchContainer.classList.add('hidden');
            if (this.searchBarFill) this.searchBarFill.style.width = '0%';
        }
    }

    /**
     * Updates Compass heading toward closest unsearched container
     */
    updateCompass(player, searchables) {
        if (!this.compassNeedle) return;

        let closestUnsearched = null;
        let closestDist = Infinity;

        searchables.forEach(s => {
            if (!s.isSearched) {
                const dist = player.position.distanceTo(s.position);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestUnsearched = s;
                }
            }
        });

        if (closestUnsearched) {
            const dx = closestUnsearched.position.x - player.position.x;
            const dz = closestUnsearched.position.z - player.position.z;
            const targetAngle = Math.atan2(dx, dz);
            const relativeAngle = targetAngle - player.cameraYaw;
            this.compassNeedle.style.transform = `translateX(-50%) rotate(${relativeAngle}rad)`;
        }
    }

    /**
     * Updates In-Game HUD Elements
     */
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

        // Lives
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

        // Flashlight text
        const battText = document.getElementById('hud-batt-text');
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

        // Noise radar
        const noiseBar = document.getElementById('hud-noise-bar');
        if (noiseBar) {
            const ratio = Math.min(1.0, player.noiseRadius / 32.0);
            noiseBar.style.width = `${ratio * 100}%`;
            noiseBar.style.backgroundColor = ratio > 0.6 ? '#e74c3c' : (ratio > 0.25 ? '#f39c12' : '#2ecc71');
        }

        // Objective
        const objEl = document.getElementById('hud-objective');
        if (objEl) {
            objEl.innerText = level.subtitle || 'Search containers to find gate keys and escape.';
        }

        // Weapons
        const w = player.weapons;
        const batEl = document.getElementById('hud-wpn-bat');
        const gunEl = document.getElementById('hud-wpn-gun');
        const flareEl = document.getElementById('hud-wpn-flare');

        if (batEl) {
            batEl.className = player.currentWeapon === 'bat' ? 'weapon-slot active' : 'weapon-slot';
            document.getElementById('hud-bat-stat').innerText = `${w.bat.durability}/${w.bat.maxDurability}`;
        }
        if (gunEl) {
            gunEl.className = player.currentWeapon === 'pistol' ? 'weapon-slot active' : 'weapon-slot';
            document.getElementById('hud-gun-stat').innerText = `${w.pistol.ammo} RDS`;
        }
        if (flareEl) {
            flareEl.className = player.currentWeapon === 'flare' ? 'weapon-slot active' : 'weapon-slot';
            document.getElementById('hud-flare-stat').innerText = `${w.flare.count} LEFT`;
        }
    }

    /**
     * Toggles Survivor Journal Modal [J]
     */
    toggleJournal(player, isOpen = null) {
        if (!this.journalModal) return;

        const willOpen = (isOpen !== null) ? isOpen : this.journalModal.classList.contains('hidden');

        if (willOpen) {
            this.journalModal.classList.remove('hidden');
            this.activeModal = 'journal';

            if (this.journalContentEl) {
                if (player.cluesFound.length === 0) {
                    this.journalContentEl.innerHTML = '<p style="color: #7f8c8d; font-style: italic;">No clues gathered yet. Search crates, lockers, cars, and desks to discover notes and key hints.</p>';
                } else {
                    let html = '';
                    player.cluesFound.forEach((clue, idx) => {
                        html += `
                            <div class="journal-entry">
                                <div class="journal-title">ENTRY #${idx + 1}: ${clue.title}</div>
                                <div class="journal-body">"${clue.hint}"</div>
                            </div>
                        `;
                    });
                    this.journalContentEl.innerHTML = html;
                }
            }
        } else {
            this.journalModal.classList.add('hidden');
            this.activeModal = null;
        }
    }

    showLevelClear(stats, onNextLevel) {
        if (!this.levelClearModal) return;

        // 1-3 Stars calculation
        let stars = 1;
        if (stats.timeLeftRatio > 0.25 || stats.healthRatio > 0.5) stars++;
        if (stats.cluesFound >= 2 && stats.searchedRatio > 0.5) stars++;
        stars = Math.min(3, stars);

        const levelKey = `lastlight_level_${stats.levelNumber}_score`;
        const prevBest = parseInt(localStorage.getItem(levelKey) || '0', 10);
        const isNewRecord = stats.finalScore > prevBest;
        if (isNewRecord) {
            localStorage.setItem(levelKey, stats.finalScore.toString());
        }

        document.getElementById('stars-display').innerHTML = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        document.getElementById('stat-time-left').innerText = `${Math.floor(stats.timeLeft)}s (+${stats.timePoints} pts)`;
        document.getElementById('stat-health').innerText = `${Math.floor(stats.health)}% (+${stats.healthPoints} pts)`;
        document.getElementById('stat-keys').innerText = `${stats.keysHeld}/${stats.requiredKeys}`;
        document.getElementById('stat-clues').innerText = `${stats.cluesFound} notes`;
        document.getElementById('stat-zombies').innerText = `${stats.zombiesKilled} (+${stats.zombiePoints} pts)`;
        document.getElementById('stat-total-score').innerText = `${stats.finalScore} PTS ${isNewRecord ? '★ NEW RECORD!' : ''}`;

        const nextBtn = document.getElementById('btn-next-level');
        if (nextBtn) {
            nextBtn.innerText = stats.levelNumber === 3 ? 'FINISH CAMPAIGN >>>' : 'NEXT SECTOR >>>';
            nextBtn.onclick = () => {
                this.levelClearModal.classList.add('hidden');
                onNextLevel();
            };
        }

        this.levelClearModal.classList.remove('hidden');
        this.activeModal = 'levelClear';
    }

    showGameOver(reason, onRestart) {
        if (!this.gameOverModal) return;
        document.getElementById('game-over-reason').innerText = reason || 'Killed by infected swarm';
        const restartBtn = document.getElementById('btn-restart-game');
        if (restartBtn) {
            restartBtn.onclick = () => {
                this.gameOverModal.classList.add('hidden');
                onRestart();
            };
        }
        this.gameOverModal.classList.remove('hidden');
        this.activeModal = 'gameOver';
    }

    showVictory(totalScore, onPlayAgain) {
        if (!this.victoryModal) return;
        document.getElementById('total-escape-score').innerText = `${totalScore} POINTS`;
        const btn = document.getElementById('btn-win-restart');
        if (btn) {
            btn.onclick = () => {
                this.victoryModal.classList.add('hidden');
                onPlayAgain();
            };
        }
        this.victoryModal.classList.remove('hidden');
        this.activeModal = 'victory';
    }

    togglePause(isPaused) {
        if (!this.pauseModal) return;
        if (isPaused) {
            this.pauseModal.classList.remove('hidden');
            this.activeModal = 'pause';
        } else {
            this.pauseModal.classList.add('hidden');
            this.activeModal = null;
        }
    }
}
