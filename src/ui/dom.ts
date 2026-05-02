import { equipmentAssetUrl, gameAssetUrl, JOB_ASSET, WEAPON_ASSET } from "../content/assets";
import { PLAYER_BALANCE } from "../content/balance";
import { GLOSSARY_TERMS } from "../content/glossary";
import { JOBS, type JobId } from "../content/jobs";
import { EQUIPMENT_SLOT_LABELS, RARITIES, formatAffix } from "../content/equipment";
import { WEAPONS, type WeaponId } from "../content/weapons";
import { AudioBus, type SfxId } from "../platform/audio";
import { getBuildLists, type GameSim } from "../sim/GameSim";
import { formatTime } from "../sim/math";
import {
  buildSeasonReviewCsv,
  formatSeasonRange,
  buildSeasonReviewExport,
  getCurrentSeason,
  getFeedbackSummary,
  getLeaderboardEntries,
  getLeaderboardEntry,
  getLeaderboardRank,
  getLeaderboardStats,
  getSeasonPersonalBest,
  hasLeaderboardProfile,
  LEADERBOARD_VISIBLE_ROWS,
  saveSeasonFeedback,
  updateLeaderboardEntryProfile,
  type LeaderboardEntry,
} from "../systems/season";
import { getRemoteLeaderboardSnapshot, refreshRemoteLeaderboard, submitRemoteLeaderboardEntry } from "../systems/remoteLeaderboard";

type El<T extends HTMLElement = HTMLElement> = T | null;

const STREAM_ROOM_KEY = "stream_raid_tiktok_room_v1";
const TERMINAL_CHANNEL_KEY = "stream_raid_terminal_channel_v1";
const TERMINAL_STORAGE_KEY = "stream_raid_terminal_event_v1";
const DEFAULT_TERMINAL_CHANNEL = "stream-raid-live-v1";
const LOCAL_TIKTOK_BRIDGE_URL = "http://127.0.0.1:8091";
const LOCAL_TIKTOK_POLL_MS = 1700;

interface LocalTikTokBridgeEvent {
  id?: number | string;
  type?: string;
  sender?: string;
  giftName?: string;
  diamonds?: number;
  receivedAt?: number;
}

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
    styleMeterPanel: byId("styleMeterPanel"),
    styleRank: byId("styleRankVal"),
    styleMultiplier: byId("styleMultiplierVal"),
    styleMeterFill: byId("styleMeterFill"),
    styleCombo: byId("styleComboVal"),
    styleBonus: byId("styleBonusVal"),
    runBuildPanel: byId("runBuildPanel"),
    runJobName: byId("runJobNameVal"),
    runHpDetail: byId("runHpDetailVal"),
    runSpeedDetail: byId("runSpeedDetailVal"),
    runPowerDetail: byId("runPowerDetailVal"),
    runJobRole: byId("runJobRoleVal"),
    runStatusLine: byId("runStatusLineVal"),
    liveEventOverlayStatus: byId("liveEventOverlayStatus"),
    liveEventList: byId("liveEventList"),
    startBtn: byId<HTMLButtonElement>("startBtn"),
    mobileStartBtn: byId<HTMLButtonElement>("mobileStartBtn"),
    openStartMenuBtn: byId<HTMLButtonElement>("openStartMenuBtn"),
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
    menuJobHp: byId("menuJobHpVal"),
    menuJobSpeed: byId("menuJobSpeedVal"),
    menuJobPower: byId("menuJobPowerVal"),
    menuJobRole: byId("menuJobRoleVal"),
    menuJobDifficulty: byId("menuJobDifficultyVal"),
    menuJobHpDetail: byId("menuJobHpDetailVal"),
    menuJobSpeedDetail: byId("menuJobSpeedDetailVal"),
    menuJobPowerDetail: byId("menuJobPowerDetailVal"),
    menuJobFeature: byId("menuJobFeatureVal"),
    menuJobTactics: byId("menuJobTacticsVal"),
    menuJobWeapon: byId("menuJobWeaponVal"),
    menuWeaponReach: byId("menuWeaponReachVal"),
    menuWeaponHead: byId("menuWeaponHeadVal"),
    menuWeaponPower: byId("menuWeaponPowerVal"),
    menuWeaponTrait: byId("menuWeaponTraitVal"),
    menuWeaponDesc: byId("menuWeaponDescVal"),
    menuWeaponTactics: byId("menuWeaponTacticsVal"),
    startSeasonVal: byId("startSeasonVal"),
    startSeasonRangeVal: byId("startSeasonRangeVal"),
    startBestScoreVal: byId("startBestScoreVal"),
    startRemoteStatus: byId("startRemoteStatusVal"),
    startSeasonMetaVal: byId("startSeasonMetaVal"),
    startCharName: byId("startCharNameVal"),
    startBuildSummary: byId("startBuildSummaryVal"),
    startRollCharBtn: byId<HTMLButtonElement>("startRollCharBtn"),
    startJobSelect: byId<HTMLSelectElement>("startJobSelect"),
    startWeaponSelect: byId<HTMLSelectElement>("startWeaponSelect"),
    startJobImage: byId<HTMLImageElement>("startJobImage"),
    startWeaponImage: byId<HTMLImageElement>("startWeaponImage"),
    startJobImageName: byId("startJobImageNameVal"),
    startWeaponImageName: byId("startWeaponImageNameVal"),
    startJobHp: byId("startJobHpVal"),
    startJobSpeed: byId("startJobSpeedVal"),
    startJobPower: byId("startJobPowerVal"),
    startJobRole: byId("startJobRoleVal"),
    startJobDifficulty: byId("startJobDifficultyVal"),
    startJobHpDetail: byId("startJobHpDetailVal"),
    startJobSpeedDetail: byId("startJobSpeedDetailVal"),
    startJobPowerDetail: byId("startJobPowerDetailVal"),
    startJobFeature: byId("startJobFeatureVal"),
    startJobTactics: byId("startJobTacticsVal"),
    startJobWeapon: byId("startJobWeaponVal"),
    startWeaponReach: byId("startWeaponReachVal"),
    startWeaponHead: byId("startWeaponHeadVal"),
    startWeaponPower: byId("startWeaponPowerVal"),
    startWeaponTrait: byId("startWeaponTraitVal"),
    startWeaponDesc: byId("startWeaponDescVal"),
    startWeaponTactics: byId("startWeaponTacticsVal"),
    menuJobImage: byId<HTMLImageElement>("menuJobImage"),
    menuWeaponImage: byId<HTMLImageElement>("menuWeaponImage"),
    menuJobImageName: byId("menuJobImageNameVal"),
    menuWeaponImageName: byId("menuWeaponImageNameVal"),
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
    streamGaugeStatus: byId("streamGaugeStatus"),
    streamConfigPanel: byId("streamConfigPanel"),
    tiktokRoomInput: byId<HTMLInputElement>("tiktokRoomInput"),
    terminalChannelInput: byId<HTMLInputElement>("terminalChannelInput"),
    connectTikTokBtn: byId<HTMLButtonElement>("connectTikTokBtn"),
    saveTikTokSettingsBtn: byId<HTMLButtonElement>("saveTikTokSettingsBtn"),
    terminalTestEventBtn: byId<HTMLButtonElement>("terminalTestEventBtn"),
    terminalHelperLink: byId<HTMLAnchorElement>("terminalHelperLink"),
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
    slotEffectStage: byId("slotEffectStage"),
    slotEffectTitle: byId("slotEffectTitle"),
    slotEffectReels: byId("slotEffectReels"),
    slotEffectResult: byId("slotEffectResult"),
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
    remoteLeaderboardStatus: byId("remoteLeaderboardStatusVal"),
    remoteLeaderboardList: byId("remoteLeaderboardList"),
    leaderboardList: byId("leaderboardList"),
    feedbackSeasonVal: byId("feedbackSeasonVal"),
    feedbackText: byId<HTMLTextAreaElement>("feedbackText"),
    feedbackSaveBtn: byId<HTMLButtonElement>("feedbackSaveBtn"),
    seasonExportBtn: byId<HTMLButtonElement>("seasonExportBtn"),
    seasonCsvExportBtn: byId<HTMLButtonElement>("seasonCsvExportBtn"),
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
  private streamStatus = "ライブ入力: OFF";
  private streamConfigOpen = false;
  private bridgeCursor = 0;
  private bridgePollTimer = 0;
  private bridgeSse: EventSource | null = null;
  private bridgeConnecting = false;
  private readonly adminMode = new URLSearchParams(window.location.search).has("admin");
  private lastSeasonRenderAt = 0;
  private lastFeedbackRenderAt = 0;
  private choiceCache = "";
  private scoreProfileOpen = false;
  private promptedScoreEntryId = "";
  private scoreProfileLookupEntryId = "";
  private activeScoreEntryId = "";
  private lastPickupEffectKey = "";
  private lastStyleRank = "D";
  private lastSlotEventId = 0;

  constructor(sim: GameSim) {
    this.sim = sim;
    this.populateBuildOptions();
    this.renderGlossary();
    this.loadStreamSettings();
    document.body.classList.toggle("admin-mode", this.adminMode);
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
      this.streamStatus = "ライブ入力: storage JSONエラー";
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
    this.stopLocalTikTokBridge();
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
    setText(this.els.startCharName, this.sim.build.characterName);
    setText(this.els.startBuildSummary, `${JOBS[this.sim.build.jobId].title} / ${WEAPONS[this.sim.build.weaponId].title}`);
    this.renderBuildDetails();
    this.renderRunStatusPanel();
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
    setText(this.els.streamGaugeStatus, this.liveStatusSummary());
    this.syncTerminalHelperLink();
    this.renderLiveEventOverlay();
    this.renderStyleMeter();
    this.renderSlotEffect();
    setText(this.els.startBtn, this.sim.mode === "running" ? "再開/選択" : this.sim.mode === "ended" ? "再挑戦" : "ラン開始");
    setText(this.els.mobileStartBtn, this.sim.mode === "running" ? "再開/選択" : this.sim.mode === "ended" ? "再挑戦" : "ラン開始");

    toggleHidden(this.els.menuModal, !menuOpen);
    toggleHidden(this.els.streamConfigPanel, !this.streamConfigOpen);
    toggleHidden(this.els.levelModal, this.sim.pauseMode !== "levelup");
    toggleHidden(this.els.mutationModal, this.sim.pauseMode !== "mutation");
    toggleHidden(this.els.pickupModal, this.sim.pauseMode !== "pickup_compare");
    if (menuOpen || this.scoreProfileOpen || this.sim.mode === "ended") {
      this.renderSeasonPanel();
      this.renderFeedbackPanel();
    }
    this.renderStartPanel();
    this.maybeOpenScoreProfile();
    toggleHidden(this.els.glossaryModal, !glossaryOpen);
    toggleHidden(this.els.scoreProfileModal, !this.scoreProfileOpen);
    document.body.classList.toggle("menu-open", menuOpen || glossaryOpen || this.scoreProfileOpen);
    document.body.classList.toggle("is-title", this.sim.mode === "title");
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
    const movementKey = key === "arrowleft" || key === "a" || key === "arrowright" || key === "d" || key === "arrowup" || key === "w" || key === "arrowdown" || key === "s";
    if (movementKey && this.sim.mode !== "running" && this.sim.pauseMode === null) this.startOrResolve();
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
    this.els.openStartMenuBtn?.addEventListener("click", () => {
      this.sim.toggleMenu(true);
      this.sync();
    });
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
    this.els.startRollCharBtn?.addEventListener("click", () => {
      this.sim.rollCharacter();
      this.sync();
    });
    this.els.jobSelect?.addEventListener("change", () => this.updateBuild("menu"));
    this.els.weaponSelect?.addEventListener("change", () => this.updateBuild("menu"));
    this.els.startJobSelect?.addEventListener("change", () => this.updateBuild("start"));
    this.els.startWeaponSelect?.addEventListener("change", () => this.updateBuild("start"));
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
      const stamp = Date.now();
      const sender = this.streamRoom || "yrachac";
      this.receiveTerminalLivePayload(
        {
          source: "stream-raid-terminal",
          channel: this.streamChannelName,
          nonce: `terminal-test-${stamp}`,
          liveEvents: [
            ...Array.from({ length: 8 }, (_, index) => ({
              id: `terminal-test-like-${stamp}-${index}`,
              eventType: "like",
              sender,
              label: "like burst",
              diamondCount: 25,
            })),
            {
              id: `terminal-test-comment-${stamp}`,
              eventType: "comment",
              sender,
              label: "コメント襲来テスト",
              diamondCount: 8,
            },
            {
              id: `terminal-test-follow-${stamp}`,
              eventType: "follow",
              sender,
              label: "follow boss test",
              diamondCount: 1,
            },
          ],
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
    this.els.seasonCsvExportBtn?.addEventListener("click", () => {
      void this.copySeasonReviewCsv();
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

  private updateBuild(source: "menu" | "start"): void {
    const jobSource = source === "start" ? this.els.startJobSelect : this.els.jobSelect;
    const weaponSource = source === "start" ? this.els.startWeaponSelect : this.els.weaponSelect;
    const job = (jobSource?.value || this.sim.build.jobId) as JobId;
    const weapon = (weaponSource?.value || this.sim.build.weaponId) as WeaponId;
    this.sim.setBuild(job, weapon);
    this.sync();
  }

  private populateBuildOptions(): void {
    const lists = getBuildLists();
    for (const select of [this.els.jobSelect, this.els.startJobSelect]) {
      if (!select) continue;
      select.innerHTML = lists.jobs.map((id) => `<option value="${id}">${lists.jobNames[id]}</option>`).join("");
    }
    for (const select of [this.els.weaponSelect, this.els.startWeaponSelect]) {
      if (!select) continue;
      select.innerHTML = lists.weapons.map((id) => `<option value="${id}">${lists.weaponNames[id]}</option>`).join("");
    }
    this.syncBuildSelects();
  }

  private syncBuildSelects(): void {
    for (const select of [this.els.jobSelect, this.els.startJobSelect]) {
      if (select && select.value !== this.sim.build.jobId) select.value = this.sim.build.jobId;
    }
    for (const select of [this.els.weaponSelect, this.els.startWeaponSelect]) {
      if (select && select.value !== this.sim.build.weaponId) select.value = this.sim.build.weaponId;
    }
  }

  private renderBuildDetails(): void {
    const job = JOBS[this.sim.build.jobId];
    const weapon = WEAPONS[this.sim.build.weaponId];
    const recommended = job.recommendedWeapons.map((id) => WEAPONS[id].title).join(" / ");
    const selectedRecommended = job.recommendedWeapons.includes(this.sim.build.weaponId);
    const weaponText = `おすすめ武器: ${recommended}${selectedRecommended ? " (選択中)" : ""}`;
    const hp = formatBuildMultiplier(job.hpMul);
    const speed = formatBuildMultiplier(job.speedMul);
    const power = formatBuildMultiplier(job.damageMul);
    const baseHp = Math.round(PLAYER_BALANCE.baseHp * job.hpMul);
    const baseSpeed = Math.round(PLAYER_BALANCE.baseSpeed * job.speedMul);
    const weaponPower = formatBuildMultiplier(job.damageMul * weapon.damageMul);
    const weaponReach = String(Math.round(weapon.reach + (weapon.meleeArcRadius || 0) * 0.35));
    const weaponHead = weapon.headCount && weapon.headCount > 1 ? `${weapon.headRadius} x${weapon.headCount}` : String(weapon.headRadius);
    const weaponOnlyPower = formatBuildMultiplier(weapon.damageMul);
    const meleeLine = weapon.meleeArcRadius ? ` / 近接半円 ${Math.round(weapon.meleeArcRadius)}px` : "";
    this.renderBuildVisuals(job.title, weapon.title);
    for (const target of [
      {
        hp: this.els.startJobHp,
        speed: this.els.startJobSpeed,
        power: this.els.startJobPower,
        role: this.els.startJobRole,
        difficulty: this.els.startJobDifficulty,
        hpDetail: this.els.startJobHpDetail,
        speedDetail: this.els.startJobSpeedDetail,
        powerDetail: this.els.startJobPowerDetail,
        feature: this.els.startJobFeature,
        tactics: this.els.startJobTactics,
        weapon: this.els.startJobWeapon,
        weaponReach: this.els.startWeaponReach,
        weaponHead: this.els.startWeaponHead,
        weaponPower: this.els.startWeaponPower,
        weaponTrait: this.els.startWeaponTrait,
        weaponDesc: this.els.startWeaponDesc,
        weaponTactics: this.els.startWeaponTactics,
      },
      {
        hp: this.els.menuJobHp,
        speed: this.els.menuJobSpeed,
        power: this.els.menuJobPower,
        role: this.els.menuJobRole,
        difficulty: this.els.menuJobDifficulty,
        hpDetail: this.els.menuJobHpDetail,
        speedDetail: this.els.menuJobSpeedDetail,
        powerDetail: this.els.menuJobPowerDetail,
        feature: this.els.menuJobFeature,
        tactics: this.els.menuJobTactics,
        weapon: this.els.menuJobWeapon,
        weaponReach: this.els.menuWeaponReach,
        weaponHead: this.els.menuWeaponHead,
        weaponPower: this.els.menuWeaponPower,
        weaponTrait: this.els.menuWeaponTrait,
        weaponDesc: this.els.menuWeaponDesc,
        weaponTactics: this.els.menuWeaponTactics,
      },
    ]) {
      setText(target.hp, hp);
      setText(target.speed, speed);
      setText(target.power, power);
      setText(target.role, job.role);
      setText(target.difficulty, job.difficulty);
      setText(target.hpDetail, String(baseHp));
      setText(target.speedDetail, String(baseSpeed));
      setText(target.powerDetail, weaponPower);
      setText(target.feature, `${job.description} ${job.statLine}`);
      setText(target.tactics, `立ち回り: ${job.tactics} / 詳細: HP ${job.statNotes.hp} 速度 ${job.statNotes.speed} 火力 ${job.statNotes.damage}`);
      setText(target.weapon, weaponText);
      setText(target.weaponReach, weaponReach);
      setText(target.weaponHead, weaponHead);
      setText(target.weaponPower, weaponOnlyPower);
      setText(target.weaponTrait, `武器特性: ${weapon.trait}${meleeLine}`);
      setText(target.weaponDesc, `${weapon.title}: ${weapon.description}`);
      setText(target.weaponTactics, `武器運用: ${weapon.tactics}`);
    }
  }

  private renderBuildVisuals(jobTitle: string, weaponTitle: string): void {
    const jobUrl = gameAssetUrl(JOB_ASSET[this.sim.build.jobId]);
    const weaponUrl = gameAssetUrl(WEAPON_ASSET[this.sim.build.weaponId]);
    for (const target of [
      { image: this.els.startJobImage, label: this.els.startJobImageName },
      { image: this.els.menuJobImage, label: this.els.menuJobImageName },
    ]) {
      setImage(target.image, jobUrl, `${jobTitle}の画像`);
      setText(target.label, jobTitle);
    }
    for (const target of [
      { image: this.els.startWeaponImage, label: this.els.startWeaponImageName },
      { image: this.els.menuWeaponImage, label: this.els.menuWeaponImageName },
    ]) {
      setImage(target.image, weaponUrl, `${weaponTitle}の画像`);
      setText(target.label, weaponTitle);
    }
  }

  private renderRunStatusPanel(): void {
    const job = JOBS[this.sim.build.jobId];
    const p = this.sim.player;
    setText(this.els.runJobName, `${job.title} / ${WEAPONS[this.sim.build.weaponId].title}`);
    setText(this.els.runHpDetail, `${Math.max(0, Math.round(p.hp))}/${Math.round(p.maxHp)}`);
    setText(this.els.runSpeedDetail, String(Math.round(p.speed)));
    setText(this.els.runPowerDetail, formatBuildMultiplier(p.damageMul));
    setText(this.els.runJobRole, `${job.role} / 難度 ${job.difficulty}`);
    setText(this.els.runStatusLine, this.sim.mode === "running" ? `W${this.sim.wave} LV${p.level} ${this.sim.build.characterName}` : this.sim.mode === "ended" ? `終了 SCORE ${this.sim.getScorePreview()}` : "ラン準備");
  }

  private renderLiveEventOverlay(): void {
    const events = this.readLiveRecentEvents();
    const summary = this.streamEnabled ? this.liveStatusSummary() : "反応待ち";
    setText(this.els.liveEventOverlayStatus, events.length ? `${events.length}件 / ${summary}` : summary);
    if (!this.els.liveEventList) return;
    this.els.liveEventList.innerHTML = events.length
      ? events
          .map((event) => {
            const kind = escapeHtml(liveKindLabel(event.kind));
            const sender = escapeHtml(event.sender || "viewer");
            const label = escapeHtml(event.label || event.type || "");
            const status = escapeHtml(liveStatusLabel(event.status));
            return `<article class="live-event-item ${escapeHtml(event.kind)}"><span>${kind}</span><strong>${sender}</strong><em>${label}${status ? ` / ${status}` : ""}</em></article>`;
          })
          .join("")
      : `<p>ギフト、いいね、シェア、コメント、フォローを待っています。</p>`;
  }

  private renderStyleMeter(): void {
    const style = this.readStyleState();
    setText(this.els.styleRank, style.rank);
    setText(this.els.styleMultiplier, `x${style.multiplier.toFixed(1)}`);
    setText(this.els.styleCombo, `CHAIN ${style.kill_chain}`);
    setText(this.els.styleBonus, `BONUS ${Math.round(style.bonus_score)}`);
    if (this.els.styleMeterFill) this.els.styleMeterFill.style.width = `${Math.round(clamp01(style.progress) * 100)}%`;
    this.els.styleMeterPanel?.classList.toggle("style-hot", style.rank === "S" || style.rank === "SS" || style.rank === "SSS");
    if (this.lastStyleRank !== style.rank && styleRankOrder(style.rank) > styleRankOrder(this.lastStyleRank)) {
      this.play(styleRankOrder(style.rank) >= 4 ? "slotWin" : "select");
    }
    this.lastStyleRank = style.rank;
  }

  private renderSlotEffect(): void {
    const event = this.readSlotEvent();
    const stage = this.els.slotEffectStage;
    if (!stage) return;
    if (!event) {
      stage.classList.add("hidden");
      stage.classList.remove("settled", "jackpot", "bonus", "miss");
      this.lastSlotEventId = 0;
      return;
    }
    stage.classList.remove("hidden", "jackpot", "bonus", "miss");
    stage.classList.add(event.outcome);
    stage.classList.toggle("settled", event.settled);
    setText(this.els.slotEffectTitle, event.item_name);
    setText(this.els.slotEffectResult, event.settled ? event.label : "リール回転中...");
    if (this.els.slotEffectReels) {
      this.els.slotEffectReels.innerHTML = event.symbols
        .slice(0, 3)
        .map((symbol) => `<span class="slot-effect-reel">${escapeHtml(symbol)}</span>`)
        .join("");
    }
    if (this.lastSlotEventId !== event.id) {
      this.play("slotSpin");
      this.lastSlotEventId = event.id;
      this.lastPickupEffectKey = "";
    } else if (event.settled && (event.outcome === "bonus" || event.outcome === "jackpot")) {
      const key = `${event.id}:${event.outcome}`;
      if (this.lastPickupEffectKey !== key) {
        this.play("slotWin");
        this.lastPickupEffectKey = key;
      }
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
    if (!compare) {
      this.renderSlotEffect();
      return;
    }
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
    this.renderSlotEffect();
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
    const leaderboardStats = getLeaderboardStats(season.id);
    setText(this.els.seasonIdVal, season.id);
    setText(this.els.seasonRangeVal, formatSeasonRange(season));
    setText(this.els.seasonDaysVal, `残り${season.daysLeft}日 / 意見${feedback.count || 0}件`);
    const allEntries = getLeaderboardEntries(season.id);
    const entries = allEntries.slice(0, LEADERBOARD_VISIBLE_ROWS);
    const personalBest = getSeasonPersonalBest(season.id);
    setText(this.els.seasonBestScoreVal, String(Math.round(personalBest.score)));
    setText(this.els.seasonScoreCountVal, String(leaderboardStats.saved_count));
    setText(this.els.seasonProfileCountVal, String(leaderboardStats.profile_count));
    this.renderRemoteLeaderboardPanel(season.id);
    if (!this.els.leaderboardList) return;
    this.els.leaderboardList.innerHTML = entries.length
      ? entries.map((entry, index) => this.renderLeaderboardRow(entry, index + 1)).join("")
      : `<p class="empty-state">今シーズンの記録はまだありません。</p>`;
  }

  private renderStartPanel(): void {
    this.syncBuildSelects();
    const season = getCurrentSeason();
    const feedback = getFeedbackSummary(season.id);
    const entries = getLeaderboardEntries(season.id);
    const personalBest = getSeasonPersonalBest(season.id);
    setText(this.els.startSeasonVal, season.id);
    setText(this.els.startSeasonRangeVal, formatSeasonRange(season));
    setText(this.els.startBestScoreVal, String(Math.round(personalBest.score)));
    const remote = getRemoteLeaderboardSnapshot();
    setText(this.els.startRemoteStatus, remote.enabled ? remote.status.replace(/^グローバル\s*/, "") : "OFF");
    setText(this.els.startSeasonMetaVal, `残り${season.daysLeft}日 / 記録${entries.length}件 / 意見${feedback.count || 0}件`);
  }

  private renderRemoteLeaderboardPanel(seasonId: string): void {
    const remote = getRemoteLeaderboardSnapshot();
    const status = remote.enabled ? remote.status : "未設定";
    setText(this.els.remoteLeaderboardStatus, status);
    if (this.els.remoteLeaderboardList) {
      const rows = remote.season_id === seasonId ? remote.rows.slice(0, LEADERBOARD_VISIBLE_ROWS) : [];
      this.els.remoteLeaderboardList.innerHTML = rows.length
        ? rows.map((entry, index) => this.renderRemoteLeaderboardRow(entry, entry.rank || index + 1)).join("")
        : `<p class="empty-state">${remote.enabled ? "オンラインランキングを取得中です。" : "オンラインランキングは未接続です。"}</p>`;
    }
    void refreshRemoteLeaderboard(seasonId).then(() => {
      const latest = getRemoteLeaderboardSnapshot();
      setText(this.els.remoteLeaderboardStatus, latest.enabled ? latest.status : "未設定");
      setText(this.els.startRemoteStatus, latest.enabled ? latest.status.replace(/^グローバル\s*/, "") : "OFF");
      if (!this.els.remoteLeaderboardList) return;
      const rows = latest.season_id === seasonId ? latest.rows.slice(0, LEADERBOARD_VISIBLE_ROWS) : [];
      this.els.remoteLeaderboardList.innerHTML = rows.length
        ? rows.map((entry, index) => this.renderRemoteLeaderboardRow(entry, entry.rank || index + 1)).join("")
        : `<p class="empty-state">${latest.enabled ? "オンラインランキングを取得中です。" : "オンラインランキングは未接続です。"}</p>`;
    });
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

  private renderRemoteLeaderboardRow(entry: { score: number; profile?: { name?: string; sns?: string; comment?: string }; name?: string; sns?: string; comment?: string }, rank: number): string {
    const profile = entry.profile || { name: entry.name || "", sns: entry.sns || "", comment: entry.comment || "" };
    const name = String(profile.name || "匿名闘士");
    const sns = String(profile.sns || "");
    const comment = String(profile.comment || "");
    return `<article class="leader-row remote-row">
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
    const review = buildSeasonReviewExport();
    const payload = `${JSON.stringify(review, null, 2)}\n\n/* CSV: leaderboard */\n${buildSeasonReviewCsv(review.target_season_id)}`;
    try {
      await navigator.clipboard?.writeText(payload);
      setText(this.els.feedbackStatus, "運営用JSON/CSVをコピー");
    } catch {
      console.info("[season-review-export]", payload);
      setText(this.els.feedbackStatus, "JSON/CSVをconsole出力");
    }
  }

  private async copySeasonReviewCsv(): Promise<void> {
    const payload = buildSeasonReviewCsv();
    try {
      await navigator.clipboard?.writeText(payload);
      setText(this.els.feedbackStatus, "CSVをコピー");
    } catch {
      console.info("[season-review-csv]", payload);
      setText(this.els.feedbackStatus, "CSVをconsole出力");
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
    void submitRemoteLeaderboardEntry(saved).then(() => this.renderSeasonPanel(true));
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
    this.syncTerminalHelperLink();
  }

  private saveStreamSettings(status = "設定を保存"): boolean {
    this.streamRoom = cleanTikTokRoom(this.els.tiktokRoomInput?.value || this.streamRoom);
    const nextChannel = cleanTerminalChannel(this.els.terminalChannelInput?.value || this.streamChannelName);
    const changed = nextChannel !== this.streamChannelName;
    this.streamChannelName = nextChannel;
    if (this.els.tiktokRoomInput) this.els.tiktokRoomInput.value = this.streamRoom;
    if (this.els.terminalChannelInput) this.els.terminalChannelInput.value = this.streamChannelName;
    this.syncTerminalHelperLink();
    const savedRoom = writeStorage(STREAM_ROOM_KEY, this.streamRoom);
    const savedChannel = writeStorage(TERMINAL_CHANNEL_KEY, this.streamChannelName);
    if (changed && this.streamEnabled) this.openTerminalChannel();
    const saved = savedRoom && savedChannel;
    this.streamStatus = saved ? status : "設定を保存できません。現在の画面では使えますが再読込で失われます";
    return saved;
  }

  private toggleStreamHook(): void {
    if (this.streamEnabled) this.stopTerminalLiveInput("ライブ入力: OFF");
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
      this.bridgeCursor = 0;
    }
    this.openTerminalChannel();
    const adminChannel = this.adminMode ? ` / 合言葉 ${this.streamChannelName}` : "";
    this.streamStatus = `ライブ入力ON ${settingsSaved ? "" : "設定保存不可 / "}${this.streamRoom ? `@${this.streamRoom}` : "TikTok ID未設定"}${adminChannel} / 端末接続待機`;
    if (this.shouldUseLocalTikTokBridge()) void this.connectLocalTikTokBridge();
  }

  private stopTerminalLiveInput(status: string): void {
    this.streamEnabled = false;
    this.streamChannel?.close();
    this.streamChannel = null;
    this.stopLocalTikTokBridge();
    this.streamStatus = status;
  }

  private openTerminalChannel(): void {
    this.streamChannel?.close();
    this.streamChannel = null;
    if (typeof BroadcastChannel === "undefined") {
      this.streamStatus = "ライブ入力ON / 一部連携不可";
      return;
    }
    this.streamChannel = new BroadcastChannel(this.streamChannelName);
    this.streamChannel.onmessage = (ev) => {
      if (this.streamEnabled && isTerminalLiveEnvelope(ev.data)) this.receiveTerminalLivePayload(ev.data, "broadcast");
    };
  }

  private async connectLocalTikTokBridge(): Promise<void> {
    if (!this.streamEnabled || this.bridgeConnecting) return;
    if (!this.streamRoom) return;
    if (!this.shouldUseLocalTikTokBridge()) return;
    this.bridgeConnecting = true;
    try {
      const response = await fetch(`${LOCAL_TIKTOK_BRIDGE_URL}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: this.streamRoom }),
      });
      const payload = await safeJson(response);
      this.bridgeCursor = Math.max(this.bridgeCursor, Math.floor(Number(payload.cursor) || 0));
      this.streamStatus = this.formatLiveInputStatus(response.ok ? "TikTok接続中" : "接続待機");
      this.startLocalTikTokSse();
      this.startLocalTikTokPolling();
    } catch {
      this.streamStatus = this.formatLiveInputStatus("ローカル受信待機");
      this.startLocalTikTokPolling();
    } finally {
      this.bridgeConnecting = false;
      this.sync();
    }
  }

  private startLocalTikTokSse(): void {
    this.bridgeSse?.close();
    this.bridgeSse = null;
    if (typeof EventSource === "undefined" || !this.streamEnabled) return;
    try {
      const source = new EventSource(`${LOCAL_TIKTOK_BRIDGE_URL}/stream?since=${this.bridgeCursor}`);
      this.bridgeSse = source;
      source.addEventListener("liveEvent", (ev) => {
        const event = parseLocalTikTokEvent((ev as MessageEvent).data);
        if (!event) return;
        this.ingestLocalTikTokEvents([event], "tiktok-sse");
      });
      source.addEventListener("status", (ev) => {
        const payload = parseLocalTikTokStatus((ev as MessageEvent).data);
        if (payload?.cursor) this.bridgeCursor = Math.max(this.bridgeCursor, Math.floor(Number(payload.cursor) || 0));
      });
      source.onerror = () => {
        if (this.bridgeSse === source) this.bridgeSse = null;
        source.close();
        this.startLocalTikTokPolling();
      };
    } catch {
      this.startLocalTikTokPolling();
    }
  }

  private startLocalTikTokPolling(): void {
    if (this.bridgePollTimer || !this.streamEnabled) return;
    this.bridgePollTimer = window.setTimeout(() => {
      this.bridgePollTimer = 0;
      void this.pollLocalTikTokBridge();
    }, this.bridgeSse ? LOCAL_TIKTOK_POLL_MS * 4 : 250);
  }

  private async pollLocalTikTokBridge(): Promise<void> {
    if (!this.streamEnabled) return;
    try {
      const response = await fetch(`${LOCAL_TIKTOK_BRIDGE_URL}/events?since=${this.bridgeCursor}&max=32`, { cache: "no-store" });
      const payload = await safeJson(response);
      if (!response.ok) throw new Error("bridge not ready");
      this.bridgeCursor = Math.max(this.bridgeCursor, Math.floor(Number(payload.cursor) || 0));
      const events = Array.isArray(payload.events) ? (payload.events as LocalTikTokBridgeEvent[]) : [];
      if (events.length) {
        this.ingestLocalTikTokEvents(events, "tiktok-poll");
      } else if (payload.connector?.connected) {
        this.streamStatus = this.formatLiveInputStatus("待受中");
        this.sync();
      }
    } catch {
      if (this.streamEnabled) {
        this.streamStatus = this.formatLiveInputStatus("ローカル受信待機");
        this.sync();
      }
    } finally {
      if (this.streamEnabled) this.startLocalTikTokPolling();
    }
  }

  private ingestLocalTikTokEvents(events: LocalTikTokBridgeEvent[], source: string): void {
    if (!events.length) return;
    const envelope = {
      source: "stream-raid-terminal",
      channel: this.streamChannelName,
      nonce: `local-tiktok:${this.bridgeCursor}:${events.length}:${Date.now()}`,
      liveEvents: events.map((event, index) => ({
        id: `local-tiktok:${event.id ?? `${this.bridgeCursor}:${index}`}`,
        eventType: event.type || "gift",
        sender: event.sender || this.streamRoom || "viewer",
        giftName: event.giftName || event.type || "live",
        diamondCount: event.diamonds || 1,
        receivedAt: event.receivedAt || Date.now(),
      })),
    };
    this.receiveTerminalLivePayload(envelope, source);
  }

  private stopLocalTikTokBridge(): void {
    if (this.bridgePollTimer) window.clearTimeout(this.bridgePollTimer);
    this.bridgePollTimer = 0;
    this.bridgeSse?.close();
    this.bridgeSse = null;
    this.bridgeConnecting = false;
  }

  private formatLiveInputStatus(status: string): string {
    const adminChannel = this.adminMode ? ` / 合言葉 ${this.streamChannelName}` : "";
    const room = this.streamRoom ? `@${this.streamRoom}` : "TikTok ID未設定";
    return `ライブ入力ON ${room}${adminChannel} / ${status}`;
  }

  private shouldUseLocalTikTokBridge(): boolean {
    const params = new URLSearchParams(window.location.search);
    if (!this.adminMode) return false;
    if (params.get("local_bridge") === "1") return true;
    if (params.get("local_bridge") === "0") return false;
    return false;
  }

  private syncTerminalHelperLink(): void {
    if (!this.els.terminalHelperLink) return;
    const params = new URLSearchParams();
    if (this.streamRoom) params.set("room", this.streamRoom);
    if (this.streamChannelName) params.set("channel", this.streamChannelName);
    if (this.adminMode) params.set("admin", "1");
    this.els.terminalHelperLink.href = `./terminal-live.html${params.toString() ? `?${params.toString()}` : ""}`;
  }

  receiveTerminalLivePayload(raw: unknown, source = "api"): number {
    if (!this.streamEnabled) {
      this.streamStatus = `ライブ入力: OFF (${source} 無視)`;
      this.sync();
      return 0;
    }
    if (!isTerminalLiveEnvelope(raw)) {
      this.streamStatus = `ライブ入力: ${source} 形式不一致`;
      this.sync();
      return 0;
    }
    if (!this.matchesTerminalChannel(raw)) {
      this.streamStatus = `ライブ入力: ${source} 合言葉不一致`;
      this.sync();
      return 0;
    }
    const events = extractTerminalLiveEvents(raw);
    if (!events.length) {
      this.streamStatus = `ライブ入力: ${source} イベントなし`;
      this.sync();
      return 0;
    }
    let applied = 0;
    for (let index = 0; index < events.length; index += 1) {
      const event = withTerminalEnvelopeId(events[index], raw, index);
      if (this.sim.injectTikfinityEvent(event)) applied += 1;
    }
    this.streamReceived += events.length;
    this.streamApplied += applied;
    this.streamStatus = `ライブ入力 ${source} +${events.length} / 反映${this.streamApplied} / 待機${this.liveQueueCount()}`;
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

  private liveStatusSummary(): string {
    try {
      const snapshot = JSON.parse(this.sim.renderGameToText()) as {
        run?: {
          live_applause_gauge?: number;
          live_applause_gauge_max?: number;
          live_applause_wave_gain?: number;
          live_applause_last_wave_gain?: number;
          live_applause_fever_ready?: boolean;
          live_applause_fever_active?: boolean;
          live_crowd_gauge?: number;
          live_crowd_gauge_max?: number;
          live_pending_surges?: number;
          live_pending_bosses?: number;
          live_wave_surges?: number;
          live_wave_score_bonus?: number;
          live_wave_drop_bonus?: number;
        };
      };
      const run = snapshot.run || {};
      const max = Math.max(1, Number(run.live_applause_gauge_max ?? run.live_crowd_gauge_max) || 100);
      const current = Number(run.live_applause_gauge ?? run.live_crowd_gauge) || 0;
      const gauge = Math.max(0, Math.min(999, Math.round((current / max) * 100)));
      const waveGain = Math.max(0, Math.round(Number(run.live_applause_wave_gain) || 0));
      const lastGain = Math.max(0, Math.round(Number(run.live_applause_last_wave_gain) || 0));
      const feverReady = Boolean(run.live_applause_fever_ready);
      const feverActive = Boolean(run.live_applause_fever_active);
      const surges = Math.max(0, Math.round(Number(run.live_pending_surges) || 0));
      const bosses = Math.max(0, Math.round(Number(run.live_pending_bosses) || 0));
      const active = Math.max(0, Math.round(Number(run.live_wave_surges) || 0));
      const score = Math.round((Number(run.live_wave_score_bonus) || 0) * 100);
      const drop = Math.round((Number(run.live_wave_drop_bonus) || 0) * 100);
      const pending = surges || bosses ? `予約 フィーバー${surges} / ボス${bosses}` : "予約なし";
      const fever = feverActive || active ? ` / 発動中 +${score}%/+${drop}%` : feverReady ? " / 次wave発動" : "";
      return `喝采 ${gauge}% (${waveGain}/${Math.round(max)}) / 前wave${lastGain} / ${pending}${fever}`;
    } catch {
      return "観客ゲージ -- / 予約確認不可";
    }
  }

  private readStyleState(): {
    rank: string;
    progress: number;
    multiplier: number;
    kill_chain: number;
    bonus_score: number;
  } {
    try {
      const snapshot = JSON.parse(this.sim.renderGameToText()) as {
        combat?: {
          style?: {
            rank?: string;
            progress?: number;
            multiplier?: number;
            kill_chain?: number;
            bonus_score?: number;
          };
        };
      };
      const style = snapshot.combat?.style || {};
      return {
        rank: String(style.rank || "D"),
        progress: clamp01(Number(style.progress) || 0),
        multiplier: Math.max(1, Number(style.multiplier) || 1),
        kill_chain: Math.max(0, Math.round(Number(style.kill_chain) || 0)),
        bonus_score: Math.max(0, Number(style.bonus_score) || 0),
      };
    } catch {
      return { rank: "D", progress: 0, multiplier: 1, kill_chain: 0, bonus_score: 0 };
    }
  }

  private readSlotEvent(): null | {
    id: number;
    item_name: string;
    symbols: string[];
    outcome: "miss" | "bonus" | "jackpot";
    label: string;
    settled: boolean;
  } {
    try {
      const snapshot = JSON.parse(this.sim.renderGameToText()) as {
        inventory?: {
          slot_event?: {
            id?: number;
            item_name?: string;
            symbols?: unknown[];
            outcome?: string;
            label?: string;
            settled?: boolean;
          } | null;
        };
      };
      const event = snapshot.inventory?.slot_event;
      if (!event || !event.id) return null;
      const outcome = event.outcome === "jackpot" || event.outcome === "bonus" ? event.outcome : "miss";
      return {
        id: Math.round(Number(event.id) || 0),
        item_name: String(event.item_name || "装備チャンス"),
        symbols: Array.isArray(event.symbols) ? event.symbols.map((symbol) => String(symbol)).slice(0, 3) : ["7", "BAR", "金"],
        outcome,
        label: String(event.label || "ゲーム内演出のみ"),
        settled: Boolean(event.settled),
      };
    } catch {
      return null;
    }
  }

  private readLiveRecentEvents(): Array<{ kind: string; type: string; sender: string; label: string; status: string }> {
    try {
      const snapshot = JSON.parse(this.sim.renderGameToText()) as {
        run?: {
          live_recent_events?: Array<{ kind?: string; type?: string; sender?: string; label?: string; status?: string }>;
        };
      };
      return Array.isArray(snapshot.run?.live_recent_events)
        ? snapshot.run.live_recent_events.slice(0, 5).map((event) => ({
            kind: String(event.kind || "gift"),
            type: String(event.type || ""),
            sender: String(event.sender || "viewer"),
            label: String(event.label || ""),
            status: String(event.status || ""),
          }))
        : [];
    } catch {
      return [];
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

async function safeJson(response: Response): Promise<Record<string, any>> {
  try {
    return (await response.json()) as Record<string, any>;
  } catch {
    return {};
  }
}

function parseLocalTikTokEvent(raw: unknown): LocalTikTokBridgeEvent | null {
  try {
    const event = typeof raw === "string" ? JSON.parse(raw) : raw;
    return event && typeof event === "object" ? (event as LocalTikTokBridgeEvent) : null;
  } catch {
    return null;
  }
}

function parseLocalTikTokStatus(raw: unknown): { cursor?: number } | null {
  try {
    const status = typeof raw === "string" ? JSON.parse(raw) : raw;
    return status && typeof status === "object" ? (status as { cursor?: number }) : null;
  } catch {
    return null;
  }
}

function setText(el: El, value: string): void {
  if (el) el.textContent = value;
}

function setImage(el: El<HTMLImageElement>, src: string, alt: string): void {
  if (!el) return;
  if (src && el.getAttribute("src") !== src) el.src = src;
  el.alt = alt;
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

function formatBuildMultiplier(value: number): string {
  return `${Math.round(value * 100)}%`;
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

function withTerminalEnvelopeId(event: unknown, envelope: unknown, index: number): unknown {
  if (!event || typeof event !== "object" || hasLiveEventId(event)) return event;
  const nonce = findTerminalNonce(envelope);
  if (!nonce) return event;
  return {
    ...(event as Record<string, unknown>),
    id: `terminal:${cleanIdPart(findTerminalChannel(envelope))}:${cleanIdPart(nonce)}:${index}`,
  };
}

function hasLiveEventId(event: unknown): boolean {
  if (!event || typeof event !== "object") return false;
  const payload = event as Record<string, unknown>;
  for (const key of ["id", "eventId", "messageId", "msgId", "event_id", "externalId"]) {
    if (String(payload[key] ?? "").trim()) return true;
  }
  return false;
}

function findTerminalNonce(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const payload = raw as Record<string, unknown>;
  const nonce = payload.nonce || payload.envelopeId || payload.envelope_id || payload.transportId || payload.transport_id;
  if (nonce) return String(nonce).slice(0, 96);
  if (payload.payload) return findTerminalNonce(payload.payload);
  return "";
}

function cleanIdPart(value: string): string {
  return String(value || "none")
    .trim()
    .replace(/[^\w:.-]/g, "-")
    .slice(0, 96) || "none";
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function styleRankOrder(rank: string): number {
  if (rank === "SSS") return 6;
  if (rank === "SS") return 5;
  if (rank === "S") return 4;
  if (rank === "A") return 3;
  if (rank === "B") return 2;
  if (rank === "C") return 1;
  return 0;
}

function liveKindLabel(kind: string): string {
  if (kind === "like") return "いいね";
  if (kind === "chat") return "コメント";
  if (kind === "share") return "シェア";
  if (kind === "follow") return "フォロー";
  if (kind === "ad_obstacle") return "広告";
  return "ギフト";
}

function liveStatusLabel(status: string): string {
  if (status === "queued") return "待機";
  if (status === "applied") return "反映";
  return "";
}
