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
    rect(8, 5, 16, 3, trim),
    rect(6, 8, 20, 5, dark),
    rect(8, 9, 16, 5, main),
    rect(10, 13, 12, 5, main),
    rect(7, 18, 18, 5, dark),
    rect(9, 18, 14, 4, main),
    rect(5, 22, 6, 4, trim),
    rect(21, 22, 6, 4, trim),
    rect(10, 24, 4, 5, dark),
    rect(18, 24, 4, 5, dark),
    rect(11, 10, 10, 2, visor),
    rect(13, 7, 6, 2, light),
    rect(12, 15, 8, 2, light, 0.75),
  ];
  return svg(32, body.join("\n"));
}

function weapon({ main, dark, light, trim, shape = "ball" }) {
  const core =
    shape === "blade"
      ? [rect(13, 3, 6, 6, light), rect(11, 9, 10, 7, main), rect(13, 16, 6, 12, dark), rect(15, 2, 2, 27, trim)]
      : shape === "anchor"
        ? [rect(10, 6, 12, 12, main), rect(8, 12, 16, 5, dark), rect(5, 17, 7, 5, trim), rect(20, 17, 7, 5, trim), rect(13, 2, 6, 7, light)]
        : shape === "yoyo"
          ? [rect(7, 9, 18, 14, dark), rect(9, 7, 14, 18, main), rect(12, 10, 8, 12, light), rect(6, 14, 20, 4, trim)]
          : [rect(8, 8, 16, 16, main), rect(10, 6, 12, 20, dark, 0.6), rect(11, 11, 10, 10, light), rect(14, 3, 4, 6, trim), rect(14, 23, 4, 6, trim)];
  return svg(32, core.join("\n"));
}

function enemy({ main, dark, light, shape = "blob" }) {
  const body =
    shape === "stalker"
      ? [rect(14, 3, 4, 4, light), rect(11, 7, 10, 5, main), rect(8, 12, 16, 8, main), rect(5, 20, 22, 5, dark), rect(10, 15, 12, 3, "#170a12")]
      : shape === "zoner"
        ? [rect(14, 4, 4, 4, light), rect(10, 8, 12, 4, main), rect(6, 12, 20, 8, dark), rect(10, 20, 12, 4, main), rect(14, 24, 4, 4, light), rect(13, 13, 6, 6, "#0a0715")]
        : shape === "bruiser"
          ? [rect(7, 7, 18, 17, dark), rect(9, 5, 14, 18, main), rect(5, 13, 22, 7, dark), rect(10, 12, 12, 4, "#160b09"), rect(12, 3, 8, 4, light)]
          : [rect(9, 7, 14, 16, main), rect(7, 11, 18, 9, dark, 0.65), rect(11, 10, 10, 4, "#15090a"), rect(12, 5, 8, 3, light), rect(10, 23, 4, 4, dark), rect(18, 23, 4, 4, dark)];
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

write("hero-vanguard.svg", hero({ main: "#36f5b7", dark: "#0c5f62", light: "#eafff5", trim: "#ffd85d", visor: "#071313" }));
write("hero-shadow.svg", hero({ main: "#74a8ff", dark: "#1e315f", light: "#eaf2ff", trim: "#ff5aa8", visor: "#060a16" }));
write("hero-arcanist.svg", hero({ main: "#b284ff", dark: "#3d236a", light: "#fff1ff", trim: "#65f3ff", visor: "#10071c" }));
write("hero-reaver.svg", hero({ main: "#ff8b4a", dark: "#652310", light: "#fff2df", trim: "#ff3b3b", visor: "#180806" }));
write("hero-monk.svg", hero({ main: "#f5e36a", dark: "#5c4b0d", light: "#fffbd1", trim: "#45e07c", visor: "#151206" }));
write("hero-courier.svg", hero({ main: "#43e2ff", dark: "#0b4a66", light: "#effcff", trim: "#ffb13d", visor: "#061118" }));
write("hero-sentinel.svg", hero({ main: "#d9edf7", dark: "#3a4d58", light: "#ffffff", trim: "#ff5f5f", visor: "#0b1114" }));
write("hero-breaker.svg", hero({ main: "#ffcb6b", dark: "#744112", light: "#fff6d8", trim: "#8cff70", visor: "#160c04" }));

write("weapon-chain-core.svg", weapon({ main: "#ffd15f", dark: "#76531a", light: "#fff4b8", trim: "#43e2ff" }));
write("weapon-twin-flail.svg", weapon({ main: "#56e8ff", dark: "#115a70", light: "#eaffff", trim: "#ffd15f", shape: "yoyo" }));
write("weapon-pulse-bow.svg", weapon({ main: "#96ff7c", dark: "#2b6b29", light: "#f0ffe8", trim: "#43e2ff", shape: "blade" }));
write("weapon-void-staff.svg", weapon({ main: "#c886ff", dark: "#4c216a", light: "#fff1ff", trim: "#ff5aa8", shape: "anchor" }));
write("weapon-comet-knuckle.svg", weapon({ main: "#ff604c", dark: "#732019", light: "#fff0e8", trim: "#ffd15f" }));
write("weapon-anchor-mace.svg", weapon({ main: "#d9edf7", dark: "#405461", light: "#ffffff", trim: "#ff604c", shape: "anchor" }));
write("weapon-serpent-cord.svg", weapon({ main: "#45e07c", dark: "#145d35", light: "#e9fff0", trim: "#b284ff", shape: "blade" }));
write("weapon-mirror-yoyo.svg", weapon({ main: "#8ed8ff", dark: "#25506b", light: "#ffffff", trim: "#ff8b4a", shape: "yoyo" }));

write("enemy-chaser.svg", enemy({ main: "#ff5d5d", dark: "#70181e", light: "#ffd5d5" }));
write("enemy-stalker.svg", enemy({ main: "#ff5ca8", dark: "#6f1844", light: "#ffe0ef", shape: "stalker" }));
write("enemy-bruiser.svg", enemy({ main: "#ff9a4c", dark: "#71320d", light: "#ffe3c7", shape: "bruiser" }));
write("enemy-zoner.svg", enemy({ main: "#b986ff", dark: "#432072", light: "#f2ddff", shape: "zoner" }));
write("enemy-boss.svg", enemy({ main: "#ffd85d", dark: "#79570e", light: "#fff6ca", shape: "bruiser" }));

write("drop-xp.svg", pickup({ main: "#7ff7ff", dark: "#105f6d", light: "#efffff" }));
write("drop-item.svg", pickup({ main: "#ffdc5e", dark: "#6b4c0d", light: "#fff6c7" }));
write("drop-legendary.svg", pickup({ main: "#ff8a2a", dark: "#6d2a08", light: "#fff1d8", rare: true }));
write("floor-tile.svg", svg(32, [
  rect(0, 0, 32, 32, "#11151b"),
  rect(0, 0, 32, 1, "#313945"),
  rect(0, 0, 1, 32, "#313945"),
  rect(8, 8, 2, 2, "#3bd6ff", 0.38),
  rect(22, 18, 2, 2, "#ffd15f", 0.32),
  rect(15, 28, 1, 1, "#ffffff", 0.25),
].join("\n")));
write("app-icon.svg", svg(64, [
  rect(0, 0, 64, 64, "#08090d"),
  rect(4, 4, 56, 56, "#161b22"),
  rect(8, 8, 48, 4, "#43e2ff"),
  rect(8, 52, 48, 4, "#ffd15f"),
  rect(20, 18, 24, 22, "#36f5b7"),
  rect(24, 14, 16, 8, "#eafff5"),
  rect(14, 40, 12, 8, "#ffd15f"),
  rect(38, 40, 12, 8, "#ff604c"),
  rect(29, 24, 6, 6, "#08090d"),
].join("\n")));

console.log(`generated ${fs.readdirSync(outDir).length} pixel assets in ${outDir}`);
