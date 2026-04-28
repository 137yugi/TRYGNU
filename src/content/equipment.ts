import type { EquipmentMods, EquipmentRarity, EquipmentSlot, ItemAffixRoll, ItemState } from "../sim/types";
import type { Rng } from "../sim/rng";

export const EMPTY_EQUIPMENT_MODS: EquipmentMods = {
  damageMul: 1,
  speedBonus: 0,
  reachBonus: 0,
  snapCdMul: 1,
  pickupBonus: 0,
  maxHpBonus: 0,
  headRadiusBonus: 0,
  critChance: 0,
  critDamage: 0,
  bossDamage: 0,
  eliteDamage: 0,
  xpMul: 1,
  dropLuck: 0,
  damageReduction: 0,
  thorns: 0,
  lifeOnHit: 0,
  executeThreshold: 0,
  spinBonus: 0,
  shockwaveStacks: 0,
  chainStacks: 0,
  reflectStacks: 0,
  gravityStacks: 0,
  bleedStacks: 0,
  cloneCount: 0,
  scoreMul: 1,
};

export interface RarityDef {
  id: EquipmentRarity;
  label: string;
  color: number;
  weight: number;
  affixCount: number;
  powerMul: number;
  minWave: number;
}

export const RARITY_ORDER: EquipmentRarity[] = ["common", "magic", "rare", "epic", "legendary", "ancient"];

export const RARITIES: Record<EquipmentRarity, RarityDef> = {
  common: { id: "common", label: "コモン", color: 0xf4f7fb, weight: 720, affixCount: 1, powerMul: 1, minWave: 1 },
  magic: { id: "magic", label: "マジック", color: 0x69a7ff, weight: 230, affixCount: 2, powerMul: 1.18, minWave: 1 },
  rare: { id: "rare", label: "レア", color: 0xffdc5e, weight: 66, affixCount: 3, powerMul: 1.42, minWave: 2 },
  epic: { id: "epic", label: "エピック", color: 0xc76dff, weight: 13, affixCount: 4, powerMul: 1.78, minWave: 4 },
  legendary: { id: "legendary", label: "レジェンダリー", color: 0xff8a2a, weight: 3.2, affixCount: 5, powerMul: 2.25, minWave: 6 },
  ancient: { id: "ancient", label: "エンシェント", color: 0xff3333, weight: 0.45, affixCount: 6, powerMul: 3.05, minWave: 9 },
};

type ModKey = keyof EquipmentMods;

export const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
  body: "神経殻装備",
  nunchaku: "導電線装備",
};

export interface EquipmentBaseDef {
  name: string;
  assetId: string;
}

export const BODY_BASES: EquipmentBaseDef[] = [
  { name: "神経殻", assetId: "body-neuro-shell" },
  { name: "グリア外殻", assetId: "body-glia-shell" },
  { name: "電位炉", assetId: "body-volt-furnace" },
  { name: "神経コア盾", assetId: "body-core-shield" },
  { name: "髄鞘プレート", assetId: "body-myelin-plate" },
  { name: "伝導ベスト", assetId: "body-conduit-vest" },
  { name: "軸索脚部", assetId: "body-axon-legs" },
  { name: "過電流面頬", assetId: "body-surge-mask" },
];

export const NUNCHAKU_BASES: EquipmentBaseDef[] = [
  { name: "電脈導線", assetId: "chain-storm-conduit" },
  { name: "イオン核", assetId: "chain-ion-core" },
  { name: "シナプスヘッド", assetId: "chain-synapse-head" },
  { name: "樹状グリップ", assetId: "chain-dendrite-grip" },
  { name: "髄鞘鉄球", assetId: "chain-myelin-mace" },
  { name: "信号ヨーヨー", assetId: "chain-signal-yoyo" },
  { name: "導電シナプス", assetId: "chain-synapse-wire" },
  { name: "過電位ワイヤー", assetId: "chain-volt-wire" },
];

export const EQUIPMENT_BASE_ASSETS: Record<string, string> = Object.fromEntries(
  [...BODY_BASES, ...NUNCHAKU_BASES].map((base) => [base.name, base.assetId])
);

export interface AffixDef {
  id: string;
  name: string;
  desc: string;
  mod: ModKey;
  slots: EquipmentSlot[];
  min: number;
  max: number;
  minRarity?: EquipmentRarity;
  integer?: boolean;
  legendary?: boolean;
}

export const AFFIXES: AffixDef[] = [
  { id: "brutal", name: "電位増幅", desc: "導電線火力", mod: "damageMul", slots: ["nunchaku"], min: 0.06, max: 0.2 },
  { id: "feral", name: "軸索疾走", desc: "神経核移動速度", mod: "speedBonus", slots: ["body"], min: 8, max: 34, integer: true },
  { id: "long", name: "伸長軸索", desc: "導電線の到達距離", mod: "reachBonus", slots: ["nunchaku"], min: 5, max: 24, integer: true },
  { id: "quickdraw", name: "神経反射", desc: "スナップCD短縮", mod: "snapCdMul", slots: ["nunchaku"], min: -0.08, max: -0.24 },
  { id: "magnetic", name: "シナプス誘引", desc: "回収範囲", mod: "pickupBonus", slots: ["body"], min: 12, max: 64, integer: true },
  { id: "giant", name: "肥大神経核", desc: "先端核半径", mod: "headRadiusBonus", slots: ["nunchaku"], min: 1, max: 6, integer: true },
  { id: "stout", name: "厚髄鞘", desc: "最大HP", mod: "maxHpBonus", slots: ["body"], min: 18, max: 74, integer: true },
  { id: "razor", name: "切断電位", desc: "クリティカル率", mod: "critChance", slots: ["nunchaku"], min: 0.04, max: 0.16 },
  { id: "cruel", name: "溶解パルス", desc: "クリティカル倍率", mod: "critDamage", slots: ["nunchaku"], min: 0.18, max: 0.72 },
  { id: "slayer", name: "中枢標的", desc: "ボス火力", mod: "bossDamage", slots: ["nunchaku"], min: 0.1, max: 0.38 },
  { id: "hunter", name: "異常信号狩り", desc: "エリート火力", mod: "eliteDamage", slots: ["nunchaku"], min: 0.1, max: 0.42 },
  { id: "learning", name: "神経記憶", desc: "XP獲得", mod: "xpMul", slots: ["body"], min: 0.08, max: 0.3 },
  { id: "lucky", name: "イオン感知", desc: "装備ドロップ運", mod: "dropLuck", slots: ["body"], min: 0.02, max: 0.12 },
  { id: "guard", name: "髄鞘防壁", desc: "被ダメージ軽減", mod: "damageReduction", slots: ["body"], min: 0.04, max: 0.18 },
  { id: "thorn", name: "樹状棘", desc: "接触反撃", mod: "thorns", slots: ["body"], min: 6, max: 32, integer: true },
  { id: "drinker", name: "信号吸収", desc: "命中回復", mod: "lifeOnHit", slots: ["body", "nunchaku"], min: 0.25, max: 1.6 },
  { id: "culler", name: "断線処理", desc: "瀕死敵への倍率", mod: "executeThreshold", slots: ["nunchaku"], min: 0.04, max: 0.13 },
  { id: "gyroscope", name: "活動電位回転", desc: "回転速度", mod: "spinBonus", slots: ["nunchaku"], min: 0.5, max: 1.8 },
  { id: "echo_wave", name: "シナプス波", desc: "衝撃波強化", mod: "shockwaveStacks", slots: ["nunchaku"], min: 1, max: 1, minRarity: "magic", integer: true },
  { id: "spark_chain", name: "放電連鎖", desc: "連鎖ヒット強化", mod: "chainStacks", slots: ["nunchaku"], min: 1, max: 1, minRarity: "magic", integer: true },
  { id: "mirrorhide", name: "反射髄鞘", desc: "反射強化", mod: "reflectStacks", slots: ["body"], min: 1, max: 1, minRarity: "magic", integer: true },
  { id: "well", name: "電荷井戸", desc: "重力井戸強化", mod: "gravityStacks", slots: ["nunchaku"], min: 1, max: 1, minRarity: "rare", integer: true },
  { id: "bloodheat", name: "過電流", desc: "低HP火力", mod: "bleedStacks", slots: ["body", "nunchaku"], min: 1, max: 1, minRarity: "rare", integer: true },
  { id: "phantom", name: "信号分裂", desc: "分裂導電線", mod: "cloneCount", slots: ["nunchaku"], min: 1, max: 1, minRarity: "epic", integer: true },
  { id: "fame", name: "戦果記憶", desc: "スコア倍率", mod: "scoreMul", slots: ["body"], min: 0.08, max: 0.26 },
  { id: "overclock", name: "電脈暴走", desc: "火力を大きく伸ばす", mod: "damageMul", slots: ["nunchaku"], min: 0.24, max: 0.46, minRarity: "epic" },
  { id: "phasewalk", name: "軸索跳躍", desc: "速度を大きく伸ばす", mod: "speedBonus", slots: ["body"], min: 36, max: 72, minRarity: "epic", integer: true },
  { id: "boss_oath", name: "中枢導線", desc: "ボス火力を大きく伸ばす", mod: "bossDamage", slots: ["nunchaku"], min: 0.36, max: 0.85, minRarity: "epic" },
  { id: "gravity_crown", name: "電荷冠", desc: "電荷井戸を複数付与", mod: "gravityStacks", slots: ["nunchaku"], min: 2, max: 2, minRarity: "legendary", integer: true, legendary: true },
  { id: "orange_moon", name: "マゼンタ電位", desc: "衝撃波と連鎖を同時強化", mod: "shockwaveStacks", slots: ["nunchaku"], min: 2, max: 3, minRarity: "legendary", integer: true, legendary: true },
  { id: "thousand_chain", name: "千シナプス", desc: "分裂導電線を複数追加", mod: "cloneCount", slots: ["nunchaku"], min: 2, max: 3, minRarity: "legendary", integer: true, legendary: true },
  { id: "blood_pact", name: "電脈契約", desc: "危険な低HP過給", mod: "bleedStacks", slots: ["body", "nunchaku"], min: 3, max: 4, minRarity: "legendary", integer: true, legendary: true },
  { id: "snap_singularity", name: "即時放電SNAP", desc: "スナップCDを大きく短縮", mod: "snapCdMul", slots: ["nunchaku"], min: -0.3, max: -0.48, minRarity: "legendary", legendary: true },
  { id: "red_comet", name: "赤色神経核", desc: "火力が壊れる", mod: "damageMul", slots: ["nunchaku"], min: 0.65, max: 1.25, minRarity: "ancient", legendary: true },
  { id: "ancient_heart", name: "原初電位炉", desc: "HPと吸命が跳ねる", mod: "maxHpBonus", slots: ["body"], min: 120, max: 260, minRarity: "ancient", integer: true, legendary: true },
  { id: "endless_teeth", name: "無限イオン歯", desc: "丸鋸級の巨大先端核", mod: "headRadiusBonus", slots: ["nunchaku"], min: 7, max: 13, minRarity: "ancient", integer: true, legendary: true },
  { id: "red_wealth", name: "赤色信号記憶", desc: "スコアとドロップ運が跳ねる", mod: "scoreMul", slots: ["body"], min: 0.45, max: 0.95, minRarity: "ancient", legendary: true },
];

export function cloneEquipmentMods(mods: EquipmentMods = EMPTY_EQUIPMENT_MODS): EquipmentMods {
  return { ...mods };
}

export function addEquipmentMods(target: EquipmentMods, source: Partial<EquipmentMods>): EquipmentMods {
  for (const key of Object.keys(source) as (keyof EquipmentMods)[]) {
    const value = source[key];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    if (key === "damageMul" || key === "xpMul" || key === "scoreMul") target[key] += value - 1;
    else if (key === "snapCdMul") target[key] += value - 1;
    else target[key] += value;
  }
  target.damageMul = Math.max(0.2, target.damageMul);
  target.snapCdMul = Math.max(0.28, target.snapCdMul);
  target.xpMul = Math.max(0.2, target.xpMul);
  target.scoreMul = Math.max(0.2, target.scoreMul);
  return target;
}

export function rollEquipmentItem(rng: Rng, wave: number, forceRarity?: EquipmentRarity, forceSlot?: EquipmentSlot): ItemState {
  const rarity = forceRarity || rollRarity(rng, wave);
  const rarityDef = RARITIES[rarity];
  const slot = forceSlot || (rng.chance(0.52) ? "nunchaku" : "body");
  const power = Math.round((8 + wave * 1.35 + rng.int(0, 7 + wave)) * rarityDef.powerMul);
  const affixes = rollAffixes(rng, rarity, rarityDef.affixCount, slot);
  const mods = affixes.reduce((acc, affix) => addEquipmentMods(acc, affixToMods(affix)), cloneEquipmentMods());
  const suffix = affixes[0]?.name || "無銘";
  const base = rng.pick(slot === "body" ? BODY_BASES : NUNCHAKU_BASES);
  return {
    id: `item-${rarity}-${wave}-${Math.floor(rng.next() * 1_000_000)}`,
    name: `${rarityDef.label} ${suffix}${base.name}`,
    slot,
    baseName: base.name,
    assetId: base.assetId,
    rarity,
    power,
    wave,
    color: rarityDef.color,
    affixes,
    mods: addEquipmentMods(mods, { damageMul: 1 + Math.max(0, power - 8) * 0.008 }),
  };
}

export function formatAffix(affix: ItemAffixRoll): string {
  const signed = affix.value > 0 ? "+" : "";
  const percentMods = new Set(["damageMul", "snapCdMul", "critChance", "critDamage", "bossDamage", "eliteDamage", "xpMul", "dropLuck", "damageReduction", "executeThreshold", "scoreMul"]);
  const def = AFFIXES.find((entry) => entry.id === affix.id);
  const value = percentMods.has(def?.mod || "") ? `${signed}${Math.round(affix.value * 100)}%` : `${signed}${Number.isInteger(affix.value) ? affix.value : affix.value.toFixed(1)}`;
  return `${affix.name} ${value}: ${affix.desc}`;
}

function rollRarity(rng: Rng, wave: number): EquipmentRarity {
  const options = RARITY_ORDER.map((id) => RARITIES[id]).filter((rarity) => wave >= rarity.minWave);
  const total = options.reduce((sum, rarity) => sum + rarity.weight, 0);
  let roll = rng.range(0, total);
  for (const rarity of options) {
    roll -= rarity.weight;
    if (roll <= 0) return rarity.id;
  }
  return "common";
}

function rollAffixes(rng: Rng, rarity: EquipmentRarity, count: number, slot: EquipmentSlot): ItemAffixRoll[] {
  const rarityIndex = RARITY_ORDER.indexOf(rarity);
  const pool = AFFIXES.filter((affix) => affix.slots.includes(slot) && RARITY_ORDER.indexOf(affix.minRarity || "common") <= rarityIndex);
  const mandatory = rarityIndex >= RARITY_ORDER.indexOf("legendary") ? pool.filter((affix) => affix.legendary && RARITY_ORDER.indexOf(affix.minRarity || "common") <= rarityIndex) : [];
  const picked: AffixDef[] = [];
  if (mandatory.length) picked.push(rng.pick(mandatory));
  while (picked.length < count) {
    const candidate = rng.pick(pool);
    if (picked.some((affix) => affix.id === candidate.id)) continue;
    picked.push(candidate);
  }
  return picked.map((affix) => {
    const rarityPower = 1 + rarityIndex * 0.12;
    const raw = rng.range(affix.min, affix.max) * rarityPower;
    const value = affix.integer ? Math.max(1, Math.round(raw)) : Number(raw.toFixed(3));
    return { id: affix.id, name: affix.name, desc: affix.desc, value, rarity };
  });
}

function affixToMods(affix: ItemAffixRoll): Partial<EquipmentMods> {
  const def = AFFIXES.find((entry) => entry.id === affix.id);
  if (!def) return {};
  if (def.mod === "damageMul" || def.mod === "xpMul" || def.mod === "scoreMul") return { [def.mod]: 1 + affix.value };
  if (def.mod === "snapCdMul") return { snapCdMul: 1 + affix.value };
  return { [def.mod]: affix.value };
}
