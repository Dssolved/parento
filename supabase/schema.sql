create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text default 'user',
  stage text,
  caregiver_role text,
  subscription text default 'free',
  created_at timestamp default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  stage text,
  is_premium boolean default false,
  is_published boolean default false,
  cover_url text,
  created_at timestamp default now()
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses on delete cascade,
  title text not null,
  content text,
  order_index integer default 0,
  is_premium boolean default false,
  is_published boolean default false,
  created_at timestamp default now()
);

create table progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  lesson_id uuid references lessons on delete cascade,
  completed_at timestamp default now(),
  unique(user_id, lesson_id)
);

create table feedback (
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

create policy "Anyone can submit feedback"
on feedback
for insert
to anon, authenticated
with check (user_id is null or auth.uid() = user_id);

create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users
  where id = auth.uid();
end;
$$;

revoke all on function public.delete_current_user() from public;
grant execute on function public.delete_current_user() to authenticated;
