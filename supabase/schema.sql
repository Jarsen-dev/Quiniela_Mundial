-- ============================================================
-- Quiniela Mundial 2026 — esquema de base de datos para Supabase
-- Ejecuta este script completo en el SQL Editor de tu proyecto.
-- ============================================================

-- ---------- Tabla de perfiles ----------
-- Un perfil por usuario autenticado (auth.users), con foto y puntos
-- otorgados (para no repetir la animación de gol).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  photo_url text not null,
  awarded_goals jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cualquiera autenticado puede ver todos los perfiles (ranking)
create policy "profiles_select_all"
  on public.profiles for select
  to authenticated
  using (true);

-- Un usuario solo puede crear su propio perfil
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Un usuario solo puede actualizar su propio perfil
-- (se usa para registrar las animaciones de gol ya mostradas)
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ---------- Tabla de votos ----------
-- Un voto por usuario y partido. No se permite UPDATE ni DELETE:
-- una vez enviado el voto, queda fijo para siempre.
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id text not null,
  choice text not null check (choice in ('home', 'draw', 'away')),
  created_at timestamptz not null default now(),
  unique (user_id, match_id)
);

alter table public.votes enable row level security;

-- Todos los usuarios autenticados pueden ver todos los votos
-- (necesario para calcular el ranking de puntos)
create policy "votes_select_all"
  on public.votes for select
  to authenticated
  using (true);

-- Un usuario solo puede insertar sus propios votos
create policy "votes_insert_own"
  on public.votes for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Nota: NO se crean políticas de UPDATE ni DELETE para "votes",
-- por lo que esas operaciones quedan bloqueadas para todos.


-- ---------- Bucket de fotos de perfil ----------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Lectura pública de las fotos (para mostrarlas en el ranking)
create policy "avatars_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

-- Cada usuario solo puede subir/actualizar su propia foto,
-- guardada como avatars/<user_id>/...
create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
