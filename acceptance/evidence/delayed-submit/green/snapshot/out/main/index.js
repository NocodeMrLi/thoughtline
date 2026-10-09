"use strict";
const electron = require("electron");
const node_path = require("node:path");
const node_crypto = require("node:crypto");
const node_os = require("node:os");
const promises = require("node:fs/promises");
function createShelf(preload) {
  const w = new electron.BrowserWindow({ title: "Thoughtline Shelf", frame: false, transparent: true, show: false, hasShadow: false, alwaysOnTop: true, skipTaskbar: true, focusable: false, resizable: false, backgroundColor: "#00000000", width: 1200, height: 340, webPreferences: { preload, contextIsolation: true, nodeIntegration: false, sandbox: true } });
  w.setIgnoreMouseEvents(true, { forward: true });
  if (process.platform === "darwin") w.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  return w;
}
function composerMaterial(platform, release, reduceTransparency, highContrast, forcedColors, focused = true) {
  if (reduceTransparency || highContrast || forcedColors) return "opaque";
  if (platform === "darwin") return "vibrancy";
  if (platform === "win32" && Number(release.split(".")[2]) >= 22621 && focused) return "acrylic";
  return "opaque";
}
const COMPOSER_SIZE = { width: 480, height: 260 };
const currentComposerMaterial = (focused = true) => composerMaterial(process.platform, node_os.release(), electron.nativeTheme.prefersReducedTransparency, electron.nativeTheme.shouldUseHighContrastColors, electron.nativeTheme.inForcedColorsMode, focused);
function createComposer(preload) {
  const material = currentComposerMaterial();
  const window = new electron.BrowserWindow({ title: "Thoughtline Composer", frame: false, show: false, resizable: false, skipTaskbar: true, alwaysOnTop: true, width: COMPOSER_SIZE.width, height: COMPOSER_SIZE.height, transparent: process.platform === "darwin", roundedCorners: true, vibrancy: material === "vibrancy" ? "popover" : void 0, visualEffectState: "followWindow", backgroundMaterial: material === "acrylic" ? "acrylic" : "none", backgroundColor: material === "opaque" ? electron.nativeTheme.shouldUseDarkColors ? "#202226" : "#F5F5F7" : "#00000000", webPreferences: { preload, contextIsolation: true, nodeIntegration: false, sandbox: true } });
  const theme = () => {
    const material2 = currentComposerMaterial(window.isFocused());
    if (process.platform === "darwin") window.setVibrancy(material2 === "vibrancy" ? "popover" : null);
    if (process.platform === "win32") window.setBackgroundMaterial(material2 === "acrylic" ? "acrylic" : "none");
    window.setBackgroundColor(material2 === "opaque" ? electron.nativeTheme.shouldUseDarkColors ? "#202226" : "#F5F5F7" : "#00000000");
  };
  electron.nativeTheme.on("updated", theme);
  window.on("focus", theme);
  window.on("blur", theme);
  window.once("closed", () => electron.nativeTheme.removeListener("updated", theme));
  return window;
}
function createManage(preload) {
  return new electron.BrowserWindow({ title: "Thoughtline Manage", frame: false, show: false, resizable: false, skipTaskbar: true, alwaysOnTop: true, width: 740, height: 540, webPreferences: { preload, contextIsolation: true, nodeIntegration: false, sandbox: true } });
}
function createHost(shelf2, composer2) {
  if (!["darwin", "win32"].includes(process.platform)) throw Error("Thoughtline目标平台为macOS和Windows。");
  let interactive = false;
  const setInteractive = (value) => {
    if (interactive === value) return;
    shelf2.setIgnoreMouseEvents(!value, { forward: true });
    interactive = value;
  };
  return {
    platform: process.platform === "darwin" ? "mac" : "windows",
    cursor: () => electron.screen.getCursorScreenPoint(),
    displays: () => electron.screen.getAllDisplays().map((d) => ({ id: String(d.id), bounds: d.bounds, workArea: d.workArea, scaleFactor: d.scaleFactor })),
    showShelf: (bounds) => {
      shelf2.setBounds(bounds);
      shelf2.showInactive();
    },
    hideShelf: () => {
      setInteractive(false);
      shelf2.hide();
    },
    setShelfInteractive: setInteractive,
    showComposer: (bounds) => {
      const w = composer2();
      if (w) {
        w.setBounds(bounds);
        w.show();
        w.focus();
      }
    },
    closeComposer: () => composer2()?.hide()
  };
}
const FAST_POLL_PROXIMITY_PX = 450;
function probeStickEdge(input) {
  const { cursor, workArea, stickPosition, hotZoneWidth } = input;
  const clientX = cursor.x - workArea.x;
  const clientY = cursor.y - workArea.y;
  const garbage = clientX < -5e3 || clientX > 15e3 || clientY < -5e3 || clientY > 15e3;
  let distFromEdge;
  switch (stickPosition) {
    case "right":
      distFromEdge = workArea.width - clientX;
      break;
    case "left":
      distFromEdge = clientX;
      break;
    case "top":
      distFromEdge = clientY;
      break;
  }
  const inEdge = !garbage && distFromEdge >= -30 && distFromEdge <= hotZoneWidth;
  return { clientX, clientY, distFromEdge, inEdge, garbage };
}
function isNearProximity(distFromEdge) {
  return distFromEdge <= FAST_POLL_PROXIMITY_PX;
}
const REST_FRAMES_REQUIRED = 3;
const MAX_INTENT_SPEED_PX_PER_MS = 1.5;
function probeSeamAware(input, state) {
  const probe = probeStickEdge({
    cursor: input.cursor,
    workArea: input.workArea,
    stickPosition: input.stickPosition,
    hotZoneWidth: input.hotZoneWidth
  });
  if (probe.garbage) {
    return {
      probe,
      crossedNow: false,
      speedPxPerMs: null,
      slowEnough: false,
      lockedOut: false,
      armedInEdge: false,
      nextState: state
    };
  }
  let speedPxPerMs = null;
  if (state.lastPoint && state.lastTime !== void 0) {
    const dt = Math.min(250, Math.max(1, input.now - state.lastTime));
    const dx = input.cursor.x - state.lastPoint.x;
    const dy = input.cursor.y - state.lastPoint.y;
    speedPxPerMs = Math.sqrt(dx * dx + dy * dy) / dt;
  }
  const slowEnough = speedPxPerMs === null || speedPxPerMs <= MAX_INTENT_SPEED_PX_PER_MS;
  const crossedNow = state.lastDist !== void 0 && (state.lastDist < 0 && probe.distFromEdge >= 0 || state.lastDist >= 0 && probe.distFromEdge < 0);
  let crossPending = state.crossPending ?? false;
  let restStreak = state.restStreak ?? 0;
  if (crossedNow) {
    crossPending = true;
    restStreak = 0;
  } else if (crossPending) {
    const inOwnBand = probe.distFromEdge >= 0 && probe.distFromEdge <= input.hotZoneWidth;
    if (inOwnBand && slowEnough) restStreak++;
    else restStreak = 0;
    if (restStreak >= REST_FRAMES_REQUIRED) crossPending = false;
  }
  const lockedOut = crossPending;
  const armedInEdge = !lockedOut && probe.distFromEdge >= 0 && probe.distFromEdge <= input.hotZoneWidth && slowEnough;
  return {
    probe,
    crossedNow,
    speedPxPerMs,
    slowEnough,
    lockedOut,
    armedInEdge,
    nextState: {
      lastPoint: { x: input.cursor.x, y: input.cursor.y },
      lastDist: probe.distFromEdge,
      lastTime: input.now,
      crossPending,
      restStreak
    }
  };
}
const motion = { hide: 160 };
const toLocal = (p, o) => ({ x: p.x - o.x, y: p.y - o.y });
const contains = (r, p) => r.width > 0 && r.height > 0 && p.x >= r.x && p.y >= r.y && p.x < r.x + r.width && p.y < r.y + r.height;
function fixedRope(width) {
  const screenWidth = Math.max(0, Number.isFinite(width) ? width : 0);
  const length = screenWidth * 0.7;
  return { left: (screenWidth - length) / 2, length, top: 32, sag: Math.min(30, Math.max(18, length * 0.026)) };
}
function ropeClipBounds(width, edgeInset) {
  const rope = fixedRope(width), screenWidth = Math.max(0, Number.isFinite(width) ? width : 0);
  return { min: Math.max(edgeInset, rope.left + rope.length / 6), max: Math.min(screenWidth - edgeInset, rope.left + rope.length * 5 / 6) };
}
const initialShelf = () => ({ phase: "hidden", zone: "outside", locks: [], dwellAt: null, leaveAt: null, corridorUntil: null, peekUntil: null, suspended: false });
function shelfTransition(previous, event) {
  const s = { ...previous, locks: [...previous.locks] };
  if (event.type === "suspend") return { ...initialShelf(), locks: s.locks, suspended: true };
  if (event.type === "resume") return { ...initialShelf(), locks: s.locks };
  if (event.type === "lock") {
    s.locks = event.active ? [.../* @__PURE__ */ new Set([...s.locks, event.name])] : s.locks.filter((x) => x !== event.name);
    if (!s.suspended && !s.locks.length) {
      s.leaveAt = s.zone === "card" || s.zone === "edge" ? null : event.now;
      if (s.peekUntil !== null) s.peekUntil = Math.max(s.peekUntil, event.now + 500);
    }
    return s;
  }
  if (s.suspended) return s;
  if (event.type === "peek") return { ...s, phase: "peek", peekUntil: event.now + 2300, leaveAt: null };
  if (event.type === "pointer" && event.zone !== s.zone) {
    const oldZone = s.zone;
    s.zone = event.zone;
    s.dwellAt = event.zone === "edge" ? event.now : null;
    if (event.zone === "card") {
      if (s.phase !== "hidden") s.phase = "revealed";
      s.leaveAt = null;
      s.peekUntil = null;
      s.corridorUntil = null;
    } else if (event.zone === "edge") {
      s.leaveAt = null;
      s.corridorUntil = null;
    } else {
      s.leaveAt = event.now;
      s.corridorUntil = event.zone === "corridor" && oldZone === "edge" && s.phase !== "hidden" ? event.now + 600 : null;
    }
  }
  if (s.locks.length) return s;
  if (s.phase === "hidden" && s.dwellAt !== null && event.now - s.dwellAt >= 250) {
    s.phase = "revealed";
    s.leaveAt = null;
  }
  if (s.phase !== "hidden" && s.zone !== "card" && s.zone !== "edge") {
    const expiry = s.phase === "peek" ? s.peekUntil : s.leaveAt === null ? null : Math.max(s.leaveAt + 500, s.corridorUntil ?? 0);
    if (expiry !== null && event.now >= expiry) return { ...s, phase: "hidden", leaveAt: null, corridorUntil: null, peekUntil: null };
  }
  return s;
}
function pauseTransition(state, reason, active) {
  const next = { ...state, [reason]: active };
  return { ...next, paused: next.manual || next.sleep || next.lock };
}
class EdgeController {
  constructor(host, onDisplay, onStateChange = () => {
  }) {
    this.host = host;
    this.onDisplay = onDisplay;
    this.onStateChange = onStateChange;
  }
  host;
  onDisplay;
  onStateChange;
  state = initialShelf();
  timer = null;
  rects = [];
  layoutRevision = -1;
  displayId = "";
  paused = false;
  pauses = { manual: false, sleep: false, lock: false, paused: false };
  nativeVisible = false;
  hideTimer = null;
  presentationSession = 0;
  seam = {};
  proximityDelay = 400;
  bounds = { x: 0, y: 0, width: 1200, height: 340 };
  presentation() {
    return { shelfVisible: this.state.phase !== "hidden", interactionLocked: this.state.locks.length > 0, presentationSession: this.presentationSession };
  }
  start() {
    this.poll();
  }
  stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.forceHide();
  }
  cancelHide() {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = null;
  }
  forceHide() {
    this.cancelHide();
    this.presentationSession++;
    this.host.setShelfInteractive(false);
    this.host.hideShelf();
    this.nativeVisible = false;
  }
  presentationFinished(session) {
    if (session !== this.presentationSession || this.state.phase !== "hidden" || !this.hideTimer) return;
    this.cancelHide();
    this.host.hideShelf();
    this.nativeVisible = false;
  }
  layout(payload) {
    if (payload.displayId !== this.displayId || payload.layoutRevision <= this.layoutRevision) return;
    this.layoutRevision = payload.layoutRevision;
    this.rects = payload.rects;
  }
  event(event) {
    const before = this.state.phase;
    const locked = this.state.locks.length > 0;
    this.state = shelfTransition(this.state, event);
    const session = this.presentationSession;
    this.render(before, event.type === "suspend");
    if (session !== this.presentationSession || before !== this.state.phase || locked !== this.state.locks.length > 0) this.onStateChange();
  }
  isManuallyPaused() {
    return this.pauses.manual;
  }
  pause(value, reason = "manual") {
    this.pauses = pauseTransition(this.pauses, reason, value);
    if (this.paused === this.pauses.paused) return;
    this.paused = this.pauses.paused;
    this.event({ type: this.paused ? "suspend" : "resume", now: Date.now() });
  }
  render(before, immediate) {
    if (immediate) {
      this.forceHide();
      return;
    }
    if (this.state.phase === "hidden") {
      this.host.setShelfInteractive(false);
      if (this.nativeVisible && before !== "hidden") {
        this.cancelHide();
        const session = ++this.presentationSession;
        this.hideTimer = setTimeout(() => this.presentationFinished(session), motion.hide + 120);
      }
      return;
    }
    if (before === "hidden") {
      this.cancelHide();
      this.presentationSession++;
      this.host.showShelf(this.bounds);
      this.nativeVisible = true;
    }
  }
  poll = () => {
    if (!this.paused) {
      const point = this.host.cursor();
      const d = electron.screen.getDisplayNearestPoint(point);
      const nextBounds = { x: d.bounds.x, y: Math.max(d.bounds.y, d.workArea.y), width: d.bounds.width, height: 340 };
      if (String(d.id) !== this.displayId || nextBounds.x !== this.bounds.x || nextBounds.y !== this.bounds.y || nextBounds.width !== this.bounds.width) {
        this.event({ type: "suspend", now: Date.now() });
        this.event({ type: "resume", now: Date.now() });
        this.seam = this.displayId && String(d.id) !== this.displayId ? { crossPending: true, restStreak: 0 } : {};
        this.displayId = String(d.id);
        this.bounds = nextBounds;
        this.rects = [];
        this.layoutRevision = -1;
        this.onDisplay(this.displayId, this.bounds.width);
      }
      const local = toLocal(point, this.bounds);
      const hit = this.rects.some((r) => contains(r, local));
      const probe = probeSeamAware({ cursor: point, workArea: d.bounds, stickPosition: "top", hotZoneWidth: 3, now: Date.now() }, this.seam);
      this.seam = probe.nextState;
      const edge2 = probe.armedInEdge;
      this.proximityDelay = probe.probe.distFromEdge >= 0 && probe.probe.distFromEdge <= 3 ? 16 : isNearProximity(probe.probe.distFromEdge) ? 100 : 400;
      const corridor = local.y >= 0 && local.y < Math.min(300, this.bounds.height) && local.x >= 0 && local.x < this.bounds.width;
      this.event({ type: "pointer", zone: edge2 ? "edge" : hit ? "card" : corridor ? "corridor" : "outside", now: Date.now() });
      this.event({ type: "tick", now: Date.now() });
      this.host.setShelfInteractive(this.state.phase !== "hidden" && (hit || this.state.locks.includes("drag") || this.state.locks.includes("text-drag")));
    }
    const delay = this.paused ? 1e3 : this.state.phase !== "hidden" ? 16 : this.proximityDelay;
    this.timer = setTimeout(this.poll, delay);
  };
}
function independentClip(s, ideaId, agentId) {
  let id = "clip:" + ideaId;
  let index = 1;
  while (s.clips.some((c) => c.id === id)) id = "clip:" + ideaId + ":" + index++;
  return { id, agentId, ideaIds: [ideaId], currentId: ideaId, position: null };
}
function pruneClips(clips, ideas) {
  const byId = new Map(ideas.map((i) => [i.id, i]));
  return clips.flatMap((c) => {
    const ideaIds = c.ideaIds.filter((id) => {
      const i = byId.get(id);
      return i?.status === "hanging" && i.agentId === c.agentId;
    });
    if (!ideaIds.length) return [];
    const oldIndex = c.ideaIds.indexOf(c.currentId);
    const currentId = ideaIds.includes(c.currentId) ? c.currentId : ideaIds[Math.min(Math.max(0, oldIndex), ideaIds.length - 1)];
    return [{ ...c, ideaIds, currentId }];
  });
}
const invalid$2 = (message) => ({ ok: false, code: "INVALID", message });
const plain = (x) => !!x && typeof x === "object" && !Array.isArray(x);
const textOK = (s, max) => typeof s === "string" && Array.from(s).length <= max;
const bodyOK = (s, empty = false) => typeof s === "string" && (empty || !!s.trim()) && new TextEncoder().encode(s).length <= 1048576;
function initialSnapshot() {
  return { schemaVersion: 2, revision: 0, clips: [], ideas: [], agents: [{ id: "codex", name: "Codex", color: "#4C90D9" }, { id: "claude", name: "Claude", color: "#D79551" }, { id: "cursor", name: "Cursor", color: "#9574CE" }, { id: "general", name: "通用", color: "#A0A3AA" }], draft: null, settings: { writeHotkey: "Control+Alt+N", reducedMotion: false } };
}
function validateSnapshot(input) {
  if (!plain(input) || ![1, 2].includes(Number(input.schemaVersion))) return invalid$2("无法读取这个数据版本，原文件已保留。");
  if (!Number.isSafeInteger(input.revision) || Number(input.revision) < 0 || !Array.isArray(input.agents) || !Array.isArray(input.ideas) || !plain(input.settings)) return invalid$2("数据结构不完整。");
  const agents = /* @__PURE__ */ new Set();
  for (const a of input.agents) {
    if (!plain(a) || typeof a.id !== "string" || !a.id || agents.has(a.id) || !textOK(a.name, 40) || !a.name.trim() || typeof a.color !== "string" || !/^#[0-9a-f]{6}$/i.test(a.color)) return invalid$2("Agent标签无效。");
    agents.add(a.id);
  }
  if (!agents.size || !agents.has("general")) return invalid$2("缺少通用标签。");
  const draftOK = (d) => bodyOK(d.text, true) && textOK(d.title, 50) && textOK(d.project, 40) && typeof d.agentId === "string" && agents.has(d.agentId);
  const ids = /* @__PURE__ */ new Set();
  for (const idea of input.ideas) {
    if (!plain(idea) || typeof idea.id !== "string" || !idea.id || ids.has(idea.id) || !draftOK(idea) || !bodyOK(idea.text) || !["hanging", "archived"].includes(String(idea.status)) || typeof idea.createdAt !== "string" || !Number.isFinite(Date.parse(idea.createdAt)) || typeof idea.updatedAt !== "string" || !Number.isFinite(Date.parse(idea.updatedAt))) return invalid$2("念头正文或归属无效。");
    ids.add(idea.id);
  }
  if (input.draft !== null && (!plain(input.draft) || !draftOK(input.draft))) return invalid$2("草稿无效。");
  if (!textOK(input.settings.writeHotkey, 100) || !input.settings.writeHotkey.trim() || typeof input.settings.reducedMotion !== "boolean") return invalid$2("设置无效。");
  const ideas = input.ideas;
  const normalized = { ...input, schemaVersion: 2, clips: input.schemaVersion === 1 ? ideas.filter((i) => i.status === "hanging").sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id)).map((i) => ({ id: "clip:" + i.id, agentId: i.agentId, ideaIds: [i.id], currentId: i.id, position: null })) : input.clips };
  if (!Array.isArray(normalized.clips)) return invalid$2("夹子数据缺失。");
  const clipIds = /* @__PURE__ */ new Set(), members = /* @__PURE__ */ new Set();
  const byId = new Map(ideas.map((i) => [i.id, i]));
  for (const c of normalized.clips) {
    if (!plain(c) || typeof c.id !== "string" || !c.id || clipIds.has(c.id) || typeof c.agentId !== "string" || !agents.has(c.agentId) || !Array.isArray(c.ideaIds) || !c.ideaIds.length || typeof c.currentId !== "string" || !c.ideaIds.includes(c.currentId) || !(c.position === null || typeof c.position === "number" && Number.isFinite(c.position) && c.position >= 0 && c.position <= 1)) return invalid$2("夹子结构或位置无效。");
    clipIds.add(c.id);
    for (const id of c.ideaIds) {
      const i = byId.get(id);
      if (typeof id !== "string" || members.has(id) || !i || i.status !== "hanging" || i.agentId !== c.agentId) return invalid$2("夹子成员重复、缺失或Agent不一致。");
      members.add(id);
    }
  }
  if (ideas.some((i) => i.status === "hanging" && !members.has(i.id))) return invalid$2("挂着的念头没有夹子。");
  return { ok: true, value: structuredClone(normalized) };
}
function newIdea(s, draft, id, now) {
  if (!bodyOK(draft.text)) return invalid$2("请输入念头，正文不超过1MiB。");
  const title = draft.title.trim() || Array.from((draft.text.split("\n").find((x) => x.trim()) ?? "").trim()).slice(0, 50).join("");
  return validateSnapshot({ ...s, clips: [...s.clips, independentClip(s, id, draft.agentId)], draft: null, ideas: [...s.ideas, { ...draft, title, id, status: "hanging", createdAt: now, updatedAt: now }] });
}
function changeStatus(s, id, status, now) {
  if (!s.ideas.some((x) => x.id === id)) return invalid$2("找不到这条念头。");
  const ideas = s.ideas.map((x) => x.id === id ? { ...x, status, updatedAt: now } : x);
  let clips = pruneClips(s.clips, ideas);
  if (status === "hanging" && !clips.some((c) => c.ideaIds.includes(id))) clips = [...clips, independentClip({ ...s, clips }, id, ideas.find((i) => i.id === id).agentId)];
  return validateSnapshot({ ...s, clips, ideas });
}
function removeAgent(s, id, replacement) {
  if (id === "general" || id === replacement || !s.agents.some((x) => x.id === id) || !s.agents.some((x) => x.id === replacement)) return invalid$2("请选择存在的替代Agent，通用标签不能移除。");
  return validateSnapshot({ ...s, clips: s.clips.map((c) => c.agentId === id ? { ...c, agentId: replacement } : c), agents: s.agents.filter((x) => x.id !== id), ideas: s.ideas.map((x) => x.agentId === id ? { ...x, agentId: replacement } : x), draft: s.draft?.agentId === id ? { ...s.draft, agentId: replacement } : s.draft });
}
function editIdea(s, id, draft, now) {
  if (!s.ideas.some((x) => x.id === id) || !draft || !bodyOK(draft.text) || !textOK(draft.title, 50) || !textOK(draft.project, 40)) return invalid$2("正文、标题或项目无效，请保留文字后重试。");
  const title = draft.title.trim() || Array.from(draft.text.split("\n").find((x) => x.trim())?.trim() ?? "").slice(0, 50).join("");
  const ideas = s.ideas.map((x) => x.id === id ? { ...x, text: draft.text, title, project: draft.project, agentId: draft.agentId, updatedAt: now } : x);
  let clips = pruneClips(s.clips, ideas);
  const updated = ideas.find((i) => i.id === id);
  if (updated.status === "hanging" && !clips.some((c) => c.ideaIds.includes(id))) clips = [...clips, independentClip({ ...s, clips }, id, updated.agentId)];
  return validateSnapshot({ ...s, clips, ideas });
}
function addAgent(s, a) {
  return validateSnapshot({ ...s, agents: [...s.agents, { id: a?.id, name: a?.name, color: a?.color }] });
}
function updateAgent(s, id, patch) {
  if (!s.agents.some((a) => a.id === id)) return invalid$2("找不到这个Agent。");
  return validateSnapshot({ ...s, agents: s.agents.map((a) => a.id === id ? { ...a, name: patch?.name, color: patch?.color } : a) });
}
const fileIO = {
  write: async (p, t) => promises.writeFile(p, t, { encoding: "utf8", mode: 384 }),
  fsync: async (p) => {
    const f = await promises.open(p, "r+");
    try {
      await f.sync();
    } finally {
      await f.close();
    }
  },
  rename: promises.rename,
  read: (p) => promises.readFile(p, "utf8")
};
async function atomicWrite(path, text, io = fileIO) {
  const temp = path + ".tmp-" + node_crypto.randomUUID();
  try {
    await io.write(temp, text);
    await io.fsync(temp);
    for (let attempt = 0; ; attempt++) {
      try {
        await io.rename(temp, path);
        break;
      } catch (e) {
        const code = e.code;
        if (process.platform !== "win32" || !["EPERM", "EBUSY", "EACCES"].includes(code ?? "") || attempt >= 3) throw e;
        await new Promise((resolve) => setTimeout(resolve, [20, 100, 300][attempt]));
      }
    }
  } finally {
    await promises.rm(temp, { force: true }).catch(() => {
    });
  }
}
const ioError = (e) => ({ ok: false, code: "IO", message: "本地保存未成功，请保留文字并重试。" + (e instanceof Error ? ` (${e.message})` : "") });
class FileRepository {
  constructor(dir, io = fileIO) {
    this.dir = dir;
    this.io = io;
  }
  dir;
  io;
  cached = null;
  queue = Promise.resolve();
  damaged = null;
  legacy = null;
  async readOptional(path) {
    try {
      return await this.io.read(path);
    } catch (e) {
      if (e.code === "ENOENT") return null;
      throw e;
    }
  }
  async load() {
    if (this.cached) return { ok: true, value: structuredClone(this.cached) };
    try {
      const path = node_path.join(this.dir, "snapshot.json");
      const raw = await this.readOptional(path);
      if (raw !== null) {
        try {
          const decoded = JSON.parse(raw);
          const result = validateSnapshot(decoded);
          if (result.ok) {
            if (decoded.schemaVersion === 1) this.legacy = raw;
            this.cached = result.value;
            return { ok: true, value: structuredClone(result.value) };
          }
          if (decoded && ![1, 2].includes(decoded.schemaVersion)) return result;
        } catch (e) {
          if (!(e instanceof SyntaxError)) throw e;
        }
        this.damaged = raw;
      }
      const backup = await this.readOptional(node_path.join(this.dir, "snapshot.bak.json"));
      if (backup !== null) {
        try {
          const decoded = JSON.parse(backup), result = validateSnapshot(decoded);
          if (result.ok) {
            if (decoded.schemaVersion === 1) this.legacy = backup;
            this.cached = result.value;
            return { ok: true, value: structuredClone(result.value) };
          }
        } catch (e) {
          if (!(e instanceof SyntaxError)) throw e;
        }
      }
      if (raw !== null || backup !== null) return { ok: false, code: "INVALID", message: "数据损坏且没有可用备份，原文件已保留。" };
      await promises.mkdir(this.dir, { recursive: true });
      const initial = initialSnapshot();
      await atomicWrite(path, JSON.stringify(initial), this.io);
      this.cached = initial;
      return { ok: true, value: structuredClone(initial) };
    } catch (e) {
      return ioError(e);
    }
  }
  async flush() {
    await this.queue;
  }
  commit(next, expectedRevision) {
    const execute = async () => {
      const loaded = await this.load();
      if (!loaded.ok) return loaded;
      if (loaded.value.revision !== expectedRevision) return { ok: false, code: "CONFLICT", message: "内容已更新，请重新读取后再试。" };
      const checked = validateSnapshot({ ...next, revision: expectedRevision + 1 });
      if (!checked.ok) return checked;
      try {
        if (this.legacy !== null && await this.readOptional(node_path.join(this.dir, "snapshot.schema1.backup.json")) === null) await atomicWrite(node_path.join(this.dir, "snapshot.schema1.backup.json"), this.legacy, this.io);
        if (this.damaged !== null) await atomicWrite(node_path.join(this.dir, "snapshot.corrupt-" + node_crypto.randomUUID() + ".json"), this.damaged, this.io);
        await atomicWrite(node_path.join(this.dir, "snapshot.bak.json"), JSON.stringify(loaded.value), this.io);
        await atomicWrite(node_path.join(this.dir, "snapshot.json"), JSON.stringify(checked.value), this.io);
        this.cached = checked.value;
        this.damaged = null;
        this.legacy = null;
        return { ok: true, value: structuredClone(checked.value) };
      } catch (e) {
        return ioError(e);
      }
    };
    const pending = this.queue.then(execute, execute);
    this.queue = pending;
    return pending;
  }
}
async function loadWithRecovery(dir, choose, openFolder) {
  for (; ; ) {
    const repository = new FileRepository(dir), result = await repository.load();
    if (result.ok) return { repository, snapshot: result.value };
    const action = await choose(result);
    if (action === "exit") return null;
    if (action === "folder") await openFolder();
  }
}
async function swapShortcut(registry, previous, next, callback, persist = async () => ({ ok: true, value: void 0 })) {
  const alreadyActive = previous === next && registry.isRegistered(previous);
  if (!alreadyActive) {
    try {
      if (!registry.register(next, callback)) return { ok: false, active: previous };
    } catch {
      return { ok: false, active: previous };
    }
  }
  let saved;
  try {
    saved = await persist();
  } catch {
    saved = { ok: false, code: "IO", message: "设置保存未成功，请重试。" };
  }
  if (!saved.ok) {
    if (!alreadyActive) registry.unregister(next);
    return { ok: false, active: previous, error: saved };
  }
  if (previous && previous !== next) registry.unregister(previous);
  return { ok: true, active: next };
}
function displayWriteHotkey(value, platform) {
  const labels = platform === "mac" ? { Command: "⌘", Super: "⌘", Control: "⌃", Alt: "⌥", Shift: "⇧", Space: "空格" } : { Control: "Ctrl", Super: "Win" };
  return value.split("+").map((part) => labels[part] ?? part).join(platform === "mac" ? "" : " + ");
}
function validWriteHotkey(value) {
  if (typeof value !== "string" || value.length > 100) return false;
  const parts = value.split("+"), key = parts.pop();
  return !!key && /^(?:[A-Z0-9]|F(?:[1-9]|1\d|2[0-4])|Space)$/.test(key) && parts.length > 0 && new Set(parts).size === parts.length && parts.every((x) => ["Command", "Control", "Alt", "Shift", "Super"].includes(x)) && parts.some((x) => x !== "Shift");
}
const CARD_WIDTH = 160, MIN_SPACING = 172, COMFORT_SPACING = 220, MARGIN = 12;
function clipTravelBounds(width) {
  return ropeClipBounds(width, CARD_WIDTH / 2 + MARGIN);
}
function layoutClips(clips, width) {
  const { min, max } = clipTravelBounds(width);
  const visible = [], overflow = [];
  const capacity = Math.max(0, 1 + Math.floor((max - min) / COMFORT_SPACING));
  const start = (min + max - (Math.min(clips.length, capacity) - 1) * COMFORT_SPACING) / 2;
  let last = Number.NEGATIVE_INFINITY;
  for (const clip of clips) {
    const preferred = clip.position === null ? visible.length ? last + COMFORT_SPACING : start : min + clip.position * Math.max(0, max - min);
    const x = Math.max(min, last + MIN_SPACING, preferred);
    if (max < min) {
      overflow.push(clip);
      continue;
    }
    if (x > max) {
      overflow.push(clip);
      continue;
    }
    visible.push({ clip, x });
    last = x;
  }
  return { visible, overflow };
}
function normalizedPosition(x, width) {
  const { min, max } = clipTravelBounds(width);
  return max > min ? Math.max(0, Math.min(1, (x - min) / (max - min))) : 0;
}
function captureClipPositions(clips, width, agentId = "all") {
  const visibleClips = clips.filter((clip) => agentId === "all" || clip.agentId === agentId);
  const positions = new Map(layoutClips(visibleClips, width).visible.map((p) => [p.clip.id, normalizedPosition(p.x, width)]));
  return clips.map((clip) => positions.has(clip.id) ? { ...clip, position: positions.get(clip.id) } : clip);
}
const invalid$1 = (message) => ({ ok: false, code: "INVALID", message });
function mergeClips(s, sourceId, targetId) {
  const source = s.clips.find((c) => c.id === sourceId), target = s.clips.find((c) => c.id === targetId);
  if (!source || !target || source === target) return invalid$1("请选择两个不同夹子。");
  if (source.agentId !== target.agentId) return invalid$1("不同Agent的夹子不能合并。");
  return validateSnapshot({ ...s, clips: s.clips.filter((c) => c.id !== sourceId).map((c) => c.id === targetId ? { ...c, ideaIds: [...c.ideaIds, ...source.ideaIds], currentId: source.ideaIds[0] } : c) });
}
function selectClipIdea(s, id, ideaId) {
  if (!s.clips.some((c) => c.id === id && c.ideaIds.includes(ideaId))) return invalid$1("这张便签不在当前夹子中。");
  return validateSnapshot({ ...s, clips: s.clips.map((c) => c.id === id ? { ...c, currentId: ideaId } : c) });
}
function splitClip(s, id, ideaId, newId) {
  const clip = s.clips.find((c) => c.id === id);
  if (!clip || clip.ideaIds.length < 2 || !clip.ideaIds.includes(ideaId) || !newId || s.clips.some((c) => c.id === newId)) return invalid$1("无法拆出这张便签。");
  const ideaIds = clip.ideaIds.filter((x) => x !== ideaId);
  const currentId = ideaIds.includes(clip.currentId) ? clip.currentId : ideaIds[Math.min(clip.ideaIds.indexOf(ideaId), ideaIds.length - 1)];
  const clips = s.clips.flatMap((c) => c.id === id ? [{ ...c, ideaIds, currentId }, { id: newId, agentId: c.agentId, ideaIds: [ideaId], currentId: ideaId, position: null }] : [c]);
  return validateSnapshot({ ...s, clips });
}
function moveClip(s, id, position, beforeId, width, agentId = "all") {
  const clip = s.clips.find((c) => c.id === id);
  if (!clip || !Number.isFinite(position) || position < 0 || position > 1 || beforeId === id || beforeId !== null && !s.clips.some((c) => c.id === beforeId)) return invalid$1("夹子位置无效。");
  const clips = s.clips.filter((c) => c.id !== id);
  const index = beforeId === null ? clips.length : clips.findIndex((c) => c.id === beforeId);
  clips.splice(index, 0, { ...clip, position });
  if (width !== void 0 && Number.isFinite(width)) {
    const visible = new Map(layoutClips(s.clips.filter((c) => agentId === "all" || c.agentId === agentId), width).visible.map((p) => [p.clip.id, p.x]));
    if (visible.has(id)) {
      const ordered = clips.filter((c) => visible.has(c.id)), { min, max } = clipTravelBounds(width);
      if ((ordered.length - 1) * MIN_SPACING <= max - min) {
        const x = ordered.map((c) => c.id === id ? min + position * (max - min) : visible.get(c.id));
        for (let i = 1; i < x.length; i++) x[i] = Math.max(x[i], x[i - 1] + MIN_SPACING);
        x[x.length - 1] = Math.min(x[x.length - 1], max);
        for (let i = x.length - 2; i >= 0; i--) x[i] = Math.min(x[i], x[i + 1] - MIN_SPACING);
        const moved = new Map(ordered.map((c, i) => [c.id, normalizedPosition(x[i], width)]));
        for (let i = 0; i < clips.length; i++) if (moved.has(clips[i].id)) clips[i] = { ...clips[i], position: moved.get(clips[i].id) };
        const selected = clips.filter((c) => agentId === "all" || c.agentId === agentId);
        const lane = [...selected.filter((c) => visible.has(c.id)), ...selected.filter((c) => !visible.has(c.id))];
        let slot = 0;
        for (let i = 0; i < clips.length; i++) if (agentId === "all" || clips[i].agentId === agentId) clips[i] = lane[slot++];
      }
    }
  }
  return validateSnapshot({ ...s, clips });
}
electron.app.setName("Thoughtline");
electron.app.setPath("userData", process.env.THOUGHTLINE_DATA_DIR || node_path.join(electron.app.getPath("appData"), "Thoughtline"));
let prepareQuit = null;
let quitInFlight = false;
let tray;
let edge;
let shelf;
let composer = null;
let manage = null;
let quitting = false;
const blank = { text: "", title: "", project: "", agentId: "general" };
const invalid = (message) => ({ ok: false, code: "INVALID", message });
const done = () => ({ ok: true, value: void 0 });
const draftShape = (d) => !!d && typeof d === "object" && ["text", "title", "project", "agentId"].every((k) => typeof d[k] === "string");
async function loadView(w, view) {
  w.on("page-title-updated", (event) => event.preventDefault());
  w.webContents.on("will-navigate", (event) => event.preventDefault());
  w.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  if (process.env.ELECTRON_RENDERER_URL) await w.loadURL(process.env.ELECTRON_RENDERER_URL + "/?view=" + view);
  else await w.loadFile(node_path.join(__dirname, "../renderer/index.html"), { query: { view } });
}
if (!electron.app.requestSingleInstanceLock()) electron.app.quit();
else electron.app.whenReady().then(async () => {
  const dataDir = electron.app.getPath("userData");
  const loaded = await loadWithRecovery(dataDir, async (error) => {
    const { response } = await electron.dialog.showMessageBox({ type: "error", title: "晾念头：数据读取未成功", message: "念头数据暂时无法读取", detail: `${error.message}

原文件仍保留。可以打开数据目录备份并修复，之后重试。
数据目录：${dataDir}`, buttons: ["打开数据文件夹", "重试读取", "退出"], defaultId: 1, cancelId: 2, noLink: true });
    return response === 0 ? "folder" : response === 1 ? "retry" : "exit";
  }, async () => {
    const error = await electron.shell.openPath(dataDir);
    if (error) electron.dialog.showErrorBox("无法打开数据目录", error);
  });
  if (!loaded) {
    electron.app.quit();
    return;
  }
  const repository = loaded.repository;
  let snapshot = loaded.snapshot;
  let displayId = String(electron.screen.getPrimaryDisplay().id);
  let width = electron.screen.getPrimaryDisplay().bounds.width;
  let draftSequence = 0, draftWritableSession = null;
  let composerWrites = Promise.resolve();
  const composerWrite = (action) => {
    const next = composerWrites.then(action, action);
    composerWrites = next;
    return next;
  };
  let composerSession = 0, manageSession = 0, manageSelection = null, editRevision = snapshot.revision;
  let dragCancelSession = 0, dragEscape = false;
  let textDragTimer = null;
  let textDragOwner = null;
  let shelfAgentId = "all";
  let settingsBusy = false;
  let refreshTray = () => {
  };
  let manageMode = "browse", manageTitles = false;
  let undoClips = null;
  let composerContext = { mode: "new", ideaId: null, draft: snapshot.draft ?? blank };
  const preload = node_path.join(__dirname, "../preload/index.js");
  shelf = createShelf(preload);
  const host = createHost(shelf, () => composer);
  const info = () => ({ platform: host.platform, snapshot, displayId, width, dark: electron.nativeTheme.shouldUseDarkColors, composerSession, composerDraftSequence: draftSequence, composerMaterial: currentComposerMaterial(composer?.isFocused() ?? false), composerContext, manageSession, manageSelection, manageMode, manageTitles, canUndoClips: !!undoClips, dragCancelSession, textDragActive: !!textDragOwner, shelfAgentId, hotkeyRegistered: electron.globalShortcut.isRegistered(snapshot.settings.writeHotkey), ...edge.presentation() });
  const publish = () => {
    for (const w of [shelf, composer, manage]) if (w && !w.isDestroyed()) w.webContents.send("thoughtline:info-update", info());
  };
  const trusted = (e, allowed = [shelf, composer, manage]) => allowed.some((w) => w?.webContents === e.sender) && e.senderFrame === e.sender.mainFrame;
  const lock = (name, active) => edge.event({ type: "lock", name, active, now: Date.now() });
  const hideManage = () => {
    manage?.hide();
    lock("manage", false);
  };
  const boundsFor = (w, h) => {
    const d = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint());
    const width2 = Math.min(w, d.workArea.width - 40), height = Math.min(h, d.workArea.height - 48);
    return { x: Math.round(d.workArea.x + (d.workArea.width - width2) / 2), y: d.workArea.y + 24, width: width2, height };
  };
  const finishTextDrag = () => {
    if (textDragTimer) clearTimeout(textDragTimer);
    textDragTimer = null;
    textDragOwner = null;
    lock("text-drag", false);
  };
  electron.app.on("will-quit", () => {
    if (textDragTimer) clearTimeout(textDragTimer);
  });
  const cancelDrag = () => {
    finishTextDrag();
    if (dragEscape) {
      electron.globalShortcut.unregister("Escape");
      dragEscape = false;
      lock("drag", false);
    }
    dragCancelSession++;
    publish();
  };
  edge = new EdgeController(host, (id, w) => {
    displayId = id;
    width = w;
    cancelDrag();
  }, publish);
  let composerLoading = null, manageLoading = null;
  let composerSafeToRelease = true;
  const closeConfirmedComposer = () => {
    draftWritableSession = null;
    composerSafeToRelease = true;
    host.closeComposer();
  };
  let composerRelease = null, manageRelease = null;
  const ensureComposer = () => {
    if (composerRelease) clearTimeout(composerRelease);
    composerRelease = null;
    if (composerLoading) return composerLoading;
    if (composer) return Promise.resolve(composer);
    const w = createComposer(preload);
    composer = w;
    w.on("close", (event) => {
      if (!quitting) event.preventDefault();
    });
    w.on("focus", publish);
    w.on("blur", publish);
    w.on("show", () => {
      composerSafeToRelease = false;
      if (composerRelease) clearTimeout(composerRelease);
      composerRelease = null;
      refreshTray();
    });
    w.on("hide", () => {
      refreshTray();
      lock("composer", false);
      if (!composerSafeToRelease) return;
      composerRelease = setTimeout(() => {
        composerRelease = null;
        if (composerSafeToRelease && !w.isDestroyed() && !w.isVisible()) {
          composer = null;
          w.destroy();
        }
      }, 3e4);
    });
    composerLoading = loadView(w, "composer").then(() => w).catch((error) => {
      composer = null;
      w.destroy();
      throw error;
    }).finally(() => {
      composerLoading = null;
    });
    return composerLoading;
  };
  const ensureManage = () => {
    if (manageRelease) clearTimeout(manageRelease);
    manageRelease = null;
    if (manageLoading) return manageLoading;
    if (manage) return Promise.resolve(manage);
    const w = createManage(preload);
    manage = w;
    w.on("close", (event) => {
      if (!quitting) event.preventDefault();
    });
    w.on("show", () => {
      if (manageRelease) clearTimeout(manageRelease);
      manageRelease = null;
      refreshTray();
    });
    w.on("hide", () => {
      refreshTray();
      manageRelease = setTimeout(() => {
        manageRelease = null;
        if (!w.isDestroyed() && !w.isVisible()) {
          manage = null;
          w.destroy();
        }
      }, 3e4);
    });
    manageLoading = loadView(w, "manage").then(() => w).catch((error) => {
      manage = null;
      w.destroy();
      throw error;
    }).finally(() => {
      manageLoading = null;
    });
    return manageLoading;
  };
  electron.app.on("will-quit", () => {
    if (composerRelease) clearTimeout(composerRelease);
    if (manageRelease) clearTimeout(manageRelease);
  });
  const openComposer = async (ideaId) => {
    if (composerLoading) return done();
    if (manage?.isVisible() && manageMode === "settings") return invalid("请先关闭设置。");
    if (composer?.isVisible()) {
      composer.show();
      composer.focus();
      return ideaId ? invalid("请先保存或取消当前编辑。") : done();
    }
    if (composer && !composerSafeToRelease) {
      hideManage();
      lock("composer", true);
      host.showComposer(boundsFor(COMPOSER_SIZE.width, COMPOSER_SIZE.height));
      return ideaId ? invalid("请先保存或取消尚未完成的输入。") : done();
    }
    const idea = ideaId ? snapshot.ideas.find((x) => x.id === ideaId) : null;
    if (ideaId && !idea) return invalid("找不到这条念头。");
    composerContext = idea ? { mode: "edit", ideaId: idea.id, draft: { text: idea.text, title: idea.title, project: idea.project, agentId: idea.agentId } } : { mode: "new", ideaId: null, draft: snapshot.draft ?? blank };
    editRevision = snapshot.revision;
    composerSession++;
    draftWritableSession = composerSession;
    draftSequence = 0;
    try {
      await ensureComposer();
    } catch {
      return { ok: false, code: "IO", message: "输入浮层未能打开，请重试。原数据已保留。" };
    }
    if (quitting) return invalid("正在退出。");
    if (manage?.isVisible() && manageMode === "settings") return invalid("请先关闭设置。");
    composerSafeToRelease = false;
    lock("composer", true);
    hideManage();
    publish();
    host.showComposer(boundsFor(COMPOSER_SIZE.width, COMPOSER_SIZE.height));
    return done();
  };
  const save = async (next, revision) => {
    if (!next.ok) return next;
    const r = await repository.commit(next.value, revision);
    if (r.ok) {
      snapshot = r.value;
      undoClips = null;
      if (shelfAgentId !== "all" && !snapshot.agents.some((a) => a.id === shelfAgentId)) shelfAgentId = "all";
      refreshTray();
      publish();
    }
    return r;
  };
  const captureDraft = () => new Promise((resolve) => {
    const id = node_crypto.randomUUID();
    let finished = false;
    const finish = (result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      electron.ipcMain.removeListener("thoughtline:quit-draft", receive);
      resolve(result);
    };
    const receive = (event, requestId, draft) => {
      if (requestId !== id || !trusted(event, [composer])) return;
      finish(draftShape(draft) ? { ok: true, value: draft } : { ok: false, code: "IO", message: "当前内容正在保存，退出未完成。请稍后重试。" });
    };
    const timer = setTimeout(() => finish({ ok: false, code: "IO", message: "未能读取当前草稿，退出已取消。请保留文字后重试。" }), 3e3);
    electron.ipcMain.on("thoughtline:quit-draft", receive);
    composer.webContents.send("thoughtline:prepare-quit", id);
  });
  prepareQuit = async () => {
    if (settingsBusy) return false;
    await composerWrites;
    await repository.flush();
    if (!composer || composerSafeToRelease && !composer.isVisible() || composerContext.mode === "edit") return true;
    const draft = await captureDraft();
    const saved = draft.ok ? await save({ ok: true, value: { ...snapshot, draft: draft.value } }, snapshot.revision) : draft;
    if (saved.ok) return true;
    composer.webContents.send("thoughtline:quit-error", saved.message);
    composer.show();
    composer.focus();
    return false;
  };
  electron.ipcMain.handle("thoughtline:info", (e) => {
    if (!trusted(e)) throw Error("不允许读取");
    return info();
  });
  electron.ipcMain.on("thoughtline:presentation-finished", (e, session) => {
    if (trusted(e, [shelf]) && Number.isSafeInteger(session) && session >= 0) edge.presentationFinished(session);
  });
  electron.ipcMain.on("thoughtline:hit-layout", (e, p) => {
    if (!trusted(e, [shelf]) || !p || !Number.isSafeInteger(p.layoutRevision) || !Array.isArray(p.rects) || p.rects.length > 512 || typeof p.displayId !== "string") return;
    if (p.rects.every((r) => r && [r.x, r.y, r.width, r.height].every(Number.isFinite) && r.width > 0 && r.height > 0 && r.x >= 0 && r.y >= 0 && r.x + r.width <= width + 1 && r.y + r.height <= 340)) edge.layout(p);
  });
  electron.ipcMain.handle("thoughtline:copy", async (e, id) => {
    if (!trusted(e, [shelf, manage]) || typeof id !== "string") return invalid("无效操作");
    const idea = snapshot.ideas.find((x) => x.id === id);
    if (!idea) return invalid("找不到正文");
    try {
      await electron.clipboard.writeText(idea.text);
      return done();
    } catch {
      return { ok: false, code: "IO", message: "复制失败，请在全文中手动选中复制。" };
    }
  });
  electron.ipcMain.handle("thoughtline:save-draft", (e, draft, session, sequence) => composerWrite(async () => {
    if (!trusted(e, [composer]) || !draftShape(draft) || session !== composerSession || session !== draftWritableSession || !Number.isSafeInteger(sequence) || sequence <= 0 || quitting || quitInFlight || composerSafeToRelease || composerContext.mode !== "new") return invalid("草稿会话已结束或内容无效。");
    if (sequence <= draftSequence) return { ok: true, value: snapshot };
    draftSequence = sequence;
    if (snapshot.draft && ["text", "title", "project", "agentId"].every((key) => snapshot.draft[key] === draft[key])) return { ok: true, value: snapshot };
    const saved = await repository.commit({ ...snapshot, draft }, snapshot.revision);
    if (saved.ok) {
      snapshot = saved.value;
      composerContext = { ...composerContext, draft };
      if (undoClips) undoClips = { snapshot: { ...undoClips.snapshot, draft }, revision: snapshot.revision };
      publish();
    }
    return saved;
  }));
  electron.ipcMain.handle("thoughtline:submit", (e, draft, revision) => composerWrite(async () => {
    if (!trusted(e, [composer]) || !draftShape(draft)) return invalid("无效内容");
    if (composerContext.mode === "edit" && revision !== editRevision) return { ok: false, code: "CONFLICT", message: "记录已变化，请保留文字，重新打开后核对。" };
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const next = composerContext.mode === "edit" ? editIdea(snapshot, composerContext.ideaId, draft, now) : newIdea(snapshot, draft, node_crypto.randomUUID(), now);
    const committed = await save(next, revision);
    if (!committed.ok) return committed;
    closeConfirmedComposer();
    lock("composer", false);
    edge.event({ type: "peek", now: Date.now() });
    publish();
    return committed;
  }));
  electron.ipcMain.handle("thoughtline:close", (e, draft) => composerWrite(async () => {
    if (!trusted(e, [composer]) || !draftShape(draft)) return invalid("无效操作");
    if (composerContext.mode === "edit") {
      closeConfirmedComposer();
      lock("composer", false);
      return { ok: true, value: snapshot };
    }
    const saved = await save({ ok: true, value: { ...snapshot, draft } }, snapshot.revision);
    if (!saved.ok) return saved;
    closeConfirmedComposer();
    lock("composer", false);
    return saved;
  }));
  electron.ipcMain.handle("thoughtline:open-manage", async (e, id, titles) => {
    if (!trusted(e) || id !== void 0 && typeof id !== "string" || titles !== void 0 && typeof titles !== "boolean") return invalid("无效操作");
    if (composer?.isVisible()) return invalid("请先保存或取消当前输入。");
    if (id && !snapshot.ideas.some((x) => x.id === id)) return invalid("找不到这条念头。");
    try {
      await ensureManage();
    } catch {
      return { ok: false, code: "IO", message: "浏览浮层未能打开，请重试。" };
    }
    if (quitting) return invalid("正在退出。");
    if (composer?.isVisible()) return invalid("请先保存或取消当前输入。");
    manageSelection = id ?? null;
    manageMode = id ? "detail" : "browse";
    manageTitles = !!titles;
    manageSession++;
    lock("manage", true);
    publish();
    if (id) {
      const d = electron.screen.getDisplayNearestPoint(electron.screen.getCursorScreenPoint()), p = electron.screen.getCursorScreenPoint();
      const b = boundsFor(380, 360);
      b.x = Math.round(Math.max(d.workArea.x + 12, Math.min(d.workArea.x + d.workArea.width - b.width - 12, p.x - b.width / 2)));
      b.y = Math.round(Math.max(d.workArea.y + 12, Math.min(d.workArea.y + d.workArea.height - b.height - 12, p.y + 24)));
      manage.setBounds(b);
    } else manage.setBounds(boundsFor(740, 540));
    manage.show();
    manage.focus();
    refreshTray();
    return done();
  });
  const selectShelfAgent = (id) => {
    shelfAgentId = id === "all" || snapshot.agents.some((a) => a.id === id) ? id : "all";
    refreshTray();
    publish();
  };
  const agentFilterMenu = () => [
    { label: "全部", type: "radio", checked: shelfAgentId === "all", click: () => selectShelfAgent("all") },
    ...snapshot.agents.map((agent) => ({ label: agent.name, type: "radio", checked: shelfAgentId === agent.id, click: () => selectShelfAgent(agent.id) }))
  ];
  const browseFromTray = () => {
    void openBrowse();
  };
  const openBrowse = async () => {
    if (composer?.isVisible()) return invalid("请先保存或取消当前输入。");
    try {
      await ensureManage();
    } catch {
      return invalid("浏览浮层未能打开，请重试。");
    }
    if (quitting || composer?.isVisible()) return invalid("请先结束当前输入。");
    manageMode = "browse";
    manageSelection = null;
    manageTitles = false;
    manageSession++;
    lock("manage", true);
    manage.setBounds(boundsFor(740, 540));
    publish();
    manage.show();
    manage.focus();
    refreshTray();
    return done();
  };
  electron.ipcMain.handle("thoughtline:shelf-menu", (e, id) => {
    if (!trusted(e, [shelf]) || typeof id !== "string") return invalid("无效操作");
    const idea = snapshot.ideas.find((i) => i.id === id);
    if (!idea) return invalid("找不到这条念头。");
    if (!edge.presentation().shelfVisible) return invalid("挂绳已收起。");
    lock("menu", true);
    const menu = electron.Menu.buildFromTemplate([
      { label: "查看全文", click: () => {
        void openBrowseDetail(id);
      } },
      { label: `只看 ${snapshot.agents.find((a) => a.id === idea.agentId)?.name ?? "这个 Agent"}`, click: () => selectShelfAgent(idea.agentId) },
      { label: "显示全部", click: () => selectShelfAgent("all") },
      { label: "筛选 Agent", submenu: agentFilterMenu() },
      { type: "separator" },
      { label: "查找 / 已收起", click: browseFromTray }
    ]);
    try {
      menu.popup({ window: shelf, callback: () => lock("menu", false) });
    } catch {
      lock("menu", false);
      return invalid("菜单未能打开，请从托盘查找念头。");
    }
    return done();
  });
  const openBrowseDetail = async (id) => {
    if (composer?.isVisible()) return invalid("请先保存或取消当前输入。");
    try {
      await ensureManage();
    } catch {
      return invalid("全文浮层未能打开，请重试。");
    }
    if (quitting || composer?.isVisible()) return invalid("请先结束当前输入。");
    manageMode = "detail";
    manageSelection = id;
    manageTitles = false;
    manageSession++;
    lock("manage", true);
    manage.setBounds(boundsFor(380, 360));
    publish();
    manage.show();
    manage.focus();
    refreshTray();
    return done();
  };
  electron.ipcMain.handle("thoughtline:close-manage", (e) => {
    if (!trusted(e, [manage])) return invalid("无效操作");
    hideManage();
    return done();
  });
  const openSettings = async () => {
    if (composer?.isVisible()) return invalid("请先保存或取消当前输入。");
    try {
      await ensureManage();
    } catch {
      return { ok: false, code: "IO", message: "设置浮层未能打开，请重试。" };
    }
    if (quitting) return invalid("正在退出。");
    if (composer?.isVisible()) return invalid("请先保存或取消当前输入。");
    cancelDrag();
    manageMode = "settings";
    manageTitles = false;
    manageSelection = null;
    manageSession++;
    lock("manage", true);
    manage.setBounds(boundsFor(440, 390));
    publish();
    manage.show();
    manage.focus();
    refreshTray();
    return done();
  };
  electron.ipcMain.handle("thoughtline:open-settings", (e) => trusted(e) ? openSettings() : invalid("无效操作"));
  electron.ipcMain.handle("thoughtline:settings", async (e, settings, revision) => {
    if (!trusted(e, [manage]) || manageMode !== "settings" || !settings || !validWriteHotkey(settings.writeHotkey) || typeof settings.reducedMotion !== "boolean") return invalid("请录制有效的组合快捷键。");
    if (settingsBusy) return invalid("正在保存设置，请稍后重试。");
    if (revision !== snapshot.revision) return { ok: false, code: "CONFLICT", message: "设置已变化，请核对后重试。" };
    settingsBusy = true;
    let committed = invalid("快捷键已被占用，请录制其他组合；原键位保持。");
    try {
      const changed = await swapShortcut(electron.globalShortcut, snapshot.settings.writeHotkey, settings.writeHotkey, () => {
        openComposer();
      }, async () => {
        committed = await save({ ok: true, value: { ...snapshot, settings: { writeHotkey: settings.writeHotkey, reducedMotion: settings.reducedMotion } } }, revision);
        return committed;
      });
      if (!changed.ok) return changed.error?.ok === false ? changed.error : committed;
      refreshTray();
      publish();
      return committed;
    } finally {
      settingsBusy = false;
    }
  });
  electron.ipcMain.handle("thoughtline:open-edit", (e, id) => trusted(e, [shelf, manage]) && typeof id === "string" ? openComposer(id) : invalid("无效操作"));
  electron.ipcMain.handle("thoughtline:status", async (e, id, status, revision) => {
    if (!trusted(e, [shelf, manage]) || typeof id !== "string" || !["hanging", "archived"].includes(status)) return invalid("无效操作");
    const r = await save(changeStatus(snapshot, id, status, (/* @__PURE__ */ new Date()).toISOString()), revision);
    if (r.ok) edge.event({ type: "peek", now: Date.now() });
    return r;
  });
  electron.ipcMain.handle("thoughtline:agent", async (e, c, revision) => {
    if (!trusted(e, [manage]) || !c || typeof c !== "object") return invalid("无效操作");
    let next;
    if (c.kind === "add" && typeof c.name === "string" && typeof c.color === "string") next = addAgent(snapshot, { id: node_crypto.randomUUID(), name: c.name.trim(), color: c.color });
    else if (c.kind === "update" && typeof c.id === "string" && typeof c.name === "string" && typeof c.color === "string") next = updateAgent(snapshot, c.id, { name: c.name.trim(), color: c.color });
    else if (c.kind === "remove" && typeof c.id === "string" && typeof c.replacement === "string") next = removeAgent(snapshot, c.id, c.replacement);
    else return invalid("Agent内容无效");
    return save(next, revision);
  });
  electron.ipcMain.on("thoughtline:text-drag", (e, active, id) => {
    if (!trusted(e, [shelf]) || typeof active !== "boolean") return;
    if (!active) {
      if (id === textDragOwner) finishTextDrag();
      return;
    }
    if (textDragTimer || !edge.presentation().shelfVisible || typeof id !== "string" || !snapshot.ideas.some((i) => i.id === id && i.status === "hanging")) return;
    textDragOwner = id;
    lock("text-drag", true);
    textDragTimer = setTimeout(finishTextDrag, 6e4);
  });
  electron.ipcMain.handle("thoughtline:drag-lock", (e, active) => {
    if (!trusted(e, [shelf]) || typeof active !== "boolean") return invalid("无效操作");
    if (active && !dragEscape) {
      if (!electron.globalShortcut.register("Escape", cancelDrag)) return invalid("Esc快捷键被占用，拖动未开始，请释放快捷键后重试。");
      dragEscape = true;
    }
    if (!active && dragEscape) {
      electron.globalShortcut.unregister("Escape");
      dragEscape = false;
    }
    lock("drag", active);
    return done();
  });
  electron.ipcMain.handle("thoughtline:clip", async (e, c, revision) => {
    if (!trusted(e, [shelf, manage]) || !c || typeof c !== "object") return invalid("无效操作");
    if (revision !== snapshot.revision) return { ok: false, code: "CONFLICT", message: "布局已变化，请重新操作。" };
    const previous = snapshot, oldUndo = undoClips;
    let next;
    const positioned = () => ({ ...snapshot, clips: captureClipPositions(snapshot.clips, width, shelfAgentId) });
    if (c.kind === "merge" && typeof c.sourceId === "string" && typeof c.targetId === "string") next = mergeClips(positioned(), c.sourceId, c.targetId);
    else if (c.kind === "move" && typeof c.id === "string" && typeof c.position === "number" && (c.beforeId === null || typeof c.beforeId === "string")) next = moveClip(positioned(), c.id, c.position, c.beforeId, width, shelfAgentId);
    else if (c.kind === "select" && typeof c.id === "string" && typeof c.ideaId === "string") next = selectClipIdea(snapshot, c.id, c.ideaId);
    else if (c.kind === "split" && typeof c.id === "string" && typeof c.ideaId === "string") next = splitClip(positioned(), c.id, c.ideaId, node_crypto.randomUUID());
    else if (c.kind === "splitAll" && typeof c.id === "string") {
      const clip = snapshot.clips.find((x) => x.id === c.id);
      if (!clip || clip.ideaIds.length < 2) return invalid("没有可拆出的便签。");
      next = { ok: true, value: positioned() };
      for (const id of clip.ideaIds.slice(1)) {
        if (!next.ok) break;
        next = splitClip(next.value, c.id, id, node_crypto.randomUUID());
      }
    } else if (c.kind === "archiveAll" && typeof c.id === "string") {
      const clip = snapshot.clips.find((x) => x.id === c.id);
      if (!clip) return invalid("找不到夹子。");
      next = { ok: true, value: snapshot };
      for (const id of clip.ideaIds) {
        if (!next.ok) break;
        next = changeStatus(next.value, id, "archived", (/* @__PURE__ */ new Date()).toISOString());
      }
    } else if (c.kind === "undo") {
      if (!oldUndo || oldUndo.revision !== revision) return invalid("没有可撤销的夹子操作。");
      next = { ok: true, value: { ...oldUndo.snapshot, revision } };
    } else return invalid("夹子操作无效");
    const r = await save(next, revision);
    if (r.ok) {
      if (c.kind === "split") {
        manageSelection = c.ideaId;
        manageSession++;
      }
      undoClips = c.kind === "undo" ? null : c.kind === "select" ? oldUndo ? { ...oldUndo, revision: r.value.revision } : null : { snapshot: previous, revision: r.value.revision };
      publish();
    }
    return r;
  });
  await loadView(shelf, "shelf");
  electron.globalShortcut.register(snapshot.settings.writeHotkey, () => {
    openComposer();
  });
  const icon = electron.nativeImage.createFromPath(node_path.join(__dirname, "../../assets/" + (process.platform === "darwin" ? "trayTemplate.png" : "app-icon.png"))).resize({ width: 22, height: 22 });
  if (icon.isEmpty()) throw Error("Thoughtline tray icon failed to load.");
  if (process.platform === "darwin") icon.setTemplateImage(true);
  tray = new electron.Tray(icon);
  tray.setToolTip("晾念头 / Thoughtline");
  refreshTray = () => tray.setContextMenu(electron.Menu.buildFromTemplate([{ label: "晾念头 / Thoughtline", enabled: false }, { label: `写念头：${displayWriteHotkey(snapshot.settings.writeHotkey, host.platform)}${electron.globalShortcut.isRegistered(snapshot.settings.writeHotkey) ? "" : "（注册失败）"}`, enabled: !composer?.isVisible() && !(manage?.isVisible() && manageMode === "settings"), click: () => {
    void openComposer();
  } }, { type: "separator" }, { label: "查找 / 已收起", enabled: !composer?.isVisible(), click: browseFromTray }, { label: "筛选 Agent", submenu: agentFilterMenu() }, { label: "设置", enabled: !composer?.isVisible(), click: () => {
    openSettings();
  } }, { label: "暂停悬停", type: "checkbox", checked: edge.isManuallyPaused(), click: (item) => {
    cancelDrag();
    edge.pause(item.checked);
  } }, { label: "退出", click: () => electron.app.quit() }]));
  refreshTray();
  electron.nativeTheme.on("updated", publish);
  electron.powerMonitor.on("suspend", () => {
    cancelDrag();
    edge.pause(true, "sleep");
  });
  electron.powerMonitor.on("lock-screen", () => {
    cancelDrag();
    edge.pause(true, "lock");
  });
  electron.powerMonitor.on("resume", () => edge.pause(false, "sleep"));
  electron.powerMonitor.on("unlock-screen", () => edge.pause(false, "lock"));
  electron.screen.on("display-metrics-changed", cancelDrag);
  electron.app.dock?.hide();
  publish();
  edge.start();
}).catch((error) => {
  console.error(error);
  electron.dialog.showErrorBox("晾念头启动未成功", error instanceof Error ? error.message : "启动发生错误，请保留数据后重试。");
  electron.app.quit();
});
electron.app.on("before-quit", (event) => {
  if (!quitting && prepareQuit) {
    event.preventDefault();
    if (quitInFlight) return;
    quitInFlight = true;
    void prepareQuit().then((ok) => {
      quitInFlight = false;
      if (ok) {
        quitting = true;
        electron.app.quit();
      }
    }).catch(() => {
      quitInFlight = false;
      composer?.webContents.send("thoughtline:quit-error", "退出未成功，文字已保留，请重试。");
    });
    return;
  }
  quitting = true;
  edge?.stop();
  electron.globalShortcut.unregisterAll();
});
electron.app.on("window-all-closed", () => {
  if (quitting) electron.app.quit();
});
