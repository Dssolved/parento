import { Check, Crown } from 'lucide-react'
import { useMemo, useState } from 'react'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import { getWeekRangeLabel, isTimelyForWeek } from '../../lib/weekCalculations'

type WeekStage = 'pregnancy' | 'newborn'

interface DemoCourse {
  title: string
  is_premium: boolean
  week_from: number
  week_to: number
}

const stageMeta: Record<WeekStage, { label: string; min: number; max: number; defaultWeek: number }> = {
  pregnancy: { label: 'Беременность', min: 1, max: 42, defaultWeek: 20 },
  newborn: { label: 'Малыш до года', min: 0, max: 52, defaultWeek: 10 },
}

// Демо-данные: диапазоны совпадают по смыслу с реальными курсами
// из supabase/add-adaptive-weeks.sql. Виджет считает всё на клиенте,
// без обращения к базе, поэтому работает всегда.
const demoCourses: Record<WeekStage, DemoCourse[]> = {
  pregnancy: [
    { title: 'Первый триместр: бережный старт', is_premium: false, week_from: 1, week_to: 13 },
    { title: 'Второй триместр: силы и планы', is_premium: false, week_from: 14, week_to: 27 },
    { title: 'Питание и самочувствие мамы', is_premium: true, week_from: 6, week_to: 36 },
    { title: 'Подготовка к родам', is_premium: false, week_from: 32, week_to: 42 },
  ],
  newborn: [
    { title: 'Первый месяц с малышом', is_premium: false, week_from: 0, week_to: 6 },
    { title: 'Ритмы сна и контакт', is_premium: false, week_from: 6, week_to: 18 },
    { title: 'Полгода: прикорм и движение', is_premium: true, week_from: 20, week_to: 34 },
    { title: 'Ближе к году: первые шаги и слова', is_premium: false, week_from: 36, week_to: 52 },
  ],
}

function weekLabel(stage: WeekStage, week: number) {
  return stage === 'pregnancy' ? `${week}-я неделя беременности` : `${week} нед. малышу`
}

export default function WeekDemo() {
  const [stage, setStage] = useState<WeekStage>('pregnancy')
  const [week, setWeek] = useState(stageMeta.pregnancy.defaultWeek)

  const meta = stageMeta[stage]
  const courses = demoCourses[stage]
  const activeCount = useMemo(
    () => courses.filter((course) => isTimelyForWeek(course, week)).length,
    [courses, week],
  )

  const selectStage = (nextStage: WeekStage) => {
    setStage(nextStage)
    setWeek(stageMeta[nextStage].defaultWeek)
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(stageMeta) as WeekStage[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => selectStage(value)}
            className={`inline-flex min-h-10 items-center rounded-lg px-4 text-sm font-medium transition ${
              stage === value
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {stageMeta[value].label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="form-label">Передвиньте ползунок — контент подстроится</span>
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            {weekLabel(stage, week)}
          </span>
        </div>
        <input
          type="range"
          min={meta.min}
          max={meta.max}
          value={week}
          onChange={(event) => setWeek(Number(event.target.value))}
          className="mt-3 w-full accent-emerald-600"
          aria-label="Неделя"
        />
        <p className="mt-2 text-sm text-gray-500">
          Для этой недели актуально курсов: <span className="font-semibold text-gray-900">{activeCount}</span> из{' '}
          {courses.length}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {courses.map((course) => {
          const active = isTimelyForWeek(course, week)
          const rangeLabel = getWeekRangeLabel({ stage, week_from: course.week_from, week_to: course.week_to })

          return (
            <div
              key={course.title}
              className={`rounded-lg border p-4 transition-all duration-300 ${
                active ? 'border-emerald-200 bg-white shadow-sm' : 'border-gray-100 bg-gray-50 opacity-45'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={stage} />
                  {course.is_premium && <Badge variant="premium" />}
                </div>
                {active && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <Check size={14} aria-hidden="true" />
                    Актуально
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-semibold text-gray-900">{course.title}</h3>
              {rangeLabel && <p className="mt-1 text-sm text-gray-500">{rangeLabel}</p>}
              {course.is_premium && (
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-gray-400">
                  <Crown size={13} aria-hidden="true" />
                  Premium
                </p>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-6 text-xs leading-5 text-gray-400">
        Это пример на демо-курсах. После регистрации вы увидите подборку по вашему реальному сроку и полный каталог.
      </p>
    </Card>
  )
}
