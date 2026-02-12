# Glitch Survivors Demo - Landscape Stream Build

## 1. Product Goal
- Platform: mobile web, optimized for iPhone landscape streaming.
- Core fantasy: enemies are stronger than normal, and players can switch between stable combat and intentional glitch overdrive.
- Session length target: 3-6 minutes.
- Input: tap/drag movement + auto attack.

## 2. Core Loop
1. Generate/select character (job + weapon).
2. Start run, survive escalating waves.
3. Collect affix drops and stack build synergies.
4. Choose stable path (`Glitch OFF`) or burst path (`Glitch ON`).
5. Trigger gift events for risk/reward spikes.
6. Clear all waves and save score to leaderboard.

## 3. Combat and Build
- Job presets: Vanguard, Shadow, Arcanist, Reaver.
- Weapon presets: Greatsword, Dual Blades, War Bow, Void Staff.
- Diablo-like random itemization:
  - slots: `Weapon / Helm / Chest / Relic`,
  - rarity: `Common / Magic / Rare / Legendary`,
  - each item rolls weighted random affixes (prefix/suffix style) and roll quality.
- Legendary affix layer:
  - legendary items also roll unique high-impact affix lines (`execute`, `chain`, `burst boost` included).
- Equipment swap loop:
  - drops become loot items,
  - inventory stores items,
  - player selects inventory item, compares details, then manually `Equip` / `Salvage`.
- Set system is postponed (parked for future pass).
- Glitch model:
  - `Glitch OFF`: stability limiter active (damage cap on runaway formulas).
  - `Glitch ON`: limiter removed, unstable combo terms enabled.
- Level-up now pauses gameplay (Archero-like):
  - choose 1 of 3 skills,
  - optional reroll with 1 credit,
  - then resume run.
- Manual active skill:
  - `Burst` button (cooldown based),
  - radial manual burst with knockback and damage,
  - reduces full-auto feeling and adds timing skill.

## 4. Difficulty and Flow Director
- Dynamic director tracks pressure vs player performance and adjusts:
  - spawn pace,
  - elite ratio,
  - enemy speed/HP/damage scalar.
- Enemy baseline is intentionally extreme (nightmare scaling, roughly 100x class HP/damage budget).
- Enemy archetypes are mixed for pressure variety:
  - fast stalker,
  - high-HP brute,
  - high-damage reaper,
  - standard raider.
- Director intent is exposed in UI:
  - `HUNT` (escalate),
  - `SQUEEZE` (balanced pressure),
  - `RECOVER` (ease for comeback).
- Goal: keep challenge near "not too easy / not too hard" zone.
- Telemetry tracked in-run:
  - kills, recent kill tempo, damage dealt,
  - hits taken, peak enemy count,
  - flow score and director bias.

## 5. Legendary and Pickup Systems
- Diablo-style legendary drops:
  - world pillar beam,
  - screen flash/shake,
  - audio sting,
  - overlay text moment.
- Legendary pity logic:
  - chance grows with no-legend time and elite drought,
  - forced legendary on long dry streak to prevent dead dopamine loops.
- VS-style pickup quality:
  - magnetic pull scaling with pickup range,
  - vacuum burst after level-up/legendary/last-stand,
  - drop positions clamped in-bounds + stale-drop recovery pull to prevent off-screen loss.
- 30-second contract loop:
  - periodic micro-objectives (no-hit, glitch kill chain, pickup rush, crit chain),
  - success rewards create burst moments,
  - failure resets cadence and relaxes pressure slightly.

## 6. Monetization and Stream Events
- Gift buttons spawn enemy rush and can trigger legendary.
- Gifts consume credits.
- Credits can be repurchased (`+20 credits = $5`) with 25% platform fee accounting.
- Design intent: higher gift risk can produce higher score ceiling if player execution holds.

## 7. Ranking and Scoring
- Categories:
  - `CLEAN`: no glitch used.
  - `GLITCH`: glitch used at least once.
- Metrics:
  - CLEAN uses clear time.
  - GLITCH uses clear time minus glitch-active time.
- Score factors:
  - pace score,
  - gift bonus,
  - legendary bonus,
  - category multiplier,
  - distribution bonus to keep CLEAN/GLITCH close to 1:1 share.

## 8. Current Demo Scope
- Landscape UI that keeps gameplay, controls, drop/affix/log/ranking visible.
- Tap/drag movement and auto-fire.
- Character generation and loadout selection.
- Glitch toggle, fury/frenzy systems, legendary pipeline.
- Contract missions and intent HUD.
- WebAudio SFX (toggle ON/OFF).
- Local leaderboard (localStorage).
