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
    name: "Vanguard",
    title: "前線維持",
    hpMul: 1.22,
    speedMul: 0.96,
    damageMul: 1.08,
    snapMul: 1,
    color: 0x6ffed4,
  },
  shadow: {
    id: "shadow",
    name: "Shadow",
    title: "高速回避",
    hpMul: 0.92,
    speedMul: 1.18,
    damageMul: 1,
    snapMul: 1.08,
    color: 0x8bc5ff,
  },
  arcanist: {
    id: "arcanist",
    name: "Arcanist",
    title: "範囲制圧",
    hpMul: 0.98,
    speedMul: 1,
    damageMul: 1.18,
    snapMul: 0.96,
    color: 0xbca7ff,
  },
  reaver: {
    id: "reaver",
    name: "Reaver",
    title: "危険火力",
    hpMul: 1.04,
    speedMul: 1.07,
    damageMul: 1.12,
    snapMul: 1.14,
    color: 0xffbe78,
  },
  monk: {
    id: "monk",
    name: "Monk",
    title: "反射修行",
    hpMul: 1.1,
    speedMul: 1.04,
    damageMul: 1.03,
    snapMul: 1.12,
    color: 0xf5e36a,
  },
  courier: {
    id: "courier",
    name: "Courier",
    title: "高速配達",
    hpMul: 0.84,
    speedMul: 1.3,
    damageMul: 0.94,
    snapMul: 1.2,
    color: 0x43e2ff,
  },
  sentinel: {
    id: "sentinel",
    name: "Sentinel",
    title: "重装警備",
    hpMul: 1.42,
    speedMul: 0.84,
    damageMul: 1.1,
    snapMul: 0.94,
    color: 0xd9edf7,
  },
  breaker: {
    id: "breaker",
    name: "Breaker",
    title: "粉砕特化",
    hpMul: 1,
    speedMul: 0.98,
    damageMul: 1.32,
    snapMul: 0.9,
    color: 0xffcb6b,
  },
};

export const JOB_ORDER: JobId[] = ["vanguard", "shadow", "arcanist", "reaver", "monk", "courier", "sentinel", "breaker"];
