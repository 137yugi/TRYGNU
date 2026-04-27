import type { BossId } from "../content/bosses";
import type { EnemyRole } from "../content/enemies";
import type { GiftKind } from "../content/gifts";
import type { JobId } from "../content/jobs";
import type { WeaponId } from "../content/weapons";

export type GameMode = "title" | "running" | "ended";
export type PauseMode = null | "menu" | "levelup" | "mutation" | "pickup_compare";
export type WaveState = "spawning" | "fighting" | "reward";
export type SkillId = string;
export type EquipmentRarity = "common" | "magic" | "rare" | "epic" | "legendary" | "ancient";

export interface EquipmentMods {
  damageMul: number;
  speedBonus: number;
  reachBonus: number;
  snapCdMul: number;
  pickupBonus: number;
  maxHpBonus: number;
  headRadiusBonus: number;
  critChance: number;
  critDamage: number;
  bossDamage: number;
  eliteDamage: number;
  xpMul: number;
  dropLuck: number;
  damageReduction: number;
  thorns: number;
  lifeOnHit: number;
  executeThreshold: number;
  spinBonus: number;
  shockwaveStacks: number;
  chainStacks: number;
  reflectStacks: number;
  gravityStacks: number;
  bleedStacks: number;
  cloneCount: number;
  scoreMul: number;
}

export interface ItemAffixRoll {
  id: string;
  name: string;
  desc: string;
  value: number;
  rarity: EquipmentRarity;
}

export interface ItemState {
  id: string;
  name: string;
  rarity: EquipmentRarity;
  power: number;
  wave: number;
  color: number;
  affixes: ItemAffixRoll[];
  mods: EquipmentMods;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface QueryOptions {
  seed: string;
  bossDebug: boolean;
  balanceProfile: "A" | "B";
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  pointerActive: boolean;
  pointerX: number;
  pointerY: number;
}

export interface PlayerState extends Vec2 {
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  radius: number;
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  nextXp: number;
  speed: number;
  damageMul: number;
  snapMul: number;
  pickupRange: number;
  invuln: number;
  hitsTaken: number;
}

export interface NunchakuState extends Vec2 {
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  restLength: number;
  maxLength: number;
  headRadius: number;
  speed: number;
  tension: number;
  stretch: number;
  snapCd: number;
  snapFlash: number;
  selfHitCd: number;
}

export interface PhantomNunchakuState extends Vec2 {
  prevX: number;
  prevY: number;
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
  headRadius: number;
  speed: number;
  color: number;
}

export interface EnemyState extends Vec2 {
  id: number;
  role: EnemyRole;
  name: string;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  radius: number;
  speed: number;
  damage: number;
  score: number;
  color: number;
  elite: boolean;
  boss: boolean;
  bossId?: BossId;
  phase: number;
  hitCd: number;
  touchCd: number;
  attackCd: number;
}

export type DropKind = "xp" | "item" | "legendary";

export interface DropState extends Vec2 {
  id: number;
  kind: DropKind;
  radius: number;
  value: number;
  color: number;
  name: string;
  power?: number;
  rarity?: EquipmentRarity;
  item?: ItemState;
}

export interface ObstacleState extends Vec2 {
  id: number;
  w: number;
  h: number;
  life: number;
  maxLife: number;
  type: "gift_wall";
}

export interface FloatingText extends Vec2 {
  text: string;
  color: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface ParticleState extends Vec2 {
  vx: number;
  vy: number;
  color: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface ChoiceState {
  id: SkillId;
  name: string;
  desc: string;
}

export interface PickupCompareState {
  item: DropState;
  timer: number;
  currentPower: number;
  currentItem?: ItemState | null;
}

export interface ObjectiveState {
  type: "kill" | "no_hit" | "snap";
  label: string;
  progress: number;
  target: number;
  timer: number;
  success: boolean;
}

export interface GiftEventState {
  kind: GiftKind | "idle";
  name: string;
  risk: string;
  reward: string;
  timer: number;
  source: string;
}

export interface EconomyState {
  demoEnergy: number;
  giftValue: number;
  giftDiamonds: number;
  giftCount: number;
  legendary: number;
}

export interface BuildState {
  characterName: string;
  jobId: JobId;
  weaponId: WeaponId;
}

export interface SettingsState {
  debugHud: boolean;
  flashFx: boolean;
  shakeFx: boolean;
  audio: boolean;
}

export interface PublicSnapshot {
  coordinate_system: string;
  canvas: { width: number; height: number };
  mode: GameMode;
  pause_mode: PauseMode;
  score: number;
  build: Record<string, unknown>;
  combat: Record<string, unknown>;
  player: Record<string, unknown>;
  run: Record<string, unknown>;
  nunchaku: Record<string, unknown>;
  phantoms: Record<string, unknown>[];
  objective: Record<string, unknown> | null;
  economy: Record<string, unknown>;
  inventory: Record<string, unknown>;
  enemies: Record<string, unknown>[];
  drops: Record<string, unknown>[];
}
