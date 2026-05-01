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
  orbitMul: number;
  color: number;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  chain_core: {
    id: "chain_core",
    name: "Cursed Chain",
    title: "呪鎖鉄球",
    reach: 72,
    headRadius: 11,
    damageMul: 1,
    orbitMul: 1,
    color: 0xffd166,
  },
  twin_flail: {
    id: "twin_flail",
    name: "Twin Flails",
    title: "双子連枷",
    reach: 66,
    headRadius: 10,
    damageMul: 0.9,
    orbitMul: 1.2,
    color: 0x79c7ff,
  },
  pulse_bow: {
    id: "pulse_bow",
    name: "Banner Sling",
    title: "戦旗投げ紐",
    reach: 86,
    headRadius: 9,
    damageMul: 0.96,
    orbitMul: 1.12,
    color: 0xffe06b,
  },
  void_staff: {
    id: "void_staff",
    name: "Grave Staff",
    title: "墓標の杖",
    reach: 94,
    headRadius: 13,
    damageMul: 1.24,
    orbitMul: 0.86,
    color: 0xb56cff,
  },
  comet_knuckle: {
    id: "comet_knuckle",
    name: "Meteor Gauntlet",
    title: "流星籠手",
    reach: 56,
    headRadius: 12,
    damageMul: 1.08,
    orbitMul: 1.34,
    color: 0xff5f8f,
  },
  anchor_mace: {
    id: "anchor_mace",
    name: "Oath Anchor",
    title: "誓約の錨",
    reach: 102,
    headRadius: 15,
    damageMul: 1.34,
    orbitMul: 0.72,
    color: 0xf6f0de,
  },
  serpent_cord: {
    id: "serpent_cord",
    name: "Serpent Cord",
    title: "蛇腹鎖",
    reach: 112,
    headRadius: 9,
    damageMul: 0.88,
    orbitMul: 1.42,
    color: 0x68f7a3,
  },
  mirror_yoyo: {
    id: "mirror_yoyo",
    name: "Mirror Yoyo",
    title: "幻鏡ヨーヨー",
    reach: 78,
    headRadius: 10,
    damageMul: 0.98,
    orbitMul: 1.55,
    color: 0xa9f4ff,
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
