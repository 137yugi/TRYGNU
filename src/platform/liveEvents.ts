export type LiveEventKind = "gift" | "like" | "chat" | "follow" | "share" | "ad_obstacle";

export interface NormalizedLiveEvent {
  id: string;
  kind: LiveEventKind;
  type: string;
  sender: string;
  diamonds: number;
  label: string;
}

export function normalizeLiveEvent(raw: unknown): NormalizedLiveEvent {
  const source = typeof raw === "object" && raw ? (raw as Record<string, unknown>) : {};
  const nestedGift = typeof source.gift === "object" && source.gift ? (source.gift as Record<string, unknown>) : {};
  const rawType = String(source.eventType || source.type || (source.gift ? "gift" : "gift")).toLowerCase();
  const rawLabel = String(source.giftName || nestedGift.name || source.label || rawType).slice(0, 40);
  const kind = classifyLiveEventKind(rawType, rawLabel, Boolean(source.gift));
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
  const diamonds = Math.min(9999, Math.max(1, Math.round(firstFinite(diamondCandidates, fallbackDiamonds(kind, rawType, rawLabel)))));
  const repeat = Math.min(99, Math.max(1, Math.round(firstFinite([source.repeatCount, nestedGift.repeatCount], 1))));
  const id = String(source.id || source.eventId || source.messageId || `${kind}:${sender}:${Date.now()}:${Math.random()}`);
  return {
    id,
    kind,
    type: rawType,
    sender,
    diamonds: Math.min(9999, diamonds * repeat),
    label: rawLabel,
  };
}

function firstFinite(values: unknown[], fallback: number): number {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return fallback;
}

function classifyLiveEventKind(type: string, label: string, hasGiftObject: boolean): LiveEventKind {
  const text = `${type} ${label}`.toLowerCase();
  if (text.includes("ad_obstacle") || text.includes("ad_obstruction") || text.includes("advert") || text === "ad ad" || text.startsWith("ad ")) return "ad_obstacle";
  if (type.includes("like")) return "like";
  if (type.includes("chat") || type.includes("comment") || type.includes("message")) return "chat";
  if (type.includes("follow")) return "follow";
  if (type.includes("share")) return "share";
  if (hasGiftObject || type.includes("gift") || type.includes("sub") || type.includes("member")) return "gift";
  return "gift";
}

function fallbackDiamonds(kind: LiveEventKind, type: string, label: string): number {
  const text = `${type} ${label}`.toLowerCase();
  if (text.includes("sub") || text.includes("member")) return 22;
  if (kind === "gift") return 3;
  if (kind === "ad_obstacle") return 3;
  if (kind === "share") return 2;
  if (kind === "follow") return 1;
  if (kind === "like") return 1;
  if (kind === "chat") return 1;
  return 3;
}
