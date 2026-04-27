export interface NormalizedLiveEvent {
  id: string;
  type: string;
  sender: string;
  diamonds: number;
  label: string;
}

export function normalizeLiveEvent(raw: unknown): NormalizedLiveEvent {
  const source = typeof raw === "object" && raw ? (raw as Record<string, unknown>) : {};
  const nestedGift = typeof source.gift === "object" && source.gift ? (source.gift as Record<string, unknown>) : {};
  const type = String(source.eventType || source.type || (source.gift ? "gift" : "gift")).toLowerCase();
  const sender = String(source.sender || source.uniqueId || source.nickname || source.user || "viewer").slice(0, 32);
  const diamondCandidates = [
    source.diamonds,
    source.diamondCount,
    source.diamond_count,
    source.value,
    nestedGift.diamonds,
    nestedGift.diamondCount,
    nestedGift.value,
  ];
  const diamonds = Math.max(1, Math.round(firstFinite(diamondCandidates, fallbackDiamonds(type))));
  const repeat = Math.max(1, Math.round(firstFinite([source.repeatCount, nestedGift.repeatCount], 1)));
  const id = String(source.id || source.eventId || source.messageId || `${type}:${sender}:${Date.now()}:${Math.random()}`);
  const label = String(source.giftName || nestedGift.name || source.label || type).slice(0, 40);
  return {
    id,
    type,
    sender,
    diamonds: diamonds * repeat,
    label,
  };
}

function firstFinite(values: unknown[], fallback: number): number {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return fallback;
}

function fallbackDiamonds(type: string): number {
  if (type.includes("sub") || type.includes("member")) return 22;
  if (type.includes("share")) return 2;
  if (type.includes("follow")) return 1;
  if (type.includes("like")) return 1;
  if (type.includes("chat") || type.includes("comment")) return 1;
  return 3;
}
