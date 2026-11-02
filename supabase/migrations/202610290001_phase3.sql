create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = timezone('utc', now()); return new; end; $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  preferred_language text not null default 'English' check (preferred_language in ('English', 'తెలుగు', 'हिन्दी')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120), location_name text not null check (char_length(location_name) between 2 and 240),
  latitude double precision, longitude double precision, soil_type text not null, area_value numeric not null check (area_value > 0), area_unit text not null check (area_unit in ('acres', 'hectares')),
  irrigation_method text not null, water_availability text not null, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.farm_fields (
  id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null, soil_type text not null, area_value numeric not null check (area_value > 0), area_unit text not null check (area_unit in ('acres', 'hectares')), crop_type text, irrigation_method text not null,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), unique (id, farm_id)
);
create table if not exists public.crop_catalog (
  id uuid primary key default gen_random_uuid(), name text not null unique, scientific_name text, supported_seasons jsonb not null default '[]', suitable_soil_types jsonb not null default '[]', image_reference text, description text not null, source_reference text not null, created_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.crop_recommendations (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, farm_id uuid not null references public.farms(id) on delete cascade, field_id uuid, input_snapshot jsonb not null, results jsonb not null, engine_version text not null, data_source_metadata jsonb not null default '{}', created_at timestamptz not null default timezone('utc', now()), foreign key (field_id, farm_id) references public.farm_fields(id, farm_id) on delete set null
);
create table if not exists public.pest_reports (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, farm_id uuid not null references public.farms(id) on delete cascade, field_id uuid, crop_type text not null, storage_path text not null, analysis_status text not null default 'pending' check (analysis_status in ('pending', 'complete', 'failed')), result_payload jsonb, model_version text, created_at timestamptz not null default timezone('utc', now()), foreign key (field_id, farm_id) references public.farm_fields(id, farm_id) on delete set null
);
create table if not exists public.irrigation_logs (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, farm_id uuid not null references public.farms(id) on delete cascade, field_id uuid, input_snapshot jsonb not null, estimated_water_litres numeric not null check (estimated_water_litres >= 0), estimated_runtime_minutes numeric not null check (estimated_runtime_minutes >= 0), actual_water_litres numeric, notes text, created_at timestamptz not null default timezone('utc', now()), foreign key (field_id, farm_id) references public.farm_fields(id, farm_id) on delete set null
);
create table if not exists public.fertilizer_logs (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, farm_id uuid not null references public.farms(id) on delete cascade, field_id uuid, crop_type text not null, area_value numeric not null check (area_value > 0), area_unit text not null check (area_unit in ('acres', 'hectares')), nutrient_requirement jsonb not null, nutrient_composition_percent jsonb not null, product_quantity numeric not null check (product_quantity >= 0), input_snapshot jsonb not null, created_at timestamptz not null default timezone('utc', now()), foreign key (field_id, farm_id) references public.farm_fields(id, farm_id) on delete set null
);
create table if not exists public.weather_snapshots (
  id uuid primary key default gen_random_uuid(), farm_id uuid not null references public.farms(id) on delete cascade, owner_id uuid not null references auth.users(id) on delete cascade, source text not null, observed_at timestamptz not null, payload jsonb not null, created_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.advisor_conversations (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, farm_id uuid references public.farms(id) on delete set null, selected_language text not null default 'English', metadata jsonb not null default '{}', created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.advisor_messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.advisor_conversations(id) on delete cascade, owner_id uuid not null references auth.users(id) on delete cascade, role text not null check (role in ('farmer', 'advisor', 'system')), content text not null check (char_length(content) between 1 and 10000), metadata jsonb not null default '{}', created_at timestamptz not null default timezone('utc', now())
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, title text not null, message text not null, category text not null, read_at timestamptz, created_at timestamptz not null default timezone('utc', now())
);

create index if not exists farms_owner_id_idx on public.farms(owner_id);
create index if not exists farm_fields_owner_id_idx on public.farm_fields(owner_id);
create index if not exists farm_fields_farm_id_idx on public.farm_fields(farm_id);
create index if not exists recommendations_owner_created_idx on public.crop_recommendations(owner_id, created_at desc);
create index if not exists pest_reports_owner_created_idx on public.pest_reports(owner_id, created_at desc);
create index if not exists irrigation_logs_owner_created_idx on public.irrigation_logs(owner_id, created_at desc);
create index if not exists fertilizer_logs_owner_created_idx on public.fertilizer_logs(owner_id, created_at desc);
create index if not exists notifications_owner_created_idx on public.notifications(owner_id, created_at desc);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists farms_updated_at on public.farms;
create trigger farms_updated_at before update on public.farms for each row execute function public.set_updated_at();
drop trigger if exists farm_fields_updated_at on public.farm_fields;
create trigger farm_fields_updated_at before update on public.farm_fields for each row execute function public.set_updated_at();
drop trigger if exists advisor_conversations_updated_at on public.advisor_conversations;
create trigger advisor_conversations_updated_at before update on public.advisor_conversations for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', null)) on conflict (id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.farms enable row level security;
alter table public.farm_fields enable row level security;
alter table public.crop_catalog enable row level security;
alter table public.crop_recommendations enable row level security;
alter table public.pest_reports enable row level security;
alter table public.irrigation_logs enable row level security;
alter table public.fertilizer_logs enable row level security;
alter table public.weather_snapshots enable row level security;
alter table public.advisor_conversations enable row level security;
alter table public.advisor_messages enable row level security;
alter table public.notifications enable row level security;

create policy profiles_self on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy farms_owner on public.farms for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy fields_owner on public.farm_fields for all using (owner_id = auth.uid() and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid())) with check (owner_id = auth.uid() and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid()));
create policy crop_catalog_public_read on public.crop_catalog for select using (true);
create policy recommendations_owner on public.crop_recommendations for all using (owner_id = auth.uid() and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid())) with check (owner_id = auth.uid() and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid()));
create policy pest_reports_owner on public.pest_reports for all using (owner_id = auth.uid() and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid())) with check (owner_id = auth.uid() and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid()));
create policy irrigation_owner on public.irrigation_logs for all using (owner_id = auth.uid() and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid())) with check (owner_id = auth.uid() and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid()));
create policy fertilizer_owner on public.fertilizer_logs for all using (owner_id = auth.uid() and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid())) with check (owner_id = auth.uid() and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid()));
create policy weather_owner on public.weather_snapshots for all using (owner_id = auth.uid() and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid())) with check (owner_id = auth.uid() and exists (select 1 from public.farms f where f.id = farm_id and f.owner_id = auth.uid()));
create policy conversations_owner on public.advisor_conversations for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy messages_owner on public.advisor_messages for all using (owner_id = auth.uid() and exists (select 1 from public.advisor_conversations c where c.id = conversation_id and c.owner_id = auth.uid())) with check (owner_id = auth.uid() and exists (select 1 from public.advisor_conversations c where c.id = conversation_id and c.owner_id = auth.uid()));
create policy notifications_owner on public.notifications for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

insert into storage.buckets (id, name, public) values ('crop-images', 'crop-images', false) on conflict (id) do update set public = false;
create policy crop_images_owner_read on storage.objects for select using (bucket_id = 'crop-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy crop_images_owner_insert on storage.objects for insert with check (bucket_id = 'crop-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy crop_images_owner_delete on storage.objects for delete using (bucket_id = 'crop-images' and (storage.foldername(name))[1] = auth.uid()::text);
