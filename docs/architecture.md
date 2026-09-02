# Техническая карта проекта

Дата среза: 2026-09-02. Дополняет [current-state.md](./current-state.md) (состояние и что делать
дальше) и [decisions.md](./decisions.md) (почему сделано именно так).

---

## 1. Стек

| Слой | Технология |
|---|---|
| UI | React 19.2, TypeScript 5.8, TailwindCSS 3.4 |
| Роутинг | react-router-dom 6.30 (v6 API, флаги v7 не включены) |
| Данные | TanStack Query v5, Supabase JS 2.110 |
| Сборка | Vite 6.4, `@vitejs/plugin-react` 4.7 |
| Линт | oxlint 1.74 (не ESLint) |
| Бэкенд | Supabase: Postgres + Auth |
| Аналитика | Vercel Web Analytics (pageviews) + собственная таблица `events` (продуктовые события) |
| Хостинг | Vercel, SPA-rewrite в `vercel.json` |
| Markdown | react-markdown + remark-gfm |
| Иконки | lucide-react |

Тестового фреймворка в проекте **нет**. Проверки: `npx tsc -b`, `npm run lint`, `npm run build`.

---

## 2. Структура исходников

```
src/
├── App.tsx                      Роуты + PrivateRoute/AdminRoute гейты
├── main.tsx                     Точка входа, QueryClientProvider, <Analytics/>
├── index.css                    Tailwind + утилиты .container-page / .form-input / .form-label
│
├── context/
│   └── AuthContext.tsx          user + profile + loading + refreshProfile.
│                                Здесь же ленивый откат истёкшего Premium (см. §5.1)
├── hooks/
│   ├── useAuth.ts               Ре-экспорт useAuth из AuthContext
│   ├── useCourses.ts            useCourses(stage) / useCourse(id) / useLessons(courseId) /
│   │                            useAllLessons() / useLesson(id) — все на TanStack Query
│   ├── useProgress.ts           useProgress(userId) + useCompleteLesson() (upsert в progress)
│   └── useRecommendedCourses.ts Подбор курсов под текущую неделю (см. §5.2)
│
├── lib/
│   ├── supabase.ts              Клиент + флаг isSupabaseConfigured
│   ├── auth.ts                  Правила пароля, человекочитаемые ошибки авторизации
│   ├── access.ts                Free/Premium-гейт: canAccessCourse/Lesson,
│   │                            getCourseAccessState/getLessonAccessState (label, CTA, куда вести)
│   ├── weekCalculations.ts      Вся математика недель (см. §5.2)
│   ├── analytics.ts             logEvent() — запись продуктовых событий в Supabase
│   ├── pluralize.ts             Русские склонения числительных (одна на проект, без дублей)
│   ├── stages.ts                stageLabels / stageOptions / getStageLabel
│   └── caregiverRoles.ts        Роли в семье: опции и подписи
│
├── components/
│   ├── ui/                      Button, Card, Badge, DatePicker (кастомный календарь)
│   ├── layout/                  Navbar (с мобильным burger), Footer
│   ├── course/                  CourseCard, CourseCover, LessonItem, MarkdownContent
│   └── landing/
│       └── WeekDemo.tsx         Интерактивное демо персонализации, полностью на клиенте
│
├── pages/                       Landing, About, Feedback, Login, Register, LegalPage,
│                                Onboarding, Dashboard, Catalog, CoursePage, LessonPage,
│                                Subscribe, Profile, Admin
└── types/
    └── database.ts              Все типы БД + *Insert-типы
```

### Соглашения

- Страницы лениво грузятся через `lazy()` в `App.tsx`.
- Каждая новая таблица получает `*Insert`-тип в `src/types/database.ts`.
- Логика, которую можно вынести из компонента, живёт в `src/lib/*` чистыми функциями
  (так её удаётся проверять без браузера/логина).
- Миграции — отдельные файлы `supabase/add-<фича>.sql`, идемпотентные где возможно.
  Каждая упоминается в `README.md`.

---

## 3. Модель данных

`supabase/schema.sql` — **базовая** схема. Колонки ниже, помеченные миграцией, добавляются
отдельными файлами (см. [supabase-migrations.md](./supabase-migrations.md)).

### profiles

| Колонка | Тип | Откуда |
|---|---|---|
| `id` | uuid PK → `auth.users` | schema |
| `email`, `full_name` | text | schema |
| `role` | text, `user` \| `admin` | schema |
| `stage` | text, `planning` \| `pregnancy` \| `newborn` | schema |
| `caregiver_role` | text, mother/father/partner/caregiver/prefer_not_to_say | `add-caregiver-role` |
| `subscription` | text, `free` \| `premium` | schema |
| `due_date` | date, ПДР — только для stage=pregnancy | `add-adaptive-weeks` |
| `birth_date` | date, дата рождения — только для stage=newborn | `add-adaptive-weeks` |
| `premium_expires_at` | timestamp, конец пробного Premium | `add-premium-trial` |
| `created_at` | timestamp | schema |

### courses

`id`, `title`, `description`, `stage` (+ спец-значение `all`), `is_premium`, `is_published`,
`cover_url`, `created_at` — из schema; `is_published` доводится миграцией `add-publishing`.

| Колонка | Смысл | Откуда |
|---|---|---|
| `week_from` / `week_to` | integer, диапазон актуальности. Для stage=pregnancy — гестационные недели 1–42; для stage=newborn — недели возраста 0–52. `null` = курс не привязан к неделе | `add-adaptive-weeks` |

### lessons

`id`, `course_id` → courses, `title`, `content` (Markdown), `order_index`, `is_premium`,
`is_published`, `created_at`, плюс `week_from` / `week_to` (`add-adaptive-weeks`) —
**в MVP не используются в фильтрации**, заведены на будущее.

### progress

`id`, `user_id` → profiles, `lesson_id` → lessons, `completed_at`, `unique(user_id, lesson_id)`.
Запись = урок пройден. Пишется через `useCompleteLesson` (upsert с `ignoreDuplicates`).

### feedback

`add-feedback`: `user_id` (nullable — можно оставить отзыв анонимно), `feedback_type`
(general/bug/ux/content/idea), `rating` 1–5, `message`, `contact`, `path`, `created_at`.
RLS: политика только на insert.

### waitlist_signups

`add-waitlist`: `id`, `email` (unique), `source`, `created_at`. Сбор email с лендинга.
RLS: только insert для anon/authenticated. Дубликат email обрабатывается на клиенте как успех
(код ошибки Postgres `23505`).

### events

`add-events`: `id`, `user_id` (nullable), `event_name`, `properties` jsonb, `created_at`.
RLS: только insert. Поверх таблицы — вьюхи из `add-analytics-views` (см. §5.3).

### ⚠️ RLS

Включена только у `feedback`, `waitlist_signups`, `events`. У `profiles`, `courses`, `lessons`,
`progress` RLS **нет** — см. риск в [current-state.md §4.1](./current-state.md#41--rls-включена-не-на-всех-таблицах--платный-контент-технически-открыт).

---

## 4. Роутинг и гейты доступа

`src/App.tsx`:

- **Публичные**: `/`, `/about`, `/feedback`, `/login`, `/register`, `/legal/:slug`.
- **`PrivateRoute`** (нужен `user`, иначе редирект на `/login`): `/onboarding`, `/dashboard`,
  `/catalog`, `/course/:id`, `/lesson/:id`, `/subscribe`, `/profile`.
- **`AdminRoute`** (нужен `profile.role === 'admin'`, иначе редирект на `/`): `/admin`.
- `*` → редирект на `/`.

Free/Premium-гейт — `src/lib/access.ts`. Функции возвращают не только `canAccess`, но и готовые
`label` / `description` / `ctaLabel` / `ctaTo`, поэтому страницы не собирают эти строки сами.
Правило: доступ есть, если подписка `premium` **или** ни курс, ни урок не помечены `is_premium`.

Ещё раз: оба гейта — клиентские. Это UX, не безопасность.

---

## 5. Ключевые механики

### 5.1. Жизненный цикл профиля и пробный Premium

`AuthContext` слушает `supabase.auth.onAuthStateChange` и при появлении сессии грузит профиль
через `fetchProfile`. Внутри `fetchProfile` живёт **ленивый откат Premium**:

```
профиль загружен
   └─ subscription === 'premium' && premium_expires_at в прошлом?
         └─ да → update profiles set subscription='free', premium_expires_at=null
                 и локально подменяем объект перед setProfile
```

Почему так, а не cron: см. решение **D8** в [decisions.md](./decisions.md). Практическое следствие —
все проверки доступа продолжают читать просто `profile.subscription`, ничего про сроки не зная.

Активация триала — `Subscribe.tsx`, `TRIAL_DAYS = 7`. Кнопка блокируется, пока Premium активен,
поэтому продлить триал через интерфейс нельзя.

### 5.2. Персонализация по неделям

Файл `src/lib/weekCalculations.ts`:

| Функция | Что делает |
|---|---|
| `getPregnancyWeek(dueDate)` | Гестационная неделя от ПДР: ПДР − 280 дней = точка отсчёта, результат зажат в 1–42 |
| `getBabyAgeWeeks(birthDate)` | Полных недель с даты рождения, зажато в 0–52 |
| `getCurrentUserWeek(profile)` | Универсально по `stage`: pregnancy → от `due_date`, newborn → от `birth_date`, иначе `null` |
| `isRelevantForWeek(course, week)` | Мягкая проверка: курс без диапазона считается актуальным всегда |
| `isTimelyForWeek(course, week)` | Строгая: диапазон обязателен, `null` → `false`. Именно она питает «Актуально сейчас» |
| `getWeekRangeLabel(course)` | Подпись плашки: «Неделя 14–27» для pregnancy, «6–18 нед. малышу» для newborn |

Пайплайн секции «Актуально сейчас»:

```
profile.due_date / birth_date
   └─ getCurrentUserWeek() → currentWeek | null
        └─ useRecommendedCourses(profile, stage)
             ├─ useCourses(stage) — курсы этапа
             ├─ фильтр isTimelyForWeek(course, currentWeek)
             └─ сортировка: узкое окно выше широкого
                  └─ Catalog / Dashboard: секция + плашка недели
                     currentWeek === null и stage=pregnancy|newborn → подсказка заполнить дату
                     stage=planning → ничего не показываем
```

Фильтр недель в каталоге (`Catalog.tsx`) — три режима (`all` / `mine` / `manual`), доступен только
при выбранном конкретном этапе pregnancy или newborn. Режим `mine` дополнительно требует, чтобы
выбранный в каталоге этап совпадал с этапом профиля, и сравнивает неделю только с курсами того же
этапа (иначе недели беременности сравнивались бы с неделями возраста — см. решение **D4** в
[decisions.md](./decisions.md)).

### 5.3. Аналитика

Два независимых канала:

**Pageviews** — `<Analytics />` из `@vercel/analytics/react` в `main.tsx`. Автоматически ловит и
первую загрузку, и клиентские переходы роутера. В dev работает в debug-режиме (пишет в консоль,
никуда не отправляет).

**Продуктовые события** — `logEvent(name, properties, userId)` из `src/lib/analytics.ts`,
вставка в таблицу `events`. Fire-and-forget: не блокирует UI, ошибку пишет в консоль (и подсказывает
про миграцию, если таблицы нет).

| Событие | Где вызывается | properties |
|---|---|---|
| `onboarding_completed` | `Onboarding.saveProfile()` | `stage`, `has_date` |
| `lesson_completed` | `LessonPage.handleComplete()` | `lesson_id`, `course_id`, `is_premium` |
| `recommended_course_clicked` | `CourseCard`, если передан проп `analyticsSource` | `source`, `course_id`, `stage` |
| `premium_cta_clicked` | CoursePage, LessonPage (×2), Profile, Dashboard, Landing | `source` (+ `course_id`/`lesson_id` где есть) |

`analyticsSource` у `CourseCard` — **opt-in**: проставлен только в секциях «Актуально сейчас»
(`catalog_recommended`, `dashboard_recommended`), в общем каталоге клики намеренно не трекаются,
чтобы метрика отвечала ровно на вопрос «работает ли персонализация».

Смотреть метрики — через вьюхи `supabase/add-analytics-views.sql`:
`v_onboarding_completed`, `v_activation_funnel`, `v_lesson_completions_by_user`,
`v_recommended_course_clicks`, `v_daily_events`, `v_premium_cta_clicks`, `v_premium_conversion`.

### 5.4. Публикация контента

Курсы и уроки создаются черновиками. Пользовательские запросы (`useCourses`, `useLessons`, …)
всегда фильтруют `is_published = true`; админка читает всё через отдельные ключи запросов
(`admin-courses`, `admin-lessons`). Урок виден, только если опубликован и он сам, и его курс.

### 5.5. Демо-виджет на лендинге

`WeekDemo.tsx` считает всё на клиенте по **захардкоженному** массиву демо-курсов, повторяющему
диапазоны из `add-adaptive-weeks.sql`. Никаких обращений к Supabase: виджет обязан работать даже
если миграция не накатана и БД недоступна. Карточки некликабельны — у них нет реальных ID.
При правке реальных диапазонов курсов имеет смысл синхронизировать и этот массив.

---

## 6. Внешние зависимости и конфиги

- `.env` (не в git): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Пример — `.env.example`.
  Если не заполнены, `isSupabaseConfigured === false` и приложение показывает заглушки вместо падения.
- `vercel.json` — SPA-rewrite всех путей в `index.html`.
- `tailwind.config.js`, `postcss.config.js` — стандартные для Tailwind 3.
- `public/favicon.svg` — брендовая emerald-иконка (совпадает с логотипом в Navbar).
- `.claude/launch.json` — конфиг превью-сервера ассистента (порт 5199), **не коммитится**.
