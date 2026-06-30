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

## Проверки

```bash
npm run lint
npm run build
npm audit
```

## Документация

- `docs/project-overview.md` - подробный обзор продукта, бизнес-логики, текущего состояния и roadmap.
- `docs/pitch.md` - рабочий питч проекта и базовый анализ рынка/модели.
- `docs/qa-checklist.md` - чеклист ручной проверки пользовательского пути и админки.
