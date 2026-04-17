-- =============================================================
-- Vobi Service MVP — Supabase Schema (v2)
-- Execute no SQL Editor do Supabase (projeto > SQL Editor > New query)
-- =============================================================

-- Limpeza (MVP sem dados reais).
-- "drop table if exists ... cascade" remove tabela + policies + indexes + FKs.
drop table if exists service_photos cascade;
drop table if exists public_links cascade;
drop table if exists resumos cascade;
drop table if exists checklist_items cascade;
drop table if exists servicos cascade;
drop table if exists profiles cascade;

-- =============================================================
-- Profiles
-- =============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company text,
  email text,
  created_at timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, company)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =============================================================
-- Servicos (visita técnica)
-- =============================================================
create table servicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Cliente (PRD §2)
  cliente_nome text not null,
  cliente_email text,
  cliente_telefone text,
  endereco text not null,
  cidade text,
  estado char(2),

  -- Equipamento (ar-condicionado) — PRD §2
  tipo_equipamento text not null default 'ar-condicionado',
  btus integer not null,
  numero_serie text,
  observacao_inicial text,

  -- Status / fluxo
  status text not null default 'em_andamento'
    check (status in ('em_andamento','finalizado')),
  status_final text
    check (status_final in ('ok','ajuste_realizado','retorno_necessario')),
  finalizado_em timestamptz,

  -- IA
  diagnostico_ia text,
  resumo_ia text,

  -- Compartilhamento público (PRD §10)
  public_token text unique,

  -- E-mail (PRD §9)
  email_enviado_em timestamptz,
  email_erro text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index servicos_user_id_idx on servicos(user_id);
create index servicos_public_token_idx on servicos(public_token);

-- =============================================================
-- Checklist Items (PRD §4 e §8)
-- =============================================================
create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  servico_id uuid not null references servicos(id) on delete cascade,
  grupo text not null,
  descricao text not null,
  orientacao text,
  kind text not null default 'boolean'
    check (kind in ('boolean','numeric')),
  unit text,
  numeric_value numeric,
  status text not null default 'pendente'
    check (status in ('pendente','ok','ajustado','problema')),
  observacao text,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create index checklist_items_servico_idx on checklist_items(servico_id);

-- =============================================================
-- Service Photos (PRD §6 — US-07)
-- =============================================================
create table service_photos (
  id uuid primary key default gen_random_uuid(),
  servico_id uuid not null references servicos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  mime_type text,
  size_bytes integer,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create index service_photos_servico_idx on service_photos(servico_id);

-- =============================================================
-- RLS
-- =============================================================
alter table profiles enable row level security;
alter table servicos enable row level security;
alter table checklist_items enable row level security;
alter table service_photos enable row level security;

-- Profiles
create policy "profiles_self_select" on profiles for select using (auth.uid() = id);
create policy "profiles_self_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_self_update" on profiles for update using (auth.uid() = id);

-- Servicos: dono autenticado
create policy "servicos_owner_all" on servicos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Servicos: leitura pública via public_token
create policy "servicos_public_by_token" on servicos for select
  using (public_token is not null);

-- Checklist items: via dono do serviço
create policy "checklist_owner_all" on checklist_items for all
  using (exists (select 1 from servicos s where s.id = servico_id and s.user_id = auth.uid()))
  with check (exists (select 1 from servicos s where s.id = servico_id and s.user_id = auth.uid()));

-- Checklist items: leitura pública via serviço com public_token
create policy "checklist_public_by_token" on checklist_items for select
  using (exists (select 1 from servicos s where s.id = servico_id and s.public_token is not null));

-- Photos: via dono
create policy "photos_owner_all" on service_photos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Photos: leitura pública
create policy "photos_public_by_token" on service_photos for select
  using (exists (select 1 from servicos s where s.id = servico_id and s.public_token is not null));

-- =============================================================
-- Storage bucket para fotos (público; plano free do Supabase)
-- =============================================================
insert into storage.buckets (id, name, public)
values ('service-photos', 'service-photos', true)
on conflict (id) do update set public = true;

-- Storage policies
drop policy if exists "photos_public_read" on storage.objects;
drop policy if exists "photos_owner_insert" on storage.objects;
drop policy if exists "photos_owner_delete" on storage.objects;

create policy "photos_public_read" on storage.objects
  for select using (bucket_id = 'service-photos');

create policy "photos_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'service-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'service-photos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
