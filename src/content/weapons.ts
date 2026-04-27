export type WeaponId = "chain_core" | "twin_flail" | "pulse_bow" | "void_staff";

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
};

export const WEAPON_ORDER: WeaponId[] = ["chain_core", "twin_flail", "pulse_bow", "void_staff"];
