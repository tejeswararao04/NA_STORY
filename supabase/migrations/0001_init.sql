-- NA Story initial schema. Run in Supabase SQL editor (free tier).
-- Auth uses supabase auth.users; profiles mirrors it.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null default 'Untitled story',
  prompt text not null default '',
  story_text text not null default '',
  photo_url text,
  voice_url text,
  source text not null default 'mock', -- mock | gemini-direct | ai-service | finetuned
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.stories enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own stories" on public.stories;
create policy "own stories" on public.stories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage buckets (create in Dashboard > Storage, then run policies):
--   photos (public? no — private), voice-notes (private)
-- insert into storage.buckets (id, name, public) values ('photos','photos', false), ('voice-notes','voice-notes', false)
-- on conflict (id) do nothing;
