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

const godThemeSlugs = {
  诞育: "birth",
  繁荣: "prosperity",
  死亡: "death",
  记忆: "memory",
  时间: "time",
  秩序: "order",
  真理: "truth",
  战争: "war",
  欺诈: "trickery",
  命运: "fate",
  混乱: "chaos",
  沉默: "silence",
  痴愚: "folly",
  污堕: "defilement",
  腐朽: "decay",
  湮灭: "annihilation"
};

// Each faith owns a material language as well as a palette. The mark is reused in
// the live dossier and exported card so a believer's identity remains recognizable.
const godThemeDetails = {
  诞育: { mark: "孵", relic: "芽", title: "初生圣匣", powerLabel: "创生权能" },
  繁荣: { mark: "蔓", relic: "冠", title: "常青冠庭", powerLabel: "繁茂权能" },
  死亡: { mark: "冥", relic: "烛", title: "静寂墓刻", powerLabel: "冥渡权能" },
  记忆: { mark: "匣", relic: "钥", title: "旧忆档案", powerLabel: "旧忆权能" },
  时间: { mark: "晷", relic: "晷", title: "环刻时轮", powerLabel: "时序权能" },
  秩序: { mark: "律", relic: "印", title: "律法圣格", powerLabel: "律令权能" },
  真理: { mark: "棱", relic: "镜", title: "折光真镜", powerLabel: "真知权能" },
  战争: { mark: "刃", relic: "旗", title: "战痕旌旗", powerLabel: "征伐权能" },
  欺诈: { mark: "面", relic: "骰", title: "倒影假面", powerLabel: "欺诈权能" },
  命运: { mark: "轮", relic: "星", title: "星盘命轮", powerLabel: "命数权能" },
  混乱: { mark: "裂", relic: "裂", title: "失序裂隙", powerLabel: "失序权能" },
  沉默: { mark: "止", relic: "碑", title: "无声碑界", powerLabel: "静默权能" },
  痴愚: { mark: "戏", relic: "铃", title: "错位戏台", powerLabel: "愚戏权能" },
  污堕: { mark: "蚀", relic: "蚀", title: "侵蚀圣龛", powerLabel: "侵蚀权能" },
  腐朽: { mark: "枯", relic: "枝", title: "朽木年轮", powerLabel: "衰败权能" },
  湮灭: { mark: "空", relic: "环", title: "坍缩虚阙", powerLabel: "湮灭权能" }
};

const neutralGodThemeDetail = { mark: "未", relic: "·", title: "未定卷宗", powerLabel: "权柄伤害" };

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
  { profession: "小丑", faithGod: "欺诈", path: "虚无", baseClass: "战士", featureText: "" },
  { profession: "受害者", faithGod: "欺诈", path: "虚无", baseClass: "刺客", featureText: "" },
  { profession: "驭兽师", faithGod: "欺诈", path: "虚无", baseClass: "猎人", featureText: "" },
  { profession: "魔术师", faithGod: "欺诈", path: "虚无", baseClass: "歌者", featureText: "" },
  { profession: "圣骑", faithGod: "命运", path: "虚无", baseClass: "战士", featureText: "每一轮队友受到伤害时可选择过去抵挡，自己和队友各承受一半伤害；3 轮只可抵挡一次。" },
  { profession: "今日勇士", faithGod: "命运", path: "虚无", baseClass: "战士", featureText: "" },
  { profession: "织命师", faithGod: "命运", path: "虚无", baseClass: "牧师", featureText: "" },
  { profession: "窃命之贼", faithGod: "命运", path: "虚无", baseClass: "刺客", featureText: "" },
  { profession: "终末之笔", faithGod: "命运", path: "虚无", baseClass: "猎人", featureText: "" },
  { profession: "预言家", faithGod: "命运", path: "虚无", baseClass: "歌者", featureText: "" },
  { profession: "编剧", faithGod: "命运", path: "虚无", baseClass: "法师", featureText: "" }
];

const specialProfessionStats = {
  圣骑: {
    hpLabel: "220（+50）",
    attackLabel: "7（+2）",
    combatRule: "格挡 8 分钟 CD。"
  }
};

let state = loadState();
let rankMode = "total";
let currentPrivateProfile = null;
let currentPrivatePhrase = "";
let secretSubmitInFlight = false;
let professionLibrary = fallbackProfessions;
// Add delegated operator names here when the settlement duty is handed over.
const adminPanelOperators = new Set(["无我"]);

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
        publicNote: "",
        privateNote: "",
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

function canAccessAdminPanel() {
  return Boolean(currentPrivateProfile && adminPanelOperators.has(normalizeName(currentPrivateProfile.name)));
}

function syncAdminPanelAccess() {
  const allowed = canAccessAdminPanel();
  $("#adminNavButton").hidden = !allowed;
  $("#adminOperatorMark").textContent = allowed ? normalizeName(currentPrivateProfile.name).slice(0, 1) : "司";
}

function normalizeTalents(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split(/\r?\n|；|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatTalentName(item) {
  const text = String(item || "").trim().replace(/^【|】$/g, "");
  return `【${escapeHtml(text)}】`;
}

function talentGrade(item) {
  const match = String(item || "").trim().match(/^([SABC])\s*(?:级)?\s*[·:：\-—]/i);
  return match ? match[1].toUpperCase() : "";
}

function renderTalentCabinet(talents, themeDetail) {
  if (!talents.length) return '<p class="talent-cabinet__empty"></p>';
  return `
    <ul class="talent-cabinet">
      ${talents.map((item, index) => `
        <li class="talent-seal" style="--talent-order:${index}">
          <span class="talent-seal__mark" aria-hidden="true">${themeDetail.relic}</span>
          ${talentGrade(item) ? `<span class="talent-seal__grade">${talentGrade(item)}级</span>` : ""}
          <span class="talent-seal__text">${formatTalentName(item)}</span>
        </li>
      `).join("")}
    </ul>
  `;
}

function scoreLogMatchesProfile(log, profile) {
  const logProfileId = String(log.profileId ?? log.profile_id ?? "");
  return logProfileId
    ? logProfileId === String(profile.id ?? "")
    : String(log.name ?? log.target_name ?? "") === String(profile.name ?? "");
}

function formatScoreDelta(value) {
  const number = Number(value || 0);
  return `${number >= 0 ? "+" : ""}${number}`;
}

function renderTrialChronicle(profile, logs = []) {
  const entries = logs.filter((item) => scoreLogMatchesProfile(item, profile)).slice(0, 8);
  if (!entries.length) return '<p class="trial-chronicle__empty">无试炼刻痕</p>';
  return `
    <ol class="trial-chronicle">
      ${entries.map((entry) => `
        <li>
          <span class="trial-chronicle__node" aria-hidden="true"></span>
          <div>
            <strong>登神 ${formatScoreDelta(entry.ascensionDelta ?? entry.ascension_delta)} · 觐见 ${formatScoreDelta(entry.audienceDelta ?? entry.audience_delta)}</strong>
            <p><span class="trial-chronicle__dungeon">副本</span>${escapeHtml(entry.reason || "未标注副本")}</p>
          </div>
          <time>${new Date(entry.createdAt || entry.created_at).toLocaleDateString("zh-CN")}</time>
        </li>
      `).join("")}
    </ol>
  `;
}

function highlightRuleNumbers(text) {
  return escapeHtml(text || "").replace(/([+-]?\d+(?:\.\d+)?%?)/g, '<span class="rule-number">$1</span>');
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
  normalized.split(/[，,、/|]+/).map(normalizeProfessionName).filter(Boolean).forEach((item) => keys.add(item));
  return [...keys].filter(Boolean);
}

function getFaithGod(profile) {
  return profile.faithGod || profile.faith_god || profile.god || "";
}

function godThemeClass(profile) {
  return `god-theme god-theme--${godThemeSlugs[getFaithGod(profile)] || "unbound"}`;
}

function godThemeDetail(profile) {
  return godThemeDetails[getFaithGod(profile)] || neutralGodThemeDetail;
}

function faithPowerLabel(profile) {
  return godThemeDetail(profile).powerLabel || "权柄伤害";
}

function applyFaithTheme(profile) {
  const themeClass = godThemeClass(profile);
  const slug = godThemeSlugs[getFaithGod(profile)] || "unbound";
  document.body.dataset.faithTheme = slug;
  $("#secretForm").className = `panel access-panel access-panel--sealed ${themeClass}`;
}

function clearFaithTheme() {
  delete document.body.dataset.faithTheme;
  $("#secretForm").className = "panel access-panel access-panel--sealed";
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
    combatRule: ""
  };
}

function specialStatsFor(profile) {
  return specialProfessionStats[getProfession(profile)] || null;
}

function combatRuleFor(profile) {
  return profile.combatRule || profile.combat_rule || specialStatsFor(profile)?.combatRule || baseRuleFor(profile).combatRule || "";
}

function attackFor(profile) {
  const special = specialStatsFor(profile);
  if (special?.attackLabel) return special.attackLabel;
  const attack = Number(profile.attack ?? profile.baseAttack ?? profile.base_attack);
  return Number.isFinite(attack) && attack > 0 ? attack : baseRuleFor(profile).baseAttack || 0;
}

function hpLabelFor(profile) {
  return specialStatsFor(profile)?.hpLabel || maxHp(profile) || "-";
}

function maxHp(profile) {
  const serverHp = Number(profile.hp ?? profile.maxHp ?? profile.max_hp);
  if (Number.isFinite(serverHp) && serverHp > 0) return serverHp;
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

function flashSealBreak() {
  document.body.classList.remove("is-seal-breaking");
  void document.body.offsetWidth;
  document.body.classList.add("is-seal-breaking");
  clearTimeout(flashSealBreak.timer);
  flashSealBreak.timer = setTimeout(() => document.body.classList.remove("is-seal-breaking"), 900);
}

function flashFaithAwakening() {
  document.body.classList.remove("is-faith-awakening");
  void document.body.offsetWidth;
  document.body.classList.add("is-faith-awakening");
  clearTimeout(flashFaithAwakening.timer);
  flashFaithAwakening.timer = setTimeout(() => document.body.classList.remove("is-faith-awakening"), 1300);
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
    const dungeonName = String(payload.dungeonName || "").trim();
    if (!dungeonName) throw new Error("请填写副本名称");
    const ascensionDelta = clampNumber(payload.ascensionDelta, -20, 20);
    const audienceDelta = clampNumber(payload.audienceDelta, -3, 3);
    profile.ascension = Math.max(0, getAscension(profile) + ascensionDelta);
    profile.audience = Math.max(0, getAudience(profile) + audienceDelta);
    state.settlements.unshift({
      id: crypto.randomUUID(),
      profileId: profile.id,
      name: profile.name,
      ascensionDelta,
      audienceDelta,
      reason: dungeonName,
      createdAt: new Date().toISOString()
    });
    saveState();
    return { ok: true };
  }
  if (action === "bulkSubmitScores") {
    const entries = Array.isArray(payload.entries) ? payload.entries : [];
    const dungeonName = String(payload.dungeonName || "").trim();
    if (!dungeonName) throw new Error("请填写副本名称");
    const applied = [];
    const errors = [];
    entries.forEach((entry, index) => {
      const profile = state.profiles.find((item) => item.id === entry.profileId || item.name === entry.name);
      if (!profile) {
        errors.push({ row: entry.row || index + 1, name: entry.name || "", error: "找不到结算对象" });
        return;
      }
      const ascensionDelta = clampNumber(entry.ascensionDelta, -20, 20);
      const audienceDelta = clampNumber(entry.audienceDelta, -3, 3);
      profile.ascension = Math.max(0, getAscension(profile) + ascensionDelta);
      profile.audience = Math.max(0, getAudience(profile) + audienceDelta);
      const log = {
        id: crypto.randomUUID(),
        profileId: profile.id,
        name: profile.name,
        ascensionDelta,
        audienceDelta,
        reason: dungeonName,
        createdAt: new Date().toISOString()
      };
      state.settlements.unshift(log);
      applied.push(log);
    });
    saveState();
    return { applied, errors };
  }
  if (action === "listScoreLogs") return { logs: state.settlements };
  if (action === "listMyScoreLogs") {
    const name = normalizeName(payload.name);
    const phrase = String(payload.phrase || "");
    const profile = state.profiles.find((item) => item.name === name && item.secretPhrase === phrase);
    if (!profile) throw new Error("名字或暗语不正确");
    return { logs: state.settlements.filter((log) => scoreLogMatchesProfile(log, profile)).slice(0, 8) };
  }
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
  return [...professionLibrary]
    .sort((left, right) => normalizeProfessionName(right.profession).length - normalizeProfessionName(left.profession).length)
    .find((item) => {
      const candidate = normalizeProfessionName(item.profession);
      return keys.some((key) => key === candidate || key.includes(candidate));
    });
}

const maxStoredScore = 2147483647;

function parseInitialProfileScore(value, label, fallback, required = false) {
  const raw = value ?? "";
  if (String(raw).trim() === "") {
    if (required) throw new Error(`缺少${label}`);
    return fallback;
  }
  const score = Number(raw);
  if (!Number.isInteger(score) || score < 0) throw new Error(`${label}必须是非负整数`);
  if (score > maxStoredScore) throw new Error(`${label}超过数据库上限 ${maxStoredScore}`);
  return score;
}

function normalizeProfileInput(profile, requireSecret, requireScores = false) {
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
    ascension: parseInitialProfileScore(profile.ascension ?? profile.ascensionScore ?? profile["登神分"], "登神分", 1000, requireScores),
    audience: parseInitialProfileScore(profile.audience ?? profile.audienceScore ?? profile["觐见分"], "觐见分", 0, requireScores),
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
    baseHp: Number(profile.baseHp ?? profile.base_hp ?? 0),
    hp: Number(profile.hp ?? profile.maxHp ?? profile.max_hp ?? 0),
    attack: Number(profile.attack ?? profile.baseAttack ?? profile.base_attack ?? 0),
    attackInterval: profile.attackInterval || profile.attack_interval || "",
    combatRule: profile.combatRule || profile.combat_rule || "",
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

function setupFaithFilter() {
  const filter = $("#faithFilter");
  filter.innerHTML = '<option value="all">全部神祇</option>' + gods
    .map(([god]) => `<option value="${god}">${god}</option>`)
    .join("");
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
  $("#professionLibraryStatus").textContent = `职业资料库：${professionLibrary.length}`;
  $("#professionOptions").innerHTML = professionLibrary
    .map((item) => `<option value="${escapeHtml(item.profession)}">${escapeHtml(item.faithGod)} · ${escapeHtml(item.path)} · ${escapeHtml(item.profession)} · ${escapeHtml(item.baseClass)}</option>`)
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
  const faithGod = $("#faithFilter").value;
  return getRankedProfiles().filter((profile) => {
    const text = `${profile.name} ${getFaithGod(profile)} ${profile.path} ${getProfession(profile)} ${getBaseClass(profile)} ${profile.publicNote}`.toLowerCase();
    return (!search || text.includes(search)) &&
      (path === "all" || profile.path === path) &&
      (faithGod === "all" || getFaithGod(profile) === faithGod);
  });
}

function renderFaithInfluence(allProfiles) {
  const activeFilter = $("#faithFilter").value;
  const maxCount = Math.max(1, ...gods.map(([god]) => allProfiles.filter((profile) => getFaithGod(profile) === god).length));
  $("#faithInfluence").innerHTML = `
    <header class="faith-influence__head">
      <p class="eyebrow">Divine Influence</p>
      <h3>诸神势力图</h3>
    </header>
    <div class="faith-influence__rail">
      ${gods.map(([god, path]) => {
        const members = allProfiles.filter((profile) => getFaithGod(profile) === god);
        const slug = godThemeSlugs[god] || "trickery";
        const detail = godThemeDetails[god] || godThemeDetails.欺诈;
        const percent = Math.max(8, Math.round((members.length / maxCount) * 100));
        return `
          <button class="faith-influence__cell god-theme god-theme--${slug} ${activeFilter === god ? "is-active" : ""}" type="button" data-faith-filter="${escapeHtml(god)}" ${members.length ? "" : "disabled"} style="--influence:${percent}%">
            <span class="faith-influence__sigil">${detail.relic}</span>
            <span class="faith-influence__god">${escapeHtml(god)}</span>
            <strong>${members.length}</strong>
            <small>${escapeHtml(path)}</small>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderLeaderboardObservatory(allProfiles, metric) {
  const ranked = getRankedProfiles();
  const highestAscension = [...allProfiles].sort((left, right) => getAscension(right) - getAscension(left))[0];
  const highestAudience = [...allProfiles].sort((left, right) => getAudience(right) - getAudience(left))[0];
  const pathCounts = ["生命", "存在", "文明", "虚无", "混沌", "沉沦"]
    .map((path) => ({ path, count: allProfiles.filter((profile) => profile.path === path).length }))
    .sort((left, right) => right.count - left.count);
  const leader = ranked[0];
  const leaderDetail = leader ? godThemeDetail(leader) : neutralGodThemeDetail;
  $("#leaderboardObservatory").innerHTML = `
    <div class="observatory-heading">
      <p class="eyebrow">Crown Observatory</p>
      <h3>圣榜观测台</h3>
    </div>
    ${leader ? `
      <button class="observatory-leader ${godThemeClass(leader)}" type="button" data-public-id="${leader.id}">
        <span class="observatory-leader__relic">${leaderDetail.relic}</span>
        <span><small>冠冕持有者</small><strong>${escapeHtml(leader.name)}</strong><em>${escapeHtml(getFaithGod(leader))} · ${metric(leader).value}</em></span>
      </button>
    ` : ""}
    <div class="observatory-stats">
      <div><span>在册信徒</span><strong>${allProfiles.length}</strong></div>
      <div><span>活跃神祇</span><strong>${new Set(allProfiles.map(getFaithGod).filter(Boolean)).size}</strong></div>
      <div><span>登神至高</span><strong>${highestAscension ? getAscension(highestAscension) : "-"}</strong><small>${escapeHtml(highestAscension?.name || "")}</small></div>
      <div><span>觐见至高</span><strong>${highestAudience ? getAudience(highestAudience) : "-"}</strong><small>${escapeHtml(highestAudience?.name || "")}</small></div>
      <div class="observatory-stats__path"><span>最盛命途</span><strong>${escapeHtml(pathCounts[0]?.path || "-")}</strong><small>${pathCounts[0]?.count || 0} 位</small></div>
    </div>
  `;
}

function renderPathCorridor(allProfiles) {
  const paths = ["生命", "存在", "文明", "虚无", "混沌", "沉沦"];
  const activePath = $("#pathFilter").value;
  const ranked = getRankedProfiles();
  $("#pathCorridor").innerHTML = `
    <header class="path-corridor__head">
      <p class="eyebrow">Path Concourse</p>
      <h3>命途回廊</h3>
    </header>
    <div class="path-corridor__gates">
      ${paths.map((path) => {
        const members = ranked.filter((profile) => profile.path === path);
        return `
          <button class="path-gate path-gate--${path} ${activePath === path ? "is-active" : ""}" type="button" data-path-filter="${path}">
            <span class="path-gate__title"><strong>${path}</strong><small>${members.length} 位</small></span>
            <span class="path-gate__faces">${members.slice(0, 3).map((profile) => `<i class="${godThemeClass(profile)}" title="${escapeHtml(profile.name)}">${escapeHtml((profile.name || "希").slice(0, 1))}</i>`).join("") || "<em>未启封</em>"}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderLeaderboard() {
  const profiles = filteredProfiles();
  const allProfiles = publicProfiles();
  const sealNumerals = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖", "拾"];
  const totalProfiles = publicProfiles().length;
  $("#totalProfiles").textContent = sealNumerals[totalProfiles] || totalProfiles;
  $("#dataModeLabel").textContent = "";
  const metric = (profile) => {
    if (rankMode === "ascension") return { label: "登神分", value: getAscension(profile) };
    if (rankMode === "audience") return { label: "觐见分", value: getAudience(profile) };
    return { label: "总评", value: totalScore(profile) };
  };
  renderLeaderboardObservatory(allProfiles, metric);
  renderFaithInfluence(allProfiles);
  renderPathCorridor(allProfiles);
  const podiumProfiles = profiles.slice(0, 3);
  const podiumOrder = [1, 0, 2];
  $("#leaderboardPodium").innerHTML = podiumOrder
    .filter((index) => podiumProfiles[index])
    .map((index) => {
      const profile = podiumProfiles[index];
      const score = metric(profile);
      const themeDetail = godThemeDetail(profile);
      return `
        <button class="podium-seat podium-seat--${index + 1} ${godThemeClass(profile)}" type="button" data-public-id="${profile.id}">
          <span class="podium-seat__crown" aria-hidden="true">${["冠", "冕", "环"][index]}</span>
          <span class="podium-seat__rank">${["壹", "贰", "叁"][index]}</span>
          <span class="podium-shrine" aria-hidden="true">
            <span class="podium-portrait">${escapeHtml((profile.name || "希").slice(0, 1))}</span>
            <span class="podium-relic">${themeDetail.relic}</span>
          </span>
          <span class="podium-seat__name">${escapeHtml(profile.name)}</span>
          <span class="podium-seat__identity">${escapeHtml(getFaithGod(profile))} · ${escapeHtml(getProfession(profile) || "未定职业")}</span>
          <span class="podium-total"><strong>${totalScore(profile)}</strong><small>总分</small></span>
          <span class="podium-score-breakdown" aria-label="分数明细">
            <span><small>登神分</small><b>${getAscension(profile)}</b></span>
            <span><small>觐见分</small><b>${getAudience(profile)}</b></span>
          </span>
        </button>
      `;
    }).join("");
  $("#leaderboardListHead").innerHTML = profiles.length > 3
    ? "<span>位次 / 信徒</span><span>命途</span><span>登神分</span><span>觐见分</span><span>总分</span>"
    : "";
  $("#leaderboardList").innerHTML = profiles.slice(3).map((profile, index) => `
    <button class="rank-row rank-row--button ${godThemeClass(profile)}" type="button" data-public-id="${profile.id}">
      <span class="rank-index">#${index + 4}</span>
      <span class="rank-name">
        <span class="rank-faith-avatar" aria-hidden="true"><b>${escapeHtml((profile.name || "希").slice(0, 1))}</b><i>${godThemeDetail(profile).relic}</i></span>
        <span class="rank-name__copy"><strong>${escapeHtml(profile.name)}</strong><span>${escapeHtml(getFaithGod(profile))} · ${escapeHtml(getProfession(profile) || "未定职业")}</span></span>
      </span>
      <span class="rank-metric"><span>命途</span><strong>${escapeHtml(profile.path || "未定")}</strong></span>
      <span class="rank-metric"><span>登神分</span><strong>${getAscension(profile)}</strong></span>
      <span class="rank-metric"><span>觐见分</span><strong>${getAudience(profile)}</strong></span>
      <span class="rank-metric rank-metric--total"><span>总分</span><strong>${totalScore(profile)}</strong></span>
    </button>
  `).join("");
  $$("[data-public-id]").forEach((button) => button.addEventListener("click", () => openPublicPanel(button.dataset.publicId)));
  $$('[data-faith-filter]').forEach((button) => button.addEventListener("click", () => {
    $("#faithFilter").value = button.dataset.faithFilter;
    renderLeaderboard();
  }));
  $$('[data-path-filter]').forEach((button) => button.addEventListener("click", () => {
    $("#pathFilter").value = button.dataset.pathFilter;
    renderLeaderboard();
  }));
  renderScoreTargets();
}

function renderScoreTargets() {
  const select = $("#scoreTarget");
  const options = $("#scoreTargetOptions");
  const current = select.value;
  select.innerHTML = publicProfiles().map((profile) => `<option value="${profile.id}">${escapeHtml(profile.name)} · ${escapeHtml(getFaithGod(profile))}</option>`).join("");
  options.innerHTML = publicProfiles().map((profile) => `<option value="${escapeHtml(profile.name)}" label="${escapeHtml(getFaithGod(profile))} · ${escapeHtml(getProfession(profile))}"></option>`).join("");
  if (publicProfiles().some((profile) => profile.id === current)) select.value = current;
  syncScoreTargetMatch();
}

function syncScoreTargetMatch() {
  const input = $("#scoreTargetName");
  const select = $("#scoreTarget");
  const match = $("#scoreTargetMatch");
  const query = normalizeName(input.value);
  if (!query) {
    select.value = "";
    match.textContent = "";
    match.className = "score-target-match";
    return null;
  }
  const profiles = publicProfiles();
  const exact = profiles.find((profile) => normalizeName(profile.name) === query);
  const candidates = exact ? [exact] : profiles.filter((profile) => normalizeName(profile.name).includes(query));
  if (candidates.length === 1) {
    const profile = candidates[0];
    select.value = profile.id;
    match.textContent = `已锁定：${profile.name} · ${getFaithGod(profile)} · ${getProfession(profile)}`;
    match.className = "score-target-match is-matched";
    return profile;
  }
  select.value = "";
  match.textContent = candidates.length ? `匹配到 ${candidates.length} 名信徒，请补全昵称` : "未找到匹配的信徒";
  match.className = "score-target-match is-unmatched";
  return null;
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
  $("[data-export-card='public']").addEventListener("click", (event) => runExportWithFeedback(event.currentTarget, () => exportPanelImage($("#publicPanel .profile-card"), `${profile.name}-公开职业面板`)));
  $$("[data-close-public]").forEach((item) => item.addEventListener("click", closePublicPanel));
}

function closePublicPanel() {
  $("#publicModal").hidden = true;
}

function profileStats(profile) {
  return `
    <dl class="stat-grid">
      <div><dt>总榜排名</dt><dd>#${getTotalRank(profile) || "-"}</dd></div>
      <div><dt>命途排名</dt><dd>#${getPathRank(profile) || "-"}</dd></div>
      <div><dt>信仰神明</dt><dd>${escapeHtml(getFaithGod(profile) || "未定")}</dd></div>
      <div><dt>命途</dt><dd>${escapeHtml(profile.path || "未定")}</dd></div>
      <div><dt>信徒职业</dt><dd>${escapeHtml(getProfession(profile) || "未定")}</dd></div>
      <div><dt>基础战斗职阶</dt><dd>${escapeHtml(getBaseClass(profile) || "未定")}</dd></div>
      <div><dt>血量</dt><dd>${escapeHtml(hpLabelFor(profile))}</dd></div>
      <div><dt>${escapeHtml(faithPowerLabel(profile))}</dt><dd>${escapeHtml(attackFor(profile))}</dd></div>
      <div><dt>登神分</dt><dd>${getAscension(profile)}</dd></div>
      <div><dt>觐见分</dt><dd>${getAudience(profile)}</dd></div>
    </dl>
  `;
}

function publicProfileCard(profile, mode = "public") {
  return `
    <div class="profile-card profile-card--modal ${godThemeClass(profile)} ${mode === "private-public" ? "export-card-skin" : ""}" data-card="${mode}" data-god="${escapeHtml(getFaithGod(profile) || "未定")}">
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
      <p>${escapeHtml(profile.publicNote || "")}</p>
      </section>
      <section class="talent-section">
        <h4>${escapeHtml(getProfession(profile) || "未定职业")}・职业权能</h4>
        <p>${escapeHtml(getFeatureText(profile) || "")}</p>
      </section>
      <section class="talent-section">
        <h4>${escapeHtml(getBaseClass(profile) || "未定")}・基础战斗规则</h4>
        <p>${escapeHtml(combatRuleFor(profile))}</p>
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
  syncAdminPanelAccess();
  $("#logoutButton").hidden = false;
  const talents = normalizeTalents(profile.talents);
  const faithGod = getFaithGod(profile);
  const themeClass = godThemeClass(profile);
  const themeDetail = godThemeDetail(profile);
  const pathLabel = profile.path || "未定";
  const profession = getProfession(profile) || "未定职业";
  const baseClass = getBaseClass(profile) || "未定";
  const ruleTitle = `${profession}・职业权能`;
  const combatRuleTitle = `${baseClass}・基础战斗规则`;
  applyFaithTheme(profile);
  const privatePanel = $("#privatePanel");
  privatePanel.className = `panel profile-preview profile-preview--wide dossier-card ${themeClass}`;
  privatePanel.dataset.god = faithGod || "未定";
  privatePanel.innerHTML = `
    <div class="private-card dossier-card__inner ${themeClass}" data-card="private" data-god="${escapeHtml(faithGod || "未定")}">
      <header class="dossier-head">
      <div class="avatar-orbit"><span class="avatar-core"><span>${escapeHtml((profile.name || "希").slice(0, 1))}</span></span></div>
        <div>
          <p class="eyebrow">Believer Dossier</p>
          <h3>${escapeHtml(profile.name)}</h3>
          <p>${escapeHtml(faithGod || "未定")} · ${escapeHtml(pathLabel)} · ${escapeHtml(profession)}</p>
          <div class="dossier-tags"><span>${escapeHtml(profile.path || "未定命途")}</span><span>${escapeHtml(faithGod || "未定神祇")}</span><span>试炼卷宗</span></div>
        </div>
        <span class="dossier-god-mark" aria-label="${escapeHtml(themeDetail.title)}" title="${escapeHtml(themeDetail.title)}">${themeDetail.mark}</span>
        <span class="dossier-relic" aria-hidden="true"><span>${themeDetail.relic}</span></span>
      </header>
      <section class="dossier-section">
        <h4>诸神圣榜位次</h4>
        <dl class="dossier-grid dossier-grid--four">
          <div><dt>全洲试炼位次</dt><dd>#${getTotalRank(profile) || "-"}</dd></div>
          <div><dt>${escapeHtml(pathLabel)}命途位次</dt><dd>#${getPathRank(profile) || "-"}</dd></div>
          <div><dt>侍奉神祇</dt><dd>${escapeHtml(getFaithGod(profile) || "未定")}</dd></div>
          <div><dt>本源命途</dt><dd>${escapeHtml(profile.path || "未定")}</dd></div>
        </dl>
      </section>
      <section class="dossier-section">
        <h4>职阶试炼本源</h4>
        <dl class="dossier-grid dossier-grid--two">
          <div><dt>基础战斗职阶</dt><dd>${escapeHtml(baseClass)}</dd></div>
          <div><dt>信徒职业</dt><dd>${escapeHtml(profession)}</dd></div>
          <div><dt>本源生机</dt><dd>${escapeHtml(hpLabelFor(profile))}</dd></div>
          <div><dt>${escapeHtml(faithPowerLabel(profile))}</dt><dd>${attackFor(profile) || "-"}</dd></div>
          <div><dt>试炼馈赐点数</dt><dd>${getAscension(profile)}</dd></div>
          <div><dt>神祇馈赐</dt><dd>${getAudience(profile)}</dd></div>
        </dl>
      </section>
      <section class="dossier-section dossier-section--talents">
        <h4>已解锁权能</h4>
        ${renderTalentCabinet(talents, themeDetail)}
      </section>
      <section class="dossier-section dossier-section--chronicle">
        <h4>试炼年表</h4>
        <div class="trial-chronicle-wrap" data-trial-chronicle>${renderTrialChronicle(profile, state.settlements)}</div>
      </section>
      <section class="dossier-section dossier-section--prayer">
        <h4>信徒私祷</h4>
        <p>${escapeHtml(profile.privateNote || "")}</p>
      </section>
      <section class="dossier-section dossier-section--rule">
        <h4>${escapeHtml(ruleTitle)}</h4>
        <p>${highlightRuleNumbers(getFeatureText(profile) || "")}</p>
        <h5 class="dossier-rule-subtitle">${escapeHtml(combatRuleTitle)}</h5>
        <p>${highlightRuleNumbers(combatRuleFor(profile))}</p>
      </section>
      <form class="self-edit-form dossier-edit-zone" id="selfEditForm">
        <div>
          <h4>卷宗自缮区</h4>
        </div>
        <label>
          全新封印暗契
          <input id="selfSecretPhrase" maxlength="80" type="text">
        </label>
        <label class="self-edit-textarea">
          对外公示祷言
          <textarea id="selfPublicNote" maxlength="160" rows="3">${escapeHtml(profile.publicNote || "")}</textarea>
        </label>
        <label class="self-edit-textarea">
          信徒私藏祷语
          <textarea id="selfPrivateNote" maxlength="240" rows="3">${escapeHtml(profile.privateNote || "")}</textarea>
        </label>
        <label class="self-edit-textarea">
          权能缮写栏
          <textarea id="selfTalents" rows="12" maxlength="4800" placeholder="S级：权能名称与完整说明&#10;A级：权能名称与完整说明&#10;B级：权能名称与完整说明&#10;C级：权能名称与完整说明">${escapeHtml(talents.join("\n"))}</textarea>
        </label>
        <button class="btn btn--primary self-edit-submit" type="submit">保存自助修改</button>
      </form>
      <footer class="dossier-actions">
        <button class="btn btn--primary dossier-export-primary" type="button" data-export-card="private">封存完整卷宗图</button>
        <button class="btn btn--ghost dossier-export-secondary" type="button" data-export-card="private-public">生成公示圣榜图</button>
      </footer>
    </div>
  `;
  bindGuardedForm("#selfEditForm", "保存中...", handleSelfEditSubmit);
  $("[data-export-card='private']").addEventListener("click", (event) => runExportWithFeedback(event.currentTarget, () => exportPanelImage($("#privatePanel [data-card='private']"), `${profile.name}-私密面板`)));
  $("[data-export-card='private-public']").addEventListener("click", (event) => runExportWithFeedback(event.currentTarget, async () => {
    const clone = document.createElement("div");
    clone.className = "export-card";
    clone.innerHTML = publicProfileCard(profile, "private-public");
    document.body.appendChild(clone);
    try {
      await exportPanelImage(clone.firstElementChild, `${profile.name}-公开职业面板`);
    } finally {
      clone.remove();
    }
  }));
  refreshPrivateChronicle(profile);
}

function inlineComputedStyles(source, target) {
  const sourceNodes = [source, ...source.querySelectorAll("*")];
  const targetNodes = [target, ...target.querySelectorAll("*")];
  sourceNodes.forEach((node, index) => {
    const computed = getComputedStyle(node);
    const targetNode = targetNodes[index];
    for (const property of computed) {
      targetNode.style.setProperty(property, computed.getPropertyValue(property), computed.getPropertyPriority(property));
    }
  });
}

async function runExportWithFeedback(button, exportTask) {
  if (!button) return;
  if (button.dataset.actionBusy === "true" || button.disabled) {
    showToast("操作处理中，请勿重复点击");
    return;
  }
  const originalLabel = button.dataset.exportLabel || button.textContent.trim();
  button.dataset.exportLabel = originalLabel;
  button.dataset.actionBusy = "true";
  button.setAttribute("aria-busy", "true");
  button.disabled = true;
  button.classList.add("is-exporting");
  button.textContent = "生成中...";
  try {
    await exportTask();
    button.textContent = "已生成";
    showToast("图片已导出");
  } catch (error) {
    console.error("导出图片失败", error);
    button.textContent = "生成失败";
    showToast("图片生成失败，请重试");
  } finally {
    setTimeout(() => {
      button.disabled = false;
      button.classList.remove("is-exporting");
      delete button.dataset.actionBusy;
      button.setAttribute("aria-busy", "false");
      button.textContent = originalLabel;
    }, 1100);
  }
}

async function runGuardedAction(button, pendingLabel, action) {
  if (!button) return action();
  if (button.dataset.actionBusy === "true") {
    showToast("操作处理中，请勿重复点击");
    return;
  }
  const originalLabel = button.dataset.actionLabel || button.textContent.trim();
  button.dataset.actionLabel = originalLabel;
  button.dataset.actionBusy = "true";
  button.disabled = true;
  button.classList.add("is-action-busy");
  button.setAttribute("aria-busy", "true");
  button.textContent = pendingLabel;
  try {
    return await action();
  } catch (error) {
    console.error("按钮操作失败", error);
    showToast("操作失败，请重试");
  } finally {
    button.disabled = false;
    button.classList.remove("is-action-busy");
    delete button.dataset.actionBusy;
    button.setAttribute("aria-busy", "false");
    button.textContent = originalLabel;
  }
}

function bindGuardedForm(selector, pendingLabel, handler) {
  const form = $(selector);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const button = event.submitter || form.querySelector("button[type='submit']");
    void runGuardedAction(button, pendingLabel, () => handler(event));
  });
}

function bindGuardedButton(selector, pendingLabel, handler) {
  const button = $(selector);
  button.addEventListener("click", (event) => {
    void runGuardedAction(event.currentTarget, pendingLabel, () => handler(event));
  });
}

function installTransientButtonGuard() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.actionBusy === "true" || button.dataset.clickGuarded === "true") {
      event.preventDefault();
      event.stopImmediatePropagation();
      showToast("操作处理中，请勿重复点击");
      return;
    }
    button.dataset.clickGuarded = "true";
    button.classList.add("is-click-guarded");
    setTimeout(() => {
      delete button.dataset.clickGuarded;
      button.classList.remove("is-click-guarded");
    }, 650);
  }, true);
}

async function downloadCanvasImage(canvas, filename) {
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("图片编码失败"));
    }, "image/png");
  });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = objectUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
}

function wrapCanvasText(context, text, maxWidth) {
  const lines = [];
  let line = "";
  for (const character of String(text || "")) {
    if (character === "\n") {
      lines.push(line || " ");
      line = "";
      continue;
    }
    const candidate = `${line}${character}`;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = character;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [" "];
}

const exportFaithPalettes = {
  诞育: ["#244835", "#78b77c", "#ffe3b8"], 繁荣: ["#253b20", "#b9df69", "#f3dc75"],
  死亡: ["#1e2c2a", "#c5d0c6", "#f0efd9"], 记忆: ["#222943", "#a99be8", "#d6cfff"],
  时间: ["#14232f", "#6ea3aa", "#e2e5c8"], 秩序: ["#1c2b40", "#9fc2e8", "#e4edf5"],
  真理: ["#12363c", "#70dade", "#ffeda6"], 战争: ["#401f22", "#f36b4c", "#ffcc7e"],
  欺诈: ["#342344", "#e290e0", "#75e1c4"], 命运: ["#2f2847", "#d8bb66", "#f0da88"],
  混乱: ["#3e2923", "#ffb25d", "#55ddc2"], 沉默: ["#243135", "#b8c5c2", "#e3eadc"],
  痴愚: ["#44283a", "#e8649c", "#ffdc78"], 污堕: ["#283622", "#b1c754", "#e2d879"],
  腐朽: ["#392c1c", "#d3a357", "#ecd09a"], 湮灭: ["#122f32", "#97d9d6", "#d9f1ee"],
  未定: ["#17302b", "#c8b278", "#eae0bc"]
};

function roundedCanvasRect(context, x, y, width, height, radius) {
  const corner = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + corner, y);
  context.arcTo(x + width, y, x + width, y + height, corner);
  context.arcTo(x + width, y + height, x, y + height, corner);
  context.arcTo(x, y + height, x, y, corner);
  context.arcTo(x, y, x + width, y, corner);
  context.closePath();
}

function exportDossierSections(element) {
  const sections = [...element.querySelectorAll(".dossier-section")].map((section) => {
    const title = section.querySelector("h4")?.textContent.trim() || "卷宗记录";
    const entries = [...section.querySelectorAll("dl > div")].map((entry) => ({
      label: entry.querySelector("dt")?.textContent.trim() || "",
      value: entry.querySelector("dd")?.textContent.trim() || "-"
    })).filter((entry) => entry.label || entry.value);
    const prose = [...section.querySelectorAll("p, .talent-seal, .trial-chronicle__item")]
      .map((node) => node.textContent.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    return { title, entries, prose };
  });
  if (sections.length) return sections;
  const entries = [...element.querySelectorAll(".stat-grid > div")].map((entry) => ({
    label: entry.querySelector("dt")?.textContent.trim() || "",
    value: entry.querySelector("dd")?.textContent.trim() || "-"
  })).filter((entry) => entry.label || entry.value);
  const publicSections = [...element.querySelectorAll(".talent-section")].map((section) => ({
    title: section.querySelector("h4")?.textContent.trim() || "卷宗记录",
    entries: [],
    prose: [...section.querySelectorAll("p")].map((node) => node.textContent.replace(/\s+/g, " ").trim()).filter(Boolean)
  }));
  return [{ title: "圣榜与职阶", entries, prose: [] }, ...publicSections];
}

function drawExportFaithMotif(context, faith, x, y, size, accent, highlight) {
  context.save();
  context.translate(x, y);
  context.strokeStyle = accent;
  context.fillStyle = highlight;
  context.globalAlpha = .58;
  context.lineWidth = 3;
  if (["时间", "命运", "湮灭"].includes(faith)) {
    context.beginPath(); context.arc(0, 0, size, 0, Math.PI * 2); context.stroke();
    context.beginPath(); context.arc(0, 0, size * .64, 0, Math.PI * 2); context.stroke();
    for (let index = 0; index < 12; index += 1) {
      const angle = index * Math.PI / 6;
      context.beginPath(); context.moveTo(Math.cos(angle) * size * .74, Math.sin(angle) * size * .74); context.lineTo(Math.cos(angle) * size, Math.sin(angle) * size); context.stroke();
    }
  } else if (faith === "欺诈") {
    context.rotate(-.16); roundedCanvasRect(context, -size * .66, -size * .66, size * 1.32, size * 1.32, 16); context.stroke();
    [[-.28, -.28], [.28, -.28], [0, 0], [-.28, .28], [.28, .28]].forEach(([dx, dy]) => { context.beginPath(); context.arc(dx * size * 2, dy * size * 2, 8, 0, Math.PI * 2); context.fill(); });
  } else if (faith === "真理") {
    context.beginPath(); context.moveTo(0, -size); context.lineTo(size, 0); context.lineTo(0, size); context.lineTo(-size, 0); context.closePath(); context.stroke();
    context.beginPath(); context.moveTo(0, -size); context.lineTo(0, size); context.moveTo(-size, 0); context.lineTo(size, 0); context.stroke();
  } else if (faith === "战争") {
    context.beginPath(); context.moveTo(-size, -size); context.lineTo(size, size); context.moveTo(size, -size); context.lineTo(-size, size); context.stroke();
  } else {
    context.beginPath(); context.arc(0, 0, size, 0, Math.PI * 2); context.stroke();
    context.beginPath(); context.moveTo(-size, 0); context.lineTo(size, 0); context.moveTo(0, -size); context.lineTo(0, size); context.stroke();
  }
  context.restore();
}

function renderPortableDossierCanvas(element, filename) {
  const faith = element.dataset.god || "未定";
  const [deep, accent, highlight] = exportFaithPalettes[faith] || exportFaithPalettes.未定;
  const detail = godThemeDetails[faith] || neutralGodThemeDetail;
  const name = element.querySelector("h3, h4")?.textContent.trim() || filename.replace(/-(?:私密面板|公开职业面板)$/, "");
  const identity = element.querySelector(".dossier-head > div:nth-child(2) > p:not(.eyebrow), .profile-card__top p")?.textContent.trim() || faith;
  const sections = exportDossierSections(element);
  const width = 1400;
  const padding = 72;
  const contentWidth = width - padding * 2;
  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");
  if (!measureContext) throw new Error("无法创建图片画布");
  measureContext.font = "28px 'Microsoft YaHei', sans-serif";
  const plannedSections = sections.map((section) => ({
    ...section,
    proseLines: section.prose.flatMap((line) => wrapCanvasText(measureContext, line, contentWidth - 58))
  }));
  const sectionHeights = plannedSections.map((section) => 92 + (section.entries.length ? Math.ceil(section.entries.length / 2) * 124 + 28 : 0) + section.proseLines.length * 44 + (section.proseLines.length ? 34 : 0));
  const height = Math.min(16384, Math.max(1120, 470 + sectionHeights.reduce((total, value) => total + value + 34, 0) + 100));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("无法创建图片画布");

  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, deep); background.addColorStop(.56, "#091716"); background.addColorStop(1, deep);
  context.fillStyle = background; context.fillRect(0, 0, width, height);
  context.globalAlpha = .13; context.strokeStyle = accent; context.lineWidth = 1;
  for (let x = -height; x < width; x += 82) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x + height, height); context.stroke(); }
  context.globalAlpha = 1;
  context.strokeStyle = accent; context.lineWidth = 3; roundedCanvasRect(context, 26, 26, width - 52, height - 52, 28); context.stroke();
  context.globalAlpha = .5; context.lineWidth = 1; roundedCanvasRect(context, 42, 42, width - 84, height - 84, 20); context.stroke(); context.globalAlpha = 1;

  const header = context.createLinearGradient(padding, 0, width - padding, 0);
  header.addColorStop(0, deep); header.addColorStop(.52, accent); header.addColorStop(1, deep);
  context.globalAlpha = .25; context.fillStyle = header; roundedCanvasRect(context, padding, 72, contentWidth, 300, 22); context.fill(); context.globalAlpha = 1;
  drawExportFaithMotif(context, faith, width - 185, 210, 94, accent, highlight);
  context.fillStyle = accent; context.font = "24px Georgia, 'Microsoft YaHei', serif"; context.fillText("BELIEVER DOSSIER · 希望之洲", padding + 34, 128);
  context.fillStyle = highlight; context.font = "bold 64px Georgia, 'Microsoft YaHei', serif"; context.fillText(name, padding + 34, 218);
  context.fillStyle = "#edf0e3"; context.font = "30px 'Microsoft YaHei', sans-serif"; wrapCanvasText(context, identity, contentWidth - 300).slice(0, 2).forEach((line, index) => context.fillText(line, padding + 34, 274 + index * 42));
  context.globalAlpha = .36; context.fillStyle = accent; context.font = "bold 132px Georgia, 'Microsoft YaHei', serif"; context.fillText(detail.mark, width - 360, 344); context.globalAlpha = 1;
  context.fillStyle = highlight; context.font = "30px 'Microsoft YaHei', sans-serif"; context.fillText(detail.title, padding + 34, 340);

  let y = 410;
  for (let index = 0; index < plannedSections.length; index += 1) {
    const section = plannedSections[index];
    if (y > height - 120) break;
    const sectionHeight = sectionHeights[index];
    context.globalAlpha = .32; context.fillStyle = "#071412"; roundedCanvasRect(context, padding, y, contentWidth, sectionHeight, 16); context.fill(); context.globalAlpha = 1;
    context.fillStyle = highlight; context.font = "bold 34px Georgia, 'Microsoft YaHei', serif"; context.fillText(section.title, padding + 28, y + 52);
    context.strokeStyle = accent; context.globalAlpha = .62; context.beginPath(); context.moveTo(padding + 30, y + 70); context.lineTo(width - padding - 30, y + 70); context.stroke(); context.globalAlpha = 1;
    let contentY = y + 98;
    if (section.entries.length) {
      const cellWidth = (contentWidth - 56) / 2;
      section.entries.forEach((entry, entryIndex) => {
        const col = entryIndex % 2; const row = Math.floor(entryIndex / 2); const cellX = padding + 28 + col * cellWidth; const cellY = contentY + row * 124;
        context.globalAlpha = .14; context.fillStyle = accent; roundedCanvasRect(context, cellX, cellY, cellWidth - 12, 106, 10); context.fill(); context.globalAlpha = 1;
        context.fillStyle = "#cbd4cf"; context.font = "24px 'Microsoft YaHei', sans-serif"; context.fillText(entry.label, cellX + 20, cellY + 36);
        context.fillStyle = highlight; context.font = "bold 34px 'Microsoft YaHei', sans-serif"; const valueLines = wrapCanvasText(context, entry.value, cellWidth - 52).slice(0, 2); valueLines.forEach((line, lineIndex) => context.fillText(line, cellX + 20, cellY + 78 + lineIndex * 30));
      });
      contentY += Math.ceil(section.entries.length / 2) * 124 + 16;
    }
    context.fillStyle = "#e8ece2"; context.font = "28px 'Microsoft YaHei', sans-serif";
    section.proseLines.forEach((line) => { if (contentY < y + sectionHeight - 22) { context.fillText(line, padding + 30, contentY + 28); contentY += 44; } });
    y += sectionHeight + 34;
  }
  context.fillStyle = accent; context.font = "22px 'Microsoft YaHei', sans-serif"; context.fillText("希望之洲・神民档案室 · 封存卷宗", padding, height - 64);
  context.fillStyle = highlight; context.font = "bold 30px Georgia, 'Microsoft YaHei', serif"; context.fillText(detail.relic, width - padding - 30, height - 60);
  return canvas;
}

async function renderForeignObjectCanvas(element, rect, scale) {
  const clone = element.cloneNode(true);
  inlineComputedStyles(element, clone);
  clone.style.width = `${Math.ceil(rect.width)}px`;
  clone.style.maxHeight = "none";
  clone.style.overflow = "visible";
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
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(rect.width * scale);
    canvas.height = Math.ceil(rect.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("无法创建图片画布");
    context.fillStyle = "#07100d";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function exportPanelImage(element, filename) {
  if (!element) throw new Error("未找到导出内容");
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) throw new Error("导出内容尺寸无效");
  const scale = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  let canvas;
  try {
    if (typeof window.html2canvas !== "function") throw new Error("图片渲染组件未加载");
    canvas = await window.html2canvas(element, {
      backgroundColor: "#07100d",
      scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.clientWidth,
      windowHeight: document.documentElement.scrollHeight,
    });
  } catch (primaryError) {
    console.warn("Canvas 导出失败，尝试兼容渲染", primaryError);
    try {
      canvas = await renderForeignObjectCanvas(element, rect, scale);
    } catch (compatibilityError) {
      console.warn("兼容渲染失败，改用卷宗画布", compatibilityError);
      canvas = renderPortableDossierCanvas(element, filename);
    }
  }
  try {
    await downloadCanvasImage(canvas, filename);
  } catch (downloadError) {
    // SVG textures can taint a foreignObject canvas in Chromium. The portable
    // renderer has no external resources, so it remains exportable everywhere.
    console.warn("图片编码失败，改用安全卷宗画布", downloadError);
    await downloadCanvasImage(renderPortableDossierCanvas(element, filename), filename);
  }
}

async function refreshPrivateChronicle(profile) {
  const target = $("#privatePanel [data-trial-chronicle]");
  if (!target) return;
  const result = await callAction("listMyScoreLogs", {
    name: profile.name,
    phrase: currentPrivatePhrase,
  });
  if (currentPrivateProfile?.id !== profile.id || !$("#privatePanel [data-trial-chronicle]")) return;
  if (!result.error) target.innerHTML = renderTrialChronicle(profile, result.data.logs || []);
}

function renderSettlements(logs = state.settlements) {
  $("#settlementLog").innerHTML = logs.map((entry) => `
    <article class="log-item">
      <strong>${escapeHtml(entry.name || entry.target_name || "未知成员")}</strong>
      <p>登神分 ${formatScoreDelta(entry.ascensionDelta ?? entry.ascension_delta)}，觐见分 ${formatScoreDelta(entry.audienceDelta ?? entry.audience_delta)}</p>
      <p>副本：${escapeHtml(entry.reason || "未标注副本")}</p>
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
  if (secretSubmitInFlight) return showToast("启封处理中，请勿重复点击");
  const form = event.currentTarget;
  const submitButton = form.querySelector(".btn--unlock[type='submit']");
  const originalLabel = submitButton?.textContent?.trim() || "启封天赋卷宗";
  const phrase = $("#secretPhrase").value;
  secretSubmitInFlight = true;
  form.setAttribute("aria-busy", "true");
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.classList.add("is-busy");
    submitButton.textContent = "启封中...";
  }
  try {
    const result = await callAction("verifySecret", {
      name: $("#secretName").value.trim(),
      phrase
    });
    if (result.error) return showToast(`验证失败：${result.error}`);
    currentPrivatePhrase = phrase;
    flashSealBreak();
    renderPrivatePanel(toPrivateProfile(result.data.profile));
    flashFaithAwakening();
    showToast("已进入你的私密面板");
  } catch (error) {
    showToast(`验证失败：${error instanceof Error ? error.message : "网络请求异常"}`);
  } finally {
    secretSubmitInFlight = false;
    form.setAttribute("aria-busy", "false");
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove("is-busy");
      submitButton.textContent = originalLabel;
    }
  }
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
  const profile = syncScoreTargetMatch();
  if (!profile) return showToast("请填写可唯一匹配的信徒昵称");
  const result = await callAction("submitScore", {
    adminKey: $("#adminKey").value.trim(),
    profileId: profile.id,
    ascensionDelta: clampNumber($("#ascensionDelta").value, -20, 20),
    audienceDelta: clampNumber($("#audienceDelta").value, -3, 3),
    dungeonName: $("#scoreDungeonName").value.trim()
  });
  if (result.error) return showToast(`结算失败：${result.error}`);
  $("#scoreTargetName").value = "";
  syncScoreTargetMatch();
  $("#scoreDungeonName").value = "";
  $("#ascensionDelta").value = 0;
  $("#audienceDelta").value = 0;
  showToast("结算已提交");
  await refreshPublicData();
  await refreshScoreLogs();
}

function parseSignedInteger(value) {
  if (!/^[+-]?\d+$/.test(String(value || "").trim())) return null;
  return Number(value);
}

function findProfileByNameSuffix(text) {
  const normalizedText = String(text || "").trim();
  const candidates = publicProfiles()
    .filter((profile) => normalizedText === profile.name || normalizedText.endsWith(profile.name))
    .sort((a, b) => String(b.name).length - String(a.name).length);
  return candidates[0] || null;
}

function parseBulkScoreLine(line, rowNumber) {
  const tokens = String(line || "").trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 5) throw new Error("格式不足，应为：信仰 职业 昵称 +登神分 +觐见分");
  const audienceDelta = parseSignedInteger(tokens.at(-1));
  const ascensionDelta = parseSignedInteger(tokens.at(-2));
  if (ascensionDelta === null || audienceDelta === null) throw new Error("最后两项必须是加减分数字，例如 +3 -1");
  if (ascensionDelta < -20 || ascensionDelta > 20) throw new Error("登神之路分数范围必须在 -20 到 20");
  if (audienceDelta < -3 || audienceDelta > 3) throw new Error("觐见之梯分数范围必须在 -3 到 3");
  const identityText = tokens.slice(0, -2).join(" ");
  const profile = findProfileByNameSuffix(identityText);
  if (!profile) throw new Error(`找不到昵称：${identityText}`);
  return {
    row: rowNumber,
    profileId: profile.id,
    name: profile.name,
    ascensionDelta,
    audienceDelta
  };
}

function parseBulkScoreInput(text) {
  const lines = String(text || "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { entries: [], errors: [{ row: 1, error: "没有可结算内容" }] };
  const entries = [];
  const errors = [];
  lines.forEach((line, index) => {
    try {
      entries.push(parseBulkScoreLine(line, index + 1));
    } catch (error) {
      errors.push({ row: index + 1, line, error: error.message });
    }
  });
  return { entries, errors };
}

function renderBulkScoreResult(result, applied = []) {
  const entries = result.entries || [];
  const errors = result.errors || [];
  $("#bulkScoreResult").innerHTML = `
    <div class="form-note">有效结算：${entries.length || applied.length}，错误：${errors.length}${applied.length ? `，已提交：${applied.length}` : ""}</div>
    ${entries.length ? `<ul class="success-list">${entries.map((entry) => `<li>${escapeHtml(entry.name)}：登神 ${entry.ascensionDelta >= 0 ? "+" : ""}${entry.ascensionDelta}，觐见 ${entry.audienceDelta >= 0 ? "+" : ""}${entry.audienceDelta}</li>`).join("")}</ul>` : ""}
    ${errors.length ? `<ul>${errors.map((item) => `<li>第 ${item.row} 行：${escapeHtml(item.error)}</li>`).join("")}</ul>` : ""}
  `;
}

function bulkScoreDungeonName() {
  return $("#bulkScoreDungeonName").value.trim();
}

function handleBulkScorePreview() {
  if (!bulkScoreDungeonName()) return renderBulkScoreResult({ entries: [], errors: [{ row: 0, error: "请填写副本名称" }] });
  renderBulkScoreResult(parseBulkScoreInput($("#bulkScoreInput").value));
}

async function handleBulkScoreSubmit() {
  const dungeonName = bulkScoreDungeonName();
  if (!dungeonName) return showToast("请填写副本名称");
  const parsed = parseBulkScoreInput($("#bulkScoreInput").value);
  if (parsed.errors.length) {
    renderBulkScoreResult(parsed);
    return showToast("存在错误行，未提交");
  }
  const result = await callAction("bulkSubmitScores", {
    adminKey: $("#adminKey").value.trim(),
    dungeonName,
    entries: parsed.entries
  });
  if (result.error) return showToast(`批量结算失败：${result.error}`);
  renderBulkScoreResult({ entries: parsed.entries, errors: result.data.errors || [] }, result.data.applied || []);
  showToast(`已提交 ${result.data.applied?.length || 0} 条结算`);
  $("#bulkScoreDungeonName").value = "";
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
const excelCollectionHeaders = [
  "填写序号", "昵称", "昵称(信仰+昵称)", "职业(命途职业)", "暗语(个人信息密码,不可公开)",
  "个人宣言(类似签名,他人可看)", "私密备注(建议填写谕行词)", "天赋", "登神之路分数", "觐见之梯分数",
  "开始时间", "提交时间", "答题时长"
];

function normalizeExcelCollectionHeader(value) {
  return String(value || "")
    .replace(/[\s_＿]/g, "")
    .replace(/[（]/g, "(")
    .replace(/[）]/g, ")")
    .replace(/，/g, ",")
    .trim();
}

function isExcelCollectionHeader(cells) {
  return cells.length === excelCollectionHeaders.length
    && cells.map(normalizeExcelCollectionHeader).every((header, index) => header === excelCollectionHeaders[index]);
}

function hasBulkHeader(headers) {
  const required = ["昵称", "暗语", "职业"];
  return required.every((header) => headers.includes(header));
}

function rowFromCells(cells, headers = defaultBulkHeaders) {
  return Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] ?? ""]));
}

function validateBulkHeaders(headers) {
  if (headers.length !== defaultBulkHeaders.length) {
    throw new Error(`表头必须是 ${defaultBulkHeaders.length} 列：${defaultBulkHeaders.join("、")}`);
  }
  const mismatchIndex = defaultBulkHeaders.findIndex((header, index) => headers[index] !== header);
  if (mismatchIndex >= 0) {
    throw new Error(`第 ${mismatchIndex + 1} 列表头应为“${defaultBulkHeaders[mismatchIndex]}”，当前为“${headers[mismatchIndex] || "空"}”`);
  }
}

function parseBulkDataLine(line, headers = defaultBulkHeaders) {
  if (!String(line).includes("\t")) throw new Error("档案录入只接受 TSV；该行未检测到制表符");
  const cells = parseDelimitedLine(line);
  if (cells.length !== headers.length) throw new Error(`列数应为 ${headers.length}，当前为 ${cells.length}；请检查是否多粘贴了制表符或漏了空列`);
  return rowFromCells(cells, headers);
}

function collectTsvRecords(text, expectedColumns) {
  const records = [];
  const errors = [];
  let buffered = "";
  String(text || "").replace(/\r\n?/g, "\n").split("\n").forEach((line, index) => {
    if (!buffered && !line.trim()) return;
    buffered = buffered ? `${buffered}\n${line}` : line;
    const cells = parseDelimitedLine(buffered);
    if (cells.length === expectedColumns) {
      records.push({ cells, row: index + 1 });
      buffered = "";
    } else if (cells.length > expectedColumns) {
      errors.push({ row: index + 1, error: `列数应为 ${expectedColumns}，当前为 ${cells.length}` });
      buffered = "";
    }
  });
  if (buffered) errors.push({ row: records.length + 1, error: `列数应为 ${expectedColumns}，当前为 ${parseDelimitedLine(buffered).length}` });
  return { records, errors };
}

function rowFromExcelCollectionCells(cells) {
  return {
    "昵称": normalizeCollectedName(cells[2]) || normalizeName(cells[1]),
    "职业": cells[3] ?? "",
    "暗语": cells[4] ?? "",
    "公开短记": cells[5] ?? "",
    "私密备注": cells[6] ?? "",
    "天赋": cells[7] ?? "",
    "登神分": cells[8] ?? "",
    "觐见分": cells[9] ?? ""
  };
}

function parseBulkInput(text) {
  const firstLine = String(text || "").replace(/^\s+/, "").split(/\r?\n/, 1)[0] || "";
  if (!firstLine.trim()) return { rows: [], errors: [{ row: 1, error: "没有可导入内容" }] };
  if (!firstLine.includes("\t")) return { rows: [], errors: [{ row: 1, error: "档案录入只接受从 Excel 复制的 TSV 行" }] };
  const firstCells = parseDelimitedLine(firstLine);
  const firstLooksLikeStandardHeader = hasBulkHeader(firstCells.map(normalizeBulkHeader));
  const tabCount = (String(text || "").match(/\t/g) || []).length;
  const isExcelLayout = firstCells.length === excelCollectionHeaders.length || (!firstLooksLikeStandardHeader && tabCount >= excelCollectionHeaders.length - 1);
  const expectedColumns = isExcelLayout ? excelCollectionHeaders.length : defaultBulkHeaders.length;
  const collected = collectTsvRecords(text, expectedColumns);
  const errors = [...collected.errors];
  let records = collected.records;
  let mapper = (cells) => rowFromCells(cells, defaultBulkHeaders);
  let dataRowOffset = 0;
  if (isExcelLayout) {
    if (records.length && isExcelCollectionHeader(records[0].cells)) {
      records = records.slice(1);
      dataRowOffset = 1;
    }
    mapper = rowFromExcelCollectionCells;
  } else {
    const headers = firstCells.map(normalizeBulkHeader);
    if (!hasBulkHeader(headers)) return { rows: [], errors: [{ row: 1, error: `请粘贴问卷 Excel 的 13 列数据行，或 8 列表头：${defaultBulkHeaders.join("、")}` }] };
    try {
      validateBulkHeaders(headers);
    } catch (error) {
      return { rows: [], errors: [{ row: 1, error: error.message }] };
    }
    records = records.slice(1);
    dataRowOffset = 1;
  }
  const rows = [];
  records.forEach((record, index) => {
    let row = {};
    try {
      row = mapper(record.cells);
      rows.push(normalizeProfileInput(row, true, true));
    } catch (error) {
      errors.push({ row: index + 1 + dataRowOffset, name: row["昵称"] || "", error: error.message });
    }
  });
  return { rows, errors };
}

function renderBulkResult(result, imported = []) {
  const validCount = result.rows?.length || imported.length || 0;
  const errors = result.errors || [];
  const rows = result.rows || [];
  $("#bulkImportResult").innerHTML = `
    <div class="form-note">有效行：${validCount}，错误：${errors.length}${imported.length ? `，已导入：${imported.length}` : ""}</div>
    ${rows.length ? `<ul class="success-list">${rows.map((row) => `<li>${escapeHtml(row.name)}：${escapeHtml(row.profession)}，登神 ${escapeHtml(row.ascension)}，觐见 ${escapeHtml(row.audience)}</li>`).join("")}</ul>` : ""}
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
  if (result.data.errors?.length) return showToast("后端校验发现错误，未导入");
  showToast(`已导入 ${result.data.imported?.length || 0} 行`);
  await refreshPublicData();
}

function showView(view) {
  if (view === "admin" && !canAccessAdminPanel()) {
    showToast("此司务台仅对授权信徒开放");
    view = currentPrivateProfile ? "private" : "leaderboard";
  }
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
  if (id === "secretName") button.textContent = hidden ? "显露法号" : "遮蔽法号";
  else button.textContent = hidden ? "显露暗契" : "遮蔽暗契";
}

function bindEvents() {
  installTransientButtonGuard();
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
  $("#faithFilter").addEventListener("change", renderLeaderboard);
  $("#scoreTargetName").addEventListener("input", syncScoreTargetMatch);
  $("#secretForm").addEventListener("submit", handleSecretSubmit);
  bindGuardedForm("#adminProfileForm", "保存中...", handleAdminProfileSubmit);
  bindGuardedForm("#scoreForm", "结算中...", handleScoreSubmit);
  $("#clearAdminFormButton").addEventListener("click", clearAdminForm);
  $("#bulkPreviewButton").addEventListener("click", handleBulkPreview);
  bindGuardedButton("#bulkImportButton", "导入中...", handleBulkImport);
  $("#bulkScorePreviewButton").addEventListener("click", handleBulkScorePreview);
  bindGuardedButton("#bulkScoreSubmitButton", "结算中...", handleBulkScoreSubmit);
  $("#classInput").addEventListener("change", () => {
    const info = findProfession($("#classInput").value);
    if (!info) return;
    $("#godInput").value = info.faithGod;
    $("#pathInput").value = info.path;
  });
  bindGuardedButton("#refreshButton", "刷新中...", async () => {
    await loadProfessionLibrary();
    await refreshPublicData();
    await refreshScoreLogs();
    showToast("已刷新");
  });
  $("#logoutButton").addEventListener("click", () => {
    currentPrivateProfile = null;
    currentPrivatePhrase = "";
    syncAdminPanelAccess();
    document.body.classList.remove("is-faith-awakening");
    clearFaithTheme();
    $("#logoutButton").hidden = true;
    $("#secretForm").reset();
    $("#secretPhrase").classList.remove("is-secret-hidden");
    $("#secretName").classList.remove("is-secret-hidden");
    $("[data-toggle-secret='secretPhrase']").textContent = "遮蔽暗契";
    $("[data-toggle-secret='secretName']").textContent = "遮蔽法号";
    $("#privatePanel").className = "panel profile-preview profile-preview--wide dossier-card dossier-card--empty god-theme god-theme--unbound";
    $("#privatePanel").dataset.god = "未定";
    $("#privatePanel").innerHTML = `
      <div class="dossier-head">
        <div class="avatar-orbit"><span class="avatar-core"><span>希</span></span></div>
        <div>
          <p class="eyebrow">Believer Dossier</p>
          <h3>未启封</h3>
        </div>
      </div>
    `;
    showToast("已退出私密面板");
  });
  $("#adminKey").addEventListener("change", refreshScoreLogs);
}

async function boot() {
  setupGodOptions();
  setupFaithFilter();
  bindEvents();
  syncAdminPanelAccess();
  clearAdminForm();
  await loadProfessionLibrary();
  await refreshPublicData();
}

boot();
