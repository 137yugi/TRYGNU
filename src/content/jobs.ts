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
    name: "Membrane Guard",
    title: "細胞膜防衛",
    hpMul: 1.22,
    speedMul: 0.96,
    damageMul: 1.08,
    snapMul: 1,
    color: 0x55ff9a,
  },
  shadow: {
    id: "shadow",
    name: "T-Runner",
    title: "高速遊走",
    hpMul: 0.92,
    speedMul: 1.18,
    damageMul: 1,
    snapMul: 1.08,
    color: 0x7bdcff,
  },
  arcanist: {
    id: "arcanist",
    name: "Enzyme Caster",
    title: "酵素拡散",
    hpMul: 0.98,
    speedMul: 1,
    damageMul: 1.18,
    snapMul: 0.96,
    color: 0xd7ff70,
  },
  reaver: {
    id: "reaver",
    name: "Fever Reaver",
    title: "発熱火力",
    hpMul: 1.04,
    speedMul: 1.07,
    damageMul: 1.12,
    snapMul: 1.14,
    color: 0xff5d8f,
  },
  monk: {
    id: "monk",
    name: "Macrophage",
    title: "貪食反射",
    hpMul: 1.1,
    speedMul: 1.04,
    damageMul: 1.03,
    snapMul: 1.12,
    color: 0xffd56b,
  },
  courier: {
    id: "courier",
    name: "mRNA Courier",
    title: "信号伝達",
    hpMul: 0.84,
    speedMul: 1.3,
    damageMul: 0.94,
    snapMul: 1.2,
    color: 0x45f0c5,
  },
  sentinel: {
    id: "sentinel",
    name: "Platelet Bastion",
    title: "凝固要塞",
    hpMul: 1.42,
    speedMul: 0.84,
    damageMul: 1.1,
    snapMul: 0.94,
    color: 0xf7fff4,
  },
  breaker: {
    id: "breaker",
    name: "Killer T",
    title: "細胞破砕",
    hpMul: 1,
    speedMul: 0.98,
    damageMul: 1.32,
    snapMul: 0.9,
    color: 0xff475e,
  },
};

export const JOB_ORDER: JobId[] = ["vanguard", "shadow", "arcanist", "reaver", "monk", "courier", "sentinel", "breaker"];
