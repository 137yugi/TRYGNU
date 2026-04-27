import { WORLD } from "../content/balance";
import type { Vec2 } from "./types";

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function length(x: number, y: number): number {
  return Math.hypot(x, y);
}

export function normalize(x: number, y: number): Vec2 {
  const d = Math.hypot(x, y);
  if (d <= 0.0001) return { x: 1, y: 0 };
  return { x: x / d, y: y / d };
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function distancePointToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 0.0001) return Math.hypot(px - ax, py - ay);
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / lenSq, 0, 1);
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

export function clampToWorld(v: Vec2, radius: number): void {
  v.x = clamp(v.x, WORLD.safePad + radius, WORLD.width - WORLD.safePad - radius);
  v.y = clamp(v.y, WORLD.safePad + radius, WORLD.height - WORLD.safePad - radius);
}

export function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
