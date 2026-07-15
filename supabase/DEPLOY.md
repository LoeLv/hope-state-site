# 希望之州 Supabase 部署步骤

## 1. 建表与职业资料

在 Supabase SQL Editor 执行：

```sql
-- 复制执行 supabase/schema.sql 的全部内容
```

然后继续执行：

```sql
-- 复制执行 supabase/hope_professions_seed.sql 的全部内容
```

顺序不能反：`schema.sql` 先创建 `hope_professions` 和 `hope_base_classes`，职业 seed 再写入 96 个职业。

## 2. 创建 Edge Function

函数名：

```text
hope-state-action
```

把 `supabase/functions/hope-state-action/index.ts` 复制进去并部署。

## 3. 设置 Edge Function secrets

必须有：

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ADMIN_KEY
SECRET_PEPPER
```

说明：

- `ADMIN_KEY` 是你们管理录入/打分时输入的管理密钥。
- `SECRET_PEPPER` 是暗语哈希用的额外盐，随便生成一段长随机文本即可。设置后不要改，改了旧暗语会失效。
- 不要把 `SERVICE_ROLE_KEY`、`ADMIN_KEY`、`SECRET_PEPPER` 写进前端。

## 4. 修改前端配置

打开 `app.js`，把开头的配置改成你的 Supabase 信息：

```js
const config = {
  supabaseUrl: "https://你的项目.supabase.co",
  anonKey: "你的 anon publishable key",
  actionUrl: "https://你的项目.supabase.co/functions/v1/hope-state-action"
};
```

改完提交并推送 GitHub Pages。

## 5. 使用方式

管理员：

1. 打开“管理录入”。
2. 输入 `ADMIN_KEY`。
3. 给玩家录入昵称、暗语、职业、公开短记、私密备注、天赋。职业必须能匹配 `hope_professions`。
4. 批量导入可直接粘贴 Excel 表格，字段为：昵称、暗语、职业、登神分、觐见分、公开短记、私密备注、天赋。
5. 打分时也使用同一个 `ADMIN_KEY`。

玩家：

1. 公开排行榜无需登录。
2. 点击排行榜玩家，只能看到基础职业面板。
3. 打开“我的面板”，输入昵称和暗语，才能看到自己的天赋与私密备注。

## 6. 隐私边界

安全边界在 Edge Function，不在前端。

- 排行榜接口只返回公开字段。
- 私密天赋只在 `verifySecret` 通过后返回。
- 暗语只存哈希，不存明文。
- 管理操作必须带 `ADMIN_KEY`，并由 Edge Function 检查。
