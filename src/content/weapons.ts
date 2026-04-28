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
    name: "Storm Conduit",
    title: "電脈導線",
    reach: 72,
    headRadius: 11,
    damageMul: 1,
    snapMul: 1,
    orbitMul: 1,
    color: 0x16e7ff,
  },
  twin_flail: {
    id: "twin_flail",
    name: "Twin Dendrites",
    title: "樹状突起連打",
    reach: 66,
    headRadius: 10,
    damageMul: 0.9,
    snapMul: 1.16,
    orbitMul: 1.2,
    color: 0x49a8ff,
  },
  pulse_bow: {
    id: "pulse_bow",
    name: "Ion Sling",
    title: "イオン遠心",
    reach: 86,
    headRadius: 9,
    damageMul: 0.96,
    snapMul: 0.94,
    orbitMul: 1.12,
    color: 0xffd84d,
  },
  void_staff: {
    id: "void_staff",
    name: "Neuro Staff",
    title: "神経核重打",
    reach: 94,
    headRadius: 13,
    damageMul: 1.24,
    snapMul: 0.86,
    orbitMul: 0.86,
    color: 0x8b5cff,
  },
  comet_knuckle: {
    id: "comet_knuckle",
    name: "Synapse Comet",
    title: "シナプス爆速",
    reach: 56,
    headRadius: 12,
    damageMul: 1.08,
    snapMul: 1.28,
    orbitMul: 1.34,
    color: 0xff4fd8,
  },
  anchor_mace: {
    id: "anchor_mace",
    name: "Axon Anchor",
    title: "重装髄鞘",
    reach: 102,
    headRadius: 15,
    damageMul: 1.34,
    snapMul: 0.78,
    orbitMul: 0.72,
    color: 0xe8f7ff,
  },
  serpent_cord: {
    id: "serpent_cord",
    name: "Axon Serpent",
    title: "軸索蛇行",
    reach: 112,
    headRadius: 9,
    damageMul: 0.88,
    snapMul: 1.08,
    orbitMul: 1.42,
    color: 0x57ffb3,
  },
  mirror_yoyo: {
    id: "mirror_yoyo",
    name: "Mirror Synapse",
    title: "シナプス反転",
    reach: 78,
    headRadius: 10,
    damageMul: 0.98,
    snapMul: 1.22,
    orbitMul: 1.55,
    color: 0x9cf0ff,
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
