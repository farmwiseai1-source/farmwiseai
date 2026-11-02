alter table public.crop_catalog add column if not exists rule_data jsonb not null default '{}'::jsonb;

update public.crop_catalog
set rule_data = case name
  when 'Rice' then '{"temperature_c":{"min":20,"max":35},"rainfall_mm":{"min":1000,"max":2500},"soils":["Black","Alluvial","Clay"],"water":"high","season_keywords":["kharif","monsoon"],"duration_days":{"min":100,"max":160}}'::jsonb
  when 'Groundnut' then '{"temperature_c":{"min":20,"max":30},"rainfall_mm":{"min":450,"max":1000},"soils":["Sandy","Loamy","Red"],"water":"moderate","season_keywords":["kharif","monsoon"],"duration_days":{"min":90,"max":130}}'::jsonb
  when 'Pearl millet' then '{"temperature_c":{"min":25,"max":35},"rainfall_mm":{"min":250,"max":700},"soils":["Sandy","Red","Desert / arid"],"water":"low","season_keywords":["kharif","monsoon"],"duration_days":{"min":70,"max":100}}'::jsonb
  else rule_data
end,
source_reference = case name
  when 'Rice' then 'ICAR Kharif Agro-Advisories 2025; TNAU Paddy cultivation practices; rule interpretation is provisional'
  when 'Groundnut' then 'ICAR Kharif Agro-Advisories 2025; TNAU cropping patterns; rule interpretation is provisional'
  when 'Pearl millet' then 'TNAU cropping patterns; ICAR Kharif Agro-Advisories 2025; rule interpretation is provisional'
  else source_reference
end
where name in ('Rice', 'Groundnut', 'Pearl millet');
