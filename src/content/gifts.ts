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
    name: "観客乱入",
    risk: "高",
    reward: "撃破歓声",
  },
  treasure: {
    kind: "treasure",
    name: "宝箱投げ込み",
    risk: "中",
    reward: "戦利品",
  },
  wall: {
    kind: "wall",
    name: "呪い看板封鎖",
    risk: "高",
    reward: "歓声倍率",
  },
  surge: {
    kind: "surge",
    name: "スポットライト過熱",
    risk: "中",
    reward: "スナップ加速",
  },
};
