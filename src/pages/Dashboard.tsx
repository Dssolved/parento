import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Crown,
  Library,
  MessageSquareText,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CourseCard from '../components/course/CourseCard'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useAllLessons, useCourses } from '../hooks/useCourses'
import { useProgress } from '../hooks/useProgress'
import { getLessonAccessState } from '../lib/access'
import { getCaregiverRoleLabel } from '../lib/caregiverRoles'
import { getStageLabel, stageLabels } from '../lib/stages'
import type { Course, Lesson, Progress, Subscription } from '../types/database'

interface LearningRoute {
  eyebrow: string
  title: string
  description: string
  meta: string
  progressPercent: number | null
  to: string
  buttonText: string
}

interface CourseProgressSummary {
  course: Course
  lessons: Lesson[]
  completedCount: number
  latestCompletedAt: string
}

interface MyCourseCard {
  course: Course
  completedCount: number
  lessonsCount: number
  progressPercent: number
  isCompleted: boolean
  to: string
  buttonText: string
}

const FEEDBACK_DISMISSED_KEY = 'parento_feedback_prompt_dismissed_at'
const FEEDBACK_COMPLETED_KEY = 'parento_feedback_prompt_completed'
const FEEDBACK_DISMISS_MS = 7 * 24 * 60 * 60 * 1000

function getProgressPercent(completedCount: number, lessonsCount: number) {
  return lessonsCount ? Math.round((completedCount / lessonsCount) * 100) : 0
}

function getInitialFeedbackPromptState() {
  if (typeof window === 'undefined') return false

  const isCompleted = window.localStorage.getItem(FEEDBACK_COMPLETED_KEY) === 'true'
  if (isCompleted) return true

  const dismissedAt = Number(window.localStorage.getItem(FEEDBACK_DISMISSED_KEY) ?? 0)
  return dismissedAt > 0 && Date.now() - dismissedAt < FEEDBACK_DISMISS_MS
}

function buildLearningRoute(
  allCourses: Course[],
  recommendedCourses: Course[],
  allLessons: Lesson[],
  progress: Progress[],
  subscription: Subscription,
): LearningRoute {
  const completedLessonIds = new Set(progress.map((item) => item.lesson_id))
  const lessonsByCourseId = new Map<string, Lesson[]>()
  const lessonById = new Map(allLessons.map((lesson) => [lesson.id, lesson]))

  allLessons.forEach((lesson) => {
    const courseLessons = lessonsByCourseId.get(lesson.course_id) ?? []
    courseLessons.push(lesson)
    lessonsByCourseId.set(lesson.course_id, courseLessons)
  })

  const latestCompletedAtByCourseId = new Map<string, string>()

  progress.forEach((item) => {
    const lesson = lessonById.get(item.lesson_id)
    if (!lesson) return

    const currentLatest = latestCompletedAtByCourseId.get(lesson.course_id)
    if (!currentLatest || item.completed_at > currentLatest) {
      latestCompletedAtByCourseId.set(lesson.course_id, item.completed_at)
    }
  })

  const courseSummaries: CourseProgressSummary[] = allCourses
    .map((course) => {
      const lessons = lessonsByCourseId.get(course.id) ?? []

      return {
        course,
        lessons,
        completedCount: lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length,
        latestCompletedAt: latestCompletedAtByCourseId.get(course.id) ?? '',
      }
    })
    .filter((summary) => summary.lessons.length > 0 && summary.completedCount > 0)
    .sort((first, second) => second.latestCompletedAt.localeCompare(first.latestCompletedAt))

  const activeCourse = courseSummaries.find((summary) => summary.completedCount < summary.lessons.length)

  if (activeCourse) {
    const nextLesson = activeCourse.lessons.find((lesson) => !completedLessonIds.has(lesson.id))
    const progressPercent = getProgressPercent(activeCourse.completedCount, activeCourse.lessons.length)
    const nextLessonAccess = nextLesson
      ? getLessonAccessState(activeCourse.course, nextLesson, subscription)
      : null

    if (nextLesson && nextLessonAccess && !nextLessonAccess.canAccess) {
      return {
        eyebrow: 'Продолжить обучение',
        title: activeCourse.course.title,
        description: `Следующий урок: ${nextLesson.title}. ${nextLessonAccess.description}`,
        meta: `${activeCourse.completedCount} из ${activeCourse.lessons.length} уроков`,
        progressPercent,
        to: nextLessonAccess.ctaTo,
        buttonText: nextLessonAccess.ctaLabel,
      }
    }

    if (nextLesson) {
      return {
        eyebrow: 'Продолжить обучение',
        title: activeCourse.course.title,
        description: `Следующий урок: ${nextLesson.title}`,
        meta: `${activeCourse.completedCount} из ${activeCourse.lessons.length} уроков`,
        progressPercent,
        to: `/lesson/${nextLesson.id}`,
        buttonText: 'Продолжить',
      }
    }
  }

  const completedCourse = courseSummaries.find((summary) => summary.completedCount === summary.lessons.length)

  if (completedCourse) {
    return {
      eyebrow: 'Курс завершён',
      title: completedCourse.course.title,
      description: 'Все уроки отмечены как пройденные. Можно повторить курс или выбрать следующий материал.',
      meta: `${completedCourse.lessons.length} из ${completedCourse.lessons.length} уроков`,
      progressPercent: 100,
      to: `/course/${completedCourse.course.id}`,
      buttonText: 'Открыть курс',
    }
  }

  const startCourse = recommendedCourses.find((course) => subscription === 'premium' || !course.is_premium)

  if (startCourse) {
    const startLessons = lessonsByCourseId.get(startCourse.id) ?? []
    const firstAvailableLesson = startLessons.find((lesson) =>
      getLessonAccessState(startCourse, lesson, subscription).canAccess,
    )

    return {
      eyebrow: 'Начать обучение',
      title: startCourse.title,
      description: firstAvailableLesson
        ? `Первый урок: ${firstAvailableLesson.title}`
        : 'Откройте курс и добавьте первый урок в админке, если он ещё не создан.',
      meta: startLessons.length ? `0 из ${startLessons.length} уроков` : 'Уроки пока не добавлены',
      progressPercent: startLessons.length ? 0 : null,
      to: firstAvailableLesson ? `/lesson/${firstAvailableLesson.id}` : `/course/${startCourse.id}`,
      buttonText: firstAvailableLesson ? 'Начать' : 'Открыть курс',
    }
  }

  return {
    eyebrow: 'Быстрый маршрут',
    title: 'Найдите подходящий курс',
    description: 'Выберите курс в каталоге, откройте первый урок и отмечайте материалы пройденными.',
    meta: 'Каталог курсов',
    progressPercent: null,
    to: '/catalog',
    buttonText: 'Найти курс',
  }
}

function buildMyCourses(
  allCourses: Course[],
  allLessons: Lesson[],
  progress: Progress[],
  subscription: Subscription,
) {
  const completedLessonIds = new Set(progress.map((item) => item.lesson_id))
  const lessonById = new Map(allLessons.map((lesson) => [lesson.id, lesson]))
  const lessonsByCourseId = new Map<string, Lesson[]>()
  const latestCompletedAtByCourseId = new Map<string, string>()

  allLessons.forEach((lesson) => {
    const courseLessons = lessonsByCourseId.get(lesson.course_id) ?? []
    courseLessons.push(lesson)
    lessonsByCourseId.set(lesson.course_id, courseLessons)
  })

  progress.forEach((item) => {
    const lesson = lessonById.get(item.lesson_id)
    if (!lesson) return

    const currentLatest = latestCompletedAtByCourseId.get(lesson.course_id)
    if (!currentLatest || item.completed_at > currentLatest) {
      latestCompletedAtByCourseId.set(lesson.course_id, item.completed_at)
    }
  })

  const cards: MyCourseCard[] = allCourses
    .map((course) => {
      const lessons = lessonsByCourseId.get(course.id) ?? []
      const completedCount = lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length
      const nextLesson = lessons.find((lesson) =>
        !completedLessonIds.has(lesson.id) && getLessonAccessState(course, lesson, subscription).canAccess,
      )
      const isCompleted = lessons.length > 0 && completedCount === lessons.length

      return {
        course,
        completedCount,
        lessonsCount: lessons.length,
        progressPercent: getProgressPercent(completedCount, lessons.length),
        isCompleted,
        to: isCompleted || !nextLesson ? `/course/${course.id}` : `/lesson/${nextLesson.id}`,
        buttonText: isCompleted ? 'Открыть курс' : nextLesson ? 'Продолжить' : 'Открыть курс',
        latestCompletedAt: latestCompletedAtByCourseId.get(course.id) ?? '',
      }
    })
    .filter((card) => card.lessonsCount > 0 && card.completedCount > 0)
    .sort((first, second) => second.latestCompletedAt.localeCompare(first.latestCompletedAt))

  return {
    active: cards.filter((card) => !card.isCompleted),
    completed: cards.filter((card) => card.isCompleted),
  }
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const userStage = profile?.stage ?? 'all'
  const { data: recommendedCourses = [], isLoading: coursesLoading } = useCourses(userStage)
  const { data: allCourses = [], isLoading: allCoursesLoading } = useCourses()
  const { data: allLessons = [], isLoading: lessonsLoading } = useAllLessons()
  const { data: progress = [] } = useProgress(user?.id ?? '')
  const subscription = profile?.subscription ?? 'free'
  const completedLessonsCount = progress.length
  const visibleRecommendations = recommendedCourses.slice(0, 3)
  const premiumRecommendations = recommendedCourses.filter((course) => course.is_premium).length
  const learningRouteLoading = coursesLoading || allCoursesLoading || lessonsLoading
  const learningRoute = useMemo(
    () => buildLearningRoute(allCourses, recommendedCourses, allLessons, progress, subscription),
    [allCourses, allLessons, progress, recommendedCourses, subscription],
  )
  const myCourses = useMemo(
    () => buildMyCourses(allCourses, allLessons, progress, subscription),
    [allCourses, allLessons, progress, subscription],
  )
  const hasMyCourses = myCourses.active.length > 0 || myCourses.completed.length > 0
  const [isFeedbackPromptHidden, setIsFeedbackPromptHidden] = useState(getInitialFeedbackPromptState)
  const shouldShowFeedbackPrompt = completedLessonsCount >= 3 && !isFeedbackPromptHidden

  const dismissFeedbackPrompt = () => {
    window.localStorage.setItem(FEEDBACK_DISMISSED_KEY, String(Date.now()))
    setIsFeedbackPromptHidden(true)
  }

  return (
    <section className="container-page py-6 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 rounded-lg bg-emerald-900 p-5 text-white shadow-soft sm:p-8">
          <p className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-medium sm:text-sm">
            <Sparkles size={16} aria-hidden="true" />
            Моё обучение
          </p>
          <h1 className="mt-5 break-words text-2xl font-semibold leading-tight sm:text-5xl">
            {profile?.full_name ? `${profile.full_name}, продолжим?` : 'Продолжим обучение?'}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-lg sm:leading-8">
            Здесь собраны ваш этап, прогресс и курсы, которые подходят текущему контексту.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/catalog"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-emerald-900 hover:bg-emerald-50 sm:w-auto sm:px-5 sm:text-base"
            >
              Открыть каталог
              <ArrowRight className="size-4 shrink-0 sm:size-[18px]" aria-hidden="true" />
            </Link>
            <Link
              to="/profile"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-white/40 px-4 text-sm font-medium text-white hover:bg-white/10 sm:w-auto sm:px-5 sm:text-base"
            >
              Настроить профиль
            </Link>
          </div>
        </div>

        <Card className="p-5 sm:p-6">
          <p className="text-sm font-medium text-gray-500">Ваш контекст</p>
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">Этап</p>
              <p className="break-words text-lg font-semibold text-gray-900 sm:text-xl">{getStageLabel(profile?.stage)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">Роль</p>
              <p className="break-words text-lg font-semibold text-gray-900 sm:text-xl">{getCaregiverRoleLabel(profile?.caregiver_role)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-500">
            {profile?.stage
              ? `Рекомендации настроены под раздел «${stageLabels[profile.stage]}».`
              : 'Выберите этап и роль, чтобы получить более точные рекомендации.'}
          </p>
          <Link
            to={profile?.stage && profile?.caregiver_role ? '/profile' : '/onboarding'}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-800 hover:bg-gray-200 sm:w-auto sm:px-5 sm:text-base"
          >
            {profile?.stage && profile?.caregiver_role ? 'Изменить контекст' : 'Настроить контекст'}
          </Link>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <BookOpenCheck className="size-7 text-emerald-600" aria-hidden="true" />
          <p className="mt-4 text-sm font-medium text-gray-500">Пройдено уроков</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 sm:text-3xl">{completedLessonsCount}</p>
        </Card>

        <Card className="p-5">
          <Target className="size-7 text-emerald-600" aria-hidden="true" />
          <p className="mt-4 text-sm font-medium text-gray-500">Рекомендовано курсов</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 sm:text-3xl">{recommendedCourses.length}</p>
        </Card>

        <Card className="p-5">
          <Crown className="size-7 text-emerald-600" aria-hidden="true" />
          <p className="mt-4 text-sm font-medium text-gray-500">Подписка</p>
          <p className="mt-1 break-words text-2xl font-semibold text-gray-900 sm:text-3xl">
            {subscription === 'premium' ? 'Premium' : 'Free'}
          </p>
        </Card>
      </div>

      {subscription === 'free' && premiumRecommendations > 0 && (
        <Card className="mt-6 border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 font-semibold text-emerald-950">
                <Crown size={18} aria-hidden="true" />
                Есть Premium-материалы по вашему этапу
              </p>
              <p className="mt-1 text-sm text-emerald-800">
                В рекомендациях найдено {premiumRecommendations} Premium-курсов.
              </p>
            </div>
            <Link
              to="/subscribe"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 sm:w-auto sm:px-5 sm:text-base"
            >
              Открыть Premium
            </Link>
          </div>
        </Card>
      )}

      <Card className="mt-6 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-semibold text-gray-900">
              <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />
              {learningRouteLoading ? 'Подбираем маршрут' : learningRoute.eyebrow}
            </p>
            {learningRouteLoading ? (
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Проверяем ваши курсы, уроки и прогресс, чтобы предложить следующий шаг.
              </p>
            ) : (
              <>
                <h2 className="mt-2 break-words text-xl font-semibold text-gray-900 sm:text-2xl">{learningRoute.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">{learningRoute.description}</p>
                <div className="mt-4 flex flex-col gap-2 sm:max-w-md">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-gray-700">{learningRoute.meta}</span>
                    {learningRoute.progressPercent !== null && (
                      <span className="text-gray-500">{learningRoute.progressPercent}%</span>
                    )}
                  </div>
                  {learningRoute.progressPercent !== null && (
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{ width: `${learningRoute.progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <Link
            to={learningRouteLoading ? '/catalog' : learningRoute.to}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-white px-4 text-sm font-medium text-emerald-700 hover:bg-emerald-50 sm:w-auto sm:px-5 sm:text-base"
          >
            {learningRouteLoading ? 'Открыть каталог' : learningRoute.buttonText}
            <ArrowRight className="size-4 shrink-0 sm:size-[18px]" aria-hidden="true" />
          </Link>
        </div>
      </Card>

      <div className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Мои курсы</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">Ваш прогресс по курсам</h2>
          </div>
          {hasMyCourses && (
            <Link to="/catalog" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800">
              Найти ещё курс
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>

        {!learningRouteLoading && !hasMyCourses && (
          <Card className="mt-6 p-6 text-center">
            <BookOpenCheck className="mx-auto size-9 text-emerald-600" aria-hidden="true" />
            <p className="mt-4 font-medium text-gray-900">Вы ещё не начали курсы</p>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Откройте первый урок и отметьте его пройденным, чтобы курс появился в этом разделе.
            </p>
            <Link
              to="/catalog"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-gray-100 px-5 font-medium text-gray-800 hover:bg-gray-200"
            >
              Открыть каталог
            </Link>
          </Card>
        )}

        {myCourses.active.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900">Продолжаю</h3>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              {myCourses.active.map((item) => (
                <Card key={item.course.id} className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        {getStageLabel(item.course.stage)}
                      </p>
                      <h4 className="mt-2 break-words text-lg font-semibold text-gray-900">{item.course.title}</h4>
                      <p className="mt-2 text-sm text-gray-500">
                        {item.completedCount} из {item.lessonsCount} уроков
                      </p>
                    </div>
                    <Link
                      to={item.to}
                      className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      {item.buttonText}
                    </Link>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-gray-700">{item.progressPercent}%</span>
                    <span className="text-gray-400">в процессе</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${item.progressPercent}%` }} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {myCourses.completed.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900">Завершено</h3>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              {myCourses.completed.map((item) => (
                <Card key={item.course.id} className="border-emerald-100 bg-emerald-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                        Курс завершён
                      </p>
                      <h4 className="mt-2 break-words text-lg font-semibold text-gray-900">{item.course.title}</h4>
                      <p className="mt-2 text-sm text-emerald-800">
                        {item.completedCount} из {item.lessonsCount} уроков
                      </p>
                    </div>
                    <Link
                      to={item.to}
                      className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-white px-4 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                    >
                      {item.buttonText}
                    </Link>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-100">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${item.progressPercent}%` }} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Рекомендации</p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">Курсы для вашего этапа</h2>
        </div>
        <Link to="/catalog" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800">
          Весь каталог
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {coursesLoading && <p className="mt-6 text-gray-500">Загружаем рекомендации...</p>}

      {!coursesLoading && visibleRecommendations.length === 0 && (
        <Card className="mt-6 p-8 text-center">
          <Library className="mx-auto size-9 text-emerald-600" aria-hidden="true" />
          <p className="mt-4 font-medium text-gray-900">Пока нет рекомендаций</p>
          <p className="mt-2 text-sm text-gray-500">Добавьте курсы в админке или выберите другой этап.</p>
          <Link
            to="/catalog"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-gray-100 px-5 font-medium text-gray-800 hover:bg-gray-200"
          >
            Открыть каталог
          </Link>
        </Card>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visibleRecommendations.map((course) => (
          <CourseCard key={course.id} course={course} userSubscription={subscription} />
        ))}
      </div>

      {shouldShowFeedbackPrompt ? (
        <Card className="mt-10 border-emerald-200 bg-emerald-50 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700">
                <MessageSquareText size={20} aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-emerald-950">Помогите улучшить Parento</p>
                <p className="mt-1 text-sm leading-6 text-emerald-800">
                  Вы уже прошли несколько уроков. Расскажите, что было полезно, а что стоит доработать.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <Link
                to="/feedback?from=/dashboard"
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Оставить отзыв
              </Link>
              <button
                type="button"
                onClick={dismissFeedbackPrompt}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
              >
                <X size={16} aria-hidden="true" />
                Не сейчас
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mt-10 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <MessageSquareText className="mt-0.5 size-6 shrink-0 text-emerald-600" aria-hidden="true" />
              <div>
                <p className="font-semibold text-gray-900">Есть идея или заметили неудобство?</p>
                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Оставьте короткий отзыв, чтобы мы понимали, что улучшать дальше.
                </p>
              </div>
            </div>
            <Link
              to="/feedback?from=/dashboard"
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-800 hover:bg-gray-200"
            >
              Оставить отзыв
            </Link>
          </div>
        </Card>
      )}

    </section>
  )
}
