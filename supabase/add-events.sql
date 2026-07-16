create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  event_name text not null,
  properties jsonb,
  created_at timestamp default now()
);

alter table events enable row level security;

create policy "Anyone can log events"
on events
for insert
to anon, authenticated
with check (user_id is null or auth.uid() = user_id);
