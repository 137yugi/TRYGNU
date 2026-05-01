import * as Phaser from "phaser";
import { installAdCatalogOverrides } from "./content/ads";
import { WORLD, configureWorldForViewport } from "./content/balance";
import { parseQueryOptions } from "./platform/query";
import { GameScene } from "./scenes/GameScene";
import { GameSim } from "./sim/GameSim";
import { buildSeasonReviewExport } from "./systems/season";
import { DomBridge } from "./ui/dom";
import "./styles/app.css";

declare global {
  interface Window {
    render_game_to_text: () => string;
    advanceTime: (ms: number) => string;
    injectTikfinityEvent: (payload: unknown) => boolean;
    exportSeasonReview: (seasonId?: string) => string;
    set_nunchaku_stretch_limit: (value: number) => void;
    __OVERDRIVE__?: {
      sim: GameSim;
      scene: GameScene;
      dom: DomBridge;
    };
  }
}

const readViewportSize = () => {
  const visual = window.visualViewport;
  return {
    height: Math.max(320, Math.round(visual?.height || window.innerHeight || document.documentElement.clientHeight)),
    width: Math.max(320, Math.round(visual?.width || window.innerWidth || document.documentElement.clientWidth)),
  };
};

configureWorldForViewport(readViewportSize().width, readViewportSize().height);
document.documentElement.style.setProperty("--game-aspect", `${WORLD.width} / ${WORLD.height}`);
document.body.classList.toggle("portrait-stage", WORLD.layout === "portrait");

const sim = new GameSim(parseQueryOptions());
const dom = new DomBridge(sim);
const scene = new GameScene(sim, dom);
void loadOperatorAds();

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

const syncViewport = () => {
  const { width, height } = readViewportSize();
  document.documentElement.style.setProperty("--app-height", `${height}px`);
  document.documentElement.style.setProperty("--app-width", `${width}px`);
  document.body.classList.toggle("viewport-portrait", height > width * 1.12);
  window.setTimeout(() => game.scale.refresh(), 60);
};

async function loadOperatorAds(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const configUrl = params.get("ads_config") || "./config/ads.json";
  if (configUrl === "off") return;
  try {
    const response = await fetch(configUrl, { cache: "no-store" });
    if (!response.ok) return;
    installAdCatalogOverrides(await response.json());
  } catch {
    // The bundled default catalog remains active when operator config is absent.
  }
}

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
window.addEventListener("resize", syncViewport);
window.addEventListener("orientationchange", syncViewport);
window.visualViewport?.addEventListener("resize", syncViewport);
window.visualViewport?.addEventListener("scroll", syncViewport);
document.addEventListener("fullscreenchange", syncViewport);
syncViewport();

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
window.exportSeasonReview = (seasonId?: string) => JSON.stringify(buildSeasonReviewExport(seasonId), null, 2);
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
    window.removeEventListener("resize", syncViewport);
    window.removeEventListener("orientationchange", syncViewport);
    window.visualViewport?.removeEventListener("resize", syncViewport);
    window.visualViewport?.removeEventListener("scroll", syncViewport);
    document.removeEventListener("fullscreenchange", syncViewport);
    game.destroy(true);
  });
}
