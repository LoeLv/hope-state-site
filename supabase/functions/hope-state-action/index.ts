const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const adminKey = Deno.env.get("ADMIN_KEY") ?? "";
const secretPepper = Deno.env.get("SECRET_PEPPER") ?? "";

type JsonRecord = Record<string, unknown>;

function json(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function cleanText(value: unknown, max = 240) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanTalents(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => cleanText(item, 120)).filter(Boolean);
  return String(value ?? "")
    .split(/\r?\n/)
    .map((item) => cleanText(item, 120))
    .filter(Boolean);
}

function requireAdmin(payload: JsonRecord) {
  if (!adminKey || cleanText(payload.adminKey, 200) !== adminKey) {
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

function publicProfile(row: JsonRecord) {
  return {
    id: row.id,
    name: row.display_name,
    god: row.god,
    path: row.path,
    className: row.profession,
    publicNote: row.public_note,
    ascension: row.ascension_score,
    audience: row.audience_score,
    isPublic: row.is_public,
  };
}

function privateProfile(row: JsonRecord) {
  return {
    ...publicProfile(row),
    privateNote: row.private_note,
    talents: row.talents,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Only POST is allowed" }, 405);
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Supabase secrets are not configured" }, 500);

  try {
    const body = await request.json().catch(() => ({}));
    const action = cleanText(body.action, 80);
    const payload = (body.payload ?? {}) as JsonRecord;

    if (action === "listPublicProfiles") {
      const rows = await supabaseFetch("hope_profiles?is_public=eq.true&select=id,display_name,god,path,profession,public_note,ascension_score,audience_score,is_public&order=ascension_score.desc&order=audience_score.desc");
      return json({ profiles: rows.map(publicProfile) });
    }

    if (action === "verifySecret") {
      const name = cleanText(payload.name, 80);
      const phrase = cleanText(payload.phrase, 200);
      if (!name || !phrase) return json({ error: "请输入名字和暗语" }, 400);
      const rows = await supabaseFetch(`hope_profiles?display_name=eq.${encodeURIComponent(name)}&select=*`);
      const row = rows[0];
      if (!row || row.secret_hash !== await sha256(phrase)) return json({ error: "名字或暗语不正确" }, 401);
      return json({ profile: privateProfile(row) });
    }

    if (action === "adminUpsertProfile") {
      requireAdmin(payload);
      const profile = (payload.profile ?? {}) as JsonRecord;
      const name = cleanText(profile.name, 80);
      if (!name) return json({ error: "缺少昵称" }, 400);
      const existingRows = await supabaseFetch(`hope_profiles?display_name=eq.${encodeURIComponent(name)}&select=id,secret_hash`);
      const existing = existingRows[0];
      const secretPhrase = cleanText(profile.secretPhrase, 200);
      if (!existing && !secretPhrase) return json({ error: "首次录入必须填写私密暗语" }, 400);
      const row = {
        display_name: name,
        secret_hash: secretPhrase ? await sha256(secretPhrase) : existing.secret_hash,
        god: cleanText(profile.god, 20) || "命运",
        path: cleanText(profile.path, 20) || "虚无",
        profession: cleanText(profile.className, 80),
        public_note: cleanText(profile.publicNote, 220),
        private_note: cleanText(profile.privateNote, 400),
        talents: cleanTalents(profile.talents),
        is_public: profile.isPublic !== false,
      };
      const rows = await supabaseFetch("hope_profiles?on_conflict=display_name", {
        method: "POST",
        headers: { "Prefer": "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(row),
      });
      return json({ profile: publicProfile(rows[0]) });
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
