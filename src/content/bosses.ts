export type BossId = "iron_monk" | "signal_oni";

export interface BossDef {
  id: BossId;
  name: string;
  title: string;
  hp: number;
  speed: number;
  damage: number;
  radius: number;
  color: number;
}

export const BOSSES: Record<BossId, BossDef> = {
  iron_monk: {
    id: "iron_monk",
    name: "Cytokine Titan",
    title: "炎症暴走",
    hp: 2150,
    speed: 42,
    damage: 14,
    radius: 24,
    color: 0xffd35a,
  },
  signal_oni: {
    id: "signal_oni",
    name: "Necro Signal",
    title: "壊死信号",
    hp: 1900,
    speed: 50,
    damage: 13,
    radius: 22,
    color: 0xff5aa8,
  },
};

export const BOSS_ORDER: BossId[] = ["iron_monk", "signal_oni"];
