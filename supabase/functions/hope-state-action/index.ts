const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  readJsonSecret(Deno.env.get("SUPABASE_SECRET_KEYS")) ??
  "";
const adminKey = Deno.env.get("ADMIN_KEY") ?? "";
const secretPepper = Deno.env.get("SECRET_PEPPER") ?? "";

type JsonRecord = Record<string, unknown>;

type ProfessionRow = {
  profession: string;
  faith_god: string;
  path: string;
  base_class: string;
  feature_text: string;
};

type BaseClassRow = {
  base_class: string;
  base_hp: number;
  base_attack: number;
  attack_interval: string;
  combat_rule: string;
};

const pathByGod: Record<string, string> = {
  "诞育": "生命",
  "繁荣": "生命",
  "死亡": "生命",
  "记忆": "存在",
  "时间": "存在",
  "秩序": "文明",
  "真理": "文明",
  "战争": "文明",
  "欺诈": "虚无",
  "命运": "虚无",
  "混乱": "混沌",
  "沉默": "混沌",
  "痴愚": "混沌",
  "污堕": "沉沦",
  "腐朽": "沉沦",
  "湮灭": "沉沦",
};

function readJsonSecret(value: string | undefined) {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value);
    return String(parsed.service_role ?? parsed.serviceRole ?? parsed.secret ?? parsed.default ?? "");
  } catch {
    return value;
  }
}

function json(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function cleanText(value: unknown, max = 240) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeAdminKey(value: unknown) {
  return String(value ?? "")
    .replace(/[\s\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

function normalizeProfessionName(value: unknown) {
  return cleanText(value, 120).replace(/\s+/g, "");
}

function normalizeCollectedName(value: unknown) {
  const text = cleanText(value, 80);
  const parts = text.split(/[，,、/|]+/).map((item) => item.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : text;
}

function professionSearchKeys(value: unknown) {
  const normalized = normalizeProfessionName(value);
  const keys = new Set<string>([normalized]);
  const bracketMatch = normalized.match(/[（(]([^（）()]+)[）)]/);
  if (bracketMatch?.[1]) keys.add(normalizeProfessionName(bracketMatch[1]));
  const withoutBracket = normalized.replace(/[（(].*?[）)]/g, "");
  if (withoutBracket) keys.add(withoutBracket);
  return [...keys].filter(Boolean);
}

function cleanTalents(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => cleanText(item, 160)).filter(Boolean);
  return String(value ?? "")
    .split(/\r?\n|；|;/)
    .map((item) => cleanText(item, 160))
    .filter(Boolean);
}

function requireAdmin(payload: JsonRecord) {
  const configuredAdminKey = normalizeAdminKey(adminKey);
  if (!configuredAdminKey) {
    throw new Response(JSON.stringify({ error: "ADMIN_KEY 尚未配置，请先在 Supabase Secrets 保存后重新部署函数" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  }
  if (normalizeAdminKey(payload.adminKey) !== configuredAdminKey) {
    throw new Response(JSON.stringify({ error: "管理密钥不正确" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
    });
  }
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(`${value}${secretPepper}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function supabaseFetch(path: string, init: RequestInit & { headers?: Record<string, string> } = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || data?.error || "Supabase 请求失败");
  return data;
}

function totalScore(row: JsonRecord) {
  return Number(row.ascension_score ?? 1000) + Number(row.audience_score ?? 0) * 10;
}

function maxHp(row: JsonRecord, baseClass?: BaseClassRow) {
  if (!baseClass) return 0;
  const bonus = Math.max(0, Math.floor((Number(row.ascension_score ?? 1000) - 1000) / 100)) * 10;
  return Number(baseClass.base_hp ?? 0) + bonus;
}

function professionPayload(row: ProfessionRow) {
  return {
    profession: row.profession,
    faithGod: row.faith_god,
    faith_god: row.faith_god,
    path: row.path,
    baseClass: row.base_class,
    base_class: row.base_class,
    featureText: row.feature_text,
    feature_text: row.feature_text,
  };
}

async function loadReferenceData() {
  const [professions, baseClasses] = await Promise.all([
    supabaseFetch("hope_professions?select=profession,faith_god,path,base_class,feature_text&order=faith_god.asc&order=profession.asc"),
    supabaseFetch("hope_base_classes?select=base_class,base_hp,base_attack,attack_interval,combat_rule"),
  ]);
  const professionMap = new Map<string, ProfessionRow>();
  for (const row of professions as ProfessionRow[]) {
    professionMap.set(normalizeProfessionName(row.profession), row);
  }
  const baseClassMap = new Map<string, BaseClassRow>();
  for (const row of baseClasses as BaseClassRow[]) {
    baseClassMap.set(row.base_class, row);
  }
  return { professions: professions as ProfessionRow[], baseClasses: baseClasses as BaseClassRow[], professionMap, baseClassMap };
}

function enrichPublicProfile(row: JsonRecord, references: Awaited<ReturnType<typeof loadReferenceData>>, ranks: Map<string, number>, pathRanks: Map<string, number>) {
  const profession = cleanText(row.profession, 120);
  const professionInfo = references.professionMap.get(normalizeProfessionName(profession));
  const faithGod = cleanText(row.faith_god || row.god || professionInfo?.faith_god, 40);
  const path = cleanText(row.path || professionInfo?.path || pathByGod[faithGod], 40);
  const baseClassName = cleanText(row.base_class || professionInfo?.base_class, 40);
  const baseClass = references.baseClassMap.get(baseClassName);
  return {
    id: row.id,
    name: row.display_name,
    faithGod,
    faith_god: faithGod,
    god: faithGod,
    path,
    profession,
    className: profession,
    baseClass: baseClassName,
    base_class: baseClassName,
    publicNote: row.public_note,
    public_note: row.public_note,
    featureText: professionInfo?.feature_text ?? "",
    feature_text: professionInfo?.feature_text ?? "",
    baseHp: baseClass?.base_hp ?? 0,
    base_hp: baseClass?.base_hp ?? 0,
    hp: maxHp(row, baseClass),
    attack: baseClass?.base_attack ?? 0,
    attackInterval: baseClass?.attack_interval ?? "",
    attack_interval: baseClass?.attack_interval ?? "",
    combatRule: baseClass?.combat_rule ?? "",
    combat_rule: baseClass?.combat_rule ?? "",
    ascension: row.ascension_score,
    ascension_score: row.ascension_score,
    audience: row.audience_score,
    audience_score: row.audience_score,
    totalScore: totalScore(row),
    total_score: totalScore(row),
    totalRank: ranks.get(String(row.id)) ?? 0,
    total_rank: ranks.get(String(row.id)) ?? 0,
    pathRank: pathRanks.get(String(row.id)) ?? 0,
    path_rank: pathRanks.get(String(row.id)) ?? 0,
    isPublic: row.is_public,
    is_public: row.is_public,
  };
}

function enrichPrivateProfile(row: JsonRecord, references: Awaited<ReturnType<typeof loadReferenceData>>, ranks: Map<string, number>, pathRanks: Map<string, number>) {
  return {
    ...enrichPublicProfile(row, references, ranks, pathRanks),
    privateNote: row.private_note,
    private_note: row.private_note,
    talents: row.talents,
  };
}

function buildRanks(rows: JsonRecord[], references: Awaited<ReturnType<typeof loadReferenceData>>) {
  const publicRows = rows.filter((row) => row.is_public !== false);
  const sorted = [...publicRows].sort((a, b) => totalScore(b) - totalScore(a) || Number(b.ascension_score) - Number(a.ascension_score) || Number(b.audience_score) - Number(a.audience_score));
  const ranks = new Map<string, number>();
  sorted.forEach((row, index) => ranks.set(String(row.id), index + 1));

  const pathRanks = new Map<string, number>();
  const pathGroups = new Map<string, JsonRecord[]>();
  for (const row of publicRows) {
    const professionInfo = references.professionMap.get(normalizeProfessionName(row.profession));
    const faithGod = cleanText(row.faith_god || row.god || professionInfo?.faith_god, 40);
    const path = cleanText(row.path || professionInfo?.path || pathByGod[faithGod], 40);
    pathGroups.set(path, [...(pathGroups.get(path) ?? []), row]);
  }
  for (const group of pathGroups.values()) {
    group
      .sort((a, b) => totalScore(b) - totalScore(a) || Number(b.ascension_score) - Number(a.ascension_score) || Number(b.audience_score) - Number(a.audience_score))
      .forEach((row, index) => pathRanks.set(String(row.id), index + 1));
  }
  return { ranks, pathRanks };
}

async function listAllProfiles() {
  return await supabaseFetch("hope_profiles?select=*&order=ascension_score.desc&order=audience_score.desc");
}

async function upsertProfileFromPayload(profile: JsonRecord, references: Awaited<ReturnType<typeof loadReferenceData>>) {
  const name = normalizeCollectedName(profile.name || profile["昵称"]);
  const professionName = cleanText(profile.profession || profile.className || profile["职业"], 120);
  if (!name) throw new Error("缺少昵称");
  if (!professionName) throw new Error("缺少职业");
  const profession = professionSearchKeys(professionName)
    .map((key) => references.professionMap.get(key))
    .find(Boolean);
  if (!profession) throw new Error(`职业未匹配：${professionName}`);

  const existingRows = await supabaseFetch(`hope_profiles?display_name=eq.${encodeURIComponent(name)}&select=id,secret_hash`);
  const existing = existingRows[0] as JsonRecord | undefined;
  const secretPhrase = cleanText(profile.secretPhrase || profile["暗语"], 240);
  if (!existing && !secretPhrase) throw new Error("首次录入必须填写私密暗语");

  const row = {
    display_name: name,
    secret_hash: secretPhrase ? await sha256(secretPhrase) : existing?.secret_hash,
    god: profession.faith_god,
    faith_god: profession.faith_god,
    path: profession.path,
    profession: profession.profession,
    base_class: profession.base_class,
    public_note: cleanText(profile.publicNote ?? profile["公开短记"], 300),
    private_note: cleanText(profile.privateNote ?? profile["私密备注"], 600),
    talents: cleanTalents(profile.talents ?? profile["天赋"]),
    ascension_score: Math.max(0, Number(profile.ascension ?? profile.ascensionScore ?? profile["登神分"] ?? 1000)),
    audience_score: Math.max(0, Number(profile.audience ?? profile.audienceScore ?? profile["觐见分"] ?? 0)),
    is_public: profile.isPublic !== false,
  };
  const rows = await supabaseFetch("hope_profiles?on_conflict=display_name", {
    method: "POST",
    headers: { "Prefer": "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row),
  });
  return rows[0] as JsonRecord;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Only POST is allowed" }, 405);
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Supabase secrets are not configured" }, 500);

  try {
    const body = await request.json().catch(() => ({}));
    const action = cleanText(body.action, 80);
    const payload = (body.payload ?? {}) as JsonRecord;

    if (action === "diagnoseAdmin") {
      const provided = normalizeAdminKey(payload.adminKey);
      const configuredAdminKey = normalizeAdminKey(adminKey);
      return json({
        adminConfigured: Boolean(configuredAdminKey),
        adminLength: configuredAdminKey.length,
        providedLength: provided.length,
        matches: Boolean(configuredAdminKey) && provided === configuredAdminKey,
        hasSecretPepper: Boolean(secretPepper),
        hasServiceKey: Boolean(serviceRoleKey),
      });
    }

    if (action === "listProfessions") {
      const references = await loadReferenceData();
      return json({
        professions: references.professions.map(professionPayload),
        baseClasses: references.baseClasses,
      });
    }

    if (action === "listPublicProfiles") {
      const references = await loadReferenceData();
      const rows = (await listAllProfiles()).filter((row: JsonRecord) => row.is_public !== false);
      const { ranks, pathRanks } = buildRanks(rows, references);
      return json({ profiles: rows.map((row: JsonRecord) => enrichPublicProfile(row, references, ranks, pathRanks)) });
    }

    if (action === "getPublicProfile") {
      const id = cleanText(payload.id, 80);
      if (!id) return json({ error: "缺少档案 ID" }, 400);
      const references = await loadReferenceData();
      const rows = await listAllProfiles();
      const publicRows = rows.filter((row: JsonRecord) => row.is_public !== false);
      const row = publicRows.find((item: JsonRecord) => String(item.id) === id);
      if (!row) return json({ error: "找不到公开档案" }, 404);
      const { ranks, pathRanks } = buildRanks(rows, references);
      return json({ profile: enrichPublicProfile(row, references, ranks, pathRanks) });
    }

    if (action === "verifySecret") {
      const name = cleanText(payload.name, 80);
      const phrase = cleanText(payload.phrase, 240);
      if (!name || !phrase) return json({ error: "请输入名字和暗语" }, 400);
      const references = await loadReferenceData();
      const rows = await listAllProfiles();
      const row = rows.find((item: JsonRecord) => item.display_name === name);
      if (!row || row.secret_hash !== await sha256(phrase)) return json({ error: "名字或暗语不正确" }, 401);
      const { ranks, pathRanks } = buildRanks(rows, references);
      return json({ profile: enrichPrivateProfile(row, references, ranks, pathRanks) });
    }

    if (action === "adminUpsertProfile") {
      requireAdmin(payload);
      const references = await loadReferenceData();
      const row = await upsertProfileFromPayload((payload.profile ?? {}) as JsonRecord, references);
      const rows = await listAllProfiles();
      const { ranks, pathRanks } = buildRanks(rows, references);
      return json({ profile: enrichPublicProfile(row, references, ranks, pathRanks) });
    }

    if (action === "adminBulkImportProfiles") {
      requireAdmin(payload);
      const references = await loadReferenceData();
      const rows = Array.isArray(payload.rows) ? payload.rows as JsonRecord[] : [];
      const imported: JsonRecord[] = [];
      const errors: JsonRecord[] = [];
      for (let index = 0; index < rows.length; index += 1) {
        try {
          imported.push(await upsertProfileFromPayload(rows[index], references));
        } catch (error) {
          errors.push({
            row: index + 2,
            name: cleanText(rows[index]?.name || rows[index]?.["昵称"], 80),
            error: error instanceof Error ? error.message : "导入失败",
          });
        }
      }
      const allRows = await listAllProfiles();
      const { ranks, pathRanks } = buildRanks(allRows, references);
      return json({
        imported: imported.map((row) => enrichPublicProfile(row, references, ranks, pathRanks)),
        errors,
      });
    }

    if (action === "submitScore") {
      requireAdmin(payload);
      const profileId = cleanText(payload.profileId, 80);
      const ascensionDelta = Math.max(-20, Math.min(20, Number(payload.ascensionDelta ?? 0)));
      const audienceDelta = Math.max(0, Math.min(3, Number(payload.audienceDelta ?? 0)));
      const rows = await supabaseFetch(`hope_profiles?id=eq.${encodeURIComponent(profileId)}&select=*`);
      const profile = rows[0];
      if (!profile) return json({ error: "找不到结算对象" }, 404);
      const nextAscension = Math.max(0, Number(profile.ascension_score) + ascensionDelta);
      const nextAudience = Math.max(0, Number(profile.audience_score) + audienceDelta);
      await supabaseFetch(`hope_profiles?id=eq.${encodeURIComponent(profileId)}`, {
        method: "PATCH",
        body: JSON.stringify({ ascension_score: nextAscension, audience_score: nextAudience }),
      });
      await supabaseFetch("hope_score_logs", {
        method: "POST",
        body: JSON.stringify({
          profile_id: profileId,
          target_name: profile.display_name,
          ascension_delta: ascensionDelta,
          audience_delta: audienceDelta,
          reason: cleanText(payload.reason, 240),
        }),
      });
      return json({ ok: true });
    }

    if (action === "listScoreLogs") {
      requireAdmin(payload);
      const rows = await supabaseFetch("hope_score_logs?select=*&order=created_at.desc&limit=50");
      return json({ logs: rows });
    }

    return json({ error: "未知操作" }, 400);
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : "服务器错误";
    return json({ error: message }, 500);
  }
});
