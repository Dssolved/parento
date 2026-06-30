import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CourseCover from '../components/course/CourseCover'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useAllLessons, useCourses } from '../hooks/useCourses'
import { getCourseAccessState, getLessonAccessState } from '../lib/access'
import { caregiverRoleOptions } from '../lib/caregiverRoles'
import { getStageLabel, stageOptions } from '../lib/stages'
import { supabase } from '../lib/supabase'
import type { CaregiverRole, Course, Lesson, Stage, Subscription } from '../types/database'

type OnboardingStep = 'stage' | 'role' | 'start'

interface StartRecommendation {
  course: Course
  firstLesson: Lesson | null
  to: string
  ctaLabel: string
}

function getStartRecommendation(courses: Course[], lessons: Lesson[], subscription: Subscription): StartRecommendation | null {
  const lessonsByCourseId = new Map<string, Lesson[]>()

  lessons.forEach((lesson) => {
    const courseLessons = lessonsByCourseId.get(lesson.course_id) ?? []
    courseLessons.push(lesson)
    lessonsByCourseId.set(lesson.course_id, courseLessons)
  })

  const accessibleCourse = courses.find((course) => getCourseAccessState(course, subscription).canAccess)
  const course = accessibleCourse ?? courses[0]

  if (!course) return null

  const courseLessons = lessonsByCourseId.get(course.id) ?? []
  const firstLesson = courseLessons.find((lesson) => getLessonAccessState(course, lesson, subscription).canAccess) ?? null

  return {
    course,
    firstLesson,
    to: firstLesson ? `/lesson/${firstLesson.id}` : getCourseAccessState(course, subscription).ctaTo,
    ctaLabel: firstLesson ? 'Перейти к первому уроку' : getCourseAccessState(course, subscription).ctaLabel,
  }
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const [step, setStep] = useState<OnboardingStep>('stage')
  const [selectedStage, setSelectedStage] = useState<Stage | null>(profile?.stage ?? null)
  const [selectedRole, setSelectedRole] = useState<CaregiverRole | null>(profile?.caregiver_role ?? null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const subscription = profile?.subscription ?? 'free'
  const { data: recommendedCourses = [], isLoading: coursesLoading } = useCourses(selectedStage ?? 'all')
  const { data: allLessons = [], isLoading: lessonsLoading } = useAllLessons()
  const startRecommendation = useMemo(
    () => getStartRecommendation(recommendedCourses, allLessons, subscription),
    [allLessons, recommendedCourses, subscription],
  )
  const secondaryRecommendations = recommendedCourses
    .filter((course) => course.id !== startRecommendation?.course.id)
    .slice(0, 2)

  const saveProfile = async (role: CaregiverRole | null = selectedRole) => {
    if (!user) return

    setLoading(true)
    setError('')

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stage: selectedStage,
        caregiver_role: role,
      })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    await refreshProfile()
    setSelectedRole(role)
    setLoading(false)
    setStep('start')
  }

  return (
    <section className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Онбординг</p>
        <h1 className="mt-2 text-4xl font-semibold text-gray-900">Расскажите о себе</h1>
        <p className="mt-3 text-gray-500">
          {step === 'stage'
            ? 'Сначала выберите текущий этап, чтобы Parento показывал более полезные курсы.'
            : step === 'role'
              ? 'Теперь уточните вашу роль. Это поможет мягче настраивать рекомендации без ограничений доступа.'
              : 'Готово. Мы сохранили контекст и подобрали стартовый маршрут.'}
        </p>
      </div>

      {step === 'stage' ? (
        <>
          <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
            {stageOptions.map(({ value, label, description, Icon, tone }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedStage(value)}
                className="text-left"
                disabled={loading}
              >
                <Card
                  className={`h-full p-6 transition hover:-translate-y-0.5 hover:shadow-soft ${
                    selectedStage === value ? 'border-emerald-300 ring-4 ring-emerald-100' : ''
                  }`}
                >
                  <div className={`inline-flex size-12 items-center justify-center rounded-lg border ${tone}`}>
                    <Icon size={24} aria-hidden="true" />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold text-gray-900">{label}</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
                </Card>
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => setStep('role')} disabled={!selectedStage}>
              Дальше
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Выбрать позже
            </Button>
          </div>
        </>
      ) : step === 'role' ? (
        <>
          <div className="mx-auto mt-8 grid max-w-6xl gap-4 md:grid-cols-2 xl:grid-cols-5">
            {caregiverRoleOptions.map(({ value, label, description, Icon, tone }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedRole(value)}
                className="text-left"
                disabled={loading}
              >
                <Card
                  className={`h-full p-5 transition hover:-translate-y-0.5 hover:shadow-soft ${
                    selectedRole === value ? 'border-emerald-300 ring-4 ring-emerald-100' : ''
                  }`}
                >
                  <div className={`inline-flex size-11 items-center justify-center rounded-lg border ${tone}`}>
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-gray-900">{label}</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
                </Card>
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={() => setStep('stage')} disabled={loading}>
              <ArrowLeft size={18} aria-hidden="true" />
              Назад
            </Button>
            <Button onClick={() => saveProfile()} isLoading={loading} disabled={!selectedRole}>
              Сохранить
            </Button>
            <Button variant="ghost" onClick={() => saveProfile(null)} isLoading={loading}>
              Не указывать
            </Button>
          </div>
        </>
      ) : (
        <div className="mx-auto mt-8 max-w-5xl">
          <Card className="overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="bg-emerald-900 p-6 text-white sm:p-8">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-sm font-medium">
                  <CheckCircle2 size={16} aria-hidden="true" />
                  Профиль настроен
                </p>
                <h2 className="mt-5 text-3xl font-semibold">Ваш стартовый маршрут готов</h2>
                <div className="mt-5 grid gap-3 text-sm text-emerald-50">
                  <p>Этап: {getStageLabel(selectedStage)}</p>
                  <p>
                    Роль:{' '}
                    {caregiverRoleOptions.find((option) => option.value === selectedRole)?.shortLabel ?? 'Не указана'}
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {coursesLoading || lessonsLoading ? (
                  <p className="text-gray-500">Подбираем первый курс...</p>
                ) : startRecommendation ? (
                  <>
                    <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
                      <Sparkles size={16} aria-hidden="true" />
                      Рекомендуем начать здесь
                    </p>
                    <div className="mt-5 overflow-hidden rounded-lg border border-gray-100 bg-white">
                      <CourseCover src={startRecommendation.course.cover_url} alt={startRecommendation.course.title} />
                      <div className="p-5">
                        <p className="text-sm font-medium text-gray-500">{getStageLabel(startRecommendation.course.stage)}</p>
                        <h3 className="mt-2 text-2xl font-semibold text-gray-900">{startRecommendation.course.title}</h3>
                        {startRecommendation.course.description && (
                          <p className="mt-2 text-sm leading-6 text-gray-500">{startRecommendation.course.description}</p>
                        )}
                        {startRecommendation.firstLesson && (
                          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                            Первый урок: {startRecommendation.firstLesson.title}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        to={startRecommendation.to}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 font-medium text-white hover:bg-emerald-700"
                      >
                        {startRecommendation.ctaLabel}
                        <ArrowRight size={18} aria-hidden="true" />
                      </Link>
                      <Link
                        to="/dashboard"
                        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-gray-100 px-5 font-medium text-gray-800 hover:bg-gray-200"
                      >
                        Перейти в кабинет
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-semibold text-gray-900">Курсы ещё не добавлены</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      Контекст сохранён. Когда появятся материалы для вашего этапа, они будут видны в кабинете и каталоге.
                    </p>
                    <Button className="mt-6" onClick={() => navigate('/dashboard')}>
                      Перейти в кабинет
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {secondaryRecommendations.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {secondaryRecommendations.map((course) => (
                <Link
                  key={course.id}
                  to={`/course/${course.id}`}
                  className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm hover:border-emerald-200"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {getStageLabel(course.stage)}
                  </p>
                  <h3 className="mt-2 font-semibold text-gray-900">{course.title}</h3>
                  {course.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">{course.description}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mx-auto mt-6 max-w-2xl rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}
    </section>
  )
}
