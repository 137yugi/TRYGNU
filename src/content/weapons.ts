export type WeaponId =
  | "chain_core"
  | "twin_flail"
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
  reach: number;
  headRadius: number;
  damageMul: number;
  snapMul: number;
  orbitMul: number;
  color: number;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  chain_core: {
    id: "chain_core",
    name: "Chain Core",
    title: "標準ヌンチャク",
    reach: 72,
    headRadius: 11,
    damageMul: 1,
    snapMul: 1,
    orbitMul: 1,
    color: 0xf4c66f,
  },
  twin_flail: {
    id: "twin_flail",
    name: "Twin Flail",
    title: "連打特化",
    reach: 66,
    headRadius: 10,
    damageMul: 0.9,
    snapMul: 1.16,
    orbitMul: 1.2,
    color: 0x7de5ff,
  },
  pulse_bow: {
    id: "pulse_bow",
    name: "Pulse Bow",
    title: "遠心射撃",
    reach: 86,
    headRadius: 9,
    damageMul: 0.96,
    snapMul: 0.94,
    orbitMul: 1.12,
    color: 0x9fff9d,
  },
  void_staff: {
    id: "void_staff",
    name: "Void Staff",
    title: "重い一撃",
    reach: 94,
    headRadius: 13,
    damageMul: 1.24,
    snapMul: 0.86,
    orbitMul: 0.86,
    color: 0xd8a6ff,
  },
  comet_knuckle: {
    id: "comet_knuckle",
    name: "Comet Knuckle",
    title: "短距離爆速",
    reach: 56,
    headRadius: 12,
    damageMul: 1.08,
    snapMul: 1.28,
    orbitMul: 1.34,
    color: 0xff604c,
  },
  anchor_mace: {
    id: "anchor_mace",
    name: "Anchor Mace",
    title: "重量制圧",
    reach: 102,
    headRadius: 15,
    damageMul: 1.34,
    snapMul: 0.78,
    orbitMul: 0.72,
    color: 0xd9edf7,
  },
  serpent_cord: {
    id: "serpent_cord",
    name: "Serpent Cord",
    title: "長鎖蛇行",
    reach: 112,
    headRadius: 9,
    damageMul: 0.88,
    snapMul: 1.08,
    orbitMul: 1.42,
    color: 0x45e07c,
  },
  mirror_yoyo: {
    id: "mirror_yoyo",
    name: "Mirror Yoyo",
    title: "反転軌道",
    reach: 78,
    headRadius: 10,
    damageMul: 0.98,
    snapMul: 1.22,
    orbitMul: 1.55,
    color: 0x8ed8ff,
  },
};

export const WEAPON_ORDER: WeaponId[] = [
  "chain_core",
  "twin_flail",
  "pulse_bow",
  "void_staff",
  "comet_knuckle",
  "anchor_mace",
  "serpent_cord",
  "mirror_yoyo",
];
