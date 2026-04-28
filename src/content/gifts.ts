export type GiftKind = "assault" | "treasure" | "wall" | "surge";

export interface GiftDef {
  kind: GiftKind;
  name: string;
  risk: string;
  reward: string;
}

export const GIFTS: Record<GiftKind, GiftDef> = {
  assault: {
    kind: "assault",
    name: "シナプス嵐",
    risk: "高",
    reward: "撃破スコア",
  },
  treasure: {
    kind: "treasure",
    name: "イオン小胞ラッシュ",
    risk: "中",
    reward: "ドロップ",
  },
  wall: {
    kind: "wall",
    name: "髄鞘壁封鎖",
    risk: "高",
    reward: "高倍率",
  },
  surge: {
    kind: "surge",
    name: "電荷過給",
    risk: "中",
    reward: "スナップ加速",
  },
};
