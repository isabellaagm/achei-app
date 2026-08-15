-- ============================================================================
-- achei — schema do banco (Supabase / Postgres)
-- Rode isso uma vez no SQL Editor do seu projeto Supabase antes do primeiro
-- deploy. É seguro rodar de novo (usa "if not exists").
-- ============================================================================

create extension if not exists "pgcrypto"; -- pra gen_random_uuid()

create table if not exists event (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date,
  location text,
  cover_key text,                 -- chave do objeto no R2 (capa do evento)
  accent_color text default '#C7952A',
  admin_password_hash text not null,
  public_base_url text,           -- preenchido depois do deploy, ex: https://achei-isabella.vercel.app
  created_at timestamptz not null default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references event(id) on delete cascade,
  original_key text not null,     -- chave do objeto original no R2
  thumb_key text not null,        -- chave do objeto comprimido (galeria) no R2
  width int,
  height int,
  face_count int not null default 0,
  uploaded_at timestamptz not null default now()
);
create index if not exists idx_photos_event on photos(event_id);

create table if not exists face_descriptors (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references photos(id) on delete cascade,
  embedding float4[] not null      -- vetor de 1024 posições (biblioteca Human)
);
create index if not exists idx_face_descriptors_photo on face_descriptors(photo_id);

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references event(id) on delete cascade,
  name text not null,
  phone text not null,
  matched_photo_ids uuid[] not null default '{}',
  registered_at timestamptz not null default now()
);
create index if not exists idx_guests_event on guests(event_id);

-- Row Level Security: todo o acesso passa pelas rotas de API (que usam a
-- service role key no servidor), então bloqueamos acesso direto do browser.
alter table event enable row level security;
alter table photos enable row level security;
alter table face_descriptors enable row level security;
alter table guests enable row level security;
-- (nenhuma policy = ninguém acessa via anon key direto, só via service role nas API routes)
