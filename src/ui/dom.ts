import { GLOSSARY_TERMS } from "../content/glossary";
import { JOBS, type JobId } from "../content/jobs";
import { RARITIES, formatAffix } from "../content/equipment";
import { WEAPONS, type WeaponId } from "../content/weapons";
import { getBuildLists, type GameSim } from "../sim/GameSim";
import { formatTime } from "../sim/math";

type El<T extends HTMLElement = HTMLElement> = T | null;

export class DomBridge {
  private readonly sim: GameSim;
  private readonly els = {
    hpChip: byId("hpChip"),
    levelChip: byId("levelChip"),
    timeChip: byId("timeChip"),
    snapChip: byId("snapChip"),
    threatChip: byId("threatChip"),
    objectiveChip: byId("objectiveChip"),
    bossChip: byId("bossChip"),
    startBtn: byId<HTMLButtonElement>("startBtn"),
    mobileStartBtn: byId<HTMLButtonElement>("mobileStartBtn"),
    menuFloatingBtn: byId<HTMLButtonElement>("menuFloatingBtn"),
    mobileMenuBtn: byId<HTMLButtonElement>("mobileMenuBtn"),
    snapTouchBtn: byId<HTMLButtonElement>("snapTouchBtn"),
    mobileSnapBtn: byId<HTMLButtonElement>("mobileSnapBtn"),
    menuModal: byId("menuModal"),
    closeMenuBtn: byId<HTMLButtonElement>("closeMenuBtn"),
    menuStatus: byId("menuStatus"),
    charName: byId("charNameVal"),
    charSpec: byId("charSpecVal"),
    rollCharBtn: byId<HTMLButtonElement>("rollCharBtn"),
    jobSelect: byId<HTMLSelectElement>("jobSelect"),
    weaponSelect: byId<HTMLSelectElement>("weaponSelect"),
    audioBtn: byId<HTMLButtonElement>("audioBtn"),
    burstBtn: byId<HTMLButtonElement>("burstBtn"),
    systemTextBtn: byId<HTMLButtonElement>("systemTextBtn"),
    systemFlashBtn: byId<HTMLButtonElement>("systemFlashBtn"),
    systemShakeBtn: byId<HTMLButtonElement>("systemShakeBtn"),
    gift100Btn: byId<HTMLButtonElement>("gift100Btn"),
    gift500Btn: byId<HTMLButtonElement>("gift500Btn"),
    gift1000Btn: byId<HTMLButtonElement>("gift1000Btn"),
    giftEventPanel: byId("giftEventPanel"),
    giftEventName: byId("giftEventName"),
    giftEventMeta: byId("giftEventMeta"),
    streamHookBtn: byId<HTMLButtonElement>("streamHookBtn"),
    streamHookStatus: byId("streamHookStatus"),
    buyCreditBtn: byId<HTMLButtonElement>("buyCreditBtn"),
    creditVal: byId("creditVal"),
    giftVal: byId("giftVal"),
    grossVal: byId("grossVal"),
    feeVal: byId("feeVal"),
    levelModal: byId("levelModal"),
    levelChoices: byId("levelChoices"),
    levelAutoTimer: byId("levelAutoTimerVal"),
    rerollSkillBtn: byId<HTMLButtonElement>("rerollSkillBtn"),
    mutationModal: byId("mutationModal"),
    mutationChoices: byId("mutationChoices"),
    pickupModal: byId("pickupModal"),
    pickupSlotLabel: byId("pickupSlotLabel"),
    pickupAutoTimer: byId("pickupAutoTimerVal"),
    pickupCompareDelta: byId("pickupCompareDelta"),
    pickupCurrentTitle: byId("pickupCurrentTitle"),
    pickupCurrentStats: byId("pickupCurrentStats"),
    pickupDropTitle: byId("pickupDropTitle"),
    pickupDropStats: byId("pickupDropStats"),
    pickupKeepBtn: byId<HTMLButtonElement>("pickupKeepBtn"),
    pickupDiscardBtn: byId<HTMLButtonElement>("pickupDiscardBtn"),
    glossaryModal: byId("glossaryModal"),
    glossaryList: byId("glossaryList"),
    openGlossaryBtn: byId<HTMLButtonElement>("openGlossaryBtn"),
    closeGlossaryBtn: byId<HTMLButtonElement>("closeGlossaryBtn"),
  };

  private streamPollTimer = 0;
  private streamEnabled = false;
  private choiceCache = "";

  constructor(sim: GameSim) {
    this.sim = sim;
    this.populateBuildOptions();
    this.renderGlossary();
    this.bindEvents();
  }

  sync(): void {
    const p = this.sim.player;
    const boss = this.sim.enemies.find((enemy) => enemy.boss);
    const menuOpen = this.sim.pauseMode === "menu";
    const glossaryOpen = this.sim.glossaryOpen;
    setText(this.els.hpChip, `HP ${Math.max(0, Math.round(p.hp))}/${Math.round(p.maxHp)}`);
    setText(this.els.levelChip, `LV ${p.level} XP ${Math.floor(p.xp)}/${Math.floor(p.nextXp)}`);
    setText(this.els.timeChip, `W${this.sim.wave} ${this.sim.waveKills}/${this.sim.waveTarget}`);
    setText(this.els.snapChip, this.sim.nunchaku.snapCd <= 0 ? "SNAP OK" : `SNAP ${this.sim.nunchaku.snapCd.toFixed(1)}`);
    setText(this.els.threatChip, `脅威 ${Math.round(this.sim.threatScore)}`);
    setText(
      this.els.objectiveChip,
      this.sim.waveState === "reward"
        ? "報酬回収"
        : this.sim.objective
        ? `目標: ${this.sim.objective.label} ${Math.floor(this.sim.objective.progress)}/${this.sim.objective.target}`
        : "目標: 待機"
    );
    setText(this.els.bossChip, boss ? `BOSS ${Math.max(0, Math.round((boss.hp / boss.maxHp) * 100))}%` : `BOSS W${this.sim.nextBossWave}`);
    setText(this.els.charName, this.sim.build.characterName);
    setText(this.els.charSpec, `${JOBS[this.sim.build.jobId].name} / ${WEAPONS[this.sim.build.weaponId].name}`);
    setText(this.els.menuStatus, this.sim.mode === "running" ? "ラン中" : this.sim.mode === "ended" ? `終了 SCORE ${this.sim.getScorePreview()}` : "ラン準備");
    setText(this.els.creditVal, String(this.sim.economy.demoEnergy));
    setText(this.els.giftVal, `${this.sim.economy.giftDiamonds}D`);
    setText(this.els.grossVal, "--");
    setText(this.els.feeVal, "--");
    setText(this.els.giftEventName, this.sim.giftEvent.kind === "idle" ? "イベント: 待機" : `イベント: ${this.sim.giftEvent.name}`);
    setText(this.els.giftEventMeta, `危険 ${this.sim.giftEvent.risk} / 報酬 ${this.sim.giftEvent.reward}${this.sim.giftEvent.timer > 0 ? ` / ${this.sim.giftEvent.timer.toFixed(1)}s` : ""}`);
    this.els.giftEventPanel?.classList.toggle("idle", this.sim.giftEvent.kind === "idle");
    this.els.giftEventPanel?.classList.toggle("active", this.sim.giftEvent.kind !== "idle");
    setText(this.els.audioBtn, `音 ${this.sim.settings.audio ? "ON" : "OFF"}`);
    setText(this.els.burstBtn, menuOpen ? "スナップ(停止中)" : "スナップ");
    setText(this.els.systemTextBtn, `詳細: ${this.sim.settings.debugHud ? "ON" : "OFF"}`);
    setText(this.els.systemFlashBtn, `フラッシュ: ${this.sim.settings.flashFx ? "ON" : "OFF"}`);
    setText(this.els.systemShakeBtn, `シェイク: ${this.sim.settings.shakeFx ? "ON" : "OFF"}`);
    setText(this.els.streamHookBtn, `ライブ連動: ${this.streamEnabled ? "ON" : "OFF"}`);
    setText(this.els.streamHookStatus, this.streamEnabled ? "http://127.0.0.1:8091/events" : "ローカルのみ");
    setText(this.els.startBtn, this.sim.mode === "running" ? "再開/選択" : this.sim.mode === "ended" ? "再挑戦" : "ラン開始");

    toggleHidden(this.els.menuModal, !menuOpen);
    toggleHidden(this.els.levelModal, this.sim.pauseMode !== "levelup");
    toggleHidden(this.els.mutationModal, this.sim.pauseMode !== "mutation");
    toggleHidden(this.els.pickupModal, this.sim.pauseMode !== "pickup_compare");
    toggleHidden(this.els.glossaryModal, !glossaryOpen);
    document.body.classList.toggle("menu-open", menuOpen || glossaryOpen);
    document.body.classList.toggle("is-running", this.sim.mode === "running" && this.sim.pauseMode === null);
    document.body.classList.toggle("is-ended", this.sim.mode === "ended");
    document.body.classList.toggle("has-objective", Boolean(this.sim.objective));
    document.body.classList.toggle("has-boss", Boolean(boss));
    setPressed(this.els.menuFloatingBtn, menuOpen);
    setPressed(this.els.mobileMenuBtn, menuOpen);
    setPressed(this.els.openGlossaryBtn, glossaryOpen);
    setDisabled(this.els.burstBtn, menuOpen, menuOpen ? "メニュー中は戦闘が停止しているため使用できません" : "");

    this.renderChoices();
    this.renderPickup();
  }

  handleKeyDown(ev: KeyboardEvent): void {
    if (ev.repeat) return;
    const key = ev.key.toLowerCase();
    if (key === "arrowleft" || key === "a") this.sim.setKey("left", true);
    if (key === "arrowright" || key === "d") this.sim.setKey("right", true);
    if (key === "arrowup" || key === "w") this.sim.setKey("up", true);
    if (key === "arrowdown" || key === "s") this.sim.setKey("down", true);
    if (key === " " || ev.code === "Space") {
      ev.preventDefault();
      this.sim.triggerSnap();
    }
    if (key === "enter") this.sim.startOrResolve();
    if (key === "m") {
      if (this.sim.glossaryOpen) this.setGlossaryOpen(false);
      else this.sim.toggleMenu();
    }
    if (key === "escape") {
      if (this.sim.glossaryOpen) this.setGlossaryOpen(false);
      else this.closeMenu();
    }
    if (key === "1") this.resolveNumber(0);
    if (key === "2") this.resolveNumber(1);
    if (key === "3") this.resolveNumber(2);
    if (key === "f") this.toggleFullscreen();
    if (key === "h") this.sim.toggleDebugHud();
    this.sync();
  }

  handleKeyUp(ev: KeyboardEvent): void {
    const key = ev.key.toLowerCase();
    if (key === "arrowleft" || key === "a") this.sim.setKey("left", false);
    if (key === "arrowright" || key === "d") this.sim.setKey("right", false);
    if (key === "arrowup" || key === "w") this.sim.setKey("up", false);
    if (key === "arrowdown" || key === "s") this.sim.setKey("down", false);
  }

  private bindEvents(): void {
    this.els.startBtn?.addEventListener("click", () => this.startOrResolve());
    this.els.mobileStartBtn?.addEventListener("click", () => this.startOrResolve());
    this.els.menuFloatingBtn?.addEventListener("click", () => {
      this.sim.toggleMenu();
      this.sync();
    });
    this.els.mobileMenuBtn?.addEventListener("click", () => {
      this.sim.toggleMenu();
      this.sync();
    });
    this.els.closeMenuBtn?.addEventListener("click", () => {
      this.closeMenu();
      this.sync();
    });
    this.els.snapTouchBtn?.addEventListener("click", () => this.snap());
    this.els.mobileSnapBtn?.addEventListener("click", () => this.snap());
    this.els.burstBtn?.addEventListener("click", () => this.snap());
    this.els.rollCharBtn?.addEventListener("click", () => {
      this.sim.rollCharacter();
      this.sync();
    });
    this.els.jobSelect?.addEventListener("change", () => this.updateBuild());
    this.els.weaponSelect?.addEventListener("change", () => this.updateBuild());
    this.els.audioBtn?.addEventListener("click", () => {
      this.sim.toggleAudio();
      this.sync();
    });
    this.els.systemTextBtn?.addEventListener("click", () => {
      this.sim.toggleDebugHud();
      this.sync();
    });
    this.els.systemFlashBtn?.addEventListener("click", () => {
      this.sim.toggleFlash();
      this.sync();
    });
    this.els.systemShakeBtn?.addEventListener("click", () => {
      this.sim.toggleShake();
      this.sync();
    });
    this.els.gift100Btn?.addEventListener("click", () => this.gift(100));
    this.els.gift500Btn?.addEventListener("click", () => this.gift(500));
    this.els.gift1000Btn?.addEventListener("click", () => this.gift(1000));
    this.els.buyCreditBtn?.addEventListener("click", () => {
      this.sim.refillDemoEnergy();
      this.sync();
    });
    this.els.streamHookBtn?.addEventListener("click", () => this.toggleStreamHook());
    this.els.rerollSkillBtn?.addEventListener("click", () => {
      this.sim.rerollLevelChoices();
      this.sync();
    });
    this.els.pickupKeepBtn?.addEventListener("click", () => {
      this.sim.resolvePickup(true);
      this.sync();
    });
    this.els.pickupDiscardBtn?.addEventListener("click", () => {
      this.sim.resolvePickup(false);
      this.sync();
    });
    this.els.openGlossaryBtn?.addEventListener("click", () => {
      this.setGlossaryOpen(true);
      this.sync();
    });
    this.els.closeGlossaryBtn?.addEventListener("click", () => {
      this.setGlossaryOpen(false);
      this.sync();
    });
    this.els.menuModal?.addEventListener("pointerdown", (ev) => {
      if (ev.target === this.els.menuModal) {
        this.closeMenu();
        this.sync();
      }
    });
    this.els.glossaryModal?.addEventListener("pointerdown", (ev) => {
      if (ev.target === this.els.glossaryModal) {
        this.setGlossaryOpen(false);
        this.sync();
      }
    });
  }

  private closeMenu(): void {
    this.setGlossaryOpen(false);
    this.sim.toggleMenu(false);
  }

  private setGlossaryOpen(open: boolean): void {
    this.sim.glossaryOpen = open;
  }

  private startOrResolve(): void {
    this.sim.startOrResolve();
    this.sync();
  }

  private snap(): void {
    this.sim.triggerSnap();
    this.sync();
  }

  private gift(amount: number): void {
    if (this.sim.mode !== "running") this.sim.startRun();
    this.sim.triggerDemoGift(amount);
    this.sync();
  }

  private resolveNumber(index: number): void {
    if (this.sim.pauseMode === "levelup") this.sim.chooseLevel(index);
    else if (this.sim.pauseMode === "mutation") this.sim.chooseMutation(index);
    else if (this.sim.pauseMode === "pickup_compare") this.sim.resolvePickup(index === 0);
  }

  private updateBuild(): void {
    const job = (this.els.jobSelect?.value || this.sim.build.jobId) as JobId;
    const weapon = (this.els.weaponSelect?.value || this.sim.build.weaponId) as WeaponId;
    this.sim.setBuild(job, weapon);
    this.sync();
  }

  private populateBuildOptions(): void {
    const lists = getBuildLists();
    if (this.els.jobSelect) {
      this.els.jobSelect.innerHTML = lists.jobs.map((id) => `<option value="${id}">${lists.jobNames[id]}</option>`).join("");
      this.els.jobSelect.value = this.sim.build.jobId;
    }
    if (this.els.weaponSelect) {
      this.els.weaponSelect.innerHTML = lists.weapons.map((id) => `<option value="${id}">${lists.weaponNames[id]}</option>`).join("");
      this.els.weaponSelect.value = this.sim.build.weaponId;
    }
  }

  private renderChoices(): void {
    const cache = `${this.sim.pauseMode}:${this.sim.levelChoices.map((choice) => choice.id).join(",")}:${this.sim.mutationChoices.map((choice) => choice.id).join(",")}`;
    if (cache === this.choiceCache) {
      this.updateChoiceTimers();
      return;
    }
    this.choiceCache = cache;
    if (this.els.levelChoices) {
      this.els.levelChoices.innerHTML = this.sim.levelChoices
        .map(
          (choice, index) =>
            `<button class="choice-btn" type="button" data-choice="${index}"><strong>${index + 1}. ${choice.name}</strong><span>${choice.desc}</span></button>`
        )
        .join("");
      this.els.levelChoices.querySelectorAll<HTMLButtonElement>("[data-choice]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.sim.chooseLevel(Number(btn.dataset.choice || 0));
          this.sync();
        });
      });
    }
    if (this.els.mutationChoices) {
      this.els.mutationChoices.innerHTML = this.sim.mutationChoices
        .map(
          (choice, index) =>
            `<button class="choice-btn mutation" type="button" data-choice="${index}"><strong>${index + 1}. ${choice.name}</strong><span>${choice.desc}</span></button>`
        )
        .join("");
      this.els.mutationChoices.querySelectorAll<HTMLButtonElement>("[data-choice]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.sim.chooseMutation(Number(btn.dataset.choice || 0));
          this.sync();
        });
      });
    }
    this.updateChoiceTimers();
  }

  private updateChoiceTimers(): void {
    const autoTimer = Number((this.sim.levelChoices as unknown as { autoTimer?: number }).autoTimer ?? 0);
    setText(this.els.levelAutoTimer, autoTimer > 0 ? `${autoTimer.toFixed(1)}s` : "選択で再開");
  }

  private renderPickup(): void {
    const compare = this.sim.pickupCompare;
    if (!compare) return;
    const delta = Math.round((compare.item.power || 0) - compare.currentPower);
    const item = compare.item.item;
    const rarity = item ? RARITIES[item.rarity] : null;
    const currentAffixes = this.sim.equippedItem ? this.sim.equippedItem.affixes.map(formatAffix).join("\n") : "アフィックスなし";
    const dropAffixes = item ? item.affixes.map(formatAffix).join("\n") : "アフィックスなし";
    setText(this.els.pickupAutoTimer, compare.timer > 0 ? `${compare.timer.toFixed(1)}s` : "選択待ち");
    setText(this.els.pickupSlotLabel, "コア装備");
    setText(this.els.pickupCompareDelta, `Power差分: ${delta >= 0 ? "+" : ""}${delta}`);
    setText(this.els.pickupCurrentTitle, this.sim.equippedItem ? this.sim.equippedItem.name : "初期コア");
    setText(this.els.pickupCurrentStats, this.sim.equippedItem ? `Power ${this.sim.equippedItem.power}\n${currentAffixes}` : "Power 0\nアフィックスなし");
    setText(this.els.pickupDropTitle, item ? item.name : compare.item.name);
    setText(this.els.pickupDropStats, item ? `Power ${item.power}\nRarity ${rarity?.label || item.rarity}\n${dropAffixes}\n1:装備 / 2:破棄` : `Power ${compare.item.power}\n1:装備 / 2:破棄`);
    if (this.els.pickupDropTitle && rarity) this.els.pickupDropTitle.style.color = `#${rarity.color.toString(16).padStart(6, "0")}`;
    this.els.pickupCompareDelta?.classList.toggle("positive", delta >= 0);
    this.els.pickupCompareDelta?.classList.toggle("negative", delta < 0);
  }

  private renderGlossary(): void {
    if (!this.els.glossaryList) return;
    this.els.glossaryList.innerHTML = GLOSSARY_TERMS.map((term) => `<article><strong>${term.term}</strong><p>${term.desc}</p></article>`).join("");
  }

  private toggleStreamHook(): void {
    this.streamEnabled = !this.streamEnabled;
    if (this.streamEnabled && !this.streamPollTimer) {
      this.streamPollTimer = window.setInterval(() => {
        fetch("http://127.0.0.1:8091/events?max=12", { cache: "no-store" })
          .then((response) => (response.ok ? response.json() : null))
          .then((payload) => {
            const events = Array.isArray(payload?.events) ? payload.events : Array.isArray(payload) ? payload : [];
            for (const event of events) this.sim.injectTikfinityEvent(event);
            this.sync();
          })
          .catch(() => {
            setText(this.els.streamHookStatus, "接続待機");
          });
      }, 900);
    } else if (!this.streamEnabled && this.streamPollTimer) {
      window.clearInterval(this.streamPollTimer);
      this.streamPollTimer = 0;
    }
    this.sync();
  }

  private toggleFullscreen(): void {
    const frame = document.querySelector(".game-frame") as HTMLElement | null;
    if (!document.fullscreenElement) {
      frame?.requestFullscreen?.().catch(() => undefined);
    } else {
      document.exitFullscreen?.().catch(() => undefined);
    }
  }
}

function byId<T extends HTMLElement = HTMLElement>(id: string): El<T> {
  return document.getElementById(id) as El<T>;
}

function setText(el: El, value: string): void {
  if (el) el.textContent = value;
}

function toggleHidden(el: El, hidden: boolean): void {
  if (!el) return;
  el.classList.toggle("hidden", hidden);
  el.setAttribute("aria-hidden", hidden ? "true" : "false");
}

function setPressed(el: El<HTMLButtonElement>, pressed: boolean): void {
  el?.setAttribute("aria-pressed", pressed ? "true" : "false");
}

function setDisabled(el: El<HTMLButtonElement>, disabled: boolean, title = ""): void {
  if (!el) return;
  el.disabled = disabled;
  if (title) el.title = title;
  else el.removeAttribute("title");
}
