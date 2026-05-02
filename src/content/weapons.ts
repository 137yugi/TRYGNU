export type WeaponId =
  | "chain_core"
  | "twin_flail"
  | "double_pendulum"
  | "pulse_bow"
  | "void_staff"
  | "comet_knuckle"
  | "anchor_mace"
  | "serpent_cord"
  | "mirror_yoyo";

export interface WeaponDef {
  id: WeaponId;
  name: string;
  title: string;
  description: string;
  trait: string;
  tactics: string;
  reach: number;
  headRadius: number;
  damageMul: number;
  orbitMul: number;
  color: number;
  physics?: "single" | "multi_head" | "double_pendulum";
  headCount?: number;
  secondaryReachMul?: number;
  secondaryDamageMul?: number;
  secondaryColor?: number;
  meleeArcRadius?: number;
  meleeDamageMul?: number;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  chain_core: {
    id: "chain_core",
    name: "Cursed Chain",
    title: "呪鎖鉄球",
    description: "標準的な鎖鉄球。慣性を読みやすく、どのジョブでも安定して敵群を削れる。",
    trait: "標準 / 安定軌道",
    tactics: "横移動で鉄球を流し、敵の列に斜めから当てる。",
    reach: 72,
    headRadius: 11,
    damageMul: 1,
    orbitMul: 1,
    color: 0xffd166,
    physics: "single",
  },
  twin_flail: {
    id: "twin_flail",
    name: "Twin Flails",
    title: "双子連枷",
    description: "二つの頭が時間差で回る連枷。単発火力は低いが、雑魚処理とヒット数が伸びる。",
    trait: "多段 / 広域処理",
    tactics: "敵を円周上に集め、片方が外れてももう片方で拾う。",
    reach: 66,
    headRadius: 10,
    damageMul: 0.9,
    orbitMul: 1.2,
    color: 0x79c7ff,
    physics: "multi_head",
    headCount: 2,
    secondaryDamageMul: 0.68,
    secondaryColor: 0x9de7ff,
  },
  double_pendulum: {
    id: "double_pendulum",
    name: "Double Pendulum",
    title: "二重振り子鎖",
    description: "親子二段で暴れる高難度武器。軌道は荒いが、重なった時の破壊力が高い。",
    trait: "二重振り子 / 暴走火力",
    tactics: "急旋回で先端を遅らせ、二つの打点を同じ群れに重ねる。",
    reach: 84,
    headRadius: 9,
    damageMul: 0.94,
    orbitMul: 1.08,
    color: 0x51d6ff,
    physics: "double_pendulum",
    headCount: 2,
    secondaryReachMul: 0.72,
    secondaryDamageMul: 0.78,
    secondaryColor: 0xffd166,
  },
  pulse_bow: {
    id: "pulse_bow",
    name: "Banner Sling",
    title: "戦旗投げ紐",
    description: "長めの紐で安全圏から削る武器。火力よりもリーチと扱いやすさを優先する。",
    trait: "長射程 / 安全運用",
    tactics: "敵の外周をなぞり、前に出すぎず経験値回収へつなげる。",
    reach: 86,
    headRadius: 9,
    damageMul: 0.96,
    orbitMul: 1.12,
    color: 0xffe06b,
    physics: "single",
  },
  void_staff: {
    id: "void_staff",
    name: "Grave Staff",
    title: "墓標の杖",
    description: "重い一撃に寄せた墓標武器。回転は鈍いがボスや硬い敵を砕きやすい。",
    trait: "重打 / ボス向き",
    tactics: "短く切り返して速度を作り、先端を硬い敵へ通す。",
    reach: 94,
    headRadius: 13,
    damageMul: 1.24,
    orbitMul: 0.86,
    color: 0xb56cff,
    physics: "single",
  },
  comet_knuckle: {
    id: "comet_knuckle",
    name: "Meteor Gauntlet",
    title: "流星籠手",
    description: "近接半円斬撃を持つ籠手。進行方向へ踏み込むほど斬撃と鎖が同時に刺さる。",
    trait: "近接斬撃 / 高速回転",
    tactics: "敵の横をすり抜けながら前方半円で切り払い、鎖で追撃する。",
    reach: 56,
    headRadius: 12,
    damageMul: 1.08,
    orbitMul: 1.34,
    color: 0xff5f8f,
    physics: "single",
    meleeArcRadius: 58,
    meleeDamageMul: 0.74,
  },
  anchor_mace: {
    id: "anchor_mace",
    name: "Oath Anchor",
    title: "誓約の錨",
    description: "重い錨と短い近接斬撃を併せ持つ武器。鈍重だが一撃の期待値が高い。",
    trait: "重近接 / 制圧",
    tactics: "敵を引きつけ、進行方向の斬撃で押し返してから錨を当てる。",
    reach: 102,
    headRadius: 15,
    damageMul: 1.34,
    orbitMul: 0.72,
    color: 0xf6f0de,
    physics: "single",
    meleeArcRadius: 42,
    meleeDamageMul: 0.46,
  },
  serpent_cord: {
    id: "serpent_cord",
    name: "Serpent Cord",
    title: "蛇腹鎖",
    description: "長くしなる蛇腹鎖。遠心力が乗ると広い角度から敵を撫で切る。",
    trait: "超射程 / しなり",
    tactics: "大きく回り込み、長い軌道を敵群の逃げ道に置く。",
    reach: 112,
    headRadius: 9,
    damageMul: 0.88,
    orbitMul: 1.42,
    color: 0x68f7a3,
    physics: "single",
  },
  mirror_yoyo: {
    id: "mirror_yoyo",
    name: "Mirror Yoyo",
    title: "幻鏡ヨーヨー",
    description: "鏡像の頭を連れて走るヨーヨー。高速軌道と手数でスタイルゲージを維持しやすい。",
    trait: "鏡像 / 手数特化",
    tactics: "細かい切り返しで二つの軌道を交差させ、連続撃破を狙う。",
    reach: 78,
    headRadius: 10,
    damageMul: 0.98,
    orbitMul: 1.55,
    color: 0xa9f4ff,
    physics: "multi_head",
    headCount: 2,
    secondaryDamageMul: 0.52,
    secondaryColor: 0xff5f8f,
  },
};

export const WEAPON_ORDER: WeaponId[] = [
  "chain_core",
  "twin_flail",
  "double_pendulum",
  "pulse_bow",
  "void_staff",
  "comet_knuckle",
  "anchor_mace",
  "serpent_cord",
  "mirror_yoyo",
];
