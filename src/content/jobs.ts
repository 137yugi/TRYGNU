import type { WeaponId } from "./weapons";

export type JobId = "vanguard" | "shadow" | "arcanist" | "reaver" | "monk" | "courier" | "sentinel" | "breaker";

export interface JobDef {
  id: JobId;
  name: string;
  title: string;
  role: string;
  description: string;
  statLine: string;
  tactics: string;
  difficulty: string;
  statNotes: {
    hp: string;
    speed: string;
    damage: string;
  };
  recommendedWeapons: WeaponId[];
  hpMul: number;
  speedMul: number;
  damageMul: number;
  color: number;
}

export const JOBS: Record<JobId, JobDef> = {
  vanguard: {
    id: "vanguard",
    name: "Shield Knight",
    title: "盾の騎士",
    role: "標準前衛",
    description: "高いHPと安定火力で、包囲を受けても前線を押し返す闘士。",
    statLine: "被弾を許容しながら呪鎖を大きく振る、初回ラン向けの基準ジョブ。",
    tactics: "敵の塊へ斜めに入り、反転で呪鎖を後ろから当てると安全に数を削れる。",
    difficulty: "低",
    statNotes: {
      hp: "被弾猶予が広く、事故後も立て直しやすい。",
      speed: "平均より少し重いが、反転操作は安定する。",
      damage: "序盤から十分な押し返し力を持つ。",
    },
    recommendedWeapons: ["chain_core", "anchor_mace", "pulse_bow"],
    hpMul: 1.22,
    speedMul: 0.96,
    damageMul: 1.08,
    color: 0xf0e6c8,
  },
  shadow: {
    id: "shadow",
    name: "Crow Rogue",
    title: "影鴉の盗賊",
    role: "高速回避",
    description: "最高クラスの機動力で包囲を抜け、短い接触時間で呪鎖を差し込む。",
    statLine: "低HPを移動速度で補う上級寄りの回避ジョブ。",
    tactics: "常に敵列の外周を回り、停止せずに横切る軌道で武器だけを群れへ置く。",
    difficulty: "高",
    statNotes: {
      hp: "連続被弾に弱く、HP管理の要求が高い。",
      speed: "包囲脱出とドロップ回収が非常に速い。",
      damage: "武器相性と速度由来の打点で伸ばす。",
    },
    recommendedWeapons: ["twin_flail", "mirror_yoyo", "serpent_cord"],
    hpMul: 0.92,
    speedMul: 1.18,
    damageMul: 1,
    color: 0x51d6ff,
  },
  arcanist: {
    id: "arcanist",
    name: "Rune Witch",
    title: "呪文の魔女",
    role: "呪術火力",
    description: "火力寄りの呪術型。射程と一撃の重さを伸ばすと群れを崩しやすい。",
    statLine: "位置取りを作ってから大きい一撃を通す、火力重視ジョブ。",
    tactics: "敵を直線に引きつけ、長射程武器で接近前に削ると安定する。",
    difficulty: "中",
    statNotes: {
      hp: "平均より少し脆く、早めの距離管理が必要。",
      speed: "標準速度で操作癖が少ない。",
      damage: "ジョブ単体の火力倍率が高い。",
    },
    recommendedWeapons: ["void_staff", "pulse_bow", "anchor_mace"],
    hpMul: 0.98,
    speedMul: 1,
    damageMul: 1.18,
    color: 0xb56cff,
  },
  reaver: {
    id: "reaver",
    name: "Blood Reaver",
    title: "流血の略奪者",
    role: "連続撃破",
    description: "HP/速度/火力のバランスが良く、近距離で連続撃破を狙う攻撃型。",
    statLine: "近距離の危険を火力で先に潰す、攻めの標準ジョブ。",
    tactics: "敵の先頭を削って穴を作り、群れの側面へ抜ける動きが強い。",
    difficulty: "中",
    statNotes: {
      hp: "平均より少し硬く、攻め直しがしやすい。",
      speed: "踏み込みと離脱の両方が軽い。",
      damage: "硬い敵やボスにも通りやすい。",
    },
    recommendedWeapons: ["comet_knuckle", "twin_flail", "chain_core"],
    hpMul: 1.04,
    speedMul: 1.07,
    damageMul: 1.12,
    color: 0xff4f7a,
  },
  monk: {
    id: "monk",
    name: "Bell Monk",
    title: "鐘鳴り修道士",
    role: "継戦制御",
    description: "耐久と速度が少し高く、方向転換で敵をさばく継戦型。",
    statLine: "大崩れしにくく、操作精度を報酬へ変えやすいジョブ。",
    tactics: "小刻みな反転で呪鎖に角度をつけ、群れの進行方向をずらす。",
    difficulty: "低",
    statNotes: {
      hp: "安定寄りで、回復や防御スキルと噛み合う。",
      speed: "標準以上で位置修正がしやすい。",
      damage: "控えめだが継続ヒットで補える。",
    },
    recommendedWeapons: ["mirror_yoyo", "serpent_cord", "chain_core"],
    hpMul: 1.1,
    speedMul: 1.04,
    damageMul: 1.03,
    color: 0x6cff9f,
  },
  courier: {
    id: "courier",
    name: "Banner Courier",
    title: "戦旗の伝令",
    role: "最高機動",
    description: "最高速で危険地帯を抜ける機動型。低HPなので距離管理が重要。",
    statLine: "安全圏を自分で作る、スコア回収と配信イベント対応に強いジョブ。",
    tactics: "直線で逃げ切らず、円弧で群れをまとめてから武器を横から通す。",
    difficulty: "高",
    statNotes: {
      hp: "最も脆く、接触ミスの許容量が小さい。",
      speed: "全ジョブ最高。回収と誘導が得意。",
      damage: "素の火力は低めで、武器選択が重要。",
    },
    recommendedWeapons: ["serpent_cord", "pulse_bow", "mirror_yoyo"],
    hpMul: 0.84,
    speedMul: 1.3,
    damageMul: 0.94,
    color: 0x47a3ff,
  },
  sentinel: {
    id: "sentinel",
    name: "Iron Bastion",
    title: "鉄壁の守人",
    role: "重装耐久",
    description: "最大HP特化の重装型。遅さを射程と重い一撃で補う。",
    statLine: "硬さで事故を吸収し、長いランで装備完成を狙う耐久ジョブ。",
    tactics: "中央に残りすぎず、壁際へ寄せてから重い武器でまとめて押し返す。",
    difficulty: "中",
    statNotes: {
      hp: "全ジョブ最高。被弾後の回復価値も高い。",
      speed: "遅く、包囲される前の移動判断が必要。",
      damage: "重武器と合わせると高耐久敵に強い。",
    },
    recommendedWeapons: ["anchor_mace", "void_staff", "chain_core"],
    hpMul: 1.42,
    speedMul: 0.84,
    damageMul: 1.1,
    color: 0xf6f0de,
  },
  breaker: {
    id: "breaker",
    name: "Gate Breaker",
    title: "門砕き",
    role: "単発破壊",
    description: "火力特化でボスや硬い敵に強い。安全な振り抜き位置を作る。",
    statLine: "低い安全余白を高火力で補う、短期決戦向けジョブ。",
    tactics: "敵群へ深く入りすぎず、武器の先端だけを当てて硬い敵から折る。",
    difficulty: "中",
    statNotes: {
      hp: "標準。火力に寄せるほど被弾管理が重要。",
      speed: "ほぼ標準で、重武器も扱いやすい。",
      damage: "全ジョブ最高。ボス削りが速い。",
    },
    recommendedWeapons: ["anchor_mace", "void_staff", "comet_knuckle"],
    hpMul: 1,
    speedMul: 0.98,
    damageMul: 1.32,
    color: 0xff5b3d,
  },
};

export const JOB_ORDER: JobId[] = ["vanguard", "shadow", "arcanist", "reaver", "monk", "courier", "sentinel", "breaker"];
