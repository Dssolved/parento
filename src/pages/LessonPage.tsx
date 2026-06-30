import { ArrowLeft, ArrowRight, CheckCircle2, Lock } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import MarkdownContent from '../components/course/MarkdownContent'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useCourse, useLesson, useLessons } from '../hooks/useCourses'
import { useCompleteLesson, useProgress } from '../hooks/useProgress'
import { getLessonAccessState } from '../lib/access'

export default function LessonPage() {
  const { id = '' } = useParams()
  const { user, profile } = useAuth()
  const { data: lesson, isLoading, error } = useLesson(id)
  const { data: course, isLoading: courseLoading, error: courseError } = useCourse(lesson?.course_id ?? '')
  const { data: lessons = [] } = useLessons(lesson?.course_id ?? '')
  const { data: progress = [] } = useProgress(user?.id ?? '')
  const completeLesson = useCompleteLesson()
  const subscription = profile?.subscription ?? 'free'
  const lessonAccess = lesson ? getLessonAccessState(course, lesson, subscription) : null
  const isLocked = Boolean(lessonAccess && !lessonAccess.canAccess)
  const isCompleted = Boolean(lesson && progress.some((item) => item.lesson_id === lesson.id))
  const lessonIndex = lesson ? lessons.findIndex((item) => item.id === lesson.id) : -1
  const prevLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null
  const nextLesson = lessonIndex >= 0 && lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null
  const nextLessonAccess = nextLesson ? getLessonAccessState(course, nextLesson, subscription) : null
  const nextLessonLocked = Boolean(nextLessonAccess && !nextLessonAccess.canAccess)
  const completedActionPath = nextLesson ? (nextLessonLocked ? '/subscribe' : `/lesson/${nextLesson.id}`) : `/course/${lesson?.course_id ?? ''}`
  const completedActionText = nextLesson
    ? nextLessonLocked
      ? 'Открыть Premium'
      : 'Следующий урок'
    : 'Вернуться к курсу'

  const handleComplete = async () => {
    if (!user || !lesson) return
    await completeLesson.mutateAsync({ userId: user.id, lessonId: lesson.id })
  }

  if (isLoading || (lesson && courseLoading)) {
    return <div className="container-page py-12 text-gray-500">Загружаем урок...</div>
  }

  if (error || !lesson) {
    return <div className="container-page py-12 text-gray-500">Урок не найден.</div>
  }

  if (courseError || !course) {
    return <div className="container-page py-12 text-gray-500">Урок не найден.</div>
  }

  return (
    <section className="container-page py-10">
      <Link to={`/course/${lesson.course_id}`} className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800">
        <ArrowLeft size={16} aria-hidden="true" />
        Назад к курсу
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <article>
          <h1 className="text-4xl font-semibold text-gray-900">{lesson.title}</h1>

          {isLocked ? (
            <Card className="mt-6 border-emerald-200 bg-emerald-50 p-6">
              <Lock className="size-8 text-emerald-700" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-semibold text-emerald-950">{lessonAccess?.label ?? 'Premium урок'}</h2>
              <p className="mt-2 text-emerald-800">{lessonAccess?.description ?? 'Этот урок доступен после перехода на Premium.'}</p>
              <Link
                to={lessonAccess?.ctaTo ?? '/subscribe'}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 font-medium text-white hover:bg-emerald-700"
              >
                {lessonAccess?.ctaLabel ?? 'Открыть Premium'}
              </Link>
            </Card>
          ) : (
            <div className="mt-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <MarkdownContent
                content={lesson.content}
                emptyText="Контент урока будет добавлен в админке. Сейчас можно проверить навигацию и прогресс."
              />
            </div>
          )}
        </article>

        <aside className="space-y-4">
          <Card className="p-5">
            <p className="text-sm font-medium text-gray-500">Статус</p>
            <p className="mt-2 flex items-center gap-2 font-semibold text-gray-900">
              <CheckCircle2 className={`size-5 ${isCompleted ? 'text-teal-600' : 'text-gray-300'}`} aria-hidden="true" />
              {isCompleted ? 'Урок пройден' : 'Еще не пройден'}
            </p>
            {!isLocked && !isCompleted && (
              <Button className="mt-5 w-full" onClick={handleComplete} isLoading={completeLesson.isPending} disabled={isCompleted}>
                Отметить как пройденный
              </Button>
            )}
            {!isLocked && isCompleted && (
              <Link
                to={completedActionPath}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {completedActionText}
                <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
              </Link>
            )}
          </Card>

          <Card className="p-5">
            <p className="text-sm font-medium text-gray-500">Навигация</p>
            <div className="mt-4 space-y-2">
              {prevLesson ? (
                <Link
                  to={`/lesson/${prevLesson.id}`}
                  className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  Предыдущий урок
                </Link>
              ) : (
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-400">Это первый урок</p>
              )}
              {nextLesson ? (
                <Link
                  to={`/lesson/${nextLesson.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Следующий урок
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : (
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-400">Это последний урок</p>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </section>
  )
}
