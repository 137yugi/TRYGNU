import * as Phaser from "phaser";
import { ENEMY_ASSET, JOB_ASSET, PIXEL_ASSETS, WEAPON_ASSET, equipmentAssetKey } from "../content/assets";
import { COLORS, WORLD } from "../content/balance";
import { JOBS } from "../content/jobs";
import { WEAPONS } from "../content/weapons";
import type { GameSim } from "../sim/GameSim";
import { formatTime } from "../sim/math";
import type { ActiveAdState } from "../sim/types";
import type { DomBridge } from "../ui/dom";

const UI_QUIET_TOP = 52;
const UI_QUIET_BOTTOM = 54;
const OVERDRIVE_SPEED = 260;
type DragMode = "absolute" | "relative";

export class GameScene extends Phaser.Scene {
  private readonly sim: GameSim;
  private readonly dom: DomBridge;
  private graphics!: Phaser.GameObjects.Graphics;
  private adGraphics!: Phaser.GameObjects.Graphics;
  private playerSprite!: Phaser.GameObjects.Image;
  private nunchakuSprite!: Phaser.GameObjects.Image;
  private enemySprites = new Map<number, Phaser.GameObjects.Image>();
  private dropSprites = new Map<number, Phaser.GameObjects.Image>();
  private phantomSprites = new Map<number, Phaser.GameObjects.Image>();
  private adTexts = new Map<number, Phaser.GameObjects.Text[]>();
  private overlayText!: Phaser.GameObjects.Text;
  private debugText!: Phaser.GameObjects.Text;
  private activeDrag: { id: number; mode: DragMode; startX: number; startY: number } | null = null;
  private readonly pointerCleanup: Array<() => void> = [];

  constructor(sim: GameSim, dom: DomBridge) {
    super("gameplay");
    this.sim = sim;
    this.dom = dom;
  }

  preload(): void {
    for (const [key, url] of PIXEL_ASSETS) this.load.image(key, url);
  }

  create(): void {
    this.game.canvas.id = "gameCanvas";
    this.game.canvas.setAttribute("aria-label", "Game Canvas");
    this.cameras.main.setBackgroundColor("#160b16");
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.graphics = this.add.graphics();
    this.adGraphics = this.add.graphics().setDepth(18);
    this.playerSprite = this.add.image(this.sim.player.x, this.sim.player.y, JOB_ASSET[this.sim.build.jobId]).setDepth(13).setOrigin(0.5);
    this.nunchakuSprite = this.add.image(this.sim.nunchaku.x, this.sim.nunchaku.y, WEAPON_ASSET[this.sim.build.weaponId]).setDepth(14).setOrigin(0.5);
    this.overlayText = this.add
      .text(WORLD.width * 0.5, WORLD.height * 0.46, "", {
        fontFamily: "Menlo, Consolas, monospace",
        fontSize: "18px",
        color: "#f3fbff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.debugText = this.add
      .text(10, WORLD.height - 44, "", {
        fontFamily: "Menlo, Consolas, monospace",
        fontSize: "10px",
        color: "#a8d9ff",
      })
      .setDepth(21);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.activeDrag) return;
      const mode = this.relativeDragEnabled(pointer) ? "relative" : "absolute";
      this.activeDrag = { id: pointer.id, mode, startX: pointer.worldX, startY: pointer.worldY };
      if (mode === "relative") this.sim.setRelativePointer(true, pointer.worldX, pointer.worldY, pointer.worldX, pointer.worldY);
      else this.sim.setPointer(true, pointer.worldX, pointer.worldY);
      if (this.sim.mode !== "running" && this.sim.pauseMode === null) this.sim.startOrResolve();
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || !this.dragMatches(pointer)) return;
      if (this.activeDrag?.mode === "relative") {
        this.sim.setRelativePointer(true, this.activeDrag.startX, this.activeDrag.startY, pointer.worldX, pointer.worldY);
      } else {
        this.sim.setPointer(true, pointer.worldX, pointer.worldY);
      }
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => this.releasePointer(pointer));
    this.input.on("pointerupoutside", (pointer: Phaser.Input.Pointer) => this.releasePointer(pointer));
    this.installPointerCancelGuards();

    this.renderState();
    this.dom.sync();
  }

  private relativeDragEnabled(pointer: Phaser.Input.Pointer): boolean {
    const event = pointer.event as (PointerEvent & { pointerType?: string }) | undefined;
    const pointerType = typeof event?.pointerType === "string" ? event.pointerType : "";
    const eventType = typeof event?.type === "string" ? event.type : "";
    if (pointerType === "mouse") return false;
    if (!pointerType && eventType.startsWith("mouse")) return false;
    if (pointerType === "touch" || pointerType === "pen") return true;
    if ((pointer as Phaser.Input.Pointer & { wasTouch?: boolean }).wasTouch) return true;
    return Boolean(navigator.maxTouchPoints > 0 && window.matchMedia?.("(pointer: coarse)").matches);
  }

  private dragMatches(pointer: Phaser.Input.Pointer): boolean {
    return Boolean(this.activeDrag && this.activeDrag.id === pointer.id);
  }

  private releasePointer(pointer: Phaser.Input.Pointer): void {
    if (!this.dragMatches(pointer)) return;
    if (this.activeDrag?.mode === "relative") {
      this.sim.setRelativePointer(false, this.activeDrag.startX, this.activeDrag.startY, pointer.worldX, pointer.worldY);
    } else {
      this.sim.setPointer(false, this.sim.player.targetX, this.sim.player.targetY);
    }
    this.activeDrag = null;
  }

  clearPointerInput(): void {
    this.activeDrag = null;
    this.sim.clearPointerInput();
  }

  private installPointerCancelGuards(): void {
    const clear = () => this.clearPointerInput();
    const canvas = this.game.canvas;
    canvas.addEventListener("pointercancel", clear);
    canvas.addEventListener("lostpointercapture", clear);
    canvas.addEventListener("touchcancel", clear);
    document.addEventListener("visibilitychange", clear);
    this.pointerCleanup.push(
      () => canvas.removeEventListener("pointercancel", clear),
      () => canvas.removeEventListener("lostpointercapture", clear),
      () => canvas.removeEventListener("touchcancel", clear),
      () => document.removeEventListener("visibilitychange", clear),
    );
    this.events.once("shutdown", () => {
      for (const cleanup of this.pointerCleanup.splice(0)) cleanup();
    });
  }

  handleWorldResize(): void {
    this.scale.setGameSize(WORLD.width, WORLD.height);
    this.cameras.main.setSize(WORLD.width, WORLD.height);
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    if (this.overlayText) this.overlayText.setPosition(WORLD.width * 0.5, WORLD.height * 0.46);
    if (this.debugText) this.debugText.setPosition(10, WORLD.height - 44);
    this.renderState();
  }

  update(_time: number, delta: number): void {
    if (this.sim.manualClock) {
      this.renderState();
      this.dom.sync();
      return;
    }
    this.sim.step(delta / 1000);
    this.renderState();
    this.dom.sync();
  }

  renderState(): void {
    if (!this.graphics) return;
    this.overlayText?.setPosition(WORLD.width * 0.5, WORLD.height * 0.46);
    this.debugText?.setPosition(10, WORLD.height - 44);
    const g = this.graphics;
    g.clear();
    this.adGraphics.clear();

    const shake = this.sim.settings.shakeFx ? this.sim.shake : 0;
    const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    this.graphics.setPosition(sx, sy);
    this.drawBackdrop(g);
    this.drawDrops(g);
    this.drawObstacles(g);
    this.drawNunchaku(g);
    this.drawPhantoms(g);
    this.drawEnemies(g);
    this.drawPlayer(g);
    this.drawParticles(g);
    this.syncPixelSprites();
    this.drawFloatTexts();
    this.drawAds(this.adGraphics);
    this.syncAdTexts();

    if (this.sim.flash > 0 && this.sim.settings.flashFx) {
      this.graphics.setPosition(0, 0);
      g.fillStyle(this.sim.flashColor, Math.min(0.3, this.sim.flash));
      g.fillRect(0, 0, WORLD.width, WORLD.height);
    }

    this.updateOverlayText();
    this.updateDebugText();
  }

  private syncPixelSprites(): void {
    const p = this.sim.player;
    const n = this.sim.nunchaku;
    const job = JOBS[this.sim.build.jobId];
    const weapon = WEAPONS[this.sim.build.weaponId];
    this.playerSprite
      .setTexture(JOB_ASSET[this.sim.build.jobId])
      .setPosition(p.x, p.y)
      .setDisplaySize(p.radius * 3.35, p.radius * 3.35)
      .setAlpha(p.invuln > 0 ? 0.78 : 1)
      .setTint(job.color);
    this.nunchakuSprite
      .setTexture(WEAPON_ASSET[this.sim.build.weaponId])
      .setPosition(n.x, n.y)
      .setRotation(Math.atan2(n.vy, n.vx) || this.sim.time * weapon.orbitMul)
      .setDisplaySize(n.headRadius * 3.2, n.headRadius * 3.2)
      .setAlpha(0.96)
      .setTint(weapon.color);

    const liveEnemies = new Set<number>();
    for (const enemy of this.sim.enemies) {
      liveEnemies.add(enemy.id);
      const key = enemy.boss ? "enemy_boss" : ENEMY_ASSET[enemy.role];
      let sprite = this.enemySprites.get(enemy.id);
      if (!sprite) {
        sprite = this.add.image(enemy.x, enemy.y, key).setOrigin(0.5).setDepth(enemy.boss ? 12 : 11);
        this.enemySprites.set(enemy.id, sprite);
      }
      const direction = Math.atan2(enemy.vy, enemy.vx);
      sprite
        .setTexture(key)
        .setPosition(enemy.x, enemy.y)
        .setRotation(Number.isFinite(direction) ? direction + Math.PI * 0.5 : 0)
        .setDisplaySize(enemy.radius * (enemy.boss ? 2.6 : 2.35), enemy.radius * (enemy.boss ? 2.6 : 2.35))
        .setAlpha(enemy.hitCd > 0 ? 0.68 : 1)
        .setTint(enemy.hitCd > 0 ? 0xffffff : enemy.color);
    }
    this.destroyMissing(this.enemySprites, liveEnemies);

    const liveDrops = new Set<number>();
    for (const drop of this.sim.drops) {
      liveDrops.add(drop.id);
      const key = drop.kind === "xp" ? "drop_xp" : drop.item ? equipmentAssetKey(drop.item.assetId) : drop.kind === "legendary" || drop.rarity === "legendary" || drop.rarity === "ancient" ? "drop_legendary" : "drop_item";
      let sprite = this.dropSprites.get(drop.id);
      if (!sprite) {
        sprite = this.add.image(drop.x, drop.y, key).setOrigin(0.5).setDepth(9);
        this.dropSprites.set(drop.id, sprite);
      }
      const pulse = drop.kind === "xp" ? 1 : 1 + Math.sin(this.sim.time * 8 + drop.id) * 0.08;
      sprite
        .setTexture(key)
        .setPosition(drop.x, drop.y)
        .setRotation(this.sim.time * (drop.kind === "xp" ? 0.5 : 1.8))
        .setDisplaySize(drop.radius * 3 * pulse, drop.radius * 3 * pulse)
        .setAlpha(0.92)
        .setTint(drop.color);
    }
    this.destroyMissing(this.dropSprites, liveDrops);

    const livePhantoms = new Set<number>();
    this.sim.phantoms.forEach((phantom, index) => {
      livePhantoms.add(index);
      let sprite = this.phantomSprites.get(index);
      if (!sprite) {
        sprite = this.add.image(phantom.x, phantom.y, WEAPON_ASSET[this.sim.build.weaponId]).setOrigin(0.5).setDepth(10);
        this.phantomSprites.set(index, sprite);
      }
      sprite
        .setTexture(WEAPON_ASSET[this.sim.build.weaponId])
        .setPosition(phantom.x, phantom.y)
        .setRotation(Math.atan2(phantom.vy, phantom.vx) || phantom.angle)
        .setDisplaySize(phantom.headRadius * 2.7, phantom.headRadius * 2.7)
        .setAlpha(0.58)
        .setTint(phantom.color);
    });
    this.destroyMissing(this.phantomSprites, livePhantoms);
  }

  private destroyMissing(map: Map<number, Phaser.GameObjects.Image>, live: Set<number>): void {
    for (const [id, sprite] of map) {
      if (live.has(id)) continue;
      sprite.destroy();
      map.delete(id);
    }
  }

  private destroyMissingText(live: Set<number>): void {
    for (const [id, texts] of this.adTexts) {
      if (live.has(id)) continue;
      for (const text of texts) text.destroy();
      this.adTexts.delete(id);
    }
  }

  private drawBackdrop(g: Phaser.GameObjects.Graphics): void {
    g.fillGradientStyle(0x160b16, 0x241125, 0x20121a, 0x321622, 1);
    g.fillRect(0, 0, WORLD.width, WORLD.height);

    g.lineStyle(1, 0x8f6b3f, 0.18);
    for (let x = 0; x <= WORLD.width; x += 32) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, WORLD.height);
      g.strokePath();
    }
    for (let y = 0; y <= WORLD.height; y += 32) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(WORLD.width, y);
      g.strokePath();
    }

    const scroll = (this.sim.time * 18) % WORLD.width;
    g.lineStyle(6, 0x8f6b3f, 0.24);
    g.beginPath();
    for (let x = -20; x <= WORLD.width + 20; x += 28) {
      const y = 286 + Math.sin((x + scroll) * 0.025) * 10;
      if (x === -20) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokePath();
    g.lineStyle(3, 0xff5f8f, 0.2);
    g.beginPath();
    for (let x = -20; x <= WORLD.width + 20; x += 28) {
      const y = 104 + Math.cos((x - scroll) * 0.022) * 12;
      if (x === -20) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokePath();
    g.lineStyle(2, 0xffd166, 0.22);
    g.beginPath();
    for (let x = -20; x <= WORLD.width + 20; x += 24) {
      const y = 182 + Math.sin((x - scroll * 0.6) * 0.033) * 16;
      if (x === -20) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokePath();

    g.fillStyle(0xffd166, 0.18);
    for (let i = 0; i < 18; i += 1) {
      const x = (i * 53 + scroll * 0.35) % (WORLD.width + 36) - 18;
      const y = 68 + ((i * 41) % 232);
      this.strokeDiamond(g, x, y, 4 + (i % 3));
      g.fillRect(x - 1, y - 7, 2, 14);
      g.fillRect(x - 7, y - 1, 14, 2);
    }
    g.fillStyle(0x51d6ff, 0.14);
    for (let i = 0; i < 12; i += 1) {
      const x = (i * 71 - scroll * 0.22) % (WORLD.width + 42) - 21;
      const y = 86 + ((i * 67) % 198);
      g.fillRect(x - 8, y - 2, 16, 4);
      g.fillRect(x - 2, y - 8, 4, 16);
      this.fillDiamond(g, x, y, 5);
    }

    g.fillStyle(0x020508, 0.22);
    g.fillRect(0, 0, WORLD.width, UI_QUIET_TOP);
    g.fillRect(0, WORLD.height - UI_QUIET_BOTTOM, WORLD.width, UI_QUIET_BOTTOM);

    g.lineStyle(1, 0xffd166, 0.2);
    const arenaInsetX = Math.min(126, Math.max(44, WORLD.width * 0.14));
    const arenaInsetTop = WORLD.layout === "portrait" ? Math.min(92, Math.max(72, WORLD.height * 0.09)) : 58;
    const arenaInsetBottom = WORLD.layout === "portrait" ? 96 : 54;
    g.strokeRect(arenaInsetX, arenaInsetTop, WORLD.width - arenaInsetX * 2, WORLD.height - arenaInsetTop - arenaInsetBottom);
    g.fillStyle(0xff5f8f, 0.04);
    g.fillRect(arenaInsetX + 22, arenaInsetTop + 20, Math.max(32, WORLD.width - (arenaInsetX + 22) * 2), Math.max(32, WORLD.height - arenaInsetTop - arenaInsetBottom - 40));
  }

  private drawPlayer(g: Phaser.GameObjects.Graphics): void {
    const p = this.sim.player;
    const job = JOBS[this.sim.build.jobId];
    const hpRate = Math.max(0, p.hp / Math.max(1, p.maxHp));
    const overdriveActive = this.isOverdriveActive();
    g.lineStyle(1, 0x7dffe2, overdriveActive ? 0.48 : 0.24);
    g.strokeCircle(p.x, p.y, p.pickupRange);
    if (overdriveActive) {
      const pulse = 0.5 + Math.sin(this.sim.time * 18) * 0.5;
      g.lineStyle(2, COLORS.legendary, 0.34 + pulse * 0.24);
      g.strokeCircle(p.x, p.y, p.radius + 15 + pulse * 5);
      g.fillStyle(COLORS.legendary, 0.13);
      g.fillRect(p.x - 3, p.y - p.radius - 18, 6, 9);
      g.fillRect(p.x - 3, p.y + p.radius + 9, 6, 9);
      g.fillRect(p.x - p.radius - 18, p.y - 3, 9, 6);
      g.fillRect(p.x + p.radius + 9, p.y - 3, 9, 6);
    }
    g.fillStyle(0x020508, 0.86);
    g.fillCircle(p.x + 2, p.y + 3, p.radius + 5);
    g.lineStyle(3, 0x020508, 0.95);
    g.strokeCircle(p.x, p.y, p.radius + 4);
    g.fillStyle(job.color, p.invuln > 0 ? 0.68 : 1);
    g.fillCircle(p.x, p.y, p.radius);
    g.fillStyle(0xf3fbff, 0.9);
    g.fillRect(p.x - 3, p.y - p.radius + 5, 6, 4);
    g.fillStyle(0x041016, 0.72);
    g.fillRect(p.x - p.radius + 5, p.y + 1, p.radius * 2 - 10, 4);
    g.lineStyle(2, overdriveActive ? COLORS.legendary : 0xd7fff5, 0.9);
    g.strokeCircle(p.x, p.y, p.radius + 2);
    g.fillStyle(0x081015, 0.75);
    g.fillRect(p.x - 22, p.y - 23, 44, 4);
    g.fillStyle(hpRate > 0.36 ? 0x6fff9e : 0xff7467, 1);
    g.fillRect(p.x - 22, p.y - 23, 44 * hpRate, 4);

    g.lineStyle(1, 0x7bc7ff, 0.74);
    g.strokeCircle(p.targetX, p.targetY, 8);
  }

  private drawNunchaku(g: Phaser.GameObjects.Graphics): void {
    const p = this.sim.player;
    const n = this.sim.nunchaku;
    const weapon = WEAPONS[this.sim.build.weaponId];
    const overdriveActive = this.isOverdriveActive();
    const hot = n.speed > OVERDRIVE_SPEED;
    const chainColor = overdriveActive ? COLORS.legendary : COLORS.nunchaku;
    g.lineStyle(7, 0x020508, 0.62);
    g.lineBetween(p.x, p.y, n.x, n.y);
    g.lineStyle(5, chainColor, 0.14 + n.tension * 0.24);
    g.lineBetween(p.x, p.y, n.x, n.y);
    g.lineStyle(2, hot ? COLORS.legendary : 0xd9eeff, 0.62 + n.tension * 0.32);
    g.lineBetween(p.x, p.y, n.x, n.y);
    this.drawChainTicks(g, p.x, p.y, n.x, n.y, hot ? COLORS.legendary : 0xeaf6ff);
    g.fillStyle(0x020508, 0.9);
    g.fillCircle(n.x + 2, n.y + 2, n.headRadius + 5);
    g.fillStyle(weapon.color, 1);
    g.fillCircle(n.x, n.y, n.headRadius);
    g.fillStyle(0xf7fbff, 0.82);
    g.fillRect(n.x - 3, n.y - n.headRadius + 3, 6, 4);
    g.lineStyle(2, hot ? COLORS.legendary : 0xeaf6ff, 0.9);
    g.strokeCircle(n.x, n.y, n.headRadius + Math.min(9, n.speed * 0.025));
    if (overdriveActive) {
      g.lineStyle(1, COLORS.legendary, 0.5);
      g.lineBetween(n.prevX, n.prevY, n.x, n.y);
      g.fillStyle(COLORS.legendary, 0.5);
      g.fillRect(n.prevX - 2, n.prevY - 2, 4, 4);
    }
  }

  private drawPhantoms(g: Phaser.GameObjects.Graphics): void {
    for (const phantom of this.sim.phantoms) {
      const hot = phantom.speed > OVERDRIVE_SPEED * 0.65;
      g.lineStyle(4, 0x020508, 0.5);
      g.lineBetween(this.sim.player.x, this.sim.player.y, phantom.x, phantom.y);
      g.lineStyle(1, phantom.color, 0.32);
      g.lineBetween(this.sim.player.x, this.sim.player.y, phantom.x, phantom.y);
      g.lineStyle(2, hot ? COLORS.legendary : phantom.color, 0.82);
      g.strokeCircle(phantom.x, phantom.y, phantom.headRadius + (hot ? 6 : 3));
      g.fillStyle(0x020508, 0.72);
      g.fillCircle(phantom.x + 2, phantom.y + 2, phantom.headRadius + 3);
      g.fillStyle(phantom.color, 0.88);
      g.fillCircle(phantom.x, phantom.y, phantom.headRadius);
      g.fillStyle(0xf7fbff, 0.68);
      g.fillRect(phantom.x - 2, phantom.y - phantom.headRadius + 3, 4, 3);
    }
  }

  private drawEnemies(g: Phaser.GameObjects.Graphics): void {
    for (const enemy of this.sim.enemies) {
      const hpRate = Math.max(0, enemy.hp / Math.max(1, enemy.maxHp));
      const flash = enemy.hitCd > 0 ? 0xffffff : enemy.color;
      const outline = enemy.boss ? 5 : 3;
      g.fillStyle(0x020508, enemy.boss ? 0.9 : 0.78);
      if (enemy.role === "stalker" && !enemy.boss) {
        const dir = this.enemyDirection(enemy);
        this.fillOrientedTriangle(g, enemy.x + 2, enemy.y + 3, enemy.radius + outline, dir.x, dir.y);
      } else if (enemy.role === "zoner" && !enemy.boss) {
        this.fillDiamond(g, enemy.x + 2, enemy.y + 3, enemy.radius + outline);
      } else {
        g.fillRoundedRect(enemy.x - enemy.radius - outline + 2, enemy.y - enemy.radius - outline + 3, (enemy.radius + outline) * 2, (enemy.radius + outline) * 2, enemy.boss ? 7 : 3);
      }
      if (enemy.boss) {
        this.drawBossTelegraph(g, enemy);
        g.fillStyle(flash, 0.96);
        g.fillRoundedRect(enemy.x - enemy.radius, enemy.y - enemy.radius, enemy.radius * 2, enemy.radius * 2, 5);
        g.fillStyle(0x081015, 0.62);
        g.fillRect(enemy.x - enemy.radius + 8, enemy.y - 4, enemy.radius * 2 - 16, 8);
        g.fillStyle(COLORS.boss, 0.92);
        for (let i = 0; i < enemy.phase; i += 1) g.fillRect(enemy.x - 10 + i * 8, enemy.y - enemy.radius - 9, 5, 5);
        g.lineStyle(2, enemy.phase >= 3 ? COLORS.danger : COLORS.boss, 0.86);
        g.strokeCircle(enemy.x, enemy.y, enemy.radius + 8 + enemy.phase * 4);
      } else if (enemy.role === "stalker") {
        const dir = this.enemyDirection(enemy);
        g.fillStyle(flash, 0.96);
        this.fillOrientedTriangle(g, enemy.x, enemy.y, enemy.radius, dir.x, dir.y);
        g.fillStyle(0x041016, 0.64);
        g.fillRect(enemy.x - 3, enemy.y - 2, 6, 4);
      } else if (enemy.role === "bruiser") {
        g.fillStyle(flash, 0.96);
        g.fillRoundedRect(enemy.x - enemy.radius, enemy.y - enemy.radius, enemy.radius * 2, enemy.radius * 2, 3);
        g.fillStyle(0x041016, 0.62);
        g.fillRect(enemy.x - enemy.radius + 4, enemy.y - 4, enemy.radius * 2 - 8, 8);
      } else if (enemy.role === "zoner") {
        g.fillStyle(flash, 0.96);
        this.fillDiamond(g, enemy.x, enemy.y, enemy.radius);
        g.lineStyle(1, 0xf7fbff, 0.58);
        g.lineBetween(enemy.x - enemy.radius + 4, enemy.y, enemy.x + enemy.radius - 4, enemy.y);
        g.lineBetween(enemy.x, enemy.y - enemy.radius + 4, enemy.x, enemy.y + enemy.radius - 4);
      } else {
        g.fillStyle(flash, 0.96);
        g.fillCircle(enemy.x, enemy.y, enemy.radius);
        g.fillStyle(0x041016, 0.58);
        g.fillRect(enemy.x - 5, enemy.y - 2, 10, 4);
      }
      if (enemy.elite && !enemy.boss) {
        g.lineStyle(2, COLORS.legendary, 0.72);
        g.strokeCircle(enemy.x, enemy.y, enemy.radius + 4);
        g.fillStyle(COLORS.legendary, 0.82);
        g.fillRect(enemy.x - 5, enemy.y - enemy.radius - 8, 10, 3);
      }
      g.fillStyle(0x000000, 0.58);
      g.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 8, enemy.radius * 2, 3);
      g.fillStyle(enemy.boss ? COLORS.boss : 0xa8f7bf, 1);
      g.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 8, enemy.radius * 2 * hpRate, 3);
    }
  }

  private drawDrops(g: Phaser.GameObjects.Graphics): void {
    for (const drop of this.sim.drops) {
      const highRarity = drop.kind === "legendary" || drop.rarity === "epic" || drop.rarity === "legendary" || drop.rarity === "ancient";
      if (highRarity) {
        const pulse = 0.5 + Math.sin(this.sim.time * 8) * 0.5;
        g.lineStyle(2, drop.color, 0.42 + pulse * 0.2);
        g.lineBetween(drop.x, 0, drop.x, WORLD.height);
        g.lineStyle(1, 0xf7fbff, 0.38 + pulse * 0.18);
        g.lineBetween(drop.x - 18, drop.y, drop.x + 18, drop.y);
        g.lineBetween(drop.x, drop.y - 18, drop.x, drop.y + 18);
        g.fillStyle(drop.color, 0.08);
        g.fillRect(drop.x - 16, 0, 32, WORLD.height);
        g.lineStyle(2, 0x020508, 0.8);
        this.strokeDiamond(g, drop.x + 2, drop.y + 2, drop.radius + 8);
        g.lineStyle(2, drop.color, 0.9);
        this.strokeDiamond(g, drop.x, drop.y, drop.radius + 8 + pulse * 4);
      }
      g.fillStyle(0x020508, 0.76);
      g.fillCircle(drop.x + 2, drop.y + 2, drop.radius + 3);
      g.fillStyle(drop.color, 1);
      if (drop.kind !== "xp") {
        this.fillDiamond(g, drop.x, drop.y, drop.radius);
      } else {
        g.fillCircle(drop.x, drop.y, drop.radius);
      }
      g.lineStyle(1, highRarity ? drop.color : 0xffffff, 0.62);
      g.strokeCircle(drop.x, drop.y, drop.radius + 2);
    }
  }

  private drawObstacles(g: Phaser.GameObjects.Graphics): void {
    for (const obstacle of this.sim.obstacles) {
      const alpha = Math.max(0.18, obstacle.life / obstacle.maxLife);
      const warning = obstacle.maxLife <= 5.2;
      if (warning) {
        g.lineStyle(2, COLORS.danger, 0.22 + alpha * 0.3);
        g.strokeRect(obstacle.x - obstacle.w / 2 - 5, obstacle.y - obstacle.h / 2 - 5, obstacle.w + 10, obstacle.h + 10);
      }
      g.fillStyle(0x020508, 0.44);
      g.fillRoundedRect(obstacle.x - obstacle.w / 2 + 2, obstacle.y - obstacle.h / 2 + 2, obstacle.w, obstacle.h, 4);
      g.fillStyle(warning ? COLORS.danger : COLORS.wall, 0.26 + alpha * 0.34);
      g.fillRoundedRect(obstacle.x - obstacle.w / 2, obstacle.y - obstacle.h / 2, obstacle.w, obstacle.h, 4);
      g.lineStyle(1, warning ? COLORS.boss : 0xdbe5f5, 0.32 + alpha * 0.28);
      g.strokeRoundedRect(obstacle.x - obstacle.w / 2, obstacle.y - obstacle.h / 2, obstacle.w, obstacle.h, 4);
      g.fillStyle(0xf7fbff, 0.2 + alpha * 0.22);
      for (let x = obstacle.x - obstacle.w / 2 + 5; x < obstacle.x + obstacle.w / 2 - 4; x += 10) {
        g.fillRect(x, obstacle.y - 1, 5, 2);
      }
    }
  }

  private drawAds(g: Phaser.GameObjects.Graphics): void {
    for (const ad of this.sim.activeAds) {
      const lifeAlpha = Phaser.Math.Clamp(ad.life / Math.max(1, ad.maxLife), 0, 1);
      const alpha = Math.min(ad.opacity, ad.opacity * (0.42 + lifeAlpha * 0.58));
      const x = ad.x - ad.w / 2;
      const y = ad.y - ad.h / 2;
      const accent = this.adAccentColor(ad);
      g.fillStyle(0x020508, alpha * 0.72);
      g.fillRect(x + 4, y + 5, ad.w, ad.h);
      g.fillStyle(ad.type === "video" ? 0x160724 : 0x07102a, alpha);
      g.fillRect(x, y, ad.w, ad.h);
      g.lineStyle(2, accent, alpha * 0.86);
      g.strokeRect(x, y, ad.w, ad.h);

      if (ad.type === "video") {
        this.drawVideoAd(g, ad, x, y, alpha, accent);
      } else {
        this.drawBannerAd(g, ad, x, y, alpha, accent);
      }
    }
  }

  private drawBannerAd(g: Phaser.GameObjects.Graphics, ad: ActiveAdState, x: number, y: number, alpha: number, accent: number): void {
    const scroll = (ad.phase * 42) % 24;
    g.fillStyle(accent, alpha * 0.18);
    for (let px = x - scroll; px < x + ad.w; px += 24) {
      g.fillRect(px, y, 10, ad.h);
    }
    g.fillStyle(0xf7fbff, alpha * 0.18);
    g.fillRect(x + 10, y + 8, Math.max(44, ad.w * 0.18), 5);
    g.fillRect(x + 10, y + ad.h - 13, Math.max(70, ad.w * 0.38), 4);
    g.fillStyle(accent, alpha * 0.36);
    g.fillRect(x + ad.w - 48, y + 8, 32, ad.h - 16);
  }

  private drawVideoAd(g: Phaser.GameObjects.Graphics, ad: ActiveAdState, x: number, y: number, alpha: number, accent: number): void {
    const pulse = 0.5 + Math.sin(ad.phase * 7) * 0.5;
    g.fillStyle(0x000000, alpha * 0.32);
    g.fillRect(x + 8, y + 10, ad.w - 16, ad.h - 28);
    g.fillStyle(accent, alpha * (0.18 + pulse * 0.12));
    for (let py = y + 12; py < y + ad.h - 22; py += 8) {
      g.fillRect(x + 10, py, ad.w - 20, 2);
    }
    const cx = x + 28;
    const cy = y + ad.h * 0.44;
    g.fillStyle(0xf7fbff, alpha * 0.66);
    g.fillTriangle(cx - 6, cy - 9, cx - 6, cy + 9, cx + 10, cy);
    g.fillStyle(accent, alpha * 0.84);
    g.fillRect(x + 10, y + ad.h - 13, (ad.w - 20) * Phaser.Math.Clamp(1 - ad.life / Math.max(1, ad.maxLife), 0.06, 0.96), 4);
  }

  private syncAdTexts(): void {
    const live = new Set<number>();
    for (const ad of this.sim.activeAds) {
      live.add(ad.instanceId);
      let texts = this.adTexts.get(ad.instanceId);
      if (!texts) {
        texts = [
          this.add.text(0, 0, "", { fontFamily: "Menlo, Consolas, monospace", fontSize: "9px", color: "#f3fbff" }).setDepth(19),
          this.add.text(0, 0, "", { fontFamily: "Menlo, Consolas, monospace", fontSize: "11px", color: "#ffffff" }).setDepth(19),
          this.add.text(0, 0, "", { fontFamily: "Menlo, Consolas, monospace", fontSize: "8px", color: "#bdefff" }).setDepth(19),
        ];
        this.adTexts.set(ad.instanceId, texts);
      }
      const x = ad.x - ad.w / 2;
      const y = ad.y - ad.h / 2;
      const label = ad.type === "video" ? `CM VIDEO ${ad.brand}` : `AD ${ad.brand}`;
      texts[0].setText(label).setPosition(x + 10, y + 6).setAlpha(ad.opacity);
      texts[1].setText(ad.title).setPosition(x + 10, y + (ad.type === "video" ? ad.h - 32 : 17)).setAlpha(Math.min(0.92, ad.opacity + 0.08));
      texts[2].setText(ad.copy).setPosition(x + 10, y + ad.h - 14).setAlpha(ad.opacity * 0.9);
    }
    this.destroyMissingText(live);
  }

  private adAccentColor(ad: ActiveAdState): number {
    if (ad.rarity === "legendary") return COLORS.legendary;
    if (ad.rarity === "epic") return COLORS.boss;
    if (ad.rarity === "rare") return 0x16e7ff;
    return ad.type === "video" ? 0xff4fd8 : 0x7dffe2;
  }

  private drawParticles(g: Phaser.GameObjects.Graphics): void {
    for (const particle of this.sim.particles) {
      g.fillStyle(particle.color, Math.max(0, particle.life / particle.maxLife));
      g.fillRect(particle.x - particle.size * 0.5, particle.y - particle.size * 0.5, particle.size, particle.size);
    }
  }

  private drawBossTelegraph(g: Phaser.GameObjects.Graphics, enemy: { x: number; y: number; radius: number; phase: number; attackCd: number }): void {
    const cycle = enemy.phase >= 3 ? 3.2 : 4.8;
    const charge = Phaser.Math.Clamp(1 - enemy.attackCd / cycle, 0, 1);
    if (charge < 0.52) return;
    const alpha = (charge - 0.52) / 0.48;
    const radius = enemy.radius + 18 + alpha * 22;
    g.lineStyle(3, 0x020508, 0.8);
    g.strokeCircle(enemy.x, enemy.y, radius + 2);
    g.lineStyle(2, enemy.phase >= 3 ? COLORS.danger : COLORS.boss, 0.28 + alpha * 0.48);
    g.strokeCircle(enemy.x, enemy.y, radius);
    g.lineStyle(1, COLORS.danger, 0.22 + alpha * 0.4);
    g.lineBetween(enemy.x - radius, enemy.y, enemy.x + radius, enemy.y);
    g.lineBetween(enemy.x, enemy.y - radius, enemy.x, enemy.y + radius);
  }

  private drawChainTicks(g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number, color: number): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 18) return;
    const nx = dx / len;
    const ny = dy / len;
    g.fillStyle(color, 0.55);
    for (let d = 16; d < len - 12; d += 18) {
      const x = x1 + nx * d;
      const y = y1 + ny * d;
      g.fillRect(x - 2, y - 2, 4, 4);
    }
  }

  private enemyDirection(enemy: { x: number; y: number; vx: number; vy: number }): { x: number; y: number } {
    const speed = Math.hypot(enemy.vx, enemy.vy);
    if (speed > 8) return { x: enemy.vx / speed, y: enemy.vy / speed };
    const dx = this.sim.player.x - enemy.x;
    const dy = this.sim.player.y - enemy.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    return { x: dx / dist, y: dy / dist };
  }

  private fillOrientedTriangle(g: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, dirX: number, dirY: number): void {
    const sideX = -dirY;
    const sideY = dirX;
    g.fillTriangle(
      x + dirX * radius,
      y + dirY * radius,
      x - dirX * radius * 0.72 + sideX * radius * 0.82,
      y - dirY * radius * 0.72 + sideY * radius * 0.82,
      x - dirX * radius * 0.72 - sideX * radius * 0.82,
      y - dirY * radius * 0.72 - sideY * radius * 0.82
    );
  }

  private fillDiamond(g: Phaser.GameObjects.Graphics, x: number, y: number, radius: number): void {
    g.fillTriangle(x, y - radius, x + radius, y, x, y + radius);
    g.fillTriangle(x, y - radius, x - radius, y, x, y + radius);
  }

  private strokeDiamond(g: Phaser.GameObjects.Graphics, x: number, y: number, radius: number): void {
    g.beginPath();
    g.moveTo(x, y - radius);
    g.lineTo(x + radius, y);
    g.lineTo(x, y + radius);
    g.lineTo(x - radius, y);
    g.closePath();
    g.strokePath();
  }

  private isOverdriveActive(): boolean {
    const state = this.sim as unknown as { overdrive?: boolean };
    return state.overdrive === true && this.sim.nunchaku.speed > OVERDRIVE_SPEED;
  }

  private drawFloatTexts(): void {
    // Phaser text pooling is overkill for these short-lived labels; DOM-free canvas labels
    // are intentionally omitted from automation-critical state.
  }

  private updateOverlayText(): void {
    if (this.sim.mode === "title") {
      this.overlayText.setText(`呪われた配信闘技場\nSTREAM RAID ARENA\n\nドラッグ/WASDで移動  慣性で呪鎖を振り回す`);
      this.overlayText.setVisible(true);
      return;
    }
    if (this.sim.mode === "ended") {
      const cleared = this.sim.player.hp > 0;
      this.overlayText.setText(`${cleared ? "ラン成功" : "ラン失敗"}\nSCORE ${this.sim.getScorePreview()}\n開始ボタン / Enterで再挑戦`);
      this.overlayText.setVisible(true);
      return;
    }
    if (this.sim.pauseMode === "mutation") {
      this.overlayText.setText("変異を選択");
      this.overlayText.setVisible(true);
      return;
    }
    if (this.sim.waveState === "reward") {
      this.overlayText.setText(`WAVE ${this.sim.wave} CLEAR`);
      this.overlayText.setVisible(true);
      return;
    }
    this.overlayText.setVisible(false);
  }

  private updateDebugText(): void {
    if (!this.sim.settings.debugHud) {
      this.debugText.setText("");
      return;
    }
    this.debugText.setText(
      `SEED ${this.sim.options.seed}  T ${formatTime(this.sim.time)}  W ${this.sim.wave} ${this.sim.waveState} ${this.sim.waveKills}/${this.sim.waveTarget}  E ${this.sim.enemies.length}\n` +
        `SW ${Math.round(this.sim.nunchaku.speed)}  TN ${Math.round(this.sim.nunchaku.tension * 100)}%  SCORE ${this.sim.getScorePreview()}`
    );
  }
}
