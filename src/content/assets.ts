import type { EnemyRole } from "./enemies";
import type { JobId } from "./jobs";
import type { WeaponId } from "./weapons";

const pixel = (name: string) => `${import.meta.env.BASE_URL}assets/pixel/${name}`;

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
