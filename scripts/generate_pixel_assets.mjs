import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const outDir = path.join(root, "public", "assets", "pixel");
fs.mkdirSync(outDir, { recursive: true });

const rect = (x, y, w, h, fill, opacity = 1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${opacity < 1 ? ` opacity="${opacity}"` : ""}/>`;

function svg(size, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">
${body}
</svg>
`;
}

function write(name, content) {
  fs.writeFileSync(path.join(outDir, name), content);
}

function hero({ main, dark, light, trim, visor }) {
  const body = [
    rect(12, 3, 8, 3, trim),
    rect(8, 6, 16, 4, dark),
    rect(5, 10, 22, 12, main),
    rect(7, 22, 18, 4, dark),
    rect(10, 8, 12, 18, main, 0.92),
    rect(12, 12, 8, 8, light, 0.82),
    rect(14, 14, 4, 4, visor, 0.8),
    rect(4, 15, 4, 3, trim),
    rect(24, 15, 4, 3, trim),
    rect(9, 25, 4, 3, trim),
    rect(19, 25, 4, 3, trim),
    rect(12, 5, 8, 2, light, 0.7),
  ];
  return svg(32, body.join("\n"));
}

function weapon({ main, dark, light, trim, shape = "ball" }) {
  const core =
    shape === "blade"
      ? [rect(13, 3, 6, 6, light), rect(10, 9, 12, 6, main), rect(13, 15, 6, 13, dark), rect(15, 2, 2, 27, trim), rect(6, 13, 5, 3, trim), rect(21, 13, 5, 3, trim)]
      : shape === "anchor"
        ? [rect(10, 6, 12, 12, main), rect(8, 12, 16, 5, dark), rect(5, 17, 7, 5, trim), rect(20, 17, 7, 5, trim), rect(13, 2, 6, 7, light), rect(14, 20, 4, 8, dark)]
        : shape === "yoyo"
          ? [rect(7, 9, 18, 14, dark), rect(9, 7, 14, 18, main), rect(12, 10, 8, 12, light), rect(6, 14, 20, 4, trim), rect(14, 2, 4, 5, trim), rect(14, 25, 4, 5, trim)]
          : [rect(8, 8, 16, 16, main), rect(10, 6, 12, 20, dark, 0.58), rect(11, 11, 10, 10, light), rect(14, 3, 4, 6, trim), rect(14, 23, 4, 6, trim), rect(5, 14, 5, 4, trim), rect(22, 14, 5, 4, trim)];
  return svg(32, core.join("\n"));
}

function enemy({ main, dark, light, shape = "blob" }) {
  const body =
    shape === "stalker"
      ? [rect(14, 2, 4, 5, light), rect(11, 7, 10, 5, main), rect(8, 12, 16, 8, main), rect(5, 20, 22, 5, dark), rect(10, 15, 12, 3, "#170a12"), rect(4, 9, 4, 3, light), rect(24, 9, 4, 3, light)]
      : shape === "zoner"
        ? [rect(14, 4, 4, 4, light), rect(10, 8, 12, 4, main), rect(6, 12, 20, 8, dark), rect(10, 20, 12, 4, main), rect(14, 24, 4, 4, light), rect(13, 13, 6, 6, "#0a0715"), rect(3, 15, 4, 2, light), rect(25, 15, 4, 2, light)]
        : shape === "bruiser"
          ? [rect(7, 7, 18, 17, dark), rect(9, 5, 14, 18, main), rect(5, 13, 22, 7, dark), rect(10, 12, 12, 4, "#160b09"), rect(12, 3, 8, 4, light), rect(5, 6, 3, 4, light), rect(24, 6, 3, 4, light)]
          : [rect(9, 7, 14, 16, main), rect(7, 11, 18, 9, dark, 0.65), rect(11, 10, 10, 4, "#15090a"), rect(12, 5, 8, 3, light), rect(10, 23, 4, 4, dark), rect(18, 23, 4, 4, dark), rect(4, 14, 4, 3, light), rect(24, 14, 4, 3, light)];
  return svg(32, body.join("\n"));
}

function pickup({ main, dark, light, rare = false }) {
  const body = [
    rect(14, 3, 4, 4, light),
    rect(10, 7, 12, 4, main),
    rect(6, 11, 20, 10, dark),
    rect(10, 21, 12, 4, main),
    rect(14, 25, 4, 4, light),
    rare ? rect(3, 14, 4, 4, light) : "",
    rare ? rect(25, 14, 4, 4, light) : "",
  ];
  return svg(32, body.join("\n"));
}

write("hero-vanguard.svg", hero({ main: "#55ff9a", dark: "#0f4d35", light: "#ecfff4", trim: "#ffd65a", visor: "#04110b" }));
write("hero-shadow.svg", hero({ main: "#7bdcff", dark: "#12435a", light: "#effcff", trim: "#ff5aa8", visor: "#031018" }));
write("hero-arcanist.svg", hero({ main: "#d7ff70", dark: "#425914", light: "#fbffe6", trim: "#4df4ff", visor: "#101904" }));
write("hero-reaver.svg", hero({ main: "#ff5d8f", dark: "#64172d", light: "#fff0f6", trim: "#ffd65a", visor: "#17050b" }));
write("hero-monk.svg", hero({ main: "#ffd56b", dark: "#5e4712", light: "#fff7d6", trim: "#65ff9a", visor: "#151004" }));
write("hero-courier.svg", hero({ main: "#45f0c5", dark: "#0c5449", light: "#e8fff8", trim: "#4df4ff", visor: "#04130f" }));
write("hero-sentinel.svg", hero({ main: "#f4f7fb", dark: "#59636d", light: "#ffffff", trim: "#ff5aa8", visor: "#0b1114" }));
write("hero-breaker.svg", hero({ main: "#ff475e", dark: "#66131e", light: "#ffe8ec", trim: "#7bff72", visor: "#180307" }));

write("weapon-chain-core.svg", weapon({ main: "#a6ff7a", dark: "#2e6a24", light: "#f1ffe8", trim: "#4df4ff" }));
write("weapon-twin-flail.svg", weapon({ main: "#72f5ff", dark: "#145e68", light: "#efffff", trim: "#ffd65a", shape: "yoyo" }));
write("weapon-pulse-bow.svg", weapon({ main: "#d8ff6d", dark: "#526b1c", light: "#fbffe3", trim: "#4df4ff", shape: "blade" }));
write("weapon-void-staff.svg", weapon({ main: "#c39bff", dark: "#442772", light: "#f7efff", trim: "#ff5aa8", shape: "anchor" }));
write("weapon-comet-knuckle.svg", weapon({ main: "#ff6f8f", dark: "#722035", light: "#fff0f5", trim: "#ffd65a" }));
write("weapon-anchor-mace.svg", weapon({ main: "#e8f7ff", dark: "#405b66", light: "#ffffff", trim: "#ff6f8f", shape: "anchor" }));
write("weapon-serpent-cord.svg", weapon({ main: "#55ff9a", dark: "#145d35", light: "#e8fff1", trim: "#c39bff", shape: "blade" }));
write("weapon-mirror-yoyo.svg", weapon({ main: "#9cf0ff", dark: "#24566b", light: "#ffffff", trim: "#ffb45a", shape: "yoyo" }));

write("enemy-chaser.svg", enemy({ main: "#ff4f7a", dark: "#701623", light: "#ffd5df" }));
write("enemy-stalker.svg", enemy({ main: "#ff6fd3", dark: "#6f1856", light: "#ffe0f6", shape: "stalker" }));
write("enemy-bruiser.svg", enemy({ main: "#ffb45a", dark: "#713b0d", light: "#ffe9ca", shape: "bruiser" }));
write("enemy-zoner.svg", enemy({ main: "#b88cff", dark: "#3d2270", light: "#f2ddff", shape: "zoner" }));
write("enemy-boss.svg", enemy({ main: "#ffd65a", dark: "#79580e", light: "#fff6ca", shape: "bruiser" }));

write("drop-xp.svg", pickup({ main: "#4df4ff", dark: "#105f6d", light: "#efffff" }));
write("drop-item.svg", pickup({ main: "#ffd65a", dark: "#6b4c0d", light: "#fff6c7" }));
write("drop-legendary.svg", pickup({ main: "#ff8a2a", dark: "#6d2a08", light: "#fff1d8", rare: true }));
write("floor-tile.svg", svg(32, [
  rect(0, 0, 32, 32, "#07120d"),
  rect(0, 0, 32, 1, "#1d4c38"),
  rect(0, 0, 1, 32, "#1d4c38"),
  rect(8, 8, 2, 2, "#4df4ff", 0.38),
  rect(22, 18, 2, 2, "#ff5aa8", 0.28),
  rect(12, 22, 3, 2, "#65ff9a", 0.3),
  rect(15, 28, 1, 1, "#ffffff", 0.25),
].join("\n")));
write("app-icon.svg", svg(64, [
  rect(0, 0, 64, 64, "#05080b"),
  rect(4, 4, 56, 56, "#0d1e15"),
  rect(8, 8, 48, 4, "#65ff9a"),
  rect(8, 52, 48, 4, "#ff5aa8"),
  rect(18, 18, 28, 24, "#55ff9a"),
  rect(23, 14, 18, 8, "#ecfff4"),
  rect(13, 34, 12, 8, "#ffd65a"),
  rect(39, 34, 12, 8, "#4df4ff"),
  rect(28, 24, 8, 8, "#05080b"),
].join("\n")));

console.log(`generated ${fs.readdirSync(outDir).length} pixel assets in ${outDir}`);
