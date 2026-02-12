(function () {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  if (ctx && "imageSmoothingEnabled" in ctx) {
    ctx.imageSmoothingEnabled = false;
  }

  const ui = {
    gameShell: document.querySelector(".game-shell"),
    wave: document.getElementById("waveVal"),
    level: document.getElementById("levelVal"),
    hp: document.getElementById("hpVal"),
    enemySpeed: document.getElementById("enemySpeedVal"),
    fury: document.getElementById("furyVal"),
    time: document.getElementById("timeVal"),
    glitchTime: document.getElementById("glitchTimeVal"),
    credits: document.getElementById("creditVal"),
    gift: document.getElementById("giftVal"),
    legendary: document.getElementById("legendVal"),
    scorePreview: document.getElementById("scorePreviewVal"),
    stats: document.getElementById("stats"),
    hudModeBtn: document.getElementById("hudModeBtn"),
    systemTextBtn: document.getElementById("systemTextBtn"),
    systemFlashBtn: document.getElementById("systemFlashBtn"),
    systemShakeBtn: document.getElementById("systemShakeBtn"),
    xpFill: document.getElementById("xpFill"),
    xpText: document.getElementById("xpTextVal"),
    intent: document.getElementById("intentVal"),
    objective: document.getElementById("objectiveVal"),
    objectiveTimer: document.getElementById("objectiveTimerVal"),
    gross: document.getElementById("grossVal"),
    fee: document.getElementById("feeVal"),
    affixList: document.getElementById("affixList"),
    gearSlots: document.getElementById("gearSlots"),
    itemList: document.getElementById("itemList"),
    itemDetailTitle: document.getElementById("itemDetailTitle"),
    itemCompareDelta: document.getElementById("itemCompareDelta"),
    itemQuickMeta: document.getElementById("itemQuickMeta"),
    itemDetailStats: document.getElementById("itemDetailStats"),
    equipItemBtn: document.getElementById("equipItemBtn"),
    salvageItemBtn: document.getElementById("salvageItemBtn"),
    unequipSlotBtn: document.getElementById("unequipSlotBtn"),
    extractAffixBtn: document.getElementById("extractAffixBtn"),
    imprintAffixBtn: document.getElementById("imprintAffixBtn"),
    reforgeAffixBtn: document.getElementById("reforgeAffixBtn"),
    runeList: document.getElementById("runeList"),
    affixLabHint: document.getElementById("affixLabHint"),
    gearHint: document.getElementById("gearHint"),
    loadoutInfo: document.getElementById("loadoutInfo"),
    setBonusVal: document.getElementById("setBonusVal"),
    dropList: document.getElementById("dropList"),
    pickupTrail: document.getElementById("pickupTrail"),
    logBox: document.getElementById("logBox"),
    rankingBody: document.getElementById("rankingBody"),
    startBtn: document.getElementById("startBtn"),
    glitchBtn: document.getElementById("glitchBtn"),
    audioBtn: document.getElementById("audioBtn"),
    burstBtn: document.getElementById("burstBtn"),
    gift100Btn: document.getElementById("gift100Btn"),
    gift500Btn: document.getElementById("gift500Btn"),
    gift1000Btn: document.getElementById("gift1000Btn"),
    giftEventPanel: document.getElementById("giftEventPanel"),
    giftEventName: document.getElementById("giftEventName"),
    giftEventMeta: document.getElementById("giftEventMeta"),
    streamHookBtn: document.getElementById("streamHookBtn"),
    streamHookStatus: document.getElementById("streamHookStatus"),
    buyCreditBtn: document.getElementById("buyCreditBtn"),
    jobSelect: document.getElementById("jobSelect"),
    weaponSelect: document.getElementById("weaponSelect"),
    rollCharBtn: document.getElementById("rollCharBtn"),
    charName: document.getElementById("charNameVal"),
    charSpec: document.getElementById("charSpecVal"),
    levelModal: document.getElementById("levelModal"),
    levelChoices: document.getElementById("levelChoices"),
    levelAutoTimer: document.getElementById("levelAutoTimerVal"),
    rerollSkillBtn: document.getElementById("rerollSkillBtn"),
    mutationModal: document.getElementById("mutationModal"),
    mutationChoices: document.getElementById("mutationChoices"),
    pickupModal: document.getElementById("pickupModal"),
    pickupSlotLabel: document.getElementById("pickupSlotLabel"),
    pickupAutoTimer: document.getElementById("pickupAutoTimerVal"),
    pickupCompareDelta: document.getElementById("pickupCompareDelta"),
    pickupCurrentTitle: document.getElementById("pickupCurrentTitle"),
    pickupCurrentStats: document.getElementById("pickupCurrentStats"),
    pickupDropTitle: document.getElementById("pickupDropTitle"),
    pickupDropStats: document.getElementById("pickupDropStats"),
    pickupKeepBtn: document.getElementById("pickupKeepBtn"),
    pickupDiscardBtn: document.getElementById("pickupDiscardBtn"),
  };

  const W = canvas.width;
  const H = canvas.height;
  const RETRO_ASSET_PATHS = {
    clouds: "assets/retro/clouds-strip.svg",
    landFar: "assets/retro/land-far.svg",
    landNear: "assets/retro/land-near.svg",
    panelPattern: "assets/retro/panel-pattern.svg",
  };
  const PLAYER_HP_CLASS_MUL = 8;
  const FIXED_STEP_MS = 1000 / 60;
  const FIXED_DT = 1 / 60;
  const STORAGE_KEY = "glitch_survivors_demo_weekly_v3";
  const LEVEL_AUTO_PICK_SECONDS = 6;
  const WAVE_MUTATION_INTERVAL = 10;
  const WAVE_MINIBOSS_INTERVAL = 15;
  const SYSTEM_SETTINGS_DEFAULTS = {
    combatTextMode: "low",
    flashFx: true,
    shakeFx: true,
  };
  const STREAM_HOOK_DEFAULT_ENDPOINT = "http://127.0.0.1:8091/events";
  const STREAM_HOOK_MIN_POLL_SEC = 0.65;
  const STREAM_HOOK_MAX_BATCH = 24;
  const ITEM_DROP_RATE_MULT = 0.1;
  const HIGH_RARITY_RATE_MULT = 0.08;
  const LEGENDARY_RATE_MULT = 0.06;
  const LIVE_EVENT_FALLBACK_DIAMONDS = {
    gift: 3,
    subscription: 22,
    follow: 1,
    share: 2,
    like: 1,
    chat: 1,
  };
  const retroAssets = createRetroAssets(RETRO_ASSET_PATHS);
  let retroPanelPattern = null;

  const CORE_AFFIX_STATS = [
    { id: "power", name: "Power Core", color: "#4ee59f", desc: "Impact damage scaling" },
    { id: "multicast", name: "Swing Sync", color: "#58b2ff", desc: "Swing control and chain flow" },
    { id: "scatter", name: "Chain Arc", color: "#ffcf5b", desc: "Chain reach and whip radius" },
    { id: "overflow", name: "Glitch Torque", color: "#ff8f6e", desc: "Bug-chain torque multiplier" },
    { id: "lucky", name: "Lucky Crit", color: "#d8a6ff", desc: "Critical impact scaling" },
  ];
  const CORE_AFFIX_IDS = CORE_AFFIX_STATS.map(function (a) {
    return a.id;
  });

  const LEVEL_SKILL_POOL = [
    { id: "atk", name: "Brutal Swing", desc: "Impact damage +18%" },
    { id: "haste", name: "Chain Handling", desc: "Swing handling +15%" },
    { id: "crit", name: "Killer Eye", desc: "Crit chance +7%" },
    { id: "multishot", name: "Twin Chain", desc: "Swing sync +1 tier" },
    { id: "pickup", name: "Magnet Ring", desc: "Pickup range +42" },
    { id: "move", name: "Footwork", desc: "Move speed +28" },
    { id: "vital", name: "Reinforced Core", desc: "Max HP +32 / heal +20" },
    { id: "splash", name: "Whiplash Arc", desc: "Swing burst radius +18" },
    { id: "focus", name: "Bug Focus", desc: "Glitch chain gain +35%" },
    { id: "rune", name: "Forge Cache", desc: "Random gear offer +2" },
  ];

  const ITEM_SLOTS = ["weapon", "armor"];
  const LEGACY_SLOT_MAP = {
    helm: "armor",
    chest: "armor",
    relic: "armor",
  };
  const ITEM_SLOT_LABEL = {
    weapon: "Weapon",
    armor: "Armor",
  };

  const ITEM_BASES = {
    weapon: ["Iron Nunchaku", "Chainbreaker", "Storm Flail", "Void Chaku"],
    armor: ["Scale Jacket", "Bone Harness", "Storm Guard", "Rune Vest"],
  };

  const ITEM_RARITY = {
    common: { label: "Common", color: "#b8c6cf", affixes: 2, minRoll: 0.72, maxRoll: 0.98, salvage: 1 },
    magic: { label: "Magic", color: "#7bb5ff", affixes: 3, minRoll: 0.96, maxRoll: 1.28, salvage: 2 },
    rare: { label: "Rare", color: "#f1d26a", affixes: 4, minRoll: 1.14, maxRoll: 1.64, salvage: 4 },
    legendary: { label: "Legendary", color: "#ff9f58", affixes: 5, minRoll: 1.35, maxRoll: 2.12, salvage: 8 },
  };

  const LEGENDARY_AFFIX_CHANCE = {
    common: 0.004,
    magic: 0.012,
    rare: 0.026,
    legendary: 0.18,
  };

  const RANDOM_AFFIX_POOL = [
    { id: "power", label: "Ferocious", stat: "power", min: 0.6, max: 2.8, slot: "any", family: "prefix", weight: 8 },
    { id: "multicast", label: "Forking", stat: "multicast", min: 0.35, max: 1.25, slot: "weapon", family: "prefix", weight: 6 },
    { id: "scatter", label: "Chaotic", stat: "scatter", min: 0.45, max: 2.1, slot: "any", family: "prefix", weight: 7 },
    { id: "overflow", label: "Overflowing", stat: "overflow", min: 0.4, max: 1.95, slot: "any", family: "suffix", weight: 7 },
    { id: "lucky", label: "Assassin", stat: "lucky", min: 0.5, max: 2.35, slot: "any", family: "suffix", weight: 7 },
    { id: "damageMul", label: "Cruel", stat: "damageMul", min: 0.05, max: 0.26, slot: "weapon", family: "prefix", weight: 7 },
    { id: "attackRateMul", label: "Quickened", stat: "attackRateMul", min: 0.04, max: 0.2, slot: "weapon", family: "suffix", weight: 6 },
    { id: "move", label: "Fleet", stat: "move", min: 12, max: 62, slot: "armor", family: "suffix", weight: 6 },
    { id: "pickup", label: "Magnetic", stat: "pickup", min: 16, max: 82, slot: "armor", family: "suffix", weight: 6 },
    { id: "mitigation", label: "Fortified", stat: "mitigation", min: 0.02, max: 0.18, slot: "armor", family: "prefix", weight: 6 },
    { id: "selfGuard", label: "Counter Guard", stat: "selfGuard", min: 0.02, max: 0.22, slot: "armor", family: "suffix", weight: 5 },
    { id: "size", label: "Compact", stat: "size", min: -1.9, max: 1.7, slot: "armor", family: "prefix", weight: 4 },
    { id: "swingBoost", label: "Whiplash", stat: "swingBoost", min: 0.04, max: 0.24, slot: "weapon", family: "suffix", weight: 5 },
    { id: "splash", label: "Explosive", stat: "splash", min: 8, max: 46, slot: "weapon", family: "suffix", weight: 5 },
    { id: "hitShotChance", label: "Shrapnel", stat: "hitShotChance", min: 0.06, max: 0.28, slot: "weapon", family: "suffix", weight: 4 },
    { id: "furyOnKill", label: "Wrathborn", stat: "furyOnKill", min: 1, max: 7, slot: "any", family: "suffix", weight: 5 },
    { id: "legendaryChance", label: "Treasure", stat: "legendaryChance", min: 0.01, max: 0.07, slot: "armor", family: "prefix", weight: 5 },
    { id: "glitchGainMul", label: "Glitchdrive", stat: "glitchGainMul", min: 0.08, max: 0.4, slot: "armor", family: "prefix", weight: 5 },
    { id: "hpFlat", label: "Titan", stat: "hpFlat", min: 18, max: 120, slot: "armor", family: "prefix", weight: 7 },
    { id: "burstDamageMul", label: "Ritual", stat: "burstDamageMul", min: 0.06, max: 0.26, slot: "weapon", family: "suffix", weight: 4 },
    { id: "executeThreshold", label: "Reaper", stat: "executeThreshold", min: 0.02, max: 0.11, slot: "weapon", family: "suffix", weight: 3 },
    { id: "chainChance", label: "Stormbound", stat: "chainChance", min: 0.05, max: 0.2, slot: "armor", family: "suffix", weight: 4 },
  ];

  const LEGENDARY_AFFIX_POOL = [
    { id: "cubic_scatter", label: "Cubic Chaos", desc: "Scatter scaling explodes", stat: "scatter", add: 3.2 },
    { id: "overflow_core", label: "Singularity Core", desc: "Overflow extreme scaling", stat: "overflow", add: 3.8 },
    { id: "void_multicast", label: "Hydra Trigger", desc: "Swing chain multiplier", stat: "multicast", add: 2.8 },
    { id: "kings_power", label: "King's Force", desc: "Massive base power", stat: "power", add: 4.2 },
    { id: "doom_luck", label: "Fatal Rhythm", desc: "Critical spike package", stat: "lucky", add: 3.6 },
    { id: "death_mark", label: "Black Guillotine", desc: "Execute low-health enemies", stat: "executeThreshold", add: 0.22 },
    { id: "storm_arc", label: "Apex Coil", desc: "Chain shock chance", stat: "chainChance", add: 0.26 },
    { id: "burst_altar", label: "Overheat Burst", desc: "Burst damage multiplier", stat: "burstDamageMul", add: 0.42 },
    { id: "shard_tempest", label: "Shard Tempest", desc: "On-hit shot chance surge", stat: "hitShotChance", add: 0.34 },
  ];

  const MUTATION_POOL = [
    { id: "fracture", name: "Fracture Core", desc: "Damage +18% / HP -10%" },
    { id: "magnet", name: "Gravity Well", desc: "Pickup +56 / Vacuum pulse +" },
    { id: "coil", name: "Chain Coil", desc: "Chain chance +12% / Overflow +" },
    { id: "phase", name: "Phase Sprint", desc: "Move +30 / Handling +10%" },
    { id: "bastion", name: "Bastion Skin", desc: "Mitigation +10% / Max HP +42" },
    { id: "bloodrift", name: "Blood Rift", desc: "Execute +8% / Burst +22%" },
  ];

  const JOBS = {
    vanguard: {
      name: "Vanguard",
      hp: 172,
      bodySize: 11,
      move: 198,
      damage: 17,
      attackRate: 0.38,
      crit: 0.04,
      pickup: 72,
      damageCap: 3.9,
      damageMul: 1.08,
      flavor: "高耐久前衛",
    },
    shadow: {
      name: "Shadow",
      hp: 126,
      bodySize: 10,
      move: 258,
      damage: 14,
      attackRate: 0.25,
      crit: 0.12,
      pickup: 86,
      damageCap: 2.8,
      damageMul: 0.97,
      flavor: "高速クリティカル",
    },
    arcanist: {
      name: "Arcanist",
      hp: 116,
      bodySize: 9,
      move: 220,
      damage: 22,
      attackRate: 0.35,
      crit: 0.07,
      pickup: 96,
      damageCap: 3.3,
      damageMul: 1.16,
      flavor: "高火力魔導",
    },
    reaver: {
      name: "Reaver",
      hp: 148,
      bodySize: 10.5,
      move: 230,
      damage: 19,
      attackRate: 0.31,
      crit: 0.08,
      pickup: 82,
      damageCap: 3.4,
      damageMul: 1.1,
      flavor: "バランス型",
    },
  };

  const WEAPONS = {
    greatsword: {
      name: "Iron Nunchaku",
      damageBonus: 14,
      attackRateBonus: 0.04,
      moveBonus: -16,
      critBonus: 0.02,
      pickupBonus: 0,
      projectileSpeed: 0,
      extraProjectiles: 0,
      spread: 0,
      splash: 28,
      critMul: 0.26,
      damageCap: 1.2,
      damageMul: 1.22,
      chainLength: 84,
      headRadius: 11,
      swingAssist: 1.02,
      swingDamageMul: 1.12,
      selfGuard: 0.04,
      bodySizeBonus: 0.7,
    },
    dualblades: {
      name: "Quick Chain",
      damageBonus: 4,
      attackRateBonus: -0.08,
      moveBonus: 12,
      critBonus: 0.06,
      pickupBonus: 8,
      projectileSpeed: 0,
      extraProjectiles: 1,
      spread: 0,
      splash: 12,
      critMul: 0.12,
      damageCap: 0.6,
      damageMul: 0.93,
      chainLength: 72,
      headRadius: 9,
      swingAssist: 1.28,
      swingDamageMul: 0.92,
      selfGuard: 0.08,
      bodySizeBonus: -0.2,
    },
    warbow: {
      name: "Heavy Flail",
      damageBonus: 8,
      attackRateBonus: -0.03,
      moveBonus: 4,
      critBonus: 0.1,
      pickupBonus: 4,
      projectileSpeed: 0,
      extraProjectiles: 0,
      spread: 0,
      splash: 0,
      critMul: 0.38,
      damageCap: 0.85,
      damageMul: 1.06,
      chainLength: 100,
      headRadius: 13,
      swingAssist: 0.9,
      swingDamageMul: 1.28,
      selfGuard: 0.02,
      bodySizeBonus: 0.9,
    },
    voidstaff: {
      name: "Void Chaku",
      damageBonus: 12,
      attackRateBonus: 0.02,
      moveBonus: -6,
      critBonus: 0.03,
      pickupBonus: 14,
      projectileSpeed: 0,
      extraProjectiles: 0,
      spread: 0,
      splash: 24,
      critMul: 0.2,
      damageCap: 1.0,
      damageMul: 1.12,
      chainLength: 92,
      headRadius: 12,
      swingAssist: 1.06,
      swingDamageMul: 1.18,
      selfGuard: 0.06,
      bodySizeBonus: 0.2,
    },
  };

  const ENEMY_ARCHETYPES = [
    {
      id: "raider",
      name: "Raider",
      role: "chaser",
      hp: 1.05,
      speed: 1.15,
      damage: 1.08,
      r: 10,
      color: "#ff6f6f",
      weight: 8,
    },
    {
      id: "stalker",
      name: "Stalker",
      role: "chaser",
      hp: 0.72,
      speed: 1.62,
      damage: 1.02,
      r: 9,
      color: "#ff8aa1",
      weight: 6,
    },
    {
      id: "brute",
      name: "Brute",
      role: "bruiser",
      hp: 1.95,
      speed: 0.82,
      damage: 1.58,
      r: 13,
      color: "#ff995d",
      weight: 5,
    },
    {
      id: "reaper",
      name: "Reaper",
      role: "zoner",
      hp: 1.2,
      speed: 1.18,
      damage: 2.2,
      r: 10,
      color: "#ffc57b",
      weight: 3,
    },
  ];

  const MINIBOSS_PROFILES = [
    {
      id: "warden",
      name: "Chain Warden",
      title: "DUELIST",
      color: "#ffd89d",
      weight: 4,
      hpMul: 1.02,
      speedMul: 1.12,
      damageMul: 1.04,
      dashCdMul: 0.74,
      slamCdMul: 1.12,
      callCdMul: 1.2,
      dashMul: 1.26,
      slamRadiusMul: 0.9,
      slamDamageMul: 0.95,
      reinforceMul: 0.78,
      hazardScatter: 0.92,
      touchMul: 1.08,
    },
    {
      id: "reaver",
      name: "Abyss Reaver",
      title: "JUGGERNAUT",
      color: "#ffb487",
      weight: 3,
      hpMul: 1.28,
      speedMul: 0.92,
      damageMul: 1.22,
      dashCdMul: 0.98,
      slamCdMul: 0.76,
      callCdMul: 1.28,
      dashMul: 1.04,
      slamRadiusMul: 1.22,
      slamDamageMul: 1.24,
      reinforceMul: 0.86,
      hazardScatter: 1.2,
      touchMul: 1.22,
    },
    {
      id: "executioner",
      name: "Rift Executioner",
      title: "HUNTER",
      color: "#ffb6ab",
      weight: 2.2,
      hpMul: 0.96,
      speedMul: 1.18,
      damageMul: 1.3,
      dashCdMul: 0.66,
      slamCdMul: 1.22,
      callCdMul: 1.18,
      dashMul: 1.38,
      slamRadiusMul: 0.84,
      slamDamageMul: 1.02,
      reinforceMul: 0.72,
      hazardScatter: 0.88,
      touchMul: 1.34,
    },
    {
      id: "tyrant",
      name: "Torque Tyrant",
      title: "WARLORD",
      color: "#ffd9a1",
      weight: 1.8,
      hpMul: 1.14,
      speedMul: 1.02,
      damageMul: 1.08,
      dashCdMul: 0.92,
      slamCdMul: 1.04,
      callCdMul: 0.62,
      dashMul: 1.08,
      slamRadiusMul: 1,
      slamDamageMul: 1.08,
      reinforceMul: 1.42,
      hazardScatter: 1.1,
      touchMul: 1.12,
    },
  ];

  const MINIBOSS_PROFILE_BY_ID = MINIBOSS_PROFILES.reduce(function (acc, profile) {
    acc[profile.id] = profile;
    return acc;
  }, {});

  const BOSS_BOONS = [
    { id: "overdrive", label: "Overdrive Core", desc: "Swing speed and damage up" },
    { id: "hardskin", label: "Hardskin Matrix", desc: "HP and mitigation up" },
    { id: "magnetdrive", label: "Magnet Drive", desc: "Pickup and vacuum up" },
    { id: "chainstorm", label: "Chain Storm", desc: "Splash and rate up" },
    { id: "frenzycore", label: "Frenzy Core", desc: "Fury and chain chance up" },
  ];

  const NAME_LEFT = ["Astra", "Nyx", "Dante", "Riven", "Kai", "Luna", "Vex", "Iris", "Noa", "Rei"];
  const NAME_RIGHT = ["Drake", "Vorn", "Hex", "Vale", "Ark", "Rift", "Crow", "Nova", "Shade", "Rune"];

  const DEFAULT_JOB = "vanguard";
  const DEFAULT_WEAPON = "greatsword";

  let selectedBuild = {
    name: "",
    jobId: DEFAULT_JOB,
    weaponId: DEFAULT_WEAPON,
  };

  const audio = {
    enabled: true,
    ctx: null,
    master: null,
    duck: null,
    compressor: null,
  };

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function normalizeSystemSettings(value) {
    const settings = value || {};
    const textMode = settings.combatTextMode;
    return {
      combatTextMode: textMode === "off" || textMode === "full" ? textMode : "low",
      flashFx: settings.flashFx !== false,
      shakeFx: settings.shakeFx !== false,
    };
  }

  function rand(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function pickWeighted(list, weightKey) {
    if (!list.length) return null;
    let total = 0;
    for (const item of list) {
      total += Math.max(0, Number(item[weightKey] || 0));
    }
    if (total <= 0) return pick(list);

    let roll = Math.random() * total;
    for (const item of list) {
      roll -= Math.max(0, Number(item[weightKey] || 0));
      if (roll <= 0) return item;
    }
    return list[list.length - 1];
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function distanceSqToSegment(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const abLenSq = abx * abx + aby * aby;
    if (abLenSq <= 0.0001) {
      const dx = px - ax;
      const dy = py - ay;
      return dx * dx + dy * dy;
    }
    const t = clamp((apx * abx + apy * aby) / abLenSq, 0, 1);
    const cx = ax + abx * t;
    const cy = ay + aby * t;
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy;
  }

  function computeMilestoneProgress(wave, interval) {
    if (!interval || interval <= 0) return 0;
    const safeWave = Math.max(1, Math.floor(wave || 1));
    const slot = ((safeWave - 1) % interval) + 1;
    return clamp(slot / interval, 0, 1);
  }

  function formatSec(v) {
    return Number(v).toFixed(1);
  }

  function scalePlayerHpBase(value) {
    return Math.max(1, Math.round((value || 0) * PLAYER_HP_CLASS_MUL));
  }

  function scalePlayerHpDelta(value) {
    return Math.round((value || 0) * PLAYER_HP_CLASS_MUL);
  }

  function createCoreAffixMap(initial) {
    const map = {};
    for (const id of CORE_AFFIX_IDS) {
      map[id] = initial && typeof initial[id] === "number" ? initial[id] : 0;
    }
    return map;
  }

  function createEquipmentBonusTemplate() {
    return {
      power: 0,
      multicast: 0,
      scatter: 0,
      overflow: 0,
      lucky: 0,
      damageMul: 0,
      attackRateMul: 0,
      move: 0,
      pickup: 0,
      mitigation: 0,
      splash: 0,
      hitShotChance: 0,
      furyOnKill: 0,
      legendaryChance: 0,
      glitchGainMul: 0,
      hpFlat: 0,
      executeThreshold: 0,
      burstDamageMul: 0,
      chainChance: 0,
      selfGuard: 0,
      size: 0,
      swingBoost: 0,
    };
  }

  function formatItemStat(stat, value) {
    if (
      [
        "damageMul",
        "attackRateMul",
        "mitigation",
        "legendaryChance",
        "glitchGainMul",
        "executeThreshold",
        "burstDamageMul",
        "chainChance",
        "selfGuard",
        "swingBoost",
        "hitShotChance",
      ].includes(stat)
    ) {
      return `${Math.round(value * 100)}%`;
    }
    if (stat === "size") {
      const sign = value >= 0 ? "+" : "";
      return `${sign}${value.toFixed(1)}`;
    }
    if (["power", "multicast", "scatter", "overflow", "lucky"].includes(stat)) {
      return `+${value.toFixed(2)}`;
    }
    return `+${Math.round(value)}`;
  }

  function rarityRank(rarity) {
    if (rarity === "legendary") return 4;
    if (rarity === "rare") return 3;
    if (rarity === "magic") return 2;
    return 1;
  }

  function rollRarity(legendaryBias) {
    const roll = Math.random();
    const bias = legendaryBias || 0;
    if (roll < 0.0008 + bias * 0.05) return "legendary";
    if (roll < 0.02 + bias * 0.06) return "rare";
    if (roll < 0.18 + bias * 0.08) return "magic";
    return "common";
  }

  function rollLegendaryAffixChance(rarity, legendaryBias) {
    const base = LEGENDARY_AFFIX_CHANCE[rarity] || 0.01;
    const bias = clamp((legendaryBias || 0) * 0.18, 0, 0.02);
    return clamp(base * 0.22 + bias, 0, 0.24);
  }

  function getAffixCandidates(slot, used) {
    return RANDOM_AFFIX_POOL.filter(function (a) {
      if (a.slot !== "any" && a.slot !== slot) return false;
      return !used.has(a.id);
    });
  }

  function rollItemValue(affix, rarity) {
    const meta = ITEM_RARITY[rarity] || ITEM_RARITY.common;
    const raw = rand(affix.min, affix.max);
    return raw * rand(meta.minRoll, meta.maxRoll);
  }

  function computeItemPower(item) {
    if (!item || !item.bonuses) return 0;
    const b = item.bonuses;
    const score =
      (b.power || 0) * 22 +
      (b.multicast || 0) * 48 +
      (b.scatter || 0) * 18 +
      (b.overflow || 0) * 20 +
      (b.lucky || 0) * 19 +
      (b.damageMul || 0) * 340 +
      (b.attackRateMul || 0) * 310 +
      (b.move || 0) * 1.3 +
      (b.pickup || 0) * 1 +
      (b.mitigation || 0) * 460 +
      (b.splash || 0) * 2.2 +
      (b.hitShotChance || 0) * 420 +
      (b.furyOnKill || 0) * 25 +
      (b.legendaryChance || 0) * 500 +
      (b.glitchGainMul || 0) * 210 +
      (b.hpFlat || 0) * 2.4 +
      (b.executeThreshold || 0) * 560 +
      (b.burstDamageMul || 0) * 320 +
      (b.chainChance || 0) * 280 +
      (b.selfGuard || 0) * 330 +
      Math.abs(b.size || 0) * 46 +
      (b.swingBoost || 0) * 390;

    return Math.max(0, Math.round(score));
  }

  function getItemSalvageValue(item) {
    if (!item) return 0;
    const rarity = ITEM_RARITY[item.rarity] || ITEM_RARITY.common;
    const bonus = item.legendaryAffix ? 2 : 0;
    return rarity.salvage + bonus;
  }

  function getAffixImpactScore(stat, value) {
    const probe = createEquipmentBonusTemplate();
    probe[stat] = value;
    return computeItemPower({ bonuses: probe });
  }

  function rebuildItemName(item) {
    const prefixAffix = item.affixes.find((a) => a.family === "prefix") || item.affixes[0] || null;
    const suffixAffix =
      item.affixes.find((a) => a.family !== "prefix") || item.affixes[item.affixes.length - 1] || null;
    const prefix = prefixAffix ? `${prefixAffix.label} ` : "";
    const suffix = suffixAffix ? ` of ${suffixAffix.label}` : "";
    item.name = `${prefix}${item.baseName}${suffix}`;
  }

  function rebuildItemBonuses(item) {
    const bonuses = createEquipmentBonusTemplate();
    for (const affix of item.affixes || []) {
      if (!affix || !affix.stat) continue;
      bonuses[affix.stat] += affix.value || 0;
    }
    if (item.legendaryAffix && item.legendaryAffix.stat) {
      bonuses[item.legendaryAffix.stat] += item.legendaryAffix.value || 0;
    }
    item.bonuses = bonuses;
    item.power = computeItemPower(item);
    item.tier = scoreToTierLabel(item.power);
    item.salvageValue = getItemSalvageValue(item);
    item.color = (ITEM_RARITY[item.rarity] || ITEM_RARITY.common).color;
    rebuildItemName(item);
    return item;
  }

  function scoreToTierLabel(score) {
    if (score >= 1450) return "S";
    if (score >= 1080) return "A";
    if (score >= 760) return "B";
    if (score >= 460) return "C";
    return "D";
  }

  function normalizeItem(item) {
    if (!item || typeof item !== "object") return null;
    if (item.slot && LEGACY_SLOT_MAP[item.slot]) {
      item.slot = LEGACY_SLOT_MAP[item.slot];
    }
    if (!item.slot || !ITEM_SLOT_LABEL[item.slot]) return null;
    if (!item.bonuses) item.bonuses = createEquipmentBonusTemplate();
    if (!Array.isArray(item.affixes)) item.affixes = [];
    if (!item.rarity || !ITEM_RARITY[item.rarity]) item.rarity = "common";

    const rarityMeta = ITEM_RARITY[item.rarity] || ITEM_RARITY.common;
    item.rarityLabel = item.rarityLabel || rarityMeta.label;
    item.color = item.color || rarityMeta.color;
    item.baseName = item.baseName || pick(ITEM_BASES[item.slot] || ITEM_BASES.weapon);
    item.name = item.name || `${item.baseName}`;
    item.power = typeof item.power === "number" ? item.power : computeItemPower(item);
    item.tier = item.tier || scoreToTierLabel(item.power);
    item.salvageValue = typeof item.salvageValue === "number" ? item.salvageValue : getItemSalvageValue(item);
    if (!item.id) {
      item.id = `itm_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
    }
    return item;
  }

  function generateRandomItem(options) {
    const opts = options || {};
    const rawSlot = opts.slot || pick(ITEM_SLOTS);
    const slot = LEGACY_SLOT_MAP[rawSlot] || rawSlot;
    const rarity = opts.rarity || rollRarity(opts.legendaryBias || 0);
    const rarityMeta = ITEM_RARITY[rarity] || ITEM_RARITY.common;
    const baseName = pick(ITEM_BASES[slot] || ITEM_BASES.weapon);
    const affixCount = rarityMeta.affixes;

    const used = new Set();
    const rolled = [];
    const bonuses = createEquipmentBonusTemplate();

    function rollOneAffix(candidates) {
      if (!candidates.length) return null;
      const affix = pickWeighted(candidates, "weight");
      if (!affix) return null;
      used.add(affix.id);

      const raw = rollItemValue(affix, rarity);
      const value = clamp(raw, affix.min * 0.65, affix.max * 2.3);
      const rollPct = clamp((value - affix.min) / Math.max(0.0001, affix.max - affix.min), 0, 1);
      const rolledAffix = {
        id: affix.id,
        label: affix.label,
        family: affix.family || "suffix",
        stat: affix.stat,
        value,
        rollPct,
        text: `${affix.label} ${formatItemStat(affix.stat, value)} (${Math.round(rollPct * 100)}%)`,
      };
      bonuses[affix.stat] += value;
      rolled.push(rolledAffix);
      return rolledAffix;
    }

    if (affixCount >= 2) {
      const prefixCandidates = getAffixCandidates(slot, used).filter((a) => a.family === "prefix");
      const suffixCandidates = getAffixCandidates(slot, used).filter((a) => a.family !== "prefix");
      if (prefixCandidates.length) rollOneAffix(prefixCandidates);
      if (suffixCandidates.length) rollOneAffix(suffixCandidates);
    }

    while (rolled.length < affixCount) {
      const candidates = getAffixCandidates(slot, used);
      if (!candidates.length) break;
      rollOneAffix(candidates);
    }

    let legendaryAffix = null;
    const forcedLegendaryAffix = !!opts.forceLegendaryAffix;
    const legendaryAffixRoll = rollLegendaryAffixChance(rarity, opts.legendaryBias || 0);
    if (forcedLegendaryAffix || Math.random() < legendaryAffixRoll) {
      const leg = pick(LEGENDARY_AFFIX_POOL);
      legendaryAffix = {
        id: leg.id,
        label: leg.label,
        stat: leg.stat,
        value: leg.add,
        desc: leg.desc,
        text: `${leg.label} ${formatItemStat(leg.stat, leg.add)} (${leg.desc})`,
      };
      bonuses[leg.stat] += leg.add;
    }

    const prefixAffix = rolled.find((a) => a.family === "prefix") || rolled[0] || null;
    const suffixAffix = rolled.find((a) => a.family !== "prefix") || rolled[rolled.length - 1] || null;
    const prefix = prefixAffix ? `${prefixAffix.label} ` : "";
    const suffix = suffixAffix ? ` of ${suffixAffix.label}` : "";
    const name = `${prefix}${baseName}${suffix}`;
    const power = computeItemPower({ bonuses });
    const tier = scoreToTierLabel(power);

    return {
      id: `itm_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`,
      slot,
      rarity,
      rarityLabel: rarityMeta.label,
      color: rarityMeta.color,
      baseName,
      name,
      affixes: rolled,
      legendaryAffix,
      bonuses,
      power,
      tier,
      salvageValue: getItemSalvageValue({ rarity, legendaryAffix }),
    };
  }

  function computeEquipmentBonusesFromEquipped() {
    const out = createEquipmentBonusTemplate();
    for (const slot of ITEM_SLOTS) {
      const item = state.equippedItems[slot];
      if (!item || !item.bonuses) continue;
      const b = item.bonuses;
      for (const key of Object.keys(out)) {
        out[key] += b[key] || 0;
      }
    }
    return out;
  }

  function applyEquipmentBonuses() {
    const prev = state.equipmentBonuses || createEquipmentBonusTemplate();
    const b = computeEquipmentBonusesFromEquipped();
    const equippedCount = ITEM_SLOTS.reduce(function (count, slot) {
      return count + (state.equippedItems[slot] ? 1 : 0);
    }, 0);
    const legendaryCount = ITEM_SLOTS.reduce(function (count, slot) {
      const item = state.equippedItems[slot];
      return count + (item && item.legendaryAffix ? 1 : 0);
    }, 0);
    if (equippedCount >= 2) {
      b.damageMul += 0.1;
      b.attackRateMul += 0.06;
      b.glitchGainMul += 0.2;
      b.overflow += 0.7;
      b.scatter += 0.52;
      b.swingBoost += 0.08;
    }
    if (legendaryCount >= 2) {
      b.chainChance += 0.12;
      b.burstDamageMul += 0.2;
      b.executeThreshold += 0.05;
      b.damageMul += 0.16;
      b.multicast += 0.38;
      b.furyOnKill += 3;
      b.selfGuard += 0.08;
    }
    state.equipmentBonuses = b;
    state.affixes = createCoreAffixMap();
    state.affixes.power = b.power;
    state.affixes.multicast = b.multicast;
    state.affixes.scatter = b.scatter;
    state.affixes.overflow = b.overflow;
    state.affixes.lucky = b.lucky;

    if (state.player) {
      const hpDelta = scalePlayerHpDelta((b.hpFlat || 0) - (prev.hpFlat || 0));
      if (hpDelta !== 0) {
        state.player.maxHp = Math.max(1, state.player.maxHp + hpDelta);
        state.player.hp = clamp(state.player.hp + hpDelta, 1, state.player.maxHp);
      }
    }
  }

  function equipItemDirect(item, source) {
    const normalized = normalizeItem(item);
    if (!normalized) return false;
    const slot = normalized.slot;
    if (!slot || !state.equippedItems) return false;
    const prev = state.equippedItems[slot] || null;
    state.equippedItems[slot] = normalized;
    state.selectedGearSlot = slot;
    state.selectedInventoryItemId = null;
    applyEquipmentBonuses();
    renderEquipmentUi();
    renderAffixList();
    if (source) {
      if (prev) {
        log(`${source}: equipped ${normalized.rarityLabel} ${normalized.baseName} (replaced ${prev.rarityLabel} ${prev.baseName}).`);
      } else {
        log(`${source}: equipped ${normalized.rarityLabel} ${normalized.baseName}.`);
      }
    }
    return true;
  }

  function queuePickupItem(item, source) {
    const normalized = normalizeItem(item);
    if (!normalized) return null;
    if (!Array.isArray(state.pendingPickupQueue)) state.pendingPickupQueue = [];
    if (state.pauseMode || getPendingPickupItem()) {
      state.pendingPickupQueue.push({ item: normalized, source: source || "Loot" });
      return "queued";
    }
    return openPickupCompareModal(normalized, source || "Loot") ? "pause" : null;
  }

  function addItemToInventory(item, source) {
    return queuePickupItem(item, source || "Loot");
  }

  function getSelectedInventoryItem() {
    return null;
  }

  function normalizeAffixRune(rune) {
    if (!rune || typeof rune !== "object" || !rune.stat || typeof rune.value !== "number") return null;
    const rarityColor = rune.legendary ? "#ffad67" : rune.color || "#88bfff";
    return {
      id: rune.id || `rune_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`,
      label: rune.label || rune.stat,
      stat: rune.stat,
      value: rune.value,
      family: rune.family || "suffix",
      quality: clamp(Math.round(rune.quality || 70), 1, 100),
      legendary: !!rune.legendary,
      color: rarityColor,
      text:
        rune.text ||
        `${rune.legendary ? "LEGENDARY " : ""}${rune.label || rune.stat} ${formatItemStat(rune.stat, rune.value)} (${clamp(
          Math.round(rune.quality || 70),
          1,
          100
        )}%)`,
    };
  }

  function getSelectedRune() {
    if (!state.selectedRuneId) return null;
    return state.affixRunes.find((r) => r.id === state.selectedRuneId) || null;
  }

  function selectAffixRune(runeId) {
    if (!runeId || !state.affixRunes.some((r) => r.id === runeId)) {
      state.selectedRuneId = null;
    } else {
      state.selectedRuneId = runeId;
    }
    renderEquipmentUi();
  }

  function selectInventoryItem(itemId) {
    state.selectedInventoryItemId = null;
    renderEquipmentUi();
  }

  function equipItemById(itemId) {
    log("Inventory is disabled: pick gear from drop compare only.");
  }

  function unequipSlot(slot) {
    log("Inventory is disabled: unequip is unavailable.");
  }

  function salvageItemById(itemId) {
    log("Inventory is disabled: salvage from inventory is unavailable.");
  }

  function getCraftTarget() {
    const slot = state.selectedGearSlot;
    if (slot && state.equippedItems[slot]) {
      return { item: state.equippedItems[slot], source: "equipped", slot };
    }
    return null;
  }

  function extractAffixFromSelected() {
    const target = getCraftTarget();
    if (!target) {
      log("Extract needs an equipped slot selection.");
      return;
    }
    const item = target.item;
    const options = [];
    for (const affix of item.affixes || []) {
      options.push({
        label: affix.label,
        stat: affix.stat,
        value: affix.value,
        quality: Math.round((affix.rollPct || 0.72) * 100),
        family: affix.family || "suffix",
        color: item.color,
        legendary: false,
      });
    }
    if (item.legendaryAffix) {
      options.push({
        label: item.legendaryAffix.label,
        stat: item.legendaryAffix.stat,
        value: item.legendaryAffix.value,
        quality: 100,
        family: "legendary",
        color: "#ffad67",
        legendary: true,
      });
    }
    if (!options.length) {
      log("This item has no extractable affix.");
      return;
    }

    const source =
      item.legendaryAffix && Math.random() < 0.62
        ? options.find((o) => o.legendary) || pick(options)
        : pick(options);
    const extractionScale = source.legendary ? 1 : rand(0.88, 1.06);
    const rune = normalizeAffixRune({
      id: `rune_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`,
      label: source.label,
      stat: source.stat,
      value: source.value * extractionScale,
      quality: source.legendary ? 100 : clamp(Math.round((source.quality || 72) * rand(0.92, 1.08)), 35, 99),
      family: source.family,
      color: source.color,
      legendary: source.legendary,
      text: `${source.legendary ? "LEG " : ""}${source.label} ${formatItemStat(
        source.stat,
        source.value * extractionScale
      )}`,
    });
    if (!rune) return;

    if (target.source === "equipped" && target.slot) {
      state.equippedItems[target.slot] = null;
      state.selectedGearSlot = null;
      applyEquipmentBonuses();
    }
    state.credits += Math.max(1, Math.round(getItemSalvageValue(item) * 0.5));
    state.selectedInventoryItemId = null;

    state.affixRunes.unshift(rune);
    if (state.affixRunes.length > 24) state.affixRunes.length = 24;
    state.selectedRuneId = rune.id;
    log(`Extracted rune: ${rune.text} from ${item.rarityLabel} ${item.baseName} (item consumed).`);
    renderEquipmentUi();
    renderAffixList();
  }

  function imprintSelectedRune() {
    const rune = getSelectedRune();
    if (!rune) {
      log("Select a rune to imprint.");
      return;
    }

    const target = getCraftTarget();
    if (!target) {
      log("Select equipped slot target first.");
      return;
    }

    const cost = rune.legendary ? 4 : 2;
    if (state.credits < cost) {
      log(`Need ${cost} credits to imprint.`);
      return;
    }

    const item = target.item;
    if (rune.legendary && item.rarity !== "legendary") {
      log("Legendary rune requires legendary base item.");
      return;
    }

    state.credits -= cost;

    if (rune.legendary) {
      item.legendaryAffix = {
        id: `imprint_${rune.id}`,
        label: rune.label,
        stat: rune.stat,
        value: rune.value,
        desc: "Imprinted legendary aspect",
        text: `${rune.label} ${formatItemStat(rune.stat, rune.value)} (Imprinted)`,
      };
    } else {
      const newValue = clamp(rune.value * rand(0.94, 1.12), rune.value * 0.86, rune.value * 1.2);
      let affix = item.affixes.find((a) => a.stat === rune.stat);
      if (affix) {
        affix.value = newValue;
        affix.rollPct = clamp(Math.max(affix.rollPct || 0, 0.78), 0, 1);
        affix.label = rune.label;
        affix.family = affix.family || rune.family || "suffix";
        affix.text = `${affix.label} ${formatItemStat(affix.stat, affix.value)} (${Math.round(
          affix.rollPct * 100
        )}%)`;
      } else {
        const maxAffixes = (ITEM_RARITY[item.rarity] || ITEM_RARITY.common).affixes;
        const crafted = {
          id: `imprint_${rune.id}`,
          label: rune.label,
          family: rune.family || "suffix",
          stat: rune.stat,
          value: newValue,
          rollPct: clamp(rune.quality / 100, 0, 1),
          text: `${rune.label} ${formatItemStat(rune.stat, newValue)} (${rune.quality}%)`,
        };
        if (item.affixes.length < maxAffixes) {
          item.affixes.push(crafted);
        } else {
          let replaceIndex = 0;
          let minImpact = Infinity;
          for (let i = 0; i < item.affixes.length; i += 1) {
            const a = item.affixes[i];
            const impact = getAffixImpactScore(a.stat, a.value);
            if (impact < minImpact) {
              minImpact = impact;
              replaceIndex = i;
            }
          }
          item.affixes[replaceIndex] = crafted;
        }
      }
    }

    rebuildItemBonuses(item);

    const runeIdx = state.affixRunes.findIndex((r) => r.id === rune.id);
    if (runeIdx >= 0) state.affixRunes.splice(runeIdx, 1);
    state.selectedRuneId = state.affixRunes[0] ? state.affixRunes[0].id : null;

    if (target.source === "equipped") {
      applyEquipmentBonuses();
      renderAffixList();
    }
    log(`Imprinted ${rune.label} on ${item.baseName} (-${cost}C).`);
    if (state.running) {
      spawnFloatText(state.player.x, state.player.y - 24, "IMPRINT", "#a5d8ff", 12, 0.45);
    }
    renderEquipmentUi();
    updateHud();
  }

  function reforgeCraftTarget() {
    const target = getCraftTarget();
    if (!target) {
      log("Select item or equipped slot for reforge.");
      return;
    }

    const item = target.item;
    const baseCost = item.rarity === "legendary" ? 4 : item.rarity === "rare" ? 3 : item.rarity === "magic" ? 2 : 1;
    if (state.credits < baseCost) {
      log(`Need ${baseCost} credits for reforge.`);
      return;
    }

    state.credits -= baseCost;
    const rerolled = generateRandomItem({ slot: item.slot, rarity: item.rarity });
    const keepCount = Math.max(1, Math.min(item.affixes.length || 1, rerolled.affixes.length));
    item.affixes = rerolled.affixes.slice(0, keepCount);
    if (!item.legendaryAffix && rerolled.legendaryAffix && Math.random() < 0.1) {
      item.legendaryAffix = rerolled.legendaryAffix;
    }
    rebuildItemBonuses(item);

    if (target.source === "equipped") {
      applyEquipmentBonuses();
      renderAffixList();
    }

    if (state.running) {
      spawnFloatText(state.player.x, state.player.y - 24, "REFORGE", "#ffd6a8", 12, 0.45);
    }
    log(`Reforged ${item.baseName} (-${baseCost}C).`);
    renderEquipmentUi();
    updateHud();
  }

  function formatItemCardSummary(item) {
    const affixHead =
      item.affixes && item.affixes.length ? item.affixes.slice(0, 2).map((a) => a.label).join(" / ") : "No affix";
    const leg = item.legendaryAffix ? ` LEG:${item.legendaryAffix.label}` : "";
    return `[${item.rarityLabel}][${item.tier}${item.power}] ${item.baseName} (${ITEM_SLOT_LABEL[item.slot]}) ${affixHead}${leg}`;
  }

  function getInspectionSelection() {
    if (state.selectedGearSlot && state.equippedItems[state.selectedGearSlot]) {
      return {
        item: state.equippedItems[state.selectedGearSlot],
        source: "equipped",
        slot: state.selectedGearSlot,
      };
    }
    return null;
  }

  function getReforgeCost(item) {
    if (!item) return 0;
    if (item.rarity === "legendary") return 4;
    if (item.rarity === "rare") return 3;
    if (item.rarity === "magic") return 2;
    return 1;
  }

  function getImprintCost(rune) {
    return rune && rune.legendary ? 4 : 2;
  }

  function buildItemDetail(selection) {
    const item = selection ? selection.item : null;
    if (!item) {
      return "Tap equipped gear slot to inspect.";
    }
    const lines = [];
    lines.push(`${selection.source === "equipped" ? "EQUIPPED" : "INVENTORY"} · ${ITEM_SLOT_LABEL[item.slot]}`);
    const topAffixes = (item.affixes || []).slice(0, 3);
    for (const affix of topAffixes) {
      lines.push(`${affix.label}: ${formatItemStat(affix.stat, affix.value)}`);
    }
    if ((item.affixes || []).length > 3) lines.push(`+${item.affixes.length - 3} more affixes`);
    if (item.legendaryAffix) {
      lines.push(`LEG ${item.legendaryAffix.label}: ${formatItemStat(item.legendaryAffix.stat, item.legendaryAffix.value)}`);
    }
    return lines.join("\n");
  }

  function getItemPowerDelta(item, source) {
    if (!item) return 0;
    if (source === "equipped") return 0;
    const equipped = state.equippedItems[item.slot];
    return equipped ? item.power - (equipped.power || 0) : item.power;
  }

  function renderRuneList() {
    if (!ui.runeList) return;
    ui.runeList.innerHTML = "";
    if (!state.affixRunes.length) {
      const div = document.createElement("div");
      div.className = "rune-card";
      div.textContent = "No runes. Select equipped gear and Extract.";
      ui.runeList.appendChild(div);
      return;
    }

    state.affixRunes
      .slice()
      .sort(function (a, b) {
        if (a.legendary !== b.legendary) return a.legendary ? -1 : 1;
        if (a.quality !== b.quality) return b.quality - a.quality;
        return b.value - a.value;
      })
      .forEach(function (rune) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "rune-card";
        if (state.selectedRuneId === rune.id) btn.classList.add("selected");
        btn.style.borderColor = rune.color;
        btn.textContent = `${rune.legendary ? "[LEG]" : "[RUNE]"} ${rune.label} ${formatItemStat(
          rune.stat,
          rune.value
        )} · Q${rune.quality}`;
        btn.addEventListener("click", function () {
          selectAffixRune(rune.id);
          updateHud();
        });
        ui.runeList.appendChild(btn);
      });
  }

  function renderEquipmentUi() {
    if (!ui.gearSlots || !ui.itemList) return;

    ui.gearSlots.innerHTML = "";
    for (const slot of ITEM_SLOTS) {
      const item = state.equippedItems[slot];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gear-slot";
      if (state.selectedGearSlot === slot) btn.classList.add("selected");
      if (item) {
        btn.style.borderColor = item.color;
      }
      btn.textContent = item
        ? `${ITEM_SLOT_LABEL[slot]}\n${item.tier}${item.power} ${item.baseName}`
        : `${ITEM_SLOT_LABEL[slot]}\nEmpty`;
      btn.addEventListener("click", function () {
        if (!state.equippedItems[slot]) {
          state.selectedGearSlot = null;
        } else {
          state.selectedGearSlot = state.selectedGearSlot === slot ? null : slot;
          state.selectedInventoryItemId = null;
        }
        renderEquipmentUi();
        updateHud();
      });
      ui.gearSlots.appendChild(btn);
    }

    ui.itemList.innerHTML = "";
    const invNotice = document.createElement("div");
    invNotice.className = "item-card";
    invNotice.textContent = "Inventory removed: drops are Equip / Discard only.";
    ui.itemList.appendChild(invNotice);

    const selected = getInspectionSelection();
    const selectedInventory = null;
    const selectedRune = getSelectedRune();
    const selectedDelta = selected ? getItemPowerDelta(selected.item, selected.source) : 0;
    if (ui.itemDetailTitle) {
      ui.itemDetailTitle.textContent = selected
        ? `${selected.item.rarityLabel} ${selected.item.name}`
        : "Select equipped gear";
      ui.itemDetailTitle.style.color = selected ? selected.item.color : "#ecf7ff";
    }
    if (ui.itemCompareDelta) {
      ui.itemCompareDelta.classList.remove("positive", "negative", "neutral");
      if (!selected) {
        ui.itemCompareDelta.textContent = "Select item to compare";
        ui.itemCompareDelta.classList.add("neutral");
      } else if (selected.source === "equipped") {
        ui.itemCompareDelta.textContent = "Equipped item focus";
        ui.itemCompareDelta.classList.add("neutral");
      } else {
        const deltaText = `${selectedDelta >= 0 ? "+" : ""}${selectedDelta}`;
        ui.itemCompareDelta.textContent = `Power Delta: ${deltaText}`;
        ui.itemCompareDelta.classList.add(selectedDelta > 0 ? "positive" : selectedDelta < 0 ? "negative" : "neutral");
      }
    }
    if (ui.itemDetailStats) {
      ui.itemDetailStats.textContent = buildItemDetail(selected);
    }
    if (ui.itemQuickMeta) {
      ui.itemQuickMeta.innerHTML = "";
      if (selected) {
        const item = selected.item;
        const pills = [];
        pills.push({ text: `${ITEM_SLOT_LABEL[item.slot]}`, cls: "info" });
        pills.push({ text: `PWR ${item.tier}${item.power}`, cls: "info" });
        pills.push({ text: `SALV +${getItemSalvageValue(item)}C`, cls: "warn" });
        pills.push({ text: `REFORGE ${getReforgeCost(item)}C`, cls: "warn" });
        if (selectedRune) {
          const imprintCost = getImprintCost(selectedRune);
          const legendLocked = selectedRune.legendary && item.rarity !== "legendary";
          pills.push({
            text: legendLocked ? `IMPRINT ${imprintCost}C LOCK` : `IMPRINT ${imprintCost}C`,
            cls: legendLocked ? "bad" : "good",
          });
        }
        for (const pill of pills) {
          const span = document.createElement("span");
          span.className = `meta-pill ${pill.cls}`;
          span.textContent = pill.text;
          ui.itemQuickMeta.appendChild(span);
        }
      }
    }
    if (ui.equipItemBtn) ui.equipItemBtn.disabled = true;
    if (ui.salvageItemBtn) ui.salvageItemBtn.disabled = true;
    if (ui.unequipSlotBtn) ui.unequipSlotBtn.disabled = true;
    if (ui.extractAffixBtn) {
      ui.extractAffixBtn.disabled = !selected;
    }
    if (ui.imprintAffixBtn) {
      ui.imprintAffixBtn.disabled = !selectedRune || !selected;
    }
    if (ui.reforgeAffixBtn) {
      ui.reforgeAffixBtn.disabled = !selected;
    }
    if (ui.affixLabHint) {
      if (selectedRune && selected) {
        const imprintCost = getImprintCost(selectedRune);
        const lockText = selectedRune.legendary && selected.item.rarity !== "legendary" ? " (LEG base req)" : "";
        ui.affixLabHint.textContent = `${selectedRune.label} -> ${selected.item.baseName} · ${imprintCost}C${lockText}`;
      } else if (selectedRune) {
        ui.affixLabHint.textContent = `${selectedRune.label} selected · Pick equipped target`;
      } else if (selected) {
        ui.affixLabHint.textContent = `Target: ${selected.item.baseName} · Reforge ${getReforgeCost(selected.item)}C`;
      } else {
        ui.affixLabHint.textContent = "Pick equipped slot for Extract / Imprint / Reforge";
      }
    }

    renderRuneList();
  }

  function initAudio() {
    if (audio.ctx) return true;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;

    try {
      audio.ctx = new AudioCtx();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = 0.15;

      audio.duck = audio.ctx.createGain();
      audio.duck.gain.value = 1;

      audio.compressor = audio.ctx.createDynamicsCompressor();
      audio.compressor.threshold.value = -22;
      audio.compressor.knee.value = 8;
      audio.compressor.ratio.value = 10;
      audio.compressor.attack.value = 0.003;
      audio.compressor.release.value = 0.2;

      audio.duck.connect(audio.compressor);
      audio.compressor.connect(audio.master);
      audio.master.connect(audio.ctx.destination);
      return true;
    } catch (err) {
      return false;
    }
  }

  function ensureAudioReady() {
    if (!audio.enabled) return false;
    if (!initAudio()) return false;
    if (audio.ctx.state === "suspended") {
      audio.ctx.resume().catch(function () {
        // Ignore resume errors in browsers that require explicit gesture.
      });
    }
    return true;
  }

  function setAudioEnabled(nextEnabled) {
    audio.enabled = !!nextEnabled;
    if (initAudio()) {
      const now = audio.ctx.currentTime;
      audio.master.gain.cancelScheduledValues(now);
      audio.master.gain.setTargetAtTime(audio.enabled ? 0.15 : 0.0001, now, 0.02);
    }
    ui.audioBtn.textContent = audio.enabled ? "Audio ON" : "Audio OFF";
    ui.audioBtn.classList.toggle("muted", !audio.enabled);
  }

  function duckAudio(amount, duration) {
    if (!ensureAudioReady()) return;
    const now = audio.ctx.currentTime;
    const to = clamp(amount, 0.28, 1);
    audio.duck.gain.cancelScheduledValues(now);
    audio.duck.gain.setValueAtTime(audio.duck.gain.value, now);
    audio.duck.gain.setTargetAtTime(to, now, 0.01);
    audio.duck.gain.setTargetAtTime(1, now + duration, 0.05);
  }

  function playTone(opts) {
    if (!ensureAudioReady()) return;
    const ctxAudio = audio.ctx;
    const now = ctxAudio.currentTime + (opts.delay || 0);

    const osc = ctxAudio.createOscillator();
    const gain = ctxAudio.createGain();
    const filter = ctxAudio.createBiquadFilter();

    filter.type = opts.filterType || "lowpass";
    filter.frequency.value = opts.cutoff || 3200;
    filter.Q.value = opts.q || 0.8;

    osc.type = opts.type || "sine";
    osc.frequency.setValueAtTime(opts.freq || 440, now);
    if (opts.freqEnd != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, opts.freqEnd), now + (opts.dur || 0.2));
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.00015, opts.gain || 0.05), now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (opts.dur || 0.2));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audio.duck);

    osc.start(now);
    osc.stop(now + (opts.dur || 0.2) + 0.02);
  }

  function playNoise(opts) {
    if (!ensureAudioReady()) return;
    const ctxAudio = audio.ctx;
    const duration = opts.dur || 0.2;
    const sampleCount = Math.max(1, Math.floor(ctxAudio.sampleRate * duration));
    const buffer = ctxAudio.createBuffer(1, sampleCount, ctxAudio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
    }

    const source = ctxAudio.createBufferSource();
    source.buffer = buffer;

    const gain = ctxAudio.createGain();
    gain.gain.value = opts.gain || 0.02;

    const filter = ctxAudio.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = opts.cutoff || 1200;
    filter.Q.value = opts.q || 0.7;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.duck);

    const start = ctxAudio.currentTime + (opts.delay || 0);
    source.start(start);
    source.stop(start + duration + 0.02);
  }

  function playChord(opts) {
    const intervals = Array.isArray(opts.intervals) ? opts.intervals : [];
    const root = opts.root || 440;
    const step = opts.step || 0.02;
    for (let i = 0; i < intervals.length; i += 1) {
      const ratio = Math.pow(2, intervals[i] / 12);
      const freq = root * ratio;
      playTone({
        type: opts.type || "sine",
        freq,
        freqEnd: (opts.endMul || 1.38) * freq,
        gain: (opts.gain || 0.03) * (1 - i * 0.08),
        dur: opts.dur || 0.24,
        delay: (opts.delay || 0) + i * step,
        cutoff: opts.cutoff || 3200,
      });
    }
  }

  function sfxLegendarySpawn() {
    duckAudio(0.54, 0.66);
    playTone({ type: "sawtooth", freq: 95, freqEnd: 235, gain: 0.048, dur: 0.56, cutoff: 980, q: 1.1 });
    playTone({ type: "triangle", freq: 178, freqEnd: 420, gain: 0.042, dur: 0.48, delay: 0.03, cutoff: 1900 });
    playChord({
      type: "sine",
      root: 320,
      intervals: [0, 7, 12, 16],
      gain: 0.056,
      dur: 0.34,
      delay: 0.07,
      step: 0.015,
      cutoff: 3000,
      endMul: 1.22,
    });
    playChord({
      type: "triangle",
      root: 640,
      intervals: [0, 4, 7, 12],
      gain: 0.039,
      dur: 0.3,
      delay: 0.15,
      step: 0.012,
      cutoff: 3600,
      endMul: 1.3,
    });
    playNoise({ dur: 0.2, gain: 0.024, cutoff: 2900, delay: 0.06, q: 1.2 });
    playNoise({ dur: 0.12, gain: 0.014, cutoff: 4200, delay: 0.18, q: 1.4 });
  }

  function sfxLegendaryPickup() {
    duckAudio(0.52, 0.62);
    playTone({ type: "triangle", freq: 210, freqEnd: 410, gain: 0.048, dur: 0.36, cutoff: 1900 });
    playChord({
      type: "sine",
      root: 392,
      intervals: [0, 7, 12, 19],
      gain: 0.064,
      dur: 0.35,
      delay: 0.05,
      step: 0.018,
      cutoff: 3400,
      endMul: 1.26,
    });
    playChord({
      type: "triangle",
      root: 784,
      intervals: [0, 4, 7, 12],
      gain: 0.046,
      dur: 0.26,
      delay: 0.11,
      step: 0.011,
      cutoff: 3900,
      endMul: 1.44,
    });
    playNoise({ dur: 0.13, gain: 0.02, cutoff: 3600, delay: 0.08, q: 1.1 });
    playNoise({ dur: 0.22, gain: 0.012, cutoff: 5200, delay: 0.18, q: 1.6 });
  }

  function sfxLegendaryBeacon() {
    if (!state.running || state.pauseMode) return;
    duckAudio(0.84, 0.18);
    playTone({ type: "sine", freq: 560, freqEnd: 760, gain: 0.015, dur: 0.16, cutoff: 3800 });
    playTone({ type: "triangle", freq: 840, freqEnd: 1120, gain: 0.011, dur: 0.12, delay: 0.03, cutoff: 4200 });
  }

  function sfxCrit() {
    playTone({ type: "square", freq: 930, freqEnd: 510, gain: 0.02, dur: 0.09, cutoff: 3600 });
  }

  function sfxLevelUp() {
    playTone({ type: "triangle", freq: 260, freqEnd: 620, gain: 0.04, dur: 0.18, cutoff: 2400 });
    playTone({ type: "sine", freq: 420, freqEnd: 860, gain: 0.03, dur: 0.22, delay: 0.08, cutoff: 2800 });
  }

  function sfxGlitch(on) {
    if (on) {
      playTone({ type: "sawtooth", freq: 280, freqEnd: 90, gain: 0.045, dur: 0.22, cutoff: 1500 });
      playNoise({ dur: 0.08, gain: 0.014, cutoff: 1900, delay: 0.05 });
    } else {
      playTone({ type: "triangle", freq: 320, freqEnd: 670, gain: 0.03, dur: 0.18, cutoff: 2400 });
    }
  }

  function sfxWave() {
    playTone({ type: "sine", freq: 160, freqEnd: 380, gain: 0.028, dur: 0.16, cutoff: 1800 });
  }

  function sfxGift() {
    playTone({ type: "triangle", freq: 520, freqEnd: 760, gain: 0.026, dur: 0.14, cutoff: 3000 });
    playTone({ type: "sine", freq: 860, freqEnd: 1100, gain: 0.018, dur: 0.12, delay: 0.05, cutoff: 3400 });
  }

  function sfxPlayerHit() {
    playTone({ type: "sawtooth", freq: 180, freqEnd: 72, gain: 0.018, dur: 0.08, cutoff: 1000 });
  }

  function sfxBurst() {
    duckAudio(0.74, 0.2);
    playTone({ type: "sawtooth", freq: 170, freqEnd: 760, gain: 0.05, dur: 0.18, cutoff: 2200 });
    playTone({ type: "triangle", freq: 290, freqEnd: 940, gain: 0.04, dur: 0.16, delay: 0.03, cutoff: 2600 });
  }

  function createState() {
    return {
      running: false,
      lastTs: 0,
      time: 0,
      hudCompact: true,
      settings: normalizeSystemSettings(SYSTEM_SETTINGS_DEFAULTS),
      wave: 1,
      maxWave: Number.POSITIVE_INFINITY,
      waveSpawned: 0,
      enemies: [],
      bullets: [],
      drops: [],
      particles: [],
      floatTexts: [],
      floatTextStamp: {},
      player: {
        x: W * 0.5,
        y: H * 0.74,
        targetX: W * 0.5,
        targetY: H * 0.74,
        vx: 0,
        vy: 0,
        level: 1,
        xp: 0,
        nextXp: 36,
        hp: scalePlayerHpBase(120),
        maxHp: scalePlayerHpBase(120),
        baseRadius: 11,
        r: 11,
        speed: 215,
        baseDamage: 14,
        attackCd: 0,
        attackRate: 0.33,
        pickupRange: 76,
        projectileSpeed: 0,
        critBonus: 0,
        weaponProjectiles: 0,
        weaponSpread: 0.14,
        weaponSplash: 0,
        weaponCritMul: 0,
        jobDamageMul: 1,
        weaponDamageMul: 1,
        swingDamageMul: 1,
        swingAssist: 1,
        weaponReach: 84,
        weaponHeadRadius: 11,
        selfGuard: 0,
        damageCapMul: 3.5,
        invulnTime: 0,
        jobId: DEFAULT_JOB,
        weaponId: DEFAULT_WEAPON,
        name: "",
      },
      character: {
        name: "",
        jobId: DEFAULT_JOB,
        weaponId: DEFAULT_WEAPON,
      },
      fury: 0,
      furyPeak: 0,
      swingCombo: 0,
      swingComboTimer: 0,
      killStreak: 0,
      streakTimer: 0,
      legendaryMoment: 0,
      legendaryPulse: 0,
      nextLegendaryBeaconAt: 0,
      timeSinceLegendary: 0,
      eliteSinceLegendary: 0,
      legendaryDropsSpawned: 0,
      killsTotal: 0,
      killsRecent: 0,
      dropsCollected: 0,
      damageDealt: 0,
      hitsTaken: 0,
      peakEnemyCount: 0,
      directorBias: 1,
      flowScore: 0.58,
      flowAccumulator: 0,
      flowSamples: 0,
      directorNoteTimer: 7,
      directorIntent: "SQUEEZE",
      vacuumPulse: 0,
      frenzy: 0,
      lastStandCd: 0,
      objective: null,
      objectiveNextAt: 17,
      objectivesDone: 0,
      objectivesFailed: 0,
      affixes: createCoreAffixMap(),
      skillBonuses: {
        damageMul: 1,
        attackRateMul: 1,
        crit: 0,
        move: 0,
        pickup: 0,
        projectile: 0,
        hpFlat: 0,
        splash: 0,
        glitchGainMul: 1,
        levelHeal: 0,
        swing: 0,
      },
      skillLevels: {},
      levelChoices: [],
      levelAutoPickTimer: 0,
      levelQueue: 0,
      mutationChoices: [],
      mutationCount: 0,
      nextMutationWave: WAVE_MUTATION_INTERVAL,
      nextMiniBossWave: WAVE_MINIBOSS_INTERVAL,
      nextEmergencyBossAt: 18,
      nextEmergencyBossKill: 16,
      pendingEmergencyBoss: false,
      bossBoonCount: 0,
      lastBossBoon: "",
      pendingPickupItem: null,
      pendingPickupQueue: [],
      pickupAutoTimer: 0,
      pauseMode: null,
      skillRerolls: 0,
      equipmentBonuses: createEquipmentBonusTemplate(),
      itemInventory: [],
      affixRunes: [],
      selectedInventoryItemId: null,
      selectedRuneId: null,
      selectedGearSlot: null,
      equippedItems: {
        weapon: null,
        armor: null,
      },
      burstCd: 0,
      burstUses: 0,
      glitchActive: true,
      bugUsed: true,
      bugTime: 0,
      bugChain: 0,
      giftValue: 0,
      giftDiamonds: 0,
      giftCount: 0,
      giftEvent: {
        kind: "idle",
        name: "Event: STANDBY",
        meta: "Risk -- · Reward --",
        timer: 0,
        source: "SYSTEM",
      },
      streamHook: {
        enabled: false,
        endpoint: STREAM_HOOK_DEFAULT_ENDPOINT,
        cursor: 0,
        failStreak: 0,
        status: "OFF",
        totalEvents: 0,
        totalDiamonds: 0,
        lastSource: "",
        pendingCount: 0,
      },
      nextQueuedGiftAt: 0,
      legendary: 0,
      credits: 20,
      grossPurchase: 0,
      platformFee: 0,
      enemySpeedMul: 1,
      pickupHistory: [],
      logLines: [],
      spawnTimer: 0.2,
      runEnded: false,
      hitCooldown: 0,
      closePressure: 0,
      threatScore: 0,
      spawnCapPulseCd: 0,
      enemyRoleCounts: {
        chaser: 0,
        bruiser: 0,
        zoner: 0,
      },
      dangerMoment: 0,
      dangerText: "",
      bossHazards: [],
      shake: 0,
      flashAlpha: 0,
      flashColor: "255,130,130",
      nunchaku: {
        x: W * 0.5 + 84,
        y: H * 0.74,
        prevX: W * 0.5 + 84,
        prevY: H * 0.74,
        aimX: W * 0.5 + 84,
        aimY: H * 0.74,
        vx: 0,
        vy: 0,
        length: 84,
        restLength: 84,
        maxLength: 122,
        headR: 11,
        speed: 0,
        spin: 0,
        tension: 0,
        stretch: 0,
        stretchLimit: 54,
        elasticBoost: 0,
        rubberTimer: 0,
        rubberCd: 0,
        rubberMul: 1,
        anchorVx: 0,
        anchorVy: 0,
        hitCd: 0,
        selfHitCd: 0,
      },
      input: {
        left: false,
        right: false,
        up: false,
        down: false,
      },
      pointer: {
        active: false,
        x: W * 0.5,
        y: H * 0.74,
        vx: 0,
        vy: 0,
        ts: 0,
      },
    };
  }

  let state = createState();
  let rafId = 0;
  let draggingPointerId = null;
  let streamHookPollTimer = 0;
  let streamHookPollingBusy = false;
  const seenLiveEventIds = new Set();
  const queuedLiveEvents = [];

  function getCurrentWeekId(atMs) {
    const date = atMs ? new Date(atMs) : new Date();
    const utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const dayNum = (new Date(utc).getUTCDay() + 6) % 7;
    const thursday = new Date(utc - dayNum * 86400000 + 3 * 86400000);
    const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
    const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
    const firstWeekThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4 - firstDayNum + 3));
    const week = 1 + Math.round((thursday.getTime() - firstWeekThursday.getTime()) / 604800000);
    return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  }

  function loadLeaderboard() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const rows = Array.isArray(parsed) ? parsed : [];
      const currentWeek = getCurrentWeekId();
      return rows.filter(function (row) {
        return row && row.week === currentWeek;
      });
    } catch (err) {
      return [];
    }
  }

  function saveLeaderboard(rows) {
    try {
      const sanitized = (Array.isArray(rows) ? rows : [])
        .filter(Boolean)
        .sort(function (a, b) {
          return (b.score || 0) - (a.score || 0);
        })
        .slice(0, 80);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch (err) {
      // Ignore storage errors in demo.
    }
  }

  function computeScoreFrom(clearTimeSec, bugTimeSec, giftValue, legendary, bugUsed, wave, killsTotal) {
    const category = bugUsed ? "GLITCH" : "CLEAN";
    const metric = Math.max(4, clearTimeSec);
    const safeWave = Math.max(1, wave || 1);
    const safeKills = Math.max(0, killsTotal || 0);
    const paceScore = Math.pow(Math.max(1, clearTimeSec), 1.03) * 120;
    const waveScore = Math.pow(safeWave, 1.62) * 310;
    const killScore = safeKills * 14;
    const giftScore = giftValue * 0.86;
    const legendaryBonus = legendary * 1320;
    const glitchScale = bugUsed ? 1.06 : 1;
    const score = Math.round((paceScore + waveScore + killScore + giftScore + legendaryBonus) * glitchScale);
    return { score, category, metric, week: getCurrentWeekId() };
  }

  function getDropName(kind, drop) {
    if (kind === "legendary") return "Legendary Chest";
    if (kind === "item") {
      if (drop && drop.item) return `${drop.item.rarityLabel} ${ITEM_SLOT_LABEL[drop.item.slot]}`;
      return "Loot Item";
    }
    return String(kind);
  }

  function getDropColor(kind, drop) {
    if (kind === "legendary") return "#ffd76a";
    if (kind === "item") return drop && drop.item ? drop.item.color : "#8fc2ff";
    return "#9bd4ff";
  }

  function generateCharacterName() {
    return `${pick(NAME_LEFT)} ${pick(NAME_RIGHT)}`;
  }

  function populateBuildOptions() {
    ui.jobSelect.innerHTML = "";
    ui.weaponSelect.innerHTML = "";

    Object.keys(JOBS).forEach((id) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = JOBS[id].name;
      ui.jobSelect.appendChild(option);
    });

    Object.keys(WEAPONS).forEach((id) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = WEAPONS[id].name;
      ui.weaponSelect.appendChild(option);
    });
  }

  function initializeLoadoutState() {
    state.itemInventory = [];
    state.selectedInventoryItemId = null;
    if (!Array.isArray(state.affixRunes)) state.affixRunes = [];
    state.affixRunes = state.affixRunes.map(normalizeAffixRune).filter(Boolean);
    if (!state.equippedItems) {
      state.equippedItems = { weapon: null, armor: null };
    }
    if (!state.equippedItems.armor) {
      const legacyArmor = normalizeItem(state.equippedItems.chest || state.equippedItems.relic || null);
      if (legacyArmor) {
        legacyArmor.slot = "armor";
        state.equippedItems.armor = legacyArmor;
      }
    }
    for (const slot of ITEM_SLOTS) {
      if (!Object.prototype.hasOwnProperty.call(state.equippedItems, slot)) state.equippedItems[slot] = null;
      state.equippedItems[slot] = normalizeItem(state.equippedItems[slot]);
    }

    const hasAnyEquipped = ITEM_SLOTS.some(function (slot) {
      return !!state.equippedItems[slot];
    });
    if (!hasAnyEquipped) {
      const starterWeapon = generateRandomItem({ rarity: "magic", slot: "weapon" });
      const starterArmor = generateRandomItem({ rarity: "common", slot: "armor" });
      state.equippedItems.weapon = starterWeapon;
      state.equippedItems.armor = starterArmor;
    }
    state.selectedInventoryItemId = null;
    if (state.selectedRuneId && !state.affixRunes.some((r) => r.id === state.selectedRuneId)) {
      state.selectedRuneId = null;
    }
    if (!state.selectedRuneId && state.affixRunes.length) {
      state.selectedRuneId = state.affixRunes[0].id;
    }
    if (state.selectedGearSlot && !state.equippedItems[state.selectedGearSlot]) {
      state.selectedGearSlot = null;
    }

    applyEquipmentBonuses();
    renderEquipmentUi();
  }

  function renderBuildInfo() {
    const job = JOBS[selectedBuild.jobId] || JOBS[DEFAULT_JOB];
    const weapon = WEAPONS[selectedBuild.weaponId] || WEAPONS[DEFAULT_WEAPON];
    ui.charName.textContent = selectedBuild.name || "No Character";
    ui.charSpec.textContent = `${job.name} / ${weapon.name} · ${job.flavor}`;
  }

  function setBuild(jobId, weaponId, name) {
    selectedBuild.jobId = JOBS[jobId] ? jobId : DEFAULT_JOB;
    selectedBuild.weaponId = WEAPONS[weaponId] ? weaponId : DEFAULT_WEAPON;
    selectedBuild.name = name || selectedBuild.name || generateCharacterName();

    ui.jobSelect.value = selectedBuild.jobId;
    ui.weaponSelect.value = selectedBuild.weaponId;
    renderBuildInfo();
  }

  function applyBuildToPlayer() {
    const p = state.player;
    const job = JOBS[selectedBuild.jobId] || JOBS[DEFAULT_JOB];
    const weapon = WEAPONS[selectedBuild.weaponId] || WEAPONS[DEFAULT_WEAPON];

    p.name = selectedBuild.name || generateCharacterName();
    p.jobId = selectedBuild.jobId;
    p.weaponId = selectedBuild.weaponId;

    p.maxHp = scalePlayerHpBase(job.hp);
    p.hp = p.maxHp;
    p.speed = job.move + weapon.moveBonus;
    p.baseDamage = job.damage + weapon.damageBonus;
    p.attackRate = clamp(job.attackRate + weapon.attackRateBonus, 0.14, 0.62);
    p.pickupRange = job.pickup + weapon.pickupBonus;
    p.projectileSpeed = 0;
    p.critBonus = job.crit + weapon.critBonus;
    p.weaponProjectiles = 0;
    p.weaponSpread = 0;
    p.weaponSplash = weapon.splash;
    p.weaponCritMul = weapon.critMul;
    p.jobDamageMul = job.damageMul;
    p.weaponDamageMul = weapon.damageMul;
    p.baseRadius = (typeof job.bodySize === "number" ? job.bodySize : 11) + (weapon.bodySizeBonus || 0);
    p.r = clamp(p.baseRadius, 8, 22);
    p.swingAssist = weapon.swingAssist || 1;
    p.swingDamageMul = weapon.swingDamageMul || 1;
    p.weaponReach = weapon.chainLength || 84;
    p.weaponHeadRadius = weapon.headRadius || 11;
    p.selfGuard = weapon.selfGuard || 0;
    p.damageCapMul = job.damageCap + weapon.damageCap;

    state.character.name = p.name;
    state.character.jobId = p.jobId;
    state.character.weaponId = p.weaponId;
  }

  function getEquippedArmorItem() {
    return state.equippedItems.armor || null;
  }

  function getEquippedWeaponItem() {
    return state.equippedItems.weapon || null;
  }

  function resetNunchakuToPlayer() {
    if (!state.nunchaku) {
      state.nunchaku = {
        x: state.player.x,
        y: state.player.y,
        prevX: state.player.x,
        prevY: state.player.y,
        aimX: state.player.x,
        aimY: state.player.y,
        vx: 0,
        vy: 0,
        length: 84,
        restLength: 84,
        maxLength: 122,
        headR: 11,
        speed: 0,
        spin: 0,
        tension: 0,
        stretch: 0,
        stretchLimit: 54,
        elasticBoost: 0,
        rubberTimer: 0,
        rubberCd: 0,
        rubberMul: 1,
        anchorVx: 0,
        anchorVy: 0,
        hitCd: 0,
        selfHitCd: 0,
      };
    }
    const p = state.player;
    const b = state.equipmentBonuses || createEquipmentBonusTemplate();
    const n = state.nunchaku;
    n.length = clamp((p.weaponReach || 84) * 0.72 + state.affixes.scatter * 1.2 + (b.swingBoost || 0) * 12, 44, 112);
    n.restLength = n.length;
    n.stretchLimit = clamp(Number.isFinite(n.stretchLimit) ? n.stretchLimit : n.length * 0.72, 18, 140);
    n.maxLength = n.length + n.stretchLimit;
    n.headR = clamp((p.weaponHeadRadius || 11) + state.affixes.multicast * 0.44, 8, 18);
    n.x = p.x + n.length;
    n.y = p.y;
    n.prevX = n.x;
    n.prevY = n.y;
    n.aimX = n.x;
    n.aimY = n.y;
    n.vx = p.vx || 0;
    n.vy = p.vy || 0;
    n.speed = 0;
    n.spin = 0;
    n.tension = 0;
    n.stretch = 0;
    n.elasticBoost = 0;
    n.rubberTimer = 0;
    n.rubberCd = 0;
    n.rubberMul = 1;
    n.anchorVx = p.vx || 0;
    n.anchorVy = p.vy || 0;
    n.hitCd = 0;
    n.selfHitCd = 0;
  }

  function log(msg) {
    const stamp = formatSec(state.time);
    state.logLines.unshift(`[${stamp}s] ${msg}`);
    if (state.logLines.length > 10) state.logLines.length = 10;
    ui.logBox.textContent = state.logLines.join("\n");
  }

  function isCriticalFloatText(text, size) {
    const t = String(text || "").toUpperCase();
    if ((size || 0) >= 14) return true;
    return (
      t.includes("LEVEL") ||
      t.includes("MUTATION") ||
      t.includes("LEGENDARY") ||
      t.includes("DANGER") ||
      t.includes("LAST STAND") ||
      t.includes("RUN")
    );
  }

  function getFloatTextPriority(text) {
    const raw = String(text && text.text ? text.text : "");
    const upper = raw.toUpperCase();
    const size = Number(text && text.size ? text.size : 11);
    const life = Number(text && text.life ? text.life : 0);
    const maxLife = Math.max(0.001, Number(text && text.maxLife ? text.maxLife : 0.6));
    const lifeRatio = clamp(life / maxLife, 0, 1);
    const numericLike = /^[-+]?\d+/.test(raw.trim());
    const critical = isCriticalFloatText(raw, size);

    let priority = critical ? 180 : 0;
    if (upper.includes("LEGENDARY")) priority += 110;
    if (upper.includes("DANGER")) priority += 95;
    if (upper.includes("LEVEL") || upper.includes("MUTATION")) priority += 70;
    if (upper.includes("RUN")) priority += 60;
    if (numericLike) priority += 18;
    priority += clamp(size, 8, 24) * 2.2;
    priority += lifeRatio * 24;
    return priority;
  }

  function getRenderableFloatTexts(alertOverlayActive) {
    const source = state.floatTexts;
    if (!source.length) return source;
    const mode = normalizeSystemSettings(state.settings).combatTextMode;
    let cap = mode === "full" ? 52 : mode === "off" ? 12 : 24;
    if (alertOverlayActive) cap = Math.max(8, Math.floor(cap * 0.58));
    if (source.length <= cap) return source;

    const ranked = source.map(function (text, idx) {
      return {
        idx,
        priority: getFloatTextPriority(text),
      };
    });
    ranked.sort(function (a, b) {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.idx - a.idx;
    });
    const keep = new Set(
      ranked.slice(0, cap).map(function (entry) {
        return entry.idx;
      })
    );
    return source.filter(function (_text, idx) {
      return keep.has(idx);
    });
  }

  function spawnParticles(x, y, color, count, speed, life) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const spd = rand(speed * 0.45, speed);
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: rand(life * 0.7, life),
        maxLife: life,
        size: rand(1.5, 3.5),
        color,
      });
    }
    if (state.particles.length > 320) {
      state.particles.splice(0, state.particles.length - 320);
    }
  }

  function spawnFloatText(x, y, text, color, size, life) {
    const settings = normalizeSystemSettings(state.settings);
    const mode = settings.combatTextMode;
    const rawText = String(text || "").trim();
    const upperText = rawText.toUpperCase();
    const numericLike = /^[-+]?\d+/.test(rawText);
    const critical = isCriticalFloatText(text, size);
    const hasLegendaryAlert =
      state.running &&
      (state.legendaryMoment > 0 ||
        state.drops.some(function (drop) {
          return drop.kind === "legendary";
        }));

    if (mode === "off" && !critical) return;
    if (mode === "low" && !critical) {
      if (numericLike && Math.random() < 0.6) return;
      if (!numericLike && Math.random() < 0.35) return;
    }
    if (hasLegendaryAlert && upperText.includes("LEGENDARY")) {
      if (upperText.includes("LEGENDARY DROP") || upperText.includes("PITY LEGENDARY")) {
        return;
      }
      const familyKey = "LEGENDARY_FAMILY";
      const familyGap = mode === "full" ? 0.95 : 1.35;
      const now = state.time || 0;
      const lastFamilyStamp = state.floatTextStamp[familyKey] || -999;
      if (now - lastFamilyStamp < familyGap) return;
      state.floatTextStamp[familyKey] = now;
    }
    if (critical && mode !== "full") {
      const key = upperText.replace(/\d+(\.\d+)?/g, "#").slice(0, 42);
      const now = state.time || 0;
      const minGap = upperText.includes("LEGENDARY") ? 0.52 : upperText.includes("DANGER") ? 0.68 : 0.42;
      const lastStamp = state.floatTextStamp[key] || -999;
      if (now - lastStamp < minGap) return;
      state.floatTextStamp[key] = now;
    }

    state.floatTexts.push({
      x,
      y,
      text,
      color,
      size: size || 11,
      life: life || 0.5,
      maxLife: life || 0.5,
      vy: -26,
    });
    const alertOverlayActive =
      state.running &&
      (state.legendaryMoment > 0 || state.dangerMoment > 0 || state.drops.some(function (drop) {
        return drop.kind === "legendary";
      }));
    const baseCap = mode === "full" ? 72 : mode === "off" ? 20 : 32;
    const cap = alertOverlayActive ? Math.max(10, Math.floor(baseCap * 0.72)) : baseCap;
    if (state.floatTexts.length > cap) {
      state.floatTexts.splice(0, state.floatTexts.length - cap);
    }
  }

  function triggerFlash(rgb, alpha) {
    if (!normalizeSystemSettings(state.settings).flashFx) return;
    state.flashColor = rgb;
    state.flashAlpha = Math.max(state.flashAlpha, alpha);
  }

  function triggerShake(amount) {
    if (!normalizeSystemSettings(state.settings).shakeFx) return;
    state.shake = Math.max(state.shake, amount);
  }

  function triggerDanger(text, duration) {
    state.dangerMoment = Math.max(state.dangerMoment, duration || 2.8);
    state.dangerText = text || "THREAT SPIKE";
    triggerFlash("255,105,86", 0.1);
    triggerShake(4.8);
  }

  function setGiftEvent(kind, name, risk, reward, duration, source) {
    state.giftEvent = {
      kind: kind || "idle",
      name: `Event: ${name || "STANDBY"}`,
      meta: `Risk ${risk || "--"} · Reward ${reward || "--"}`,
      timer: Math.max(0, duration || 0),
      source: source || "SYSTEM",
    };
  }

  function syncGiftEventPanel() {
    if (!ui.giftEventPanel || !ui.giftEventName || !ui.giftEventMeta) return;
    const event = state.giftEvent || {
      kind: "idle",
      name: "Event: STANDBY",
      meta: "Risk -- · Reward --",
      timer: 0,
    };
    const activeClass = event.timer > 0 ? event.kind : "idle";
    ui.giftEventPanel.className = `gift-event-panel ${activeClass}`;
    ui.giftEventName.textContent = event.name || "Event: STANDBY";
    const timerSuffix = event.timer > 0 ? ` · ${event.timer.toFixed(1)}s` : "";
    ui.giftEventMeta.textContent = `${event.meta || "Risk -- · Reward --"}${timerSuffix}`;
  }

  function normalizeStreamHookConfig(config) {
    const source = config && typeof config === "object" ? config : {};
    const endpoint = typeof source.endpoint === "string" && source.endpoint.trim() ? source.endpoint.trim() : STREAM_HOOK_DEFAULT_ENDPOINT;
    return {
      enabled: !!source.enabled,
      endpoint,
      cursor: Number.isFinite(Number(source.cursor)) ? Math.max(0, Number(source.cursor)) : 0,
      failStreak: Number.isFinite(Number(source.failStreak)) ? Math.max(0, Number(source.failStreak)) : 0,
      status: typeof source.status === "string" && source.status ? source.status : "OFF",
      totalEvents: Number.isFinite(Number(source.totalEvents)) ? Math.max(0, Number(source.totalEvents)) : 0,
      totalDiamonds: Number.isFinite(Number(source.totalDiamonds)) ? Math.max(0, Number(source.totalDiamonds)) : 0,
      lastSource: typeof source.lastSource === "string" ? source.lastSource : "",
      pendingCount: Number.isFinite(Number(source.pendingCount)) ? Math.max(0, Number(source.pendingCount)) : 0,
    };
  }

  function syncStreamHookPanel() {
    if (!ui.streamHookBtn || !ui.streamHookStatus) return;
    state.streamHook = normalizeStreamHookConfig(state.streamHook);
    const hook = state.streamHook;
    ui.streamHookBtn.textContent = `LIVE HOOK: ${hook.enabled ? "ON" : "OFF"}`;
    const modeClass = hook.enabled ? (hook.failStreak > 0 ? "error" : "on") : "off";
    ui.streamHookStatus.className = `stream-hook-status ${modeClass}`;
    if (!hook.enabled) {
      ui.streamHookStatus.textContent = "Local Gifts Only";
      return;
    }
    if (hook.failStreak > 0) {
      ui.streamHookStatus.textContent = `Retry x${hook.failStreak}`;
      return;
    }
    const src = hook.lastSource ? ` · ${hook.lastSource}` : "";
    const pending = Math.max(0, hook.pendingCount || 0);
    const pendingText = pending > 0 ? ` · P${pending}` : "";
    ui.streamHookStatus.textContent = `LIVE ${hook.totalEvents}ev / ${hook.totalDiamonds}D${pendingText}${src}`;
  }

  function toNumberSafe(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback === undefined ? 0 : fallback;
  }

  function deriveLiveEventDiamonds(rawEvent, eventType) {
    const event = rawEvent && typeof rawEvent === "object" ? rawEvent : {};
    const gift = event.gift && typeof event.gift === "object" ? event.gift : {};
    const repeat = Math.max(1, Math.round(toNumberSafe(event.repeatCount, toNumberSafe(gift.repeatCount, 1))));
    const directDiamonds = Math.max(
      toNumberSafe(event.diamonds, 0),
      toNumberSafe(event.diamondCount, 0),
      toNumberSafe(event.diamond_count, 0),
      toNumberSafe(gift.diamondCount, 0),
      toNumberSafe(gift.diamond_count, 0),
      toNumberSafe(event.value, 0),
      toNumberSafe(gift.value, 0)
    );
    if (directDiamonds > 0) {
      return Math.max(1, Math.round(directDiamonds * repeat));
    }
    const likes = Math.max(toNumberSafe(event.likeCount, 0), toNumberSafe(event.likes, 0), toNumberSafe(event.totalLikeCount, 0));
    if (eventType === "like" && likes > 0) {
      return Math.max(1, Math.round(likes / 120));
    }
    return LIVE_EVENT_FALLBACK_DIAMONDS[eventType] || 1;
  }

  function normalizeLiveEvent(rawEvent) {
    const event = rawEvent && typeof rawEvent === "object" ? rawEvent : {};
    const rawType = String(
      event.type ||
        event.eventType ||
        event.event ||
        event.action ||
        event.event_name ||
        event.eventName ||
        (event.gift || event.giftName ? "gift" : "")
    ).toLowerCase();
    const eventType = rawType.includes("gift")
      ? "gift"
      : rawType.includes("sub")
        ? "subscription"
        : rawType.includes("follow")
          ? "follow"
          : rawType.includes("share")
            ? "share"
            : rawType.includes("like")
              ? "like"
              : rawType.includes("chat") || rawType.includes("comment")
                ? "chat"
                : "gift";
    const sender =
      String(event.sender || event.nickname || event.uniqueId || event.user || event.username || event.userId || event.userName || "Viewer").slice(0, 32);
    const eventId =
      String(
        event.id ||
          event.eventId ||
          event.messageId ||
          event.msgId ||
          event.uuid ||
          `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      );
    const giftName = String(event.giftName || (event.gift && event.gift.name) || event.name || event.label || eventType.toUpperCase()).slice(0, 40);
    const diamonds = deriveLiveEventDiamonds(event, eventType);
    return {
      id: eventId,
      type: eventType,
      sender,
      giftName,
      diamonds: Math.max(1, Math.round(diamonds)),
    };
  }

  function extractLiveEventsPayload(payload) {
    if (Array.isArray(payload)) {
      return { events: payload, cursor: null };
    }
    if (!payload || typeof payload !== "object") {
      return { events: [], cursor: null };
    }
    if (Array.isArray(payload.events)) {
      return { events: payload.events, cursor: toNumberSafe(payload.cursor, null) };
    }
    if (Array.isArray(payload.data)) {
      return { events: payload.data, cursor: toNumberSafe(payload.cursor, null) };
    }
    if (payload.type || payload.eventType || payload.gift || payload.giftName) {
      return { events: [payload], cursor: toNumberSafe(payload.cursor, null) };
    }
    return { events: [], cursor: toNumberSafe(payload.cursor, null) };
  }

  function reinforceEnemies(amount, hpMul, dmgMul, speedMul, healRatio) {
    if (!state.enemies.length) return 0;
    const picks = Math.min(state.enemies.length, Math.max(1, Math.floor(amount)));
    for (let i = 0; i < picks; i += 1) {
      const enemy = state.enemies[Math.floor(Math.random() * state.enemies.length)];
      if (!enemy) continue;
      enemy.maxHp *= hpMul;
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * healRatio);
      enemy.damage *= dmgMul;
      enemy.speed *= speedMul;
      if (!enemy.elite && Math.random() < 0.24) {
        enemy.elite = true;
        enemy.r += 2;
        enemy.maxHp *= 1.05;
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * 0.12);
        enemy.damage *= 1.08;
      }
    }
    return picks;
  }

  function getMiniBossPhase(enemy) {
    if (!enemy || !enemy.maxHp) return 1;
    const hpRate = clamp(enemy.hp / Math.max(1, enemy.maxHp), 0, 1);
    if (hpRate <= 0.16) return 3;
    if (hpRate <= 0.52) return 2;
    return 1;
  }

  function getActiveMiniBoss() {
    let active = null;
    for (const enemy of state.enemies) {
      if (!enemy.miniBoss || enemy.hp <= 0) continue;
      if (!active || enemy.hp > active.hp) active = enemy;
    }
    return active;
  }

  function getMiniBossProfile(enemy) {
    if (!enemy) return MINIBOSS_PROFILES[0];
    if (enemy.miniBossProfileId && MINIBOSS_PROFILE_BY_ID[enemy.miniBossProfileId]) {
      return MINIBOSS_PROFILE_BY_ID[enemy.miniBossProfileId];
    }
    const byName = MINIBOSS_PROFILES.find(function (profile) {
      return profile.name === enemy.name;
    });
    return byName || MINIBOSS_PROFILES[0];
  }

  function rollMiniBossProfile() {
    const waveBias = clamp((state.wave - 12) / 18, 0, 1.5);
    const weighted = MINIBOSS_PROFILES.map(function (profile) {
      let w = profile.weight || 1;
      if (profile.id === "tyrant") w *= 0.72 + waveBias * 0.7;
      if (profile.id === "reaver") w *= 0.86 + waveBias * 0.5;
      if (profile.id === "executioner") w *= 1.08 + waveBias * 0.26;
      return Object.assign({}, profile, { _weight: w });
    });
    const picked = pickWeighted(weighted, "_weight");
    if (!picked) return MINIBOSS_PROFILES[0];
    return MINIBOSS_PROFILE_BY_ID[picked.id] || MINIBOSS_PROFILES[0];
  }

  function applyBossBoon(sourceEnemy) {
    const boon = pick(BOSS_BOONS);
    if (!boon) return null;
    const p = state.player;
    const gear = state.equipmentBonuses;
    const skill = state.skillBonuses;

    if (boon.id === "overdrive") {
      gear.damageMul += 0.08;
      skill.swing += 0.12;
      skill.attackRateMul *= 0.94;
    } else if (boon.id === "hardskin") {
      gear.mitigation = clamp(gear.mitigation + 0.05, 0, 0.68);
      p.maxHp += scalePlayerHpDelta(26);
      p.hp = clamp(p.hp + scalePlayerHpDelta(28), 0, p.maxHp);
    } else if (boon.id === "magnetdrive") {
      gear.pickup += 24;
      state.vacuumPulse = Math.max(state.vacuumPulse, 2.4);
      skill.move += 12;
    } else if (boon.id === "chainstorm") {
      gear.splash += 22;
      gear.attackRateMul += 0.06;
      gear.swingBoost += 0.1;
    } else if (boon.id === "frenzycore") {
      state.fury = clamp(state.fury + 24, 0, 100);
      gear.chainChance += 0.08;
      gear.burstDamageMul += 0.12;
    }

    state.bossBoonCount = (state.bossBoonCount || 0) + 1;
    state.lastBossBoon = boon.label;
    spawnFloatText(p.x, p.y - 38, `BOON ${boon.label.toUpperCase()}`, "#ffe9b6", 13, 0.86);
    triggerFlash("255,220,150", 0.14);
    triggerShake(5.2);
    log(`Boss boon acquired: ${boon.label} (${boon.desc}).`);
    return boon;
  }

  function spawnBossHazard(x, y, options) {
    const opts = options || {};
    state.bossHazards.push({
      x: clamp(x, 22, W - 22),
      y: clamp(y, 22, H - 22),
      radius: clamp(opts.radius || 72, 30, 180),
      delay: clamp(opts.delay || 0.72, 0.2, 1.8),
      life: clamp(opts.life || 1.45, 0.6, 2.8),
      elapsed: 0,
      damage: Math.max(2, opts.damage || 14),
      label: opts.label || "SLAM",
      color: opts.color || "255,118,88",
      detonated: false,
    });
    if (state.bossHazards.length > 12) {
      state.bossHazards.splice(0, state.bossHazards.length - 12);
    }
  }

  function spawnReinforcementPack(centerX, centerY, count, eliteBoost) {
    let spawned = 0;
    const safeCount = Math.max(0, Math.floor(count || 0));
    for (let i = 0; i < safeCount; i += 1) {
      if (state.enemies.length >= maxEnemiesOnField()) break;
      const created = spawnEnemy(eliteBoost || 0);
      if (!created) break;
      const enemy = state.enemies[state.enemies.length - 1];
      if (!enemy || enemy.miniBoss) continue;
      enemy.x = clamp(centerX + rand(-120, 120), 14, W - 14);
      enemy.y = clamp(centerY + rand(-110, 110), 14, H - 14);
      const dx = state.player.x - enemy.x;
      const dy = state.player.y - enemy.y;
      const dist = Math.hypot(dx, dy) || 1;
      enemy.vx += (dx / dist) * rand(80, 180);
      enemy.vy += (dy / dist) * rand(80, 180);
      spawned += 1;
    }
    return spawned;
  }

  function updateBossHazards(dt) {
    if (!state.bossHazards.length) return;
    const p = state.player;
    for (let i = state.bossHazards.length - 1; i >= 0; i -= 1) {
      const hazard = state.bossHazards[i];
      hazard.elapsed += dt;
      if (!hazard.detonated && hazard.elapsed >= hazard.delay) {
        hazard.detonated = true;
        const dist = Math.hypot(p.x - hazard.x, p.y - hazard.y);
        if (dist <= hazard.radius + p.r + 4 && state.hitCooldown <= 0 && (p.invulnTime || 0) <= 0) {
          const mitigation = clamp(state.equipmentBonuses.mitigation + state.equipmentBonuses.selfGuard * 0.25, 0, 0.72);
          const rawDamage = Math.max(3, hazard.damage * (1 - mitigation));
          const hazardCap = p.maxHp * (hazard.label === "OMEGA" ? 0.38 : 0.28);
          const damage = Math.min(rawDamage, hazardCap);
          p.hp -= damage;
          state.hitsTaken += 1;
          state.hitCooldown = 0.34;
          p.invulnTime = 0.28;
          objectiveEvent("player_hit");
          spawnFloatText(p.x + rand(-8, 8), p.y - 18, `-${Math.round(damage)} ${hazard.label}`, "#ffb5a0", 11, 0.46);
          triggerFlash("255,108,88", 0.14);
          triggerShake(5.2);
          sfxPlayerHit();
        }
        spawnParticles(hazard.x, hazard.y, "#ff9e7d", 18, 190, 0.48);
      }
      if (hazard.elapsed >= hazard.life) {
        state.bossHazards.splice(i, 1);
      }
    }
  }

  function drawBossHazards() {
    if (!state.bossHazards.length) return;
    for (const hazard of state.bossHazards) {
      const color = hazard.color || "255,118,88";
      const pulse = 0.55 + 0.45 * Math.sin(state.time * 8 + hazard.x * 0.01);
      if (!hazard.detonated) {
        const ratio = clamp(hazard.elapsed / Math.max(0.001, hazard.delay), 0, 1);
        ctx.strokeStyle = `rgba(${color}, ${(0.2 + ratio * 0.45).toFixed(3)})`;
        ctx.lineWidth = 1.8 + ratio * 1.6;
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, hazard.radius * (0.58 + ratio * 0.42), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(${color}, ${(0.06 + ratio * 0.12 + pulse * 0.05).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, hazard.radius * (0.5 + ratio * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else {
        const post = clamp((hazard.elapsed - hazard.delay) / Math.max(0.001, hazard.life - hazard.delay), 0, 1);
        ctx.fillStyle = `rgba(${color}, ${(0.32 * (1 - post)).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, hazard.radius * (1 + post * 0.32), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255,224,180,${(0.5 * (1 - post)).toFixed(3)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, hazard.radius * (1 + post * 0.45), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.lineWidth = 1.3;
  }

  function releasePointerDrag(pointerId) {
    if (pointerId != null && canvas.hasPointerCapture && canvas.hasPointerCapture(pointerId)) {
      try {
        canvas.releasePointerCapture(pointerId);
      } catch (err) {
        // Ignore release errors in unsupported contexts.
      }
    }
    if (pointerId == null || draggingPointerId === pointerId) {
      draggingPointerId = null;
    }
    if (state.pointer) {
      state.pointer.active = false;
      state.pointer.vx = 0;
      state.pointer.vy = 0;
    }
  }

  function updateEffects(dt) {
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.life -= dt;
      p.vx *= 0.97;
      p.vy = p.vy * 0.97 + 18 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }

    for (let i = state.floatTexts.length - 1; i >= 0; i -= 1) {
      const t = state.floatTexts[i];
      t.life -= dt;
      t.y += t.vy * dt;
      t.vy -= 12 * dt;
      if (t.life <= 0) state.floatTexts.splice(i, 1);
    }

    state.flashAlpha = Math.max(0, state.flashAlpha - dt * 1.5);
    state.shake = Math.max(0, state.shake - dt * 26);
    state.hitCooldown = Math.max(0, state.hitCooldown - dt);
  }

  function renderAffixList() {
    ui.affixList.innerHTML = "";
    for (const affix of CORE_AFFIX_STATS) {
      const lv = state.affixes[affix.id] || 0;
      const li = document.createElement("li");
      li.textContent = `${affix.name} +${lv.toFixed(2)} - ${affix.desc}`;
      li.style.color = affix.color;
      ui.affixList.appendChild(li);
    }

    const eqText = ITEM_SLOTS.map(function (slot) {
      const item = state.equippedItems[slot];
      if (!item) return `${ITEM_SLOT_LABEL[slot]}:Empty`;
      return `${ITEM_SLOT_LABEL[slot]}:${item.tier}${item.power}`;
    }).join(" / ");
    ui.loadoutInfo.textContent = eqText;

    const b = state.equipmentBonuses || createEquipmentBonusTemplate();
    const parts = [];
    if (b.damageMul > 0) parts.push(`ATK+${Math.round(b.damageMul * 100)}%`);
    if (b.attackRateMul > 0) parts.push(`HASTE+${Math.round(b.attackRateMul * 100)}%`);
    if (b.mitigation > 0) parts.push(`DR+${Math.round(b.mitigation * 100)}%`);
    if (b.legendaryChance > 0) parts.push(`LEG+${Math.round(b.legendaryChance * 100)}%`);
    if (b.splash > 0) parts.push(`SPLASH+${Math.round(b.splash)}`);
    if (b.hitShotChance > 0) parts.push(`PROC+${Math.round(b.hitShotChance * 100)}%`);
    if (b.furyOnKill > 0) parts.push(`FURY/KILL+${Math.round(b.furyOnKill)}`);
    if (b.pickup > 0) parts.push(`PICKUP+${Math.round(b.pickup)}`);
    if (b.move > 0) parts.push(`MOVE+${Math.round(b.move)}`);
    if (b.executeThreshold > 0) parts.push(`EXECUTE+${Math.round(b.executeThreshold * 100)}%`);
    if (b.burstDamageMul > 0) parts.push(`BURST+${Math.round(b.burstDamageMul * 100)}%`);
    if (b.chainChance > 0) parts.push(`CHAIN+${Math.round(b.chainChance * 100)}%`);
    if (b.selfGuard > 0) parts.push(`SELF GUARD+${Math.round(b.selfGuard * 100)}%`);
    if (Math.abs(b.size || 0) > 0.05) parts.push(`SIZE${b.size >= 0 ? "+" : ""}${b.size.toFixed(1)}`);
    if (b.swingBoost > 0) parts.push(`SWING+${Math.round(b.swingBoost * 100)}%`);

    const legendaryLines = ITEM_SLOTS.map(function (slot) {
      const it = state.equippedItems[slot];
      if (!it || !it.legendaryAffix) return null;
      return `LEG:${it.legendaryAffix.label}`;
    }).filter(Boolean);
    const equippedCount = ITEM_SLOTS.filter(function (slot) {
      return !!state.equippedItems[slot];
    }).length;
    const triadText = equippedCount >= 2 ? "DUO: NUNCHAKU SYNERGY ACTIVE" : `DUO: ${equippedCount}/2`;

    ui.setBonusVal.textContent = [triadText, parts.join(" / "), legendaryLines.join(" / ")]
      .filter(Boolean)
      .join(" | ");

    if (!ui.setBonusVal.textContent) {
      ui.setBonusVal.textContent = "Random Affix build active";
    }

    if (ui.gearHint) {
      const target = state.selectedGearSlot ? ITEM_SLOT_LABEL[state.selectedGearSlot] : "none";
      ui.gearHint.textContent = `Drop -> Equip/Discard only · Rune ${state.affixRunes.length}/24 · C${state.credits} · Target ${target}`;
    }
  }

  function renderDropList() {
    ui.dropList.innerHTML = "";
    if (!state.drops.length) {
      const li = document.createElement("li");
      li.textContent = "Ground: none";
      li.style.color = "#88a7ba";
      ui.dropList.appendChild(li);
    } else {
      const map = new Map();
      for (const drop of state.drops) {
        let key = drop.kind;
        if (drop.kind === "item") key = `item:${drop.item ? drop.item.rarity : "common"}:${drop.item ? drop.item.slot : "weapon"}`;
        map.set(key, (map.get(key) || 0) + 1);
      }
      Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, amount]) => {
          let kind = key;
          let sample = null;
          if (key.startsWith("item:")) {
            kind = "item";
            const parts = key.split(":");
            sample = state.drops.find(
              (d) => d.kind === "item" && d.item && d.item.rarity === parts[1] && d.item.slot === parts[2]
            ) || null;
          }
          const li = document.createElement("li");
          li.textContent = `${getDropName(kind, sample)} x${amount}`;
          li.style.color = getDropColor(kind, sample);
          ui.dropList.appendChild(li);
        });
    }
    ui.pickupTrail.textContent = state.pickupHistory.length
      ? state.pickupHistory.join(" / ")
      : "Pickup: none";
  }

  function renderLeaderboard() {
    const rows = loadLeaderboard()
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    ui.rankingBody.innerHTML = "";
    if (!rows.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = "<td colspan='7'>No weekly records yet</td>";
      ui.rankingBody.appendChild(tr);
      return;
    }

    rows.forEach((row, idx) => {
      const flowPct = `${Math.round(((row.avgFlow || 0) * 100))}%`;
      const kills = Number.isFinite(row.killsTotal) ? row.killsTotal : 0;
      const hits = Number.isFinite(row.hitsTaken) ? row.hitsTaken : 0;
      const waveTag = `W${Math.max(1, row.wave || 1)}`;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${row.category}</td>
        <td>${row.score}</td>
        <td>${waveTag}</td>
        <td>${row.giftValue}</td>
        <td>${flowPct}</td>
        <td>${kills}/${hits}</td>
      `;
      ui.rankingBody.appendChild(tr);
    });
  }

  function rollLevelChoices() {
    const pool = LEVEL_SKILL_POOL.slice();
    const picks = [];
    while (pool.length && picks.length < 3) {
      const idx = Math.floor(Math.random() * pool.length);
      const skill = pool.splice(idx, 1)[0];
      if (!skill) break;
      picks.push(skill);
    }
    return picks;
  }

  function rollMutationChoices() {
    const pool = MUTATION_POOL.slice();
    const picks = [];
    while (pool.length && picks.length < 2) {
      const idx = Math.floor(Math.random() * pool.length);
      const mutation = pool.splice(idx, 1)[0];
      if (!mutation) break;
      picks.push(mutation);
    }
    return picks;
  }

  function updateLevelAutoTimerLabel() {
    if (!ui.levelAutoTimer) return;
    ui.levelAutoTimer.textContent = `${Math.max(0, state.levelAutoPickTimer).toFixed(1)}s`;
  }

  function closeMutationModal() {
    if (!ui.mutationModal || !ui.mutationChoices) return;
    ui.mutationModal.classList.add("hidden");
    ui.mutationChoices.innerHTML = "";
  }

  function closeLevelChoiceModal() {
    ui.levelModal.classList.add("hidden");
    ui.levelChoices.innerHTML = "";
    state.levelAutoPickTimer = 0;
    updateLevelAutoTimerLabel();
  }

  function closePickupCompareModal(options) {
    const opts = options || {};
    if (ui.pickupModal) ui.pickupModal.classList.add("hidden");
    if (opts.clear !== false) {
      state.pendingPickupItem = null;
      state.pickupAutoTimer = 0;
    }
  }

  function getPendingPickupItem() {
    const pending = state.pendingPickupItem;
    if (!pending) return null;
    if (pending.item) return pending.item;
    if (pending.slot && pending.name) return pending;
    return null;
  }

  function formatCompareStatLabel(stat) {
    const labels = {
      power: "POWER",
      multicast: "SYNC",
      scatter: "ARC",
      overflow: "GLITCH",
      lucky: "LUCK",
      damageMul: "DMG%",
      attackRateMul: "RATE%",
      move: "MOVE",
      pickup: "PICKUP",
      mitigation: "MITI%",
      selfGuard: "SELF%",
      size: "SIZE",
      swingBoost: "SWING%",
      splash: "SPLASH",
      hitShotChance: "PROC%",
      furyOnKill: "FURY",
      legendaryChance: "LEG%",
      glitchGainMul: "GLITCH%",
      hpFlat: "HP",
      burstDamageMul: "BURST%",
      executeThreshold: "EXEC%",
      chainChance: "CHAIN%",
    };
    return labels[stat] || String(stat || "").toUpperCase();
  }

  function buildPickupCompareLines(item) {
    if (!item) return ["(Empty)"];
    const lines = [`${item.rarityLabel} ${item.tier}${item.power}`];
    if (item.legendaryAffix) lines.push(`[LEG] ${item.legendaryAffix.label}`);
    const bonuses = item.bonuses || createEquipmentBonusTemplate();
    const entries = [];
    for (const [stat, value] of Object.entries(bonuses)) {
      const n = Number(value || 0);
      if (Math.abs(n) < 0.005) continue;
      entries.push({
        stat,
        value: n,
        impact: Math.abs(getAffixImpactScore(stat, n)),
      });
    }
    entries
      .sort(function (a, b) {
        return b.impact - a.impact;
      })
      .slice(0, 6)
      .forEach(function (it) {
        lines.push(`${formatCompareStatLabel(it.stat)} ${formatItemStat(it.stat, it.value)}`);
      });
    return lines;
  }

  function renderPickupCompareModal() {
    const dropped = getPendingPickupItem();
    if (!dropped) {
      closePickupCompareModal();
      if (state.pauseMode === "pickup_compare") {
        state.pauseMode = null;
        updateHud();
        log("Gear compare recovered: missing payload, resumed run.");
      }
      return;
    }
    if (!ui.pickupModal) return;
    const current = state.equippedItems[dropped.slot] || null;
    const currentPower = current ? current.power || 0 : 0;
    const delta = dropped.power - currentPower;

    if (ui.pickupSlotLabel) ui.pickupSlotLabel.textContent = ITEM_SLOT_LABEL[dropped.slot] || dropped.slot;
    if (ui.pickupAutoTimer) ui.pickupAutoTimer.textContent = `${Math.max(0, state.pickupAutoTimer).toFixed(1)}s`;

    if (ui.pickupCompareDelta) {
      ui.pickupCompareDelta.classList.remove("positive", "negative", "neutral");
      ui.pickupCompareDelta.classList.add(delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral");
      ui.pickupCompareDelta.textContent = `Power Delta ${delta >= 0 ? "+" : ""}${delta}`;
    }

    if (ui.pickupCurrentTitle) {
      ui.pickupCurrentTitle.textContent = current
        ? `${current.rarityLabel} ${current.name}`
        : `Empty ${ITEM_SLOT_LABEL[dropped.slot] || dropped.slot}`;
      ui.pickupCurrentTitle.style.color = current ? current.color : "#a2b8c7";
    }
    if (ui.pickupCurrentStats) {
      ui.pickupCurrentStats.textContent = buildPickupCompareLines(current).join("\n");
    }

    if (ui.pickupDropTitle) {
      ui.pickupDropTitle.textContent = `${dropped.rarityLabel} ${dropped.name}`;
      ui.pickupDropTitle.style.color = dropped.color;
    }
    if (ui.pickupDropStats) {
      ui.pickupDropStats.textContent = buildPickupCompareLines(dropped).join("\n");
    }
  }

  function resolvePickupChoice(keep, source) {
    const pending = state.pendingPickupItem;
    const dropped = getPendingPickupItem();
    if (!pending || !dropped) {
      if (state.pauseMode === "pickup_compare") {
        state.pauseMode = null;
        closePickupCompareModal();
        updateHud();
      }
      return false;
    }

    const item = normalizeItem(dropped);
    const from = pending.source || source || "pickup";
    closePickupCompareModal();
    state.pauseMode = null;

    if (keep && item) {
      equipItemDirect(item, "Pickup");
      spawnFloatText(state.player.x, state.player.y - 24, `EQUIP ${item.rarityLabel}`, item.color, 12, 0.52);
      log(`Pickup compare (${from}): equipped ${item.rarityLabel} ${item.baseName}.`);
    } else if (item) {
      spawnFloatText(state.player.x, state.player.y - 24, `DISCARD ${item.rarityLabel}`, "#ffb9a2", 11, 0.48);
      log(`Pickup compare (${from}): discarded ${item.rarityLabel} ${item.baseName}.`);
    }

    if (Array.isArray(state.pendingPickupQueue) && state.pendingPickupQueue.length > 0) {
      const next = state.pendingPickupQueue.shift();
      if (next && next.item) {
        openPickupCompareModal(next.item, next.source || "Queued");
        return true;
      }
    }

    if (state.levelQueue > 0) {
      openLevelChoiceModal();
      return true;
    }
    updateHud();
    return true;
  }

  function openPickupCompareModal(item, source) {
    const normalized = normalizeItem(item);
    if (!normalized) return false;
    state.pendingPickupItem = { item: normalized, source: source || "Loot" };
    state.pickupAutoTimer = 3.2;
    state.pauseMode = "pickup_compare";
    if (ui.pickupModal) ui.pickupModal.classList.remove("hidden");
    renderPickupCompareModal();
    log(`Gear compare paused: ${normalized.rarityLabel} ${normalized.baseName}.`);
    return true;
  }

  function drawPickupCompareCanvasOverlay(dropped, hudScorePreview) {
    if (!dropped) return;
    const current = state.equippedItems[dropped.slot] || null;
    const currentPower = current ? current.power || 0 : 0;
    const delta = (dropped.power || 0) - currentPower;
    const panelW = Math.min(560, W - 28);
    const panelH = Math.min(268, H - 30);
    const panelX = (W - panelW) * 0.5;
    const panelY = (H - panelH) * 0.5;
    const colGap = 12;
    const colW = (panelW - 24 - colGap) * 0.5;
    const leftX = panelX + 12;
    const rightX = leftX + colW + colGap;
    const rowTop = panelY + 68;
    const rowH = panelH - 112;

    const currentLines = buildPickupCompareLines(current).slice(0, 7);
    const droppedLines = buildPickupCompareLines(dropped).slice(0, 7);

    drawRetroPanel(panelX, panelY, panelW, panelH, {
      fillAlpha: 0.88,
      borderAlpha: 0.66,
      patternAlpha: 0.25,
      borderColor: "122,176,210",
    });

    ctx.textAlign = "center";
    ctx.fillStyle = "#f0f8ff";
    ctx.font = "bold 17px monospace";
    ctx.fillText("GEAR DROP COMPARE", panelX + panelW * 0.5, panelY + 24);
    ctx.fillStyle = "#b8d4e8";
    ctx.font = "12px monospace";
    ctx.fillText(
      `${ITEM_SLOT_LABEL[dropped.slot] || dropped.slot}  |  AUTO ${Math.max(0, state.pickupAutoTimer).toFixed(1)}s  |  SCORE ${hudScorePreview}`,
      panelX + panelW * 0.5,
      panelY + 44
    );

    ctx.fillStyle = delta >= 0 ? "#9dffbb" : "#ffb8aa";
    ctx.font = "bold 13px monospace";
    ctx.fillText(`POWER DELTA ${delta >= 0 ? "+" : ""}${delta}`, panelX + panelW * 0.5, panelY + 62);

    ctx.textAlign = "left";
    drawRetroPanel(leftX, rowTop, colW, rowH, {
      fillAlpha: 0.86,
      borderAlpha: 0.54,
      patternAlpha: 0.2,
      borderColor: "90,142,178",
    });
    drawRetroPanel(rightX, rowTop, colW, rowH, {
      fillAlpha: 0.86,
      borderAlpha: 0.54,
      patternAlpha: 0.2,
      borderColor: "90,142,178",
    });

    ctx.fillStyle = "#b7d8ea";
    ctx.font = "bold 12px monospace";
    ctx.fillText("CURRENT", leftX + 8, rowTop + 16);
    ctx.fillText("DROPPED", rightX + 8, rowTop + 16);

    ctx.fillStyle = current ? current.color : "#9ab2c4";
    ctx.font = "bold 11px monospace";
    ctx.fillText(current ? `${current.rarityLabel} ${current.name}` : "EMPTY", leftX + 8, rowTop + 32, colW - 16);
    ctx.fillStyle = dropped.color || "#dbeeff";
    ctx.fillText(`${dropped.rarityLabel} ${dropped.name}`, rightX + 8, rowTop + 32, colW - 16);

    ctx.fillStyle = "#d8e9f6";
    ctx.font = "11px monospace";
    currentLines.forEach(function (line, idx) {
      ctx.fillText(line, leftX + 8, rowTop + 50 + idx * 14, colW - 16);
    });
    droppedLines.forEach(function (line, idx) {
      ctx.fillText(line, rightX + 8, rowTop + 50 + idx * 14, colW - 16);
    });

    ctx.textAlign = "center";
    ctx.fillStyle = "#d2e6f7";
    ctx.font = "bold 12px monospace";
    ctx.fillText("1 / ENTER / TAP = PICK   |   2 = DISCARD", panelX + panelW * 0.5, panelY + panelH - 12);
  }

  function openLevelChoiceModal() {
    if (!state.levelQueue) return;
    if (state.levelQueue > 4) {
      let compressed = 0;
      while (state.levelQueue > 2 && compressed < 48) {
        const compressedChoices = rollLevelChoices();
        const autoSkill = pickLevelSkillFromChoices(compressedChoices) || compressedChoices[0];
        if (!autoSkill) break;
        state.levelQueue -= 1;
        grantLevelSkill(autoSkill.id, { silent: true });
        compressed += 1;
      }
      if (compressed > 0) {
        spawnFloatText(state.player.x, state.player.y - 40, `AUTO LV +${compressed}`, "#cae8ff", 12, 0.7);
        log(`Level queue compressed: auto-picked ${compressed}.`);
      }
    }
    state.levelQueue -= 1;
    state.pauseMode = "levelup";
    state.levelChoices = rollLevelChoices();
    state.levelAutoPickTimer = LEVEL_AUTO_PICK_SECONDS;
    ui.levelChoices.innerHTML = "";

    for (const skill of state.levelChoices) {
      const btn = document.createElement("button");
      btn.className = "skill-card";
      btn.type = "button";
      btn.innerHTML = `<strong>${skill.name}</strong><span>${skill.desc}</span>`;
      btn.addEventListener("click", function () {
        applyLevelSkill(skill.id);
      });
      ui.levelChoices.appendChild(btn);
    }

    ui.levelModal.classList.remove("hidden");
    updateLevelAutoTimerLabel();
    log("Level up paused. Auto pick timer started.");
  }

  function applyMutationChoice(mutationId) {
    const mutation = MUTATION_POOL.find(function (it) {
      return it.id === mutationId;
    });
    if (!mutation) return;
    const p = state.player;
    const b = state.skillBonuses;
    state.mutationCount += 1;

    if (mutation.id === "fracture") {
      b.damageMul *= 1.18;
      p.maxHp = Math.max(scalePlayerHpBase(44), p.maxHp * 0.9);
      p.hp = Math.min(p.hp, p.maxHp);
    } else if (mutation.id === "magnet") {
      b.pickup += 56;
      state.vacuumPulse = Math.max(state.vacuumPulse, 2.4);
    } else if (mutation.id === "coil") {
      state.equipmentBonuses.chainChance += 0.12;
      state.affixes.overflow += 0.75;
    } else if (mutation.id === "phase") {
      b.move += 30;
      b.attackRateMul *= 0.9;
    } else if (mutation.id === "bastion") {
      state.equipmentBonuses.mitigation += 0.1;
      p.maxHp += scalePlayerHpDelta(42);
      p.hp = clamp(p.hp + scalePlayerHpDelta(28), 0, p.maxHp);
    } else if (mutation.id === "bloodrift") {
      state.equipmentBonuses.executeThreshold += 0.08;
      state.equipmentBonuses.burstDamageMul += 0.22;
    }

    spawnFloatText(state.player.x, state.player.y - 34, `MUTATION ${mutation.name}`, "#ffe4a8", 14, 1);
    triggerFlash("255,205,120", 0.14);
    triggerShake(5.4);
    state.pauseMode = null;
    closeMutationModal();
    if (state.levelQueue > 0) {
      openLevelChoiceModal();
      return;
    }
    updateHud();
    log(`Mutation selected: ${mutation.name}`);
  }

  function openMutationModal() {
    if (!ui.mutationModal || !ui.mutationChoices) return;
    state.pauseMode = "mutation";
    state.mutationChoices = rollMutationChoices();
    ui.mutationChoices.innerHTML = "";
    for (const mutation of state.mutationChoices) {
      const btn = document.createElement("button");
      btn.className = "skill-card";
      btn.type = "button";
      btn.innerHTML = `<strong>${mutation.name}</strong><span>${mutation.desc}</span>`;
      btn.addEventListener("click", function () {
        applyMutationChoice(mutation.id);
      });
      ui.mutationChoices.appendChild(btn);
    }
    ui.mutationModal.classList.remove("hidden");
    log("Mutation gate reached. Choose one power mutation.");
  }

  function pickAutoLevelSkill() {
    return pickLevelSkillFromChoices(state.levelChoices);
  }

  function pickLevelSkillFromChoices(choices) {
    if (!Array.isArray(choices) || !choices.length) return null;
    const priority = {
      atk: 8,
      multishot: 7,
      haste: 7,
      crit: 6,
      vital: 6,
      splash: 5,
      focus: 4,
      pickup: 3,
      move: 3,
      rune: 2,
    };
    return choices
      .slice()
      .sort(function (a, b) {
        return (priority[b.id] || 0) - (priority[a.id] || 0);
      })[0];
  }

  function resolvePauseWithFallback(source) {
    if (state.pauseMode === "levelup") {
      let resolved = 0;
      let firstName = "";
      let guard = 0;
      while (state.pauseMode === "levelup" && guard < 36) {
        const autoChoice = pickAutoLevelSkill() || state.levelChoices[0];
        if (!autoChoice) break;
        if (!firstName) firstName = autoChoice.name;
        applyLevelSkill(autoChoice.id);
        resolved += 1;
        guard += 1;
      }
      if (state.pauseMode === "levelup") {
        // Extreme XP bursts can queue many level screens; force-close to prevent deadlock.
        state.levelQueue = 0;
        state.pauseMode = null;
        closeLevelChoiceModal();
        updateHud();
      }
      if (!resolved) return false;
      log(`Pause resolved (${source}): ${firstName}${resolved > 1 ? ` +${resolved - 1}` : ""}`);
      return true;
    }

    if (state.pauseMode === "mutation") {
      const choice = state.mutationChoices && state.mutationChoices[0];
      if (!choice) {
        closeMutationModal();
        state.pauseMode = null;
        updateHud();
        return true;
      }
      log(`Pause resolved (${source}): ${choice.name}`);
      applyMutationChoice(choice.id);
      return true;
    }

    if (state.pauseMode === "pickup_compare") {
      return resolvePickupChoice(true, source);
    }

    return false;
  }

  function grantLevelSkill(skillId, options) {
    const opts = options || {};
    const b = state.skillBonuses;
    state.skillLevels[skillId] = (state.skillLevels[skillId] || 0) + 1;

    if (skillId === "atk") {
      b.damageMul *= 1.18;
    } else if (skillId === "haste") {
      b.attackRateMul *= 0.85;
      b.swing += 0.16;
    } else if (skillId === "crit") {
      b.crit += 0.07;
    } else if (skillId === "multishot") {
      b.swing += 0.22;
      state.affixes.multicast += 0.35;
    } else if (skillId === "pickup") {
      b.pickup += 42;
    } else if (skillId === "move") {
      b.move += 28;
    } else if (skillId === "vital") {
      b.hpFlat += 32;
      b.levelHeal += 4;
      state.player.maxHp += scalePlayerHpDelta(32);
      state.player.hp = clamp(state.player.hp + scalePlayerHpDelta(20), 0, state.player.maxHp);
    } else if (skillId === "splash") {
      b.splash += 18;
    } else if (skillId === "focus") {
      b.glitchGainMul *= 1.35;
    } else if (skillId === "rune") {
      addItemToInventory(generateRandomItem({ rarity: "rare" }), "Skill Rune");
    }

    if (!opts.silent) {
      const pickedMeta = LEVEL_SKILL_POOL.find((s) => s.id === skillId);
      spawnFloatText(state.player.x, state.player.y - 30, `SKILL ${pickedMeta ? pickedMeta.name : skillId}`, "#d1f1ff", 13, 0.85);
      triggerFlash("120,190,255", 0.11);
      sfxLevelUp();
    }
  }

  function applyLevelSkill(skillId) {
    grantLevelSkill(skillId);
    state.levelAutoPickTimer = 0;

    if (state.levelQueue > 0) {
      openLevelChoiceModal();
      return;
    }

    state.pauseMode = null;
    closeLevelChoiceModal();
    updateHud();
  }

  function syncSystemFocusButtons() {
    const settings = normalizeSystemSettings(state.settings);
    state.settings = settings;
    if (ui.systemTextBtn) {
      ui.systemTextBtn.textContent = `Text: ${settings.combatTextMode.toUpperCase()}`;
      ui.systemTextBtn.classList.remove("system-on", "system-off");
      ui.systemTextBtn.classList.add(settings.combatTextMode === "off" ? "system-off" : "system-on");
    }
    if (ui.systemFlashBtn) {
      ui.systemFlashBtn.textContent = `Flash: ${settings.flashFx ? "ON" : "OFF"}`;
      ui.systemFlashBtn.classList.remove("system-on", "system-off");
      ui.systemFlashBtn.classList.add(settings.flashFx ? "system-on" : "system-off");
    }
    if (ui.systemShakeBtn) {
      ui.systemShakeBtn.textContent = `Shake: ${settings.shakeFx ? "ON" : "OFF"}`;
      ui.systemShakeBtn.classList.remove("system-on", "system-off");
      ui.systemShakeBtn.classList.add(settings.shakeFx ? "system-on" : "system-off");
    }
  }

  function updateHud() {
    ui.wave.textContent = `${state.wave}`;
    ui.level.textContent = `${state.player.level}`;
    ui.hp.textContent = `${Math.max(0, Math.round(state.player.hp))}/${Math.round(state.player.maxHp)}`;
    ui.enemySpeed.textContent = `${state.enemySpeedMul.toFixed(2)}x / D${state.directorBias.toFixed(2)}`;
    ui.fury.textContent = `${Math.round(state.fury)}%`;
    ui.time.textContent = formatSec(state.time);
    ui.glitchTime.textContent = `FIXED ${formatSec(state.bugTime)}`;
    ui.credits.textContent = `${state.credits}`;
    ui.gift.textContent = `${state.giftDiamonds || 0}D`;
    ui.legendary.textContent = `${state.legendary}`;
    if (ui.stats) ui.stats.classList.toggle("compact", !!state.hudCompact);
    if (ui.hudModeBtn) ui.hudModeBtn.textContent = state.hudCompact ? "HUD: Compact" : "HUD: Detailed";
    syncSystemFocusButtons();
    if (state.pauseMode === "levelup") {
      ui.startBtn.textContent = `Continue ${Math.max(0, state.levelAutoPickTimer).toFixed(1)}s`;
    } else if (state.pauseMode === "mutation") {
      ui.startBtn.textContent = "Continue Mutation";
    } else if (state.pauseMode === "pickup_compare") {
      ui.startBtn.textContent = `Pick Up ${Math.max(0, state.pickupAutoTimer).toFixed(1)}s`;
    } else {
      ui.startBtn.textContent = state.running ? "Running..." : state.runEnded ? "Retry Run" : "Run Start";
    }
    ui.startBtn.disabled = !!state.running && !state.pauseMode;

    const xpRate = clamp(state.player.xp / state.player.nextXp, 0, 1);
    ui.xpFill.style.width = `${(xpRate * 100).toFixed(1)}%`;
    ui.xpText.textContent = `${Math.floor(state.player.xp)} / ${state.player.nextXp}`;

    const scorePreview = computeScoreFrom(
      Math.max(4, state.time || 4),
      state.bugTime,
      state.giftValue,
      state.legendary,
      state.bugUsed,
      state.wave,
      state.killsTotal
    );
    ui.scorePreview.textContent = `${scorePreview.score}`;

    ui.gross.textContent = `$${state.grossPurchase.toFixed(2)}`;
    ui.fee.textContent = `$${state.platformFee.toFixed(2)}`;

    if (ui.glitchBtn) {
      ui.glitchBtn.textContent = "Glitch ON (Fixed)";
      ui.glitchBtn.classList.remove("accent");
      ui.glitchBtn.classList.add("danger");
      ui.glitchBtn.disabled = true;
    }

    if (!state.running) {
      ui.burstBtn.textContent = "SNAP Ready";
      ui.burstBtn.classList.add("ready");
      ui.burstBtn.classList.remove("cooldown");
    } else if (state.pauseMode) {
      ui.burstBtn.textContent = "SNAP Pause";
      ui.burstBtn.classList.remove("ready");
      ui.burstBtn.classList.add("cooldown");
    } else if (state.burstCd <= 0) {
      ui.burstBtn.textContent = "SNAP Ready";
      ui.burstBtn.classList.add("ready");
      ui.burstBtn.classList.remove("cooldown");
    } else {
      ui.burstBtn.textContent = `SNAP ${state.burstCd.toFixed(1)}s`;
      ui.burstBtn.classList.remove("ready");
      ui.burstBtn.classList.add("cooldown");
    }

    const threatMeta = getThreatLabel(state.threatScore || computeThreatScore());
    const mutPct = Math.round(computeMilestoneProgress(state.wave, WAVE_MUTATION_INTERVAL) * 100);
    const bossPct = Math.round(computeMilestoneProgress(state.wave, WAVE_MINIBOSS_INTERVAL) * 100);
    const combo = Math.max(0, Math.floor(state.swingCombo || 0));
    const activeMiniBoss = getActiveMiniBoss();
    const bossHint = activeMiniBoss
      ? `${activeMiniBoss.name || "BOSS"} P${activeMiniBoss.bossPhase || getMiniBossPhase(activeMiniBoss)}`
      : `M${mutPct}% B${bossPct}%`;
    ui.intent.textContent = `${threatMeta.label} ${state.directorIntent} | Combo x${combo} | ${bossHint}`;
    if (state.pauseMode === "levelup") {
      ui.objective.textContent = "LEVEL UP: 3択 (自動選択あり)";
      ui.objectiveTimer.textContent = `${Math.max(0, state.levelAutoPickTimer).toFixed(1)}s`;
    } else if (state.pauseMode === "mutation") {
      ui.objective.textContent = "MUTATION: 2択を選択";
      ui.objectiveTimer.textContent = "PAUSE";
    } else if (state.pauseMode === "pickup_compare") {
      ui.objective.textContent = "GEAR DROP: 今の装備と比較中";
      ui.objectiveTimer.textContent = `${Math.max(0, state.pickupAutoTimer).toFixed(1)}s`;
    } else if (activeMiniBoss) {
      const phase = activeMiniBoss.bossPhase || getMiniBossPhase(activeMiniBoss);
      const profile = getMiniBossProfile(activeMiniBoss);
      ui.objective.textContent = `BOSS ${activeMiniBoss.name || "MINIBOSS"} · ${(profile && profile.title) || "BOSS"} · PHASE ${phase}`;
      ui.objectiveTimer.textContent = `Dash:${Math.max(0, activeMiniBoss.bossDashCd || 0).toFixed(1)} Slam:${Math.max(0, activeMiniBoss.bossSlamCd || 0).toFixed(1)}`;
    } else {
      ui.objective.textContent = `Mutation ${mutPct}% / Miniboss ${bossPct}%`;
      ui.objectiveTimer.textContent = `Mut:${state.mutationCount} Combo:x${combo} Boon:${state.bossBoonCount || 0}`;
    }

    syncGiftEventPanel();
    syncStreamHookPanel();
  }

  function computeEnemySpeedMul() {
    const waveExp = Math.pow(1.048, Math.max(0, state.wave - 1));
    const timeScale = 1 + state.time * 0.0018;
    const giftScale = 1 + state.giftCount * 0.022;
    const directorScale = 1 + (state.directorBias - 1) * 0.3;
    const furyScale = 1 + state.fury * 0.0014;
    return clamp(waveExp * timeScale * giftScale * directorScale * furyScale, 1, 22);
  }

  function waveBudget(wave) {
    const baseline = 8 + Math.pow(Math.max(1, wave), 1.12) * 1.8;
    const pressure = state.giftCount * 0.9 + (state.directorBias - 1) * 5;
    return Math.round(clamp(baseline + pressure, 8, 220));
  }

  function enemyThreatScalar() {
    const waveExp = Math.pow(1.086, Math.max(0, state.wave - 1));
    const timeRamp = 1 + state.time * 0.006;
    const giftRamp = 1 + state.giftCount * 0.08;
    const furyRamp = 1 + state.fury * 0.002;
    const directorRamp = 1 + (state.directorBias - 1) * 0.5;
    return clamp(waveExp * timeRamp * giftRamp * furyRamp * directorRamp, 1, 260);
  }

  function maxEnemiesOnField() {
    const base = 24 + Math.pow(Math.max(1, state.wave), 0.72) * 3.2 + state.giftCount * 0.8 + state.directorBias * 4;
    return Math.round(clamp(base, 28, 64));
  }

  function computeThreatScore() {
    const hpRate = clamp(state.player.hp / Math.max(1, state.player.maxHp), 0, 1);
    const crowd = clamp(state.closePressure / 10, 0, 1.8);
    const density = clamp(state.enemies.length / 18, 0, 2);
    const speed = clamp((state.enemySpeedMul - 1) / 4, 0, 2);
    const hpLoss = clamp((1 - hpRate) * 1.6, 0, 1.6);
    const boss = getActiveMiniBoss();
    const bossPhase = boss ? getMiniBossPhase(boss) : 0;
    const bossPressure = boss ? clamp(0.38 + bossPhase * 0.24 + (1 - boss.hp / Math.max(1, boss.maxHp)) * 0.28, 0, 1.45) : 0;
    const hazardPressure = clamp((state.bossHazards || []).length * 0.19, 0, 1.4);
    return Math.round(
      clamp((crowd * 0.3 + density * 0.26 + speed * 0.2 + hpLoss * 0.42 + bossPressure * 0.26 + hazardPressure * 0.16) * 100, 0, 199)
    );
  }

  function getThreatLabel(threatScore) {
    if (threatScore >= 150) return { label: "DEADLY", color: "#ff8c81" };
    if (threatScore >= 110) return { label: "HIGH", color: "#ffbc7b" };
    if (threatScore >= 70) return { label: "MED", color: "#ffe39b" };
    return { label: "LOW", color: "#9ce7c6" };
  }

  function directorTargetPressure() {
    return clamp(0.66 + state.wave * 0.06 + state.time * 0.002 + state.giftCount * 0.03, 0.62, 1.45);
  }

  function updateDirector(dt) {
    state.killsRecent = Math.max(0, state.killsRecent - dt * 2.4);

    const hpRate = clamp(state.player.hp / Math.max(1, state.player.maxHp), 0, 1);
    const pressure = clamp(state.enemies.length / 24, 0, 2);
    const target = directorTargetPressure();
    const killTempo = clamp(state.killsRecent / 8, 0, 1.6);

    let desiredBias = 1;
    if (pressure < target && hpRate > 0.62 && killTempo > 0.48) desiredBias += 0.18;
    if (pressure < target * 0.7 && hpRate > 0.8 && killTempo > 0.85) desiredBias += 0.25;
    if (pressure > target * 1.2 || hpRate < 0.36) desiredBias -= 0.2;
    if (state.glitchActive) desiredBias += 0.07 + state.bugChain * 0.012;

    if (pressure < target * 0.86 && hpRate > 0.6) {
      state.directorIntent = "HUNT";
    } else if (hpRate < 0.38 || pressure > target * 1.2) {
      state.directorIntent = "RECOVER";
    } else {
      state.directorIntent = "SQUEEZE";
    }

    if (getActiveMiniBoss()) {
      state.directorIntent = "DUEL";
    }

    state.directorBias = clamp(
      state.directorBias + (desiredBias - state.directorBias) * Math.min(1, dt * 2.2),
      0.58,
      1.9
    );

    state.flowScore = clamp(
      0.62 +
        (1 - Math.abs(pressure - target) * 0.9) * 0.42 +
        killTempo * 0.12 +
        hpRate * 0.06 -
        Math.max(0, 0.3 - hpRate) * 0.2,
      0,
      1
    );
    state.flowAccumulator += state.flowScore;
    state.flowSamples += 1;
  }

  function createObjective(type) {
    if (type === "glitch_kill") {
      return {
        type,
        title: "Overflow Trial",
        short: "GLITCH KILL",
        rewardText: "Frenzy + Bug Chain",
        duration: 14,
        timeLeft: 14,
        goal: 10,
        progress: 0,
      };
    }
    if (type === "pickup_chain") {
      return {
        type,
        title: "Salvage Burst",
        short: "PICKUP RUSH",
        rewardText: "Loot x2 + Heal",
        duration: 12,
        timeLeft: 12,
        goal: 5,
        progress: 0,
      };
    }
    if (type === "crit_chain") {
      return {
        type,
        title: "Deadeye Window",
        short: "CRIT CHAIN",
        rewardText: "Legendary chance",
        duration: 11,
        timeLeft: 11,
        goal: 7,
        progress: 0,
      };
    }
    return {
      type: "no_hit",
      title: "Ghost Step",
      short: "NO HIT",
      rewardText: "Legendary cache",
      duration: 10,
      timeLeft: 10,
      goal: 10,
      progress: 0,
    };
  }

  function startObjectiveCycle() {
    const candidates = ["no_hit", "pickup_chain"];
    if (state.glitchActive || state.affixes.scatter + state.affixes.overflow >= 1) {
      candidates.push("glitch_kill");
    }
    if (state.player.level >= 3 || state.affixes.lucky >= 1) {
      candidates.push("crit_chain");
    }

    state.objective = createObjective(pick(candidates));
    state.objectiveNextAt = state.time + rand(24, 35);

    spawnFloatText(W * 0.5, 68, `CONTRACT ${state.objective.title}`, "#f9dfad", 13, 0.85);
    log(`Contract issued: ${state.objective.title} (${state.objective.rewardText})`);
  }

  function completeObjective() {
    const o = state.objective;
    if (!o) return;
    state.objectivesDone += 1;
    const rewardMul = 1;

    if (o.type === "no_hit") {
      const p = state.player;
      spawnDrop(clamp(p.x + rand(-36, 36), 26, W - 26), clamp(p.y + rand(-30, 30), 22, H - 22), "legendary");
      state.fury = clamp(state.fury + 14 * rewardMul, 0, 100);
      state.vacuumPulse = Math.max(state.vacuumPulse, 1.8);
      state.frenzy = Math.max(state.frenzy, 2.4);
    } else if (o.type === "glitch_kill") {
      state.bugChain = clamp(state.bugChain + 2.8, 0, 16);
      state.fury = clamp(state.fury + 18 * rewardMul, 0, 100);
      state.frenzy = Math.max(state.frenzy, 4.3);
      state.vacuumPulse = Math.max(state.vacuumPulse, 1.3);
    } else if (o.type === "pickup_chain") {
      const runeCount = Math.max(1, Math.round(2 * rewardMul));
      for (let i = 0; i < runeCount; i += 1) {
        addItemToInventory(generateRandomItem({ rarity: "magic" }), "Contract");
      }
      state.player.hp = clamp(state.player.hp + scalePlayerHpDelta(22), 0, state.player.maxHp);
      state.vacuumPulse = Math.max(state.vacuumPulse, 2.2);
    } else if (o.type === "crit_chain") {
      if (Math.random() < 0.08) {
        spawnDrop(state.player.x, state.player.y - 16, "legendary");
      } else {
        spawnDrop(state.player.x, state.player.y - 16, Math.random() < 0.22 ? "item_rare" : "item_magic");
        if (Math.random() < 0.28) {
          spawnDrop(state.player.x + rand(-20, 20), state.player.y + rand(-10, 14), "item");
        }
      }
      state.frenzy = Math.max(state.frenzy, 2.6);
    }

    spawnFloatText(state.player.x, state.player.y - 36, `CONTRACT CLEAR: ${o.title}`, "#ffe6b0", 14, 0.92);
    triggerFlash("255,220,130", 0.12);
    triggerShake(4.6);
    sfxLevelUp();
    log(`Contract clear: ${o.title} -> ${o.rewardText}`);

    state.objective = null;
    state.objectiveNextAt = state.time + rand(18, 30);
    renderDropList();
    renderAffixList();
  }

  function failObjective(reason) {
    const o = state.objective;
    if (!o) return;
    state.objectivesFailed += 1;
    state.directorBias = clamp(state.directorBias - 0.06, 0.58, 1.9);
    spawnFloatText(state.player.x, state.player.y - 34, "CONTRACT FAILED", "#ffb0a6", 13, 0.8);
    triggerFlash("255,115,95", 0.1);
    log(`Contract failed: ${o.title}${reason ? ` (${reason})` : ""}`);
    state.objective = null;
    state.objectiveNextAt = state.time + rand(14, 24);
  }

  function objectiveEvent(eventType, payload) {
    const o = state.objective;
    if (!o) return;

    if (o.type === "no_hit" && eventType === "player_hit") {
      failObjective("damage taken");
      return;
    }

    if (o.type === "glitch_kill" && eventType === "enemy_kill" && state.glitchActive) {
      o.progress += payload && payload.elite ? 1.6 : 1;
    } else if (o.type === "pickup_chain" && eventType === "drop_pickup") {
      o.progress += 1;
    } else if (o.type === "crit_chain" && eventType === "crit_hit") {
      o.progress += 1;
    }

    if (!state.objective) return;
    if (o.progress >= o.goal) completeObjective();
  }

  function updateObjective(dt) {
    if (!state.running) return;

    if (!state.objective) {
      if (state.wave >= 2 && state.time >= state.objectiveNextAt) {
        startObjectiveCycle();
      }
      return;
    }

    const o = state.objective;
    o.timeLeft -= dt;
    if (o.type === "no_hit") {
      o.progress = clamp(o.duration - o.timeLeft, 0, o.goal);
    }

    if (o.timeLeft <= 0) {
      if (o.progress >= o.goal) {
        completeObjective();
      } else {
        failObjective("time up");
      }
    }
  }

  function legendaryChance(enemy) {
    const base = enemy.elite ? 0.017 : 0.0005;
    const furyBonus = state.fury * 0.0001;
    const giftBonus = clamp(state.giftValue / 140000, 0, 0.06);
    const elitePity = clamp(state.eliteSinceLegendary * 0.006, 0, 0.08);
    const timePity = clamp(state.timeSinceLegendary * 0.0003, 0, 0.06);
    const pityFloor = state.legendaryDropsSpawned === 0 && state.time > 25 ? 0.012 : 0;
    const gearLegendaryBonus = state.equipmentBonuses.legendaryChance * 0.22;
    return clamp(
      base + furyBonus + giftBonus + elitePity + timePity + pityFloor + gearLegendaryBonus,
      0,
      0.22
    );
  }

  function shouldForceLegendary(enemy) {
    return !!enemy.elite && (state.eliteSinceLegendary >= 26 || state.timeSinceLegendary >= 220);
  }

  function countEnemyRoles(enemies) {
    const counts = { chaser: 0, bruiser: 0, zoner: 0 };
    for (const enemy of enemies) {
      const role = enemy.role || "chaser";
      if (!Object.prototype.hasOwnProperty.call(counts, role)) continue;
      counts[role] += 1;
    }
    return counts;
  }

  function chooseSpawnRoleHint(roleCounts) {
    const total = state.enemies.length;
    if (total < 4) return "chaser";

    const targetZoner = clamp(0.16 + state.wave * 0.015 + state.time * 0.0006, 0.16, 0.34);
    const targetBruiser = clamp(0.2 + state.wave * 0.018, 0.2, 0.36);
    const targetChaser = clamp(1 - targetZoner - targetBruiser, 0.32, 0.64);

    const chaserRate = roleCounts.chaser / Math.max(1, total);
    const bruiserRate = roleCounts.bruiser / Math.max(1, total);
    const zonerRate = roleCounts.zoner / Math.max(1, total);

    if (state.closePressure >= 7 && chaserRate > targetChaser * 0.86) {
      return Math.random() < 0.65 ? "zoner" : "bruiser";
    }
    if (chaserRate > targetChaser + 0.08) {
      return Math.random() < 0.58 ? "zoner" : "bruiser";
    }
    if (zonerRate < targetZoner - 0.05) return "zoner";
    if (bruiserRate < targetBruiser - 0.05) return "bruiser";
    if (chaserRate < targetChaser - 0.05) return "chaser";

    return pick(["chaser", "bruiser", "zoner"]);
  }

  function rollEnemyArchetype(roleHint, roleCounts) {
    const waveBias = state.wave - 1;
    const entries = ENEMY_ARCHETYPES.map(function (a) {
      let dynamicWeight = a.weight;
      if (a.id === "brute") dynamicWeight += waveBias * 0.8;
      if (a.id === "reaper") dynamicWeight += Math.max(0, waveBias - 1) * 0.85;
      if (a.id === "stalker") dynamicWeight += state.time > 38 ? 2.2 : 0.8;
      if (roleHint) {
        if (a.role === roleHint) dynamicWeight *= 2.45;
        else dynamicWeight *= 0.56;
      }
      if (state.closePressure >= 7 && a.role === "chaser") dynamicWeight *= 0.52;
      if (roleCounts && roleCounts.chaser >= roleCounts.bruiser + roleCounts.zoner + 3 && a.role === "chaser") {
        dynamicWeight *= 0.42;
      }
      return Object.assign({}, a, { dynamicWeight });
    });
    return pickWeighted(entries, "dynamicWeight") || ENEMY_ARCHETYPES[0];
  }

  function spawnEnemy(eliteChanceBoost) {
    if (state.enemies.length >= maxEnemiesOnField()) {
      if (state.spawnCapPulseCd <= 0 && state.enemies.length > 0) {
        const reinforceCount = Math.min(3, Math.max(1, Math.floor(state.wave / 2)));
        reinforceEnemies(reinforceCount, 1.028, 1.05, 1.02, 0.08);
        state.frenzy = Math.max(state.frenzy, 1.1);
        state.spawnCapPulseCd = 0.85;
      }
      return false;
    }

    const boost = eliteChanceBoost || 0;
    const threat = enemyThreatScalar();
    const eliteChance = clamp(0.15 + state.wave * 0.025 + boost + (state.directorBias - 1) * 0.24, 0.15, 0.82);
    const elite = Math.random() < eliteChance;
    const roleCounts = countEnemyRoles(state.enemies);
    const roleHint = chooseSpawnRoleHint(roleCounts);
    const archetype = rollEnemyArchetype(roleHint, roleCounts);

    const p = state.player;
    let x = -20;
    let y = -20;
    const minSpawnDist = clamp(136 + state.time * 0.4 + state.wave * 2.2, 136, 236);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const side = Math.random();
      if (side < 0.25) {
        x = rand(12, W - 12);
        y = -20;
      } else if (side < 0.5) {
        x = W + 20;
        y = rand(18, H - 18);
      } else if (side < 0.75) {
        x = rand(12, W - 12);
        y = H + 20;
      } else {
        x = -20;
        y = rand(18, H - 18);
      }
      const playerDist = Math.hypot(x - p.x, y - p.y);
      if (attempt >= 6 || playerDist >= minSpawnDist) break;
    }

    const survivalRamp = clamp(state.time / 90, 0, 1);
    const nightmareHpMul = 7 + (state.wave - 1) * 1.8 + survivalRamp * 16;
    const nightmareDmgMul = 14 + (state.wave - 1) * 2.4 + survivalRamp * 20;
    const hpRamp = 0.78 + survivalRamp * 0.62;
    const damageRamp = 0.84 + survivalRamp * 0.7;

    const hpBase = (20 + state.wave * 10) * threat * (0.9 + state.directorBias * 0.1) * nightmareHpMul * hpRamp;
    const speedBase = (76 + state.wave * 14 + state.time * 0.6) * (0.94 + state.directorBias * 0.12) * 2.05;
    const damageBase =
      (4.8 + state.wave * 1.8 + threat * 1.6) *
      (0.92 + state.directorBias * 0.11) *
      (nightmareDmgMul * 0.4) *
      damageRamp;
    const hpMul = archetype.hp * (elite ? 1.85 : 1);
    const speedMul = archetype.speed * (elite ? 1.2 : 1);
    const dmgMul = archetype.damage * (elite ? 1.24 : 1);

    state.enemies.push({
      x,
      y,
      r: elite ? archetype.r + 4 : archetype.r,
      hp: hpBase * hpMul,
      maxHp: hpBase * hpMul,
      speed: speedBase * speedMul,
      damage: damageBase * dmgMul,
      elite,
      archetypeId: archetype.id,
      role: archetype.role || "chaser",
      color: archetype.color,
      vx: 0,
      vy: 0,
      touchCd: 0,
    });
    return true;
  }

  function trimEnemiesForBoss(keepCount) {
    const safeKeep = Math.max(0, Math.floor(keepCount || 0));
    if (state.enemies.length <= safeKeep) return 0;
    const p = state.player;
    const removable = state.enemies
      .filter(function (enemy) {
        return !enemy.miniBoss;
      })
      .map(function (enemy, idx) {
        return {
          enemy,
          idx,
          dist: Math.hypot(enemy.x - p.x, enemy.y - p.y),
        };
      })
      .sort(function (a, b) {
        return b.dist - a.dist;
      });
    const currentMiniBossCount = state.enemies.length - removable.length;
    const maxRemovals = Math.max(0, state.enemies.length - (safeKeep + currentMiniBossCount));
    let removed = 0;
    for (let i = 0; i < removable.length && removed < maxRemovals; i += 1) {
      const target = removable[i].enemy;
      const idx = state.enemies.indexOf(target);
      if (idx >= 0) {
        state.enemies.splice(idx, 1);
        removed += 1;
      }
    }
    return removed;
  }

  function spawnMiniBoss() {
    const trimmed = trimEnemiesForBoss(12);
    if (state.enemies.length >= maxEnemiesOnField()) {
      state.enemies
        .sort(function (a, b) {
          return (a.maxHp || 0) - (b.maxHp || 0);
        })
        .splice(0, Math.min(3, Math.max(0, state.enemies.length - 1)));
    }
    const created = spawnEnemy(0.95);
    if (!created || !state.enemies.length) return false;
    const boss = state.enemies[state.enemies.length - 1];
    const profile = rollMiniBossProfile();
    const bossScale = Math.pow(1.055, Math.max(0, state.wave - 1));
    const bossHpMul = clamp(3.4 + state.wave * 0.08, 3.4, 5.6);
    boss.miniBoss = true;
    boss.elite = true;
    boss.archetypeId = `mini_${boss.archetypeId || "brute"}`;
    boss.role = "bruiser";
    boss.r = Math.max(boss.r + 11, 20);
    boss.maxHp *= bossHpMul * bossScale * (profile.hpMul || 1);
    boss.hp = boss.maxHp;
    boss.damage *= 1.3 * (profile.damageMul || 1);
    boss.speed *= 0.9 * (profile.speedMul || 1);
    boss.color = profile.color || "#ffd89d";
    boss.name = profile.name || "Miniboss";
    boss.miniBossProfileId = profile.id || "warden";
    boss.miniBossTitle = profile.title || "BOSS";
    boss.bossPhase = 1;
    boss.bossDashCd = rand(2.2, 3.8) * (profile.dashCdMul || 1);
    boss.bossSlamCd = rand(3.4, 5.2) * (profile.slamCdMul || 1);
    boss.bossCallCd = rand(6.8, 9.6) * (profile.callCdMul || 1);
    boss.bossAura = 0;
    state.frenzy = Math.max(state.frenzy, 2.8);
    triggerDanger(`${(profile.title || "BOSS").toUpperCase()} ${boss.name.toUpperCase()}`, 4.2);
    spawnFloatText(W * 0.5, 58, `${boss.name.toUpperCase()} · ${(profile.title || "BOSS").toUpperCase()}`, "#ffd39f", 18, 1.1);
    log(`Miniboss spawned: ${boss.name} (${profile.title || "BOSS"}) at wave ${state.wave}. crowd trim ${trimmed}.`);
    return true;
  }

  function spawnDrop(x, y, kind) {
    const safeX = clamp(x, 18, W - 18);
    const safeY = clamp(y, 18, H - 18);

    if (kind === "legendary") {
      state.legendaryDropsSpawned += 1;
      state.eliteSinceLegendary = 0;
      state.timeSinceLegendary = 0;

      state.drops.push({
        x: safeX,
        y: safeY,
        r: 8,
        kind: "legendary",
        color: "#ffd76a",
        vx: rand(-20, 20),
        vy: rand(-25, 8),
        bob: rand(0, Math.PI * 2),
        age: 0,
      });
      state.legendaryMoment = Math.max(state.legendaryMoment, 1.35);
      state.legendaryPulse = Math.max(state.legendaryPulse, 1.55);
      state.nextLegendaryBeaconAt = state.time + 0.45;
      spawnFloatText(safeX, safeY - 24, "LEGENDARY DROP", "#ffd98a", 15, 0.9);
      spawnParticles(safeX, safeY, "#ffd98a", 34, 240, 0.8);
      triggerFlash("255,210,110", 0.2);
      triggerShake(7.5);
      sfxLegendarySpawn();
      log("Legendary drop appeared. Push in and secure it.");
      renderDropList();
      return;
    }

    const rarity = kind === "item_rare" ? "rare" : kind === "item_magic" ? "magic" : "common";
    const item = generateRandomItem({
      rarity,
      legendaryBias: clamp(state.giftCount * 0.002 + state.time * 0.0005, 0, 0.04),
    });
    state.drops.push({
      x: safeX,
      y: safeY,
      r: 6,
      kind: "item",
      color: item.color,
      vx: rand(-24, 24),
      vy: rand(-20, 6),
      bob: rand(0, Math.PI * 2),
      age: 0,
      item,
    });
    renderDropList();
  }

  function onEnemyDeath(enemy) {
    state.killsTotal += 1;
    state.killsRecent += enemy.elite ? 1.4 : 1;
    if (enemy.elite) state.eliteSinceLegendary += 1;
    objectiveEvent("enemy_kill", { elite: enemy.elite });

    gainXp(enemy.miniBoss ? 84 : enemy.elite ? 26 : 12);

    const furyGain = (enemy.elite ? 16 : 5) + state.equipmentBonuses.furyOnKill;
    state.fury = clamp(state.fury + furyGain, 0, 100);
    state.furyPeak = Math.max(state.furyPeak, state.fury);
    if (state.burstCd > 0) {
      const refund = (enemy.elite ? 0.42 : 0.12) * (1 + state.equipmentBonuses.executeThreshold * 3);
      state.burstCd = Math.max(0, state.burstCd - refund);
    }
    state.killStreak += 1;
    state.streakTimer = 2.4;
    if (state.killStreak > 0 && state.killStreak % 18 === 0) {
      spawnFloatText(state.player.x, state.player.y - 34, `RAMPAGE x${state.killStreak}`, "#ffbf7d", 15, 0.78);
      triggerFlash("255,180,110", 0.08);
    }

    const dropChance = enemy.miniBoss
      ? clamp(0.22 * ITEM_DROP_RATE_MULT * 4.5, 0.05, 0.2)
      : enemy.elite
        ? clamp(0.84 * ITEM_DROP_RATE_MULT, 0.02, 0.18)
        : clamp(0.62 * ITEM_DROP_RATE_MULT, 0.01, 0.14);
    if (Math.random() < dropChance) spawnDrop(enemy.x, enemy.y);
    if ((enemy.elite && Math.random() < 0.32 * HIGH_RARITY_RATE_MULT) || (enemy.miniBoss && Math.random() < 0.12)) {
      spawnDrop(enemy.x + rand(-16, 16), enemy.y + rand(-12, 12), "item_rare");
    }

    const forcedLegendary = shouldForceLegendary(enemy);
    if (forcedLegendary || Math.random() < legendaryChance(enemy)) {
      spawnDrop(enemy.x, enemy.y, "legendary");
      if (forcedLegendary) {
        spawnFloatText(enemy.x, enemy.y - 30, "PITY LEGENDARY", "#ffe2a1", 13, 0.9);
        log("Pity triggered: guaranteed legendary drop.");
      }
    }

    if (enemy.miniBoss) {
      const boon = applyBossBoon(enemy);
      spawnDrop(enemy.x + rand(-18, 18), enemy.y + rand(-18, 18), "legendary");
      state.fury = clamp(state.fury + 34, 0, 100);
      state.vacuumPulse = Math.max(state.vacuumPulse, 2.2);
      state.levelQueue += 1;
      triggerDanger("MINIBOSS DOWN", 2.6);
      spawnFloatText(enemy.x, enemy.y - 38, `BOSS TROPHY · ${boon ? boon.label.toUpperCase() : "LVUP"}`, "#ffe9b2", 14, 0.96);
      log(`Miniboss defeated. Guaranteed legendary reward + bonus level pick${boon ? ` + ${boon.label}` : ""}.`);
      if (!state.pauseMode) openLevelChoiceModal();
    }

    spawnParticles(enemy.x, enemy.y, enemy.elite ? "#ffc277" : "#ff7e7e", enemy.elite ? 24 : 13, 200, 0.5);
    if (enemy.elite) {
      triggerShake(6);
      triggerFlash("255,170,100", 0.12);
    }
  }

  function applyDrop(drop) {
    const kind = drop.kind;
    state.dropsCollected += 1;
    objectiveEvent("drop_pickup", { kind });
    state.pickupHistory.unshift(getDropName(kind, drop));
    if (state.pickupHistory.length > 6) state.pickupHistory.length = 6;

    if (kind === "legendary") {
      state.legendary += 1;
      state.fury = clamp(state.fury + 22, 0, 100);
      const legResult = addItemToInventory(generateRandomItem({ rarity: "legendary" }), "Legendary");
      state.player.hp = clamp(state.player.hp + scalePlayerHpDelta(26), 0, state.player.maxHp);
      state.vacuumPulse = Math.max(state.vacuumPulse, 1.9);
      state.frenzy = Math.max(state.frenzy, 3.3);
      spawnFloatText(state.player.x, state.player.y - 24, "LEGENDARY!", "#ffe690", 15, 0.8);
      triggerFlash("255,220,130", 0.16);
      triggerShake(5);
      state.legendaryMoment = 1.45;
      state.legendaryPulse = 1.7;
      state.nextLegendaryBeaconAt = state.time + 8;
      sfxLegendaryPickup();
      log("Legendary cache opened. Random affixes +2 and heal.");
      return legResult === "pause" ? "pause" : null;
    }

    if (kind === "item" && drop.item) {
      const item = normalizeItem(drop.item);
      if (!item) return null;
      const result = addItemToInventory(item, "Loot");
      if (result === "pause") return "pause";
      return null;
    }

    // Legacy fallback.
    const fallback = generateRandomItem({ rarity: "magic" });
    return addItemToInventory(fallback, "Fallback Loot") === "pause" ? "pause" : null;
  }

  function gainXp(amount) {
    const p = state.player;
    p.xp += amount;

    while (p.xp >= p.nextXp) {
      p.xp -= p.nextXp;
      p.level += 1;
      p.nextXp = Math.round(p.nextXp * 1.26 + 12);

      p.maxHp += scalePlayerHpDelta(10);
      const levelHeal = scalePlayerHpDelta(16 + state.skillBonuses.levelHeal);
      p.hp = clamp(p.hp + levelHeal, 0, p.maxHp);
      p.invulnTime = Math.max(p.invulnTime || 0, 1.05);
      p.baseDamage += 3.8;
      p.speed += 8;
      p.pickupRange += 3;
      p.attackRate = Math.max(0.14, p.attackRate * 0.968);
      state.vacuumPulse = Math.max(state.vacuumPulse, 1.2);
      state.frenzy = Math.max(state.frenzy, 1.3);

      if (p.level % 3 === 0) {
        addItemToInventory(generateRandomItem({ rarity: "magic" }), "Level Bonus");
      }

      spawnFloatText(p.x, p.y - 26, `LEVEL ${p.level}!`, "#9ef0ff", 15, 0.78);
      for (const enemy of state.enemies) {
        const dx = enemy.x - p.x;
        const dy = enemy.y - p.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist > 210) continue;
        const push = (1 - dist / 210) * 280;
        enemy.vx += (dx / dist) * push;
        enemy.vy += (dy / dist) * push;
      }
      triggerFlash("90,180,255", 0.12);
      triggerShake(4);
      sfxLevelUp();
      log(`LEVEL UP -> Lv.${p.level} / ATK+ SPD+ PICKUP+`);
      state.levelQueue += 1;
    }

    if (state.levelQueue > 0 && !state.pauseMode) {
      openLevelChoiceModal();
    }
  }

  function applySplashDamage(cx, cy, radius, dmg) {
    for (const enemy of state.enemies) {
      const dx = enemy.x - cx;
      const dy = enemy.y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist <= radius) {
        const scale = 1 - dist / (radius + 0.001);
        enemy.hp -= dmg * scale;
        if (dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          enemy.vx += nx * (44 + radius * 0.22);
          enemy.vy += ny * (44 + radius * 0.22);
        }
      }
    }
  }

  function burstCooldownMax() {
    const haste = (1 - clamp(state.equipmentBonuses.attackRateMul, 0, 0.5)) * state.skillBonuses.attackRateMul;
    return clamp(7.2 * haste, 3.2, 8.5);
  }

  function castBurst() {
    if (!state.running || state.pauseMode) return;
    if (state.burstCd > 0) return;

    const p = state.player;
    const radius = clamp(
      130 + p.level * 2 + p.weaponSplash * 1.2 + state.equipmentBonuses.splash * 1.1 + state.skillBonuses.splash * 0.9,
      90,
      320
    );
    const baseDmg =
      p.baseDamage *
      (1.9 + state.affixes.power * 0.24) *
      (1 + state.equipmentBonuses.damageMul) *
      (1 + state.equipmentBonuses.burstDamageMul) *
      state.skillBonuses.damageMul *
      (state.glitchActive ? 1.3 : 1);

    let hitCount = 0;
    for (const enemy of state.enemies) {
      const dx = enemy.x - p.x;
      const dy = enemy.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) continue;

      const dmgScale = clamp(1 - dist / (radius + 0.001) * 0.55, 0.4, 1);
      const dmg = baseDmg * dmgScale;
      enemy.hp -= dmg;
      state.damageDealt += dmg;

      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);
      enemy.vx += nx * 220;
      enemy.vy += ny * 220;

      spawnFloatText(enemy.x, enemy.y - enemy.r, `${Math.round(dmg)}`, "#ffd6aa", 12, 0.48);
      hitCount += 1;
    }

    state.burstUses += 1;
    if (hitCount > 0) {
      state.swingCombo = clamp(state.swingCombo + Math.max(1, hitCount * 0.36), 0, 60);
      state.swingComboTimer = Math.max(state.swingComboTimer, 1.3);
    }
    state.fury = clamp(state.fury + Math.min(24, 6 + hitCount * 1.6), 0, 100);
    state.vacuumPulse = Math.max(state.vacuumPulse, 0.8);
    state.frenzy = Math.max(state.frenzy, 1.2);
    state.burstCd = burstCooldownMax();
    if (state.nunchaku) {
      const n = state.nunchaku;
      const dx = n.x - p.x;
      const dy = n.y - p.y;
      const len = Math.hypot(dx, dy) || 1;
      n.vx += (dx / len) * 360;
      n.vy += (dy / len) * 360;
      n.spin = clamp(n.spin + 0.5, 0, 3.2);
    }

    spawnParticles(p.x, p.y, "#ffd7aa", 26, 220, 0.45);
    triggerFlash("255,180,120", 0.12);
    triggerShake(5.6);
    sfxBurst();
    log(`Snap cast: ${hitCount} hit${hitCount === 1 ? "" : "s"}.`);
  }

  function handleDrops(dt) {
    const p = state.player;

    for (let i = state.drops.length - 1; i >= 0; i -= 1) {
      const drop = state.drops[i];
      drop.age = (drop.age || 0) + dt;
      drop.vx *= 0.98;
      drop.vy = drop.vy * 0.95 + 26 * dt;
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
      drop.bob += dt * 4;
      drop.y += Math.sin(drop.bob) * dt * 8;

      drop.x = clamp(drop.x, 10, W - 10);
      drop.y = clamp(drop.y, 10, H - 10);

      const dist = distance(drop, p);
      const vacuumMul = state.vacuumPulse > 0 ? 2.55 : 1;
      const staleMul = drop.age > 7 ? 1 + Math.min(1.2, (drop.age - 7) * 0.28) : 1;
      const pickupRange =
        (p.pickupRange +
          p.level * 2 +
          state.equipmentBonuses.pickup +
          state.skillBonuses.pickup +
          (drop.kind === "legendary" ? 22 : 0) +
          (state.glitchActive ? 24 : 0)) *
        vacuumMul *
        staleMul;

      if (dist < pickupRange) {
        const ux = (p.x - drop.x) / (dist || 1);
        const uy = (p.y - drop.y) / (dist || 1);
        const pull = (140 + p.level * 9 + (drop.kind === "legendary" ? 80 : 0)) * (state.vacuumPulse > 0 ? 2.2 : 1);
        drop.x += ux * pull * dt;
        drop.y += uy * pull * dt;
      } else if (drop.age > 10) {
        const ux = (p.x - drop.x) / (dist || 1);
        const uy = (p.y - drop.y) / (dist || 1);
        const recoverPull = 70 + (drop.age - 10) * 18;
        drop.x += ux * recoverPull * dt;
        drop.y += uy * recoverPull * dt;
      }

      if (dist < p.r + drop.r + 14) {
        const dropResult = applyDrop(drop);
        spawnParticles(drop.x, drop.y, drop.color, drop.kind === "legendary" ? 18 : 9, 120, 0.34);
        state.drops.splice(i, 1);
        renderAffixList();
        renderDropList();
        if (dropResult === "pause") break;
      }
    }
  }

  function updateEnemies(dt) {
    const p = state.player;
    let closePressureCount = 0;
    const roleCounts = countEnemyRoles(state.enemies);
    const activeMiniBoss = getActiveMiniBoss();
    state.enemyRoleCounts = roleCounts;

    for (const enemy of state.enemies) {
      enemy.touchCd = Math.max(0, enemy.touchCd - dt);

      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist;
      const uy = dy / dist;
      if (dist < p.r + 98) closePressureCount += 1;

      const role = enemy.role || "chaser";
      const bossPhase = enemy.miniBoss ? getMiniBossPhase(enemy) : 0;
      const bossProfile = enemy.miniBoss ? getMiniBossProfile(enemy) : null;
      if (enemy.miniBoss) {
        enemy.bossPhase = bossPhase;
        enemy.bossAura = clamp((enemy.bossAura || 0) + dt * 1.8, 0, 1);
        const dashCdMul = (bossProfile && bossProfile.dashCdMul) || 1;
        const slamCdMul = (bossProfile && bossProfile.slamCdMul) || 1;
        const callCdMul = (bossProfile && bossProfile.callCdMul) || 1;
        enemy.bossDashCd = Math.max(0, (enemy.bossDashCd || rand(2.2, 3.8) * dashCdMul) - dt);
        enemy.bossSlamCd = Math.max(0, (enemy.bossSlamCd || rand(3.4, 5.2) * slamCdMul) - dt);
        enemy.bossCallCd = Math.max(0, (enemy.bossCallCd || rand(6.8, 9.6) * callCdMul) - dt);

        if (enemy.bossDashCd <= 0 && dist > p.r + 34) {
          const dashPower = (210 + bossPhase * 84 + state.wave * 4.2) * ((bossProfile && bossProfile.dashMul) || 1);
          enemy.vx += ux * dashPower;
          enemy.vy += uy * dashPower;
          enemy.bossDashCd = (rand(4.6, 6.2) - bossPhase * 0.55) * dashCdMul;
          spawnFloatText(enemy.x, enemy.y - enemy.r - 12, bossPhase >= 3 ? "BERSERK CHARGE" : "CHARGE", "#ffc59f", 12, 0.72);
          triggerDanger(bossPhase >= 3 ? "BOSS BERSERK CHARGE" : "BOSS CHARGE", 1.8 + bossPhase * 0.28);
          triggerShake(3.6);
        }

        if (enemy.bossSlamCd <= 0 && dist < 240) {
          const slamRadius = clamp(
            (66 + bossPhase * 20 + state.wave * 0.8) * ((bossProfile && bossProfile.slamRadiusMul) || 1),
            52,
            172
          );
          const slamDelay = clamp(0.74 - bossPhase * 0.1, 0.34, 0.8);
          const spread = (bossProfile && bossProfile.hazardScatter) || 1;
          spawnBossHazard(state.player.x + rand(-26, 26) * spread, state.player.y + rand(-26, 26) * spread, {
            radius: slamRadius,
            delay: slamDelay,
            life: 1.45,
            damage: enemy.damage * (0.44 + bossPhase * 0.18) * ((bossProfile && bossProfile.slamDamageMul) || 1),
            label: bossPhase >= 3 ? "OMEGA" : "SLAM",
            color: bossPhase >= 3 ? "255,98,82" : "255,132,98",
          });
          enemy.bossSlamCd = (rand(5.2, 7.2) - bossPhase * 0.62) * slamCdMul;
          triggerDanger(bossPhase >= 3 ? "OMEGA SLAM MARKED" : "SLAM MARKED", 2);
          setGiftEvent(
            "assault",
            `${(bossProfile && bossProfile.title) || "BOSS"} SKILL`,
            "HIGH",
            `Avoid ${bossPhase >= 3 ? "OMEGA" : "SLAM"}`,
            2.1
          );
        }

        if (enemy.bossCallCd <= 0) {
          const reinforceMul = (bossProfile && bossProfile.reinforceMul) || 1;
          const reinforceCount = Math.max(1, Math.round((1.2 + bossPhase * 0.7) * reinforceMul));
          const reinforced = reinforceEnemies(
            reinforceCount,
            1.02 + bossPhase * 0.012,
            1.024 + bossPhase * 0.013,
            1.008 + bossPhase * 0.009,
            0.04 + bossPhase * 0.015
          );
          const spawned = spawnReinforcementPack(
            enemy.x,
            enemy.y,
            Math.max(1, Math.round((0.8 + bossPhase * 0.52) * reinforceMul)),
            0.18 + bossPhase * 0.06
          );
          enemy.bossCallCd = (rand(9.4, 12.8) - bossPhase * 0.55) * callCdMul;
          triggerDanger("BOSS REINFORCE", 2.1);
          setGiftEvent(
            "assault",
            `${(bossProfile && bossProfile.title) || "BOSS"} CALL`,
            "HIGH",
            `Reinforce x${reinforced + spawned}`,
            2.9 + bossPhase * 0.24
          );
          spawnFloatText(enemy.x, enemy.y - enemy.r - 12, "REINFORCE", "#ffd7ab", 12, 0.76);
        }
      }

      const enrageSpeed = 1 + clamp((state.time - 18) * 0.007, 0, 0.95) + state.fury * 0.0012;
      const speed =
        enemy.speed * state.enemySpeedMul * enrageSpeed * (enemy.miniBoss ? 0.92 + bossPhase * 0.12 + ((bossProfile && bossProfile.speedMul) || 1) * 0.02 : 1);
      let chaseMul = 0.72;
      let tangentMul = 0;

      if (enemy.miniBoss) {
        chaseMul = 0.66 + bossPhase * 0.1;
        if (dist < p.r + 68) chaseMul = 0.4 + bossPhase * 0.06;
        tangentMul = 0.14 + bossPhase * 0.05;
      } else if (role === "zoner") {
        const ring = clamp(128 + state.wave * 3 + (enemy.elite ? 10 : 0), 124, 188);
        const band = 24;
        if (dist < ring - band) {
          chaseMul = -0.52;
        } else if (dist > ring + band) {
          chaseMul = 0.48;
        } else {
          chaseMul = 0.06;
          tangentMul = enemy.elite ? 0.46 : 0.34;
        }
      } else if (role === "bruiser") {
        chaseMul = 0.58;
        if (dist < p.r + 52) chaseMul = 0.3;
        tangentMul = 0.08;
      } else {
        if (dist < p.r + 44) {
          chaseMul = 0.38;
        } else if (dist < p.r + 82) {
          chaseMul = 0.56;
        }
        tangentMul = 0.16 + (enemy.elite ? 0.08 : 0);
      }

      enemy.vx += ux * speed * dt * chaseMul;
      enemy.vy += uy * speed * dt * chaseMul;
      if (dist < p.r + 76) {
        const ringPush = clamp(1 - (dist - p.r) / 76, 0, 1);
        enemy.vx -= ux * speed * dt * (0.24 + ringPush * 0.22);
        enemy.vy -= uy * speed * dt * (0.24 + ringPush * 0.22);
        enemy.vx += -uy * speed * dt * tangentMul;
        enemy.vy += ux * speed * dt * tangentMul;
      } else if (role === "zoner" && tangentMul > 0) {
        enemy.vx += -uy * speed * dt * tangentMul * 0.56;
        enemy.vy += ux * speed * dt * tangentMul * 0.56;
      }
      enemy.vx *= 0.92;
      enemy.vy *= 0.92;
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
    }
    state.closePressure = closePressureCount;

    for (let i = 0; i < state.enemies.length; i += 1) {
      const a = state.enemies[i];
      for (let j = i + 1; j < state.enemies.length; j += 1) {
        const b = state.enemies[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d < 0.001) {
          dx = rand(-1, 1);
          dy = rand(-1, 1);
          d = Math.hypot(dx, dy);
        }

        const minDist = a.r + b.r + 2;
        if (d < minDist) {
          const nx = dx / d;
          const ny = dy / d;
          const push = (minDist - d) * 0.5;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;

          if (state.glitchActive && state.affixes.scatter > 0) {
            const bugImpulse = Math.min(160, Math.pow(state.affixes.scatter + 1, 2) * 3.2);
            a.vx -= nx * bugImpulse;
            a.vy -= ny * bugImpulse;
            b.vx += nx * bugImpulse;
            b.vy += ny * bugImpulse;
          }
        }
      }
    }

    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = state.enemies[i];
      enemy.x = clamp(enemy.x, -36, W + 36);
      enemy.y = clamp(enemy.y, -36, H + 36);

      const d = distance(enemy, p);
      if (d <= enemy.r + p.r + 1) {
        const enrageDamage = 1 + clamp((state.time - 16) * 0.01, 0, 1.2) + state.fury * 0.0016;
        const touchScale = (1 + state.wave * 0.11 + state.time * 0.012) * enrageDamage;
        const mitigation = clamp(state.equipmentBonuses.mitigation, 0, 0.55);
        const lateStage = clamp(
          Math.max(0, state.time - 58) * 0.01 + Math.max(0, state.wave - 1) * 0.08 + Math.max(0, state.fury - 55) * 0.002,
          0,
          0.38
        );
        const flowPressure = clamp((state.flowScore - 0.78) * 0.45, 0, 0.12);
        const tensionMul = 1 + lateStage + flowPressure;
        const overlapDepth = clamp((enemy.r + p.r + 1 - d) / Math.max(1, enemy.r + p.r), 0, 1);
        const overlapMul = 0.72 + overlapDepth * 0.32;
        const crowdSaturation = clamp(state.closePressure / 12, 0, 1);
        const crowdDampen = clamp(0.26 - lateStage * 0.1, 0.16, 0.26);
        const multiContactMul = 1 - crowdSaturation * crowdDampen;
        const hitCadenceMul = (state.closePressure >= 7 ? 1.22 : state.closePressure >= 5 ? 1.1 : 1) + lateStage * 0.34;
        const hitCooldown = 0.22 * hitCadenceMul;
        const invulnTime = 0.19 * hitCadenceMul;
        if (state.hitCooldown <= 0 && (p.invulnTime || 0) <= 0) {
          const hpRate = p.hp / Math.max(1, p.maxHp);
          const panicGuard = hpRate < 0.38 ? 0.82 : 1;
          const crowdGuard = state.closePressure >= 7 ? 0.84 : state.closePressure >= 5 ? 0.9 : 1;
          const activeBossPhase = activeMiniBoss ? activeMiniBoss.bossPhase || getMiniBossPhase(activeMiniBoss) : 0;
          const duelFocusMul = activeMiniBoss
            ? enemy.miniBoss
              ? activeBossPhase >= 3
                ? 1.12
                : 1.16
              : activeBossPhase >= 3
                ? 0.32
                : 0.48
            : 1;
          const bossTouchProfile = enemy.miniBoss ? getMiniBossProfile(enemy) : null;
          const executeTouchMul =
            bossTouchProfile && bossTouchProfile.id === "executioner" && hpRate < 0.48 ? 1.22 : 1;
          const bossTouchMul = enemy.miniBoss ? ((bossTouchProfile && bossTouchProfile.touchMul) || 1.1) : 1;
          let touchDamage = Math.max(
            2,
            enemy.damage *
              touchScale *
              0.024 *
              tensionMul *
              overlapMul *
              multiContactMul *
              duelFocusMul *
              bossTouchMul *
              executeTouchMul *
              (1 - mitigation) *
              panicGuard *
              crowdGuard
          );
          if (enemy.miniBoss) {
            const bossHitCap = p.maxHp * (activeBossPhase >= 3 ? 0.28 : activeBossPhase === 2 ? 0.24 : 0.2);
            touchDamage = Math.min(touchDamage, bossHitCap);
          } else if (activeMiniBoss) {
            const addHitCap = p.maxHp * 0.12;
            touchDamage = Math.min(touchDamage, addHitCap);
          }
          p.hp -= touchDamage;
          state.hitCooldown = hitCooldown;
          p.invulnTime = invulnTime;
          state.hitsTaken += 1;
          objectiveEvent("player_hit");
          triggerFlash("255,92,92", 0.16);
          triggerShake(4.4);
          spawnParticles(p.x, p.y, "#ff7f7f", 10, 120, 0.3);
          spawnFloatText(p.x + rand(-8, 8), p.y - 18, `-${Math.round(touchDamage)}`, "#ffb4a6", 11, 0.35);
          for (const other of state.enemies) {
            const ox = other.x - p.x;
            const oy = other.y - p.y;
            const od = Math.hypot(ox, oy) || 1;
            if (od > 140) continue;
            const wavePush = (1 - od / 140) * 190;
            other.vx += (ox / od) * wavePush;
            other.vy += (oy / od) * wavePush;
          }
          sfxPlayerHit();
        }

        if (p.hp / Math.max(1, p.maxHp) < 0.25 && state.lastStandCd <= 0) {
          state.lastStandCd = 6.5;
          state.frenzy = Math.max(state.frenzy, 2.4);
          state.vacuumPulse = Math.max(state.vacuumPulse, 1.4);
          p.invulnTime = Math.max(p.invulnTime || 0, 0.68);
          p.hp = clamp(p.hp + p.maxHp * 0.05, 1, p.maxHp);
          spawnFloatText(p.x, p.y - 30, "LAST STAND", "#ffb38f", 15, 0.9);
          triggerFlash("255,100,70", 0.1);
        }

        if (enemy.touchCd <= 0) {
          enemy.touchCd = 0.18;
          const nx = (enemy.x - p.x) / (d || 1);
          const ny = (enemy.y - p.y) / (d || 1);
          enemy.vx += nx * 140;
          enemy.vy += ny * 140;
        }
      }

      if (enemy.hp <= 0) {
        onEnemyDeath(enemy);
        state.enemies.splice(i, 1);
      }
    }
  }

  function updatePlayer(dt) {
    const p = state.player;
    const b = state.equipmentBonuses || createEquipmentBonusTemplate();
    const prevX = p.x;
    const prevY = p.y;

    p.r = clamp((p.baseRadius || 11) + (b.size || 0), 8, 22);

    const dx = p.targetX - p.x;
    const dy = p.targetY - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      const moveSpeed = Math.max(
        72,
        p.speed + b.move + state.skillBonuses.move - Math.max(0, p.r - 11) * 4 + (p.swingAssist - 1) * 16
      );
      const step = Math.min(dist, moveSpeed * dt);
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
    }

    const input = state.input || {};
    const ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const iy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    if (ix !== 0 || iy !== 0) {
      const len = Math.hypot(ix, iy) || 1;
      const moveSpeed = Math.max(
        72,
        p.speed + b.move + state.skillBonuses.move - Math.max(0, p.r - 11) * 4 + (p.swingAssist - 1) * 16
      );
      p.x += (ix / len) * moveSpeed * dt;
      p.y += (iy / len) * moveSpeed * dt;
      p.targetX = p.x;
      p.targetY = p.y;
    }

    p.x = clamp(p.x, p.r, W - p.r);
    p.y = clamp(p.y, p.r, H - p.r);
    p.vx = (p.x - prevX) / Math.max(0.0001, dt);
    p.vy = (p.y - prevY) / Math.max(0.0001, dt);
    p.attackCd = 0;
  }

  function computeSwingImpactDamage(impactSpeed) {
    const p = state.player;
    const b = state.equipmentBonuses || createEquipmentBonusTemplate();
    const skillB = state.skillBonuses;
    const baseDamageStat =
      p.baseDamage *
      p.jobDamageMul *
      p.weaponDamageMul *
      p.swingDamageMul *
      (1 + (b.swingBoost || 0)) *
      (1 + b.damageMul) *
      skillB.damageMul *
      (1 + (skillB.swing || 0));
    let damage = impactSpeed * baseDamageStat * 0.03;
    damage *= 1 + state.fury * 0.007 + state.affixes.overflow * 0.12;
    damage *= 1 + Math.floor(state.swingCombo || 0) * 0.035;
    if (state.glitchActive) {
      damage *= 1 + state.bugChain * 0.09;
    }
    return Math.max(1, damage);
  }

  function spawnProcShot(originX, originY, dirX, dirY, baseDamage, impactSpeed, crit) {
    const b = state.equipmentBonuses || createEquipmentBonusTemplate();
    const dirLen = Math.hypot(dirX, dirY) || 1;
    const nx = dirX / dirLen;
    const ny = dirY / dirLen;
    const spread = clamp(0.05 + state.affixes.scatter * 0.01, 0.04, 0.24);
    const angle = Math.atan2(ny, nx) + rand(-spread, spread);
    const speed = clamp(420 + impactSpeed * 1.12 + (b.swingBoost || 0) * 240, 360, 980);
    const damageMul = clamp(0.2 + (b.hitShotChance || 0) * 0.9, 0.2, 0.66);
    const damage = Math.max(1, baseDamage * damageMul * (crit ? 1.08 : 1));
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const life = clamp(0.56 + speed * 0.00052, 0.52, 1.05);

    state.bullets.push({
      x: originX,
      y: originY,
      prevX: originX,
      prevY: originY,
      vx,
      vy,
      r: 3.6,
      life,
      maxLife: life,
      damage,
      pierce: 0,
      source: "proc",
      color: crit ? "#ffe7a5" : "#ffd3a4",
    });
    if (state.bullets.length > 140) {
      state.bullets.splice(0, state.bullets.length - 140);
    }
  }

  function updateProcShots(dt) {
    if (!state.bullets.length) return;
    let removedEnemy = false;

    for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
      const shot = state.bullets[i];
      shot.life -= dt;
      if (shot.life <= 0) {
        state.bullets.splice(i, 1);
        continue;
      }

      shot.prevX = shot.x;
      shot.prevY = shot.y;
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;

      if (shot.x < -24 || shot.x > W + 24 || shot.y < -24 || shot.y > H + 24) {
        state.bullets.splice(i, 1);
        continue;
      }

      let hitEnemy = null;
      for (const enemy of state.enemies) {
        const hitR = enemy.r + shot.r;
        if (distanceSqToSegment(enemy.x, enemy.y, shot.prevX, shot.prevY, shot.x, shot.y) <= hitR * hitR) {
          hitEnemy = enemy;
          break;
        }
      }
      if (!hitEnemy) continue;

      hitEnemy.hp -= shot.damage;
      state.damageDealt += shot.damage;
      const dx = hitEnemy.x - shot.x;
      const dy = hitEnemy.y - shot.y;
      const len = Math.hypot(dx, dy) || 1;
      hitEnemy.vx += (dx / len) * (40 + Math.min(220, Math.hypot(shot.vx, shot.vy) * 0.2));
      hitEnemy.vy += (dy / len) * (40 + Math.min(220, Math.hypot(shot.vx, shot.vy) * 0.2));
      spawnFloatText(hitEnemy.x, hitEnemy.y - hitEnemy.r - 4, `${Math.round(shot.damage)}`, "#ffd9b4", 9, 0.34);
      spawnParticles(hitEnemy.x, hitEnemy.y, shot.color || "#ffd3a4", 4, 110, 0.22);

      shot.pierce -= 1;
      if (shot.pierce < 0) {
        state.bullets.splice(i, 1);
      }
    }

    for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = state.enemies[i];
      if (enemy.hp > 0) continue;
      onEnemyDeath(enemy);
      state.enemies.splice(i, 1);
      removedEnemy = true;
    }
    if (removedEnemy) {
      state.threatScore = computeThreatScore();
    }
  }

  function updateNunchaku(dt) {
    const p = state.player;
    const b = state.equipmentBonuses || createEquipmentBonusTemplate();
    if (!state.nunchaku) resetNunchakuToPlayer();
    const n = state.nunchaku;

    n.hitCd = Math.max(0, n.hitCd - dt);
    n.selfHitCd = Math.max(0, n.selfHitCd - dt);
    n.prevX = n.x;
    n.prevY = n.y;
    n.elasticBoost = Math.max(0, (n.elasticBoost || 0) - dt * 220);
    n.rubberTimer = Math.max(0, (n.rubberTimer || 0) - dt);
    n.rubberCd = Math.max(0, (n.rubberCd || 0) - dt);

    const desiredLength = clamp((p.weaponReach || 84) * 0.72 + state.affixes.scatter * 1.1 + (b.swingBoost || 0) * 11, 44, 112);
    n.restLength = Number.isFinite(n.restLength) ? n.restLength : n.length || desiredLength;
    // No auto-retraction: keep chain rest length unless explicitly stretched by a rubber event.
    if (n.restLength < desiredLength) n.restLength = desiredLength;

    const moveSpeed = Math.hypot(p.vx, p.vy);
    const rubberTriggerChance = clamp(0.035 + moveSpeed * 0.00016 + state.fury * 0.00022, 0.02, 0.14) * dt * 60;
    if (n.rubberTimer <= 0 && n.rubberCd <= 0 && Math.random() < rubberTriggerChance) {
      n.rubberTimer = rand(0.28, 0.62);
      n.rubberCd = rand(1.1, 2.2);
      n.restLength = clamp(n.restLength * rand(1.05, 1.12), desiredLength, desiredLength * 1.36);
      n.stretchLimit = clamp(n.stretchLimit * rand(1.02, 1.08), 18, 160);
      n.rubberMul = 1;
    }
    const rubberOn = n.rubberTimer > 0;
    const baseRest = n.restLength;
    n.headR = clamp((p.weaponHeadRadius || 11) + state.affixes.multicast * 0.34, 8, 18);

    let rx = n.x - p.x;
    let ry = n.y - p.y;
    let dist = Math.hypot(rx, ry);
    if (dist < 0.0001) {
      rx = baseRest;
      ry = 0;
      dist = Math.max(1, baseRest);
      n.x = p.x + rx;
      n.y = p.y + ry;
    }
    let nx = rx / dist;
    let ny = ry / dist;
    const tangentX = -ny;
    const tangentY = nx;
    const relVx = n.vx - p.vx;
    const relVy = n.vy - p.vy;
    const anchorAx = ((p.vx || 0) - (n.anchorVx || 0)) / Math.max(0.0001, dt);
    const anchorAy = ((p.vy || 0) - (n.anchorVy || 0)) / Math.max(0.0001, dt);
    n.anchorVx = p.vx || 0;
    n.anchorVy = p.vy || 0;
    n.stretchLimit = clamp(Number.isFinite(n.stretchLimit) ? n.stretchLimit : desiredLength * 0.72, 18, 160);
    const tangentialV = relVx * tangentX + relVy * tangentY;
    const tangentialAccel = anchorAx * tangentX + anchorAy * tangentY;
    const radialAccel = anchorAx * nx + anchorAy * ny;
    const preStretch = Math.max(0, dist - baseRest);
    const spinStretch = clamp(
      Math.max(0, Math.abs(tangentialV) - 30) * (rubberOn ? 0.22 : 0.16),
      0,
      n.stretchLimit * (rubberOn ? 0.84 : 0.72)
    );
    const magneticStretch = clamp(
      Math.max(0, Math.abs(tangentialAccel) - 160) * 0.0048 + preStretch * 0.24,
      0,
      n.stretchLimit * 0.52
    );
    const activeStretch = clamp(spinStretch + magneticStretch, 0, n.stretchLimit);
    const activeRest = baseRest + activeStretch;
    n.length = activeRest;
    n.maxLength = baseRest + n.stretchLimit * (rubberOn ? 1.08 : 1);
    const radialV = relVx * nx + relVy * ny;
    const stretch = dist - activeRest;

    const springK = (rubberOn ? 9 : 15) + (b.swingBoost || 0) * 18 + state.affixes.multicast * 2.2;
    // Pull-only spring: no outward push when the head is inside rest distance.
    const springForce = -Math.max(0, stretch) * springK;
    n.vx += nx * springForce * dt;
    n.vy += ny * springForce * dt;

    const towMul = clamp(moveSpeed / 150, 0.1, 1.6);
    n.vx += p.vx * towMul * 0.036 * dt;
    n.vy += p.vy * towMul * 0.036 * dt;
    const lateralCarry = (p.vx * tangentX + p.vy * tangentY) * (rubberOn ? 0.34 : 0.28);
    n.vx += tangentX * lateralCarry * dt;
    n.vy += tangentY * lateralCarry * dt;
    const magneticPull = clamp(34 + preStretch * 5.2 + Math.abs(radialV) * 0.14 + Math.abs(radialAccel) * 0.018, 18, 220);
    n.vx -= nx * magneticPull * dt;
    n.vy -= ny * magneticPull * dt;
    const yank = tangentialAccel * 0.0016 + tangentialV * 0.018;
    n.vx += tangentX * yank * dt;
    n.vy += tangentY * yank * dt;

    const jitter = (Math.random() - 0.5) * (rubberOn ? 6.2 : 2.8);
    n.vx += tangentX * jitter * dt;
    n.vy += tangentY * jitter * dt;

    n.aimX = p.x + nx * activeRest;
    n.aimY = p.y + ny * activeRest;

    n.x += n.vx * dt;
    n.y += n.vy * dt;

    const afterDx = n.x - p.x;
    const afterDy = n.y - p.y;
    const afterDist = Math.hypot(afterDx, afterDy) || 1;
    if (afterDist > n.maxLength) {
      const ax = afterDx / afterDist;
      const ay = afterDy / afterDist;
      n.x = p.x + ax * n.maxLength;
      n.y = p.y + ay * n.maxLength;
      const relOutVx = n.vx - p.vx;
      const relOutVy = n.vy - p.vy;
      const radialOut = relOutVx * ax + relOutVy * ay;
      if (radialOut > 0) {
        n.vx -= ax * radialOut;
        n.vy -= ay * radialOut;
      }
    }

    n.x = clamp(n.x, 4, W - 4);
    n.y = clamp(n.y, 4, H - 4);
    const finalDx = n.x - p.x;
    const finalDy = n.y - p.y;
    const finalDist = Math.hypot(finalDx, finalDy) || 1;
    if (finalDist > 0.0001) {
      nx = finalDx / finalDist;
      ny = finalDy / finalDist;
    }
    n.stretch = finalDist - activeRest;
    n.tension = clamp(Math.max(0, n.stretch) / Math.max(1, n.maxLength - activeRest), 0, 1);
    if (rubberOn && n.tension > 0.72) {
      n.elasticBoost = Math.max(n.elasticBoost || 0, Math.abs(radialV) * 0.22);
    }
    n.speed = Math.hypot(n.vx, n.vy);
    n.spin = clamp(n.speed * 0.0012, 0, 3.2);
    const sweepBonus = clamp(n.speed * 0.018, 0, 12);

    for (const enemy of state.enemies) {
      enemy.nunchakuHitCd = Math.max(0, (enemy.nunchakuHitCd || 0) - dt);
      const ex = enemy.x - n.x;
      const ey = enemy.y - n.y;
      const hitDist = n.headR + enemy.r;
      const hitDistSq = hitDist * hitDist;
      const directHit = ex * ex + ey * ey <= hitDistSq;
      const sweptHit = distanceSqToSegment(enemy.x, enemy.y, n.prevX, n.prevY, n.x, n.y) <= (hitDist + sweepBonus) * (hitDist + sweepBonus);
      if (!directHit && !sweptHit) continue;
      if (enemy.nunchakuHitCd > 0) continue;

      const relVx = n.vx - (enemy.vx || 0);
      const relVy = n.vy - (enemy.vy || 0);
      const impactSpeed = Math.max(0, Math.hypot(relVx, relVy));
      if (impactSpeed < 46) continue;

      const critChance = clamp(
        0.05 + p.critBonus + state.affixes.lucky * 0.05 + state.skillBonuses.crit,
        0.05,
        state.glitchActive ? 0.8 : 0.62
      );
      const crit = Math.random() < critChance;
      let damage = computeSwingImpactDamage(impactSpeed);
      if (crit) damage *= 1.78 + p.weaponCritMul * 0.3;
      if (enemy.miniBoss) {
        damage *= 1.28 + n.tension * 0.32;
      }

      enemy.hp -= damage;
      state.damageDealt += damage;
      enemy.nunchakuHitCd = 0.09;
      state.swingCombo = clamp(state.swingCombo + 1 + Math.min(1.8, impactSpeed / 180), 0, 60);
      state.swingComboTimer = 2.4;

      const len = Math.hypot(ex, ey) || 1;
      const ux = ex / len;
      const uy = ey / len;
      enemy.vx += ux * (64 + impactSpeed * 0.5);
      enemy.vy += uy * (64 + impactSpeed * 0.5);
      n.vx -= ux * impactSpeed * 0.6;
      n.vy -= uy * impactSpeed * 0.6;

      spawnFloatText(enemy.x, enemy.y - enemy.r, `${Math.round(damage)}`, crit ? "#ffe28f" : "#9edfff", crit ? 14 : 11, 0.55);
      spawnParticles(enemy.x, enemy.y, crit ? "#ffd578" : "#79d5ff", crit ? 13 : 7, crit ? 150 : 115, 0.36);

      if (crit) {
        objectiveEvent("crit_hit");
        triggerShake(4.2);
        triggerFlash("255,220,140", 0.08);
      }
      if (state.glitchActive && Math.random() < 0.12 + state.affixes.overflow * 0.025) {
        const glitchBonus = damage * (0.24 + state.bugChain * 0.06);
        enemy.hp -= glitchBonus;
        state.damageDealt += glitchBonus;
        spawnFloatText(enemy.x, enemy.y + 14, `GLITCH ${Math.round(glitchBonus)}`, "#ff9bc1", 10, 0.45);
      }
      const splashBase = state.player.weaponSplash + b.splash + state.skillBonuses.splash;
      if (splashBase > 0) {
        const radius = clamp(splashBase + state.affixes.scatter * 9, 0, 200);
        if (radius > 0) applySplashDamage(enemy.x, enemy.y, radius, damage * 0.22);
      }
      const procShotChance = clamp((b.hitShotChance || 0) + state.affixes.multicast * 0.015 + (crit ? 0.06 : 0), 0, 0.88);
      if (Math.random() < procShotChance) {
        spawnProcShot(n.x, n.y, ux, uy, damage, impactSpeed, crit);
      }
    }

    const sx = n.x - p.x;
    const sy = n.y - p.y;
    const distToPlayer = Math.hypot(sx, sy);
    const selfHitDist = n.headR + p.r + 4;
    const inwardSpeed = distToPlayer > 0.001 ? -(sx * n.vx + sy * n.vy) / distToPlayer : 0;
    if (distToPlayer <= selfHitDist && inwardSpeed > 6 && n.selfHitCd <= 0) {
      const relSelfVx = n.vx - p.vx;
      const relSelfVy = n.vy - p.vy;
      const selfImpactSpeed = Math.max(0, Math.hypot(relSelfVx, relSelfVy));
      if (selfImpactSpeed >= 46) {
        const guard = clamp(b.mitigation + (b.selfGuard || 0) + (p.selfGuard || 0), 0, 0.84);
        const rawSelfDamage = computeSwingImpactDamage(selfImpactSpeed);
        const selfDamage = Math.max(1, rawSelfDamage * (1 - guard));
        p.hp -= selfDamage;
        state.hitsTaken += 1;
        state.swingCombo = Math.max(0, state.swingCombo * 0.36);
        state.swingComboTimer = 0.9;
        objectiveEvent("player_hit");
        spawnFloatText(p.x, p.y - p.r - 10, `SELF ${Math.round(selfDamage)}`, "#ff9f9f", 11, 0.52);
        triggerFlash("255,120,120", 0.07);
        sfxPlayerHit();
        n.selfHitCd = 0.32;
        n.vx *= -1;
        n.vy *= -1;
      }
    }
  }

  function updateWaveSpawner(dt) {
    const activeBoss = getActiveMiniBoss();
    if (activeBoss) {
      const bossPhase = activeBoss.bossPhase || getMiniBossPhase(activeBoss);
      const phaseCapRatio = bossPhase >= 3 ? 0.24 : bossPhase === 2 ? 0.3 : 0.36;
      const capDuringBoss = Math.max(9, Math.floor(maxEnemiesOnField() * phaseCapRatio));
      if (state.enemies.length > capDuringBoss) {
        trimEnemiesForBoss(capDuringBoss);
      }
      state.spawnTimer = Math.max(state.spawnTimer, 0.3);
    }

    const budget = waveBudget(state.wave);
    if (state.waveSpawned < budget && !activeBoss) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        const directorSpawnBoost = clamp((state.directorBias - 1) * 0.24, 0, 0.5);
        const spawned = spawnEnemy(directorSpawnBoost);
        if (spawned) state.waveSpawned += 1;
        state.spawnTimer = Math.max(
          0.045,
          0.72 * Math.pow(0.988, Math.max(0, state.wave - 1)) - state.giftCount * 0.008 - directorSpawnBoost * 0.52
        );
      }
    } else if (!state.enemies.length) {
      state.wave += 1;
      state.waveSpawned = 0;
      state.spawnTimer = 0.45;
      log(`Wave ${state.wave} starts. Pressure rising.`);
      spawnFloatText(W * 0.5, 40, `WAVE ${state.wave}`, "#9ed5ff", 18, 0.85);
      triggerFlash("110,170,255", 0.1);
      sfxWave();

      if (state.wave >= state.nextMiniBossWave) {
        state.nextMiniBossWave += WAVE_MINIBOSS_INTERVAL;
        spawnMiniBoss();
      }

      if (state.wave >= state.nextMutationWave) {
        state.nextMutationWave += WAVE_MUTATION_INTERVAL;
        openMutationModal();
      }
    }

    tryTriggerEmergencyBoss(false);
  }

  function tryTriggerEmergencyBoss(allowDuringPause) {
    const emergencyWaveGate =
      state.wave >= 2 || (state.wave === 1 && state.time >= 34 && state.killsTotal >= 6) || state.giftValue >= 180;
    if (!emergencyWaveGate) return false;
    const timeGate = Math.max(18, state.nextEmergencyBossAt || 18);
    const killGate = Math.max(16, state.nextEmergencyBossKill || 16);
    const shouldTriggerEmergency =
      state.pendingEmergencyBoss ||
      state.time >= timeGate ||
      state.killsTotal >= killGate;
    if (!shouldTriggerEmergency) return false;

    const activeBossNow = getActiveMiniBoss();
    if (activeBossNow) {
      state.pendingEmergencyBoss = false;
      state.nextEmergencyBossAt = Math.max(state.nextEmergencyBossAt, state.time + 8);
      state.nextEmergencyBossKill = Math.max(state.nextEmergencyBossKill || 0, state.killsTotal + 7);
      return false;
    }

    if (state.pauseMode && !allowDuringPause) {
      state.pendingEmergencyBoss = true;
      return false;
    }

    const spawned = spawnMiniBoss();
    if (spawned) {
      state.pendingEmergencyBoss = false;
      state.nextEmergencyBossAt = state.time + clamp(58 - state.wave * 1.05, 30, 58);
      state.nextEmergencyBossKill = state.killsTotal + Math.max(14, 16 + Math.floor(state.wave * 1.8));
      log("Emergency miniboss event triggered.");
      return true;
    }

    state.pendingEmergencyBoss = true;
    state.nextEmergencyBossAt = state.time + 10;
    state.nextEmergencyBossKill = state.killsTotal + 8;
    return false;
  }

  function updateState(dt) {
    if (!state.running) return;
    if (state.pauseMode === "levelup") {
      state.time += dt;
      tryTriggerEmergencyBoss(true);
      updateEffects(dt * 0.35);
      state.levelAutoPickTimer = Math.max(0, state.levelAutoPickTimer - dt);
      updateLevelAutoTimerLabel();
      if (state.levelAutoPickTimer <= 0 && state.levelChoices.length) {
        const autoChoice = pickAutoLevelSkill();
        if (autoChoice) {
          applyLevelSkill(autoChoice.id);
        }
      }
      if (state.giftEvent && state.giftEvent.timer > 0) {
        state.giftEvent.timer = Math.max(0, state.giftEvent.timer - dt * 0.35);
      }
      return;
    }
    if (state.pauseMode === "mutation") {
      state.time += dt;
      tryTriggerEmergencyBoss(true);
      updateEffects(dt * 0.35);
      if (state.giftEvent && state.giftEvent.timer > 0) {
        state.giftEvent.timer = Math.max(0, state.giftEvent.timer - dt * 0.35);
      }
      return;
    }
    if (state.pauseMode === "pickup_compare") {
      state.time += dt;
      tryTriggerEmergencyBoss(true);
      updateEffects(dt * 0.2);
      state.pickupAutoTimer = Math.max(0, state.pickupAutoTimer - dt);
      renderPickupCompareModal();
      if (state.pickupAutoTimer <= 0) {
        resolvePickupChoice(false, "auto-discard");
      }
      if (state.giftEvent && state.giftEvent.timer > 0) {
        state.giftEvent.timer = Math.max(0, state.giftEvent.timer - dt * 0.3);
      }
      return;
    }

    if (!state.pauseMode && !getPendingPickupItem() && Array.isArray(state.pendingPickupQueue) && state.pendingPickupQueue.length) {
      const next = state.pendingPickupQueue.shift();
      if (next && next.item) {
        openPickupCompareModal(next.item, next.source || "Queued");
        return;
      }
    }

    state.time += dt;
    state.timeSinceLegendary += dt;
    state.burstCd = Math.max(0, state.burstCd - dt);
    state.player.invulnTime = Math.max(0, (state.player.invulnTime || 0) - dt);
    state.streakTimer = Math.max(0, state.streakTimer - dt);
    if (state.streakTimer <= 0) state.killStreak = 0;
    state.swingComboTimer = Math.max(0, state.swingComboTimer - dt);
    if (state.swingComboTimer <= 0) {
      state.swingCombo = Math.max(0, state.swingCombo - dt * 8.5);
    }
    state.fury = Math.max(0, state.fury - dt * 3.2);
    state.legendaryMoment = Math.max(0, state.legendaryMoment - dt * 0.75);
    state.legendaryPulse = Math.max(0, state.legendaryPulse - dt * 1.05);
    state.dangerMoment = Math.max(0, state.dangerMoment - dt * 0.85);
    state.vacuumPulse = Math.max(0, state.vacuumPulse - dt * 1.1);
    state.frenzy = Math.max(0, state.frenzy - dt);
    if (state.giftEvent && state.giftEvent.timer > 0) {
      state.giftEvent.timer = Math.max(0, state.giftEvent.timer - dt);
      if (state.giftEvent.timer <= 0.001) {
        setGiftEvent("idle", "STANDBY", "--", "--", 0);
      }
    }
    state.lastStandCd = Math.max(0, state.lastStandCd - dt);
    state.spawnCapPulseCd = Math.max(0, state.spawnCapPulseCd - dt);

    state.glitchActive = true;
    state.bugUsed = true;
    state.bugTime += dt;
    state.bugChain = clamp(state.bugChain + dt * 1.6 * state.skillBonuses.glitchGainMul, 0, 16);

    drainQueuedLiveGiftEvents();
    updateDirector(dt);
    updateWaveSpawner(dt);
    state.enemySpeedMul = computeEnemySpeedMul();
    updatePlayer(dt);
    updateNunchaku(dt);
    updateEnemies(dt);
    updateProcShots(dt);
    updateBossHazards(dt);
    state.threatScore = computeThreatScore();
    if (state.threatScore >= 152 && state.player.hp < state.player.maxHp * 0.42 && state.dangerMoment <= 0.15) {
      triggerDanger("CRITICAL PRESSURE", 2.3);
    }
    handleDrops(dt);

    const hasLegendaryOnGround = state.drops.some((drop) => drop.kind === "legendary");
    if (hasLegendaryOnGround && state.time >= state.nextLegendaryBeaconAt) {
      sfxLegendaryBeacon();
      const interval = clamp(1.45 - state.fury * 0.004 - state.legendaryPulse * 0.12, 0.68, 1.5);
      state.nextLegendaryBeaconAt = state.time + interval;
      state.legendaryPulse = Math.max(state.legendaryPulse, 0.9);
    }

    updateEffects(dt);
    state.peakEnemyCount = Math.max(state.peakEnemyCount, state.enemies.length);
    if (state.drops.length > 14) state.vacuumPulse = Math.max(state.vacuumPulse, 0.8);

    state.directorNoteTimer -= dt;
    if (state.directorNoteTimer <= 0) {
      state.directorNoteTimer = 10;
      if (state.flowScore < 0.42) {
        log("Director eased pressure. Stabilize build and recover.");
      } else if (state.flowScore > 0.84) {
        log("Director escalation: high performance detected. Pressure up.");
      }
    }

    if (state.player.hp <= 0 && !state.runEnded) finishRun(false);
  }

  function finishRun(cleared) {
    state.running = false;
    state.runEnded = true;
    state.glitchActive = true;
    state.pauseMode = null;
    state.bossHazards = [];
    setGiftEvent("idle", "STANDBY", "--", "--", 0);
    releasePointerDrag(draggingPointerId);
    closeLevelChoiceModal();
    closeMutationModal();
    closePickupCompareModal();
    stopLoop();

    const result = computeScoreFrom(
      state.time,
      state.bugTime,
      state.giftValue,
      state.legendary,
      state.bugUsed,
      state.wave,
      state.killsTotal
    );
    const avgFlow = state.flowSamples ? state.flowAccumulator / state.flowSamples : state.flowScore;
    const rows = loadLeaderboard();
    rows.push({
      week: result.week,
      category: result.category,
      score: result.score,
      clearTime: state.time,
      bugTime: state.bugTime,
      giftValue: state.giftValue,
      avgFlow: Number(avgFlow.toFixed(3)),
      killsTotal: state.killsTotal,
      hitsTaken: state.hitsTaken,
      wave: state.wave,
      at: Date.now(),
    });
    saveLeaderboard(rows);
    renderLeaderboard();

    if (cleared) {
      log(
        `CLEAR ${result.category}: score ${result.score}, wave ${state.wave}, metric ${formatSec(result.metric)}s, flow ${Math.round(
          avgFlow * 100
        )}%`
      );
      log(
        `Run stats: kills ${state.killsTotal}, dmg ${Math.round(state.damageDealt)}, drops ${state.dropsCollected}, hits ${state.hitsTaken}, burst ${state.burstUses}, peak ${state.peakEnemyCount}`
      );
      triggerFlash("120,255,170", 0.16);
      triggerShake(7);
    } else {
      log(`RUN FAILED. Weekly score ${result.score} saved at wave ${state.wave}.`);
      log(
        `Run stats: kills ${state.killsTotal}, dmg ${Math.round(state.damageDealt)}, drops ${state.dropsCollected}, hits ${state.hitsTaken}, burst ${state.burstUses}, peak ${state.peakEnemyCount}`
      );
      triggerFlash("255,95,95", 0.16);
      triggerShake(7);
    }

    updateHud();
    draw();
  }

  function createRetroAssets(paths) {
    const registry = {};
    Object.keys(paths).forEach(function (key) {
      registry[key] = createRetroImageAsset(paths[key]);
    });
    return registry;
  }

  function createRetroImageAsset(src) {
    const image = new Image();
    const entry = {
      src: src,
      img: image,
      ready: false,
      failed: false,
    };
    image.onload = function () {
      entry.ready = true;
    };
    image.onerror = function () {
      entry.failed = true;
    };
    image.src = src;
    return entry;
  }

  function getRetroPanelPattern() {
    if (retroPanelPattern) return retroPanelPattern;
    const entry = retroAssets.panelPattern;
    if (!entry || !entry.ready || !entry.img) return null;
    retroPanelPattern = ctx.createPattern(entry.img, "repeat");
    return retroPanelPattern;
  }

  function drawRetroPanel(x, y, width, height, options) {
    const opts = options || {};
    const fillAlpha = opts.fillAlpha == null ? 0.62 : opts.fillAlpha;
    const borderAlpha = opts.borderAlpha == null ? 0.34 : opts.borderAlpha;
    const patternAlpha = opts.patternAlpha == null ? 0.22 : opts.patternAlpha;
    const borderColor = opts.borderColor || "168,196,220";

    ctx.fillStyle = `rgba(5, 10, 16, ${fillAlpha.toFixed(3)})`;
    ctx.fillRect(x, y, width, height);

    const pattern = getRetroPanelPattern();
    if (pattern) {
      const prevAlpha = ctx.globalAlpha;
      ctx.globalAlpha = prevAlpha * patternAlpha;
      ctx.fillStyle = pattern;
      ctx.fillRect(x, y, width, height);
      ctx.globalAlpha = prevAlpha;
    } else {
      ctx.fillStyle = "rgba(210, 224, 240, 0.06)";
      for (let py = y + 1; py < y + height; py += 4) {
        for (let px = x + ((Math.floor((py - y) / 4) % 2) * 2); px < x + width; px += 4) {
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }

    ctx.strokeStyle = `rgba(${borderColor}, ${borderAlpha.toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
  }

  function drawRetroTiledStrip(assetEntry, y, height, offsetX, alpha) {
    if (!assetEntry || !assetEntry.ready || !assetEntry.img || !assetEntry.img.width) return false;
    const tileWidth = assetEntry.img.width;
    const normalizedOffset = ((offsetX % tileWidth) + tileWidth) % tileWidth;
    const startX = -normalizedOffset;

    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = prevAlpha * alpha;
    for (let x = startX; x < W + tileWidth; x += tileWidth) {
      ctx.drawImage(assetEntry.img, x, y, tileWidth, height);
    }
    ctx.globalAlpha = prevAlpha;
    return true;
  }

  function drawRetroCloudFallback(y) {
    ctx.fillStyle = "rgba(228, 236, 244, 0.44)";
    const bandY = y + 14;
    for (let i = 0; i < 7; i += 1) {
      const cx = (i * 44 + ((state.time * 18) % 44)) % (W + 44) - 22;
      ctx.fillRect(cx, bandY + (i % 2 ? -3 : 0), 22, 4);
      ctx.fillRect(cx + 4, bandY - 4 + (i % 2 ? -3 : 0), 14, 4);
      ctx.fillRect(cx + 8, bandY - 8 + (i % 2 ? -3 : 0), 8, 4);
    }
  }

  function drawRetroLandFallback(y, height, alpha) {
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = prevAlpha * alpha;
    ctx.fillStyle = "rgba(222, 231, 240, 0.86)";
    ctx.fillRect(0, y, W, 4);
    ctx.fillStyle = "rgba(170, 182, 197, 0.88)";
    ctx.fillRect(0, y + 4, W, 2);
    ctx.fillStyle = "rgba(206, 216, 228, 0.88)";
    ctx.fillRect(0, y + 6, W, Math.max(2, height - 6));

    ctx.fillStyle = "rgba(235, 242, 248, 0.92)";
    const block = 6;
    for (let py = y + 10; py < y + height - 2; py += block) {
      for (let px = (Math.floor((py - y) / block) % 2) * block; px < W; px += block * 2) {
        ctx.fillRect(px + 1, py, block - 2, block - 2);
      }
    }
    ctx.globalAlpha = prevAlpha;
  }

  function drawRetroBackdrop() {
    const drift = state.time * 18;
    const cloudY = 10;
    const farY = H - 108;
    const nearY = H - 80;

    const cloudOk = drawRetroTiledStrip(retroAssets.clouds, cloudY, 34, drift * 0.52, 0.5);
    if (!cloudOk) drawRetroCloudFallback(cloudY);

    const farOk = drawRetroTiledStrip(retroAssets.landFar, farY, 36, drift * 0.16, 0.42);
    if (!farOk) drawRetroLandFallback(farY, 34, 0.34);

    const nearOk = drawRetroTiledStrip(retroAssets.landNear, nearY, 44, drift * 0.31, 0.56);
    if (!nearOk) drawRetroLandFallback(nearY, 40, 0.46);
  }

  function drawGrid() {
    ctx.strokeStyle = "rgba(102, 124, 146, 0.26)";
    ctx.lineWidth = 1;
    for (let y = 0; y <= H; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (let x = 0; x <= W; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
  }

  function drawLegendaryPillar(drop) {
    const pulse = 0.55 + 0.45 * Math.sin(state.time * 7.5 + drop.bob * 3.2);
    const floorPulse = 0.5 + 0.5 * Math.sin(state.time * 5.8 + drop.bob * 2.4);
    const coreW = 14 + pulse * 9 + state.legendaryPulse * 2.2;
    const outerW = coreW * 2.9;
    const height = clamp(drop.y + 30 + state.legendaryPulse * 24, 30, H);

    const beamOuter = ctx.createLinearGradient(drop.x, 0, drop.x, height);
    beamOuter.addColorStop(0, "rgba(255,210,100,0)");
    beamOuter.addColorStop(0.14, "rgba(255,205,120,0.34)");
    beamOuter.addColorStop(1, "rgba(255,180,90,0.66)");
    ctx.fillStyle = beamOuter;
    ctx.fillRect(drop.x - outerW * 0.5, 0, outerW, height);

    const beamCore = ctx.createLinearGradient(drop.x, 0, drop.x, height);
    beamCore.addColorStop(0, "rgba(255,255,230,0)");
    beamCore.addColorStop(0.18, "rgba(255,248,185,0.9)");
    beamCore.addColorStop(1, "rgba(255,225,120,0.9)");
    ctx.fillStyle = beamCore;
    ctx.fillRect(drop.x - coreW * 0.5, 0, coreW, height);

    const sideFade = ctx.createLinearGradient(drop.x - outerW, height, drop.x + outerW, height);
    sideFade.addColorStop(0, "rgba(255,190,95,0)");
    sideFade.addColorStop(0.5, `rgba(255,195,105,${(0.2 + floorPulse * 0.16).toFixed(3)})`);
    sideFade.addColorStop(1, "rgba(255,190,95,0)");
    ctx.fillStyle = sideFade;
    ctx.fillRect(drop.x - outerW * 1.4, drop.y - 7, outerW * 2.8, 14);

    ctx.strokeStyle = "rgba(255,240,170,0.6)";
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 3; i += 1) {
      const ring = 16 + i * 18 + ((state.time * 90 + i * 22) % 22) + floorPulse * 4;
      const alpha = clamp(0.62 - i * 0.15 + state.legendaryPulse * 0.08, 0, 1);
      ctx.strokeStyle = `rgba(255,225,140,${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y + 2, ring, 0, Math.PI * 2);
      ctx.stroke();
    }

    const floorGlow = ctx.createRadialGradient(drop.x, drop.y + 1, 4, drop.x, drop.y + 1, 62 + floorPulse * 16);
    floorGlow.addColorStop(0, `rgba(255,240,180,${(0.46 + floorPulse * 0.2).toFixed(3)})`);
    floorGlow.addColorStop(1, "rgba(255,200,110,0)");
    ctx.fillStyle = floorGlow;
    ctx.beginPath();
    ctx.arc(drop.x, drop.y + 1, 62 + floorPulse * 16, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMiniBossHud(enemy, compactHud) {
    if (!enemy || !enemy.miniBoss) return;
    const phase = enemy.bossPhase || getMiniBossPhase(enemy);
    const profile = getMiniBossProfile(enemy);
    const hpRate = clamp(enemy.hp / Math.max(1, enemy.maxHp), 0, 1);
    const panelW = clamp(W * 0.44, 228, 352);
    const panelH = compactHud ? 36 : 44;
    const panelX = (W - panelW) * 0.5;
    const panelY = compactHud ? 84 : 98;
    const phaseText = phase === 3 ? "PHASE III" : phase === 2 ? "PHASE II" : "PHASE I";
    const titleTag = profile && profile.title ? ` · ${profile.title}` : "";

    drawRetroPanel(panelX, panelY, panelW, panelH, {
      fillAlpha: 0.76,
      borderAlpha: 0.66,
      patternAlpha: 0.2,
      borderColor: "255,198,144",
    });

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffe2b1";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`${enemy.name || "MINIBOSS"} · ${phaseText}${titleTag}`, panelX + panelW * 0.5, panelY + 14);

    const barX = panelX + 12;
    const barY = panelY + 20;
    const barW = panelW - 24;
    const barH = 8;
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.fillRect(barX, barY, barW, barH);
    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, "#ff9a6d");
    grad.addColorStop(0.6, "#ffb46e");
    grad.addColorStop(1, "#ffe1aa");
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, barW * hpRate, barH);

    if (!compactHud) {
      ctx.fillStyle = "#f4d8b0";
      ctx.font = "11px monospace";
      ctx.fillText(
        `Dash ${Math.max(0, enemy.bossDashCd || 0).toFixed(1)}s · Slam ${Math.max(0, enemy.bossSlamCd || 0).toFixed(1)}s · Call ${Math.max(0, enemy.bossCallCd || 0).toFixed(1)}s`,
        panelX + panelW * 0.5,
        panelY + panelH - 6
      );
    }
    ctx.textAlign = "left";
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    const shakeX = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
    const shakeY = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#141b24");
    bg.addColorStop(1, "#080b11");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawRetroBackdrop();
    drawGrid();

    if (state.glitchActive) {
      const alpha = 0.11 + 0.05 * Math.sin(state.time * 12);
      ctx.fillStyle = `rgba(255, 70, 120, ${alpha.toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = `rgba(255, 170, 190, ${(0.05 + 0.03 * Math.sin(state.time * 18)).toFixed(3)})`;
      for (let y = (state.time * 110) % 12; y < H; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }

    const legendaryGroundCount = state.drops.filter((drop) => drop.kind === "legendary").length;
    const legendaryBannerActive = state.running && state.legendaryMoment > 0;
    const alertOverlayActive =
      state.running && (legendaryGroundCount > 0 || legendaryBannerActive || state.dangerMoment > 0);
    if (state.running && legendaryGroundCount > 0 && !legendaryBannerActive) {
      const signal = 0.03 + 0.025 * Math.sin(state.time * 5.2);
      ctx.fillStyle = `rgba(255, 196, 98, ${(signal + legendaryGroundCount * 0.014).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }

    const furyVignette = clamp((state.fury - 35) / 70, 0, 1);
    if (furyVignette > 0) {
      const heat = ctx.createRadialGradient(W * 0.5, H * 0.5, 60, W * 0.5, H * 0.5, Math.max(W, H));
      heat.addColorStop(0, "rgba(255,120,40,0)");
      heat.addColorStop(1, `rgba(255,90,20,${(furyVignette * 0.2).toFixed(3)})`);
      ctx.fillStyle = heat;
      ctx.fillRect(0, 0, W, H);
    }

    const p = state.player;

    ctx.strokeStyle = "rgba(90, 220, 180, 0.32)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.pickupRange, 0, Math.PI * 2);
    ctx.stroke();

    if (state.vacuumPulse > 0) {
      const vacuumRadius = p.pickupRange * (1.7 + state.vacuumPulse * 0.55);
      ctx.strokeStyle = `rgba(150,240,255,${(0.22 + state.vacuumPulse * 0.18).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, vacuumRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1.3;
    }

    for (const drop of state.drops) {
      if (drop.kind === "legendary") {
        drawLegendaryPillar(drop);
      }
    }

    for (const drop of state.drops) {
      ctx.fillStyle = drop.color;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.46)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    drawBossHazards();

    if (state.nunchaku) {
      const n = state.nunchaku;
      const weaponItem = getEquippedWeaponItem();
      const headColor = weaponItem ? weaponItem.color : "#f5c987";
      const weaponRarity = (weaponItem && weaponItem.rarity) || "common";
      const rarityAccent = (ITEM_RARITY[weaponRarity] && ITEM_RARITY[weaponRarity].color) || "#d7e7f5";
      const chainAlpha = clamp(0.35 + (n.speed || 0) * 0.0015 + (n.tension || 0) * 0.25, 0.3, 0.9);
      const chainDx = n.x - p.x;
      const chainDy = n.y - p.y;
      const chainDist = Math.max(1, Math.hypot(chainDx, chainDy));
      const chainNx = chainDx / chainDist;
      const chainNy = chainDy / chainDist;
      const chainTx = -chainNy;
      const chainTy = chainNx;
      const swirlSign = Math.sign((n.vx - p.vx) * chainTy - (n.vy - p.vy) * chainTx) || 1;
      const slack = Math.max(0, (n.restLength || n.length || 0) - chainDist);
      const curve = clamp(slack * 0.64 + (1 - (n.tension || 0)) * 8.5, 0, 18) * swirlSign;
      const midX = (p.x + n.x) * 0.5 + chainTx * curve;
      const midY = (p.y + n.y) * 0.5 + chainTy * curve;
      ctx.strokeStyle = `rgba(214,236,255,${chainAlpha.toFixed(3)})`;
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.quadraticCurveTo(midX, midY, n.x, n.y);
      ctx.stroke();

      ctx.strokeStyle = `rgba(112, 213, 255,${(0.18 + (n.tension || 0) * 0.24).toFixed(3)})`;
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.quadraticCurveTo(midX, midY, n.x, n.y);
      ctx.stroke();
      ctx.lineWidth = 1.3;

      ctx.fillStyle = headColor;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.headR + Math.sin(state.time * 8.5) * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rarityAccent;
      ctx.lineWidth = weaponRarity === "legendary" ? 2 : 1.4;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.headR + 2.2 + Math.min(6, n.speed * 0.02), 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1.3;
      if (weaponRarity !== "common") {
        ctx.fillStyle = weaponRarity === "legendary" ? "rgba(255,239,186,0.9)" : "rgba(220,239,255,0.85)";
        ctx.beginPath();
        ctx.arc(n.x - n.headR * 0.22, n.y - n.headR * 0.2, Math.max(2, n.headR * 0.38), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const shot of state.bullets) {
      const alpha = clamp((shot.life || 0) / Math.max(0.001, shot.maxLife || 1), 0, 1);
      const trailAlpha = (alpha * 0.42).toFixed(3);
      ctx.strokeStyle = `rgba(255,220,170,${trailAlpha})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(shot.prevX || shot.x, shot.prevY || shot.y);
      ctx.lineTo(shot.x, shot.y);
      ctx.stroke();

      ctx.fillStyle = `rgba(255,236,188,${(alpha * 0.92).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, shot.r || 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(255,194,130,${(alpha * 0.78).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, (shot.r || 3) + 1.4, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const enemy of state.enemies) {
      ctx.fillStyle = enemy.miniBoss ? "#ffd39d" : enemy.elite ? "#ffb06f" : enemy.color || "#ff6f6f";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.r, 0, Math.PI * 2);
      ctx.fill();
      if (enemy.miniBoss) {
        const phase = enemy.bossPhase || getMiniBossPhase(enemy);
        const ringColor = phase >= 3 ? "255,120,106" : phase === 2 ? "255,190,120" : "255,233,178";
        const auraR = enemy.r + 10 + Math.sin(state.time * 5.2) * 1.8 + phase * 2 + (enemy.bossAura || 0) * 2;
        ctx.strokeStyle = `rgba(${ringColor},0.72)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, auraR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(${ringColor},0.34)`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, auraR + 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1.3;
      }

      const hpRate = clamp(enemy.hp / enemy.maxHp, 0, 1);
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(enemy.x - enemy.r, enemy.y - enemy.r - 7, enemy.r * 2, 3);
      ctx.fillStyle = enemy.miniBoss ? "#ffe6a8" : enemy.elite ? "#ffe390" : "#a8f7bf";
      ctx.fillRect(enemy.x - enemy.r, enemy.y - enemy.r - 7, enemy.r * 2 * hpRate, 3);
    }

    for (const part of state.particles) {
      const alpha = clamp(part.life / part.maxLife, 0, 1);
      ctx.fillStyle = part.color.replace("rgb(", "rgba(").replace(")", `,${alpha})`);
      if (!part.color.startsWith("rgb")) {
        ctx.fillStyle = `${part.color}${Math.floor(alpha * 255)
          .toString(16)
          .padStart(2, "0")}`;
      }
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#7bc7ff";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(p.targetX, p.targetY, 8, 0, Math.PI * 2);
    ctx.stroke();

    const furyAura = clamp(state.fury / 100, 0, 1);
    if (furyAura > 0.01) {
      const auraR = p.r + 8 + furyAura * 22 + Math.sin(state.time * 10) * 2;
      ctx.strokeStyle = `rgba(255,170,80,${(0.16 + furyAura * 0.5).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, auraR, 0, Math.PI * 2);
      ctx.stroke();
    }

    const armorItem = getEquippedArmorItem();
    const armorRarity = (armorItem && armorItem.rarity) || "common";
    const armorAccent = (ITEM_RARITY[armorRarity] && ITEM_RARITY[armorRarity].color) || "#c8ecff";
    ctx.fillStyle = armorItem ? armorItem.color : "#6ffed4";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = armorAccent;
    ctx.lineWidth = armorRarity === "legendary" ? 2 : 1.5;
    ctx.stroke();
    ctx.strokeStyle = "rgba(200, 236, 255, 0.58)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(4, p.r * 0.6), 0, Math.PI * 2);
    ctx.stroke();

    const hpRate = clamp(p.hp / p.maxHp, 0, 1);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(p.x - 19, p.y - 21, 38, 4);
    ctx.fillStyle = "#6fff9e";
    ctx.fillRect(p.x - 19, p.y - 21, 38 * hpRate, 4);

    const threat = state.threatScore || computeThreatScore();
    const threatMeta = getThreatLabel(threat);
    const compactHud = state.hudCompact !== false;
    const hudPanelWidth = compactHud ? 404 : 472;
    const hudPanelHeight = compactHud ? 70 : 84;
    const hudScorePreview = computeScoreFrom(
      state.time,
      state.bugTime,
      state.giftValue,
      state.legendary,
      true,
      state.wave,
      state.killsTotal
    ).score;
    drawRetroPanel(6, 6, hudPanelWidth, hudPanelHeight, {
      fillAlpha: 0.66,
      borderAlpha: 0.34,
      patternAlpha: 0.24,
      borderColor: "130,170,210",
    });

    ctx.fillStyle = "#d6ecff";
    ctx.font = "12px monospace";
    const levelupPause = state.pauseMode === "levelup";
    const pickupPause = state.pauseMode === "pickup_compare";
    const levelupTimerText = Math.max(0, state.levelAutoPickTimer).toFixed(1);
    const levelupQueueText = Math.max(0, state.levelQueue);
    const comboText = `x${Math.max(0, Math.floor(state.swingCombo || 0))}`;
    const pendingDrop = getPendingPickupItem();
    const mutPct = Math.round(computeMilestoneProgress(state.wave, WAVE_MUTATION_INTERVAL) * 100);
    const bossPct = Math.round(computeMilestoneProgress(state.wave, WAVE_MINIBOSS_INTERVAL) * 100);
    const activeMiniBossHud = getActiveMiniBoss();
    const bossInline = activeMiniBossHud
      ? `BOSS:P${activeMiniBossHud.bossPhase || getMiniBossPhase(activeMiniBossHud)}`
      : `B:${bossPct}%`;
    if (compactHud) {
      ctx.fillText(
        `WAVE ${state.wave}   ENEMY:${state.enemies.length}/${maxEnemiesOnField()}   LV:${p.level}   HP:${Math.round(p.hp)}/${Math.round(p.maxHp)}`,
        12,
        18
      );
      ctx.fillStyle = threatMeta.color;
      ctx.fillText(`THREAT ${threat} ${threatMeta.label}`, 12, 34);
      ctx.fillStyle = "#cbe4f8";
      ctx.fillText(
        `SW:${Math.round((state.nunchaku && state.nunchaku.speed) || 0)} TN:${Math.round(((state.nunchaku && state.nunchaku.tension) || 0) * 100)}% SL:${Math.round((state.nunchaku && state.nunchaku.stretchLimit) || 0)} COMBO:${comboText} HZ:${state.bossHazards.length} ${bossInline}`,
        132,
        34
      );
      ctx.fillStyle = "#d6ecff";
      if (levelupPause) {
        ctx.fillText(`LVUP AUTO ${levelupTimerText}s  PICK 1-3  Q${levelupQueueText}`, 12, 50);
        ctx.fillStyle = "#b7d9ef";
        ctx.fillText(`START/ENTER/TAP = FAST RESUME  SCORE ${hudScorePreview}`, 12, 66);
      } else if (pickupPause) {
        ctx.fillText(`GEAR DROP COMPARE  AUTO DISCARD ${Math.max(0, state.pickupAutoTimer).toFixed(1)}s`, 12, 50);
        ctx.fillStyle = "#b7d9ef";
        ctx.fillText(`1: PICK UP  2: DISCARD  START/ENTER/TAP = PICK  SCORE ${hudScorePreview}`, 12, 66);
      } else {
        ctx.fillText(`GLITCH ON FIXED   FURY:${Math.round(state.fury)}%   FLOW:${Math.round(state.flowScore * 100)}%   GIFT:${state.giftDiamonds || 0}D`, 12, 50);
        ctx.fillStyle = "#b7d9ef";
        ctx.fillText(
          `K:${state.killsTotal} HIT:${state.hitsTaken} LEG:${state.legendaryDropsSpawned} BOON:${state.bossBoonCount || 0} PCT M${mutPct}/B${bossPct} SCORE ${hudScorePreview}`,
          12,
          66
        );
      }
    } else {
      const detailLine2 = levelupPause
        ? `LVUP AUTO ${levelupTimerText}s  Q${levelupQueueText}  PICK[1-3]`
        : pickupPause
          ? `GEAR COMPARE ${Math.max(0, state.pickupAutoTimer).toFixed(1)}s  PICK[1]/DROP[2]`
          : `SPD${state.enemySpeedMul.toFixed(2)} DIR${state.directorBias.toFixed(2)} PRS${state.closePressure} SW${Math.round((state.nunchaku && state.nunchaku.speed) || 0)} TN${Math.round(((state.nunchaku && state.nunchaku.tension) || 0) * 100)}% SL${Math.round((state.nunchaku && state.nunchaku.stretchLimit) || 0)} C${comboText} HZ${state.bossHazards.length} ${activeMiniBossHud ? `BP${activeMiniBossHud.bossPhase || getMiniBossPhase(activeMiniBossHud)}` : `B${bossPct}%`}`;
      const detailLine3 = levelupPause
        ? `FAST RESUME: START / ENTER / TAP`
        : pickupPause
          ? `DROP DECISION: START / ENTER / TAP = PICK`
          : `GLITCH ON FIXED  FURY${Math.round(state.fury)}%  FLOW${Math.round(state.flowScore * 100)}%  G${state.giftDiamonds || 0}D`;
      const detailLine4 = levelupPause
        ? `K${state.killsTotal} H${state.hitsTaken} L${state.legendaryDropsSpawned} SCORE${hudScorePreview}`
        : pickupPause
          ? `DROP ${pendingDrop ? pendingDrop.rarityLabel : "-"} SCORE${hudScorePreview}`
          : `K${state.killsTotal} H${state.hitsTaken} L${state.legendaryDropsSpawned} BOON${state.bossBoonCount || 0} PCT M${mutPct}/B${bossPct} SCORE${hudScorePreview}`;
      ctx.fillText(
        `WAVE ${state.wave}   ENEMY:${state.enemies.length}/${maxEnemiesOnField()}   LV:${p.level}   HP:${Math.round(p.hp)}/${Math.round(p.maxHp)}`,
        12,
        18
      );
      ctx.fillStyle = threatMeta.color;
      ctx.fillText(`THREAT ${threat} ${threatMeta.label}`, 12, 34);
      ctx.fillStyle = "#cbe4f8";
      ctx.fillText(detailLine2, 174, 34);
      ctx.fillStyle = "#d6ecff";
      ctx.fillText(detailLine3, 12, 50);
      ctx.fillText(detailLine4, 12, 66);
      ctx.fillStyle = "#b7d9ef";
      ctx.fillText(`WEEK ${getCurrentWeekId()}   SCORE PREVIEW ${hudScorePreview}`, 12, 82);
    }

    const activeMiniBoss = getActiveMiniBoss();
    if (state.running && activeMiniBoss) {
      drawMiniBossHud(activeMiniBoss, compactHud);
    }

    const renderFloatTexts = getRenderableFloatTexts(alertOverlayActive);
    for (const text of renderFloatTexts) {
      const alpha = clamp(text.life / text.maxLife, 0, 1);
      ctx.fillStyle = text.color;
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${text.size}px 'Avenir Next', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(text.text, text.x, text.y);
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
    }

    ctx.restore();

    if (state.flashAlpha > 0) {
      ctx.fillStyle = `rgba(${state.flashColor}, ${state.flashAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }

    const alertCards = [];
    if (state.running && legendaryGroundCount > 0) {
      const legendaryPulseAlpha = legendaryBannerActive
        ? clamp(0.1 + state.legendaryMoment * 0.12, 0.08, 0.24)
        : clamp(0.05 + legendaryGroundCount * 0.012 + state.legendaryPulse * 0.08, 0.04, 0.18);
      ctx.fillStyle = `rgba(255, 205, 92, ${legendaryPulseAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
      alertCards.push({
        kind: "legendary",
        title: legendaryBannerActive ? "LEGENDARY" : "LEGENDARY SIGNAL",
        subtitle: legendaryBannerActive ? "PICK IT UP NOW" : `FOLLOW THE PILLAR x${legendaryGroundCount}`,
        alpha: legendaryBannerActive ? clamp(0.56 + state.legendaryMoment * 0.34, 0.52, 0.96) : 0.72,
      });
    }

    if (state.running && state.dangerMoment > 0) {
      const a = clamp(state.dangerMoment / 4.2, 0, 1);
      ctx.fillStyle = `rgba(255,90,72,${(0.08 + a * 0.14).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
      alertCards.push({
        kind: "danger",
        title: "DANGER",
        subtitle: state.dangerText || "THREAT SPIKE",
        alpha: a,
      });
    }

    if (alertCards.length) {
      const hudRight = 6 + hudPanelWidth;
      const cardRightPadding = 10;
      const minCardW = 148;
      const preferredCardW = 208;
      const maxCardW = Math.max(minCardW, W - hudRight - 18);
      const cardW = clamp(preferredCardW, minCardW, maxCardW);
      const cardH = 34;
      const cardX = W - cardW - cardRightPadding;
      const topOverlap = cardX <= hudRight + 8;
      let cardY = topOverlap ? hudPanelHeight + 14 : 10;

      for (const card of alertCards) {
        const isLegendaryCard = card.kind === "legendary";
        const edgeColor = isLegendaryCard
          ? `rgba(255,226,165,${(0.32 + card.alpha * 0.44).toFixed(3)})`
          : `rgba(255,170,150,${(0.32 + card.alpha * 0.34).toFixed(3)})`;
        const titleColor = isLegendaryCard
          ? `rgba(255,243,194,${(0.48 + card.alpha * 0.44).toFixed(3)})`
          : `rgba(255,214,200,${(0.48 + card.alpha * 0.4).toFixed(3)})`;
        const subtitleColor = isLegendaryCard
          ? `rgba(255,230,188,${(0.42 + card.alpha * 0.36).toFixed(3)})`
          : `rgba(255,224,210,${(0.42 + card.alpha * 0.38).toFixed(3)})`;
        const panelFillAlpha = isLegendaryCard ? 0.32 + card.alpha * 0.34 : 0.28 + card.alpha * 0.3;

        drawRetroPanel(cardX, cardY, cardW, cardH, {
          fillAlpha: panelFillAlpha,
          borderAlpha: clamp(0.38 + card.alpha * 0.42, 0.34, 0.88),
          patternAlpha: 0.2,
          borderColor: isLegendaryCard ? "255,226,165" : "255,170,150",
        });
        ctx.textAlign = "left";
        ctx.fillStyle = titleColor;
        ctx.font = "bold 14px monospace";
        ctx.fillText(card.title, cardX + 8, cardY + 14, cardW - 14);
        ctx.font = "bold 10px monospace";
        ctx.fillStyle = subtitleColor;
        ctx.fillText(card.subtitle, cardX + 8, cardY + 27, cardW - 14);
        cardY += cardH + 6;
      }
    }

    if (pickupPause) {
      drawPickupCompareCanvasOverlay(pendingDrop, hudScorePreview);
    }

    if (!state.running) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, W, H);
      drawRetroPanel(W * 0.5 - 212, H * 0.5 - 74, 424, 134, {
        fillAlpha: 0.62,
        borderAlpha: 0.46,
        patternAlpha: 0.24,
        borderColor: "162,192,220",
      });
      ctx.fillStyle = "#f0fbff";
      ctx.textAlign = "center";
      ctx.font = "bold 20px monospace";
      const title = state.runEnded ? (state.player.hp > 0 ? "Run Clear" : "Run Failed") : "Tap Run Start";
      const subtitle = state.runEnded
        ? `Tap canvas or Run Start to retry · Weekly score ${computeScoreFrom(state.time, state.bugTime, state.giftValue, state.legendary, true, state.wave, state.killsTotal).score}`
        : "1-bit arena · Nunchaku build · Glitch fixed ON.";
      ctx.fillText(title, W * 0.5, H * 0.44);
      ctx.font = "13px monospace";
      ctx.fillText(subtitle, W * 0.5, H * 0.51);
      if (selectedBuild.name) {
        ctx.fillText(`${selectedBuild.name} · ${(JOBS[selectedBuild.jobId] || JOBS[DEFAULT_JOB]).name}`, W * 0.5, H * 0.57);
      }
      ctx.textAlign = "left";
    }
  }

  function stopLoop() {
    if (!rafId) return;
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function scheduleLoop() {
    if (!state.running || rafId) return;
    rafId = requestAnimationFrame(loop);
  }

  function stepFrame(dt) {
    updateState(dt);
    updateHud();
    draw();
  }

  function renderGameToText() {
    const p = state.player;
    const scorePreview = computeScoreFrom(
      Math.max(4, state.time || 4),
      state.bugTime,
      state.giftValue,
      state.legendary,
      state.bugUsed,
      state.wave,
      state.killsTotal
    ).score;
    const selectedItem = getSelectedInventoryItem();
    const selectedRune = getSelectedRune();
    const activeMiniBoss = getActiveMiniBoss();
    const activeMiniBossProfile = activeMiniBoss ? getMiniBossProfile(activeMiniBoss) : null;

    const enemies = state.enemies
      .map(function (enemy) {
        return {
          x: Math.round(enemy.x),
          y: Math.round(enemy.y),
          hp: Math.round(enemy.hp),
          max_hp: Math.round(enemy.maxHp),
          elite: !!enemy.elite,
          type: enemy.archetypeId || "raider",
          role: enemy.role || "chaser",
          r: enemy.r,
          dist: Math.round(Math.hypot(enemy.x - p.x, enemy.y - p.y)),
        };
      })
      .sort(function (a, b) {
        return a.dist - b.dist;
      })
      .slice(0, 12);

    const drops = state.drops.slice(0, 12).map(function (drop) {
      return {
        kind: drop.kind,
        rarity: drop.item ? drop.item.rarity : null,
        slot: drop.item ? drop.item.slot : null,
        x: Math.round(drop.x),
        y: Math.round(drop.y),
        age: Number((drop.age || 0).toFixed(2)),
      };
    });

    const payload = {
      coordinate_system: "origin top-left, x right positive, y down positive, units=canvas px",
      canvas: { width: W, height: H },
      mode: state.running ? state.pauseMode || "running" : state.runEnded ? "ended" : "idle",
      pause_mode: state.pauseMode || null,
      player: {
        x: Math.round(p.x),
        y: Math.round(p.y),
        target_x: Math.round(p.targetX),
        target_y: Math.round(p.targetY),
        vx: Number((p.vx || 0).toFixed(2)),
        vy: Number((p.vy || 0).toFixed(2)),
        swing_speed: Number(((state.nunchaku && state.nunchaku.speed) || 0).toFixed(2)),
        hp: Number(p.hp.toFixed(1)),
        max_hp: Number(p.maxHp.toFixed(1)),
        level: p.level,
        r: Number(p.r.toFixed(2)),
        attack_cd: Number(p.attackCd.toFixed(3)),
      },
      run: {
        wave: state.wave,
        max_wave: null,
        enemies_alive: state.enemies.length,
        enemy_cap: maxEnemiesOnField(),
        drops_on_ground: state.drops.length,
        threat_score: state.threatScore || computeThreatScore(),
        fury: Math.round(state.fury),
        glitch_active: state.glitchActive,
        glitch_chain: Number(state.bugChain.toFixed(2)),
        glitch_time: Number(state.bugTime.toFixed(2)),
        burst_cd: Number(state.burstCd.toFixed(2)),
        invuln_time: Number((state.player.invulnTime || 0).toFixed(2)),
        legendary_on_ground: state.drops.some((drop) => drop.kind === "legendary"),
        role_counts: {
          chaser: state.enemyRoleCounts.chaser || 0,
          bruiser: state.enemyRoleCounts.bruiser || 0,
          zoner: state.enemyRoleCounts.zoner || 0,
        },
        gift_event: {
          kind: state.giftEvent ? state.giftEvent.kind : "idle",
          timer: Number(state.giftEvent ? state.giftEvent.timer.toFixed(2) : 0),
          source: state.giftEvent ? state.giftEvent.source || "SYSTEM" : "SYSTEM",
        },
        stream_hook: {
          enabled: !!(state.streamHook && state.streamHook.enabled),
          endpoint: state.streamHook ? state.streamHook.endpoint : STREAM_HOOK_DEFAULT_ENDPOINT,
          cursor: state.streamHook ? Math.round(state.streamHook.cursor || 0) : 0,
          fail_streak: state.streamHook ? state.streamHook.failStreak || 0 : 0,
          total_events: state.streamHook ? state.streamHook.totalEvents || 0 : 0,
          total_diamonds: state.streamHook ? state.streamHook.totalDiamonds || 0 : 0,
          pending_count: state.streamHook ? state.streamHook.pendingCount || 0 : 0,
        },
        next_mutation_wave: state.nextMutationWave,
        next_miniboss_wave: state.nextMiniBossWave,
        next_emergency_boss_at: Number(Math.max(0, (state.nextEmergencyBossAt || 0) - state.time).toFixed(2)),
        next_emergency_boss_kill: Math.max(0, state.nextEmergencyBossKill || 0),
        pending_emergency_boss: !!state.pendingEmergencyBoss,
        level_queue: Math.max(0, state.levelQueue || 0),
        level_autopick_timer: Number(Math.max(0, state.levelAutoPickTimer || 0).toFixed(2)),
        mutations_taken: state.mutationCount || 0,
        danger_moment: Number((state.dangerMoment || 0).toFixed(2)),
        hits_taken: state.hitsTaken,
        kills_total: state.killsTotal || 0,
        gift_value: state.giftValue || 0,
        projectile_count: state.bullets.length,
        swing_combo: Number((state.swingCombo || 0).toFixed(2)),
        boss_boons: {
          count: state.bossBoonCount || 0,
          last: state.lastBossBoon || null,
        },
        progress_pct: {
          mutation: Math.round(computeMilestoneProgress(state.wave, WAVE_MUTATION_INTERVAL) * 100),
          miniboss: Math.round(computeMilestoneProgress(state.wave, WAVE_MINIBOSS_INTERVAL) * 100),
        },
        boss: activeMiniBoss
          ? {
              name: activeMiniBoss.name || "Miniboss",
              profile: activeMiniBossProfile ? activeMiniBossProfile.id : null,
              role: activeMiniBossProfile ? activeMiniBossProfile.title : null,
              phase: activeMiniBoss.bossPhase || getMiniBossPhase(activeMiniBoss),
              hp: Number(activeMiniBoss.hp.toFixed(1)),
              max_hp: Number(activeMiniBoss.maxHp.toFixed(1)),
              dash_cd: Number(Math.max(0, activeMiniBoss.bossDashCd || 0).toFixed(2)),
              slam_cd: Number(Math.max(0, activeMiniBoss.bossSlamCd || 0).toFixed(2)),
              call_cd: Number(Math.max(0, activeMiniBoss.bossCallCd || 0).toFixed(2)),
            }
          : null,
        boss_hazards: (state.bossHazards || []).slice(0, 6).map(function (hazard) {
          return {
            x: Math.round(hazard.x),
            y: Math.round(hazard.y),
            r: Number(hazard.radius.toFixed(1)),
            delay: Number(hazard.delay.toFixed(2)),
            elapsed: Number(hazard.elapsed.toFixed(2)),
            label: hazard.label,
            detonated: !!hazard.detonated,
          };
        }),
        hud_compact: !!state.hudCompact,
        system_focus: {
          text_mode: normalizeSystemSettings(state.settings).combatTextMode,
          flash_fx: normalizeSystemSettings(state.settings).flashFx,
          shake_fx: normalizeSystemSettings(state.settings).shakeFx,
        },
        fullscreen: !!document.fullscreenElement,
      },
      nunchaku: state.nunchaku
        ? {
            x: Math.round(state.nunchaku.x),
            y: Math.round(state.nunchaku.y),
            prev_x: Math.round(state.nunchaku.prevX || state.nunchaku.x),
            prev_y: Math.round(state.nunchaku.prevY || state.nunchaku.y),
            aim_x: Math.round(state.nunchaku.aimX || state.nunchaku.x),
            aim_y: Math.round(state.nunchaku.aimY || state.nunchaku.y),
            vx: Number((state.nunchaku.vx || 0).toFixed(2)),
            vy: Number((state.nunchaku.vy || 0).toFixed(2)),
            speed: Number((state.nunchaku.speed || 0).toFixed(2)),
            length: Number((state.nunchaku.length || 0).toFixed(2)),
            rest_length: Number((state.nunchaku.restLength || state.nunchaku.length || 0).toFixed(2)),
            max_length: Number((state.nunchaku.maxLength || state.nunchaku.length || 0).toFixed(2)),
            tension: Number((state.nunchaku.tension || 0).toFixed(3)),
            stretch: Number((state.nunchaku.stretch || 0).toFixed(2)),
            stretch_limit: Number((state.nunchaku.stretchLimit || 0).toFixed(2)),
            elastic_boost: Number((state.nunchaku.elasticBoost || 0).toFixed(2)),
            rubber_timer: Number((state.nunchaku.rubberTimer || 0).toFixed(2)),
            rubber_on: (state.nunchaku.rubberTimer || 0) > 0,
            head_r: Number((state.nunchaku.headR || 0).toFixed(2)),
            self_hit_cd: Number((state.nunchaku.selfHitCd || 0).toFixed(2)),
          }
        : null,
      objective: null,
      economy: {
        credits: state.credits,
        gift: state.giftValue,
        diamonds: state.giftDiamonds || 0,
        legendary: state.legendary,
        score_preview: scorePreview,
      },
      inventory: {
        count: state.itemInventory.length,
        rune_count: state.affixRunes.length,
        craft_target_slot: state.selectedGearSlot,
        pickup_compare: getPendingPickupItem()
          ? (function () {
              const dropped = getPendingPickupItem();
              const equipped = state.equippedItems[dropped.slot] || null;
              const equippedPower = equipped ? equipped.power || 0 : 0;
              return {
                slot: dropped.slot,
                dropped_power: dropped.power || 0,
                equipped_power: equippedPower,
                delta: (dropped.power || 0) - equippedPower,
                auto_timer: Number(Math.max(0, state.pickupAutoTimer || 0).toFixed(2)),
              };
            })()
          : null,
        selected_rune: selectedRune
          ? {
              label: selectedRune.label,
              stat: selectedRune.stat,
              value: Number(selectedRune.value.toFixed(3)),
              legendary: !!selectedRune.legendary,
            }
          : null,
        selected: selectedItem
          ? {
              name: selectedItem.name,
              rarity: selectedItem.rarity,
              slot: selectedItem.slot,
              power: selectedItem.power,
              tier: selectedItem.tier,
            }
          : null,
      },
      enemies,
      drops,
    };

    return JSON.stringify(payload);
  }

  function advanceTime(ms) {
    const msValue = Number(ms);
    const safeMs = Number.isFinite(msValue) ? Math.max(0, msValue) : 0;
    stopLoop();

    const steps = Math.max(1, Math.round(safeMs / FIXED_STEP_MS));
    for (let i = 0; i < steps; i += 1) {
      updateState(FIXED_DT);
    }
    updateHud();
    draw();
    return renderGameToText();
  }

  function toggleFullscreen() {
    const shell = ui.gameShell || canvas;
    if (!document.fullscreenElement) {
      if (shell.requestFullscreen) {
        shell.requestFullscreen().catch(function () {
          // Ignore fullscreen errors in unsupported contexts.
        });
      }
      return;
    }
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(function () {
        // Ignore fullscreen errors in unsupported contexts.
      });
    }
  }

  function applyFullscreenClass() {
    document.body.classList.toggle("game-fullscreen", !!document.fullscreenElement);
  }

  function loop(ts) {
    rafId = 0;
    const dt = clamp((ts - state.lastTs) / 1000, 0, 0.033);
    state.lastTs = ts;

    stepFrame(dt);
    scheduleLoop();
  }

  function startRun() {
    stopLoop();
    ensureAudioReady();
    closeLevelChoiceModal();
    closeMutationModal();
    closePickupCompareModal();
    releasePointerDrag(draggingPointerId);

    const persistentCredits = state.credits;
    const persistentGross = state.grossPurchase;
    const persistentFee = state.platformFee;
    const persistentAffixRunes = JSON.parse(JSON.stringify(state.affixRunes));
    const persistentEquippedItems = JSON.parse(JSON.stringify(state.equippedItems));
    const persistentSkillRerolls = state.skillRerolls;
    const persistentSelectedRuneId = state.selectedRuneId;
    const persistentSelectedGearSlot = state.selectedGearSlot;
    const persistentHudCompact = !!state.hudCompact;
    const persistentSettings = normalizeSystemSettings(state.settings);
    const persistentStreamHook = normalizeStreamHookConfig(state.streamHook);

    state = createState();
    state.credits = persistentCredits;
    state.grossPurchase = persistentGross;
    state.platformFee = persistentFee;
    state.itemInventory = [];
    state.affixRunes = Array.isArray(persistentAffixRunes) ? persistentAffixRunes : [];
    state.equippedItems = persistentEquippedItems || state.equippedItems;
    state.skillRerolls = persistentSkillRerolls || 0;
    state.selectedInventoryItemId = null;
    state.selectedRuneId = persistentSelectedRuneId || null;
    state.selectedGearSlot = persistentSelectedGearSlot || null;
    state.pendingPickupQueue = [];
    state.hudCompact = persistentHudCompact;
    state.settings = persistentSettings;
    state.streamHook = persistentStreamHook;
    state.streamHook.pendingCount = queuedLiveEvents.length;

    applyBuildToPlayer();
    initializeLoadoutState();
    resetNunchakuToPlayer();

    state.running = true;
    state.runEnded = false;
    state.lastTs = performance.now();
    state.spawnTimer = 0.16;
    state.player.attackCd = 0;
    state.player.invulnTime = 1.05;
    state.logLines = [];

    log(`Run started: ${state.character.name} (${JOBS[state.character.jobId].name} / ${WEAPONS[state.character.weaponId].name})`);
    sfxWave();

    renderAffixList();
    renderDropList();
    updateHud();
    draw();
    scheduleLoop();
  }

  function deriveGiftTierFromDiamonds(diamonds, sourceType) {
    const sourceBoost = sourceType === "subscription" ? 1.8 : sourceType === "share" ? 0.7 : sourceType === "like" ? 0.4 : 0;
    const tier = Math.round(Math.log2(Math.max(2, diamonds + 2)) * 0.95 + sourceBoost);
    return clamp(tier, 1, 12);
  }

  function applyGiftImpact(diamonds, tier, sourceTag, sourceMeta) {
    const safeDiamonds = Math.max(1, Math.round(diamonds));
    const safeTier = clamp(Math.round(tier || 1), 1, 12);
    const pressureTier = clamp(safeTier, 1, 8);
    const giftRoll = rand(0.82, 1.28);
    const convertedValue = Math.max(1, Math.round(safeDiamonds * giftRoll));
    const rollTag = giftRoll >= 1.12 ? "LUCKY" : giftRoll <= 0.9 ? "LOW" : "STD";
    const sourceLabel = sourceTag || "LOCAL";

    state.giftDiamonds += safeDiamonds;
    state.giftValue += convertedValue;
    state.giftCount += 1;
    state.directorBias = clamp(state.directorBias + 0.05 + safeTier * 0.01, 0.58, 2.05);

    const eventRoll = Math.random();
    const baseSpawn = Math.max(1, Math.floor(pressureTier * 0.45));

    if (eventRoll < 0.34) {
      const spawnCount = baseSpawn + Math.floor(pressureTier * 0.25);
      for (let i = 0; i < spawnCount; i += 1) {
        spawnEnemy(0.24 + pressureTier * 0.025);
      }
      const reinforced = reinforceEnemies(
        2 + Math.floor(pressureTier * 1.1),
        1.06 + pressureTier * 0.008,
        1.08 + pressureTier * 0.012,
        1.025,
        0.06
      );
      state.frenzy = Math.max(state.frenzy, 1.8 + pressureTier * 0.24);
      if (Math.random() < clamp((0.1 + pressureTier * 0.08) * LEGENDARY_RATE_MULT, 0, 0.12)) {
        spawnDrop(rand(30, W - 30), rand(24, H - 24), "legendary");
      }
      setGiftEvent("assault", "ASSAULT", "HIGH", `Reinforce x${reinforced} · ${rollTag}`, 4.4 + pressureTier * 0.3, sourceLabel);
      log(`${sourceLabel} ${sourceMeta || "gift"} => ${safeDiamonds}D (${convertedValue} value, ${rollTag}): ASSAULT reinforced ${reinforced}.`);
      triggerFlash("120,190,255", 0.11);
    } else if (eventRoll < 0.68) {
      const spawnCount = Math.max(1, baseSpawn + Math.floor(pressureTier * 0.18));
      for (let i = 0; i < spawnCount; i += 1) {
        spawnEnemy(0.18 + pressureTier * 0.016);
      }
      reinforceEnemies(1 + Math.floor(pressureTier * 0.6), 1.04, 1.05, 1.008, 0.03);
      const rainCount = Math.max(1, Math.round(1 + pressureTier * 0.35));
      for (let i = 0; i < rainCount; i += 1) {
        const roll = Math.random();
        const kind = roll < 0.08 ? "item_rare" : roll < 0.34 ? "item_magic" : "item";
        spawnDrop(rand(36, W - 36), rand(28, H - 28), kind);
      }
      if (Math.random() < 0.58 * HIGH_RARITY_RATE_MULT) {
        spawnDrop(rand(36, W - 36), rand(28, H - 28), Math.random() < 0.5 ? "item_rare" : "item_magic");
      }
      if (Math.random() < clamp((0.16 + pressureTier * 0.1) * LEGENDARY_RATE_MULT, 0, 0.14)) {
        spawnDrop(rand(36, W - 36), rand(28, H - 28), "legendary");
      }
      state.vacuumPulse = Math.max(state.vacuumPulse, 1.6);
      setGiftEvent("treasure", "TREASURE RAIN", "MID", `Loot x${rainCount} · ${rollTag}`, 4.8 + pressureTier * 0.28, sourceLabel);
      log(`${sourceLabel} ${sourceMeta || "gift"} => ${safeDiamonds}D (${convertedValue} value, ${rollTag}): TREASURE rain x${rainCount}.`);
      triggerFlash("255,214,120", 0.12);
    } else {
      const spawnCount = Math.max(1, baseSpawn + Math.floor(pressureTier * 0.22));
      for (let i = 0; i < spawnCount; i += 1) {
        spawnEnemy(0.2 + pressureTier * 0.02);
      }
      const reinforced = reinforceEnemies(
        2 + Math.floor(pressureTier * 0.9),
        1.06 + pressureTier * 0.008,
        1.1 + pressureTier * 0.01,
        1.045,
        0.04
      );
      state.frenzy = Math.max(state.frenzy, 2.2 + pressureTier * 0.28);
      state.vacuumPulse = Math.max(state.vacuumPulse, 1.2 + pressureTier * 0.08);
      state.player.invulnTime = Math.max(state.player.invulnTime || 0, 0.45);
      state.burstCd = Math.max(0, state.burstCd - (0.8 + pressureTier * 0.18));
      if (Math.random() < clamp((0.12 + pressureTier * 0.08) * LEGENDARY_RATE_MULT, 0, 0.12)) {
        spawnDrop(rand(36, W - 36), rand(28, H - 28), "legendary");
      }
      setGiftEvent("surge", "SURGE", "HIGH", `Snap + Reinforce ${reinforced} · ${rollTag}`, 4.2 + pressureTier * 0.28, sourceLabel);
      log(`${sourceLabel} ${sourceMeta || "gift"} => ${safeDiamonds}D (${convertedValue} value, ${rollTag}): SURGE boosted.`);
      triggerFlash("255,128,96", 0.11);
    }

    spawnFloatText(state.player.x, state.player.y - 34, `GIFT +${safeDiamonds}D`, "#9fe7ff", 12, 0.6);
    triggerShake(4);
    sfxGift();
  }

  function enqueueLiveGiftEvent(event) {
    queuedLiveEvents.push(event);
    if (queuedLiveEvents.length > 40) {
      queuedLiveEvents.splice(0, queuedLiveEvents.length - 40);
    }
    state.streamHook.pendingCount = queuedLiveEvents.length;
  }

  function drainQueuedLiveGiftEvents() {
    if (!state.running || state.pauseMode) return;
    if (!queuedLiveEvents.length) {
      state.streamHook.pendingCount = 0;
      return;
    }
    if (state.time < (state.nextQueuedGiftAt || 0)) return;
    const event = queuedLiveEvents.shift();
    if (!event) return;
    const tier = deriveGiftTierFromDiamonds(event.diamonds, event.type);
    applyGiftImpact(event.diamonds, tier, "LIVE", `${event.type.toUpperCase()} ${event.sender}`);
    state.streamHook.pendingCount = queuedLiveEvents.length;
    state.nextQueuedGiftAt = state.time + 0.52;
    log(`LIVE queued gift applied: ${event.type.toUpperCase()} ${event.sender} +${event.diamonds}D`);
  }

  function ingestLiveGiftEvent(rawEvent) {
    const event = normalizeLiveEvent(rawEvent);
    if (seenLiveEventIds.has(event.id)) return false;
    seenLiveEventIds.add(event.id);
    if (seenLiveEventIds.size > 480) {
      const first = seenLiveEventIds.values().next();
      if (!first.done) seenLiveEventIds.delete(first.value);
    }

    state.streamHook = normalizeStreamHookConfig(state.streamHook);
    state.streamHook.totalEvents += 1;
    state.streamHook.totalDiamonds += event.diamonds;
    state.streamHook.lastSource = `${event.type.toUpperCase()} ${event.sender}`;
    if (!state.running || state.pauseMode) {
      enqueueLiveGiftEvent(event);
      log(`LIVE ${event.type.toUpperCase()} ${event.sender}: ${event.diamonds}D queued (run idle/pause).`);
      syncStreamHookPanel();
      return false;
    }

    const tier = deriveGiftTierFromDiamonds(event.diamonds, event.type);
    applyGiftImpact(event.diamonds, tier, "LIVE", `${event.type.toUpperCase()} ${event.sender}`);
    state.streamHook.pendingCount = queuedLiveEvents.length;
    syncStreamHookPanel();
    return true;
  }

  async function pollStreamHookOnce() {
    state.streamHook = normalizeStreamHookConfig(state.streamHook);
    if (!state.streamHook.enabled || streamHookPollingBusy) return;
    streamHookPollingBusy = true;
    try {
      const endpoint = state.streamHook.endpoint || STREAM_HOOK_DEFAULT_ENDPOINT;
      const url = new URL(endpoint);
      url.searchParams.set("max", String(STREAM_HOOK_MAX_BATCH));
      if (state.streamHook.cursor > 0) {
        url.searchParams.set("since", String(Math.floor(state.streamHook.cursor)));
      }
      const response = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      const parsed = extractLiveEventsPayload(payload);
      let accepted = 0;
      for (const rawEvent of parsed.events) {
        const numericId = toNumberSafe(
          rawEvent && typeof rawEvent === "object"
            ? rawEvent.id || rawEvent.eventId || rawEvent.messageId || rawEvent.msgId
            : 0,
          0
        );
        if (numericId > 0) {
          state.streamHook.cursor = Math.max(state.streamHook.cursor, Math.floor(numericId));
        }
        const beforeCount = state.streamHook.totalEvents;
        ingestLiveGiftEvent(rawEvent);
        if (state.streamHook.totalEvents > beforeCount) accepted += 1;
      }
      if (parsed.cursor !== null && Number.isFinite(Number(parsed.cursor))) {
        state.streamHook.cursor = Math.max(state.streamHook.cursor, Number(parsed.cursor));
      }
      state.streamHook.failStreak = 0;
      state.streamHook.status = accepted > 0 ? `LIVE +${accepted}` : "LIVE";
    } catch (err) {
      state.streamHook.failStreak = Math.min(99, (state.streamHook.failStreak || 0) + 1);
      state.streamHook.status = `ERR:${state.streamHook.failStreak}`;
      if (state.streamHook.failStreak <= 3 || state.streamHook.failStreak % 8 === 0) {
        log(`LIVE HOOK polling error: ${err && err.message ? err.message : "unknown"}`);
      }
    } finally {
      syncStreamHookPanel();
      streamHookPollingBusy = false;
    }
  }

  function startStreamHookPolling() {
    if (streamHookPollTimer) return;
    streamHookPollTimer = setInterval(function () {
      pollStreamHookOnce().catch(function () {
        // Poll errors are already handled in pollStreamHookOnce.
      });
    }, Math.round(STREAM_HOOK_MIN_POLL_SEC * 1000));
  }

  function stopStreamHookPolling() {
    if (!streamHookPollTimer) return;
    clearInterval(streamHookPollTimer);
    streamHookPollTimer = 0;
  }

  function toggleStreamHook() {
    state.streamHook = normalizeStreamHookConfig(state.streamHook);
    state.streamHook.enabled = !state.streamHook.enabled;
    if (state.streamHook.enabled) {
      state.streamHook.failStreak = 0;
      state.streamHook.status = "CONNECT";
      log(`LIVE HOOK enabled: ${state.streamHook.endpoint}`);
      pollStreamHookOnce().catch(function () {
        // handled internally
      });
    } else {
      state.streamHook.status = "OFF";
      log("LIVE HOOK disabled.");
    }
    updateHud();
  }

  function triggerGift(amount, cost) {
    if (!state.running) {
      log("Gift trigger is active during run only.");
      return;
    }
    if (state.credits < cost) {
      log("Not enough credits. Buy more credits first.");
      return;
    }
    state.credits -= cost;
    const diamonds = Math.max(1, Math.round(amount / 25));
    const localTier = deriveGiftTierFromDiamonds(diamonds, "gift");
    applyGiftImpact(diamonds, localTier, "LOCAL", `Gift${amount}`);
  }

  function buyCredits() {
    state.credits += 20;
    state.grossPurchase += 5;
    state.platformFee += 1.25;
    log("Bought +20 credits for $5.00 (fee 25%).");
    updateHud();
  }

  function setMoveTargetFromEvent(ev) {
    if (!state.running || state.pauseMode) return;
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (W / rect.width);
    const y = (ev.clientY - rect.top) * (H / rect.height);
    state.player.targetX = clamp(x, 12, W - 12);
    state.player.targetY = clamp(y, 12, H - 12);

    if (!state.pointer) {
      state.pointer = { active: false, x: state.player.x, y: state.player.y, vx: 0, vy: 0, ts: performance.now() };
    }
    const now = performance.now();
    const pointer = state.pointer;
    if (pointer.active) {
      const dt = clamp((now - pointer.ts) / 1000, 0.001, 0.08);
      pointer.vx = (state.player.targetX - pointer.x) / dt;
      pointer.vy = (state.player.targetY - pointer.y) / dt;
    } else {
      pointer.vx = 0;
      pointer.vy = 0;
    }
    pointer.x = state.player.targetX;
    pointer.y = state.player.targetY;
    pointer.active = true;
    pointer.ts = now;
  }

  function setupEvents() {
    function handleStartAction() {
      ensureAudioReady();
      if (state.pauseMode) {
        resolvePauseWithFallback("start-btn");
        return;
      }
      if (!state.running) {
        startRun();
      }
    }

    ui.startBtn.addEventListener("click", handleStartAction);

    if (ui.hudModeBtn) {
      ui.hudModeBtn.addEventListener("click", function () {
        state.hudCompact = !state.hudCompact;
        updateHud();
      });
    }

    if (ui.systemTextBtn) {
      ui.systemTextBtn.addEventListener("click", function () {
        const current = normalizeSystemSettings(state.settings).combatTextMode;
        const next = current === "low" ? "full" : current === "full" ? "off" : "low";
        state.settings = {
          ...normalizeSystemSettings(state.settings),
          combatTextMode: next,
        };
        log(`System Focus: combat text ${next.toUpperCase()}`);
        updateHud();
      });
    }

    if (ui.systemFlashBtn) {
      ui.systemFlashBtn.addEventListener("click", function () {
        const settings = normalizeSystemSettings(state.settings);
        state.settings = {
          ...settings,
          flashFx: !settings.flashFx,
        };
        log(`System Focus: flash ${state.settings.flashFx ? "ON" : "OFF"}`);
        updateHud();
      });
    }

    if (ui.systemShakeBtn) {
      ui.systemShakeBtn.addEventListener("click", function () {
        const settings = normalizeSystemSettings(state.settings);
        state.settings = {
          ...settings,
          shakeFx: !settings.shakeFx,
        };
        log(`System Focus: shake ${state.settings.shakeFx ? "ON" : "OFF"}`);
        updateHud();
      });
    }

    function toggleGlitch() {
      if (!state.running || state.pauseMode) return;
      state.glitchActive = true;
      log("Glitch is fixed ON in this ruleset.");
      spawnFloatText(state.player.x, state.player.y - 24, "GLITCH FIXED ON", "#ff9fc3", 14, 0.65);
      triggerFlash("255,90,130", 0.14);
      sfxGlitch(true);
      updateHud();
    }

    if (ui.glitchBtn) {
      ui.glitchBtn.addEventListener("click", toggleGlitch);
    }

    ui.gift100Btn.addEventListener("click", function () {
      if (state.pauseMode) return;
      triggerGift(100, 1);
      updateHud();
    });

    ui.gift500Btn.addEventListener("click", function () {
      if (state.pauseMode) return;
      triggerGift(500, 3);
      updateHud();
    });

    ui.gift1000Btn.addEventListener("click", function () {
      if (state.pauseMode) return;
      triggerGift(1000, 5);
      updateHud();
    });

    if (ui.streamHookBtn) {
      ui.streamHookBtn.addEventListener("click", function () {
        toggleStreamHook();
      });
    }

    ui.buyCreditBtn.addEventListener("click", buyCredits);

    ui.audioBtn.addEventListener("click", function () {
      setAudioEnabled(!audio.enabled);
      if (audio.enabled) {
        ensureAudioReady();
        sfxWave();
      }
    });

    ui.burstBtn.addEventListener("click", function () {
      if (!state.running || state.pauseMode) return;
      castBurst();
      updateHud();
    });

    if (ui.equipItemBtn) {
      ui.equipItemBtn.addEventListener("click", function () {
        const selected = getSelectedInventoryItem();
        if (!selected) return;
        equipItemById(selected.id);
        updateHud();
      });
    }

    if (ui.salvageItemBtn) {
      ui.salvageItemBtn.addEventListener("click", function () {
        const selected = getSelectedInventoryItem();
        if (!selected) return;
        salvageItemById(selected.id);
        updateHud();
      });
    }

    if (ui.unequipSlotBtn) {
      ui.unequipSlotBtn.addEventListener("click", function () {
        if (!state.selectedGearSlot) return;
        unequipSlot(state.selectedGearSlot);
        updateHud();
      });
    }

    if (ui.extractAffixBtn) {
      ui.extractAffixBtn.addEventListener("click", function () {
        extractAffixFromSelected();
        updateHud();
      });
    }

    if (ui.imprintAffixBtn) {
      ui.imprintAffixBtn.addEventListener("click", function () {
        imprintSelectedRune();
        updateHud();
      });
    }

    if (ui.reforgeAffixBtn) {
      ui.reforgeAffixBtn.addEventListener("click", function () {
        reforgeCraftTarget();
        updateHud();
      });
    }

    ui.jobSelect.addEventListener("change", function () {
      setBuild(ui.jobSelect.value, selectedBuild.weaponId, selectedBuild.name);
      if (state.running) log("Build updated. New job applies from next run.");
    });

    ui.weaponSelect.addEventListener("change", function () {
      setBuild(selectedBuild.jobId, ui.weaponSelect.value, selectedBuild.name);
      if (state.running) log("Build updated. New weapon applies from next run.");
    });

    ui.rerollSkillBtn.addEventListener("click", function () {
      if (state.pauseMode !== "levelup") return;
      if (state.credits < 1) {
        log("Need 1 credit for reroll.");
        return;
      }
      state.credits -= 1;
      state.skillRerolls += 1;
      state.levelChoices = rollLevelChoices();
      state.levelAutoPickTimer = LEVEL_AUTO_PICK_SECONDS;
      ui.levelChoices.innerHTML = "";
      for (const skill of state.levelChoices) {
        const btn = document.createElement("button");
        btn.className = "skill-card";
        btn.type = "button";
        btn.innerHTML = `<strong>${skill.name}</strong><span>${skill.desc}</span>`;
        btn.addEventListener("click", function () {
          applyLevelSkill(skill.id);
        });
        ui.levelChoices.appendChild(btn);
      }
      log("Skill choices rerolled.");
      updateLevelAutoTimerLabel();
      updateHud();
    });

    ui.rollCharBtn.addEventListener("click", function () {
      const jobIds = Object.keys(JOBS);
      const weaponIds = Object.keys(WEAPONS);
      setBuild(pick(jobIds), pick(weaponIds), generateCharacterName());
      if (state.running) {
        log(`Character regenerated: ${selectedBuild.name}. New loadout applies next run.`);
      }
    });

    canvas.addEventListener("pointerdown", function (ev) {
      ensureAudioReady();
      if (!state.running && !state.pauseMode) {
        startRun();
        return;
      }
      if (state.pauseMode) {
        resolvePauseWithFallback("tap-canvas");
        return;
      }
      setMoveTargetFromEvent(ev);
      draggingPointerId = ev.pointerId;
      canvas.setPointerCapture(ev.pointerId);
    });

    if (ui.levelModal) {
      ui.levelModal.addEventListener("pointerdown", function (ev) {
        if (ev.target === ui.levelModal && state.pauseMode === "levelup") {
          resolvePauseWithFallback("modal-backdrop");
        }
      });
    }

    if (ui.mutationModal) {
      ui.mutationModal.addEventListener("pointerdown", function (ev) {
        if (ev.target === ui.mutationModal && state.pauseMode === "mutation") {
          resolvePauseWithFallback("modal-backdrop");
        }
      });
    }

    if (ui.pickupModal) {
      ui.pickupModal.addEventListener("pointerdown", function (ev) {
        if (ev.target === ui.pickupModal && state.pauseMode === "pickup_compare") {
          resolvePickupChoice(false, "pickup-backdrop");
        }
      });
    }

    if (ui.pickupKeepBtn) {
      ui.pickupKeepBtn.addEventListener("click", function () {
        if (state.pauseMode !== "pickup_compare") return;
        resolvePickupChoice(true, "pickup-btn");
      });
    }

    if (ui.pickupDiscardBtn) {
      ui.pickupDiscardBtn.addEventListener("click", function () {
        if (state.pauseMode !== "pickup_compare") return;
        resolvePickupChoice(false, "discard-btn");
      });
    }

    canvas.addEventListener("pointermove", function (ev) {
      if (draggingPointerId === ev.pointerId) setMoveTargetFromEvent(ev);
    });

    canvas.addEventListener("pointerup", function (ev) {
      releasePointerDrag(ev.pointerId);
    });

    canvas.addEventListener("pointercancel", function (ev) {
      releasePointerDrag(ev.pointerId);
    });

    document.addEventListener("keydown", function (ev) {
      const key = String(ev.key || "").toLowerCase();
      if (key === "arrowleft" || key === "left") {
        state.input.left = true;
        ev.preventDefault();
        return;
      }
      if (key === "arrowright" || key === "right") {
        state.input.right = true;
        ev.preventDefault();
        return;
      }
      if (key === "arrowup" || key === "up" || key === "w") {
        state.input.up = true;
        ev.preventDefault();
        return;
      }
      if (key === "arrowdown" || key === "down" || key === "s") {
        state.input.down = true;
        ev.preventDefault();
        return;
      }
      if (state.pauseMode === "levelup" && ["1", "2", "3"].includes(key)) {
        const idx = Number(key) - 1;
        const choice = state.levelChoices[idx];
        if (choice) {
          ev.preventDefault();
          applyLevelSkill(choice.id);
        }
        return;
      }
      if (state.pauseMode === "pickup_compare" && ["1", "2"].includes(key)) {
        ev.preventDefault();
        resolvePickupChoice(key === "1", `hotkey-${key}`);
        return;
      }
      if (state.pauseMode === "mutation" && ["1", "2"].includes(key)) {
        const idx = Number(key) - 1;
        const choice = state.mutationChoices[idx];
        if (choice) {
          ev.preventDefault();
          applyMutationChoice(choice.id);
        }
        return;
      }
      if (key === "f") {
        ev.preventDefault();
        toggleFullscreen();
        return;
      }
      if ((key === "enter" || key === "return") && (!state.running || state.pauseMode)) {
        ev.preventDefault();
        handleStartAction();
        return;
      }
      if (key === "h") {
        ev.preventDefault();
        state.hudCompact = !state.hudCompact;
        updateHud();
        return;
      }
      if (key === "t") {
        ev.preventDefault();
        const current = normalizeSystemSettings(state.settings).combatTextMode;
        const next = current === "low" ? "full" : current === "full" ? "off" : "low";
        state.settings = {
          ...normalizeSystemSettings(state.settings),
          combatTextMode: next,
        };
        updateHud();
        return;
      }
      if (key === "v") {
        ev.preventDefault();
        const settings = normalizeSystemSettings(state.settings);
        state.settings = {
          ...settings,
          flashFx: !settings.flashFx,
        };
        updateHud();
        return;
      }
      if (key === "j") {
        ev.preventDefault();
        const settings = normalizeSystemSettings(state.settings);
        state.settings = {
          ...settings,
          shakeFx: !settings.shakeFx,
        };
        updateHud();
        return;
      }
      if ((key === " " || key === "spacebar") && state.running && !state.pauseMode) {
        ev.preventDefault();
        castBurst();
        updateHud();
        return;
      }
      if (key === "a") {
        ev.preventDefault();
        toggleGlitch();
        return;
      }
      if (key === "l") {
        ev.preventDefault();
        toggleStreamHook();
        return;
      }
      if (ev.key === "Escape" && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(function () {
          // Ignore fullscreen exit errors.
        });
      }
    });

    document.addEventListener("keyup", function (ev) {
      const key = String(ev.key || "").toLowerCase();
      if (key === "arrowleft" || key === "left") {
        state.input.left = false;
      } else if (key === "arrowright" || key === "right") {
        state.input.right = false;
      } else if (key === "arrowup" || key === "up" || key === "w") {
        state.input.up = false;
      } else if (key === "arrowdown" || key === "down" || key === "s") {
        state.input.down = false;
      }
    });

    document.addEventListener("fullscreenchange", applyFullscreenClass);
  }

  populateBuildOptions();
  setupEvents();
  startStreamHookPolling();
  setBuild(DEFAULT_JOB, DEFAULT_WEAPON, generateCharacterName());
  setAudioEnabled(true);
  initializeLoadoutState();
  resetNunchakuToPlayer();

  renderAffixList();
  renderDropList();
  renderLeaderboard();
  updateHud();
  draw();

  window.render_game_to_text = renderGameToText;
  window.advanceTime = advanceTime;
  window.toggle_game_fullscreen = toggleFullscreen;
  window.set_nunchaku_stretch_limit = function (value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return state.nunchaku ? state.nunchaku.stretchLimit : null;
    const limit = clamp(numeric, 18, 180);
    if (!state.nunchaku) resetNunchakuToPlayer();
    state.nunchaku.stretchLimit = limit;
    updateHud();
    return limit;
  };
  window.injectTikfinityEvent = function (payload) {
    ingestLiveGiftEvent(payload);
    updateHud();
  };
  window.addEventListener("beforeunload", stopStreamHookPolling);
  applyFullscreenClass();
})();
