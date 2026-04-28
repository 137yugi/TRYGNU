export const WORLD = {
  width: 640,
  height: 360,
  safePad: 14,
  baseEnemyCap: 26,
  maxEnemyCap: 72,
  waveSeconds: 16,
  mutationWave: 10,
  bossWave: 15,
  bossInterval: 10,
  baseWaveTarget: 4,
  waveTargetGrowth: 2,
  waveIntermission: 0.9,
};

export const PLAYER_BALANCE = {
  baseHp: 150,
  baseSpeed: 212,
  invulnAfterHit: 0.72,
  touchDamageCapRatio: 0.14,
  selfHitDamage: 4,
};

export const NUNCHAKU_BALANCE = {
  restLength: 72,
  maxLength: 132,
  headRadius: 11,
  spring: 21,
  damping: 0.985,
  snapImpulse: 640,
  snapCooldown: 2.8,
  baseDamage: 18,
  speedDamage: 0.14,
  overdriveSparkSpeed: 260,
  overdriveDamageMul: 1.28,
  selfHitSpeed: 330,
};

export const DIRECTOR_BALANCE = {
  spawnStart: 0.72,
  spawnMin: 0.16,
  threatRecoverAt: 138,
  threatHuntAt: 76,
};

export const DROP_BALANCE = {
  xpPullRange: 74,
  itemChance: 0.09,
  legendaryChance: 0.008,
  legendaryPitySeconds: 58,
};

export const UI_TIMERS = {
  levelAutoPick: 0,
  pickupAutoDiscard: 0,
  giftBanner: 4.4,
  liveQueueReleaseDelay: 2.4,
  liveQueueReleaseGap: 1.15,
};

export const COLORS = {
  player: 0xd7dcff,
  playerDark: 0x53577e,
  nunchaku: 0x16e7ff,
  nunchakuHead: 0xf7fbff,
  enemy: 0xff4fd8,
  brute: 0xa7a2c8,
  stalker: 0xff4fd8,
  zoner: 0x8b5cff,
  boss: 0xff61ff,
  danger: 0xff334f,
  legendary: 0xffd84d,
  gift: 0x16e7ff,
  wall: 0x6f78aa,
};
