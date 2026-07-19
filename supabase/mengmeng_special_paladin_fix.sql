-- Special profession/profile repair for 萌萌.
-- This does not change her secret phrase or scores.

insert into public.hope_professions (profession, faith_god, path, base_class, feature_text)
values (
  '圣骑',
  '命运',
  '虚无',
  '战士',
  '每一轮队友受到伤害时可选择过去抵挡，自己和队友各承受一半伤害；3 轮只可抵挡一次。'
)
on conflict (profession) do update
set faith_god = excluded.faith_god,
    path = excluded.path,
    base_class = excluded.base_class,
    feature_text = excluded.feature_text,
    updated_at = now();

update public.hope_profiles
set god = '命运',
    faith_god = '命运',
    path = '虚无',
    profession = '圣骑',
    base_class = '战士',
    public_note = coalesce(nullif(public_note, ''), '命运系特殊职业：圣骑'),
    private_note = '圣骑（战士）特殊档案：格挡 8 分钟 CD。基础绑定持有单手盾牌后，血量 220（+50），攻击 7（+2）。',
    talents = jsonb_build_array(
      'B级天赋 定位战壕：失去行动 3 回合，期间什么也做不了，包括特性；一回合内处于无敌状态，无视所有锁定技能，强制任何攻击目标转移为使用者本身；可视范围内所有生命体；冷却一局一次。',
      'B级天赋 观我勇否：锁定上一轮特性抵挡的伤害来源，如果这一轮他再次发动攻击，则自动触发锁定反击，造成 -20；冷却 3 回合。',
      'A级天赋 立钛合金盾：选择三个目标站在前方进行立盾；每抵消一次伤害，自己血量 -10；血量低于 20 时再次立盾直接死亡；血量低于 50 时无法立盾。',
      'B级武器 单手盾牌：攻击 +2，血量上限 +40；一局可以给 2 名队友增加 20 点护盾。',
      'A级护具 阿瑞斯之手：佩戴者血量上限 +10。阿瑞斯登场：非战斗状态主动触发，强制主持播报，自带 BGM，B格 +100，所有人都要直视；受到伤害超过 20 点时反伤敌方 5 点。'
    ),
    updated_at = now()
where display_name = '萌萌'
returning id, display_name, profession, faith_god, path, base_class, ascension_score, audience_score, public_note, private_note, talents;
