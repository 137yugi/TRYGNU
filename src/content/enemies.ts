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
    name: "Spike Virion",
    hp: 50,
    speed: 68,
    damage: 7,
    radius: 9,
    score: 28,
    color: 0xff4d68,
  },
  stalker: {
    role: "stalker",
    name: "Needle Spore",
    hp: 36,
    speed: 102,
    damage: 6,
    radius: 8,
    score: 34,
    color: 0xff6fd3,
  },
  bruiser: {
    role: "bruiser",
    name: "Biofilm Hulk",
    hp: 118,
    speed: 45,
    damage: 11,
    radius: 13,
    score: 52,
    color: 0xffb45a,
  },
  zoner: {
    role: "zoner",
    name: "Prism Pathogen",
    hp: 62,
    speed: 58,
    damage: 8,
    radius: 10,
    score: 46,
    color: 0xb88cff,
  },
};

export const ENEMY_ROLES: EnemyRole[] = ["chaser", "stalker", "bruiser", "zoner"];
