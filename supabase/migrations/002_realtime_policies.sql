-- Run in Supabase SQL Editor after 001_profiles.sql
-- Required for multiplayer presence + chat

drop policy if exists "world_realtime_listen" on realtime.messages;
drop policy if exists "world_realtime_send" on realtime.messages;
drop policy if exists "authenticated_realtime_listen" on realtime.messages;
drop policy if exists "authenticated_realtime_send" on realtime.messages;

-- Permissive policies (recommended by Supabase docs for getting started)
create policy "authenticated_realtime_listen"
  on realtime.messages
  for select
  to authenticated
  using (true);

create policy "authenticated_realtime_send"
  on realtime.messages
  for insert
  to authenticated
  with check (true);
