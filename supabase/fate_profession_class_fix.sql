begin;

-- Canonical corrections from the full profession matrix.
update public.hope_professions
set base_class = case profession
  when '受害者' then '刺客'
  when '驭兽师' then '猎人'
  when '魔术师' then '歌者'
  when '今日勇士' then '战士'
  when '织命师' then '牧师'
  when '窃命之贼' then '刺客'
  when '终末之笔' then '猎人'
  when '预言家' then '歌者'
  when '编剧' then '法师'
  else base_class
end
where profession in ('受害者', '驭兽师', '魔术师', '今日勇士', '织命师', '窃命之贼', '终末之笔', '预言家', '编剧');

update public.hope_profiles as profile
set god = profession.faith_god,
    faith_god = profession.faith_god,
    path = profession.path,
    base_class = profession.base_class
from public.hope_professions as profession
where profile.profession = profession.profession
  and (
    profile.god is distinct from profession.faith_god
    or profile.faith_god is distinct from profession.faith_god
    or profile.path is distinct from profession.path
    or profile.base_class is distinct from profession.base_class
  );

select display_name, profession, base_class
from public.hope_profiles
where faith_god = '命运'
  and profession in ('今日勇士', '织命师', '窃命之贼', '终末之笔', '预言家', '编剧')
order by profession, display_name;

select display_name, profession, base_class
from public.hope_profiles
where faith_god = '欺诈'
  and profession in ('受害者', '驭兽师', '魔术师')
order by profession, display_name;

select profile.display_name,
       profile.profession,
       profile.faith_god as profile_faith,
       profession.faith_god as expected_faith,
       profile.path as profile_path,
       profession.path as expected_path,
       profile.base_class as profile_base_class,
       profession.base_class as expected_base_class
from public.hope_profiles as profile
left join public.hope_professions as profession
  on profession.profession = profile.profession
where profession.profession is null
   or profile.god is distinct from profession.faith_god
   or profile.faith_god is distinct from profession.faith_god
   or profile.path is distinct from profession.path
   or profile.base_class is distinct from profession.base_class
order by profile.display_name;

commit;
