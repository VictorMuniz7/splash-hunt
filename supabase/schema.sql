-- Splash Hunt — Fase 1 (conta + perfil)
-- Rode este script inteiro no SQL Editor do seu projeto Supabase
-- (Dashboard → SQL Editor → New query → colar → Run).
--
-- Antes de rodar, garanta que em Authentication → Providers:
--   - Email: "Confirm email" está ligado (padrão).
--   - Anonymous Sign-Ins: está ativado.
-- E crie um bucket de Storage público chamado "avatars"
-- (Storage → New bucket → marque "Public bucket").

-- ── profiles ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null unique,
  avatar_url text,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ── match_stats (populado a partir da Fase 3/4, schema já pronto) ────────
create table if not exists public.match_stats (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  mode text not null check (mode in ('padrao', 'vulto', 'preto_e_branco', 'anomaly')),
  result text not null check (result in ('win', 'loss')),
  created_at timestamptz not null default now()
);

alter table public.match_stats enable row level security;

drop policy if exists "Users can view their own match stats" on public.match_stats;
create policy "Users can view their own match stats"
  on public.match_stats for select
  using (auth.uid() = profile_id);

drop policy if exists "Users can insert their own match stats" on public.match_stats;
create policy "Users can insert their own match stats"
  on public.match_stats for insert
  with check (auth.uid() = profile_id);

-- ── auto-cria o perfil no cadastro (normal ou anônimo) ────────────────────
-- Usa o nickname enviado em supabase.auth.signUp()/signInAnonymously()
-- (options.data.nickname). Se por acaso faltar (não deveria acontecer pelo
-- fluxo do app), cai num nome genérico em vez de falhar o cadastro.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, is_anonymous)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'nickname',
      'Jogador' || substr(new.id::text, 1, 6)
    ),
    coalesce((new.raw_user_meta_data ->> 'is_anonymous')::boolean, new.is_anonymous, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Storage: bucket "avatars" ──────────────────────────────────────────
-- Crie o bucket público pela UI (Storage → New bucket → "avatars" → Public)
-- antes de rodar as políticas abaixo — elas dependem do bucket já existir.
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Splash Hunt — Fase 2 (salas: criar/entrar, lobby em tempo real)
-- Rode este bloco também no SQL Editor (pode rodar o arquivo inteiro de novo,
-- tudo aqui é idempotente).

-- ── rooms ──────────────────────────────────────────────────────────────
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  mode text not null check (mode in ('padrao', 'vulto', 'preto_e_branco', 'anomaly')),
  host_id uuid not null references public.profiles (id) on delete cascade,
  guest_id uuid references public.profiles (id) on delete set null,
  status text not null default 'waiting' check (status in ('waiting', 'ready', 'playing', 'finished')),
  created_at timestamptz not null default now()
);

create index if not exists rooms_host_id_idx on public.rooms (host_id);
create index if not exists rooms_guest_id_idx on public.rooms (guest_id);

alter table public.rooms enable row level security;

drop policy if exists "Participants can view their room" on public.rooms;
create policy "Participants can view their room"
  on public.rooms for select
  using (host_id = auth.uid() or guest_id = auth.uid());

drop policy if exists "Users can create a room as host" on public.rooms;
create policy "Users can create a room as host"
  on public.rooms for insert
  with check (host_id = auth.uid() and guest_id is null and status = 'waiting');

-- Sem políticas de UPDATE/DELETE: toda transição de estado pós-criação
-- (entrar, sair/cancelar, iniciar) passa pelas funções SECURITY DEFINER
-- abaixo, que fazem suas próprias checagens precisas de auth.uid() — evita
-- o problema de múltiplas políticas RLS permissivas se combinarem por OR
-- entre USING/WITH CHECK de políticas diferentes.

-- ── código de 6 caracteres (sem 0/O/1/I, pra evitar confusão ao digitar) ──
create or replace function public.generate_room_code()
returns text
language sql
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (random() * 32)::int + 1, 1),
    ''
  )
  from generate_series(1, 6);
$$;

create or replace function public.assign_room_code()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  candidate text;
  tries int := 0;
begin
  loop
    candidate := public.generate_room_code();
    exit when not exists (select 1 from public.rooms where code = candidate);
    tries := tries + 1;
    if tries > 20 then
      raise exception 'could_not_generate_room_code';
    end if;
  end loop;
  new.code := candidate;
  return new;
end;
$$;

drop trigger if exists trg_rooms_assign_code on public.rooms;
create trigger trg_rooms_assign_code
  before insert on public.rooms
  for each row execute procedure public.assign_room_code();

-- ── entrar / sair / iniciar (únicos caminhos de mutação pós-criação) ─────
create or replace function public.join_room(p_code text)
returns public.rooms
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(trim(p_code));
  v_room public.rooms;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  update public.rooms
    set guest_id = v_uid, status = 'ready'
    where code = v_code and status = 'waiting' and guest_id is null and host_id <> v_uid
    returning * into v_room;

  if found then
    return v_room;
  end if;

  if not exists (select 1 from public.rooms where code = v_code) then
    raise exception 'room_not_found';
  end if;
  if exists (select 1 from public.rooms where code = v_code and host_id = v_uid) then
    raise exception 'room_is_own';
  end if;
  raise exception 'room_not_joinable';
end;
$$;

create or replace function public.leave_room(p_room_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  delete from public.rooms where id = p_room_id and host_id = v_uid;
  if found then
    return;
  end if;

  update public.rooms set guest_id = null, status = 'waiting'
    where id = p_room_id and guest_id = v_uid;
  if found then
    return;
  end if;

  raise exception 'room_not_found';
end;
$$;

create or replace function public.start_match(p_room_id uuid)
returns public.rooms
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  update public.rooms set status = 'playing'
    where id = p_room_id and host_id = v_uid and guest_id is not null and status = 'ready'
    returning * into v_room;

  if not found then
    raise exception 'match_not_startable';
  end if;

  -- Fase 3: também cria a partida (mode/host/guest copiados da sala nesse
  -- instante) na mesma transação — MatchPage busca por room_id ao montar,
  -- não precisa de nada devolvido daqui além da própria sala.
  insert into public.matches (room_id, mode, host_id, guest_id)
    values (v_room.id, v_room.mode, v_room.host_id, v_room.guest_id);

  return v_room;
end;
$$;

revoke all on function public.join_room(text) from public;
revoke all on function public.leave_room(uuid) from public;
revoke all on function public.start_match(uuid) from public;
grant execute on function public.join_room(text) to authenticated;
grant execute on function public.leave_room(uuid) to authenticated;
grant execute on function public.start_match(uuid) to authenticated;

-- ── habilita Realtime na tabela (idempotente) ─────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;
end $$;

-- Splash Hunt — Fase 3 (partida sincronizada: rodadas, pontuação, timer)
-- Rode este bloco também no SQL Editor (idempotente, pode rodar o arquivo
-- inteiro de novo).

-- ── matches / match_rounds / round_attempts ───────────────────────────────
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  mode text not null check (mode in ('padrao', 'vulto', 'preto_e_branco', 'anomaly')),
  host_id uuid not null references public.profiles (id) on delete cascade,
  guest_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'finished')),
  host_score int not null default 0,
  guest_score int not null default 0,
  winner_id uuid references public.profiles (id),
  current_round int not null default 0,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists matches_room_id_idx on public.matches (room_id);

alter table public.matches enable row level security;
drop policy if exists "Participants can view their match" on public.matches;
create policy "Participants can view their match"
  on public.matches for select
  using (host_id = auth.uid() or guest_id = auth.uid());

create table if not exists public.match_rounds (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  round_number int not null,
  champion_id text not null,
  champion_name text not null,
  skin_num int not null,
  skin_label text not null,
  splash_url text not null,
  status text not null default 'active' check (status in ('active', 'resolved')),
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  host_points int not null default 0,
  guest_points int not null default 0,
  host_finished boolean not null default false,
  guest_finished boolean not null default false
);
create unique index if not exists match_rounds_match_round_idx on public.match_rounds (match_id, round_number);
-- Trava contra duplo-start: só pode existir uma rodada 'active' por partida.
create unique index if not exists match_rounds_one_active_idx
  on public.match_rounds (match_id) where status = 'active';

alter table public.match_rounds enable row level security;
drop policy if exists "Participants can view rounds of their match" on public.match_rounds;
create policy "Participants can view rounds of their match"
  on public.match_rounds for select
  using (exists (
    select 1 from public.matches m
    where m.id = match_rounds.match_id and (m.host_id = auth.uid() or m.guest_id = auth.uid())
  ));

-- match_id fica denormalizado aqui (além de round_id) porque o filtro de
-- Realtime do Supabase só aceita "coluna=eq.valor" simples — sem isso, a
-- página teria que recriar o canal a cada rodada nova em vez de assinar
-- "match_id=eq.<id>" uma única vez pra partida inteira.
create table if not exists public.round_attempts (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.match_rounds (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  champion_id text,
  champion_name text,
  skin_num int,
  skin_label text,
  correct boolean not null default false,
  gave_up boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists round_attempts_match_id_idx on public.round_attempts (match_id);

alter table public.round_attempts enable row level security;
drop policy if exists "Participants can view attempts of their match" on public.round_attempts;
create policy "Participants can view attempts of their match"
  on public.round_attempts for select
  using (exists (
    select 1 from public.matches m
    where m.id = round_attempts.match_id and (m.host_id = auth.uid() or m.guest_id = auth.uid())
  ));

-- Sem política de INSERT/UPDATE/DELETE em nenhuma das três tabelas — tudo
-- passa pelas funções abaixo, mesmo padrão de `rooms`.

-- ── resolve_round: função PRIVADA (sem grant pra authenticated) ──────────
-- Só chamável de dentro de outra SECURITY DEFINER (que já tem EXECUTE
-- implícito como dona da função). Centraliza "essa rodada já pode fechar?"
-- e, se sim, o fechamento + checagem de fim de partida — nunca uma segunda
-- chamada separada do cliente, sempre a mesma transação que resolveu a
-- rodada que causou o fim.
create or replace function public.resolve_round(p_round_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_round public.match_rounds;
  v_match public.matches;
  v_is_vulto boolean;
  v_should_resolve boolean;
  v_winner uuid;
begin
  select * into v_round from public.match_rounds where id = p_round_id for update;
  if not found or v_round.status <> 'active' then
    return;
  end if;

  select * into v_match from public.matches where id = v_round.match_id for update;
  v_is_vulto := v_match.mode in ('vulto', 'anomaly');

  if v_is_vulto then
    v_should_resolve := v_round.host_points > 0 or v_round.guest_points > 0
      or (v_round.host_finished and v_round.guest_finished);
  else
    v_should_resolve := v_round.host_finished and v_round.guest_finished;
  end if;

  if not v_should_resolve then
    return;
  end if;

  update public.match_rounds set status = 'resolved', resolved_at = now()
    where id = p_round_id and status = 'active';

  update public.matches
    set host_score = host_score + v_round.host_points,
        guest_score = guest_score + v_round.guest_points
    where id = v_match.id
    returning * into v_match;

  if (v_is_vulto and (v_match.host_score >= 3 or v_match.guest_score >= 3))
     or (not v_is_vulto and v_round.round_number >= 5) then
    if v_match.host_score > v_match.guest_score then
      v_winner := v_match.host_id;
    elsif v_match.guest_score > v_match.host_score then
      v_winner := v_match.guest_id;
    else
      v_winner := null;
    end if;

    update public.matches set status = 'finished', finished_at = now(), winner_id = v_winner
      where id = v_match.id and status = 'active';

    update public.rooms set status = 'finished' where id = v_match.room_id;
  end if;
end;
$$;

-- ── start_round: só o host, cria a próxima rodada ────────────────────────
create or replace function public.start_round(
  p_match_id uuid,
  p_champion_id text,
  p_champion_name text,
  p_skin_num int,
  p_skin_label text,
  p_splash_url text
)
returns public.match_rounds
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_match public.matches;
  v_round public.match_rounds;
  v_next_round int;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_match from public.matches where id = p_match_id for update;
  if not found or v_match.host_id <> v_uid then
    raise exception 'not_a_participant';
  end if;
  if v_match.status <> 'active' then
    raise exception 'match_already_complete';
  end if;

  v_next_round := v_match.current_round + 1;

  begin
    insert into public.match_rounds
      (match_id, round_number, champion_id, champion_name, skin_num, skin_label, splash_url)
      values (p_match_id, v_next_round, p_champion_id, p_champion_name, p_skin_num, p_skin_label, p_splash_url)
      returning * into v_round;
  exception when unique_violation then
    raise exception 'round_already_active';
  end;

  update public.matches set current_round = v_next_round where id = p_match_id;

  return v_round;
end;
$$;

-- ── submit_attempt: um palpite de verdade (correct calculado no servidor) ─
create or replace function public.submit_attempt(
  p_round_id uuid,
  p_champion_id text,
  p_champion_name text,
  p_skin_num int,
  p_skin_label text
)
returns public.round_attempts
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_round public.match_rounds;
  v_match public.matches;
  v_correct boolean;
  v_points int := 0;
  v_attempt public.round_attempts;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_round from public.match_rounds where id = p_round_id for update;
  if not found then
    raise exception 'round_not_found';
  end if;

  select * into v_match from public.matches where id = v_round.match_id for update;
  if v_match.host_id <> v_uid and v_match.guest_id <> v_uid then
    raise exception 'not_a_participant';
  end if;
  if v_round.status <> 'active' then
    raise exception 'round_not_active';
  end if;
  if (v_match.host_id = v_uid and v_round.host_finished)
     or (v_match.guest_id = v_uid and v_round.guest_finished) then
    raise exception 'already_answered';
  end if;

  v_correct := v_round.champion_id = p_champion_id and v_round.skin_num = p_skin_num;

  insert into public.round_attempts
    (round_id, match_id, profile_id, champion_id, champion_name, skin_num, skin_label, correct)
    values (p_round_id, v_round.match_id, v_uid, p_champion_id, p_champion_name, p_skin_num, p_skin_label, v_correct)
    returning * into v_attempt;

  if v_correct then
    if v_match.mode in ('vulto', 'anomaly') then
      v_points := 1;
    else
      -- 1000 pontos em 0s, decaindo linearmente até 100 pontos aos 25s.
      v_points := greatest(100, 1000 - floor(extract(epoch from (now() - v_round.started_at)) * 36))::int;
    end if;

    if v_match.host_id = v_uid then
      update public.match_rounds set host_finished = true, host_points = v_points where id = p_round_id;
    else
      update public.match_rounds set guest_finished = true, guest_points = v_points where id = p_round_id;
    end if;
  end if;

  perform public.resolve_round(p_round_id);

  return v_attempt;
end;
$$;

-- ── give_up_round: desistência explícita, sem prêmio ─────────────────────
create or replace function public.give_up_round(p_round_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_round public.match_rounds;
  v_match public.matches;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_round from public.match_rounds where id = p_round_id for update;
  if not found then
    raise exception 'round_not_found';
  end if;

  select * into v_match from public.matches where id = v_round.match_id for update;
  if v_match.host_id <> v_uid and v_match.guest_id <> v_uid then
    raise exception 'not_a_participant';
  end if;
  if v_round.status <> 'active' then
    raise exception 'round_not_active';
  end if;
  if (v_match.host_id = v_uid and v_round.host_finished)
     or (v_match.guest_id = v_uid and v_round.guest_finished) then
    raise exception 'already_answered';
  end if;

  insert into public.round_attempts (round_id, match_id, profile_id, gave_up)
    values (p_round_id, v_round.match_id, v_uid, true);

  if v_match.host_id = v_uid then
    update public.match_rounds set host_finished = true where id = p_round_id;
  else
    update public.match_rounds set guest_finished = true where id = p_round_id;
  end if;

  perform public.resolve_round(p_round_id);
end;
$$;

-- ── resolve_round_timeout: revalida o tempo no servidor antes de agir ────
create or replace function public.resolve_round_timeout(p_round_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_round public.match_rounds;
  v_match public.matches;
  v_duration_s int;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_round from public.match_rounds where id = p_round_id;
  if not found or v_round.status <> 'active' then
    return;
  end if;

  select * into v_match from public.matches where id = v_round.match_id;
  if v_match.host_id <> v_uid and v_match.guest_id <> v_uid then
    raise exception 'not_a_participant';
  end if;

  -- Vulto/Anomaly: 1s de flash + 15s de contagem, sequenciais (mesmo total
  -- do modo solo) — não 15s corridos a partir do início da rodada.
  v_duration_s := case when v_match.mode in ('vulto', 'anomaly') then 16 else 25 end;
  if now() < v_round.started_at + (v_duration_s || ' seconds')::interval then
    raise exception 'round_not_expired';
  end if;

  update public.match_rounds set host_finished = true where id = p_round_id and not host_finished;
  update public.match_rounds set guest_finished = true where id = p_round_id and not guest_finished;

  perform public.resolve_round(p_round_id);
end;
$$;

revoke all on function public.start_round(uuid, text, text, int, text, text) from public;
revoke all on function public.submit_attempt(uuid, text, text, int, text) from public;
revoke all on function public.give_up_round(uuid) from public;
revoke all on function public.resolve_round_timeout(uuid) from public;
grant execute on function public.start_round(uuid, text, text, int, text, text) to authenticated;
grant execute on function public.submit_attempt(uuid, text, text, int, text) to authenticated;
grant execute on function public.give_up_round(uuid) to authenticated;
grant execute on function public.resolve_round_timeout(uuid) to authenticated;

-- ── habilita Realtime nas 3 tabelas novas (idempotente) ───────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'match_rounds'
  ) then
    alter publication supabase_realtime add table public.match_rounds;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'round_attempts'
  ) then
    alter publication supabase_realtime add table public.round_attempts;
  end if;
end $$;

-- Splash Hunt — Fase 4 (tela de resultado + revanche)

-- ── rematch_room: só o host, só com sala 'finished' e guest ainda presente ──
create or replace function public.rematch_room(p_room_id uuid)
returns public.rooms
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  update public.rooms set status = 'ready'
    where id = p_room_id and host_id = v_uid and guest_id is not null and status = 'finished'
    returning * into v_room;

  if not found then
    raise exception 'rematch_not_available';
  end if;

  return v_room;
end;
$$;

revoke all on function public.rematch_room(uuid) from public;
grant execute on function public.rematch_room(uuid) to authenticated;
