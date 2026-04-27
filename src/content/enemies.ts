export type EnemyRole = "chaser" | "stalker" | "bruiser" | "zoner";

export interface EnemyDef {
  role: EnemyRole;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  radius: number;
  score: number;
  color: number;
}

export const ENEMIES: Record<EnemyRole, EnemyDef> = {
  chaser: {
    role: "chaser",
    name: "Raider",
    hp: 50,
    speed: 68,
    damage: 7,
    radius: 9,
    score: 28,
    color: 0xff6e6e,
  },
  stalker: {
    role: "stalker",
    name: "Stalker",
    hp: 36,
    speed: 102,
    damage: 6,
    radius: 8,
    score: 34,
    color: 0xff5e93,
  },
  bruiser: {
    role: "bruiser",
    name: "Brute",
    hp: 118,
    speed: 45,
    damage: 11,
    radius: 13,
    score: 52,
    color: 0xff9a62,
  },
  zoner: {
    role: "zoner",
    name: "Wisp",
    hp: 62,
    speed: 58,
    damage: 8,
    radius: 10,
    score: 46,
    color: 0xc891ff,
  },
};

export const ENEMY_ROLES: EnemyRole[] = ["chaser", "stalker", "bruiser", "zoner"];
