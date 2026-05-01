import { AD_CATALOG, type AdDef } from "../content/ads";
import { BOSSES, BOSS_ORDER } from "../content/bosses";
import { COLORS, DIRECTOR_BALANCE, DROP_BALANCE, NUNCHAKU_BALANCE, PLAYER_BALANCE, UI_TIMERS, WORLD } from "../content/balance";
import { ENEMIES, ENEMY_ROLES } from "../content/enemies";
import { AFFIXES, EQUIPMENT_SLOT_LABELS, RARITIES, RARITY_ORDER, addEquipmentMods, cloneEquipmentMods, formatAffix, rollEquipmentItem } from "../content/equipment";
import { GIFTS, type GiftKind } from "../content/gifts";
import { JOBS, JOB_ORDER, type JobId } from "../content/jobs";
import { LEVEL_SKILLS, MUTATIONS } from "../content/skills";
import { WEAPONS, WEAPON_ORDER, type WeaponId } from "../content/weapons";
import { normalizeLiveEvent, type NormalizedLiveEvent } from "../platform/liveEvents";
import { computeScore, saveLocalScore } from "../systems/scoring";
import { getCurrentSeason, getFeedbackSummary, getLeaderboardSummary } from "../systems/season";
import { clamp, clampToWorld, distance, distancePointToSegment, formatTime, length, normalize } from "./math";
import { Rng } from "./rng";
import type {
  BuildState,
  ActiveAdState,
  AdQueueState,
  ChoiceState,
  DropState,
  EquipmentMods,
  EquipmentSlot,
  EconomyState,
  EnemyState,
  FloatingText,
  GameMode,
  GiftEventState,
  InputState,
  ItemState,
  NunchakuState,
  ObjectiveState,
  ObstacleState,
  ParticleState,
  PauseMode,
  PhantomNunchakuState,
  PickupCompareState,
  PlayerState,
  PublicSnapshot,
  QueryOptions,
  SettingsState,
  SkillId,
  Vec2,
  WaveState,
} from "./types";

const CHARACTER_PREFIX = ["Iron", "Crow", "Rune", "Bell", "Ash", "Gilded", "Oath", "Cinder"];
const CHARACTER_SUFFIX = ["Knight", "Rogue", "Witch", "Monk", "Banner", "Breaker", "Warden", "Chain"];

export class GameSim {
  readonly options: QueryOptions;
  readonly input: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    pointerActive: false,
    pointerX: WORLD.width * 0.5,
    pointerY: WORLD.height * 0.72,
  };

  rng: Rng;
  manualClock = false;
  mode: GameMode = "title";
  pauseMode: PauseMode = null;
  build: BuildState = {
    characterName: "Volt Node",
    jobId: "vanguard",
    weaponId: "chain_core",
  };
  settings: SettingsState = {
    debugHud: false,
    flashFx: true,
    shakeFx: true,
    audio: true,
  };
  glossaryOpen = false;
  player: PlayerState = createPlayer();
  nunchaku: NunchakuState = createNunchaku();
  enemies: EnemyState[] = [];
  drops: DropState[] = [];
  phantoms: PhantomNunchakuState[] = [];
  obstacles: ObstacleState[] = [];
  activeAds: ActiveAdState[] = [];
  adQueue: AdQueueState[] = [];
  selectedAdId: string | null = null;
  particles: ParticleState[] = [];
  floatTexts: FloatingText[] = [];
  levelChoices: ChoiceState[] = [];
  mutationChoices: ChoiceState[] = [];
  pickupCompare: PickupCompareState | null = null;
  objective: ObjectiveState | null = null;
  giftEvent: GiftEventState = idleGiftEvent();
  economy: EconomyState = {
    demoEnergy: 100,
    giftValue: 0,
    giftDiamonds: 0,
    giftCount: 0,
    legendary: 0,
  };

  time = 0;
  wave = 1;
  waveState: WaveState = "spawning";
  waveTarget = WORLD.baseWaveTarget;
  waveSpawned = 0;
  waveKills = 0;
  waveClearCount = 0;
  waveIntermissionTimer = 0;
  kills = 0;
  score = 0;
  spawnTimer = 0.8;
  directorBias = 1;
  threatScore = 0;
  nextObjectiveAt = 12;
  nextMutationWave = WORLD.mutationWave;
  nextBossWave = WORLD.bossWave;
  bossDefeated = false;
  bossKills = 0;
  endedReason = "";
  lastScoreEntryId = "";
  equippedItems: Record<EquipmentSlot, ItemState | null> = createEquipmentSlots();
  equipmentSlotMods: Record<EquipmentSlot, EquipmentMods> = createEquipmentSlotMods();
  equipmentMods: EquipmentMods = cloneEquipmentMods();
  shake = 0;
  flash = 0;
  flashColor = COLORS.danger;

  private idSeq = 1;
  private adInstanceSeq = 1;
  private damageMul = 1;
  private speedBonus = 0;
  private reachBonus = 0;
  private snapCdMul = 1;
  private pickupBonus = 0;
  private spinBonus = 0;
  private reflectStacks = 0;
  private shockwaveStacks = 0;
  private chainStacks = 0;
  private sawStacks = 0;
  private gravityStacks = 0;
  private bleedStacks = 0;
  private critChanceBonus = 0;
  private critDamageBonus = 0;
  private executeThresholdBonus = 0;
  private lifeOnHit = 0;
  private enemySlowBonus = 0;
  private scorchStacks = 0;
  private toxicStacks = 0;
  private frostStacks = 0;
  private bossDamageBonus = 0;
  private eliteDamageBonus = 0;
  private xpMul = 1;
  private dropLuckBonus = 0;
  private damageReductionBonus = 0;
  private scoreMul = 1;
  private snapImpulseBonus = 0;
  private overdrive = false;
  private rubber = false;
  private bulwark = false;
  private magnet = false;
  private acquiredSkills: SkillId[] = [];
  private acquiredMutations = new Set<SkillId>();
  private skillStacks: Partial<Record<SkillId, number>> = {};
  private lastHitDamageMultiplier = 1;
  private lastHitDamage = 0;
  private lastLegendaryAt = 0;
  private equipmentPhantomCount = 0;
  private liveSeen = new Set<string>();
  private liveQueue: NormalizedLiveEvent[] = [];
  private liveQueueReleaseTimer = 0;

  constructor(options: QueryOptions) {
    this.options = options;
    this.rng = new Rng(options.seed);
    this.applyBuildStats(true);
  }

  get equippedItem(): ItemState | null {
    return this.equippedItems.nunchaku || this.equippedItems.body;
  }

  startRun(): void {
    const persistentBuild = { ...this.build };
    const persistentSettings = { ...this.settings };
    const persistentEnergy = this.economy.demoEnergy;
    this.rng = new Rng(`${this.options.seed}:${persistentBuild.jobId}:${persistentBuild.weaponId}`);
    this.mode = "running";
    this.pauseMode = null;
    this.build = persistentBuild;
    this.settings = persistentSettings;
    this.player = createPlayer();
    this.nunchaku = createNunchaku();
    this.enemies = [];
    this.drops = [];
    this.phantoms = [];
    this.obstacles = [];
    this.activeAds = [];
    this.adQueue = [];
    this.selectedAdId = null;
    this.particles = [];
    this.floatTexts = [];
    this.levelChoices = [];
    this.mutationChoices = [];
    this.pickupCompare = null;
    this.objective = null;
    this.giftEvent = idleGiftEvent();
    this.economy = {
      demoEnergy: persistentEnergy,
      giftValue: 0,
      giftDiamonds: 0,
      giftCount: 0,
      legendary: 0,
    };
    this.time = 0;
    this.wave = 1;
    this.waveState = "spawning";
    this.waveTarget = this.computeWaveTarget(1);
    this.waveSpawned = 0;
    this.waveKills = 0;
    this.waveClearCount = 0;
    this.waveIntermissionTimer = 0;
    this.kills = 0;
    this.score = 0;
    this.spawnTimer = 0.2;
    this.directorBias = 1;
    this.threatScore = 0;
    this.nextObjectiveAt = 14;
    this.nextMutationWave = WORLD.mutationWave;
    this.nextBossWave = WORLD.bossWave;
    this.bossDefeated = false;
    this.bossKills = 0;
    this.endedReason = "";
    this.lastScoreEntryId = "";
    this.equippedItems = createEquipmentSlots();
    this.equipmentSlotMods = createEquipmentSlotMods();
    this.equipmentMods = cloneEquipmentMods();
    this.equipmentPhantomCount = 0;
    this.shake = 0;
    this.flash = 0;
    this.damageMul = 1;
    this.speedBonus = 0;
    this.reachBonus = 0;
    this.snapCdMul = 1;
    this.pickupBonus = 0;
    this.spinBonus = 0;
    this.reflectStacks = 0;
    this.shockwaveStacks = 0;
    this.chainStacks = 0;
    this.sawStacks = 0;
    this.gravityStacks = 0;
    this.bleedStacks = 0;
    this.critChanceBonus = 0;
    this.critDamageBonus = 0;
    this.executeThresholdBonus = 0;
    this.lifeOnHit = 0;
    this.enemySlowBonus = 0;
    this.scorchStacks = 0;
    this.toxicStacks = 0;
    this.frostStacks = 0;
    this.bossDamageBonus = 0;
    this.eliteDamageBonus = 0;
    this.xpMul = 1;
    this.dropLuckBonus = 0;
    this.damageReductionBonus = 0;
    this.scoreMul = 1;
    this.snapImpulseBonus = 0;
    this.overdrive = false;
    this.rubber = false;
    this.bulwark = false;
    this.magnet = false;
    this.acquiredSkills = [];
    this.acquiredMutations = new Set<SkillId>();
    this.skillStacks = {};
    this.lastHitDamageMultiplier = 1;
    this.lastHitDamage = 0;
    this.lastLegendaryAt = 0;
    if (!this.liveQueue.length) this.liveQueueReleaseTimer = 0;
    this.applyBuildStats(true);
    this.resetNunchaku();
    if (this.options.bossDebug) this.player.invuln = Math.max(this.player.invuln, 2.2);
    if (this.options.bossDebug) {
      this.spawnBoss();
    } else {
      this.startWave(1);
    }
    this.pushFloat("STREAM RAID", WORLD.width * 0.5, 86, COLORS.gift, 20);
  }

  step(dt: number): void {
    const safeDt = clamp(dt, 0, 1 / 20);
    this.updateEffects(safeDt);
    if (this.mode !== "running") return;

    if (this.pauseMode === "menu" || this.pauseMode === "mutation") return;

    if (this.pauseMode === "levelup") {
      this.stepLevelTimer(safeDt);
      return;
    }
    if (this.pauseMode === "pickup_compare") {
      this.stepPickupTimer(safeDt);
      return;
    }

    this.time += safeDt;
    this.nunchaku.snapCd = Math.max(0, this.nunchaku.snapCd - safeDt);
    this.nunchaku.snapFlash = Math.max(0, this.nunchaku.snapFlash - safeDt * 2.8);
    this.nunchaku.selfHitCd = Math.max(0, this.nunchaku.selfHitCd - safeDt);
    this.player.invuln = Math.max(0, this.player.invuln - safeDt);

    this.updateDirector(safeDt);
    this.updateObjective(safeDt);
    this.updatePlayer(safeDt);
    this.updateNunchaku(safeDt);
    this.updatePhantoms(safeDt);
    this.updateEnemies(safeDt);
    this.updateDrops(safeDt);
    this.updateObstacles(safeDt);
    this.updateSpawning(safeDt);
    this.checkWaveClear(safeDt);
    this.drainLiveQueue(safeDt);
    this.updateThreat();
    this.updateScore();

    if ((this.wave >= this.nextBossWave || (this.options.bossDebug && this.time > 1.5 && this.bossKills === 0)) && !this.hasBoss()) {
      this.spawnBoss();
    }
    if (this.player.hp <= 0) {
      this.finishRun(false, "HP_ZERO");
    }
  }

  startOrResolve(): void {
    if (this.pauseMode === "menu") {
      if (this.mode === "running") {
        this.pauseMode = null;
        return;
      }
      this.startRun();
      return;
    }
    if (this.pauseMode === "levelup") {
      this.chooseLevel(0);
      return;
    }
    if (this.pauseMode === "pickup_compare") {
      this.resolvePickup(true);
      return;
    }
    if (this.pauseMode === "mutation") {
      this.chooseMutation(0);
      return;
    }
    if (this.mode !== "running") this.startRun();
  }

  setBuild(jobId: JobId, weaponId: WeaponId): void {
    this.build.jobId = jobId;
    this.build.weaponId = weaponId;
    if (this.mode !== "running") this.applyBuildStats(true);
  }

  rollCharacter(): void {
    this.build.characterName = `${this.rng.pick(CHARACTER_PREFIX)} ${this.rng.pick(CHARACTER_SUFFIX)}`;
  }

  toggleMenu(force?: boolean): void {
    if (force === false) {
      if (this.pauseMode === "menu") this.pauseMode = null;
      return;
    }
    if (this.pauseMode === "menu") {
      this.pauseMode = null;
      return;
    }
    if (this.pauseMode) return;
    this.pauseMode = "menu";
  }

  triggerSnap(): boolean {
    if (this.mode !== "running" || this.pauseMode !== null) return false;
    if (this.nunchaku.snapCd > 0) return false;
    const p = this.player;
    const n = this.nunchaku;
    const dir = normalize(n.x - p.x + p.vx * 0.24, n.y - p.y + p.vy * 0.24);
    const weapon = WEAPONS[this.build.weaponId];
    const job = JOBS[this.build.jobId];
    const impulse = NUNCHAKU_BALANCE.snapImpulse * weapon.snapMul * job.snapMul * (1 + this.totalSpinBonus() * 0.08 + this.snapImpulseBonus + this.equipmentMods.spinBonus * 0.03);
    n.vx += dir.x * impulse + p.vx * 0.42;
    n.vy += dir.y * impulse + p.vy * 0.42;
    for (const phantom of this.phantoms) {
      const pd = normalize(phantom.x - p.x + p.vx * 0.18, phantom.y - p.y + p.vy * 0.18);
      const side = phantom.orbitSpeed >= 0 ? 1 : -1;
      phantom.vx += pd.x * impulse * 0.62 - pd.y * impulse * 0.14 * side + p.vx * 0.26;
      phantom.vy += pd.y * impulse * 0.62 + pd.x * impulse * 0.14 * side + p.vy * 0.26;
      phantom.snapFlash = 1;
    }
    n.snapCd = NUNCHAKU_BALANCE.snapCooldown * this.snapCdMul * this.equipmentMods.snapCdMul;
    n.snapFlash = 1;
    this.shake = Math.max(this.shake, this.settings.shakeFx ? 5 : 0);
    this.flash = Math.max(this.flash, this.settings.flashFx ? 0.14 : 0);
    this.flashColor = COLORS.gift;
    this.pushFloat("SNAP", p.x, p.y - 32, COLORS.gift, 14);
    if (this.objective?.type === "snap") {
      this.objective.progress += 1;
    }
    if (this.totalShockwaveStacks() > 0) this.applyShockwave(n.x, n.y);
    return true;
  }

  setPointer(active: boolean, x: number, y: number): void {
    this.input.pointerActive = active;
    this.input.pointerX = clamp(x, WORLD.safePad, WORLD.width - WORLD.safePad);
    this.input.pointerY = clamp(y, WORLD.playTopPad, WORLD.height - WORLD.playBottomPad);
  }

  setKey(action: keyof Pick<InputState, "left" | "right" | "up" | "down">, value: boolean): void {
    this.input[action] = value;
  }

  chooseLevel(index: number): void {
    if (this.pauseMode !== "levelup") return;
    const choice = this.levelChoices[index] ?? this.levelChoices[0];
    if (!choice) return;
    this.applySkill(choice.id, "skill");
    this.levelChoices = [];
    this.pauseMode = null;
    this.processPostRewardFlow();
  }

  chooseMutation(index: number): void {
    if (this.pauseMode !== "mutation") return;
    const choice = this.mutationChoices[index] ?? this.mutationChoices[0];
    if (!choice) return;
    this.applySkill(choice.id, "mutation");
    this.mutationChoices = [];
    this.pauseMode = null;
    this.nextMutationWave += WORLD.mutationWave;
    this.processPostRewardFlow();
  }

  resolvePickup(keep: boolean): void {
    if (!this.pickupCompare) return;
    const drop = this.pickupCompare.item;
    const item = drop.item;
    if (keep) {
      if (item) {
        this.equippedItems[item.slot] = item;
        this.rebuildEquipmentMods();
        this.applyBuildStats(false);
        this.resetNunchaku();
        this.syncEquipmentPhantoms();
        for (const phantom of this.phantoms) phantom.headRadius = this.nunchaku.headRadius;
      }
      this.pushFloat("EQUIP", this.player.x, this.player.y - 32, drop.color, 13);
    } else {
      this.economy.demoEnergy = Math.min(160, this.economy.demoEnergy + 4);
      this.pushFloat("+ENERGY", this.player.x, this.player.y - 32, COLORS.gift, 12);
    }
    this.pickupCompare = null;
    this.pauseMode = null;
    this.processPostRewardFlow();
  }

  rerollLevelChoices(): void {
    if (this.pauseMode !== "levelup") return;
    this.openLevelUp();
  }

  triggerDemoGift(amount: number): boolean {
    const cost = Math.max(4, Math.round(amount / 25));
    if (this.economy.demoEnergy < cost) {
      this.pushFloat("ENERGY LOW", this.player.x, this.player.y - 42, COLORS.danger, 12);
      return false;
    }
    this.economy.demoEnergy -= cost;
    this.applyGift(Math.max(1, Math.round(amount / 40)), `LOCAL Gift${amount}`);
    return true;
  }

  refillDemoEnergy(): void {
    this.economy.demoEnergy = Math.min(160, this.economy.demoEnergy + 25);
  }

  injectTikfinityEvent(raw: unknown): boolean {
    const event = normalizeLiveEvent(raw);
    if (this.liveSeen.has(event.id)) return false;
    this.liveSeen.add(event.id);
    if (this.liveSeen.size > 500) {
      const first = this.liveSeen.values().next();
      if (!first.done) this.liveSeen.delete(first.value);
    }
    if (!this.canApplyLiveEventNow()) {
      this.enqueueLiveEvent(event);
      return false;
    }
    this.applyLiveEvent(event);
    return true;
  }

  toggleDebugHud(): void {
    this.settings.debugHud = !this.settings.debugHud;
  }

  toggleFlash(): void {
    this.settings.flashFx = !this.settings.flashFx;
  }

  toggleShake(): void {
    this.settings.shakeFx = !this.settings.shakeFx;
  }

  toggleAudio(): void {
    this.settings.audio = !this.settings.audio;
  }

  setNunchakuStretchLimit(value: number): void {
    const safe = clamp(Number(value) || NUNCHAKU_BALANCE.maxLength, 88, 220);
    this.nunchaku.maxLength = safe;
  }

  getScorePreview(clearedOverride = this.mode === "ended" && this.player.hp > 0): number {
    return Math.round(computeScore({
      time: this.time,
      kills: this.kills,
      wave: this.wave,
      hitsTaken: this.player.hitsTaken,
      cleared: clearedOverride,
      economy: this.economy,
      bossDefeated: this.bossDefeated,
      bossKills: this.bossKills,
    }) * this.totalScoreMul());
  }

  private totalDamageMul(): number {
    return this.damageMul * this.player.damageMul * this.equipmentMods.damageMul;
  }

  private totalSpeedBonus(): number {
    return this.speedBonus + this.equipmentMods.speedBonus;
  }

  private totalReachBonus(): number {
    return this.reachBonus + this.equipmentMods.reachBonus;
  }

  private totalPickupBonus(): number {
    return this.pickupBonus + this.equipmentMods.pickupBonus;
  }

  private totalSpinBonus(): number {
    return this.spinBonus + this.equipmentMods.spinBonus;
  }

  private totalReflectStacks(): number {
    return this.reflectStacks + this.equipmentMods.reflectStacks;
  }

  private totalShockwaveStacks(): number {
    return this.shockwaveStacks + this.equipmentMods.shockwaveStacks;
  }

  private totalChainStacks(): number {
    return this.chainStacks + this.equipmentMods.chainStacks;
  }

  private totalGravityStacks(): number {
    return this.gravityStacks + this.equipmentMods.gravityStacks;
  }

  private totalBleedStacks(): number {
    return this.bleedStacks + this.equipmentMods.bleedStacks;
  }

  private totalCritChance(): number {
    return clamp(this.critChanceBonus + this.equipmentMods.critChance, 0, 0.72);
  }

  private totalCritDamage(): number {
    return this.critDamageBonus + this.equipmentMods.critDamage;
  }

  private totalDamageReduction(): number {
    return clamp(this.damageReductionBonus + this.equipmentMods.damageReduction, 0, 0.72);
  }

  private totalXpMul(): number {
    return this.xpMul * this.equipmentMods.xpMul;
  }

  private totalDropLuck(): number {
    return this.dropLuckBonus + this.equipmentMods.dropLuck;
  }

  private totalScoreMul(): number {
    return this.scoreMul * this.equipmentMods.scoreMul;
  }

  private totalEquippedPower(): number {
    return (this.equippedItems.body?.power || 0) + (this.equippedItems.nunchaku?.power || 0);
  }

  private rebuildEquipmentMods(): void {
    this.equipmentSlotMods = {
      body: this.equippedItems.body ? cloneEquipmentMods(this.equippedItems.body.mods) : cloneEquipmentMods(),
      nunchaku: this.equippedItems.nunchaku ? cloneEquipmentMods(this.equippedItems.nunchaku.mods) : cloneEquipmentMods(),
    };
    this.equipmentMods = cloneEquipmentMods();
    addEquipmentMods(this.equipmentMods, this.equipmentSlotMods.body);
    addEquipmentMods(this.equipmentMods, this.equipmentSlotMods.nunchaku);
  }

  private syncEquipmentPhantoms(): void {
    const desired = Math.max(0, Math.round(this.equipmentMods.cloneCount));
    if (desired === this.equipmentPhantomCount) return;
    this.phantoms = this.phantoms.filter((phantom) => phantom.source !== "equipment");
    this.equipmentPhantomCount = 0;
    for (let i = 0; i < desired; i += 1) {
      this.addPhantomNunchaku("equipment");
      this.equipmentPhantomCount += 1;
    }
  }

  renderGameToText(): string {
    return JSON.stringify(this.createSnapshot());
  }

  createSnapshot(): PublicSnapshot {
    const boss = this.enemies.find((enemy) => enemy.boss);
    const p = this.player;
    const n = this.nunchaku;
    const season = getCurrentSeason();
    const leaderboard = getLeaderboardSummary(season.id);
    const feedback = getFeedbackSummary(season.id);
    return {
      coordinate_system: "origin top-left, x right positive, y down positive, units=canvas px",
      canvas: {
        width: WORLD.width,
        height: WORLD.height,
        layout: WORLD.layout,
        play_bounds: {
          x: WORLD.safePad,
          y: WORLD.playTopPad,
          width: WORLD.width - WORLD.safePad * 2,
          height: WORLD.height - WORLD.playTopPad - WORLD.playBottomPad,
        },
      },
      mode: this.mode,
      pause_mode: this.pauseMode,
      score: this.score,
      build: {
        character: this.build.characterName,
        job: this.build.jobId,
        weapon: this.build.weaponId,
      },
      season: {
        storage_key: "synapse_storm_season_v1",
        id: season.id,
        index: season.index,
        starts_at: season.startAt,
        ends_at: season.endAt,
        days_left: season.daysLeft,
      },
      leaderboard: {
        ...leaderboard,
        pending_entry_id: this.lastScoreEntryId || null,
      },
      feedback,
      combat: {
        acquired_skills: [...this.acquiredSkills],
        acquired_mutations: [...this.acquiredMutations],
        skill_stacks: { ...this.skillStacks },
        phantom_nunchaku: this.phantoms.length,
        overdrive_active: this.overdrive,
        rubber: this.rubber,
        bulwark: this.bulwark,
        magnet: this.magnet,
        skill_catalog_count: LEVEL_SKILLS.length,
        equipment_affix_catalog_count: AFFIXES.length,
        damage_multiplier: round(this.totalDamageMul()),
        effective_damage_multiplier: round(this.totalDamageMul() * (1 + (this.sawStacks + this.equipmentMods.headRadiusBonus * 0.25) * 0.1) * this.rageMultiplier()),
        rage_multiplier: round(this.rageMultiplier()),
        crit_chance: round(this.totalCritChance()),
        crit_damage_bonus: round(this.totalCritDamage()),
        spin_bonus: round(this.totalSpinBonus()),
        reflect_stacks: this.totalReflectStacks(),
        shockwave_stacks: this.totalShockwaveStacks(),
        chain_stacks: this.totalChainStacks(),
        gravity_stacks: this.totalGravityStacks(),
        bleed_stacks: this.totalBleedStacks(),
        snap_cooldown_multiplier: round(this.snapCdMul * this.equipmentMods.snapCdMul),
        reach_bonus: round(this.totalReachBonus()),
        speed_bonus: round(this.totalSpeedBonus()),
        pickup_bonus: round(this.totalPickupBonus()),
        last_hit_damage_multiplier: round(this.lastHitDamageMultiplier),
        last_hit_damage: round(this.lastHitDamage),
        overdrive_spark_speed: NUNCHAKU_BALANCE.overdriveSparkSpeed,
      },
      player: {
        x: round(p.x),
        y: round(p.y),
        target_x: round(p.targetX),
        target_y: round(p.targetY),
        vx: round(p.vx),
        vy: round(p.vy),
        speed: round(p.speed + this.totalSpeedBonus()),
        hp: Math.round(p.hp),
        max_hp: Math.round(p.maxHp),
        level: p.level,
        xp: Math.round(p.xp),
        next_xp: Math.round(p.nextXp),
        r: p.radius,
      },
      run: {
        wave: this.wave,
        wave_state: this.waveState,
        wave_target: this.waveTarget,
        wave_spawned: this.waveSpawned,
        wave_remaining: Math.max(0, this.waveTarget - this.waveKills),
        wave_clear_count: this.waveClearCount,
        wave_xp_required: this.waveXpRequirement(),
        time: round(this.time),
        time_text: formatTime(this.time),
        enemies_alive: this.enemies.length,
        enemy_cap: this.enemyCap(),
        kills_total: this.kills,
        threat_score: Math.round(this.threatScore),
        snap_cd: round(n.snapCd),
        boss_debug: this.options.bossDebug,
        boss: boss
          ? {
              id: boss.id,
              name: boss.name,
              x: round(boss.x),
              y: round(boss.y),
              hp: Math.round(boss.hp),
              max_hp: Math.round(boss.maxHp),
              phase: boss.phase,
              r: boss.radius,
              dist: Math.round(distance(boss, p)),
            }
          : null,
        boss_defeated: this.bossDefeated,
        boss_kills: this.bossKills,
        next_boss_wave: this.nextBossWave,
        gift_event: {
          kind: this.giftEvent.kind,
          timer: round(this.giftEvent.timer),
          source: this.giftEvent.source,
        },
        gift_obstacles: this.obstacles.map((obstacle) => ({
          x: round(obstacle.x),
          y: round(obstacle.y),
          w: round(obstacle.w),
          h: round(obstacle.h),
          life_left: round(obstacle.life),
          type: obstacle.type,
        })),
        selected_ad_id: this.selectedAdId,
        active_ads: this.activeAds.map((ad) => ({
          instance_id: ad.instanceId,
          id: ad.id,
          type: ad.type,
          brand: ad.brand,
          lane: ad.lane,
          x: round(ad.x),
          y: round(ad.y),
          w: round(ad.w),
          h: round(ad.h),
          life_left: round(ad.life),
          speed: round(ad.speed),
          opacity: round(ad.opacity),
          rarity: ad.rarity,
        })),
        ad_queue: this.adQueue.map((entry) => ({
          id: entry.id,
          source: entry.source,
          diamonds: entry.diamonds,
          tier: entry.tier,
          queued_at: round(entry.queuedAt),
        })),
        ad_catalog_count: AD_CATALOG.length,
        ui_panels: {
          menu_open: this.pauseMode === "menu",
          glossary_open: this.glossaryOpen,
          levelup_open: this.pauseMode === "levelup",
          mutation_open: this.pauseMode === "mutation",
          pickup_open: this.pauseMode === "pickup_compare",
        },
        live_queue: this.liveQueue.length,
        live_queue_release_timer: round(this.liveQueueReleaseTimer),
        debug_hud: this.settings.debugHud,
        ended_reason: this.endedReason,
      },
      nunchaku: {
        x: round(n.x),
        y: round(n.y),
        prev_x: round(n.prevX),
        prev_y: round(n.prevY),
        vx: round(n.vx),
        vy: round(n.vy),
        speed: round(n.speed),
        rest_length: round(n.restLength),
        max_length: round(n.maxLength),
        tension: round(n.tension),
        stretch: round(n.stretch),
        head_r: n.headRadius,
        r: n.headRadius,
        snap_cd: round(n.snapCd),
        snap_flash: round(n.snapFlash),
        self_hit_cd: round(n.selfHitCd),
      },
      phantoms: this.phantoms.map((phantom) => ({
        x: round(phantom.x),
        y: round(phantom.y),
        prev_x: round(phantom.prevX),
        prev_y: round(phantom.prevY),
        vx: round(phantom.vx),
        vy: round(phantom.vy),
        speed: round(phantom.speed),
        rest_length: round(phantom.restLength),
        max_length: round(phantom.maxLength),
        tension: round(phantom.tension),
        stretch: round(phantom.stretch),
        snap_flash: round(phantom.snapFlash),
        r: phantom.headRadius,
        source: phantom.source || "skill",
      })),
      objective: this.objective
        ? {
            type: this.objective.type,
            label: this.objective.label,
            progress: Math.round(this.objective.progress),
            target: this.objective.target,
            timer: round(this.objective.timer),
          }
        : null,
      economy: {
        credits: this.economy.demoEnergy,
        demo_energy: this.economy.demoEnergy,
        gift: this.economy.giftValue,
        diamonds: this.economy.giftDiamonds,
        legendary: this.economy.legendary,
        score_preview: this.getScorePreview(),
      },
      inventory: {
        equipped_power: Math.round(this.totalEquippedPower()),
        equipped_item: this.equippedItem ? this.itemSnapshot(this.equippedItem) : null,
        equipment_slots: {
          body: this.equippedItems.body
            ? { label: EQUIPMENT_SLOT_LABELS.body, power: this.equippedItems.body.power, item: this.itemSnapshot(this.equippedItems.body) }
            : { label: EQUIPMENT_SLOT_LABELS.body, power: 0, item: null },
          nunchaku: this.equippedItems.nunchaku
            ? { label: EQUIPMENT_SLOT_LABELS.nunchaku, power: this.equippedItems.nunchaku.power, item: this.itemSnapshot(this.equippedItems.nunchaku) }
            : { label: EQUIPMENT_SLOT_LABELS.nunchaku, power: 0, item: null },
        },
        equipment_mods: this.modSnapshot(this.equipmentMods),
        slot_mods: {
          body: this.modSnapshot(this.equipmentSlotMods.body),
          nunchaku: this.modSnapshot(this.equipmentSlotMods.nunchaku),
        },
        rarity_order: RARITY_ORDER.map((rarity) => ({ id: rarity, label: RARITIES[rarity].label, color: RARITIES[rarity].color })),
        affix_catalog_count: AFFIXES.length,
        pickup_compare: this.pickupCompare
          ? {
              slot: this.pickupCompare.slot,
              slot_label: EQUIPMENT_SLOT_LABELS[this.pickupCompare.slot],
              name: this.pickupCompare.item.name,
              power: this.pickupCompare.item.power,
              rarity: this.pickupCompare.item.rarity,
              drop_item: this.pickupCompare.item.item ? this.itemSnapshot(this.pickupCompare.item.item) : null,
              current_item: this.pickupCompare.currentItem ? this.itemSnapshot(this.pickupCompare.currentItem) : null,
              delta_power: Math.round((this.pickupCompare.item.power || 0) - this.pickupCompare.currentPower),
              timer: round(this.pickupCompare.timer),
            }
          : null,
      },
      enemies: this.enemies.slice(0, 16).map((enemy) => ({
        id: enemy.id,
        name: enemy.name,
        x: round(enemy.x),
        y: round(enemy.y),
        vx: round(enemy.vx),
        vy: round(enemy.vy),
        hp: Math.round(enemy.hp),
        max_hp: Math.round(enemy.maxHp),
        elite: enemy.elite,
        type: enemy.role,
        role: enemy.role,
        boss: enemy.boss,
        r: enemy.radius,
        dist: Math.round(distance(enemy, p)),
      })),
      drops: this.drops.slice(0, 20).map((drop) => ({
        id: drop.id,
        x: round(drop.x),
        y: round(drop.y),
        r: drop.radius,
        kind: drop.kind,
        value: drop.value,
        name: drop.name,
        rarity: drop.rarity,
        power: drop.power,
        item: drop.item ? this.itemSnapshot(drop.item) : null,
      })),
    };
  }

  private itemSnapshot(item: ItemState): Record<string, unknown> {
    return {
      id: item.id,
      name: item.name,
      slot: item.slot,
      slot_label: EQUIPMENT_SLOT_LABELS[item.slot],
      base_name: item.baseName,
      asset_id: item.assetId,
      rarity: item.rarity,
      rarity_label: RARITIES[item.rarity].label,
      color: item.color,
      power: item.power,
      wave: item.wave,
      affixes: item.affixes.map((affix) => ({
        id: affix.id,
        name: affix.name,
        desc: affix.desc,
        value: round(affix.value),
        text: formatAffix(affix),
      })),
    };
  }

  private modSnapshot(mods: EquipmentMods): Record<string, unknown> {
    return Object.fromEntries(Object.entries(mods).map(([key, value]) => [key, typeof value === "number" ? round(value) : value]));
  }

  private applyBuildStats(fullHeal = false): void {
    const job = JOBS[this.build.jobId];
    const weapon = WEAPONS[this.build.weaponId];
    const oldMax = this.player.maxHp || PLAYER_BALANCE.baseHp;
    this.player.maxHp = Math.round(PLAYER_BALANCE.baseHp * job.hpMul + this.equipmentMods.maxHpBonus);
    this.player.hp = fullHeal ? this.player.maxHp : Math.min(this.player.maxHp, Math.max(1, this.player.hp + Math.max(0, this.player.maxHp - oldMax)));
    this.player.speed = PLAYER_BALANCE.baseSpeed * job.speedMul;
    this.player.damageMul = job.damageMul * weapon.damageMul;
    this.player.snapMul = job.snapMul * weapon.snapMul;
    this.nunchaku.restLength = weapon.reach;
    this.nunchaku.maxLength = weapon.reach + 58;
    this.nunchaku.headRadius = weapon.headRadius + this.sawStacks * 2 + this.equipmentMods.headRadiusBonus;
  }

  private resetNunchaku(): void {
    const weapon = WEAPONS[this.build.weaponId];
    this.nunchaku.x = this.player.x + weapon.reach;
    this.nunchaku.y = this.player.y;
    this.nunchaku.prevX = this.nunchaku.x;
    this.nunchaku.prevY = this.nunchaku.y;
    this.nunchaku.vx = 0;
    this.nunchaku.vy = 0;
    this.nunchaku.restLength = weapon.reach + this.totalReachBonus();
    this.nunchaku.maxLength = weapon.reach + 58 + this.totalReachBonus() + (this.rubber ? 18 : 0);
    this.nunchaku.headRadius = weapon.headRadius + this.sawStacks * 2 + this.equipmentMods.headRadiusBonus;
  }

  private updatePlayer(dt: number): void {
    const p = this.player;
    let targetVx = 0;
    let targetVy = 0;
    if (this.input.pointerActive) {
      p.targetX = this.input.pointerX;
      p.targetY = this.input.pointerY;
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 4) {
        targetVx = (dx / d) * (p.speed + this.totalSpeedBonus());
        targetVy = (dy / d) * (p.speed + this.totalSpeedBonus());
      }
    } else {
      const ix = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
      const iy = (this.input.down ? 1 : 0) - (this.input.up ? 1 : 0);
      const dir = normalize(ix, iy);
      if (ix || iy) {
        targetVx = dir.x * (p.speed + this.totalSpeedBonus());
        targetVy = dir.y * (p.speed + this.totalSpeedBonus());
      }
      p.targetX = p.x + targetVx * 0.2;
      p.targetY = p.y + targetVy * 0.2;
    }
    p.vx += (targetVx - p.vx) * clamp(dt * 12, 0, 1);
    p.vy += (targetVy - p.vy) * clamp(dt * 12, 0, 1);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    clampToWorld(p, p.radius);
    this.resolveObstacles(p, p.radius);
  }

  private updateNunchaku(dt: number): void {
    const p = this.player;
    const n = this.nunchaku;
    n.prevX = n.x;
    n.prevY = n.y;
    const weapon = WEAPONS[this.build.weaponId];
    const orbit = normalize(-p.vy * weapon.orbitMul + (n.x - p.x) * 0.1, p.vx * weapon.orbitMul + (n.y - p.y) * 0.1);
    const spinMul = 1 + this.totalSpinBonus() * 0.18 + (this.rageMultiplier() - 1) * 0.35;
    n.vx += orbit.x * 34 * spinMul * dt;
    n.vy += orbit.y * 34 * spinMul * dt;
    const radial = normalize(n.x - p.x, n.y - p.y);
    const tangent = { x: -radial.y, y: radial.x };
    const idleSpin = 42 + this.totalSpinBonus() * 26 + this.phantoms.length * 5;
    n.vx += tangent.x * idleSpin * dt;
    n.vy += tangent.y * idleSpin * dt;
    n.x += n.vx * dt;
    n.y += n.vy * dt;

    const dx = n.x - p.x;
    const dy = n.y - p.y;
    const dist = Math.max(0.001, Math.hypot(dx, dy));
    const rest = n.restLength;
    const maxLen = n.maxLength;
    const stretch = dist - rest;
    const dir = { x: dx / dist, y: dy / dist };
    if (dist > rest) {
      const pull = stretch * NUNCHAKU_BALANCE.spring;
      n.vx -= dir.x * pull * dt;
      n.vy -= dir.y * pull * dt;
    }
    if (dist > maxLen) {
      n.x = p.x + dir.x * maxLen;
      n.y = p.y + dir.y * maxLen;
      const outward = n.vx * dir.x + n.vy * dir.y;
      if (outward > 0) {
        n.vx -= dir.x * outward * 1.2;
        n.vy -= dir.y * outward * 1.2;
      }
    }
    n.vx = (n.vx + p.vx * 0.018) * NUNCHAKU_BALANCE.damping;
    n.vy = (n.vy + p.vy * 0.018) * NUNCHAKU_BALANCE.damping;
    clampToWorld(n, n.headRadius);
    this.resolveObstacles(n, n.headRadius);
    n.speed = Math.hypot(n.vx, n.vy);
    n.stretch = stretch;
    n.tension = clamp(stretch / Math.max(1, maxLen - rest), 0, 1);

    if (distance(p, n) < p.radius + n.headRadius + 1 && n.speed > NUNCHAKU_BALANCE.selfHitSpeed && n.selfHitCd <= 0 && !this.rubber) {
      this.damagePlayer(PLAYER_BALANCE.selfHitDamage, "SELF HIT");
      n.selfHitCd = 0.85;
    }
  }

  private updatePhantoms(dt: number): void {
    const p = this.player;
    const weapon = WEAPONS[this.build.weaponId];
    const spinMul = 1 + this.totalSpinBonus() * 0.2 + (this.rageMultiplier() - 1) * 0.38;
    for (const phantom of this.phantoms) {
      phantom.prevX = phantom.x;
      phantom.prevY = phantom.y;
      phantom.snapFlash = Math.max(0, phantom.snapFlash - dt * 2.8);
      const radial = normalize(phantom.x - p.x, phantom.y - p.y);
      const side = phantom.orbitSpeed >= 0 ? 1 : -1;
      const orbit = normalize(
        -p.vy * weapon.orbitMul + radial.x * 10 - radial.y * 2.4 * side,
        p.vx * weapon.orbitMul + radial.y * 10 + radial.x * 2.4 * side
      );
      phantom.vx += orbit.x * (28 + Math.abs(phantom.orbitSpeed) * 3.8) * spinMul * dt;
      phantom.vy += orbit.y * (28 + Math.abs(phantom.orbitSpeed) * 3.8) * spinMul * dt;
      const tangent = { x: -radial.y * side, y: radial.x * side };
      const idleSpin = 34 + this.totalSpinBonus() * 22 + this.phantoms.length * 4;
      phantom.vx += tangent.x * idleSpin * dt;
      phantom.vy += tangent.y * idleSpin * dt;
      phantom.x += phantom.vx * dt;
      phantom.y += phantom.vy * dt;

      const dx = phantom.x - p.x;
      const dy = phantom.y - p.y;
      const dist = Math.max(0.001, Math.hypot(dx, dy));
      const rest = phantom.restLength + this.totalReachBonus() * 0.28;
      const maxLen = phantom.maxLength + this.totalReachBonus() * 0.28 + (this.rubber ? 14 : 0);
      const dir = { x: dx / dist, y: dy / dist };
      const stretch = dist - rest;
      if (dist > rest) {
        const pull = stretch * NUNCHAKU_BALANCE.spring * 0.86;
        phantom.vx -= dir.x * pull * dt;
        phantom.vy -= dir.y * pull * dt;
      }
      if (dist > maxLen) {
        phantom.x = p.x + dir.x * maxLen;
        phantom.y = p.y + dir.y * maxLen;
        const outward = phantom.vx * dir.x + phantom.vy * dir.y;
        if (outward > 0) {
          phantom.vx -= dir.x * outward * 1.12;
          phantom.vy -= dir.y * outward * 1.12;
        }
      }
      phantom.vx = (phantom.vx + p.vx * 0.02) * NUNCHAKU_BALANCE.damping;
      phantom.vy = (phantom.vy + p.vy * 0.02) * NUNCHAKU_BALANCE.damping;
      clampToWorld(phantom, phantom.headRadius);
      this.resolveObstacles(phantom, phantom.headRadius);
      phantom.speed = Math.hypot(phantom.vx, phantom.vy);
      phantom.stretch = stretch;
      phantom.tension = clamp(stretch / Math.max(1, maxLen - rest), 0, 1);
      if (phantom.speed > 1) phantom.angle = Math.atan2(phantom.vy, phantom.vx);
    }
  }

  private updateEnemies(dt: number): void {
    const p = this.player;
    for (const enemy of this.enemies) {
      enemy.hitCd = Math.max(0, enemy.hitCd - dt);
      enemy.touchCd = Math.max(0, enemy.touchCd - dt);
      enemy.attackCd = Math.max(0, enemy.attackCd - dt);
      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      let desiredX = dx / dist;
      let desiredY = dy / dist;
      if (enemy.role === "zoner" && dist < 120) {
        desiredX *= -0.8;
        desiredY *= -0.8;
      }
      if (enemy.boss && enemy.attackCd <= 0) {
        this.spawnBossWarning(enemy);
        enemy.attackCd = enemy.phase >= 3 ? 3.2 : 4.8;
      }
      const separation = this.enemySeparation(enemy);
      desiredX += separation.x * 1.45;
      desiredY += separation.y * 1.45;
      const desired = normalize(desiredX, desiredY);
      desiredX = desired.x;
      desiredY = desired.y;
      const gravityStacks = this.totalGravityStacks();
      if (gravityStacks > 0) {
        const pull = normalize(this.nunchaku.x - enemy.x, this.nunchaku.y - enemy.y);
        enemy.vx += pull.x * (18 + gravityStacks * 12) * dt;
        enemy.vy += pull.y * (18 + gravityStacks * 12) * dt;
      }
      const slowMul = clamp(1 - this.enemySlowBonus - this.frostStacks * 0.035, 0.52, 1);
      enemy.vx += (desiredX * enemy.speed * this.directorBias * slowMul - enemy.vx) * clamp(dt * 3.6, 0, 1);
      enemy.vy += (desiredY * enemy.speed * this.directorBias * slowMul - enemy.vy) * clamp(dt * 3.6, 0, 1);
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      clampToWorld(enemy, enemy.radius);
      this.resolveObstacles(enemy, enemy.radius);

      this.tryWeaponHit(enemy, this.nunchaku.prevX, this.nunchaku.prevY, this.nunchaku.x, this.nunchaku.y, this.nunchaku.headRadius, this.nunchaku.speed, 1, COLORS.nunchaku);
      for (const phantom of this.phantoms) {
        this.tryWeaponHit(enemy, phantom.prevX, phantom.prevY, phantom.x, phantom.y, phantom.headRadius, phantom.speed, 0.62, phantom.color);
      }

      if (distance(p, enemy) < p.radius + enemy.radius && enemy.touchCd <= 0) {
        const away = normalize(enemy.x - p.x, enemy.y - p.y);
        const reflectStacks = this.totalReflectStacks();
        enemy.x += away.x * (10 + reflectStacks * 4);
        enemy.y += away.y * (10 + reflectStacks * 4);
        enemy.vx += away.x * 72;
        enemy.vy += away.y * 72;
        enemy.hp -= 5 + reflectStacks * 10 + this.equipmentMods.thorns;
        this.damagePlayer(enemy.damage * (enemy.boss ? 1.2 : 1), enemy.boss ? "BOSS HIT" : "HIT");
        enemy.touchCd = 0.62;
      }
      if (enemy.boss) {
        const hpRate = enemy.hp / Math.max(1, enemy.maxHp);
        enemy.phase = hpRate < 0.34 ? 3 : hpRate < 0.68 ? 2 : 1;
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      if (this.enemies[i].hp <= 0) {
        this.killEnemy(this.enemies[i]);
        this.enemies.splice(i, 1);
      }
    }
  }

  private tryWeaponHit(enemy: EnemyState, x1: number, y1: number, x2: number, y2: number, radius: number, speed: number, sourceMul: number, color: number): void {
    const hitDist = distancePointToSegment(enemy.x, enemy.y, x1, y1, x2, y2);
    if (hitDist >= enemy.radius + radius || enemy.hitCd > 0) return;
    const snapBonus = this.nunchaku.snapFlash > 0 ? 1.45 : 1;
    const overdriveHit = this.overdrive && speed > NUNCHAKU_BALANCE.overdriveSparkSpeed;
    const overdriveBonus = overdriveHit ? NUNCHAKU_BALANCE.overdriveDamageMul : 1;
    const sawBonus = 1 + this.sawStacks * 0.1 + this.equipmentMods.headRadiusBonus * 0.025;
    let damageMultiplier = this.totalDamageMul() * snapBonus * overdriveBonus * sourceMul * sawBonus * this.rageMultiplier();
    if (enemy.boss) damageMultiplier *= 1 + this.bossDamageBonus + this.equipmentMods.bossDamage;
    if (enemy.elite) damageMultiplier *= 1 + this.eliteDamageBonus + this.equipmentMods.eliteDamage;
    const executeThreshold = clamp(this.executeThresholdBonus + this.equipmentMods.executeThreshold, 0, 0.32);
    if (executeThreshold > 0 && enemy.hp / Math.max(1, enemy.maxHp) < executeThreshold) damageMultiplier *= 1.65;
    let damage = (NUNCHAKU_BALANCE.baseDamage + speed * NUNCHAKU_BALANCE.speedDamage) * damageMultiplier;
    const critChance = this.totalCritChance();
    if (critChance > 0 && this.rng.chance(critChance)) {
      damage *= 1.55 + this.totalCritDamage();
      damageMultiplier *= 1.55 + this.totalCritDamage();
      this.pushFloat("CRIT", enemy.x, enemy.y - enemy.radius - 20, COLORS.legendary, 10);
    }
    this.lastHitDamageMultiplier = damageMultiplier;
    this.lastHitDamage = damage;
    enemy.hp -= damage;
    if (this.scorchStacks > 0) enemy.hp -= (4 + this.scorchStacks * 3) * this.totalDamageMul();
    if (this.toxicStacks > 0) enemy.hp -= Math.min(enemy.maxHp * (0.012 + this.toxicStacks * 0.008), 42);
    if (this.frostStacks > 0) {
      enemy.vx *= 0.68;
      enemy.vy *= 0.68;
    }
    const heal = this.lifeOnHit + this.equipmentMods.lifeOnHit;
    if (heal > 0) this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
    enemy.hitCd = 0.12;
    this.spawnSparks(enemy.x, enemy.y, enemy.boss ? COLORS.boss : color, enemy.boss ? 8 : 4);
    if (overdriveHit) {
      this.spawnSparks(enemy.x, enemy.y, COLORS.legendary, enemy.boss ? 10 : 7);
      this.pushFloat("OD", enemy.x, enemy.y - enemy.radius - 18, COLORS.legendary, 10);
    }
    const chainStacks = this.totalChainStacks();
    if (chainStacks > 0) this.applyChainHit(enemy, damage * (0.28 + chainStacks * 0.08));
    if (damage > 48) this.pushFloat(String(Math.round(damage)), enemy.x, enemy.y - enemy.radius - 8, COLORS.legendary, 10);
  }

  private applyChainHit(source: EnemyState, damage: number): void {
    const chainStacks = this.totalChainStacks();
    const jumps = Math.min(7, chainStacks);
    let current = source;
    const hit = new Set<number>([source.id]);
    for (let i = 0; i < jumps; i += 1) {
      const next = this.enemies
        .filter((enemy) => !hit.has(enemy.id) && enemy.hp > 0 && distance(enemy, current) < 92 + chainStacks * 14)
        .sort((a, b) => distance(a, current) - distance(b, current))[0];
      if (!next) return;
      hit.add(next.id);
      next.hp -= damage;
      next.hitCd = Math.max(next.hitCd, 0.08);
      this.spawnSparks(next.x, next.y, COLORS.gift, 5);
      current = next;
      damage *= 0.72;
    }
  }

  private applyShockwave(x: number, y: number): void {
    const shockwaveStacks = this.totalShockwaveStacks();
    const radius = 54 + shockwaveStacks * 20;
    const damage = (22 + shockwaveStacks * 13) * this.totalDamageMul() * this.rageMultiplier();
    for (const enemy of this.enemies) {
      const d = Math.max(1, distance(enemy, { x, y }));
      if (d > radius + enemy.radius) continue;
      enemy.hp -= damage * (1 - d / (radius + enemy.radius)) + damage * 0.35;
      enemy.hitCd = Math.max(enemy.hitCd, 0.08);
      this.spawnSparks(enemy.x, enemy.y, COLORS.gift, 6);
    }
    this.pushFloat("SHOCK", x, y - 28, COLORS.gift, 12);
  }

  private updateDrops(dt: number): void {
    const p = this.player;
    const gravityStacks = this.totalGravityStacks();
    const gravityPull = gravityStacks > 0 && this.waveState !== "reward";
    let gravityTarget = { x: this.nunchaku.x, y: this.nunchaku.y };
    for (const phantom of this.phantoms) {
      if (distance(p, phantom) < distance(p, gravityTarget)) gravityTarget = { x: phantom.x, y: phantom.y };
    }
    const pullRange = DROP_BALANCE.xpPullRange + this.totalPickupBonus() + (this.magnet ? 60 : 0) + gravityStacks * 18;
    for (const drop of this.drops) {
      const target = gravityPull ? gravityTarget : p;
      const d = distance(target, drop);
      const waveCollect = this.waveState === "reward";
      if (waveCollect || d < pullRange) {
        const dir = normalize(target.x - drop.x, target.y - drop.y);
        const speed = waveCollect ? 380 : gravityPull ? 170 + gravityStacks * 20 : drop.kind === "legendary" ? 185 : 145;
        drop.x += dir.x * speed * dt;
        drop.y += dir.y * speed * dt;
      }
    }
    if (this.waveState !== "reward") return;
    for (let i = this.drops.length - 1; i >= 0; i -= 1) {
      const drop = this.drops[i];
      if (distance(p, drop) < p.radius + drop.radius + 4) {
        this.collectDrop(drop);
        this.drops.splice(i, 1);
        if (this.pauseMode) return;
      }
    }
    if (!this.drops.length && this.pauseMode === null) this.processPostRewardFlow();
  }

  private updateObstacles(dt: number): void {
    for (const obstacle of this.obstacles) {
      obstacle.life -= dt;
    }
    this.obstacles = this.obstacles.filter((obstacle) => obstacle.life > 0);
  }

  private updateSpawning(dt: number): void {
    if (this.waveState === "reward") return;
    if (!this.options.bossDebug && this.wave >= this.nextBossWave) return;
    if (this.waveSpawned >= this.waveTarget) {
      this.waveState = "fighting";
      return;
    }
    if (this.enemies.length >= this.enemyCap()) return;
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    const debugBoss = this.options.bossDebug && this.hasBoss();
    const pressure = clamp(this.wave * (debugBoss ? 0.035 : 0.06) + this.economy.giftCount * 0.04, 0, 1.6);
    const waveBurst = !debugBoss && this.wave >= 5 && this.rng.chance(0.28) ? 1 : 0;
    const earlyBurst = 0;
    const count = Math.min(this.enemyCap() - this.enemies.length, this.waveTarget - this.waveSpawned, 1 + earlyBurst + waveBurst);
    for (let i = 0; i < count; i += 1) {
      this.spawnEnemy(this.rng.chance(0.04 + pressure * 0.03), true);
    }
    const minSpawn = debugBoss ? 0.62 : DIRECTOR_BALANCE.spawnMin;
    const maxSpawn = debugBoss ? 1.55 : 1.1;
    const baseSpawn = DIRECTOR_BALANCE.spawnStart + (debugBoss ? 0.58 : 0);
    this.spawnTimer = clamp(baseSpawn - this.wave * 0.045 - this.directorBias * 0.18, minSpawn, maxSpawn);
  }

  private checkWaveClear(dt: number): void {
    if (this.waveState === "reward") return;
    if (this.hasBoss()) return;
    if (this.waveSpawned < this.waveTarget || this.enemies.length > 0) return;
    this.waveIntermissionTimer += dt;
    if (this.waveIntermissionTimer < WORLD.waveIntermission) return;
    this.waveState = "reward";
    this.waveClearCount += 1;
    this.waveIntermissionTimer = 0;
    this.player.invuln = Math.max(this.player.invuln, 1.2);
    this.pullAllDropsToPlayer();
    this.pushFloat(`WAVE ${this.wave} CLEAR`, WORLD.width * 0.5, 78, COLORS.legendary, 16);
    if (!this.drops.length) this.processPostRewardFlow();
  }

  private processPostRewardFlow(): void {
    if (this.mode !== "running" || this.pauseMode !== null || this.waveState !== "reward") return;
    if (this.drops.length > 0) return;
    if (this.player.xp >= this.player.nextXp) {
      this.player.xp -= this.player.nextXp;
      this.player.level += 1;
      this.player.nextXp = this.nextLevelXp();
      this.openLevelUp();
      return;
    }
    if (this.wave >= this.nextMutationWave && !this.hasBoss()) {
      this.openMutation();
      return;
    }
    this.startWave(this.wave + 1);
  }

  private startWave(nextWave: number): void {
    this.wave = nextWave;
    this.waveState = "spawning";
    this.waveTarget = this.computeWaveTarget(nextWave);
    this.waveSpawned = 0;
    this.waveKills = 0;
    this.waveIntermissionTimer = 0;
    if (this.liveQueue.length) this.liveQueueReleaseTimer = Math.max(this.liveQueueReleaseTimer, UI_TIMERS.liveQueueReleaseDelay);
    this.spawnTimer = 0.42;
    this.player.nextXp = Math.max(this.player.nextXp, this.waveXpRequirement());
    if (this.wave >= this.nextBossWave) {
      this.waveTarget = 0;
      this.waveState = "fighting";
      this.spawnBoss();
    } else {
      this.pushFloat(`WAVE ${this.wave}`, WORLD.width * 0.5, 82, COLORS.gift, 15);
    }
  }

  private computeWaveTarget(wave: number): number {
    return Math.round(clamp(WORLD.baseWaveTarget + (wave - 1) * WORLD.waveTargetGrowth + Math.floor(wave / 8), WORLD.baseWaveTarget, 92));
  }

  private waveXpRequirement(): number {
    return Math.round(24 + this.wave * 6 + this.player.level * 10);
  }

  private nextLevelXp(): number {
    return Math.round(this.waveXpRequirement() + this.player.level * 20 + this.wave * 6);
  }

  private pullAllDropsToPlayer(): void {
    for (const drop of this.drops) {
      drop.x += (this.player.x - drop.x) * 0.35;
      drop.y += (this.player.y - drop.y) * 0.35;
    }
  }

  private updateDirector(dt: number): void {
    const crowd = this.enemies.length / Math.max(1, this.enemyCap());
    const hpStress = 1 - this.player.hp / Math.max(1, this.player.maxHp);
    const target = crowd * 82 + hpStress * 54 + (this.hasBoss() ? 26 : 0) + this.obstacles.length * 6;
    if (target > DIRECTOR_BALANCE.threatRecoverAt) this.directorBias -= dt * 0.14;
    else if (target < DIRECTOR_BALANCE.threatHuntAt) this.directorBias += dt * 0.08;
    this.directorBias = clamp(this.directorBias, 0.72, 1.82);
  }

  private updateObjective(dt: number): void {
    if (!this.objective && this.time >= this.nextObjectiveAt) {
      const type = this.rng.pick(["kill", "no_hit", "snap"] as const);
      this.objective =
        type === "kill"
          ? { type, label: "20秒で10体撃破", progress: 0, target: 10, timer: 20, success: false }
          : type === "no_hit"
            ? { type, label: "16秒ノーダメージ", progress: 0, target: 16, timer: 16, success: false }
            : { type, label: "スナップ4回", progress: 0, target: 4, timer: 24, success: false };
      this.pushFloat("CONTRACT", WORLD.width * 0.5, 72, COLORS.gift, 14);
    }
    if (!this.objective) return;
    this.objective.timer -= dt;
    if (this.objective.type === "no_hit") {
      this.objective.progress = this.objective.target - Math.max(0, this.objective.timer);
    }
    if (this.objective.progress >= this.objective.target) {
      this.completeObjective();
    } else if (this.objective.timer <= 0) {
      this.objective = null;
      this.nextObjectiveAt = this.time + 18;
    }
  }

  private updateEffects(dt: number): void {
    this.shake = Math.max(0, this.shake - dt * 12);
    this.flash = Math.max(0, this.flash - dt * 2.8);
    if (this.giftEvent.timer > 0) {
      this.giftEvent.timer = Math.max(0, this.giftEvent.timer - dt);
      if (this.giftEvent.timer <= 0) this.giftEvent = idleGiftEvent();
    }
    this.updateAds(dt);
    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);
    for (const text of this.floatTexts) {
      text.y -= dt * 22;
      text.life -= dt;
    }
    this.floatTexts = this.floatTexts.filter((text) => text.life > 0);
  }

  private stepLevelTimer(dt: number): void {
    if (UI_TIMERS.levelAutoPick <= 0) return;
    const choice = this.levelChoices[0];
    const timer = Number((this.levelChoices as unknown as { autoTimer?: number }).autoTimer ?? UI_TIMERS.levelAutoPick);
    const next = Math.max(0, timer - dt);
    (this.levelChoices as unknown as { autoTimer: number }).autoTimer = next;
    if (next <= 0 && choice) this.chooseLevel(0);
  }

  private stepPickupTimer(dt: number): void {
    if (!this.pickupCompare) return;
    if (UI_TIMERS.pickupAutoDiscard <= 0) return;
    this.pickupCompare.timer = Math.max(0, this.pickupCompare.timer - dt);
    if (this.pickupCompare.timer <= 0) this.resolvePickup(false);
  }

  private updateThreat(): void {
    const hpStress = 1 - this.player.hp / Math.max(1, this.player.maxHp);
    this.threatScore = clamp(
      this.enemies.length * 3.2 + hpStress * 72 + (this.hasBoss() ? 32 : 0) + this.obstacles.length * 5 + this.directorBias * 12,
      0,
      199
    );
  }

  private updateScore(): void {
    this.score = this.getScorePreview();
  }

  private applySkill(skillId: SkillId, source: "skill" | "mutation" = "skill"): void {
    if (source === "mutation") this.acquiredMutations.add(skillId);
    else this.acquiredSkills.push(skillId);
    this.skillStacks[skillId] = (this.skillStacks[skillId] || 0) + 1;
    const def = [...LEVEL_SKILLS, ...MUTATIONS].find((skill) => skill.id === skillId);
    for (const effect of def?.effects || []) {
      if (effect.kind === "damageMul") this.damageMul *= effect.value;
      if (effect.kind === "speedBonus") this.speedBonus += effect.value;
      if (effect.kind === "reachBonus") this.reachBonus += effect.value;
      if (effect.kind === "snapCdMul") this.snapCdMul *= effect.value;
      if (effect.kind === "pickupBonus") this.pickupBonus += effect.value;
      if (effect.kind === "maxHp") {
        this.player.maxHp += effect.value;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + effect.value + 8);
      }
      if (effect.kind === "clone") for (let i = 0; i < effect.value; i += 1) this.addPhantomNunchaku();
      if (effect.kind === "spin") this.spinBonus += effect.value;
      if (effect.kind === "reflect") this.reflectStacks += effect.value;
      if (effect.kind === "shockwave") this.shockwaveStacks += effect.value;
      if (effect.kind === "chain") this.chainStacks += effect.value;
      if (effect.kind === "saw") this.sawStacks += effect.value;
      if (effect.kind === "gravity") this.gravityStacks += effect.value;
      if (effect.kind === "bleed") this.bleedStacks += effect.value;
      if (effect.kind === "critChance") this.critChanceBonus += effect.value;
      if (effect.kind === "critDamage") this.critDamageBonus += effect.value;
      if (effect.kind === "execute") this.executeThresholdBonus += effect.value;
      if (effect.kind === "lifesteal") this.lifeOnHit += effect.value;
      if (effect.kind === "enemySlow") this.enemySlowBonus += effect.value;
      if (effect.kind === "scorch") this.scorchStacks += effect.value;
      if (effect.kind === "toxic") this.toxicStacks += effect.value;
      if (effect.kind === "frost") this.frostStacks += effect.value;
      if (effect.kind === "bossDamage") this.bossDamageBonus += effect.value;
      if (effect.kind === "eliteDamage") this.eliteDamageBonus += effect.value;
      if (effect.kind === "xpMul") this.xpMul *= effect.value;
      if (effect.kind === "dropLuck") this.dropLuckBonus += effect.value;
      if (effect.kind === "damageReduction") this.damageReductionBonus += effect.value;
      if (effect.kind === "scoreMul") this.scoreMul *= effect.value;
      if (effect.kind === "snapImpulse") this.snapImpulseBonus += effect.value;
    }
    if (def?.effects.some((effect) => effect.kind === "reachBonus" || effect.kind === "saw")) {
      this.resetNunchaku();
      for (const phantom of this.phantoms) phantom.headRadius = this.nunchaku.headRadius;
    }
    if (skillId === "overdrive") this.overdrive = true;
    if (skillId === "rubber") {
      this.rubber = true;
      this.resetNunchaku();
    }
    if (skillId === "bulwark") this.bulwark = true;
    if (skillId === "magnet") this.magnet = true;
    const label = def?.name || skillId;
    this.pushFloat(label, this.player.x, this.player.y - 38, COLORS.legendary, 12);
  }

  private addPhantomNunchaku(source: "skill" | "equipment" = "skill"): void {
    const index = this.phantoms.length;
    const angle = (Math.PI * 2 * index) / Math.max(1, index + 1) + this.rng.range(-0.35, 0.35);
    const radius = 58 + (index % 3) * 18;
    this.phantoms.push({
      x: this.player.x + Math.cos(angle) * radius,
      y: this.player.y + Math.sin(angle) * radius,
      prevX: this.player.x + Math.cos(angle) * radius,
      prevY: this.player.y + Math.sin(angle) * radius,
      vx: -Math.sin(angle) * 88 + this.rng.range(-18, 18),
      vy: Math.cos(angle) * 88 + this.rng.range(-18, 18),
      angle,
      orbitRadius: radius,
      orbitSpeed: (index % 2 === 0 ? 2.8 : -3.2) + this.rng.range(-0.3, 0.3),
      restLength: radius,
      maxLength: radius + 54,
      headRadius: this.nunchaku.headRadius,
      speed: 0,
      tension: 0,
      stretch: 0,
      snapFlash: 0,
      color: index % 2 === 0 ? COLORS.gift : COLORS.legendary,
      source,
    });
  }

  private rageMultiplier(): number {
    const bleedStacks = this.totalBleedStacks();
    if (bleedStacks <= 0) return 1;
    const hpStress = 1 - this.player.hp / Math.max(1, this.player.maxHp);
    return 1 + clamp(hpStress, 0, 1) * (0.34 + bleedStacks * 0.18);
  }

  private openLevelUp(): void {
    const pool = [...LEVEL_SKILLS];
    this.levelChoices = [];
    for (let i = 0; i < 3; i += 1) {
      const picked = pool.splice(this.rng.int(0, pool.length - 1), 1)[0];
      if (picked) this.levelChoices.push(picked);
    }
    (this.levelChoices as unknown as { autoTimer: number }).autoTimer = UI_TIMERS.levelAutoPick;
    this.pauseMode = "levelup";
  }

  private openMutation(): void {
    const pool = MUTATIONS.filter((mutation) => !this.acquiredMutations.has(mutation.id));
    if (!pool.length) {
      this.nextMutationWave += WORLD.mutationWave;
      return;
    }
    this.mutationChoices = [];
    for (let i = 0; i < 2 && pool.length > 0; i += 1) {
      const picked = pool.splice(this.rng.int(0, pool.length - 1), 1)[0];
      if (picked) this.mutationChoices.push(picked);
    }
    this.pauseMode = "mutation";
  }

  private completeObjective(): void {
    if (!this.objective) return;
    this.pushFloat("CONTRACT CLEAR", WORLD.width * 0.5, 72, COLORS.legendary, 14);
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 26);
    this.economy.demoEnergy = Math.min(160, this.economy.demoEnergy + 8);
    if (this.rng.chance(0.28)) this.spawnDrop(this.player.x + this.rng.range(-80, 80), this.player.y + this.rng.range(-44, 44), "legendary");
    this.objective = null;
    this.nextObjectiveAt = this.time + 21;
  }

  private spawnEnemy(elite: boolean, countForWave = false): void {
    const role = this.pickEnemyRole();
    const def = ENEMIES[role];
    const side = this.rng.int(0, 3);
    const pos =
      side === 0
        ? { x: -18, y: this.rng.range(22, WORLD.height - 22) }
        : side === 1
          ? { x: WORLD.width + 18, y: this.rng.range(22, WORLD.height - 22) }
          : side === 2
            ? { x: this.rng.range(22, WORLD.width - 22), y: -18 }
            : { x: this.rng.range(22, WORLD.width - 22), y: WORLD.height + 18 };
    const waveMul = 1 + (this.wave - 1) * 0.12;
    const debugBoss = this.options.bossDebug && this.hasBoss();
    const earlyWaveMul = this.wave <= 2 ? 0.72 : 1;
    this.enemies.push({
      id: this.idSeq++,
      role,
      name: def.name,
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      hp: def.hp * waveMul * (elite ? 1.9 : 1),
      maxHp: def.hp * waveMul * (elite ? 1.9 : 1),
      radius: def.radius + (elite ? 3 : 0),
      speed: def.speed * (elite ? 1.07 : 1) * (debugBoss ? 0.9 : 1) * (this.wave <= 2 ? 0.9 : 1),
      damage: def.damage * waveMul * (elite ? 1.25 : 1) * (debugBoss ? 0.48 : 1) * earlyWaveMul,
      score: def.score * (elite ? 2 : 1),
      color: def.color,
      elite,
      boss: false,
      phase: 0,
      hitCd: 0,
      touchCd: 0,
      attackCd: this.rng.range(2, 5),
    });
    if (countForWave) this.waveSpawned += 1;
  }

  private spawnEnemyPack(count: number, eliteChance: number): void {
    for (let i = 0; i < count; i += 1) this.spawnEnemy(this.rng.chance(eliteChance), false);
  }

  private spawnBoss(): void {
    const bossId = this.rng.pick(BOSS_ORDER);
    const def = BOSSES[bossId];
    const loopMul = 1 + Math.max(0, this.bossKills) * 0.48 + Math.max(0, this.wave - WORLD.bossWave) * 0.035;
    const balanceMul = (this.options.balanceProfile === "B" ? 0.92 : 1) * (this.options.bossDebug ? 0.68 : 1) * loopMul;
    this.enemies.push({
      id: this.idSeq++,
      role: "bruiser",
      name: def.name,
      x: WORLD.width * 0.5,
      y: WORLD.layout === "portrait" ? (this.options.bossDebug ? 118 : 96) : this.options.bossDebug ? 78 : 54,
      vx: 0,
      vy: 0,
      hp: def.hp * balanceMul,
      maxHp: def.hp * balanceMul,
      radius: def.radius,
      speed: def.speed * (this.options.bossDebug ? 0.86 : 1) * (1 + this.bossKills * 0.05),
      damage: def.damage * (this.options.bossDebug ? 0.56 : 1) * (1 + this.bossKills * 0.22),
      score: 1600 * (1 + this.bossKills),
      color: def.color,
      elite: true,
      boss: true,
      bossId,
      phase: 1,
      hitCd: 0,
      touchCd: 0,
      attackCd: this.options.bossDebug ? 4.6 : 2.2,
    });
    this.pushFloat(`${def.title} ${def.name}`, WORLD.width * 0.5, 64, COLORS.boss, 16);
    this.shake = Math.max(this.shake, 8);
  }

  private spawnBossWarning(enemy: EnemyState): void {
    const count = enemy.phase >= 3 ? 3 : 2;
    for (let i = 0; i < count; i += 1) {
      const angle = this.rng.range(0, Math.PI * 2);
      const dist = this.rng.range(48, 124);
      this.addObstacle({
        x: clamp(this.player.x + Math.cos(angle) * dist, 42, WORLD.width - 42),
        y: clamp(this.player.y + Math.sin(angle) * dist, 42, WORLD.height - 42),
        w: this.rng.range(34, 58),
        h: this.rng.range(16, 30),
        life: 4.8,
      });
    }
    this.pushFloat(enemy.phase >= 3 ? "OMEGA SLAM" : "SLAM", enemy.x, enemy.y - enemy.radius - 18, COLORS.danger, 12);
  }

  private killEnemy(enemy: EnemyState): void {
    this.kills += 1;
    if (!enemy.boss) this.waveKills += 1;
    if (this.objective?.type === "kill") this.objective.progress += 1;
    if (this.objective?.type === "snap" && this.nunchaku.snapFlash > 0) this.objective.progress += 1;
    this.spawnDrop(enemy.x, enemy.y, "xp", Math.round((enemy.boss ? 28 : enemy.elite ? 16 : 9 + Math.floor(this.wave * 0.8)) * this.totalXpMul()));
    if (enemy.boss) {
      this.bossDefeated = true;
      this.bossKills += 1;
      this.nextBossWave = this.wave + WORLD.bossInterval;
      this.waveKills = this.waveTarget;
      this.spawnDrop(enemy.x, enemy.y, "legendary");
      this.saveScoreCheckpoint("BOSS_CLEAR", true);
      this.pushFloat(`BOSS ${this.bossKills} CLEAR`, WORLD.width * 0.5, 82, COLORS.legendary, 16);
      this.player.invuln = Math.max(this.player.invuln, 1.5);
      return;
    }
    const legendaryDue = this.time - this.lastLegendaryAt > DROP_BALANCE.legendaryPitySeconds;
    const dropLuck = this.totalDropLuck();
    if (this.rng.chance(DROP_BALANCE.legendaryChance + dropLuck * 0.025 + (legendaryDue ? 0.08 : 0))) {
      this.spawnDrop(enemy.x, enemy.y, "legendary");
      this.lastLegendaryAt = this.time;
    } else if (this.rng.chance(DROP_BALANCE.itemChance + dropLuck + (enemy.elite ? 0.1 : 0))) {
      this.spawnDrop(enemy.x, enemy.y, "item");
    }
  }

  private spawnDrop(x: number, y: number, kind: "xp" | "item" | "legendary", value = 1): void {
    const id = this.idSeq++;
    if (kind === "xp") {
      const radius = 4;
      const pos = { x, y };
      clampToWorld(pos, radius);
      this.drops.push({ id, kind, x: pos.x, y: pos.y, radius, value, color: 0x91f7ff, name: "XP" });
    } else {
      const item = rollEquipmentItem(this.rng, this.wave, kind === "legendary" ? "legendary" : undefined);
      const radius = kind === "legendary" ? 8 : 6;
      const pos = { x, y };
      clampToWorld(pos, radius);
      this.drops.push({
        id,
        kind,
        x: pos.x,
        y: pos.y,
        radius,
        value: item.power,
        color: item.color,
        name: item.name,
        rarity: item.rarity,
        power: item.power,
        item,
        slot: item.slot,
      });
    }
  }

  private collectDrop(drop: DropState): void {
    if (drop.kind === "xp") {
      this.player.xp += drop.value;
      return;
    }
    if (drop.item && (drop.item.rarity === "legendary" || drop.item.rarity === "ancient")) {
      this.economy.legendary += 1;
      this.pushFloat(drop.item.rarity === "ancient" ? "ANCIENT" : "LEGENDARY", drop.x, drop.y - 16, drop.color, 16);
      this.flash = Math.max(this.flash, this.settings.flashFx ? 0.22 : 0);
      this.flashColor = drop.color;
      this.shake = Math.max(this.shake, this.settings.shakeFx ? 7 : 0);
    }
    const slot = drop.item?.slot || drop.slot || "nunchaku";
    const currentItem = this.equippedItems[slot];
    this.pickupCompare = {
      item: drop,
      slot,
      timer: UI_TIMERS.pickupAutoDiscard,
      currentPower: currentItem?.power || 0,
      currentItem,
    };
    this.pauseMode = "pickup_compare";
  }

  private damagePlayer(amount: number, label: string): void {
    if (this.player.invuln > 0) return;
    const debugMul = this.options.bossDebug ? 0.72 : 1;
    const capRatio = this.options.bossDebug ? 0.085 : PLAYER_BALANCE.touchDamageCapRatio;
    const cap = this.player.maxHp * capRatio;
    const damage = Math.min(cap, amount * (this.bulwark ? 0.72 : 1) * (1 - this.totalDamageReduction()) * debugMul);
    this.player.hp -= damage;
    this.player.hitsTaken += 1;
    this.player.invuln = this.options.bossDebug ? Math.max(1.05, PLAYER_BALANCE.invulnAfterHit) : PLAYER_BALANCE.invulnAfterHit;
    if (this.objective?.type === "no_hit") this.objective = null;
    this.pushFloat(`${label} -${Math.round(damage)}`, this.player.x, this.player.y - 24, COLORS.danger, 11);
    const reflectStacks = this.totalReflectStacks();
    if (reflectStacks > 0) {
      const radius = 56 + reflectStacks * 18;
      const reflected = damage * (1.8 + reflectStacks * 0.7) + this.equipmentMods.thorns;
      for (const enemy of this.enemies) {
        if (distance(enemy, this.player) > radius + enemy.radius) continue;
        enemy.hp -= reflected;
        enemy.hitCd = Math.max(enemy.hitCd, 0.08);
        this.spawnSparks(enemy.x, enemy.y, COLORS.danger, 5);
      }
      this.pushFloat("REFLECT", this.player.x, this.player.y - 40, COLORS.danger, 12);
    }
    this.shake = Math.max(this.shake, this.settings.shakeFx ? 5 : 0);
    this.flash = Math.max(this.flash, this.settings.flashFx ? 0.12 : 0);
    this.flashColor = COLORS.danger;
  }

  private applyGift(diamonds: number, source: string): void {
    const safeDiamonds = Math.max(1, Math.round(diamonds));
    const kinds: GiftKind[] = ["assault", "treasure", "wall", "surge"];
    const kind = this.rng.pick(kinds);
    const gift = GIFTS[kind];
    this.economy.giftDiamonds += safeDiamonds;
    this.economy.giftValue += safeDiamonds;
    this.economy.giftCount += 1;
    this.giftEvent = {
      kind,
      name: gift.name,
      risk: gift.risk,
      reward: gift.reward,
      timer: UI_TIMERS.giftBanner,
      source,
    };
    const tier = clamp(Math.round(Math.log2(safeDiamonds + 2)), 1, 8);
    if (kind === "assault") {
      this.spawnEnemyPack(2 + tier, 0.18 + tier * 0.02);
    } else if (kind === "treasure") {
      for (let i = 0; i < 1 + Math.ceil(tier / 2); i += 1) this.spawnDrop(this.rng.range(52, WORLD.width - 52), this.rng.range(52, WORLD.height - 52), this.rng.chance(0.18) ? "legendary" : "item");
    } else if (kind === "wall") {
      for (let i = 0; i < 2 + Math.floor(tier / 2); i += 1) {
        this.addObstacle({
          x: this.rng.range(72, WORLD.width - 72),
          y: this.rng.range(68, WORLD.height - 52),
          w: this.rng.range(34, 72),
          h: this.rng.range(14, 34),
          life: this.rng.range(9, 16),
        });
      }
    } else {
      this.nunchaku.snapCd = 0;
      this.player.invuln = Math.max(this.player.invuln, 0.7);
      this.spawnEnemyPack(1 + Math.floor(tier / 2), 0.24);
    }
    this.enqueueGiftAd(safeDiamonds, source, tier);
    this.pushFloat(`${gift.name} +${safeDiamonds}D`, this.player.x, this.player.y - 42, COLORS.gift, 13);
  }

  private enqueueGiftAd(diamonds: number, source: string, tier: number): void {
    const ad = this.pickGiftAd(tier);
    this.selectedAdId = ad.id;
    const entry: AdQueueState = {
      id: ad.id,
      source,
      diamonds,
      tier,
      queuedAt: this.time,
    };
    if (this.activeAds.length < this.activeAdLimit()) {
      this.spawnQueuedAd(entry);
      return;
    }
    this.adQueue.push(entry);
    if (this.adQueue.length > 8) this.adQueue.shift();
  }

  private pickGiftAd(tier: number): AdDef {
    const eligible = AD_CATALOG.filter((ad) => ad.minWave <= this.wave);
    const pool = eligible.length ? eligible : [...AD_CATALOG];
    const total = pool.reduce((sum, ad) => {
      const tierBoost = ad.type === "video" ? 1 + tier * 0.08 : 1;
      return sum + Math.max(0.01, ad.weight * tierBoost);
    }, 0);
    let roll = this.rng.next() * total;
    for (const ad of pool) {
      const tierBoost = ad.type === "video" ? 1 + tier * 0.08 : 1;
      roll -= Math.max(0.01, ad.weight * tierBoost);
      if (roll <= 0) return ad;
    }
    return pool[pool.length - 1] || AD_CATALOG[0];
  }

  private updateAds(dt: number): void {
    for (const ad of this.activeAds) {
      ad.life -= dt;
      ad.phase += dt;
      ad.x += ad.speed * dt;
    }
    this.activeAds = this.activeAds.filter((ad) => ad.life > 0 && (ad.speed >= 0 ? ad.x - ad.w / 2 < WORLD.width + 34 : ad.x + ad.w / 2 > -34));
    while (this.adQueue.length > 0 && this.activeAds.length < this.activeAdLimit()) {
      const entry = this.adQueue.shift();
      if (entry) this.spawnQueuedAd(entry);
    }
  }

  private spawnQueuedAd(entry: AdQueueState): void {
    const def = AD_CATALOG.find((ad) => ad.id === entry.id) || AD_CATALOG[0];
    const lane = this.resolveAdLane(def);
    const speedJitter = 0.88 + this.rng.next() * 0.24;
    const tierSpeed = 1 + clamp(entry.tier, 1, 8) * 0.015;
    const w = def.type === "video" ? this.rng.range(148, 190) : this.rng.range(232, 312);
    const h = def.type === "video" ? this.rng.range(72, 96) : this.rng.range(34, 46);
    const speed = def.speed * speedJitter * tierSpeed;
    const x = speed >= 0 ? -w / 2 - this.rng.range(16, 48) : WORLD.width + w / 2 + this.rng.range(16, 48);
    this.activeAds.push({
      instanceId: this.adInstanceSeq++,
      id: def.id,
      type: def.type,
      brand: def.brand,
      title: def.title,
      copy: def.copy,
      lane,
      x,
      y: this.adLaneY(lane),
      w,
      h,
      life: Math.max(2.4, def.duration + this.rng.range(-0.45, 0.55)),
      maxLife: def.duration,
      speed,
      opacity: clamp(def.opacity + this.rng.range(-0.05, 0.05), 0.38, 0.82),
      rarity: def.rarity,
      phase: this.rng.range(0, 10),
    });
  }

  private activeAdLimit(): number {
    return this.wave >= 10 ? 3 : 2;
  }

  private resolveAdLane(def: AdDef): number {
    if (def.lane === "top") return 0;
    if (def.lane === "middle") return 1;
    if (def.lane === "bottom") return 2;
    return this.rng.int(0, 2);
  }

  private adLaneY(lane: number): number {
    if (lane === 0) return WORLD.layout === "portrait" ? 104 : 82;
    if (lane === 1) return WORLD.height * 0.5;
    return WORLD.height - (WORLD.layout === "portrait" ? 132 : 86);
  }

  private enqueueLiveEvent(event: NormalizedLiveEvent): void {
    this.liveQueue.push(event);
    this.liveQueueReleaseTimer = Math.max(this.liveQueueReleaseTimer, UI_TIMERS.liveQueueReleaseDelay);
  }

  private canApplyLiveEventNow(): boolean {
    return this.mode === "running" && this.pauseMode === null && this.waveState === "fighting";
  }

  private drainLiveQueue(dt: number): void {
    if (!this.liveQueue.length) return;
    if (!this.canApplyLiveEventNow()) {
      this.liveQueueReleaseTimer = Math.max(this.liveQueueReleaseTimer, UI_TIMERS.liveQueueReleaseDelay);
      return;
    }
    this.liveQueueReleaseTimer = Math.max(0, this.liveQueueReleaseTimer - dt);
    if (this.liveQueueReleaseTimer > 0) return;
    const event = this.liveQueue.shift();
    if (event) {
      this.applyLiveEvent(event);
      this.liveQueueReleaseTimer = this.liveQueue.length ? UI_TIMERS.liveQueueReleaseGap : 0;
    }
  }

  private applyLiveEvent(event: NormalizedLiveEvent): void {
    if (this.isAdOnlyLiveEvent(event)) {
      this.applyAdOnlyGift(event.diamonds, `LIVE ${event.sender}`);
      return;
    }
    this.applyGift(event.diamonds, `LIVE ${event.sender}`);
  }

  private isAdOnlyLiveEvent(event: NormalizedLiveEvent): boolean {
    const text = `${event.type} ${event.label}`.toLowerCase();
    return text.includes("ad_obstacle") || text.includes("ad_obstruction") || text.includes("advert") || text === "ad ad" || text.startsWith("ad ");
  }

  private applyAdOnlyGift(diamonds: number, source: string): void {
    const safeDiamonds = Math.max(1, Math.round(diamonds));
    const tier = clamp(Math.round(Math.log2(safeDiamonds + 2)), 1, 8);
    this.economy.giftDiamonds += safeDiamonds;
    this.economy.giftValue += safeDiamonds;
    this.economy.giftCount += 1;
    this.giftEvent = {
      kind: "surge",
      name: "スポンサー広告投下",
      risk: "視界妨害",
      reward: "歓声加点",
      timer: UI_TIMERS.giftBanner,
      source,
    };
    this.enqueueGiftAd(safeDiamonds, source, tier);
    this.pushFloat(`AD RAID +${safeDiamonds}D`, this.player.x, this.player.y - 42, COLORS.gift, 13);
  }

  private addObstacle(input: { x: number; y: number; w: number; h: number; life: number }): void {
    this.obstacles.push({
      id: this.idSeq++,
      type: "gift_wall",
      x: input.x,
      y: input.y,
      w: input.w,
      h: input.h,
      life: input.life,
      maxLife: input.life,
    });
    if (this.obstacles.length > 14) this.obstacles.shift();
  }

  private resolveObstacles(entity: { x: number; y: number }, radius: number): void {
    for (const obstacle of this.obstacles) {
      const left = obstacle.x - obstacle.w / 2;
      const right = obstacle.x + obstacle.w / 2;
      const top = obstacle.y - obstacle.h / 2;
      const bottom = obstacle.y + obstacle.h / 2;
      const nearestX = clamp(entity.x, left, right);
      const nearestY = clamp(entity.y, top, bottom);
      const dx = entity.x - nearestX;
      const dy = entity.y - nearestY;
      const d = Math.hypot(dx, dy);
      if (d < radius && d > 0.001) {
        const push = radius - d;
        entity.x += (dx / d) * push;
        entity.y += (dy / d) * push;
      }
    }
  }

  private enemyCap(): number {
    if (this.options.bossDebug && this.hasBoss()) {
      return Math.round(clamp(8 + this.wave * 1 + this.economy.giftCount * 1.1, 8, 18));
    }
    const cap = 4 + Math.floor(this.wave * 1.3) + Math.floor(this.economy.giftCount * 1.2);
    return Math.round(clamp(cap, 4, Math.min(WORLD.maxEnemyCap, Math.max(5, this.waveTarget))));
  }

  private enemySeparation(enemy: EnemyState): Vec2 {
    let x = 0;
    let y = 0;
    for (const other of this.enemies) {
      if (other.id === enemy.id) continue;
      const minDist = enemy.radius + other.radius + (enemy.boss || other.boss ? 12 : 7);
      let dx = enemy.x - other.x;
      let dy = enemy.y - other.y;
      let d = Math.hypot(dx, dy);
      if (d >= minDist) continue;
      if (d < 0.001) {
        const angle = ((enemy.id * 97 + other.id * 37) % 360) * (Math.PI / 180);
        dx = Math.cos(angle);
        dy = Math.sin(angle);
        d = 1;
      }
      const strength = (minDist - d) / minDist;
      x += (dx / d) * strength;
      y += (dy / d) * strength;
    }
    return { x, y };
  }

  private pickEnemyRole() {
    const roll = this.rng.next();
    if (this.wave < 3) return roll < 0.68 ? "chaser" : "stalker";
    if (roll < 0.42) return "chaser";
    if (roll < 0.66) return "stalker";
    if (roll < 0.84) return "bruiser";
    return "zoner";
  }

  private hasBoss(): boolean {
    return this.enemies.some((enemy) => enemy.boss);
  }

  private finishRun(cleared: boolean, reason: string): void {
    if (this.mode === "ended") return;
    this.mode = "ended";
    this.pauseMode = null;
    this.endedReason = reason;
    this.score = this.getScorePreview();
    this.saveScoreCheckpoint(reason, cleared);
    this.pushFloat(cleared ? "RUN CLEAR" : "RUN FAILED", WORLD.width * 0.5, WORLD.height * 0.44, cleared ? COLORS.legendary : COLORS.danger, 18);
  }

  private saveScoreCheckpoint(reason: string, cleared = false): void {
    this.score = this.getScorePreview(cleared);
    const entry = saveLocalScore(this.score, {
      cleared,
      reason,
      wave: this.wave,
      kills: this.kills,
      time: Math.round(this.time),
      boss_kills: this.bossKills,
      build: `${this.build.jobId}/${this.build.weaponId}`,
      character: this.build.characterName,
    });
    if (entry) this.lastScoreEntryId = entry.id;
  }

  private spawnSparks(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i += 1) {
      const angle = this.rng.range(0, Math.PI * 2);
      const speed = this.rng.range(22, 96);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: this.rng.range(0.18, 0.5),
        maxLife: 0.5,
        size: this.rng.range(1.2, 3.2),
      });
    }
    if (this.particles.length > 180) this.particles.splice(0, this.particles.length - 180);
  }

  private pushFloat(text: string, x: number, y: number, color: number, size: number): void {
    this.floatTexts.push({ text, x, y, color, size, life: 0.95, maxLife: 0.95 });
    if (this.floatTexts.length > 34) this.floatTexts.shift();
  }
}

function createEquipmentSlots(): Record<EquipmentSlot, ItemState | null> {
  return { body: null, nunchaku: null };
}

function createEquipmentSlotMods(): Record<EquipmentSlot, EquipmentMods> {
  return { body: cloneEquipmentMods(), nunchaku: cloneEquipmentMods() };
}

function createPlayer(): PlayerState {
  return {
    x: WORLD.width * 0.5,
    y: WORLD.height * 0.72,
    vx: 0,
    vy: 0,
    targetX: WORLD.width * 0.5,
    targetY: WORLD.height * 0.72,
    radius: 11,
    hp: PLAYER_BALANCE.baseHp,
    maxHp: PLAYER_BALANCE.baseHp,
    level: 1,
    xp: 0,
    nextXp: 38,
    speed: PLAYER_BALANCE.baseSpeed,
    damageMul: 1,
    snapMul: 1,
    pickupRange: DROP_BALANCE.xpPullRange,
    invuln: 0.9,
    hitsTaken: 0,
  };
}

function createNunchaku(): NunchakuState {
  return {
    x: WORLD.width * 0.5 + NUNCHAKU_BALANCE.restLength,
    y: WORLD.height * 0.72,
    prevX: WORLD.width * 0.5 + NUNCHAKU_BALANCE.restLength,
    prevY: WORLD.height * 0.72,
    vx: 0,
    vy: 0,
    restLength: NUNCHAKU_BALANCE.restLength,
    maxLength: NUNCHAKU_BALANCE.maxLength,
    headRadius: NUNCHAKU_BALANCE.headRadius,
    speed: 0,
    tension: 0,
    stretch: 0,
    snapCd: 0,
    snapFlash: 0,
    selfHitCd: 0,
  };
}

function idleGiftEvent(): GiftEventState {
  return {
    kind: "idle",
    name: "イベント: 待機",
    risk: "--",
    reward: "--",
    timer: 0,
    source: "SYSTEM",
  };
}

function round(value: number): number {
  return Number(value.toFixed(2));
}

export function getBuildLists(): {
  jobs: typeof JOB_ORDER;
  weapons: typeof WEAPON_ORDER;
  jobNames: Record<JobId, string>;
  weaponNames: Record<WeaponId, string>;
} {
  return {
    jobs: JOB_ORDER,
    weapons: WEAPON_ORDER,
    jobNames: Object.fromEntries(JOB_ORDER.map((id) => [id, `${JOBS[id].name} - ${JOBS[id].title}`])) as Record<JobId, string>,
    weaponNames: Object.fromEntries(WEAPON_ORDER.map((id) => [id, `${WEAPONS[id].name} - ${WEAPONS[id].title}`])) as Record<WeaponId, string>,
  };
}
