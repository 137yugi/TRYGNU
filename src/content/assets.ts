import type { EnemyRole } from "./enemies";
import { BODY_BASES, NUNCHAKU_BASES } from "./equipment";
import type { JobId } from "./jobs";
import type { WeaponId } from "./weapons";
import type { EquipmentSlot } from "../sim/types";

const pixel = (name: string) => `${import.meta.env.BASE_URL}assets/pixel/${name}`;
const equipmentPixel = (assetId: string) => pixel(`equipment-${assetId}.svg`);
const equipmentKey = (assetId: string) => `equipment_${assetId.replaceAll("-", "_")}`;

export const PIXEL_ASSETS = [
  ["floor_tile", pixel("floor-tile.svg")],
  ["drop_xp", pixel("drop-xp.svg")],
  ["drop_item", pixel("drop-item.svg")],
  ["drop_legendary", pixel("drop-legendary.svg")],
  ["enemy_chaser", pixel("enemy-chaser.svg")],
  ["enemy_stalker", pixel("enemy-stalker.svg")],
  ["enemy_bruiser", pixel("enemy-bruiser.svg")],
  ["enemy_zoner", pixel("enemy-zoner.svg")],
  ["enemy_boss", pixel("enemy-boss.svg")],
  ["hero_vanguard", pixel("hero-vanguard.svg")],
  ["hero_shadow", pixel("hero-shadow.svg")],
  ["hero_arcanist", pixel("hero-arcanist.svg")],
  ["hero_reaver", pixel("hero-reaver.svg")],
  ["hero_monk", pixel("hero-monk.svg")],
  ["hero_courier", pixel("hero-courier.svg")],
  ["hero_sentinel", pixel("hero-sentinel.svg")],
  ["hero_breaker", pixel("hero-breaker.svg")],
  ["weapon_chain_core", pixel("weapon-chain-core.svg")],
  ["weapon_twin_flail", pixel("weapon-twin-flail.svg")],
  ["weapon_pulse_bow", pixel("weapon-pulse-bow.svg")],
  ["weapon_void_staff", pixel("weapon-void-staff.svg")],
  ["weapon_comet_knuckle", pixel("weapon-comet-knuckle.svg")],
  ["weapon_anchor_mace", pixel("weapon-anchor-mace.svg")],
  ["weapon_serpent_cord", pixel("weapon-serpent-cord.svg")],
  ["weapon_mirror_yoyo", pixel("weapon-mirror-yoyo.svg")],
  ...[...BODY_BASES, ...NUNCHAKU_BASES].map((base) => [equipmentKey(base.assetId), equipmentPixel(base.assetId)] as const),
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
  [...BODY_BASES, ...NUNCHAKU_BASES].map((base) => [base.assetId, equipmentPixel(base.assetId)])
);

const DEFAULT_EQUIPMENT_ASSET: Record<EquipmentSlot, string> = {
  body: "body-membrane",
  nunchaku: "chain-antibody",
};

export function equipmentAssetUrl(assetId?: string | null, slot: EquipmentSlot = "nunchaku"): string {
  const fallback = DEFAULT_EQUIPMENT_ASSET[slot];
  return assetId ? EQUIPMENT_ASSET_URLS[assetId] || EQUIPMENT_ASSET_URLS[fallback] : EQUIPMENT_ASSET_URLS[fallback];
}

export function equipmentAssetKey(assetId?: string | null, slot: EquipmentSlot = "nunchaku"): string {
  return assetId ? equipmentKey(assetId) : equipmentKey(DEFAULT_EQUIPMENT_ASSET[slot]);
}
