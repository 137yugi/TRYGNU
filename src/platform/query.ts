import type { QueryOptions } from "../sim/types";

export function parseQueryOptions(): QueryOptions {
  const query = new URLSearchParams(window.location.search);
  const legacyBossDebug = query.get("phase3_debug") === "1";
  const balanceRaw = (query.get("balance") || query.get("boss_phase3") || "A").toUpperCase();
  return {
    seed: query.get("seed") || `daily-${new Date().toISOString().slice(0, 10)}`,
    bossDebug: query.get("boss_debug") === "1" || legacyBossDebug,
    balanceProfile: balanceRaw === "B" ? "B" : "A",
  };
}
