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
    name: "Antibody Chain",
    title: "標準抗体鎖",
    reach: 72,
    headRadius: 11,
    damageMul: 1,
    snapMul: 1,
    orbitMul: 1,
    color: 0xa6ff7a,
  },
  twin_flail: {
    id: "twin_flail",
    name: "Twin Cilia",
    title: "繊毛連打",
    reach: 66,
    headRadius: 10,
    damageMul: 0.9,
    snapMul: 1.16,
    orbitMul: 1.2,
    color: 0x72f5ff,
  },
  pulse_bow: {
    id: "pulse_bow",
    name: "Enzyme Sling",
    title: "酵素遠心",
    reach: 86,
    headRadius: 9,
    damageMul: 0.96,
    snapMul: 0.94,
    orbitMul: 1.12,
    color: 0xd8ff6d,
  },
  void_staff: {
    id: "void_staff",
    name: "Mito Staff",
    title: "重粒子核",
    reach: 94,
    headRadius: 13,
    damageMul: 1.24,
    snapMul: 0.86,
    orbitMul: 0.86,
    color: 0xc39bff,
  },
  comet_knuckle: {
    id: "comet_knuckle",
    name: "Vesicle Comet",
    title: "小胞爆速",
    reach: 56,
    headRadius: 12,
    damageMul: 1.08,
    snapMul: 1.28,
    orbitMul: 1.34,
    color: 0xff6f8f,
  },
  anchor_mace: {
    id: "anchor_mace",
    name: "Phage Anchor",
    title: "重装ファージ",
    reach: 102,
    headRadius: 15,
    damageMul: 1.34,
    snapMul: 0.78,
    orbitMul: 0.72,
    color: 0xe8f7ff,
  },
  serpent_cord: {
    id: "serpent_cord",
    name: "Peptide Serpent",
    title: "ペプチド蛇行",
    reach: 112,
    headRadius: 9,
    damageMul: 0.88,
    snapMul: 1.08,
    orbitMul: 1.42,
    color: 0x55ff9a,
  },
  mirror_yoyo: {
    id: "mirror_yoyo",
    name: "Mirror Antigen",
    title: "抗原反転",
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
