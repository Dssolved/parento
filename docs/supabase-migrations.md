# Supabase: схема и миграции

Дата среза: 2026-09-02.

Все SQL лежит в папке `supabase/` и выполняется вручную через **Supabase → SQL Editor**.
Автоматического механизма миграций в проекте нет (сознательно — см.
[decisions.md D14](./decisions.md#d14-schemasql-оставлен-базовым-изменения-живут-в-миграциях)).

---

## 1. Порядок для новой базы

`schema.sql` — **базовый**, он не содержит изменений из миграций. Полная установка с нуля:

```
1. schema.sql                 базовые таблицы, RLS для feedback, функция удаления аккаунта
2. add-caregiver-role.sql     profiles.caregiver_role
3. add-publishing.sql         is_published у courses и lessons
4. add-account-deletion.sql   RPC delete_current_user() (уже есть в schema.sql, файл — для старых баз)
5. add-feedback.sql           таблица feedback (уже есть в schema.sql, файл — для старых баз)
6. demo-content.sql           демо-контент: 6 курсов + уроки
7. add-adaptive-weeks.sql     колонки недель + диапазоны демо-курсам + 5 новых курсов с уроками
8. add-waitlist.sql           таблица waitlist_signups
9. add-events.sql             таблица events
10. add-analytics-views.sql   7 вьюх поверх events (нужен шаг 9)
11. add-premium-trial.sql     profiles.premium_expires_at
```

Шаги 4 и 5 дублируют то, что уже есть в `schema.sql` — они нужны только для баз, созданных
до появления этих фич. На чистой базе их можно пропустить.

---

## 2. Проверка, что уже применено

Один запрос показывает состояние всех «новых» миграций:

```sql
select
  to_regclass('public.events')              as events_table,
  to_regclass('public.waitlist_signups')    as waitlist_table,
  to_regclass('public.v_activation_funnel') as analytics_views,
  (select count(*) from information_schema.columns
     where table_name = 'profiles' and column_name = 'premium_expires_at') as premium_trial_col,
  (select count(*) from information_schema.columns
     where table_name = 'courses' and column_name = 'week_from')           as adaptive_weeks_col,
  (select count(*) from courses where week_from is not null)               as courses_with_weeks;
```

`null` в колонках-таблицах или `0` в колонках-счётчиках означает, что миграция не накатана.

Отдельно полезно: `courses_with_weeks` должно быть **> 0**. Если колонки есть, а счётчик нулевой —
значит `add-adaptive-weeks.sql` отработал частично (только `alter table`), и персонализация
работать не будет. Именно так выглядела ошибка из
[decisions.md D1](./decisions.md#d1-uuid-курсов-из-исходного-тз--выдуманные-миграция-переписана-под-реальные).

---

## 3. Что делает каждый файл

| Файл | Содержание | Идемпотентен |
|---|---|---|
| `schema.sql` | Таблицы `profiles`, `courses`, `lessons`, `progress`, `feedback`. RLS + insert-политика для `feedback`. Функция `delete_current_user()` | Нет (`create table` без `if not exists`) |
| `add-caregiver-role.sql` | `profiles.caregiver_role` | Да |
| `add-publishing.sql` | `is_published` у `courses` / `lessons`, проставляет `true` существующим, затем `default false` + `not null` | Да |
| `add-account-deletion.sql` | RPC `delete_current_user()` (`security definer`, удаляет текущего пользователя из `auth.users`, остальное каскадом) | Да (`create or replace`) |
| `add-feedback.sql` | Таблица `feedback` + RLS-политика на insert | Да |
| `demo-content.sql` | Удаляет и заново вставляет 6 демо-курсов и их уроки | Да (delete + insert по фиксированным ID) |
| `add-adaptive-weeks.sql` | `due_date`/`birth_date` в `profiles`; `week_from`/`week_to` в `courses` и `lessons`; диапазоны существующим демо-курсам; **5 новых курсов** (первый/второй триместр, питание, 2–4 мес, полгода) с уроками | Да |
| `add-waitlist.sql` | Таблица `waitlist_signups` (unique по email) + RLS insert | Да |
| `add-events.sql` | Таблица `events` (`user_id`, `event_name`, `properties` jsonb) + RLS insert | Да |
| `add-analytics-views.sql` | 7 вьюх: `v_onboarding_completed`, `v_activation_funnel`, `v_lesson_completions_by_user`, `v_recommended_course_clicks`, `v_daily_events`, `v_premium_cta_clicks`, `v_premium_conversion` | Да (`create or replace view`) |
| `add-premium-trial.sql` | `profiles.premium_expires_at` | Да |

`seed-courses.json` — старый черновой список из 5 курсов без ID. В текущем процессе **не используется**,
актуальный источник демо-данных — `demo-content.sql` + `add-adaptive-weeks.sql`.

---

## 4. Состав контента после всех миграций

11 опубликованных курсов:

**planning** (недели неприменимы, диапазон `null`)
- Старт перед беременностью (free)
- Партнёрский план подготовки (premium)

**pregnancy** (гестационные недели 1–42)
- Беременность спокойно по триместрам — `null` (сквозной «якорь», только общий каталог)
- Первый триместр: бережный старт — 1–13
- Второй триместр: силы и планы — 14–27
- Питание и самочувствие мамы — 6–36 (premium)
- Подготовка к родам и восстановлению — 32–42 (premium)

**newborn** (недели возраста 0–52)
- Сон и развитие до года — `null` (сквозной «якорь»)
- Первый месяц с малышом — 0–6
- Малыш 2–4 месяца: ритмы и контакт — 6–18
- Полгода: прикорм и первые движения — 20–34 (premium)

Проверка распределения:

```sql
select stage, title, week_from, week_to, is_premium
from courses
where is_published = true
order by stage, week_from nulls first;
```

---

## 5. Как смотреть метрики

После `add-events.sql` и `add-analytics-views.sql`:

```sql
-- работает ли персонализация: клики из «Актуально сейчас»
select * from v_recommended_course_clicks;

-- откуда жмут Premium
select * from v_premium_cta_clicks;

-- воронка активации: регистрация → онбординг → первый урок
select * from v_activation_funnel;

-- общий пульс по дням
select * from v_daily_events;
```

Назначение каждой вьюхи расписано комментариями внутри `add-analytics-views.sql`.

---

## 6. Открытый вопрос: RLS

RLS сейчас включена только у `feedback`, `waitlist_signups` и `events`, и только на вставку.
`profiles`, `courses`, `lessons`, `progress` доступны через анонимный ключ без ограничений.
Это значит, что Premium-контент и чужие профили технически читаются в обход интерфейса.

Подробности и последствия — [current-state.md §4.1](./current-state.md#41--rls-включена-не-на-всех-таблицах--платный-контент-технически-открыт).
Отдельной миграции под это пока нет, задача не бралась в работу.
