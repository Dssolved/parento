import { ArrowLeft, Crown } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import CourseCover from '../components/course/CourseCover'
import LessonItem from '../components/course/LessonItem'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useCourse, useLessons } from '../hooks/useCourses'
import { useProgress } from '../hooks/useProgress'
import { getCourseAccessState, getLessonAccessState } from '../lib/access'
import { getStageLabel } from '../lib/stages'

export default function CoursePage() {
  const { id = '' } = useParams()
  const { user, profile } = useAuth()
  const { data: course, isLoading: courseLoading, error: courseError } = useCourse(id)
  const { data: lessons = [], isLoading: lessonsLoading } = useLessons(id)
  const { data: progress = [] } = useProgress(user?.id ?? '')
  const completedLessonIds = new Set(progress.map((item) => item.lesson_id))
  const completedCount = lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length
  const progressPercent = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0
  const subscription = profile?.subscription ?? 'free'

  if (courseLoading) {
    return <div className="container-page py-12 text-gray-500">Загружаем курс...</div>
  }

  if (courseError || !course) {
    return <div className="container-page py-12 text-gray-500">Курс не найден.</div>
  }

  const courseAccess = getCourseAccessState(course, subscription)

  return (
    <section className="container-page py-10">
      <Link to="/catalog" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800">
        <ArrowLeft size={16} aria-hidden="true" />
        Назад к каталогу
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{getStageLabel(course.stage)}</p>
          <h1 className="mt-2 text-4xl font-semibold text-gray-900">{course.title}</h1>
          {course.description && <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-500">{course.description}</p>}

          {!courseAccess.canAccess && (
            <Card className="mt-6 border-emerald-200 bg-emerald-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 font-semibold text-emerald-900">
                    <Crown size={18} aria-hidden="true" />
                    {courseAccess.label}
                  </p>
                  <p className="mt-1 text-sm text-emerald-800">{courseAccess.description}</p>
                </div>
                <Link
                  to={courseAccess.ctaTo}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-emerald-600 px-5 font-medium text-white hover:bg-emerald-700"
                >
                  {courseAccess.ctaLabel}
                </Link>
              </div>
            </Card>
          )}
        </div>

        <Card className="overflow-hidden">
          <CourseCover src={course.cover_url} alt={course.title} />
          <div className="p-5">
            <p className="text-sm font-medium text-gray-500">Прогресс курса</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <p className="text-3xl font-semibold text-gray-900">{progressPercent}%</p>
              <p className="text-sm text-gray-500">{completedCount} из {lessons.length} уроков</p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-emerald-600" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-semibold text-gray-900">Уроки</h2>
        {lessonsLoading && <p className="mt-4 text-gray-500">Загружаем уроки...</p>}
        {!lessonsLoading && lessons.length === 0 && (
          <Card className="mt-4 p-6 text-gray-500">Уроки для этого курса пока не добавлены.</Card>
        )}
        <div className="mt-4 space-y-3">
          {lessons.map((lesson) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              isCompleted={completedLessonIds.has(lesson.id)}
              isLocked={!getLessonAccessState(course, lesson, subscription).canAccess}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
