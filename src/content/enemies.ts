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
    name: "Goblin Heckler",
    hp: 122,
    speed: 68,
    damage: 7,
    radius: 9,
    score: 28,
    color: 0xff5f8f,
  },
  stalker: {
    role: "stalker",
    name: "Bat Fanatic",
    hp: 88,
    speed: 102,
    damage: 6,
    radius: 8,
    score: 34,
    color: 0x51d6ff,
  },
  bruiser: {
    role: "bruiser",
    name: "Ogre Sponsor",
    hp: 286,
    speed: 45,
    damage: 11,
    radius: 13,
    score: 52,
    color: 0xffd166,
  },
  zoner: {
    role: "zoner",
    name: "Ad Imp",
    hp: 152,
    speed: 58,
    damage: 8,
    radius: 10,
    score: 46,
    color: 0xb56cff,
  },
};

export const ENEMY_ROLES: EnemyRole[] = ["chaser", "stalker", "bruiser", "zoner"];
