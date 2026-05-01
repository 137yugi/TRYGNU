import { equipmentAssetUrl } from "../content/assets";
import { GLOSSARY_TERMS } from "../content/glossary";
import { JOBS, type JobId } from "../content/jobs";
import { EQUIPMENT_SLOT_LABELS, RARITIES, formatAffix } from "../content/equipment";
import { WEAPONS, type WeaponId } from "../content/weapons";
import { AudioBus, type SfxId } from "../platform/audio";
import { getBuildLists, type GameSim } from "../sim/GameSim";
import { formatTime } from "../sim/math";
import {
  formatSeasonRange,
  buildSeasonReviewExport,
  getCurrentSeason,
  getFeedbackSummary,
  getLeaderboardEntries,
  getLeaderboardEntry,
  getLeaderboardRank,
  hasLeaderboardProfile,
  saveSeasonFeedback,
  updateLeaderboardEntryProfile,
  type LeaderboardEntry,
} from "../systems/season";

type El<T extends HTMLElement = HTMLElement> = T | null;

const STREAM_ROOM_KEY = "stream_raid_tiktok_room_v1";
const TERMINAL_CHANNEL_KEY = "stream_raid_terminal_channel_v1";
const TERMINAL_STORAGE_KEY = "stream_raid_terminal_event_v1";
const DEFAULT_TERMINAL_CHANNEL = "stream-raid-live-v1";

export class DomBridge {
  private readonly sim: GameSim;
  private readonly audio = new AudioBus();
  private readonly els = {
    hpChip: byId("hpChip"),
    levelChip: byId("levelChip"),
    timeChip: byId("timeChip"),
    threatChip: byId("threatChip"),
    objectiveChip: byId("objectiveChip"),
    bossChip: byId("bossChip"),
    startBtn: byId<HTMLButtonElement>("startBtn"),
    mobileStartBtn: byId<HTMLButtonElement>("mobileStartBtn"),
    menuFloatingBtn: byId<HTMLButtonElement>("menuFloatingBtn"),
    fullscreenBtn: byId<HTMLButtonElement>("fullscreenBtn"),
    mobileMenuBtn: byId<HTMLButtonElement>("mobileMenuBtn"),
    menuModal: byId("menuModal"),
    closeMenuBtn: byId<HTMLButtonElement>("closeMenuBtn"),
    menuStatus: byId("menuStatus"),
    charName: byId("charNameVal"),
    charSpec: byId("charSpecVal"),
    rollCharBtn: byId<HTMLButtonElement>("rollCharBtn"),
    jobSelect: byId<HTMLSelectElement>("jobSelect"),
    weaponSelect: byId<HTMLSelectElement>("weaponSelect"),
    audioBtn: byId<HTMLButtonElement>("audioBtn"),
    systemTextBtn: byId<HTMLButtonElement>("systemTextBtn"),
    systemFlashBtn: byId<HTMLButtonElement>("systemFlashBtn"),
    systemShakeBtn: byId<HTMLButtonElement>("systemShakeBtn"),
    gift100Btn: byId<HTMLButtonElement>("gift100Btn"),
    gift500Btn: byId<HTMLButtonElement>("gift500Btn"),
    gift1000Btn: byId<HTMLButtonElement>("gift1000Btn"),
    giftEventPanel: byId("giftEventPanel"),
    giftEventName: byId("giftEventName"),
    giftEventMeta: byId("giftEventMeta"),
    openTikTokSettingsBtn: byId<HTMLButtonElement>("openTikTokSettingsBtn"),
    streamHookBtn: byId<HTMLButtonElement>("streamHookBtn"),
    streamHookStatus: byId("streamHookStatus"),
    streamConfigPanel: byId("streamConfigPanel"),
    tiktokRoomInput: byId<HTMLInputElement>("tiktokRoomInput"),
    terminalChannelInput: byId<HTMLInputElement>("terminalChannelInput"),
    connectTikTokBtn: byId<HTMLButtonElement>("connectTikTokBtn"),
    saveTikTokSettingsBtn: byId<HTMLButtonElement>("saveTikTokSettingsBtn"),
    terminalTestEventBtn: byId<HTMLButtonElement>("terminalTestEventBtn"),
    agencySignupLink: byId<HTMLAnchorElement>("agencySignupLink"),
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
    pickupCurrentImage: byId<HTMLImageElement>("pickupCurrentImage"),
    pickupCurrentTitle: byId("pickupCurrentTitle"),
    pickupCurrentStats: byId("pickupCurrentStats"),
    pickupDropImage: byId<HTMLImageElement>("pickupDropImage"),
    pickupDropTitle: byId("pickupDropTitle"),
    pickupDropStats: byId("pickupDropStats"),
    pickupKeepBtn: byId<HTMLButtonElement>("pickupKeepBtn"),
    pickupDiscardBtn: byId<HTMLButtonElement>("pickupDiscardBtn"),
    glossaryModal: byId("glossaryModal"),
    glossaryList: byId("glossaryList"),
    openGlossaryBtn: byId<HTMLButtonElement>("openGlossaryBtn"),
    closeGlossaryBtn: byId<HTMLButtonElement>("closeGlossaryBtn"),
    seasonIdVal: byId("seasonIdVal"),
    seasonRangeVal: byId("seasonRangeVal"),
    seasonDaysVal: byId("seasonDaysVal"),
    seasonBestScoreVal: byId("seasonBestScoreVal"),
    seasonScoreCountVal: byId("seasonScoreCountVal"),
    seasonProfileCountVal: byId("seasonProfileCountVal"),
    leaderboardList: byId("leaderboardList"),
    feedbackSeasonVal: byId("feedbackSeasonVal"),
    feedbackText: byId<HTMLTextAreaElement>("feedbackText"),
    feedbackSaveBtn: byId<HTMLButtonElement>("feedbackSaveBtn"),
    seasonExportBtn: byId<HTMLButtonElement>("seasonExportBtn"),
    feedbackStatus: byId("feedbackStatus"),
    scoreProfileModal: byId("scoreProfileModal"),
    closeScoreProfileBtn: byId<HTMLButtonElement>("closeScoreProfileBtn"),
    scoreProfileSummary: byId("scoreProfileSummary"),
    scoreNameInput: byId<HTMLInputElement>("scoreNameInput"),
    scoreSnsInput: byId<HTMLInputElement>("scoreSnsInput"),
    scoreCommentInput: byId<HTMLInputElement>("scoreCommentInput"),
    saveScoreProfileBtn: byId<HTMLButtonElement>("saveScoreProfileBtn"),
    skipScoreProfileBtn: byId<HTMLButtonElement>("skipScoreProfileBtn"),
  };

  private streamEnabled = false;
  private streamRoom = "";
  private streamChannelName = DEFAULT_TERMINAL_CHANNEL;
  private streamChannel: BroadcastChannel | null = null;
  private streamReceived = 0;
  private streamApplied = 0;
  private streamStatus = "端末受信: OFF";
  private streamConfigOpen = false;
  private lastSeasonRenderAt = 0;
  private lastFeedbackRenderAt = 0;
  private choiceCache = "";
  private scoreProfileOpen = false;
  private promptedScoreEntryId = "";
  private scoreProfileLookupEntryId = "";
  private activeScoreEntryId = "";

  constructor(sim: GameSim) {
    this.sim = sim;
    this.populateBuildOptions();
    this.renderGlossary();
    this.loadStreamSettings();
    this.bindTerminalLiveInputs();
    this.bindEvents();
  }

  readonly handleTerminalMessage = (ev: MessageEvent): void => {
    if (ev.origin && ev.origin !== window.location.origin) return;
    if (!this.streamEnabled || !isTerminalLiveEnvelope(ev.data)) return;
    this.receiveTerminalLivePayload(ev.data, "postMessage");
  };

  readonly handleTerminalStorage = (ev: StorageEvent): void => {
    if (!this.streamEnabled || ev.key !== TERMINAL_STORAGE_KEY || !ev.newValue) return;
    try {
      this.receiveTerminalLivePayload(JSON.parse(ev.newValue), "storage");
    } catch {
      this.streamStatus = "端末受信: storage JSONエラー";
      this.sync();
    }
  };

  readonly handleTerminalCustomEvent = (ev: Event): void => {
    if (!this.streamEnabled) return;
    this.receiveTerminalLivePayload((ev as CustomEvent).detail, "customEvent");
  };

  destroy(): void {
    window.removeEventListener("message", this.handleTerminalMessage);
    window.removeEventListener("storage", this.handleTerminalStorage);
    window.removeEventListener("stream-raid-live-event", this.handleTerminalCustomEvent as EventListener);
    document.removeEventListener("stream-raid-live-event", this.handleTerminalCustomEvent as EventListener);
    this.streamChannel?.close();
    this.streamChannel = null;
  }

  sync(): void {
    const p = this.sim.player;
    const boss = this.sim.enemies.find((enemy) => enemy.boss);
    const menuOpen = this.sim.pauseMode === "menu";
    const glossaryOpen = this.sim.glossaryOpen;
    setText(this.els.hpChip, `HP ${Math.max(0, Math.round(p.hp))}/${Math.round(p.maxHp)}`);
    setText(this.els.levelChip, `LV ${p.level} XP ${Math.floor(p.xp)}/${Math.floor(p.nextXp)}`);
    setText(this.els.timeChip, `W${this.sim.wave} ${this.sim.waveKills}/${this.sim.waveTarget}`);
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
    setText(this.els.systemTextBtn, `詳細: ${this.sim.settings.debugHud ? "ON" : "OFF"}`);
    setText(this.els.systemFlashBtn, `フラッシュ: ${this.sim.settings.flashFx ? "ON" : "OFF"}`);
    setText(this.els.systemShakeBtn, `シェイク: ${this.sim.settings.shakeFx ? "ON" : "OFF"}`);
    setText(this.els.streamHookBtn, `ライブ連動: ${this.streamEnabled ? "ON" : "OFF"}`);
    setText(this.els.streamHookStatus, this.streamStatus);
    setText(this.els.startBtn, this.sim.mode === "running" ? "再開/選択" : this.sim.mode === "ended" ? "再挑戦" : "ラン開始");

    toggleHidden(this.els.menuModal, !menuOpen);
    toggleHidden(this.els.streamConfigPanel, !this.streamConfigOpen);
    toggleHidden(this.els.levelModal, this.sim.pauseMode !== "levelup");
    toggleHidden(this.els.mutationModal, this.sim.pauseMode !== "mutation");
    toggleHidden(this.els.pickupModal, this.sim.pauseMode !== "pickup_compare");
    if (menuOpen || this.scoreProfileOpen || this.sim.mode === "ended") {
      this.renderSeasonPanel();
      this.renderFeedbackPanel();
    }
    this.maybeOpenScoreProfile();
    toggleHidden(this.els.glossaryModal, !glossaryOpen);
    toggleHidden(this.els.scoreProfileModal, !this.scoreProfileOpen);
    document.body.classList.toggle("menu-open", menuOpen || glossaryOpen || this.scoreProfileOpen);
    document.body.classList.toggle("is-running", this.sim.mode === "running" && this.sim.pauseMode === null);
    document.body.classList.toggle("is-ended", this.sim.mode === "ended");
    document.body.classList.toggle("has-objective", Boolean(this.sim.objective));
    document.body.classList.toggle("has-boss", Boolean(boss));
    setPressed(this.els.menuFloatingBtn, menuOpen);
    setPressed(this.els.mobileMenuBtn, menuOpen);
    setPressed(this.els.openGlossaryBtn, glossaryOpen);
    setPressed(this.els.openTikTokSettingsBtn, this.streamConfigOpen);

    this.renderChoices();
    this.renderPickup();
  }

  handleKeyDown(ev: KeyboardEvent): void {
    if (ev.repeat) return;
    const key = ev.key.toLowerCase();
    if (key === "tab" && this.trapTabFocus(ev)) return;
    if (isFormTarget(ev.target)) {
      if (key === "escape") {
        ev.preventDefault();
        (ev.target as HTMLElement).blur();
      }
      return;
    }
    if (key === "arrowleft" || key === "a") this.sim.setKey("left", true);
    if (key === "arrowright" || key === "d") this.sim.setKey("right", true);
    if (key === "arrowup" || key === "w") this.sim.setKey("up", true);
    if (key === "arrowdown" || key === "s") this.sim.setKey("down", true);
    if (key === "enter") this.startOrResolve();
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
    this.els.fullscreenBtn?.addEventListener("click", () => this.toggleFullscreen());
    this.els.mobileMenuBtn?.addEventListener("click", () => {
      this.sim.toggleMenu();
      this.sync();
    });
    this.els.closeMenuBtn?.addEventListener("click", () => {
      this.closeMenu();
      this.sync();
    });
    this.els.rollCharBtn?.addEventListener("click", () => {
      this.sim.rollCharacter();
      this.sync();
    });
    this.els.jobSelect?.addEventListener("change", () => this.updateBuild());
    this.els.weaponSelect?.addEventListener("change", () => this.updateBuild());
    this.els.audioBtn?.addEventListener("click", () => {
      this.sim.toggleAudio();
      this.play("select");
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
    this.els.openTikTokSettingsBtn?.addEventListener("click", () => {
      this.streamConfigOpen = !this.streamConfigOpen;
      this.sync();
    });
    this.els.saveTikTokSettingsBtn?.addEventListener("click", () => {
      this.saveStreamSettings("設定を保存しました");
      this.sync();
    });
    this.els.connectTikTokBtn?.addEventListener("click", () => {
      this.startTerminalLiveInput(true);
      this.sync();
    });
    this.els.terminalTestEventBtn?.addEventListener("click", () => {
      this.startTerminalLiveInput(false);
      this.receiveTerminalLivePayload(
        {
          source: "stream-raid-terminal",
          channel: this.streamChannelName,
          event: {
            id: `terminal-test-${Date.now()}`,
            eventType: "gift",
            sender: this.streamRoom || "terminal_test",
            giftName: "Terminal Test",
            diamondCount: 15,
          },
        },
        "test"
      );
    });
    this.els.buyCreditBtn?.addEventListener("click", () => {
      this.sim.refillDemoEnergy();
      this.sync();
    });
    this.els.streamHookBtn?.addEventListener("click", () => this.toggleStreamHook());
    this.els.rerollSkillBtn?.addEventListener("click", () => {
      this.sim.rerollLevelChoices();
      this.play("select");
      this.sync();
    });
    this.els.pickupKeepBtn?.addEventListener("click", () => {
      this.sim.resolvePickup(true);
      this.play("pickup");
      this.sync();
    });
    this.els.pickupDiscardBtn?.addEventListener("click", () => {
      this.sim.resolvePickup(false);
      this.play("select");
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
    this.els.feedbackSaveBtn?.addEventListener("click", () => this.saveFeedback());
    this.els.seasonExportBtn?.addEventListener("click", () => {
      void this.copySeasonReviewExport();
    });
    this.els.saveScoreProfileBtn?.addEventListener("click", () => this.saveScoreProfile());
    this.els.skipScoreProfileBtn?.addEventListener("click", () => this.closeScoreProfile());
    this.els.closeScoreProfileBtn?.addEventListener("click", () => this.closeScoreProfile());
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
    this.els.scoreProfileModal?.addEventListener("pointerdown", (ev) => {
      if (ev.target === this.els.scoreProfileModal) this.closeScoreProfile();
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
    this.play("start");
    this.sync();
  }

  private gift(amount: number): void {
    if (this.sim.mode !== "running") this.sim.startRun();
    this.sim.triggerDemoGift(amount);
    this.play("gift");
    this.sync();
  }

  private resolveNumber(index: number): void {
    if (this.sim.pauseMode === "levelup") {
      this.sim.chooseLevel(index);
      this.play("select");
    } else if (this.sim.pauseMode === "mutation") {
      this.sim.chooseMutation(index);
      this.play("select");
    } else if (this.sim.pauseMode === "pickup_compare") {
      this.sim.resolvePickup(index === 0);
      this.play(index === 0 ? "pickup" : "select");
    }
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
          this.play("select");
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
          this.play("select");
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
    const currentRarity = compare.currentItem ? RARITIES[compare.currentItem.rarity] : null;
    const slotLabel = EQUIPMENT_SLOT_LABELS[compare.slot];
    const currentAffixes = compare.currentItem ? compare.currentItem.affixes.map(formatAffix).join("\n") : "アフィックスなし";
    const dropAffixes = item ? item.affixes.map(formatAffix).join("\n") : "アフィックスなし";
    setText(this.els.pickupAutoTimer, compare.timer > 0 ? `${compare.timer.toFixed(1)}s` : "選択待ち");
    setText(this.els.pickupSlotLabel, slotLabel);
    setText(this.els.pickupCompareDelta, `Power差分: ${delta >= 0 ? "+" : ""}${delta}`);
    setText(this.els.pickupCurrentTitle, compare.currentItem ? compare.currentItem.name : `初期${slotLabel}`);
    setText(this.els.pickupCurrentStats, compare.currentItem ? `Power ${compare.currentItem.power}\n${currentAffixes}` : "Power 0\nアフィックスなし");
    setText(this.els.pickupDropTitle, item ? item.name : compare.item.name);
    setText(this.els.pickupDropStats, item ? `${slotLabel}\nPower ${item.power}\nRarity ${rarity?.label || item.rarity}\n${dropAffixes}\n1:装備 / 2:破棄` : `Power ${compare.item.power}\n1:装備 / 2:破棄`);
    this.setPickupImage(this.els.pickupCurrentImage, compare.currentItem?.assetId, compare.slot, compare.currentItem?.name || `初期${slotLabel}`, currentRarity?.color || 0x65ff9a);
    this.setPickupImage(this.els.pickupDropImage, item?.assetId, item?.slot || compare.slot, item?.name || compare.item.name, rarity?.color || compare.item.color);
    if (this.els.pickupCurrentTitle) this.els.pickupCurrentTitle.style.color = currentRarity ? `#${currentRarity.color.toString(16).padStart(6, "0")}` : "";
    if (this.els.pickupDropTitle && rarity) this.els.pickupDropTitle.style.color = `#${rarity.color.toString(16).padStart(6, "0")}`;
    this.els.pickupCompareDelta?.classList.toggle("positive", delta >= 0);
    this.els.pickupCompareDelta?.classList.toggle("negative", delta < 0);
  }

  private setPickupImage(el: El<HTMLImageElement>, assetId: string | undefined, slot: "body" | "nunchaku", alt: string, color: number): void {
    if (!el) return;
    el.src = equipmentAssetUrl(assetId, slot);
    el.alt = alt;
    el.style.borderColor = `#${color.toString(16).padStart(6, "0")}`;
    el.style.boxShadow = `0 0 0 2px #05080b, 0 0 18px #${color.toString(16).padStart(6, "0")}55`;
  }

  private renderGlossary(): void {
    if (!this.els.glossaryList) return;
    this.els.glossaryList.innerHTML = GLOSSARY_TERMS.map((term) => `<article><strong>${term.term}</strong><p>${term.desc}</p></article>`).join("");
  }

  private renderSeasonPanel(force = false): void {
    const now = Date.now();
    if (!force && now - this.lastSeasonRenderAt < 1200) return;
    this.lastSeasonRenderAt = now;
    const season = getCurrentSeason();
    const feedback = getFeedbackSummary(season.id);
    setText(this.els.seasonIdVal, season.id);
    setText(this.els.seasonRangeVal, formatSeasonRange(season));
    setText(this.els.seasonDaysVal, `残り${season.daysLeft}日 / 意見${feedback.count || 0}件`);
    const entries = getLeaderboardEntries(season.id).slice(0, 6);
    setText(this.els.seasonBestScoreVal, String(Math.round(entries[0]?.score || 0)));
    setText(this.els.seasonScoreCountVal, String(entries.length));
    setText(this.els.seasonProfileCountVal, String(entries.filter((entry) => hasLeaderboardProfile(entry)).length));
    if (!this.els.leaderboardList) return;
    this.els.leaderboardList.innerHTML = entries.length
      ? entries.map((entry, index) => this.renderLeaderboardRow(entry, index + 1)).join("")
      : `<p class="empty-state">今シーズンの記録はまだありません。</p>`;
  }

  private renderLeaderboardRow(entry: LeaderboardEntry, rank: number): string {
    const profile = entry.profile || { name: entry.name || "", sns: entry.sns || "", comment: entry.comment || "" };
    const name = String(profile.name || "匿名ノード");
    const sns = String(profile.sns || "");
    const comment = String(profile.comment || "");
    return `<article class="leader-row">
      <strong>#${rank}</strong>
      <div><span>${escapeHtml(name)}</span>${sns ? `<em>${escapeHtml(sns)}</em>` : ""}${comment ? `<p>${escapeHtml(comment)}</p>` : ""}</div>
      <b>${Math.round(entry.score)}</b>
    </article>`;
  }

  private renderFeedbackPanel(force = false): void {
    const now = Date.now();
    if (!force && now - this.lastFeedbackRenderAt < 2400) return;
    this.lastFeedbackRenderAt = now;
    const season = getCurrentSeason();
    setText(this.els.feedbackSeasonVal, `保存先: ${season.id}`);
  }

  private saveFeedback(): void {
    const text = this.els.feedbackText?.value || "";
    if (!text.trim()) {
      setText(this.els.feedbackStatus, "入力が空です");
      return;
    }
    const entry = saveSeasonFeedback(text);
    if (!entry) {
      setText(this.els.feedbackStatus, "保存できません。運営用JSONで退避してください");
      return;
    }
    if (this.els.feedbackText) this.els.feedbackText.value = "";
    setText(this.els.feedbackStatus, "保存しました");
    this.renderSeasonPanel(true);
  }

  private async copySeasonReviewExport(): Promise<void> {
    const payload = JSON.stringify(buildSeasonReviewExport(), null, 2);
    try {
      await navigator.clipboard?.writeText(payload);
      setText(this.els.feedbackStatus, "運営用JSONをコピー");
    } catch {
      console.info("[season-review-export]", payload);
      setText(this.els.feedbackStatus, "JSONをconsole出力");
    }
  }

  private play(id: SfxId): void {
    this.audio.play(id, this.sim.settings.audio);
  }

  private trapTabFocus(ev: KeyboardEvent): boolean {
    const overlay = document.querySelector<HTMLElement>(".overlay:not(.hidden)");
    if (!overlay) return false;
    const focusables = Array.from(
      overlay.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
    ).filter((el) => el.offsetParent !== null);
    if (!focusables.length) return false;
    ev.preventDefault();
    const active = document.activeElement as HTMLElement | null;
    const current = active ? focusables.indexOf(active) : -1;
    const next = ev.shiftKey ? (current <= 0 ? focusables.length - 1 : current - 1) : current < 0 || current >= focusables.length - 1 ? 0 : current + 1;
    focusables[next]?.focus();
    return true;
  }

  private maybeOpenScoreProfile(): void {
    if (this.scoreProfileOpen || this.sim.mode !== "ended") return;
    const id = this.sim.lastScoreEntryId;
    if (!id || this.promptedScoreEntryId === id || this.scoreProfileLookupEntryId === id) return;
    this.scoreProfileLookupEntryId = id;
    const entry = getLeaderboardEntry(id);
    const rank = getLeaderboardRank(id);
    if (!entry || !rank || hasLeaderboardProfile(entry)) return;
    this.promptedScoreEntryId = id;
    this.activeScoreEntryId = id;
    this.scoreProfileOpen = true;
    setText(this.els.scoreProfileSummary, `#${rank} / SCORE ${Math.round(entry.score)} / ${formatTime(Number(entry.time || this.sim.time || 0))}`);
    if (this.els.scoreNameInput) this.els.scoreNameInput.value = String(entry.character || this.sim.build.characterName || "");
    if (this.els.scoreSnsInput) this.els.scoreSnsInput.value = "";
    if (this.els.scoreCommentInput) this.els.scoreCommentInput.value = "";
  }

  private saveScoreProfile(): void {
    if (!this.activeScoreEntryId) return;
    const saved = updateLeaderboardEntryProfile(this.activeScoreEntryId, {
      name: this.els.scoreNameInput?.value || "",
      sns: this.els.scoreSnsInput?.value || "",
      comment: this.els.scoreCommentInput?.value || "",
    });
    if (!saved) {
      setText(this.els.scoreProfileSummary, "プロフィールを保存できません。スクリーンショットか運営用JSONで退避してください");
      return;
    }
    this.closeScoreProfile();
    this.renderSeasonPanel(true);
  }

  private closeScoreProfile(): void {
    this.scoreProfileOpen = false;
    this.activeScoreEntryId = "";
    this.sync();
  }

  private loadStreamSettings(): void {
    this.streamRoom = cleanTikTokRoom(readStorage(STREAM_ROOM_KEY, ""));
    this.streamChannelName = cleanTerminalChannel(readStorage(TERMINAL_CHANNEL_KEY, DEFAULT_TERMINAL_CHANNEL));
    if (this.els.tiktokRoomInput) this.els.tiktokRoomInput.value = this.streamRoom;
    if (this.els.terminalChannelInput) this.els.terminalChannelInput.value = this.streamChannelName;
  }

  private saveStreamSettings(status = "設定を保存"): boolean {
    this.streamRoom = cleanTikTokRoom(this.els.tiktokRoomInput?.value || this.streamRoom);
    const nextChannel = cleanTerminalChannel(this.els.terminalChannelInput?.value || this.streamChannelName);
    const changed = nextChannel !== this.streamChannelName;
    this.streamChannelName = nextChannel;
    if (this.els.tiktokRoomInput) this.els.tiktokRoomInput.value = this.streamRoom;
    if (this.els.terminalChannelInput) this.els.terminalChannelInput.value = this.streamChannelName;
    const savedRoom = writeStorage(STREAM_ROOM_KEY, this.streamRoom);
    const savedChannel = writeStorage(TERMINAL_CHANNEL_KEY, this.streamChannelName);
    if (changed && this.streamEnabled) this.openTerminalChannel();
    const saved = savedRoom && savedChannel;
    this.streamStatus = saved ? status : "設定を保存できません。現在の画面では使えますが再読込で失われます";
    return saved;
  }

  private toggleStreamHook(): void {
    if (this.streamEnabled) this.stopTerminalLiveInput("端末受信: OFF");
    else this.startTerminalLiveInput(false);
    this.sync();
  }

  private bindTerminalLiveInputs(): void {
    window.addEventListener("message", this.handleTerminalMessage);
    window.addEventListener("storage", this.handleTerminalStorage);
    window.addEventListener("stream-raid-live-event", this.handleTerminalCustomEvent as EventListener);
    document.addEventListener("stream-raid-live-event", this.handleTerminalCustomEvent as EventListener);
  }

  private startTerminalLiveInput(resetCounters: boolean): void {
    const settingsSaved = this.saveStreamSettings();
    this.streamEnabled = true;
    if (resetCounters) {
      this.streamReceived = 0;
      this.streamApplied = 0;
    }
    this.openTerminalChannel();
    this.streamStatus = `端末受信ON ${settingsSaved ? "" : "設定保存不可 / "}${this.streamRoom ? `@${this.streamRoom}` : ""} / ${this.streamChannelName}`;
  }

  private stopTerminalLiveInput(status: string): void {
    this.streamEnabled = false;
    this.streamChannel?.close();
    this.streamChannel = null;
    this.streamStatus = status;
  }

  private openTerminalChannel(): void {
    this.streamChannel?.close();
    this.streamChannel = null;
    if (typeof BroadcastChannel === "undefined") {
      this.streamStatus = "端末受信ON / BroadcastChannelなし";
      return;
    }
    this.streamChannel = new BroadcastChannel(this.streamChannelName);
    this.streamChannel.onmessage = (ev) => {
      if (this.streamEnabled && isTerminalLiveEnvelope(ev.data)) this.receiveTerminalLivePayload(ev.data, "broadcast");
    };
  }

  receiveTerminalLivePayload(raw: unknown, source = "api"): number {
    if (!this.streamEnabled) {
      this.streamStatus = `端末受信: OFF (${source} 無視)`;
      this.sync();
      return 0;
    }
    if (!isTerminalLiveEnvelope(raw)) {
      this.streamStatus = `端末受信: ${source} envelope不一致`;
      this.sync();
      return 0;
    }
    if (!this.matchesTerminalChannel(raw)) {
      this.streamStatus = `端末受信: ${source} チャンネル不一致`;
      this.sync();
      return 0;
    }
    const events = extractTerminalLiveEvents(raw);
    if (!events.length) {
      this.streamStatus = `端末受信: ${source} イベントなし`;
      this.sync();
      return 0;
    }
    let applied = 0;
    for (const event of events) {
      if (this.sim.injectTikfinityEvent(event)) applied += 1;
    }
    this.streamReceived += events.length;
    this.streamApplied += applied;
    this.streamStatus = `端末受信 ${source} +${events.length} / 適用${this.streamApplied} / キュー${this.liveQueueCount()}`;
    this.play(events.length > 0 ? "gift" : "select");
    this.sync();
    return events.length;
  }

  private matchesTerminalChannel(raw: unknown): boolean {
    const channel = findTerminalChannel(raw);
    if (!channel) return false;
    return cleanTerminalChannel(channel) === this.streamChannelName;
  }

  private liveQueueCount(): number {
    try {
      const snapshot = JSON.parse(this.sim.renderGameToText()) as { run?: { live_queue?: number } };
      return Math.max(0, Math.round(Number(snapshot.run?.live_queue) || 0));
    } catch {
      return 0;
    }
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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char] || char));
}

function isFormTarget(target: EventTarget | null): boolean {
  const el = target instanceof HTMLElement ? target : null;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
}

function readStorage(key: string, fallback: string): string {
  try {
    return globalThis.localStorage?.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: string): boolean {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return false;
    storage.setItem(key, value);
    return storage.getItem(key) === value;
  } catch {
    // Storage may be blocked in private browsing.
    return false;
  }
}

function cleanTikTokRoom(value: string): string {
  return value.replace(/^@+/, "").replace(/[^\w.-]/g, "").slice(0, 40);
}

function cleanTerminalChannel(value: string): string {
  return (
    String(value || DEFAULT_TERMINAL_CHANNEL)
      .trim()
      .replace(/[^\w:.-]/g, "-")
      .slice(0, 64) || DEFAULT_TERMINAL_CHANNEL
  );
}

function isTerminalLiveEnvelope(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const source = String((value as Record<string, unknown>).source || "");
  return source === "stream-raid-terminal";
}

function extractTerminalLiveEvents(raw: unknown): unknown[] {
  const payload = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(payload.events)) return payload.events;
  if (Array.isArray(payload.liveEvents)) return payload.liveEvents;
  if (payload.event) return [payload.event];
  if (payload.payload) return extractTerminalLiveEvents(payload.payload);
  if (payload.type || payload.eventType || payload.giftName || payload.gift || payload.diamondCount || payload.diamonds) return [payload];
  return [];
}

function findTerminalChannel(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const payload = raw as Record<string, unknown>;
  const channel = payload.channel || payload.terminalChannel || payload.channelName;
  if (channel) return String(channel);
  if (payload.payload) return findTerminalChannel(payload.payload);
  return "";
}
