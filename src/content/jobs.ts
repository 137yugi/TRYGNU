export type JobId = "vanguard" | "shadow" | "arcanist" | "reaver" | "monk" | "courier" | "sentinel" | "breaker";

export interface JobDef {
  id: JobId;
  name: string;
  title: string;
  hpMul: number;
  speedMul: number;
  damageMul: number;
  snapMul: number;
  color: number;
}

export const JOBS: Record<JobId, JobDef> = {
  vanguard: {
    id: "vanguard",
    name: "Axon Guard",
    title: "軸索防衛",
    hpMul: 1.22,
    speedMul: 0.96,
    damageMul: 1.08,
    snapMul: 1,
    color: 0xd7dcff,
  },
  shadow: {
    id: "shadow",
    name: "Axon Runner",
    title: "軸索疾走",
    hpMul: 0.92,
    speedMul: 1.18,
    damageMul: 1,
    snapMul: 1.08,
    color: 0x16e7ff,
  },
  arcanist: {
    id: "arcanist",
    name: "Synapse Caster",
    title: "シナプス放電",
    hpMul: 0.98,
    speedMul: 1,
    damageMul: 1.18,
    snapMul: 0.96,
    color: 0x8b5cff,
  },
  reaver: {
    id: "reaver",
    name: "Storm Reaver",
    title: "電脈過負荷",
    hpMul: 1.04,
    speedMul: 1.07,
    damageMul: 1.12,
    snapMul: 1.14,
    color: 0xff4fd8,
  },
  monk: {
    id: "monk",
    name: "Glia Monk",
    title: "神経膠反射",
    hpMul: 1.1,
    speedMul: 1.04,
    damageMul: 1.03,
    snapMul: 1.12,
    color: 0x57ffb3,
  },
  courier: {
    id: "courier",
    name: "Impulse Courier",
    title: "活動電位伝達",
    hpMul: 0.84,
    speedMul: 1.3,
    damageMul: 0.94,
    snapMul: 1.2,
    color: 0x3487ff,
  },
  sentinel: {
    id: "sentinel",
    name: "Signal Bastion",
    title: "髄鞘要塞",
    hpMul: 1.42,
    speedMul: 0.84,
    damageMul: 1.1,
    snapMul: 0.94,
    color: 0xf7fbff,
  },
  breaker: {
    id: "breaker",
    name: "Ion Breaker",
    title: "イオン破砕",
    hpMul: 1,
    speedMul: 0.98,
    damageMul: 1.32,
    snapMul: 0.9,
    color: 0xff475e,
  },
};

export const JOB_ORDER: JobId[] = ["vanguard", "shadow", "arcanist", "reaver", "monk", "courier", "sentinel", "breaker"];
