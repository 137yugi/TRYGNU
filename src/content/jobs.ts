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
    name: "Shield Knight",
    title: "盾の騎士",
    hpMul: 1.22,
    speedMul: 0.96,
    damageMul: 1.08,
    snapMul: 1,
    color: 0xf0e6c8,
  },
  shadow: {
    id: "shadow",
    name: "Crow Rogue",
    title: "影鴉の盗賊",
    hpMul: 0.92,
    speedMul: 1.18,
    damageMul: 1,
    snapMul: 1.08,
    color: 0x51d6ff,
  },
  arcanist: {
    id: "arcanist",
    name: "Rune Witch",
    title: "呪文の魔女",
    hpMul: 0.98,
    speedMul: 1,
    damageMul: 1.18,
    snapMul: 0.96,
    color: 0xb56cff,
  },
  reaver: {
    id: "reaver",
    name: "Blood Reaver",
    title: "流血の略奪者",
    hpMul: 1.04,
    speedMul: 1.07,
    damageMul: 1.12,
    snapMul: 1.14,
    color: 0xff4f7a,
  },
  monk: {
    id: "monk",
    name: "Bell Monk",
    title: "鐘鳴り修道士",
    hpMul: 1.1,
    speedMul: 1.04,
    damageMul: 1.03,
    snapMul: 1.12,
    color: 0x6cff9f,
  },
  courier: {
    id: "courier",
    name: "Banner Courier",
    title: "戦旗の伝令",
    hpMul: 0.84,
    speedMul: 1.3,
    damageMul: 0.94,
    snapMul: 1.2,
    color: 0x47a3ff,
  },
  sentinel: {
    id: "sentinel",
    name: "Iron Bastion",
    title: "鉄壁の守人",
    hpMul: 1.42,
    speedMul: 0.84,
    damageMul: 1.1,
    snapMul: 0.94,
    color: 0xf6f0de,
  },
  breaker: {
    id: "breaker",
    name: "Gate Breaker",
    title: "門砕き",
    hpMul: 1,
    speedMul: 0.98,
    damageMul: 1.32,
    snapMul: 0.9,
    color: 0xff5b3d,
  },
};

export const JOB_ORDER: JobId[] = ["vanguard", "shadow", "arcanist", "reaver", "monk", "courier", "sentinel", "breaker"];
