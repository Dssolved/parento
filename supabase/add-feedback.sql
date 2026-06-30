create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  feedback_type text not null,
  rating integer check (rating between 1 and 5),
  message text not null,
  contact text,
  path text,
  created_at timestamp default now()
);

alter table feedback enable row level security;

drop policy if exists "Anyone can submit feedback" on feedback;
create policy "Anyone can submit feedback"
on feedback
for insert
to anon, authenticated
with check (user_id is null or auth.uid() = user_id);
