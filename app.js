const storageKey = "hope_state_site_v3";

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

const pathByGod = Object.fromEntries(gods);

const baseClassRules = {
  战士: {
    baseHp: 115,
    baseAttack: 8,
    attackInterval: "1 轮",
    combatRule: "嘲讽吸引本轮所有攻击，本回合内获得 5 点护盾，CD 3 轮。"
  },
  刺客: {
    baseHp: 80,
    baseAttack: 10,
    attackInterval: "1 轮",
    combatRule: "背袭造成 18 点伤害，偷袭间隔 3 轮。普攻和背袭无法同时使用。"
  },
  法师: {
    baseHp: 80,
    baseAttack: 5,
    attackInterval: "1 轮",
    combatRule: "火球术召唤 3 个火球，每个对指定敌人造成 8 点伤害，CD 3 轮。火球和普攻无法同时使用。"
  },
  猎人: {
    baseHp: 80,
    baseAttack: 7,
    attackInterval: "1 轮",
    combatRule: "三段直接伤害：掷骰 1-2 造成 8 点，3-4 造成 12 点，5-6 造成 16 点。"
  },
  牧师: {
    baseHp: 105,
    baseAttack: 2,
    attackInterval: "1 轮",
    combatRule: "治疗术单体 +25 血，CD 3 轮；群体治疗所有友方 +10 血，和治疗术共用 CD。普攻和治疗无法同时发动。"
  },
  歌者: {
    baseHp: 90,
    baseAttack: 2,
    attackInterval: "1 轮",
    combatRule: "强化术为一名目标攻击 +8，持续 3 次，CD 4 轮；群体祝福为全队除自己外攻击 +3，持续 3 次，CD 4 轮。强化、祝福和普攻无法同时发动。"
  }
};

const fallbackProfessions = [
  { profession: "德鲁伊", faithGod: "繁荣", path: "生命", baseClass: "战士", featureText: "可以横跨多物种变换形体的尚战职业。" },
  { profession: "小丑", faithGod: "欺诈", path: "虚无", baseClass: "战士", featureText: "职业特性以职业资料库为准。" },
  { profession: "织命师", faithGod: "命运", path: "虚无", baseClass: "战士", featureText: "职业特性以职业资料库为准。" }
];

let state = loadState();
let rankMode = "total";
let currentPrivateProfile = null;
let currentPrivatePhrase = "";
let professionLibrary = fallbackProfessions;

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
        faithGod: "繁荣",
        god: "繁荣",
        path: "生命",
        profession: "德鲁伊",
        className: "德鲁伊",
        baseClass: "战士",
        featureText: "可以横跨多物种变换形体的尚战职业。",
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
  return String(value || "")
    .split(/\r?\n|；|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeProfessionName(value) {
  return String(value || "").trim().replace(/\s+/g, "");
}

function normalizeCollectedName(value) {
  const text = normalizeName(value);
  const parts = text.split(/[，,、/|]+/).map((item) => item.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : text;
}

function professionSearchKeys(value) {
  const normalized = normalizeProfessionName(value);
  const keys = new Set([normalized]);
  const bracketMatch = normalized.match(/[（(]([^（）()]+)[）)]/);
  if (bracketMatch?.[1]) keys.add(normalizeProfessionName(bracketMatch[1]));
  const withoutBracket = normalized.replace(/[（(].*?[）)]/g, "");
  if (withoutBracket) keys.add(withoutBracket);
  return [...keys].filter(Boolean);
}

function getFaithGod(profile) {
  return profile.faithGod || profile.faith_god || profile.god || "";
}

function getProfession(profile) {
  return profile.profession || profile.className || profile.class_name || "";
}

function getBaseClass(profile) {
  return profile.baseClass || profile.base_class || "";
}

function getFeatureText(profile) {
  return profile.featureText || profile.feature_text || "";
}

function getAscension(profile) {
  return Number(profile.ascension ?? profile.ascension_score ?? 1000);
}

function getAudience(profile) {
  return Number(profile.audience ?? profile.audience_score ?? 0);
}

function totalScore(profile) {
  return getAscension(profile) + getAudience(profile) * 10;
}

function publicProfiles() {
  return state.profiles;
}

function baseRuleFor(profile) {
  return baseClassRules[getBaseClass(profile)] || {
    baseHp: 0,
    baseAttack: 0,
    attackInterval: "未定",
    combatRule: "暂无职业技能说明。"
  };
}

function maxHp(profile) {
  const rule = baseRuleFor(profile);
  const bonus = Math.max(0, Math.floor((getAscension(profile) - 1000) / 100)) * 10;
  return Number(rule.baseHp || 0) + bonus;
}

function getTotalRank(profile) {
  const ranked = [...publicProfiles()].sort((a, b) => totalScore(b) - totalScore(a) || getAscension(b) - getAscension(a) || getAudience(b) - getAudience(a));
  return ranked.findIndex((item) => item.id === profile.id || item.name === profile.name) + 1;
}

function getPathRank(profile) {
  const ranked = publicProfiles()
    .filter((item) => item.path === profile.path)
    .sort((a, b) => totalScore(b) - totalScore(a) || getAscension(b) - getAscension(a) || getAudience(b) - getAudience(a));
  return ranked.findIndex((item) => item.id === profile.id || item.name === profile.name) + 1;
}

function getRankedProfiles() {
  return [...publicProfiles()].sort((a, b) => {
    if (rankMode === "ascension") return getAscension(b) - getAscension(a) || getAudience(b) - getAudience(a);
    if (rankMode === "audience") return getAudience(b) - getAudience(a) || getAscension(b) - getAscension(a);
    return totalScore(b) - totalScore(a) || getAscension(b) - getAscension(a) || getAudience(b) - getAudience(a);
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
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
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
  if (action === "listProfessions") return { professions: professionLibrary, baseClasses: baseClassRules };
  if (action === "listPublicProfiles") return { profiles: publicProfiles().map(toPublicProfile) };
  if (action === "getPublicProfile") {
    const profile = publicProfiles().find((item) => item.id === payload.id || item.name === payload.name);
    if (!profile) throw new Error("找不到公开档案");
    return { profile: toPublicProfile(profile) };
  }
  if (action === "verifySecret") {
    const name = normalizeName(payload.name);
    const phrase = String(payload.phrase || "");
    const profile = state.profiles.find((item) => item.name === name && item.secretPhrase === phrase);
    if (!profile) throw new Error("名字或暗语不正确");
    return { profile: toPrivateProfile(profile) };
  }
  if (action === "selfUpdateProfile") {
    const name = normalizeName(payload.name);
    const phrase = String(payload.phrase || "");
    const profile = state.profiles.find((item) => item.name === name && item.secretPhrase === phrase);
    if (!profile) throw new Error("名字或暗语不正确");
    const updates = payload.updates || {};
    if (String(updates.secretPhrase || "")) profile.secretPhrase = String(updates.secretPhrase);
    profile.publicNote = String(updates.publicNote ?? profile.publicNote ?? "").trim();
    profile.privateNote = String(updates.privateNote ?? profile.privateNote ?? "").trim();
    profile.talents = normalizeTalents(updates.talents ?? profile.talents);
    profile.isPublic = true;
    profile.updatedAt = new Date().toISOString();
    saveState();
    return { profile: toPrivateProfile(profile) };
  }
  if (action === "adminUpsertProfile") {
    const profile = payload.profile || {};
    const normalized = normalizeProfileInput(profile, true);
    upsertLocalProfile(normalized);
    return { profile: toPublicProfile(normalized) };
  }
  if (action === "adminBulkImportProfiles") {
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const imported = [];
    const errors = [];
    rows.forEach((row, index) => {
      try {
        const normalized = normalizeProfileInput(row, true);
        upsertLocalProfile(normalized);
        imported.push(toPublicProfile(normalized));
      } catch (error) {
        errors.push({ row: index + 2, name: row.name || row["昵称"] || "", error: error.message });
      }
    });
    return { imported, errors };
  }
  if (action === "submitScore") {
    const profile = state.profiles.find((item) => item.id === payload.profileId || item.name === payload.name);
    if (!profile) throw new Error("找不到结算对象");
    const ascensionDelta = clampNumber(payload.ascensionDelta, -20, 20);
    const audienceDelta = clampNumber(payload.audienceDelta, 0, 3);
    profile.ascension = Math.max(0, getAscension(profile) + ascensionDelta);
    profile.audience = Math.max(0, getAudience(profile) + audienceDelta);
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

function upsertLocalProfile(profile) {
  const existing = state.profiles.find((item) => item.name === profile.name);
  const next = {
    ...existing,
    ...profile,
    id: existing?.id || profile.id || crypto.randomUUID(),
    updatedAt: new Date().toISOString()
  };
  if (existing) Object.assign(existing, next);
  else state.profiles.push({ ...next, createdAt: new Date().toISOString() });
  saveState();
}

function findProfession(professionName) {
  const keys = professionSearchKeys(professionName);
  return professionLibrary.find((item) => keys.includes(normalizeProfessionName(item.profession)));
}

function normalizeProfileInput(profile, requireSecret) {
  const name = normalizeCollectedName(profile.name || profile["昵称"]);
  const profession = normalizeName(profile.profession || profile.className || profile["职业"]);
  const secretPhrase = String(profile.secretPhrase ?? profile["暗语"] ?? "");
  if (!name) throw new Error("缺少昵称");
  if (!profession) throw new Error("缺少职业");
  if (requireSecret && !secretPhrase) throw new Error("缺少暗语");
  const professionInfo = findProfession(profession);
  if (!professionInfo) throw new Error(`职业未匹配：${profession}`);
  return {
    id: profile.id,
    name,
    secretPhrase,
    faithGod: professionInfo.faithGod,
    god: professionInfo.faithGod,
    path: professionInfo.path,
    profession: professionInfo.profession,
    className: professionInfo.profession,
    baseClass: professionInfo.baseClass,
    featureText: professionInfo.featureText,
    publicNote: String(profile.publicNote ?? profile["公开短记"] ?? "").trim(),
    privateNote: String(profile.privateNote ?? profile["私密备注"] ?? "").trim(),
    talents: normalizeTalents(profile.talents ?? profile["天赋"] ?? ""),
    ascension: Number(profile.ascension ?? profile.ascensionScore ?? profile["登神分"] ?? 1000),
    audience: Number(profile.audience ?? profile.audienceScore ?? profile["觐见分"] ?? 0),
    isPublic: true
  };
}

function toPublicProfile(profile) {
  const profession = getProfession(profile);
  const info = findProfession(profession);
  const faithGod = getFaithGod(profile) || info?.faithGod || "";
  const baseClass = getBaseClass(profile) || info?.baseClass || "";
  return {
    id: profile.id,
    name: profile.name || profile.display_name,
    faithGod,
    god: faithGod,
    path: profile.path || info?.path || pathByGod[faithGod] || "",
    profession,
    className: profession,
    baseClass,
    featureText: getFeatureText(profile) || info?.featureText || "",
    publicNote: profile.publicNote || profile.public_note || "",
    ascension: getAscension(profile),
    audience: getAudience(profile),
    isPublic: true
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

async function loadProfessionLibrary() {
  const result = await callAction("listProfessions");
  if (!result.error && Array.isArray(result.data.professions) && result.data.professions.length) {
    professionLibrary = result.data.professions.map((item) => ({
      profession: item.profession,
      faithGod: item.faithGod || item.faith_god,
      path: item.path,
      baseClass: item.baseClass || item.base_class,
      featureText: item.featureText || item.feature_text || ""
    }));
  }
  $("#professionLibraryStatus").textContent = `职业资料库：${professionLibrary.length} 个职业。单人录入和批量导入会按职业名自动补信仰、命途、基础职业与职业特性。`;
  $("#professionOptions").innerHTML = professionLibrary
    .map((item) => `<option value="${escapeHtml(item.profession)}">${escapeHtml(item.faithGod)} · ${escapeHtml(item.path)} · ${escapeHtml(item.baseClass)}</option>`)
    .join("");
}

async function refreshPublicData() {
  const result = await callAction("listPublicProfiles");
  if (result.error) {
    showToast(`读取排行榜失败：${result.error}`);
    return;
  }
  state.profiles = (result.data.profiles || []).map((profile) => {
    const existing = state.profiles.find((item) => item.id === profile.id || item.name === profile.name);
    return { ...existing, ...toPublicProfile(profile), isPublic: true };
  });
  renderAll();
}

function filteredProfiles() {
  const search = $("#leaderboardSearch").value.trim().toLowerCase();
  const path = $("#pathFilter").value;
  return getRankedProfiles().filter((profile) => {
    const text = `${profile.name} ${getFaithGod(profile)} ${profile.path} ${getProfession(profile)} ${getBaseClass(profile)} ${profile.publicNote}`.toLowerCase();
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
        <span>${escapeHtml(getFaithGod(profile))} · ${escapeHtml(profile.path)} · ${escapeHtml(getProfession(profile) || "未定职业")}</span>
      </span>
      <span class="rank-metric"><span>命途</span><strong>${escapeHtml(profile.path || "未定")}</strong></span>
      <span class="rank-metric"><span>登神分</span><strong>${getAscension(profile)}</strong></span>
      <span class="rank-metric"><span>觐见分</span><strong>${getAudience(profile)}</strong></span>
      <span class="rank-metric"><span>总评</span><strong>${totalScore(profile)}</strong></span>
    </button>
  `).join("");
  $$("[data-public-id]").forEach((button) => button.addEventListener("click", () => openPublicPanel(button.dataset.publicId)));
  renderScoreTargets();
}

function renderScoreTargets() {
  const select = $("#scoreTarget");
  const current = select.value;
  select.innerHTML = publicProfiles().map((profile) => `<option value="${profile.id}">${escapeHtml(profile.name)} · ${escapeHtml(getFaithGod(profile))}</option>`).join("");
  if (publicProfiles().some((profile) => profile.id === current)) select.value = current;
}

async function openPublicPanel(id) {
  let profile = publicProfiles().find((item) => item.id === id);
  const result = await callAction("getPublicProfile", { id });
  if (!result.error && result.data.profile) profile = toPublicProfile(result.data.profile);
  if (!profile) return;
  $("#publicPanel").innerHTML = `
    <button class="modal__close" type="button" data-close-public aria-label="关闭">×</button>
    <p class="eyebrow">Public Combat Dossier</p>
    ${publicProfileCard(profile, "public")}
    <button class="btn btn--primary" type="button" data-export-card="public">导出公开图片</button>
  `;
  $("#publicModal").hidden = false;
  $("[data-export-card='public']").addEventListener("click", () => exportPanelImage($("#publicPanel .profile-card"), `${profile.name}-公开职业面板`));
  $$("[data-close-public]").forEach((item) => item.addEventListener("click", closePublicPanel));
}

function closePublicPanel() {
  $("#publicModal").hidden = true;
}

function profileStats(profile) {
  const rule = baseRuleFor(profile);
  return `
    <dl class="stat-grid">
      <div><dt>总榜排名</dt><dd>#${getTotalRank(profile) || "-"}</dd></div>
      <div><dt>命途排名</dt><dd>#${getPathRank(profile) || "-"}</dd></div>
      <div><dt>信仰神明</dt><dd>${escapeHtml(getFaithGod(profile) || "未定")}</dd></div>
      <div><dt>命途</dt><dd>${escapeHtml(profile.path || "未定")}</dd></div>
      <div><dt>职业</dt><dd>${escapeHtml(getProfession(profile) || "未定")}</dd></div>
      <div><dt>基础职业</dt><dd>${escapeHtml(getBaseClass(profile) || "未定")}</dd></div>
      <div><dt>血量</dt><dd>${maxHp(profile) || "-"}</dd></div>
      <div><dt>攻击</dt><dd>${rule.baseAttack || "-"}</dd></div>
      <div><dt>登神分</dt><dd>${getAscension(profile)}</dd></div>
      <div><dt>觐见分</dt><dd>${getAudience(profile)}</dd></div>
    </dl>
  `;
}

function publicProfileCard(profile, mode = "public") {
  const rule = baseRuleFor(profile);
  return `
    <div class="profile-card profile-card--modal ${mode === "private-public" ? "export-card-skin" : ""}" data-card="${mode}">
      <div class="profile-card__top">
        <div>
          <h3>${escapeHtml(profile.name)}</h3>
          <p>${escapeHtml(getFaithGod(profile) || "未定")} · ${escapeHtml(profile.path || "未定")} · ${escapeHtml(getProfession(profile) || "未定职业")}</p>
        </div>
        <span class="badge">总评 ${totalScore(profile)}</span>
      </div>
      ${profileStats(profile)}
      <section class="talent-section">
        <h4>公开短记</h4>
        <p>${escapeHtml(profile.publicNote || "暂无公开短记。")}</p>
      </section>
      <section class="talent-section">
        <h4>职业特性</h4>
        <p>${escapeHtml(getFeatureText(profile) || "暂无职业特性说明。")}</p>
      </section>
      <section class="talent-section">
        <h4>职业技能</h4>
        <p>${escapeHtml(rule.combatRule)}</p>
        <p class="form-note">攻击间隔：${escapeHtml(rule.attackInterval || "未定")}</p>
      </section>
    </div>
  `;
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
    <div class="private-card dossier-card__inner" data-card="private">
      <header class="dossier-head">
      <div class="avatar-orbit">${escapeHtml((profile.name || "希").slice(0, 1))}</div>
        <div>
          <p class="eyebrow">Private Dossier</p>
          <h3>${escapeHtml(profile.name)}</h3>
          <p>${escapeHtml(getFaithGod(profile) || "未定")} · ${escapeHtml(profile.path || "未定")} · ${escapeHtml(getProfession(profile) || "未定职业")}</p>
        </div>
      </header>
      <section class="dossier-section">
        <h4>圣榜排位</h4>
        <dl class="dossier-grid dossier-grid--four">
          <div><dt>总榜排名</dt><dd>#${getTotalRank(profile) || "-"}</dd></div>
          <div><dt>命途排名</dt><dd>#${getPathRank(profile) || "-"}</dd></div>
          <div><dt>信仰神明</dt><dd>${escapeHtml(getFaithGod(profile) || "未定")}</dd></div>
          <div><dt>命途</dt><dd>${escapeHtml(profile.path || "未定")}</dd></div>
        </dl>
      </section>
      <section class="dossier-section">
        <h4>职阶与试炼属性</h4>
        <dl class="dossier-grid dossier-grid--two">
          <div><dt>基础职业</dt><dd>${escapeHtml(getBaseClass(profile) || "未定")}</dd></div>
          <div><dt>职业</dt><dd>${escapeHtml(getProfession(profile) || "未定")}</dd></div>
          <div><dt>生命力</dt><dd>${maxHp(profile) || "-"}</dd></div>
          <div><dt>权柄伤害</dt><dd>${baseRuleFor(profile).baseAttack || "-"}</dd></div>
          <div><dt>试炼积分</dt><dd>${getAscension(profile)}</dd></div>
          <div><dt>信仰馈赐</dt><dd>${getAudience(profile)}</dd></div>
        </dl>
      </section>
      <section class="dossier-section dossier-section--talents">
        <h4>解锁权柄</h4>
        ${talents.length ? `<ul class="talent-list">${talents.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "<p>暂无天赋记录。</p>"}
      </section>
      <section class="dossier-section">
        <h4>个人祷注</h4>
        <p>${escapeHtml(profile.privateNote || "暂无私密备注。")}</p>
      </section>
      <section class="dossier-section dossier-section--rule">
        <h4>职业特性和职业技能</h4>
        <p>${escapeHtml(getFeatureText(profile) || "暂无职业特性说明。")}</p>
        <p>${escapeHtml(baseRuleFor(profile).combatRule)}</p>
      </section>
      <form class="self-edit-form" id="selfEditForm">
        <div>
          <p class="eyebrow">Self Edit</p>
          <h4>自助修改</h4>
        </div>
        <label>
          新暗语
          <input id="selfSecretPhrase" maxlength="80" type="text" placeholder="不修改暗语就留空">
        </label>
        <label>
          公开短记
          <textarea id="selfPublicNote" maxlength="160" rows="3">${escapeHtml(profile.publicNote || "")}</textarea>
        </label>
        <label>
          私密备注
          <textarea id="selfPrivateNote" maxlength="240" rows="3">${escapeHtml(profile.privateNote || "")}</textarea>
        </label>
        <label>
          天赋
          <textarea id="selfTalents" rows="5">${escapeHtml(talents.join("\n"))}</textarea>
        </label>
        <button class="btn btn--primary" type="submit">保存自助修改</button>
      </form>
      <footer class="dossier-actions">
        <button class="btn btn--primary" type="button" data-export-card="private">导出私密图片</button>
        <button class="btn btn--ghost" type="button" data-export-card="private-public">导出公开图片</button>
      </footer>
    </div>
  `;
  $("#selfEditForm").addEventListener("submit", handleSelfEditSubmit);
  $("[data-export-card='private']").addEventListener("click", () => exportPanelImage($("#privatePanel [data-card='private']"), `${profile.name}-私密面板`));
  $("[data-export-card='private-public']").addEventListener("click", () => {
    const clone = document.createElement("div");
    clone.className = "export-card";
    clone.innerHTML = publicProfileCard(profile, "private-public");
    document.body.appendChild(clone);
    exportPanelImage(clone.firstElementChild, `${profile.name}-公开职业面板`).finally(() => clone.remove());
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
  currentPrivatePhrase = $("#secretPhrase").value;
  const result = await callAction("verifySecret", {
    name: $("#secretName").value.trim(),
    phrase: currentPrivatePhrase
  });
  if (result.error) return showToast(`验证失败：${result.error}`);
  renderPrivatePanel(toPrivateProfile(result.data.profile));
  showToast("已进入你的私密面板");
}

async function handleSelfEditSubmit(event) {
  event.preventDefault();
  if (!currentPrivateProfile || !currentPrivatePhrase) return showToast("请先用暗语进入面板");
  const nextSecret = $("#selfSecretPhrase").value;
  const result = await callAction("selfUpdateProfile", {
    name: currentPrivateProfile.name,
    phrase: currentPrivatePhrase,
    updates: {
      secretPhrase: nextSecret,
      publicNote: $("#selfPublicNote").value.trim(),
      privateNote: $("#selfPrivateNote").value.trim(),
      talents: normalizeTalents($("#selfTalents").value)
    }
  });
  if (result.error) return showToast(`保存失败：${result.error}`);
  if (nextSecret) currentPrivatePhrase = nextSecret;
  $("#selfSecretPhrase").value = "";
  const profile = toPrivateProfile(result.data.profile);
  renderPrivatePanel(profile);
  await refreshPublicData();
  showToast("自助修改已保存");
}

async function handleAdminProfileSubmit(event) {
  event.preventDefault();
  const professionInfo = findProfession($("#classInput").value);
  if (!professionInfo) return showToast("职业未匹配，请先确认职业资料库中存在该职业");
  const profile = {
    name: $("#nameInput").value.trim(),
    secretPhrase: $("#phraseInput").value,
    profession: $("#classInput").value.trim(),
    publicNote: $("#publicNoteInput").value.trim(),
    privateNote: $("#privateNoteInput").value.trim(),
    talents: normalizeTalents($("#talentsInput").value),
    ascension: Math.max(0, Number($("#ascensionInput").value || 1000)),
    audience: Math.max(0, Number($("#audienceInput").value || 0)),
    isPublic: true
  };
  const result = await callAction("adminUpsertProfile", {
    adminKey: $("#adminKey").value.trim(),
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
    adminKey: $("#adminKey").value.trim(),
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
  const adminKey = $("#adminKey").value.trim();
  if (!adminKey && onlineEnabled) return;
  const result = await callAction("listScoreLogs", { adminKey });
  if (!result.error) renderSettlements(result.data.logs || []);
}

function parseDelimitedLine(line) {
  const delimiter = line.includes("\t") ? "\t" : ",";
  const cells = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function normalizeBulkHeader(header) {
  const compact = String(header || "").replace(/\s+/g, "");
  if (!compact) return "";
  if (compact.includes("昵称")) return "昵称";
  if (compact.includes("职业")) return "职业";
  if (compact.includes("暗语")) return "暗语";
  if (compact.includes("宣言")) return "公开短记";
  if (compact.includes("私密备注")) return "私密备注";
  if (compact.includes("天赋")) return "天赋";
  if (compact.includes("登神")) return "登神分";
  if (compact.includes("觐见")) return "觐见分";
  return compact;
}

const defaultBulkHeaders = ["昵称", "暗语", "职业", "登神分", "觐见分", "公开短记", "私密备注", "天赋"];

function hasBulkHeader(headers) {
  const required = ["昵称", "暗语", "职业"];
  return required.every((header) => headers.includes(header));
}

function rowFromCells(cells, headers = defaultBulkHeaders) {
  return Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] ?? ""]));
}

function findLooseProfessionIndex(tokens) {
  for (let index = 1; index < tokens.length; index += 1) {
    if (findProfession(tokens[index])) return index;
  }
  return -1;
}

function findLooseTalentStart(parts) {
  const gradeIndex = parts.findIndex((part) => /[A-FＳS]?级|[A-FＳS]\s*級/i.test(part));
  if (gradeIndex > 0) return gradeIndex - 1;
  if (gradeIndex === 0) return 0;
  const keywordIndex = parts.findIndex((part) => /天赋|权柄|流场|本意|祝福|庇护|骰|护符/.test(part));
  if (keywordIndex >= 0) return keywordIndex;
  return parts.length > 1 ? 1 : 0;
}

function parseLooseBulkLine(line) {
  const tokens = String(line || "").trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 5) throw new Error("这一行字段太少，请至少包含昵称、暗语、职业、登神分、觐见分");
  const professionIndex = findLooseProfessionIndex(tokens);
  if (professionIndex < 0) throw new Error("找不到可匹配的职业，请确认职业名在职业资料库中");
  const scoreIndexes = [];
  for (let index = professionIndex + 1; index < tokens.length; index += 1) {
    if (/^-?\d+$/.test(tokens[index])) scoreIndexes.push(index);
    if (scoreIndexes.length === 2) break;
  }
  if (scoreIndexes.length < 2) throw new Error("找不到登神分和觐见分，请在职业后填写两个数字");
  const [ascensionIndex, audienceIndex] = scoreIndexes;
  const publicNote = tokens[audienceIndex + 1] || "";
  const tail = tokens.slice(audienceIndex + 2);
  const talentStart = findLooseTalentStart(tail);
  return {
    "昵称": tokens[0],
    "暗语": tokens.slice(1, professionIndex).join(" "),
    "职业": tokens[professionIndex],
    "登神分": tokens[ascensionIndex],
    "觐见分": tokens[audienceIndex],
    "公开短记": publicNote,
    "私密备注": tail.slice(0, talentStart).join(" "),
    "天赋": tail.slice(talentStart).join(" ")
  };
}

function parseBulkDataLine(line, headers = defaultBulkHeaders) {
  const cells = parseDelimitedLine(line);
  if (cells.length > 1) return rowFromCells(cells, headers);
  return parseLooseBulkLine(line);
}

function parseBulkInput(text) {
  const lines = String(text || "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { rows: [], errors: [{ row: 1, error: "没有可导入内容" }] };
  const rawHeaders = parseDelimitedLine(lines[0]);
  const headers = rawHeaders.map(normalizeBulkHeader);
  const hasHeader = hasBulkHeader(headers);
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const activeHeaders = hasHeader ? headers : defaultBulkHeaders;
  const rows = [];
  const errors = [];
  dataLines.forEach((line, index) => {
    let row = {};
    try {
      row = parseBulkDataLine(line, activeHeaders);
      rows.push(normalizeProfileInput(row, true));
    } catch (error) {
      errors.push({ row: index + (hasHeader ? 2 : 1), name: row["昵称"] || "", error: error.message });
    }
  });
  return { rows, errors };
}

function renderBulkResult(result, imported = []) {
  const validCount = result.rows?.length || imported.length || 0;
  const errors = result.errors || [];
  $("#bulkImportResult").innerHTML = `
    <div class="form-note">有效行：${validCount}，错误：${errors.length}${imported.length ? `，已导入：${imported.length}` : ""}</div>
    ${errors.length ? `<ul>${errors.map((item) => `<li>第 ${item.row} 行：${escapeHtml(item.name ? `${item.name} - ` : "")}${escapeHtml(item.error)}</li>`).join("")}</ul>` : ""}
  `;
}

function handleBulkPreview() {
  const result = parseBulkInput($("#bulkImportInput").value);
  renderBulkResult(result);
}

async function handleBulkImport() {
  const parsed = parseBulkInput($("#bulkImportInput").value);
  if (parsed.errors.length) {
    renderBulkResult(parsed);
    return showToast("存在错误行，未导入");
  }
  const result = await callAction("adminBulkImportProfiles", {
    adminKey: $("#adminKey").value.trim(),
    rows: parsed.rows
  });
  if (result.error) return showToast(`批量导入失败：${result.error}`);
  renderBulkResult({ rows: parsed.rows, errors: result.data.errors || [] }, result.data.imported || []);
  showToast(`已导入 ${result.data.imported?.length || 0} 行`);
  await refreshPublicData();
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

function toggleSecretField(id) {
  const input = $(`#${id}`);
  const button = $(`[data-toggle-secret="${id}"]`);
  const hidden = input.classList.toggle("is-secret-hidden");
  if (id === "secretName") button.textContent = hidden ? "显露称谓" : "隐匿称谓";
  else button.textContent = hidden ? "显露暗语" : "隐匿暗语";
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
  $$("[data-toggle-secret]").forEach((button) => button.addEventListener("click", () => toggleSecretField(button.dataset.toggleSecret)));
  $("#leaderboardSearch").addEventListener("input", renderLeaderboard);
  $("#pathFilter").addEventListener("change", renderLeaderboard);
  $("#secretForm").addEventListener("submit", handleSecretSubmit);
  $("#adminProfileForm").addEventListener("submit", handleAdminProfileSubmit);
  $("#scoreForm").addEventListener("submit", handleScoreSubmit);
  $("#clearAdminFormButton").addEventListener("click", clearAdminForm);
  $("#bulkPreviewButton").addEventListener("click", handleBulkPreview);
  $("#bulkImportButton").addEventListener("click", handleBulkImport);
  $("#classInput").addEventListener("change", () => {
    const info = findProfession($("#classInput").value);
    if (!info) return;
    $("#godInput").value = info.faithGod;
    $("#pathInput").value = info.path;
  });
  $("#refreshButton").addEventListener("click", async () => {
    await loadProfessionLibrary();
    await refreshPublicData();
    await refreshScoreLogs();
    showToast("已刷新");
  });
  $("#logoutButton").addEventListener("click", () => {
    currentPrivateProfile = null;
    currentPrivatePhrase = "";
    $("#logoutButton").hidden = true;
    $("#secretForm").reset();
    $("#secretPhrase").classList.remove("is-secret-hidden");
    $("#secretName").classList.remove("is-secret-hidden");
    $("[data-toggle-secret='secretPhrase']").textContent = "隐匿暗语";
    $("[data-toggle-secret='secretName']").textContent = "隐匿称谓";
    $("#privatePanel").innerHTML = `
      <div class="dossier-head">
        <div class="avatar-orbit">希</div>
        <div>
          <p class="eyebrow">Faith Dossier</p>
          <h3>等待暗语验证</h3>
          <p>排行榜只公开基础信息。验证后，这里会显示你的完整天赋和私密备注。</p>
        </div>
      </div>
    `;
    showToast("已退出私密面板");
  });
  $("#adminKey").addEventListener("change", refreshScoreLogs);
}

async function boot() {
  setupGodOptions();
  bindEvents();
  clearAdminForm();
  await loadProfessionLibrary();
  await refreshPublicData();
}

boot();
