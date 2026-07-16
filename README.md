# Parento

Веб-платформа осознанного родительства с курсами для планирования, беременности и первого года ребенка.

## Стек

- React + Vite + TypeScript
- TailwindCSS
- React Router v6
- TanStack Query v5
- Supabase Auth/Database
- Lucide React

## Запуск

```bash
npm install
npm run dev
```

Локальный адрес по умолчанию:

```text
http://127.0.0.1:5173/
```

## Supabase

1. Скопируйте `.env.example` в `.env`.
2. Заполните:

```text
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

3. Выполните SQL из `supabase/schema.sql`.
4. Для демо-наполнения выполните SQL из `supabase/demo-content.sql`.

Если база уже создана до появления роли пользователя, выполните миграцию:

```sql
alter table profiles
add column if not exists caregiver_role text;
```

Этот SQL также лежит в `supabase/add-caregiver-role.sql`.

Если база уже создана до появления статуса публикации курсов и уроков, выполните миграцию:

```sql
alter table courses add column if not exists is_published boolean;
alter table lessons add column if not exists is_published boolean;
```

Полная миграция лежит в `supabase/add-publishing.sql`.

Если база уже создана до появления удаления аккаунта из профиля, выполните миграцию:

```sql
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
```

Полная миграция лежит в `supabase/add-account-deletion.sql`.

Если база уже создана до появления формы обратной связи, выполните миграцию:

```sql
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
```

Полная миграция лежит в `supabase/add-feedback.sql`.

Если база уже создана до появления адаптивной персонализации по неделям, выполните миграцию `supabase/add-adaptive-weeks.sql`. Она добавляет:

```sql
alter table profiles add column if not exists due_date date;
alter table profiles add column if not exists birth_date date;
alter table courses add column if not exists week_from integer;
alter table courses add column if not exists week_to integer;
alter table lessons add column if not exists week_from integer;
alter table lessons add column if not exists week_to integer;
```

Помимо колонок, скрипт проставляет диапазоны недель демо-курсам и добавляет курсы для конкретных триместров и возрастов малыша, чтобы персонализация была наглядной. Скрипт идемпотентный — повторный запуск безопасен.

Если база уже создана до появления сбора email на главной странице, выполните миграцию:

```sql
create table if not exists waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,
  created_at timestamp default now(),
  unique (email)
);
```

Полная миграция (вместе с RLS-политикой на анонимную вставку) лежит в `supabase/add-waitlist.sql`.

Если база уже создана до появления событийной аналитики, выполните миграцию:

```sql
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  event_name text not null,
  properties jsonb,
  created_at timestamp default now()
);
```

Полная миграция (вместе с RLS-политикой на вставку) лежит в `supabase/add-events.sql`. Продуктовые события (завершение онбординга, прохождение урока, клики по рекомендациям и Premium-кнопкам) пишутся туда через `src/lib/analytics.ts`; pageview-статистика отдельно собирается через Vercel Web Analytics.

## Проверки

```bash
npm run lint
npm run build
npm audit
```

## Документация

- `docs/project-overview.md` - подробный обзор продукта, бизнес-логики, текущего состояния и roadmap.
- `docs/qa-checklist.md` - чеклист ручной проверки пользовательского пути и админки.
