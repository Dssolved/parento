create table if not exists waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,
  created_at timestamp default now(),
  unique (email)
);

alter table waitlist_signups enable row level security;

create policy "Anyone can join waitlist"
on waitlist_signups
for insert
to anon, authenticated
with check (true);
