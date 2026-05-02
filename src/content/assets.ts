import type { EnemyRole } from "./enemies";
import { BODY_BASES, NUNCHAKU_BASES } from "./equipment";
import type { JobId } from "./jobs";
import type { WeaponId } from "./weapons";
import type { EquipmentSlot } from "../sim/types";

const pixel = (name: string) => `${import.meta.env.BASE_URL}assets/pixel/${name}`;
const generated = (name: string) => `${import.meta.env.BASE_URL}assets/generated/${name}`;
const equipmentImage = (assetId: string) => generated(`equipment-${assetId}.png`);
const equipmentKey = (assetId: string) => `equipment_${assetId.replaceAll("-", "_")}`;

export const PIXEL_ASSETS = [
  ["arena_map", generated("arena-map.png")],
  ["floor_tile", pixel("floor-tile.svg")],
  ["drop_xp", pixel("drop-xp.svg")],
  ["drop_item", pixel("drop-item.svg")],
  ["drop_legendary", pixel("drop-legendary.svg")],
  ["enemy_chaser", generated("enemy-heckler.png")],
  ["enemy_stalker", generated("enemy-heckler.png")],
  ["enemy_bruiser", generated("enemy-sponsor.png")],
  ["enemy_zoner", generated("boss-mimic.png")],
  ["enemy_boss", generated("boss-dragon.png")],
  ["hero_vanguard", generated("hero-knight.png")],
  ["hero_shadow", generated("hero-rogue.png")],
  ["hero_arcanist", generated("hero-witch.png")],
  ["hero_reaver", generated("hero-knight.png")],
  ["hero_monk", generated("hero-monk.png")],
  ["hero_courier", generated("hero-rogue.png")],
  ["hero_sentinel", generated("hero-knight.png")],
  ["hero_breaker", generated("hero-monk.png")],
  ["weapon_chain_core", generated("weapon-chain.png")],
  ["weapon_twin_flail", generated("weapon-flail.png")],
  ["weapon_double_pendulum", generated("weapon-chain.png")],
  ["weapon_pulse_bow", generated("item-relic.png")],
  ["weapon_void_staff", generated("item-relic.png")],
  ["weapon_comet_knuckle", generated("weapon-chain.png")],
  ["weapon_anchor_mace", generated("weapon-flail.png")],
  ["weapon_serpent_cord", generated("weapon-chain.png")],
  ["weapon_mirror_yoyo", generated("item-relic.png")],
  ...[...BODY_BASES, ...NUNCHAKU_BASES].map((base) => [equipmentKey(base.assetId), equipmentImage(base.assetId)] as const),
] as const;

export const JOB_ASSET: Record<JobId, string> = {
  vanguard: "hero_vanguard",
  shadow: "hero_shadow",
  arcanist: "hero_arcanist",
  reaver: "hero_reaver",
  monk: "hero_monk",
  courier: "hero_courier",
  sentinel: "hero_sentinel",
  breaker: "hero_breaker",
};

export const WEAPON_ASSET: Record<WeaponId, string> = {
  chain_core: "weapon_chain_core",
  twin_flail: "weapon_twin_flail",
  double_pendulum: "weapon_double_pendulum",
  pulse_bow: "weapon_pulse_bow",
  void_staff: "weapon_void_staff",
  comet_knuckle: "weapon_comet_knuckle",
  anchor_mace: "weapon_anchor_mace",
  serpent_cord: "weapon_serpent_cord",
  mirror_yoyo: "weapon_mirror_yoyo",
};

export const ENEMY_ASSET: Record<EnemyRole, string> = {
  chaser: "enemy_chaser",
  stalker: "enemy_stalker",
  bruiser: "enemy_bruiser",
  zoner: "enemy_zoner",
};

export const EQUIPMENT_ASSET_URLS: Record<string, string> = Object.fromEntries(
  [...BODY_BASES, ...NUNCHAKU_BASES].map((base) => [base.assetId, equipmentImage(base.assetId)])
);

const DEFAULT_EQUIPMENT_ASSET: Record<EquipmentSlot, string> = {
  body: "body-neuro-shell",
  nunchaku: "chain-storm-conduit",
};

export function equipmentAssetUrl(assetId?: string | null, slot: EquipmentSlot = "nunchaku"): string {
  const fallback = DEFAULT_EQUIPMENT_ASSET[slot];
  return assetId ? EQUIPMENT_ASSET_URLS[assetId] || EQUIPMENT_ASSET_URLS[fallback] : EQUIPMENT_ASSET_URLS[fallback];
}

export function equipmentAssetKey(assetId?: string | null, slot: EquipmentSlot = "nunchaku"): string {
  return assetId ? equipmentKey(assetId) : equipmentKey(DEFAULT_EQUIPMENT_ASSET[slot]);
}
