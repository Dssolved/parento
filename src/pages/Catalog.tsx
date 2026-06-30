import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import CourseCard from '../components/course/CourseCard'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useCourses } from '../hooks/useCourses'
import { stageLabels } from '../lib/stages'
import { isSupabaseConfigured } from '../lib/supabase'
import type { Course, Stage } from '../types/database'

type AccessFilter = 'all' | 'free' | 'premium'
type SortOption = 'newest' | 'free-first' | 'premium-first' | 'title'

const stageFilters: Array<Stage | 'all'> = ['all', 'planning', 'pregnancy', 'newborn']

const accessLabels: Record<AccessFilter, string> = {
  all: 'Все',
  free: 'Free',
  premium: 'Premium',
}

const sortLabels: Record<SortOption, string> = {
  newest: 'Новые',
  'free-first': 'Сначала Free',
  'premium-first': 'Сначала Premium',
  title: 'По названию',
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase()
}

function matchesSearch(course: Course, search: string) {
  if (!search) return true

  return `${course.title} ${course.description ?? ''}`.toLowerCase().includes(search)
}

function matchesAccess(course: Course, access: AccessFilter) {
  if (access === 'all') return true
  if (access === 'premium') return course.is_premium
  return !course.is_premium
}

function sortCourses(courses: Course[], sort: SortOption) {
  return [...courses].sort((a, b) => {
    if (sort === 'title') {
      return a.title.localeCompare(b.title, 'ru')
    }

    if (sort === 'free-first') {
      return Number(a.is_premium) - Number(b.is_premium)
    }

    if (sort === 'premium-first') {
      return Number(b.is_premium) - Number(a.is_premium)
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export default function Catalog() {
  const { profile } = useAuth()
  const [stage, setStage] = useState<Stage | 'all'>('all')
  const [access, setAccess] = useState<AccessFilter>('all')
  const [sort, setSort] = useState<SortOption>('newest')
  const [search, setSearch] = useState('')
  const { data: courses = [], isLoading, error } = useCourses(stage)
  const normalizedSearch = normalizeSearch(search)
  const filteredCourses = useMemo(
    () =>
      sortCourses(
        courses.filter((course) => matchesSearch(course, normalizedSearch) && matchesAccess(course, access)),
        sort,
      ),
    [access, courses, normalizedSearch, sort],
  )
  const hasActiveFilters = Boolean(normalizedSearch) || access !== 'all' || stage !== 'all' || sort !== 'newest'

  const resetFilters = () => {
    setStage('all')
    setAccess('all')
    setSort('newest')
    setSearch('')
  }

  return (
    <section className="container-page py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Каталог</p>
          <h1 className="mt-2 text-4xl font-semibold text-gray-900">Курсы Parento</h1>
          <p className="mt-3 max-w-2xl text-gray-500">Выбирайте материалы по этапу и продолжайте с того места, где остановились.</p>
        </div>
        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
          <SlidersHorizontal size={17} aria-hidden="true" />
          {profile?.stage ? `Ваш этап: ${stageLabels[profile.stage]}` : 'Этап можно выбрать в профиле'}
        </div>
      </div>

      <Card className="mt-8 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <label className="block space-y-2">
            <span className="form-label">Поиск</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                className="form-input pl-10"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Название или описание курса"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Очистить поиск"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </label>

          <label className="block space-y-2">
            <span className="form-label">Сортировка</span>
            <select
              className="form-input"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
            >
              {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                <option key={option} value={option}>
                  {sortLabels[option]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)]">
          <div>
            <p className="form-label mb-2">Этап</p>
            <div className="flex flex-wrap gap-2">
              {stageFilters.map((filter) => (
                <Button
                  key={filter}
                  variant={stage === filter ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setStage(filter)}
                >
                  {stageLabels[filter]}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="form-label mb-2">Доступ</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(accessLabels) as AccessFilter[]).map((filter) => (
                <Button
                  key={filter}
                  variant={access === filter ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setAccess(filter)}
                >
                  {accessLabels[filter]}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Найдено: <span className="font-semibold text-gray-900">{filteredCourses.length}</span> из {courses.length}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-800"
            >
              <X size={16} aria-hidden="true" />
              Сбросить фильтры
            </button>
          )}
        </div>
      </Card>

      {!isSupabaseConfigured && (
        <Card className="mt-8 p-5">
          <p className="font-medium text-gray-900">Supabase пока не подключен</p>
          <p className="mt-2 text-sm text-gray-500">Заполните `.env` по примеру `.env.example`, затем создайте таблицы и seed-данные.</p>
        </Card>
      )}

      {isLoading && <p className="mt-10 text-gray-500">Загружаем курсы...</p>}
      {error && <p className="mt-10 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">Не удалось загрузить курсы.</p>}

      {!isLoading && courses.length === 0 && isSupabaseConfigured && (
        <Card className="mt-8 p-8 text-center">
          <p className="font-medium text-gray-900">Курсов пока нет</p>
          <p className="mt-2 text-sm text-gray-500">Добавьте первые записи через Supabase или страницу администратора.</p>
        </Card>
      )}

      {!isLoading && courses.length > 0 && filteredCourses.length === 0 && (
        <Card className="mt-8 p-8 text-center">
          <p className="font-medium text-gray-900">Ничего не найдено</p>
          <p className="mt-2 text-sm text-gray-500">Попробуйте изменить запрос, этап или фильтр доступа.</p>
          <Button variant="secondary" className="mt-5" onClick={resetFilters}>
            Сбросить фильтры
          </Button>
        </Card>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            userSubscription={profile?.subscription ?? 'free'}
          />
        ))}
      </div>
    </section>
  )
}
