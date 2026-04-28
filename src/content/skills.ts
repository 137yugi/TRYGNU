import type { SkillId } from "../sim/types";

export type SkillEffect =
  | { kind: "damageMul"; value: number }
  | { kind: "speedBonus"; value: number }
  | { kind: "reachBonus"; value: number }
  | { kind: "snapCdMul"; value: number }
  | { kind: "pickupBonus"; value: number }
  | { kind: "maxHp"; value: number }
  | { kind: "clone"; value: number }
  | { kind: "spin"; value: number }
  | { kind: "reflect"; value: number }
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
  | { kind: "scoreMul"; value: number }
  | { kind: "snapImpulse"; value: number };

export interface SkillDef {
  id: SkillId;
  name: string;
  desc: string;
  effects: SkillEffect[];
}

const s = (id: SkillId, name: string, desc: string, effects: SkillEffect[]): SkillDef => ({ id, name, desc, effects });

export const LEVEL_SKILLS: SkillDef[] = [
  s("clone", "信号分裂", "慣性で暴れる分裂導電線 +1。重ねるほどシナプス網が荒れる", [{ kind: "clone", value: 1 }]),
  s("spin", "活動電位高速回転", "分裂導電線と本体線の回転が加速。スナップ後の暴れ方も増す", [{ kind: "spin", value: 1 }]),
  s("shockwave", "シナプス波SNAP", "スナップ時に周囲へ範囲ダメージ。重複で半径と火力上昇", [{ kind: "shockwave", value: 1 }]),
  s("reflect", "髄鞘反射爆発", "被弾時に近くの敵へ反射爆発。接触事故も攻撃になる", [{ kind: "reflect", value: 1 }]),
  s("chain", "放電連鎖", "導電線命中が近くのノイズへ飛び火する", [{ kind: "chain", value: 1 }]),
  s("saw", "イオン丸鋸核", "先端核が巨大化。命中判定と火力が雑に伸びる", [{ kind: "saw", value: 1 }]),
  s("gravity", "電荷井戸", "敵とドロップを導電線側へ吸い寄せる", [{ kind: "gravity", value: 1 }]),
  s("bleed", "過電流過給", "低HPほど火力と回転が跳ね上がる", [{ kind: "bleed", value: 1 }]),
  s("damage", "電位剛打", "基礎火力 +18%。他の放電火力にも乗る", [{ kind: "damageMul", value: 1.18 }]),
  s("speed", "軸索疾走", "移動速度 +18", [{ kind: "speedBonus", value: 18 }]),
  s("reach", "長軸索線", "到達距離 +12", [{ kind: "reachBonus", value: 12 }]),
  s("snap", "即応放電", "スナップCD短縮", [{ kind: "snapCdMul", value: 0.86 }]),
  s("vital", "神経核強化", "最大HP +26 / 小回復", [{ kind: "maxHp", value: 26 }]),
  s("pickup", "シナプス回収輪", "ウェーブ終了時の回収範囲 +24", [{ kind: "pickupBonus", value: 24 }]),
  s("crit_eye", "信号識別眼", "クリティカル率上昇。高火力装備と別枠で乗る", [{ kind: "critChance", value: 0.08 }]),
  s("crit_fang", "断線牙", "クリティカル倍率上昇", [{ kind: "critDamage", value: 0.35 }]),
  s("execute", "終端断線", "瀕死の敵へ大ダメージ", [{ kind: "execute", value: 0.08 }]),
  s("lifesteal", "信号吸収軌道", "命中時に少量回復", [{ kind: "lifesteal", value: 0.55 }]),
  s("frost", "低温伝導", "命中した敵の動きが鈍る", [{ kind: "frost", value: 1 }]),
  s("scorch", "過熱放電", "命中時に追加炎上ダメージ", [{ kind: "scorch", value: 1 }]),
  s("toxic", "ノイズ標識", "最大HP割合の毒ダメージ", [{ kind: "toxic", value: 1 }]),
  s("slow_aura", "鎮静電場", "敵全体の追跡を鈍らせる", [{ kind: "enemySlow", value: 0.04 }]),
  s("boss_slayer", "中枢キラー", "ボスへの火力が上昇", [{ kind: "bossDamage", value: 0.22 }]),
  s("elite_hunter", "異常信号狩り", "エリートへの火力が上昇", [{ kind: "eliteDamage", value: 0.28 }]),
  s("xp_surge", "神経記憶", "XP獲得量が上昇", [{ kind: "xpMul", value: 1.16 }]),
  s("loot_luck", "イオン嗅覚", "装備ドロップ率と高レア抽選を底上げ", [{ kind: "dropLuck", value: 0.035 }]),
  s("guard", "髄鞘装甲", "被ダメージ軽減", [{ kind: "damageReduction", value: 0.07 }]),
  s("score_greed", "戦果吸収", "スコア倍率上昇。危険な稼ぎ用", [{ kind: "scoreMul", value: 1.14 }]),
  s("snap_impulse", "強制放電SNAP", "スナップの初速が上昇", [{ kind: "snapImpulse", value: 0.16 }]),
  s("double_clone", "二重導線", "分裂導電線を2本追加", [{ kind: "clone", value: 2 }]),
  s("wave_cleaver", "ノイズ裂断", "衝撃波と連鎖を同時に伸ばす", [{ kind: "shockwave", value: 1 }, { kind: "chain", value: 1 }]),
  s("blood_engine", "過電流エンジン", "低HP過給と会心倍率を同時取得", [{ kind: "bleed", value: 1 }, { kind: "critDamage", value: 0.22 }]),
  s("mirror_core", "反射神経核", "反射と防御を同時取得", [{ kind: "reflect", value: 1 }, { kind: "damageReduction", value: 0.04 }]),
  s("magnet_storm", "電荷嵐", "回収範囲と電荷井戸を同時取得", [{ kind: "pickupBonus", value: 18 }, { kind: "gravity", value: 1 }]),
  s("giant_spin", "肥大神経核回転", "先端核大型化と回転強化", [{ kind: "saw", value: 1 }, { kind: "spin", value: 1 }]),
  s("glass_overdrive", "薄髄鞘過駆動", "火力とスナップ初速が上がる", [{ kind: "damageMul", value: 1.12 }, { kind: "snapImpulse", value: 0.14 }]),
  s("survivor_core", "生存神経核", "最大HPと吸命を同時取得", [{ kind: "maxHp", value: 22 }, { kind: "lifesteal", value: 0.35 }]),
  s("rare_sense", "希少イオン感知", "ドロップ運とXP獲得を同時取得", [{ kind: "dropLuck", value: 0.025 }, { kind: "xpMul", value: 1.08 }]),
];

export const MUTATIONS: SkillDef[] = [
  s("overdrive", "SYNAPSE STORM", "高速命中時に追加放電火花", []),
  s("rubber", "伸縮導電線", "最大伸長が増え逆流を軽減", []),
  s("bulwark", "髄鞘防御", "接触被害を軽減", [{ kind: "damageReduction", value: 0.08 }]),
  s("magnet", "回収電荷嵐", "ドロップが強く吸い寄せられる", [{ kind: "pickupBonus", value: 30 }]),
  s("clone", "多重信号分裂", "分裂導電線をさらに追加", [{ kind: "clone", value: 1 }]),
  s("reflect", "反射髄鞘暴走", "反射爆発を強化", [{ kind: "reflect", value: 1 }]),
  s("chain", "放電連鎖暴走", "飛び火回数を増やす", [{ kind: "chain", value: 1 }]),
];
