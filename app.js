const storageKey = "hope_state_site_v1";

const gods = [
  ["诞育", "生命"], ["繁荣", "生命"], ["死亡", "生命"],
  ["记忆", "存在"], ["时间", "存在"],
  ["秩序", "文明"], ["真理", "文明"], ["战争", "文明"],
  ["欺诈", "虚无"], ["命运", "虚无"],
  ["混乱", "混沌"], ["沉默", "混沌"], ["痴愚", "混沌"],
  ["污堕", "沉沦"], ["腐朽", "沉沦"], ["湮灭", "沉沦"]
];

let state = loadState();
let editingId = null;
let rankMode = "total";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (stored && Array.isArray(stored.profiles) && Array.isArray(stored.settlements)) return stored;
  } catch {}
  return {
    profiles: [
      {
        id: crypto.randomUUID(),
        name: "晨星守望者",
        god: "繁荣",
        path: "生命",
        className: "德鲁伊",
        note: "希望之州的档案样例，用于展示排行榜和结算流。",
        ascension: 1000,
        audience: 0,
        createdAt: new Date().toISOString()
      }
    ],
    settlements: []
  };
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
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
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function setupGodOptions() {
  const godInput = $("#godInput");
  godInput.innerHTML = gods.map(([god, path]) => `<option value="${god}" data-path="${path}">${god} · ${path}</option>`).join("");
  godInput.addEventListener("change", () => {
    const selected = gods.find(([god]) => god === godInput.value);
    if (selected) $("#pathInput").value = selected[1];
    updatePreview();
  });
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

function totalScore(profile) {
  return Number(profile.ascension || 0) + Number(profile.audience || 0) * 10;
}

function getRankedProfiles() {
  return [...state.profiles].sort((a, b) => {
    if (rankMode === "ascension") return b.ascension - a.ascension || b.audience - a.audience;
    if (rankMode === "audience") return b.audience - a.audience || b.ascension - a.ascension;
    return totalScore(b) - totalScore(a);
  });
}

function updatePreview() {
  const name = $("#nameInput").value.trim() || "尚未登记";
  const god = $("#godInput").value || "希望";
  const path = $("#pathInput").value || "命途";
  const className = $("#classInput").value.trim() || "未定身份";
  const existing = editingId ? state.profiles.find((item) => item.id === editingId) : null;
  $("#previewName").textContent = name;
  $("#previewMeta").textContent = `${god} · ${path} · ${className}`;
  $("#previewSigil").textContent = name === "尚未登记" ? "希" : name.slice(0, 1);
  $("#previewAscension").textContent = existing?.ascension ?? 1000;
  $("#previewAudience").textContent = existing?.audience ?? 0;
}

function renderProfiles() {
  const search = $("#profileSearch").value.trim().toLowerCase();
  const path = $("#pathFilter").value;
  const profiles = state.profiles.filter((profile) => {
    const text = `${profile.name} ${profile.god} ${profile.path} ${profile.className} ${profile.note}`.toLowerCase();
    return (!search || text.includes(search)) && (path === "all" || profile.path === path);
  });

  $("#totalProfiles").textContent = state.profiles.length;
  $("#profileList").innerHTML = profiles.map((profile) => `
    <article class="profile-card">
      <div class="profile-card__top">
        <div>
          <h4>${escapeHtml(profile.name)}</h4>
          <p>${escapeHtml(profile.god)} · ${escapeHtml(profile.path)} · ${escapeHtml(profile.className || "未定身份")}</p>
        </div>
        <span class="badge">${totalScore(profile)}</span>
      </div>
      <p>${escapeHtml(profile.note || "暂无短记。")}</p>
      <dl class="score-strip">
        <div><dt>登神分</dt><dd>${profile.ascension}</dd></div>
        <div><dt>觐见分</dt><dd>${profile.audience}</dd></div>
      </dl>
      <div class="card-actions">
        <button class="mini-btn" type="button" data-edit="${profile.id}">编辑</button>
        <button class="mini-btn mini-btn--danger" type="button" data-delete="${profile.id}">删除</button>
      </div>
    </article>
  `).join("");

  $$("[data-edit]").forEach((button) => button.addEventListener("click", () => editProfile(button.dataset.edit)));
  $$("[data-delete]").forEach((button) => button.addEventListener("click", () => deleteProfile(button.dataset.delete)));
  renderScoreTargets();
  renderLeaderboard();
}

function renderLeaderboard() {
  $("#leaderboardList").innerHTML = getRankedProfiles().map((profile, index) => `
    <article class="rank-row">
      <div class="rank-index">#${index + 1}</div>
      <div class="rank-name">
        <strong>${escapeHtml(profile.name)}</strong>
        <span>${escapeHtml(profile.god)} · ${escapeHtml(profile.path)} · ${escapeHtml(profile.className || "未定身份")}</span>
      </div>
      <div class="rank-metric"><span>总评</span><strong>${totalScore(profile)}</strong></div>
      <div class="rank-metric"><span>登神分</span><strong>${profile.ascension}</strong></div>
      <div class="rank-metric"><span>觐见分</span><strong>${profile.audience}</strong></div>
    </article>
  `).join("");
}

function renderScoreTargets() {
  const select = $("#scoreTarget");
  const current = select.value;
  select.innerHTML = state.profiles.map((profile) => `<option value="${profile.id}">${escapeHtml(profile.name)} · ${profile.god}</option>`).join("");
  if (state.profiles.some((profile) => profile.id === current)) select.value = current;
}

function renderSettlements() {
  $("#settlementLog").innerHTML = state.settlements.map((entry) => `
    <article class="log-item">
      <strong>${escapeHtml(entry.name)}</strong>
      <p>登神分 ${entry.ascensionDelta >= 0 ? "+" : ""}${entry.ascensionDelta}，觐见分 +${entry.audienceDelta}</p>
      <p>${escapeHtml(entry.reason || "无备注")}</p>
      <time>${new Date(entry.createdAt).toLocaleString("zh-CN")}</time>
    </article>
  `).join("");
}

function resetForm() {
  editingId = null;
  $("#profileForm").reset();
  $("#pathInput").value = gods.find(([god]) => god === $("#godInput").value)?.[1] || "生命";
  updatePreview();
}

function editProfile(id) {
  const profile = state.profiles.find((item) => item.id === id);
  if (!profile) return;
  editingId = id;
  $("#nameInput").value = profile.name;
  $("#godInput").value = profile.god;
  $("#pathInput").value = profile.path;
  $("#classInput").value = profile.className || "";
  $("#noteInput").value = profile.note || "";
  updatePreview();
  showView("profile");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteProfile(id) {
  const profile = state.profiles.find((item) => item.id === id);
  if (!profile) return;
  if (!confirm(`删除 ${profile.name} 的档案？`)) return;
  state.profiles = state.profiles.filter((item) => item.id !== id);
  state.settlements = state.settlements.filter((item) => item.profileId !== id);
  saveState();
  renderAll();
  resetForm();
  showToast("档案已删除");
}

function handleProfileSubmit(event) {
  event.preventDefault();
  const name = $("#nameInput").value.trim();
  if (!name) return showToast("请输入州民昵称");
  const payload = {
    name,
    god: $("#godInput").value,
    path: $("#pathInput").value,
    className: $("#classInput").value.trim(),
    note: $("#noteInput").value.trim()
  };
  if (editingId) {
    const profile = state.profiles.find((item) => item.id === editingId);
    Object.assign(profile, payload, { updatedAt: new Date().toISOString() });
    showToast("档案已更新");
  } else {
    state.profiles.push({
      id: crypto.randomUUID(),
      ...payload,
      ascension: 1000,
      audience: 0,
      createdAt: new Date().toISOString()
    });
    showToast("档案已保存");
  }
  saveState();
  renderAll();
  resetForm();
}

function handleScoreSubmit(event) {
  event.preventDefault();
  const profile = state.profiles.find((item) => item.id === $("#scoreTarget").value);
  if (!profile) return showToast("请先建立档案");
  const ascensionDelta = clampNumber($("#ascensionDelta").value, -20, 20);
  const audienceDelta = clampNumber($("#audienceDelta").value, 0, 3);
  profile.ascension = Math.max(0, Number(profile.ascension || 0) + ascensionDelta);
  profile.audience = Math.max(0, Number(profile.audience || 0) + audienceDelta);
  state.settlements.unshift({
    id: crypto.randomUUID(),
    profileId: profile.id,
    name: profile.name,
    ascensionDelta,
    audienceDelta,
    reason: $("#scoreReason").value.trim(),
    createdAt: new Date().toISOString()
  });
  $("#scoreReason").value = "";
  $("#ascensionDelta").value = 0;
  $("#audienceDelta").value = 0;
  saveState();
  renderAll();
  showToast("结算已提交");
}

function showView(view) {
  const map = {
    profile: "#profileView",
    leaderboard: "#leaderboardView",
    scoring: "#scoringView"
  };
  Object.values(map).forEach((selector) => $(selector).classList.remove("is-active"));
  $(map[view]).classList.add("is-active");
  $$("[data-view-link]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewLink === view);
  });
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hope-state-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const next = JSON.parse(reader.result);
      if (!Array.isArray(next.profiles) || !Array.isArray(next.settlements)) throw new Error("bad shape");
      state = next;
      saveState();
      renderAll();
      resetForm();
      showToast("数据已导入");
    } catch {
      showToast("导入失败，文件格式不正确");
    }
  };
  reader.readAsText(file, "utf-8");
}

function renderAll() {
  renderProfiles();
  renderLeaderboard();
  renderSettlements();
}

function bindEvents() {
  $$("[data-view-link]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.viewLink));
  });
  $$("[data-rank-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      rankMode = button.dataset.rankMode;
      $$("[data-rank-mode]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderLeaderboard();
    });
  });
  $("#profileForm").addEventListener("submit", handleProfileSubmit);
  $("#scoreForm").addEventListener("submit", handleScoreSubmit);
  $("#resetFormButton").addEventListener("click", resetForm);
  $("#exportButton").addEventListener("click", exportData);
  $("#importInput").addEventListener("change", (event) => importData(event.target.files?.[0]));
  $("#clearLogButton").addEventListener("click", () => {
    if (!confirm("清空全部结算记录？分数不会回滚。")) return;
    state.settlements = [];
    saveState();
    renderSettlements();
    showToast("结算记录已清空");
  });
  ["#nameInput", "#pathInput", "#classInput"].forEach((selector) => {
    $(selector).addEventListener("input", updatePreview);
  });
  $("#profileSearch").addEventListener("input", renderProfiles);
  $("#pathFilter").addEventListener("change", renderProfiles);
}

setupGodOptions();
bindEvents();
resetForm();
renderAll();
