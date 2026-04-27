import * as Phaser from "phaser";
import { WORLD } from "./content/balance";
import { parseQueryOptions } from "./platform/query";
import { GameScene } from "./scenes/GameScene";
import { GameSim } from "./sim/GameSim";
import { DomBridge } from "./ui/dom";
import "./styles/app.css";

declare global {
  interface Window {
    render_game_to_text: () => string;
    advanceTime: (ms: number) => string;
    injectTikfinityEvent: (payload: unknown) => boolean;
    set_nunchaku_stretch_limit: (value: number) => void;
    __OVERDRIVE__?: {
      sim: GameSim;
      scene: GameScene;
      dom: DomBridge;
    };
  }
}

const sim = new GameSim(parseQueryOptions());
const dom = new DomBridge(sim);
const scene = new GameScene(sim, dom);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "gameMount",
  width: WORLD.width,
  height: WORLD.height,
  backgroundColor: "#071017",
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WORLD.width,
    height: WORLD.height,
  },
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
  },
  scene: [scene],
});

const handleKeyDown = (ev: KeyboardEvent) => dom.handleKeyDown(ev);
const handleKeyUp = (ev: KeyboardEvent) => dom.handleKeyUp(ev);
const handleBlur = () => {
  sim.setKey("left", false);
  sim.setKey("right", false);
  sim.setKey("up", false);
  sim.setKey("down", false);
  sim.setPointer(false, sim.player.targetX, sim.player.targetY);
};

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
window.addEventListener("blur", handleBlur);

window.render_game_to_text = () => sim.renderGameToText();
window.advanceTime = (ms: number) => {
  sim.manualClock = true;
  const safeMs = Number.isFinite(Number(ms)) ? Math.max(0, Number(ms)) : 0;
  const steps = safeMs <= 0 ? 0 : Math.max(1, Math.round(safeMs / (1000 / 60)));
  for (let i = 0; i < steps; i += 1) sim.step(1 / 60);
  scene.renderState();
  dom.sync();
  return sim.renderGameToText();
};
window.injectTikfinityEvent = (payload: unknown) => {
  const accepted = sim.injectTikfinityEvent(payload);
  dom.sync();
  return accepted;
};
window.set_nunchaku_stretch_limit = (value: number) => {
  sim.setNunchakuStretchLimit(value);
  dom.sync();
};
window.__OVERDRIVE__ = { sim, scene, dom };

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("blur", handleBlur);
    game.destroy(true);
  });
}
