# Nunchaku Survivors Demo - Landscape Stream Build

## 1. Product Goal
- Platform: mobile web, optimized for iPhone landscape streaming.
- Core fantasy: enemies are stronger than normal, and player mastery comes from continuous movement, spacing, and nunchaku momentum.
- Session length target: 3-6 minutes.
- Input: tap/drag movement + auto attack.

## 2. Core Loop
1. Generate/select character (job + weapon).
2. Start run, survive escalating waves.
3. Collect affix drops and stack build synergies.
4. Keep moving to steer nunchaku arcs, kite pressure, and control pickup timing.
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
  - legendary items also roll unique high-impact affix lines (`execute`, `chain`, movement scaling included).
- Equipment swap loop:
  - drops become loot items,
  - inventory stores items,
  - player selects inventory item, compares details, then chooses `Equip` / `Salvage`.
- Set system is postponed (parked for future pass).
- Movement combat model:
  - no targeted special action; facing and weapon coverage are driven by movement.
  - no burst button; damage windows come from positioning, orbit timing, and build synergies.
- Level-up now pauses gameplay (Archero-like):
  - choose 1 of 3 skills,
  - optional reroll with 1 credit,
  - then resume run.

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
  - vacuum pull after level-up/legendary/last-stand,
  - drop positions clamped in-bounds + stale-drop recovery pull to prevent off-screen loss.
- 30-second contract loop:
  - periodic micro-objectives (no-hit, movement chain, pickup rush, crit chain),
  - success rewards create high-pressure payoff moments,
  - failure resets cadence and relaxes pressure slightly.

## 6. Monetization and Stream Events
- Gift buttons spawn enemy rush and can trigger legendary.
- Gifts consume credits.
- Credits can be repurchased (`+20 credits = $5`) with 25% platform fee accounting.
- Design intent: higher gift risk can produce higher score ceiling if player execution holds.

## 7. Ranking and Scoring
- Categories:
  - `FLOW`: clear with strong movement uptime.
  - `RISK`: clear while accepting high-pressure gift/director events.
- Metrics:
  - FLOW uses clear time plus movement-control bonuses.
  - RISK uses clear time plus pressure and gift-risk bonuses.
- Score factors:
  - pace score,
  - gift bonus,
  - legendary bonus,
  - category multiplier,
  - distribution bonus to keep FLOW/RISK close to 1:1 share.

## 8. Current Demo Scope
- Landscape UI that keeps gameplay, controls, drop/affix/log/ranking visible.
- Tap/drag movement and auto-fire.
- Character generation and loadout selection.
- Movement-only nunchaku combat, fury/frenzy systems, legendary pipeline.
- Contract missions and intent HUD.
- WebAudio SFX (toggle ON/OFF).
- Local leaderboard (localStorage).
