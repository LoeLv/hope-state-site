begin;

update public.hope_professions
set base_class = case profession
  when '今日勇士' then '战士'
  when '织命师' then '牧师'
  when '窃命之贼' then '刺客'
  when '终末之笔' then '猎人'
  when '预言家' then '歌者'
  when '编剧' then '法师'
  else base_class
end
where faith_god = '命运'
  and profession in ('今日勇士', '织命师', '窃命之贼', '终末之笔', '预言家', '编剧');

update public.hope_profiles
set base_class = case profession
  when '今日勇士' then '战士'
  when '织命师' then '牧师'
  when '窃命之贼' then '刺客'
  when '终末之笔' then '猎人'
  when '预言家' then '歌者'
  when '编剧' then '法师'
  else base_class
end
where faith_god = '命运'
  and profession in ('今日勇士', '织命师', '窃命之贼', '终末之笔', '预言家', '编剧');

select display_name, profession, base_class
from public.hope_profiles
where faith_god = '命运'
  and profession in ('今日勇士', '织命师', '窃命之贼', '终末之笔', '预言家', '编剧')
order by profession, display_name;

commit;
