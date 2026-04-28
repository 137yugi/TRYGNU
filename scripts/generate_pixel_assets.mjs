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

function spark(cx, cy, color, size = 1) {
  return [
    rect(cx, cy - size * 2, size, size * 5, color),
    rect(cx - size * 2, cy, size * 5, size, color),
  ].join("\n");
}

function hero({ shell, shade, core, glow, trim, variant = 0 }) {
  const fins =
    variant % 3 === 0
      ? [rect(4, 10, 4, 5, trim), rect(24, 10, 4, 5, trim), rect(5, 20, 5, 4, trim), rect(22, 20, 5, 4, trim)]
      : variant % 3 === 1
        ? [rect(2, 14, 6, 3, trim), rect(24, 14, 6, 3, trim), rect(9, 3, 4, 4, trim), rect(19, 25, 4, 4, trim)]
        : [rect(5, 7, 4, 4, trim), rect(23, 7, 4, 4, trim), rect(5, 22, 4, 4, trim), rect(23, 22, 4, 4, trim)];
  return svg(32, [
    ...fins,
    rect(9, 5, 14, 4, glow),
    rect(6, 9, 20, 15, shade),
    rect(8, 7, 16, 18, shell),
    rect(10, 9, 12, 13, shell, 0.86),
    rect(13, 12, 6, 7, "#06091d"),
    rect(15, 13, 3, 5, core),
    rect(11, 8, 5, 2, "#f8fbff", 0.8),
    rect(20, 10, 3, 3, "#f8fbff", 0.55),
    rect(12, 24, 8, 3, shade),
    spark(26, 26, glow, 1),
  ].join("\n"));
}

function weapon({ main, dark, light, trim, shape = "wire" }) {
  const cable = [rect(7, 14, 18, 3, dark), rect(10, 13, 4, 5, trim), rect(18, 13, 4, 5, trim)];
  const heads =
    shape === "capacitor"
      ? [rect(5, 6, 9, 11, main), rect(18, 15, 9, 11, main), rect(7, 8, 5, 7, light), rect(20, 17, 5, 7, light), rect(4, 3, 3, 4, trim), rect(25, 25, 3, 4, trim)]
      : shape === "blade"
        ? [rect(6, 4, 8, 13, main), rect(18, 15, 8, 13, main), rect(9, 2, 3, 18, light), rect(21, 12, 3, 18, light), rect(4, 10, 4, 3, trim), rect(24, 19, 4, 3, trim)]
        : shape === "coil"
          ? [rect(5, 6, 9, 9, main), rect(18, 17, 9, 9, main), rect(7, 8, 5, 5, dark), rect(20, 19, 5, 5, dark), spark(5, 21, trim, 1), spark(25, 8, trim, 1)]
          : [rect(6, 7, 8, 8, main), rect(18, 17, 8, 8, main), rect(8, 9, 4, 4, light), rect(20, 19, 4, 4, light), rect(4, 14, 4, 3, trim), rect(24, 14, 4, 3, trim)];
  return svg(32, [...cable, ...heads].join("\n"));
}

function enemy({ main, dark, light, trim, shape = "parasite" }) {
  const body =
    shape === "spore"
      ? [
          rect(8, 8, 16, 15, dark),
          rect(10, 6, 12, 18, main),
          rect(13, 12, 6, 6, light),
          rect(5, 5, 4, 4, trim),
          rect(23, 5, 4, 4, trim),
          rect(4, 21, 5, 3, trim),
          rect(24, 21, 5, 3, trim),
          spark(16, 3, trim, 1),
        ]
      : shape === "eater"
        ? [
            rect(7, 9, 18, 14, dark),
            rect(9, 7, 14, 18, main),
            rect(12, 10, 8, 7, "#06091d"),
            rect(15, 12, 3, 3, light),
            rect(4, 12, 5, 3, trim),
            rect(23, 16, 5, 3, trim),
            rect(10, 25, 4, 4, dark),
            rect(18, 25, 4, 4, dark),
          ]
        : shape === "leech"
          ? [
              rect(6, 18, 6, 6, dark),
              rect(10, 15, 7, 7, main),
              rect(15, 12, 7, 7, dark),
              rect(20, 9, 7, 7, main),
              rect(24, 6, 5, 5, light),
              rect(7, 21, 4, 3, trim),
              rect(22, 10, 3, 3, "#06091d"),
            ]
          : [
              rect(8, 8, 16, 12, main),
              rect(10, 6, 12, 16, dark, 0.62),
              rect(12, 10, 8, 6, light),
              rect(4, 20, 4, 6, trim),
              rect(10, 22, 3, 6, trim),
              rect(18, 22, 3, 6, trim),
              rect(24, 20, 4, 6, trim),
              spark(5, 6, light, 1),
              spark(27, 7, light, 1),
            ];
  return svg(32, body.join("\n"));
}

function boss() {
  return svg(32, [
    rect(2, 4, 4, 7, "#6a3bff"),
    rect(26, 4, 4, 7, "#16e7ff"),
    rect(3, 23, 5, 5, "#ff4fd8"),
    rect(24, 22, 5, 6, "#6a3bff"),
    rect(7, 8, 18, 17, "#2c164f"),
    rect(9, 6, 14, 21, "#b24cff"),
    rect(11, 9, 10, 14, "#360b55"),
    rect(13, 11, 6, 8, "#ff61ff"),
    rect(15, 13, 3, 4, "#fff3ff"),
    spark(6, 16, "#16e7ff", 1),
    spark(27, 16, "#ff4fd8", 1),
  ].join("\n"));
}

function pickup({ main, dark, light, rare = false }) {
  return svg(32, [
    rect(14, 3, 4, 4, light),
    rect(10, 7, 12, 4, main),
    rect(6, 11, 20, 10, dark),
    rect(10, 21, 12, 4, main),
    rect(14, 25, 4, 4, light),
    rare ? rect(3, 14, 4, 4, light) : "",
    rare ? rect(25, 14, 4, 4, light) : "",
  ].join("\n"));
}

function equipment({ main, dark, light, trim, shape = "shell" }) {
  const body =
    shape === "mask"
      ? [rect(8, 8, 16, 13, main), rect(6, 13, 20, 7, dark), rect(10, 10, 4, 3, light), rect(18, 10, 4, 3, light), rect(12, 22, 8, 4, trim), rect(14, 15, 4, 4, "#06091d")]
      : shape === "battery"
        ? [rect(10, 5, 12, 21, dark), rect(12, 3, 8, 25, main), rect(14, 8, 4, 12, light), rect(7, 12, 4, 8, trim), rect(21, 12, 4, 8, trim), spark(16, 27, trim, 1)]
        : shape === "wire"
          ? [rect(14, 3, 4, 26, trim), rect(8, 8, 16, 5, main), rect(8, 19, 16, 5, dark), rect(5, 11, 6, 4, light), rect(21, 17, 6, 4, light), rect(12, 13, 8, 6, main, 0.78)]
          : shape === "chain"
            ? [rect(6, 7, 8, 8, main), rect(18, 17, 8, 8, main), rect(12, 12, 8, 8, dark), rect(14, 4, 4, 5, trim), rect(14, 23, 4, 5, trim), rect(8, 9, 4, 4, light), rect(20, 19, 4, 4, light)]
            : [rect(9, 5, 14, 4, trim), rect(7, 9, 18, 15, main), rect(9, 12, 14, 9, dark, 0.58), rect(12, 11, 8, 8, light, 0.74), rect(5, 15, 5, 4, trim), rect(22, 15, 5, 4, trim)];
  return svg(32, body.join("\n"));
}

const c = {
  navy: "#050717",
  blue: "#16e7ff",
  blue2: "#3487ff",
  magenta: "#ff4fd8",
  violet: "#8b5cff",
  white: "#f7fbff",
  gold: "#ffd84d",
  orange: "#ff8a2a",
  red: "#ff334f",
  green: "#55ffb1",
};

write("hero-vanguard.svg", hero({ shell: "#d7dcff", shade: "#53577e", core: c.blue, glow: c.blue, trim: c.white, variant: 0 }));
write("hero-shadow.svg", hero({ shell: "#52e9ff", shade: "#164d73", core: c.magenta, glow: c.magenta, trim: c.blue, variant: 1 }));
write("hero-arcanist.svg", hero({ shell: "#d6a6ff", shade: "#533279", core: c.blue, glow: c.violet, trim: c.magenta, variant: 2 }));
write("hero-reaver.svg", hero({ shell: "#ff5ccf", shade: "#6b1a5f", core: c.white, glow: c.magenta, trim: c.blue, variant: 0 }));
write("hero-monk.svg", hero({ shell: "#7fffe0", shade: "#0e5b65", core: c.gold, glow: c.blue, trim: c.green, variant: 1 }));
write("hero-courier.svg", hero({ shell: "#59a8ff", shade: "#17376f", core: c.magenta, glow: c.blue, trim: c.white, variant: 2 }));
write("hero-sentinel.svg", hero({ shell: "#f4f7fb", shade: "#59637d", core: c.blue, glow: c.white, trim: c.magenta, variant: 0 }));
write("hero-breaker.svg", hero({ shell: "#ff5870", shade: "#6d1428", core: c.blue, glow: c.red, trim: c.gold, variant: 1 }));

write("weapon-chain-core.svg", weapon({ main: c.blue, dark: "#0c3c63", light: c.white, trim: c.magenta, shape: "wire" }));
write("weapon-twin-flail.svg", weapon({ main: "#49a8ff", dark: "#112f66", light: "#e8fbff", trim: c.blue, shape: "coil" }));
write("weapon-pulse-bow.svg", weapon({ main: c.gold, dark: "#60470b", light: "#fff8c6", trim: c.blue, shape: "capacitor" }));
write("weapon-void-staff.svg", weapon({ main: c.violet, dark: "#2d185d", light: "#f4e8ff", trim: c.magenta, shape: "blade" }));
write("weapon-comet-knuckle.svg", weapon({ main: c.magenta, dark: "#68175b", light: "#ffe1fa", trim: c.blue, shape: "coil" }));
write("weapon-anchor-mace.svg", weapon({ main: c.white, dark: "#43506b", light: "#ffffff", trim: c.magenta, shape: "capacitor" }));
write("weapon-serpent-cord.svg", weapon({ main: c.green, dark: "#0b5a4c", light: "#e8fff8", trim: c.blue, shape: "wire" }));
write("weapon-mirror-yoyo.svg", weapon({ main: "#9cecff", dark: "#234d77", light: "#ffffff", trim: c.orange, shape: "coil" }));

write("enemy-chaser.svg", enemy({ main: "#35dfff", dark: "#102e65", light: "#e0fbff", trim: c.magenta, shape: "parasite" }));
write("enemy-stalker.svg", enemy({ main: c.magenta, dark: "#55164e", light: "#ffe2fa", trim: c.violet, shape: "spore" }));
write("enemy-bruiser.svg", enemy({ main: "#a7a2c8", dark: "#3d3a61", light: c.blue, trim: c.white, shape: "leech" }));
write("enemy-zoner.svg", enemy({ main: c.violet, dark: "#24145a", light: c.magenta, trim: c.blue, shape: "eater" }));
write("enemy-boss.svg", boss());

write("drop-xp.svg", pickup({ main: c.blue, dark: "#0d4d6a", light: "#e8fbff" }));
write("drop-item.svg", pickup({ main: c.gold, dark: "#6b4c0d", light: "#fff6c7" }));
write("drop-legendary.svg", pickup({ main: c.orange, dark: "#6d2a08", light: "#fff1d8", rare: true }));

write("equipment-body-neuro-shell.svg", equipment({ main: "#d7dcff", dark: "#53577e", light: c.blue, trim: c.white, shape: "shell" }));
write("equipment-body-glia-shell.svg", equipment({ main: "#52e9ff", dark: "#164d73", light: c.white, trim: c.magenta, shape: "shell" }));
write("equipment-body-volt-furnace.svg", equipment({ main: c.magenta, dark: "#64185d", light: c.gold, trim: c.blue, shape: "battery" }));
write("equipment-body-core-shield.svg", equipment({ main: c.violet, dark: "#32206a", light: c.white, trim: c.blue, shape: "shell" }));
write("equipment-body-myelin-plate.svg", equipment({ main: c.gold, dark: "#6b4c0d", light: "#fff6c7", trim: c.magenta, shape: "shell" }));
write("equipment-body-conduit-vest.svg", equipment({ main: c.green, dark: "#0b594a", light: "#e8fff8", trim: c.blue, shape: "shell" }));
write("equipment-body-axon-legs.svg", equipment({ main: "#59a8ff", dark: "#17376f", light: c.white, trim: c.magenta, shape: "wire" }));
write("equipment-body-surge-mask.svg", equipment({ main: c.white, dark: "#40506d", light: "#ffffff", trim: c.blue, shape: "mask" }));

write("equipment-chain-storm-conduit.svg", equipment({ main: c.blue, dark: "#0d4d6a", light: c.white, trim: c.magenta, shape: "chain" }));
write("equipment-chain-ion-core.svg", equipment({ main: c.gold, dark: "#60470b", light: "#fff8c6", trim: c.blue, shape: "chain" }));
write("equipment-chain-synapse-head.svg", equipment({ main: c.white, dark: "#43506b", light: c.blue, trim: c.magenta, shape: "chain" }));
write("equipment-chain-dendrite-grip.svg", equipment({ main: "#49a8ff", dark: "#112f66", light: c.white, trim: c.blue, shape: "wire" }));
write("equipment-chain-myelin-mace.svg", equipment({ main: c.magenta, dark: "#68175b", light: "#ffe1fa", trim: c.white, shape: "chain" }));
write("equipment-chain-signal-yoyo.svg", equipment({ main: "#9cecff", dark: "#234d77", light: c.white, trim: c.orange, shape: "chain" }));
write("equipment-chain-synapse-wire.svg", equipment({ main: c.blue, dark: "#0d4d6a", light: c.white, trim: c.magenta, shape: "wire" }));
write("equipment-chain-volt-wire.svg", equipment({ main: c.green, dark: "#0b594a", light: c.white, trim: c.violet, shape: "wire" }));

write("floor-tile.svg", svg(32, [
  rect(0, 0, 32, 32, c.navy),
  rect(0, 0, 32, 1, "#153162"),
  rect(0, 0, 1, 32, "#153162"),
  rect(15, 0, 2, 32, "#12305a", 0.45),
  rect(0, 15, 32, 2, "#2a155c", 0.36),
  rect(14, 14, 4, 4, c.blue, 0.42),
  spark(16, 16, c.magenta, 1),
  rect(4, 24, 3, 2, c.blue, 0.5),
  rect(25, 8, 2, 3, c.magenta, 0.42),
].join("\n")));

write("app-icon.svg", svg(64, [
  rect(0, 0, 64, 64, c.navy),
  rect(4, 4, 56, 56, "#091331"),
  rect(8, 8, 48, 3, c.blue),
  rect(8, 53, 48, 3, c.magenta),
  rect(18, 18, 28, 24, "#d7dcff"),
  rect(22, 14, 20, 8, c.white),
  rect(29, 24, 8, 10, "#050717"),
  rect(32, 26, 4, 6, c.blue),
  rect(10, 33, 14, 5, c.blue),
  rect(40, 33, 14, 5, c.magenta),
  spark(14, 48, c.blue, 2),
  spark(50, 17, c.magenta, 2),
].join("\n")));

console.log(`generated ${fs.readdirSync(outDir).length} pixel assets in ${outDir}`);
