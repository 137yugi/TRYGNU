export type AdMediaType = "banner" | "video";
export type AdLane = "top" | "middle" | "bottom" | "random";
export type AdRarity = "common" | "rare" | "epic" | "legendary";

export interface AdDef {
  id: string;
  type: AdMediaType;
  brand: string;
  title: string;
  copy: string;
  weight: number;
  minWave: number;
  duration: number;
  lane: AdLane;
  speed: number;
  opacity: number;
  rarity: AdRarity;
}

export const AD_CATALOG: readonly AdDef[] = [
  {
    id: "banner-ion-drink",
    type: "banner",
    brand: "GUILD TONIC",
    title: "闘技場で補給",
    copy: "騎士団公認の赤瓶",
    weight: 34,
    minWave: 1,
    duration: 6.2,
    lane: "top",
    speed: 92,
    opacity: 0.56,
    rarity: "common",
  },
  {
    id: "banner-synapse-sale",
    type: "banner",
    brand: "BLACKSMITH SALE",
    title: "鎖と兜が半額",
    copy: "視界を横切る鍛冶屋広告",
    weight: 28,
    minWave: 1,
    duration: 7.4,
    lane: "bottom",
    speed: -78,
    opacity: 0.62,
    rarity: "common",
  },
  {
    id: "banner-neuro-bank",
    type: "banner",
    brand: "CROWN BANK",
    title: "賞金前借り審査中",
    copy: "長めの帯で中央視界を圧迫",
    weight: 16,
    minWave: 4,
    duration: 8,
    lane: "middle",
    speed: 64,
    opacity: 0.66,
    rarity: "rare",
  },
  {
    id: "video-glia-news",
    type: "video",
    brand: "ARENA NEWS",
    title: "速報: 呪鎖王が接近",
    copy: "動画風の魔導ニュース",
    weight: 14,
    minWave: 3,
    duration: 5.8,
    lane: "random",
    speed: -46,
    opacity: 0.68,
    rarity: "rare",
  },
  {
    id: "video-axon-stream",
    type: "video",
    brand: "BARD STREAM",
    title: "30秒で勝てる鎖術講座",
    copy: "再生バーつき動画広告",
    weight: 7,
    minWave: 7,
    duration: 7.2,
    lane: "middle",
    speed: 38,
    opacity: 0.72,
    rarity: "epic",
  },
  {
    id: "video-boss-sponsor",
    type: "video",
    brand: "DRAGON SPONSOR",
    title: "この闘技場は広告で動いています",
    copy: "高透明度の大型CM枠",
    weight: 3,
    minWave: 12,
    duration: 8.4,
    lane: "random",
    speed: -32,
    opacity: 0.76,
    rarity: "legendary",
  },
];
