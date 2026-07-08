-- Run in Supabase SQL Editor after 001_profiles.sql
-- Required for multiplayer presence + chat on channel "world:main"

drop policy if exists "world_realtime_listen" on realtime.messages;
drop policy if exists "world_realtime_send" on realtime.messages;

create policy "world_realtime_listen"
  on realtime.messages
  for select
  to authenticated
  using (realtime.topic() = 'world:main');

create policy "world_realtime_send"
  on realtime.messages
  for insert
  to authenticated
  with check (realtime.topic() = 'world:main');
