import * as Phaser from "phaser";
import { COLORS, WORLD } from "../content/balance";
import { JOBS } from "../content/jobs";
import { WEAPONS } from "../content/weapons";
import type { GameSim } from "../sim/GameSim";
import { formatTime } from "../sim/math";
import type { DomBridge } from "../ui/dom";

const UI_QUIET_TOP = 52;
const UI_QUIET_BOTTOM = 54;
const OVERDRIVE_SPEED = 260;

export class GameScene extends Phaser.Scene {
  private readonly sim: GameSim;
  private readonly dom: DomBridge;
  private graphics!: Phaser.GameObjects.Graphics;
  private overlayText!: Phaser.GameObjects.Text;
  private debugText!: Phaser.GameObjects.Text;

  constructor(sim: GameSim, dom: DomBridge) {
    super("gameplay");
    this.sim = sim;
    this.dom = dom;
  }

  create(): void {
    this.game.canvas.id = "gameCanvas";
    this.game.canvas.setAttribute("aria-label", "Game Canvas");
    this.cameras.main.setBackgroundColor("#071017");
    this.graphics = this.add.graphics();
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
      this.sim.setPointer(true, pointer.worldX, pointer.worldY);
      if (this.sim.mode !== "running" && this.sim.pauseMode === null) this.sim.startOrResolve();
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) this.sim.setPointer(true, pointer.worldX, pointer.worldY);
    });
    this.input.on("pointerup", () => this.sim.setPointer(false, this.sim.player.targetX, this.sim.player.targetY));
    this.input.on("pointerupoutside", () => this.sim.setPointer(false, this.sim.player.targetX, this.sim.player.targetY));

    this.renderState();
    this.dom.sync();
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
    const g = this.graphics;
    g.clear();

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
    this.drawFloatTexts();

    if (this.sim.flash > 0 && this.sim.settings.flashFx) {
      this.graphics.setPosition(0, 0);
      g.fillStyle(this.sim.flashColor, Math.min(0.3, this.sim.flash));
      g.fillRect(0, 0, WORLD.width, WORLD.height);
    }

    this.updateOverlayText();
    this.updateDebugText();
  }

  private drawBackdrop(g: Phaser.GameObjects.Graphics): void {
    g.fillGradientStyle(0x081017, 0x0b1821, 0x070d12, 0x101018, 1);
    g.fillRect(0, 0, WORLD.width, WORLD.height);

    g.lineStyle(1, 0x233447, 0.3);
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

    const scroll = (this.sim.time * 16) % WORLD.width;
    g.fillStyle(0x7d8ba0, 0.32);
    for (let i = -1; i < 9; i += 1) {
      const x = i * 90 - scroll * 0.35;
      g.fillRect(x, 282, 20, 6);
      g.fillTriangle(x + 28, 282, x + 54, 270, x + 82, 282);
      g.fillRect(x + 60, 276, 24, 6);
    }

    g.lineStyle(2, 0x6f7f95, 0.45);
    g.lineBetween(0, 310, WORLD.width, 310);
    g.fillStyle(0x5f6978, 0.52);
    for (let x = 0; x < WORLD.width; x += 12) g.fillRect(x, 314, 8, 4);

    g.fillStyle(0x020508, 0.22);
    g.fillRect(0, 0, WORLD.width, UI_QUIET_TOP);
    g.fillRect(0, WORLD.height - UI_QUIET_BOTTOM, WORLD.width, UI_QUIET_BOTTOM);

    g.lineStyle(1, 0x7dc7ff, 0.14);
    g.strokeRect(126, 58, WORLD.width - 252, WORLD.height - 112);
    g.fillStyle(0x9ed8ff, 0.04);
    g.fillRect(148, 78, WORLD.width - 296, WORLD.height - 156);
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
    if (n.snapFlash > 0) {
      g.lineStyle(2, COLORS.gift, 0.8 * n.snapFlash);
      g.strokeCircle(n.x, n.y, n.headRadius + 18 * n.snapFlash);
      g.lineStyle(1, COLORS.legendary, 0.7 * n.snapFlash);
      g.strokeCircle(n.x, n.y, n.headRadius + 28 * n.snapFlash);
    }
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
      this.overlayText.setText(`1ビット・ヌンチャクサバイバーズ\nOVERDRIVE\n\nドラッグ/WASDで移動  SpaceでSNAP`);
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
        `SW ${Math.round(this.sim.nunchaku.speed)}  TN ${Math.round(this.sim.nunchaku.tension * 100)}%  SNAP ${this.sim.nunchaku.snapCd.toFixed(1)}  SCORE ${this.sim.getScorePreview()}`
    );
  }
}
