# RISE OF DEAD 🌴🧟‍♂️🔫

A complete, realistic browser-based **3D First-Person Jungle Zombie Survival & Escape Game** built with **JavaScript**, **Three.js**, and procedural **Web Audio API**.

---

## 🎮 How to Play Locally

### Option 1: 1-Click Windows Launcher (Easiest)
Double-click **`run.bat`** in Windows Explorer. It automatically finds an available port and opens the game in your default browser.

### Option 2: Python Command
Run in your terminal:
```bash
python launcher.py
```
*(Or `python -m http.server 8000`)*

---

## 🕹️ Player Controls

| Action | Control | Notes |
| :--- | :--- | :--- |
| **Move Forward** | `↑` Arrow or `W` | Moves forward through the jungle |
| **Move Backward** | `↓` Arrow or `S` | Moves backward |
| **Move Left (Strafe)** | `←` Arrow or `A` | Strafe left around trees and obstacles |
| **Move Right (Strafe)** | `→` Arrow or `D` | Strafe right around trees and obstacles |
| **Aim / Look Around** | `Mouse` / `Touchpad` | Look and aim smoothly; click canvas to lock mouse |
| **Shoot Weapon** | `Double Click` or `Left Click` | Fires active weapon (Pistol, Shotgun, Rifle) |
| **Reload Weapon** | `R` | Reloads active weapon |
| **Switch Weapons** | `1`, `2`, `3` / `Scroll Wheel` | Cycle between unlocked weapons (Pistol, Shotgun, Assault Rifle) |
| **Open Log & Solve Puzzle** | `E` / `Space` / `Enter` / `Click` | Or simply walk inside the cabin (`< 4.5m`) to open the Field Log |
| **Direct Key Collection** | `Walk into Golden Key` (`< 2.0m`) | Touch the floating 3D golden key to collect it immediately |
| **Solve Puzzle in Modal** | `Enter` / `[🔓 UNLOCK CACHE]` | Engage with the mini-game, align controls, and unlock! |

---

## 🏕️ 5 Safe Places & 5 Fast, Streamlined Mini-Games

Each of the **5 Safe Places** features its own unique, fast-paced interactive mini-game designed to take only 2–5 seconds so exploration remains quick and exciting:

1. **Safe Place 1: Ranger Outpost Cabin** (`x: -24, z: -24`) &mdash; 🔢 **Tactical 3-Digit Outpost Keypad**
   - **Clue**: *Ranger Safe Access: PIN [ 3 - 8 - 1 ]*
   - **Mini-Game**: Quick-tap `3`, `8`, `1` on the numeric keypad (or use your keyboard numbers) for an instant unlock!
   - **Reward**: 🔑 **Key #1** (1/5) + 💥 **Combat Shotgun Unlocked** (+32 Shells) + ❤️ First Aid (+40 HP).
   - **Unlocks**: Transmits coordinates for **Safe Place 2** (pulsing green beacon on minimap)!

2. **Safe Place 2: Canopy Treehouse Shelter** (`x: 26, z: -22`) &mdash; 📻 **Emergency Radio Channels**
   - **Clue**: *Distress Broadcast: [ CH 3 • 142.8 MHz AM ]*
   - **Mini-Game**: 1-click channel button: tap `[ CH 3: 142.8 MHz AM ★ EMERGENCY ]` to lock signal resonance at 100%!
   - **Reward**: 🔑 **Key #2** (2/5) + 💥 Heavy Ammo (+40) + ❤️ Health Boost.
   - **Unlocks**: Transmits coordinates for **Safe Place 3**!

3. **Safe Place 3: Ancient Stone Temple Shrine** (`x: 30, z: 12`) &mdash; 🗿 **3 Ancient Elemental Rune Tablets**
   - **Clue**: *Sacred Order: [ ☀️ SOLAR → 🐍 SERPENT → 🌙 LUNAR ]*
   - **Mini-Game**: Tap the 3 sacred stone runes in order (`☀️`, `🐍`, `🌙`) to awaken the altar.
   - **Reward**: 🔑 **Key #3** (3/5) + ❤️ **Extra Life (+1 Life)** + 💥 Ammo Cache.
   - **Unlocks**: Transmits coordinates for **Safe Place 4**!

4. **Safe Place 4: Research Lab Bunker** (`x: -26, z: 14`) &mdash; ⚡ **3 Biohazard Circuit Breakers**
   - **Clue**: *Bypass Pattern: [ ON - OFF - ON ]*
   - **Mini-Game**: Flip Switch 1 and 3 to `ON` (leaving 2 `OFF`) to restore auxiliary power.
   - **Reward**: 🔑 **Key #4** (4/5) + 🔫 **M4A1 Assault Rifle Unlocked** (+90 Rounds) + ❤️ Medkit.
   - **Unlocks**: Transmits coordinates for **Safe Place 5**!

5. **Safe Place 5: Military Watchtower Encampment** (`x: 0, z: -4`) &mdash; 🎯 **3x3 Tactical Radar Grid**
   - **Clue**: *Extraction LZ Coordinates: [ A-1, B-2 ]*
   - **Mini-Game**: Tap the 2 authorized LZ sectors (`A-1` and `B-2`) on the 3x3 tactical radar grid.
   - **Reward**: 🔑 **Key #5** (**5/5 Complete!**) + 💥 Max Ammo Refill + Full Health.
   - **Unlocks**: The fortified **Extraction Blast Gate** at `(0, 52)`!

> **🛡️ Safe Sanctuary Feature**: Inside any Safe Place, zombies cannot attack the player, allowing you to safely read field logs and solve puzzles.

---

## 👂 Acoustic Zombie Awareness
- Firing weapons alerts all infected zombies within 40 meters. Nearby zombies turn, snarl, and sprint toward your firing position!

---

## ⏳ Extended Multi-Level Difficulty Progression

Generous timers have been provided so players have ample time to explore, read the journals, solve the mini-games, and fight zombies:

| Level | Sector | Time Limit | Zombie Count & Difficulty |
| :--- | :--- | :--- | :--- |
| **Level 1** | Deep Jungle Basin | **7:00 (420s)** | 14 zombies, baseline speed & damage. Safe Camp & River Crossing. |
| **Level 2** | Ancient Ruins & Canopy | **6:00 (360s)** | 22 zombies, **+25% speed & damage**, 40% agile Runners. Tougher Boss (800 HP). |
| **Level 3** | Toxic Swamp & Outpost | **5:00 (300s)** | 30 zombies, **+50% speed & damage**, 50% Runners + 25% Brutes. Boss (1000 HP). |
| **Level 4** | Evacuation Perimeter | **4:00 (240s)** | 38 zombies, **+75% speed & damage**, berserk horde swarms. Boss (1250 HP). |

---

## 👑 Main Zombie Boss Battle
- Once all **5 Keys** are collected, approaching the Extraction Perimeter summons the **Main Zombie Boss** (mutated infected human, 2.4x scale, battle roar, charge attacks).
- The top-center HUD displays a dynamic **Boss Health Bar**.
- Defeating the boss slides open the fortified blast gate, activates the green beacons, and reveals the extraction portal to complete the level!
