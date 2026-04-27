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
    name: "強襲",
    risk: "高",
    reward: "撃破スコア",
  },
  treasure: {
    kind: "treasure",
    name: "宝箱ラッシュ",
    risk: "中",
    reward: "ドロップ",
  },
  wall: {
    kind: "wall",
    name: "岩壁封鎖",
    risk: "高",
    reward: "高倍率",
  },
  surge: {
    kind: "surge",
    name: "急襲ブースト",
    risk: "中",
    reward: "スナップ加速",
  },
};
