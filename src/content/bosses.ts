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
    name: "Axon Thunderhead",
    title: "軸索雷嵐",
    hp: 2150,
    speed: 42,
    damage: 14,
    radius: 24,
    color: 0xff61ff,
  },
  signal_oni: {
    id: "signal_oni",
    name: "Synapse Devourer",
    title: "信号喰らい",
    hp: 1900,
    speed: 50,
    damage: 13,
    radius: 22,
    color: 0xff4fd8,
  },
};

export const BOSS_ORDER: BossId[] = ["iron_monk", "signal_oni"];
