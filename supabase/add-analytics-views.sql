-- Готовые SQL-вьюхи поверх таблицы events (см. supabase/add-events.sql).
-- Выполнить один раз в Supabase SQL Editor. Дальше метрики смотрятся так:
--   select * from v_recommended_course_clicks;
-- Скрипт идемпотентный (create or replace view) — повторный запуск безопасен.

-- =============================================================================
-- ACTIVATION
-- =============================================================================

-- Онбординг по дням: сколько завершили, по какому этапу, указали ли дату.
create or replace view v_onboarding_completed as
select
  date_trunc('day', created_at) as day,
  properties->>'stage' as stage,
  (properties->>'has_date')::boolean as has_date,
  count(*) as completions,
  count(distinct user_id) as unique_users
from events
where event_name = 'onboarding_completed'
group by 1, 2, 3
order by 1 desc;

-- Воронка активации: регистрация -> онбординг -> первый пройденный урок.
create or replace view v_activation_funnel as
select
  (select count(*) from profiles) as total_registered,
  (select count(distinct user_id) from events where event_name = 'onboarding_completed') as completed_onboarding,
  (select count(distinct user_id) from progress) as completed_first_lesson;

-- =============================================================================
-- ENGAGEMENT
-- =============================================================================

-- Прохождение уроков по пользователям.
create or replace view v_lesson_completions_by_user as
select
  user_id,
  count(*) as lessons_completed,
  min(created_at) as first_completed_at,
  max(created_at) as last_completed_at
from events
where event_name = 'lesson_completed'
group by user_id
order by lessons_completed desc;

-- Клики по секции "Актуально сейчас" — ключевая метрика: работает ли
-- персонализация по неделям. source: catalog_recommended / dashboard_recommended.
create or replace view v_recommended_course_clicks as
select
  properties->>'source' as source,
  count(*) as clicks,
  count(distinct user_id) as unique_users
from events
where event_name = 'recommended_course_clicked'
group by 1
order by clicks desc;

-- Общий пульс: события по дням, чтобы видеть активность без разбора по типам.
create or replace view v_daily_events as
select
  date_trunc('day', created_at) as day,
  event_name,
  count(*) as events,
  count(distinct user_id) as unique_users
from events
group by 1, 2
order by 1 desc, 2;

-- =============================================================================
-- MONETIZATION
-- =============================================================================

-- Клики по Premium-CTA с разбивкой, откуда кликнули.
-- source: course_page / lesson_page / lesson_next_locked / profile / dashboard_banner / landing_pricing.
create or replace view v_premium_cta_clicks as
select
  properties->>'source' as source,
  count(*) as clicks,
  count(distinct user_id) as unique_users
from events
where event_name = 'premium_cta_clicked'
group by 1
order by clicks desc;

-- Грубая конверсия "кликнул по Premium -> сейчас Premium".
-- Не учитывает порядок событий во времени, это ориентир, а не точная атрибуция.
create or replace view v_premium_conversion as
select
  count(distinct e.user_id) as users_clicked_premium_cta,
  count(distinct p.id) filter (where p.subscription = 'premium') as of_which_became_premium
from events e
join profiles p on p.id = e.user_id
where e.event_name = 'premium_cta_clicked';
