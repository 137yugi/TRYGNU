export const WORLD = {
  width: 640,
  height: 360,
  layout: "landscape" as "landscape" | "portrait",
  safePad: 14,
  playTopPad: 14,
  playBottomPad: 14,
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

export function configureWorldForViewport(width: number, height: number): void {
  const safeWidth = Math.max(320, Math.round(width || 0));
  const safeHeight = Math.max(320, Math.round(height || 0));
  const portrait = safeHeight > safeWidth * 1.12;
  WORLD.layout = portrait ? "portrait" : "landscape";
  if (!portrait) {
    WORLD.width = 640;
    WORLD.height = 360;
    WORLD.safePad = 14;
    WORLD.playTopPad = 14;
    WORLD.playBottomPad = 14;
    return;
  }
  const worldWidth = Math.round(Math.min(Math.max(safeWidth, 360), safeWidth >= 700 ? 560 : 430));
  const worldHeight = Math.round(Math.min(Math.max(worldWidth * (safeHeight / safeWidth), 680), safeWidth >= 700 ? 900 : 960));
  WORLD.width = worldWidth;
  WORLD.height = worldHeight;
  WORLD.safePad = 16;
  WORLD.playTopPad = 42;
  WORLD.playBottomPad = 68;
}

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
  moveWhip: 0.42,
  moveTorque: 18,
  idleTorque: 5,
  phantomMoveWhip: 0.34,
  phantomMoveTorque: 15,
  phantomIdleTorque: 4,
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
  levelAutoPick: 28,
  pickupAutoDiscard: 22,
  giftBanner: 4.4,
  liveQueueReleaseDelay: 2.4,
  liveQueueReleaseGap: 1.15,
};

export const COLORS = {
  player: 0xf0e6c8,
  playerDark: 0x66533b,
  nunchaku: 0xffd166,
  nunchakuHead: 0xfff3c4,
  enemy: 0xff5f8f,
  brute: 0xc7a56a,
  stalker: 0x51d6ff,
  zoner: 0xb56cff,
  boss: 0xff4f7a,
  danger: 0xff334f,
  legendary: 0xffd84d,
  gift: 0x51d6ff,
  wall: 0x8f6b3f,
};
