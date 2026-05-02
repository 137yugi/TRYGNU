import type { SkillId } from "../sim/types";

export type SkillEffect =
  | { kind: "damageMul"; value: number }
  | { kind: "speedBonus"; value: number }
  | { kind: "reachBonus"; value: number }
  | { kind: "pickupBonus"; value: number }
  | { kind: "maxHp"; value: number }
  | { kind: "clone"; value: number }
  | { kind: "spin"; value: number }
  | { kind: "reflect"; value: number }
  | { kind: "selfBlast"; value: number }
  | { kind: "shockwave"; value: number }
  | { kind: "chain"; value: number }
  | { kind: "saw"; value: number }
  | { kind: "gravity"; value: number }
  | { kind: "bleed"; value: number }
  | { kind: "critChance"; value: number }
  | { kind: "critDamage"; value: number }
  | { kind: "execute"; value: number }
  | { kind: "lifesteal"; value: number }
  | { kind: "enemySlow"; value: number }
  | { kind: "scorch"; value: number }
  | { kind: "toxic"; value: number }
  | { kind: "frost"; value: number }
  | { kind: "bossDamage"; value: number }
  | { kind: "eliteDamage"; value: number }
  | { kind: "xpMul"; value: number }
  | { kind: "dropLuck"; value: number }
  | { kind: "damageReduction"; value: number }
  | { kind: "scoreMul"; value: number };

export interface SkillDef {
  id: SkillId;
  name: string;
  desc: string;
  effects: SkillEffect[];
}

const s = (id: SkillId, name: string, desc: string, effects: SkillEffect[]): SkillDef => ({ id, name, desc, effects });

export const LEVEL_SKILLS: SkillDef[] = [
  s("clone", "幻影鎖", "慣性で暴れる分身の呪鎖 +1。重ねるほど闘技場が派手に荒れる", [{ kind: "clone", value: 1 }]),
  s("spin", "車輪回し", "分身鎖と本体鎖の回転が加速。移動だけで暴れ方が増す", [{ kind: "spin", value: 1 }]),
  s("shockwave", "歓声波", "高速命中時の衝撃波を強化。重複で半径と火力上昇", [{ kind: "shockwave", value: 1 }]),
  s("reflect", "盾返し爆発", "被弾時に近くの敵へ反射爆発。接触事故も攻撃になる", [{ kind: "reflect", value: 1 }]),
  s("self_blast", "自爆刻印", "被弾と自傷を爆発に変換。自分も少し削れるが周囲をまとめて吹き飛ばす", [{ kind: "selfBlast", value: 1 }]),
  s("chain", "呪鎖連鎖", "呪鎖命中が近くの敵へ飛び火する", [{ kind: "chain", value: 1 }]),
  s("saw", "鋸鉄球", "先端が巨大化。命中判定と火力が雑に伸びる", [{ kind: "saw", value: 1 }]),
  s("gravity", "王冠の重力", "敵とドロップを呪鎖側へ吸い寄せる", [{ kind: "gravity", value: 1 }]),
  s("bleed", "血塗れ興行", "低HPほど火力と回転が跳ね上がる", [{ kind: "bleed", value: 1 }]),
  s("damage", "剛腕打撃", "基礎火力 +18%。他の火力にも乗る", [{ kind: "damageMul", value: 1.18 }]),
  s("speed", "軽業走り", "移動速度 +18", [{ kind: "speedBonus", value: 18 }]),
  s("reach", "長鎖術", "到達距離 +12", [{ kind: "reachBonus", value: 12 }]),
  s("inertia", "即応回転", "呪鎖ヘッドの回転速度が上昇", [{ kind: "spin", value: 1 }]),
  s("vital", "闘士の心臓", "最大HP +26 / 小回復", [{ kind: "maxHp", value: 26 }]),
  s("pickup", "戦利品回収輪", "ウェーブ終了時の回収範囲 +24", [{ kind: "pickupBonus", value: 24 }]),
  s("crit_eye", "観客席の眼", "クリティカル率上昇。高火力装備と別枠で乗る", [{ kind: "critChance", value: 0.08 }]),
  s("crit_fang", "処刑牙", "クリティカル倍率上昇", [{ kind: "critDamage", value: 0.35 }]),
  s("execute", "幕引き処刑", "瀕死の敵へ大ダメージ", [{ kind: "execute", value: 0.08 }]),
  s("lifesteal", "喝采吸収", "命中時に少量回復", [{ kind: "lifesteal", value: 0.55 }]),
  s("frost", "凍てつく床罠", "命中した敵の動きが鈍る", [{ kind: "frost", value: 1 }]),
  s("scorch", "火柱罠", "命中時に追加炎上ダメージ", [{ kind: "scorch", value: 1 }]),
  s("toxic", "毒霧広告", "最大HP割合の毒ダメージ", [{ kind: "toxic", value: 1 }]),
  s("slow_aura", "沈黙の鐘", "敵全体の追跡を鈍らせる", [{ kind: "enemySlow", value: 0.04 }]),
  s("boss_slayer", "王者狩り", "ボスへの火力が上昇", [{ kind: "bossDamage", value: 0.22 }]),
  s("elite_hunter", "名物客狩り", "エリートへの火力が上昇", [{ kind: "eliteDamage", value: 0.28 }]),
  s("xp_surge", "古文書暗記", "XP獲得量が上昇", [{ kind: "xpMul", value: 1.16 }]),
  s("loot_luck", "宝箱嗅覚", "装備ドロップ率と高レア抽選を底上げ", [{ kind: "dropLuck", value: 0.035 }]),
  s("guard", "板金装甲", "被ダメージ軽減", [{ kind: "damageReduction", value: 0.07 }]),
  s("score_greed", "興行収益", "スコア倍率上昇。危険な稼ぎ用", [{ kind: "scoreMul", value: 1.14 }]),
  s("forced_rotation", "強制回転号令", "本体鎖と分身鎖の回転がさらに荒くなる", [{ kind: "spin", value: 1 }, { kind: "shockwave", value: 1 }]),
  s("double_clone", "二重呪鎖", "分身呪鎖を2本追加", [{ kind: "clone", value: 2 }]),
  s("wave_cleaver", "観客席割り", "衝撃波と連鎖を同時に伸ばす", [{ kind: "shockwave", value: 1 }, { kind: "chain", value: 1 }]),
  s("blood_engine", "血の興行炉", "低HP過給と会心倍率を同時取得", [{ kind: "bleed", value: 1 }, { kind: "critDamage", value: 0.22 }]),
  s("mirror_core", "鏡盾の構え", "反射と防御を同時取得", [{ kind: "reflect", value: 1 }, { kind: "damageReduction", value: 0.04 }]),
  s("blood_mine", "血雷地雷", "自爆と低HP過給を同時取得。事故るほど盤面が荒れる", [{ kind: "selfBlast", value: 1 }, { kind: "bleed", value: 1 }]),
  s("magnet_storm", "王冠嵐", "回収範囲と重力を同時取得", [{ kind: "pickupBonus", value: 18 }, { kind: "gravity", value: 1 }]),
  s("giant_spin", "巨大鉄球回転", "先端大型化と回転強化", [{ kind: "saw", value: 1 }, { kind: "spin", value: 1 }]),
  s("glass_overdrive", "硝子の狂宴", "火力と回転速度が上がる", [{ kind: "damageMul", value: 1.12 }, { kind: "spin", value: 1 }]),
  s("survivor_core", "生還者の誓い", "最大HPと吸命を同時取得", [{ kind: "maxHp", value: 22 }, { kind: "lifesteal", value: 0.35 }]),
  s("rare_sense", "希少品鑑定", "ドロップ運とXP獲得を同時取得", [{ kind: "dropLuck", value: 0.025 }, { kind: "xpMul", value: 1.08 }]),
];

export const MUTATIONS: SkillDef[] = [
  s("overdrive", "RAID FRENZY", "高速命中時に追加の火花と歓声", []),
  s("rubber", "伸縮呪鎖", "最大伸長が増え自傷を軽減", []),
  s("bulwark", "城壁防御", "接触被害を軽減", [{ kind: "damageReduction", value: 0.08 }]),
  s("magnet", "王冠回収嵐", "ドロップが強く吸い寄せられる", [{ kind: "pickupBonus", value: 30 }]),
  s("clone", "多重幻影鎖", "分身呪鎖をさらに追加", [{ kind: "clone", value: 1 }]),
  s("reflect", "鏡盾暴走", "反射爆発を強化", [{ kind: "reflect", value: 1 }]),
  s("self_blast", "自爆炉暴走", "自爆爆発を強化", [{ kind: "selfBlast", value: 1 }]),
  s("chain", "呪鎖連鎖暴走", "飛び火回数を増やす", [{ kind: "chain", value: 1 }]),
];
