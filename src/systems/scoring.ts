import type { EconomyState } from "../sim/types";

export interface ScoreInput {
  time: number;
  kills: number;
  wave: number;
  hitsTaken: number;
  cleared: boolean;
  economy: EconomyState;
  bossDefeated: boolean;
  bossKills?: number;
}

export function computeScore(input: ScoreInput): number {
  const survival = Math.round(input.time * 18);
  const killScore = input.kills * 64;
  const waveScore = input.wave * 190;
  const giftScore = input.economy.giftValue * 5;
  const legendaryScore = input.economy.legendary * 750;
  const clearScore = input.cleared ? 1800 : 0;
  const bossScore = (input.bossKills || (input.bossDefeated ? 1 : 0)) * 1400;
  const hitPenalty = Math.min(1800, input.hitsTaken * 52);
  return Math.max(0, survival + killScore + waveScore + giftScore + legendaryScore + clearScore + bossScore - hitPenalty);
}

export function saveLocalScore(score: number, payload: Record<string, unknown>): void {
  try {
    const key = "nunchaku_overdrive_scores_v1";
    const existing = JSON.parse(localStorage.getItem(key) || "[]") as unknown[];
    const rows = Array.isArray(existing) ? existing : [];
    rows.push({ score, at: Date.now(), ...payload });
    rows.sort((a, b) => Number((b as { score?: number }).score || 0) - Number((a as { score?: number }).score || 0));
    localStorage.setItem(key, JSON.stringify(rows.slice(0, 20)));
  } catch {
    // Local storage is optional in private browsing and embedded contexts.
  }
}
