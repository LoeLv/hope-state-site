const storageKey = "hope_state_site_v2";

const config = {
  supabaseUrl: "https://trosjcbvfhnfkelflijc.supabase.co",
  anonKey: "sb_publishable_sZYKAIzDJJYQgzC2Buzhyw_art6KnAS",
  actionUrl: "https://trosjcbvfhnfkelflijc.supabase.co/functions/v1/hope-state-action"
};

const gods = [
  ["诞育", "生命"], ["繁荣", "生命"], ["死亡", "生命"],
  ["记忆", "存在"], ["时间", "存在"],
  ["秩序", "文明"], ["真理", "文明"], ["战争", "文明"],
  ["欺诈", "虚无"], ["命运", "虚无"],
  ["混乱", "混沌"], ["沉默", "混沌"], ["痴愚", "混沌"],
  ["污堕", "沉沦"], ["腐朽", "沉沦"], ["湮灭", "沉沦"]
];

let state = loadState();
let rankMode = "total";
let currentPrivateProfile = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const onlineEnabled = Boolean(config.actionUrl && config.anonKey);

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (stored && Array.isArray(stored.profiles) && Array.isArray(stored.settlements)) return stored;
  } catch {}
  const now = new Date().toISOString();
  return {
    profiles: [
      {
        id: crypto.randomUUID(),
        name: "晨星守望者",
        secretPhrase: "希望不会熄灭",
        god: "繁荣",
        path: "生命",
        className: "德鲁伊",
        publicNote: "希望之州样例档案。公开面板只显示基础职业信息。",
        privateNote: "这里是本人暗语验证后才显示的私密备注。",
        talents: ["B · 晨露复苏", "C · 枝叶庇护"],
        ascension: 1000,
        audience: 0,
        isPublic: true,
        createdAt: now
      }
    ],
    settlements: []
  };
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function normalizeName(value) {
  return String(value || "").trim();
}

function normalizeTalents(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function totalScore(profile) {
  return Number(profile.ascension || profile.ascension_score || 0) + Number(profile.audience || profile.audience_score || 0) * 10;
}

function publicProfiles() {
  return state.profiles.filter((profile) => profile.isPublic !== false);
}

function getAscension(profile) {
  return Number(profile.ascension ?? profile.ascension_score ?? 0);
}

function getAudience(profile) {
  return Number(profile.audience ?? profile.audience_score ?? 0);
}

function getRankedProfiles() {
  return [...publicProfiles()].sort((a, b) => {
    if (rankMode === "ascension") return getAscension(b) - getAscension(a) || getAudience(b) - getAudience(a);
    if (rankMode === "audience") return getAudience(b) - getAudience(a) || getAscension(b) - getAscension(a);
    return totalScore(b) - totalScore(a);
  });
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(min, Math.min(max, number));
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 1900);
}

async function callAction(action, payload = {}) {
  if (!onlineEnabled) {
    try {
      return { data: await localAction(action, payload), error: null };
    } catch (error) {
      return { data: null, error: error.message || "本地操作失败" };
    }
  }
  try {
    const response = await fetch(config.actionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": config.anonKey,
        "Authorization": `Bearer ${config.anonKey}`
      },
      body: JSON.stringify({ action, payload })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.error) return { data: null, error: data.error || data.message || "请求失败" };
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message || "网络请求失败" };
  }
}

async function localAction(action, payload) {
  if (action === "listPublicProfiles") return { profiles: publicProfiles().map(toPublicProfile) };
  if (action === "verifySecret") {
    const name = normalizeName(payload.name);
    const phrase = String(payload.phrase || "");
    const profile = state.profiles.find((item) => item.name === name && item.secretPhrase === phrase);
    if (!profile) throw new Error("名字或暗语不正确");
    return { profile: toPrivateProfile(profile) };
  }
  if (action === "adminUpsertProfile") {
    const profile = payload.profile || {};
    const name = normalizeName(profile.name);
    if (!name) throw new Error("缺少昵称");
    const existing = state.profiles.find((item) => item.name === name);
    const next = {
      id: existing?.id || crypto.randomUUID(),
      name,
      secretPhrase: profile.secretPhrase || existing?.secretPhrase || "",
      god: profile.god || "命运",
      path: profile.path || "虚无",
      className: profile.className || "",
      publicNote: profile.publicNote || "",
      privateNote: profile.privateNote || "",
      talents: normalizeTalents(profile.talents),
      ascension: Number(profile.ascension ?? existing?.ascension ?? 1000),
      audience: Number(profile.audience ?? existing?.audience ?? 0),
      isPublic: profile.isPublic !== false,
      updatedAt: new Date().toISOString()
    };
    if (existing) Object.assign(existing, next);
    else state.profiles.push({ ...next, createdAt: new Date().toISOString() });
    saveState();
    return { profile: toPublicProfile(next) };
  }
  if (action === "submitScore") {
    const profile = state.profiles.find((item) => item.id === payload.profileId || item.name === payload.name);
    if (!profile) throw new Error("找不到结算对象");
    const ascensionDelta = clampNumber(payload.ascensionDelta, -20, 20);
    const audienceDelta = clampNumber(payload.audienceDelta, 0, 3);
    profile.ascension = Math.max(0, Number(profile.ascension || 0) + ascensionDelta);
    profile.audience = Math.max(0, Number(profile.audience || 0) + audienceDelta);
    state.settlements.unshift({
      id: crypto.randomUUID(),
      profileId: profile.id,
      name: profile.name,
      ascensionDelta,
      audienceDelta,
      reason: payload.reason || "",
      createdAt: new Date().toISOString()
    });
    saveState();
    return { ok: true };
  }
  if (action === "listScoreLogs") return { logs: state.settlements };
  throw new Error("未知操作");
}

function toPublicProfile(profile) {
  return {
    id: profile.id,
    name: profile.name || profile.display_name,
    god: profile.god,
    path: profile.path,
    className: profile.className || profile.profession,
    publicNote: profile.publicNote || profile.public_note || "",
    ascension: getAscension(profile),
    audience: getAudience(profile),
    isPublic: profile.isPublic ?? profile.is_public ?? true
  };
}

function toPrivateProfile(profile) {
  return {
    ...toPublicProfile(profile),
    privateNote: profile.privateNote || profile.private_note || "",
    talents: normalizeTalents(profile.talents),
    talentSummary: profile.talentSummary || profile.talent_summary || ""
  };
}

function setupGodOptions() {
  const godInput = $("#godInput");
  godInput.innerHTML = gods.map(([god, path]) => `<option value="${god}" data-path="${path}">${god} · ${path}</option>`).join("");
  godInput.addEventListener("change", () => {
    const selected = gods.find(([god]) => god === godInput.value);
    if (selected) $("#pathInput").value = selected[1];
  });
}

async function refreshPublicData() {
  const result = await callAction("listPublicProfiles");
  if (result.error) {
    showToast(`读取排行榜失败：${result.error}`);
    return;
  }
  state.profiles = (result.data.profiles || []).map((profile) => {
    const existing = state.profiles.find((item) => item.id === profile.id || item.name === profile.name);
    return { ...existing, ...profile, isPublic: profile.isPublic !== false };
  });
  renderAll();
}

function filteredProfiles() {
  const search = $("#leaderboardSearch").value.trim().toLowerCase();
  const path = $("#pathFilter").value;
  return getRankedProfiles().filter((profile) => {
    const text = `${profile.name} ${profile.god} ${profile.path} ${profile.className} ${profile.publicNote}`.toLowerCase();
    return (!search || text.includes(search)) && (path === "all" || profile.path === path);
  });
}

function renderLeaderboard() {
  const profiles = filteredProfiles();
  $("#totalProfiles").textContent = publicProfiles().length;
  $("#dataModeLabel").textContent = onlineEnabled ? "Supabase 在线模式" : "本地演示模式";
  $("#leaderboardList").innerHTML = profiles.map((profile, index) => `
    <button class="rank-row rank-row--button" type="button" data-public-id="${profile.id}">
      <span class="rank-index">#${index + 1}</span>
      <span class="rank-name">
        <strong>${escapeHtml(profile.name)}</strong>
        <span>${escapeHtml(profile.god)} · ${escapeHtml(profile.path)} · ${escapeHtml(profile.className || "未定身份")}</span>
      </span>
      <span class="rank-metric"><span>总评</span><strong>${totalScore(profile)}</strong></span>
      <span class="rank-metric"><span>登神分</span><strong>${getAscension(profile)}</strong></span>
      <span class="rank-metric"><span>觐见分</span><strong>${getAudience(profile)}</strong></span>
    </button>
  `).join("");
  $$("[data-public-id]").forEach((button) => button.addEventListener("click", () => openPublicPanel(button.dataset.publicId)));
  renderScoreTargets();
}

function renderScoreTargets() {
  const select = $("#scoreTarget");
  const current = select.value;
  select.innerHTML = publicProfiles().map((profile) => `<option value="${profile.id}">${escapeHtml(profile.name)} · ${profile.god}</option>`).join("");
  if (publicProfiles().some((profile) => profile.id === current)) select.value = current;
}

function openPublicPanel(id) {
  const profile = publicProfiles().find((item) => item.id === id);
  if (!profile) return;
  $("#publicPanel").innerHTML = `
    <button class="modal__close" type="button" data-close-public aria-label="关闭">×</button>
    <p class="eyebrow">Public Dossier</p>
    <div class="profile-card profile-card--modal" data-card="public">
      <div class="profile-card__top">
        <div>
          <h3>${escapeHtml(profile.name)}</h3>
          <p>${escapeHtml(profile.god)} · ${escapeHtml(profile.path)} · ${escapeHtml(profile.className || "未定身份")}</p>
        </div>
        <span class="badge">${totalScore(profile)}</span>
      </div>
      <p>${escapeHtml(profile.publicNote || "暂无公开短记。")}</p>
      ${scoreStrip(profile)}
    </div>
    <button class="btn btn--primary" type="button" data-export-card="public">导出公开图片</button>
  `;
  $("#publicModal").hidden = false;
  $("[data-export-card='public']").addEventListener("click", () => exportPanelImage($("#publicPanel .profile-card"), `${profile.name}-公开面板`));
  $$("[data-close-public]").forEach((item) => item.addEventListener("click", closePublicPanel));
}

function closePublicPanel() {
  $("#publicModal").hidden = true;
}

function scoreStrip(profile) {
  return `
    <dl class="score-strip">
      <div><dt>登神分</dt><dd>${getAscension(profile)}</dd></div>
      <div><dt>觐见分</dt><dd>${getAudience(profile)}</dd></div>
    </dl>
  `;
}

function renderPrivatePanel(profile) {
  currentPrivateProfile = profile;
  $("#logoutButton").hidden = false;
  const talents = normalizeTalents(profile.talents);
  $("#privatePanel").innerHTML = `
    <p class="eyebrow">Private Dossier</p>
    <div class="private-card" data-card="private">
      <div class="avatar-orbit">${escapeHtml((profile.name || "希").slice(0, 1))}</div>
      <h3>${escapeHtml(profile.name)}</h3>
      <p>${escapeHtml(profile.god)} · ${escapeHtml(profile.path)} · ${escapeHtml(profile.className || "未定身份")}</p>
      ${scoreStrip(profile)}
      <section class="talent-section">
        <h4>天赋</h4>
        ${talents.length ? `<ul>${talents.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "<p>暂无天赋记录。</p>"}
      </section>
      <section class="talent-section">
        <h4>私密备注</h4>
        <p>${escapeHtml(profile.privateNote || "暂无私密备注。")}</p>
      </section>
    </div>
    <div class="form-actions">
      <button class="btn btn--primary" type="button" data-export-card="private">导出私密图片</button>
      <button class="btn btn--ghost" type="button" data-export-card="private-public">导出公开图片</button>
    </div>
  `;
  $("[data-export-card='private']").addEventListener("click", () => exportPanelImage($("#privatePanel [data-card='private']"), `${profile.name}-私密面板`));
  $("[data-export-card='private-public']").addEventListener("click", () => {
    const clone = document.createElement("div");
    clone.className = "profile-card export-card";
    clone.innerHTML = `
      <div class="profile-card__top">
        <div>
          <h3>${escapeHtml(profile.name)}</h3>
          <p>${escapeHtml(profile.god)} · ${escapeHtml(profile.path)} · ${escapeHtml(profile.className || "未定身份")}</p>
        </div>
        <span class="badge">${totalScore(profile)}</span>
      </div>
      <p>${escapeHtml(profile.publicNote || "暂无公开短记。")}</p>
      ${scoreStrip(profile)}
    `;
    document.body.appendChild(clone);
    exportPanelImage(clone, `${profile.name}-公开面板`).finally(() => clone.remove());
  });
}

async function exportPanelImage(element, filename) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const scale = 2;
  const clone = element.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(rect.width * scale)}" height="${Math.ceil(rect.height * scale)}">
      <foreignObject width="100%" height="100%" transform="scale(${scale})">
        ${new XMLSerializer().serializeToString(clone)}
      </foreignObject>
    </svg>
  `;
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = url;
  }).catch(() => null);
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(rect.width * scale);
  canvas.height = Math.ceil(rect.height * scale);
  const context = canvas.getContext("2d");
  context.fillStyle = "#07100d";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);
  URL.revokeObjectURL(url);
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function renderSettlements(logs = state.settlements) {
  $("#settlementLog").innerHTML = logs.map((entry) => `
    <article class="log-item">
      <strong>${escapeHtml(entry.name || entry.target_name || "未知成员")}</strong>
      <p>登神分 ${Number(entry.ascensionDelta ?? entry.ascension_delta) >= 0 ? "+" : ""}${entry.ascensionDelta ?? entry.ascension_delta}，觐见分 +${entry.audienceDelta ?? entry.audience_delta}</p>
      <p>${escapeHtml(entry.reason || "无备注")}</p>
      <time>${new Date(entry.createdAt || entry.created_at).toLocaleString("zh-CN")}</time>
    </article>
  `).join("");
}

function clearAdminForm() {
  $("#adminProfileForm").reset();
  const selected = gods.find(([god]) => god === $("#godInput").value);
  $("#pathInput").value = selected?.[1] || "生命";
}

async function handleSecretSubmit(event) {
  event.preventDefault();
  const result = await callAction("verifySecret", {
    name: $("#secretName").value.trim(),
    phrase: $("#secretPhrase").value
  });
  if (result.error) return showToast(`验证失败：${result.error}`);
  renderPrivatePanel(result.data.profile);
  showToast("已进入你的私密面板");
}

async function handleAdminProfileSubmit(event) {
  event.preventDefault();
  const profile = {
    name: $("#nameInput").value.trim(),
    secretPhrase: $("#phraseInput").value,
    god: $("#godInput").value,
    path: $("#pathInput").value,
    className: $("#classInput").value.trim(),
    publicNote: $("#publicNoteInput").value.trim(),
    privateNote: $("#privateNoteInput").value.trim(),
    talents: normalizeTalents($("#talentsInput").value),
    isPublic: $("#publicInput").value === "true"
  };
  const result = await callAction("adminUpsertProfile", {
    adminKey: $("#adminKey").value,
    profile
  });
  if (result.error) return showToast(`保存失败：${result.error}`);
  showToast("档案已保存");
  await refreshPublicData();
}

async function handleScoreSubmit(event) {
  event.preventDefault();
  const profile = publicProfiles().find((item) => item.id === $("#scoreTarget").value);
  if (!profile) return showToast("请先建立档案");
  const result = await callAction("submitScore", {
    adminKey: $("#adminKey").value,
    profileId: profile.id,
    ascensionDelta: clampNumber($("#ascensionDelta").value, -20, 20),
    audienceDelta: clampNumber($("#audienceDelta").value, 0, 3),
    reason: $("#scoreReason").value.trim()
  });
  if (result.error) return showToast(`结算失败：${result.error}`);
  $("#scoreReason").value = "";
  $("#ascensionDelta").value = 0;
  $("#audienceDelta").value = 0;
  showToast("结算已提交");
  await refreshPublicData();
  await refreshScoreLogs();
}

async function refreshScoreLogs() {
  const adminKey = $("#adminKey").value;
  if (!adminKey && onlineEnabled) return;
  const result = await callAction("listScoreLogs", { adminKey });
  if (!result.error) renderSettlements(result.data.logs || []);
}

function showView(view) {
  const map = {
    leaderboard: "#leaderboardView",
    private: "#privateView",
    admin: "#adminView"
  };
  Object.values(map).forEach((selector) => $(selector).classList.remove("is-active"));
  $(map[view]).classList.add("is-active");
  $$("[data-view-link]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewLink === view);
  });
}

function renderAll() {
  renderLeaderboard();
  renderSettlements();
}

function bindEvents() {
  $$("[data-view-link]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.viewLink)));
  $$("[data-rank-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      rankMode = button.dataset.rankMode;
      $$("[data-rank-mode]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderLeaderboard();
    });
  });
  $("#leaderboardSearch").addEventListener("input", renderLeaderboard);
  $("#pathFilter").addEventListener("change", renderLeaderboard);
  $("#secretForm").addEventListener("submit", handleSecretSubmit);
  $("#adminProfileForm").addEventListener("submit", handleAdminProfileSubmit);
  $("#scoreForm").addEventListener("submit", handleScoreSubmit);
  $("#clearAdminFormButton").addEventListener("click", clearAdminForm);
  $("#refreshButton").addEventListener("click", async () => {
    await refreshPublicData();
    await refreshScoreLogs();
    showToast("已刷新");
  });
  $("#logoutButton").addEventListener("click", () => {
    currentPrivateProfile = null;
    $("#logoutButton").hidden = true;
    $("#secretForm").reset();
    $("#privatePanel").innerHTML = `
      <p class="eyebrow">My Dossier</p>
      <div class="avatar-orbit">希</div>
      <h3>等待暗语验证</h3>
      <p>排行榜只公开基础信息。验证后，这里会显示你的完整天赋和私密备注。</p>
    `;
    showToast("已退出私密面板");
  });
  $("#adminKey").addEventListener("change", refreshScoreLogs);
}

setupGodOptions();
bindEvents();
clearAdminForm();
refreshPublicData();
