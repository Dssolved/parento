import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  FileText,
  Layers,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import CourseCover from '../components/course/CourseCover'
import MarkdownContent from '../components/course/MarkdownContent'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { stageLabels } from '../lib/stages'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Course, CourseInsert, Lesson, LessonInsert, Stage } from '../types/database'

const stageValues: Array<Stage | 'all'> = ['planning', 'pregnancy', 'newborn', 'all']

const emptyCourseForm: CourseInsert = {
  title: '',
  description: '',
  stage: 'planning',
  is_premium: false,
  is_published: false,
  cover_url: '',
}

function getEmptyLessonForm(courseId = '', orderIndex = 1): LessonInsert {
  return {
    course_id: courseId,
    title: '',
    content: '',
    order_index: orderIndex,
    is_premium: false,
    is_published: false,
  }
}

function mapCourseToForm(course: Course): CourseInsert {
  return {
    title: course.title,
    description: course.description ?? '',
    stage: course.stage,
    is_premium: course.is_premium,
    is_published: course.is_published,
    cover_url: course.cover_url ?? '',
  }
}

function mapLessonToForm(lesson: Lesson): LessonInsert {
  return {
    course_id: lesson.course_id,
    title: lesson.title,
    content: lesson.content ?? '',
    order_index: lesson.order_index,
    is_premium: lesson.is_premium,
    is_published: lesson.is_published,
  }
}

function cleanCoursePayload(form: CourseInsert): CourseInsert {
  return {
    title: form.title.trim(),
    description: form.description?.trim() || null,
    stage: form.stage,
    is_premium: form.is_premium,
    is_published: form.is_published,
    cover_url: form.cover_url?.trim() || null,
  }
}

function cleanLessonPayload(form: LessonInsert): LessonInsert {
  return {
    course_id: form.course_id,
    title: form.title.trim(),
    content: form.content?.trim() || null,
    order_index: Number(form.order_index),
    is_premium: form.is_premium,
    is_published: form.is_published,
  }
}

function getNextLessonOrder(lessons: Lesson[], courseId: string) {
  if (!courseId) return 1

  const maxOrder = lessons
    .filter((lesson) => lesson.course_id === courseId)
    .reduce((max, lesson) => Math.max(max, lesson.order_index), 0)

  return maxOrder + 1
}

function getAvailableLessonOrders(lessons: Lesson[], courseId: string, editingLessonId: string | null) {
  if (!courseId) return [1]

  const courseLessons = lessons.filter((lesson) => lesson.course_id === courseId)
  const occupiedOrders = new Set(
    courseLessons
      .filter((lesson) => lesson.id !== editingLessonId)
      .map((lesson) => lesson.order_index),
  )
  const maxOrder = courseLessons.reduce((max, lesson) => Math.max(max, lesson.order_index), 0) + 1

  return Array.from({ length: Math.max(maxOrder, 1) }, (_item, index) => index + 1)
    .filter((order) => !occupiedOrders.has(order))
}

function hasLessonOrderConflict(lessons: Lesson[], courseId: string, orderIndex: number, editingLessonId: string | null) {
  return lessons.some((lesson) =>
    lesson.course_id === courseId &&
    lesson.order_index === orderIndex &&
    lesson.id !== editingLessonId,
  )
}

export default function Admin() {
  const queryClient = useQueryClient()
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async (): Promise<Course[]> => {
      if (!isSupabaseConfigured) return []

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at')

      if (error) throw error
      return data as Course[]
    },
  })
  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['admin-lessons'],
    queryFn: async (): Promise<Lesson[]> => {
      if (!isSupabaseConfigured) return []

      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('order_index')

      if (error) throw error
      return data as Lesson[]
    },
  })

  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [courseForm, setCourseForm] = useState<CourseInsert>(emptyCourseForm)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [lessonForm, setLessonForm] = useState<LessonInsert>(getEmptyLessonForm())
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [savingCourse, setSavingCourse] = useState(false)
  const [savingLesson, setSavingLesson] = useState(false)
  const [movingLessonId, setMovingLessonId] = useState<string | null>(null)
  const [lessonMode, setLessonMode] = useState<'edit' | 'preview'>('edit')

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? null

  const lessonCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    lessons.forEach((lesson) => {
      counts[lesson.course_id] = (counts[lesson.course_id] ?? 0) + 1
    })
    return counts
  }, [lessons])

  const selectedLessons = useMemo(
    () => lessons
      .filter((lesson) => lesson.course_id === selectedCourseId)
      .sort((first, second) => first.order_index - second.order_index),
    [lessons, selectedCourseId],
  )
  const lessonOrderOptions = useMemo(
    () => getAvailableLessonOrders(lessons, lessonForm.course_id, editingLessonId),
    [editingLessonId, lessonForm.course_id, lessons],
  )

  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      const firstCourse = courses[0]
      setSelectedCourseId(firstCourse.id)
      setEditingCourseId(firstCourse.id)
      setCourseForm(mapCourseToForm(firstCourse))
      setLessonForm(getEmptyLessonForm(firstCourse.id, getNextLessonOrder(lessons, firstCourse.id)))
    }
  }, [courses, lessons, selectedCourseId])

  const resetMessages = () => {
    setMessage('')
    setError('')
  }

  const invalidateContent = async (courseId?: string, lessonIds: string[] = []) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['courses'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-lessons'] }),
      queryClient.invalidateQueries({ queryKey: ['lessons', 'all'] }),
      ...lessonIds.map((lessonId) => queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] })),
      courseId
        ? queryClient.invalidateQueries({ queryKey: ['lessons', courseId] })
        : Promise.resolve(),
      courseId
        ? queryClient.invalidateQueries({ queryKey: ['course', courseId] })
        : Promise.resolve(),
    ])
  }

  const startNewCourse = () => {
    resetMessages()
    setSelectedCourseId('')
    setEditingCourseId(null)
    setCourseForm(emptyCourseForm)
    setEditingLessonId(null)
    setLessonForm(getEmptyLessonForm())
  }

  const startEditCourse = (course: Course) => {
    resetMessages()
    setSelectedCourseId(course.id)
    setEditingCourseId(course.id)
    setCourseForm(mapCourseToForm(course))
    setLessonForm((form) => ({
      ...form,
      course_id: course.id,
      order_index: editingLessonId ? form.order_index : getNextLessonOrder(lessons, course.id),
    }))
  }

  const startNewLesson = () => {
    resetMessages()
    setEditingLessonId(null)
    setLessonForm(getEmptyLessonForm(selectedCourseId, getNextLessonOrder(lessons, selectedCourseId)))
    setLessonMode('edit')
  }

  const startEditLesson = (lesson: Lesson) => {
    resetMessages()
    setSelectedCourseId(lesson.course_id)
    setEditingLessonId(lesson.id)
    setLessonForm(mapLessonToForm(lesson))
    setLessonMode('edit')
  }

  const handleCourseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setSavingCourse(true)

    const payload = cleanCoursePayload(courseForm)

    if (!payload.title) {
      setError('Введите название курса.')
      setSavingCourse(false)
      return
    }

    if (editingCourseId) {
      const { error: updateError } = await supabase
        .from('courses')
        .update(payload)
        .eq('id', editingCourseId)

      if (updateError) {
        setError(updateError.message)
        setSavingCourse(false)
        return
      }

      setMessage('Курс сохранен.')
      await invalidateContent(editingCourseId)
    } else {
      const { data, error: insertError } = await supabase
        .from('courses')
        .insert(payload)
        .select('*')
        .single()

      if (insertError) {
        setError(insertError.message)
        setSavingCourse(false)
        return
      }

      const createdCourse = data as Course
      setSelectedCourseId(createdCourse.id)
      setEditingCourseId(createdCourse.id)
      setCourseForm(mapCourseToForm(createdCourse))
      setLessonForm(getEmptyLessonForm(createdCourse.id, 1))
      setMessage('Курс добавлен.')
      await invalidateContent(createdCourse.id)
    }

    setSavingCourse(false)
  }

  const handleLessonSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetMessages()
    setSavingLesson(true)

    const payload = cleanLessonPayload(lessonForm)

    if (!payload.course_id) {
      setError('Выберите курс для урока.')
      setSavingLesson(false)
      return
    }

    if (!payload.title) {
      setError('Введите название урока.')
      setSavingLesson(false)
      return
    }

    if (payload.order_index < 1) {
      setError('Порядок урока должен начинаться с 1.')
      setSavingLesson(false)
      return
    }

    if (hasLessonOrderConflict(lessons, payload.course_id, payload.order_index, editingLessonId)) {
      setError(`Порядок ${payload.order_index} уже занят в этом курсе.`)
      setSavingLesson(false)
      return
    }

    if (editingLessonId) {
      const { error: updateError } = await supabase
        .from('lessons')
        .update(payload)
        .eq('id', editingLessonId)

      if (updateError) {
        setError(updateError.message)
        setSavingLesson(false)
        return
      }

      setMessage('Урок сохранен.')
      await invalidateContent(payload.course_id, [editingLessonId])
    } else {
      const { error: insertError } = await supabase.from('lessons').insert(payload)

      if (insertError) {
        setError(insertError.message)
        setSavingLesson(false)
        return
      }

      setMessage('Урок добавлен.')
      await invalidateContent(payload.course_id)
      setLessonForm(getEmptyLessonForm(
        payload.course_id,
        Math.max(getNextLessonOrder(lessons, payload.course_id), payload.order_index + 1),
      ))
    }

    setEditingLessonId(null)
    setSavingLesson(false)
  }

  const deleteCourse = async (course: Course) => {
    const confirmed = window.confirm(`Удалить курс "${course.title}" и все его уроки?`)
    if (!confirmed) return

    resetMessages()
    const { error: deleteError } = await supabase.from('courses').delete().eq('id', course.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    const nextCourse = courses.find((item) => item.id !== course.id)
    setSelectedCourseId(nextCourse?.id ?? '')
    setEditingCourseId(null)
    setCourseForm(emptyCourseForm)
    setEditingLessonId(null)
    setLessonForm(getEmptyLessonForm(nextCourse?.id ?? '', getNextLessonOrder(lessons, nextCourse?.id ?? '')))
    setMessage('Курс удален.')
    await invalidateContent(course.id)
  }

  const deleteLesson = async (lesson: Lesson) => {
    const confirmed = window.confirm(`Удалить урок "${lesson.title}"?`)
    if (!confirmed) return

    resetMessages()
    const { error: deleteError } = await supabase.from('lessons').delete().eq('id', lesson.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    if (editingLessonId === lesson.id) {
      setEditingLessonId(null)
      setLessonForm(getEmptyLessonForm(
        lesson.course_id,
        getNextLessonOrder(lessons.filter((item) => item.id !== lesson.id), lesson.course_id),
      ))
    }

    setMessage('Урок удален.')
    await invalidateContent(lesson.course_id, [lesson.id])
  }

  const moveLesson = async (lesson: Lesson, direction: 'up' | 'down') => {
    const currentIndex = selectedLessons.findIndex((item) => item.id === lesson.id)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const targetLesson = selectedLessons[targetIndex]

    if (currentIndex < 0 || !targetLesson) return

    resetMessages()
    setMovingLessonId(lesson.id)

    const [lessonUpdate, targetUpdate] = await Promise.all([
      supabase
        .from('lessons')
        .update({ order_index: targetLesson.order_index })
        .eq('id', lesson.id),
      supabase
        .from('lessons')
        .update({ order_index: lesson.order_index })
        .eq('id', targetLesson.id),
    ])

    if (lessonUpdate.error || targetUpdate.error) {
      setError(lessonUpdate.error?.message ?? targetUpdate.error?.message ?? 'Не удалось изменить порядок уроков.')
      setMovingLessonId(null)
      await invalidateContent(lesson.course_id, [lesson.id, targetLesson.id])
      return
    }

    if (editingLessonId === lesson.id) {
      setLessonForm((form) => ({ ...form, order_index: targetLesson.order_index }))
    }

    if (editingLessonId === targetLesson.id) {
      setLessonForm((form) => ({ ...form, order_index: lesson.order_index }))
    }

    setMessage('Порядок уроков обновлен.')
    setMovingLessonId(null)
    await invalidateContent(lesson.course_id, [lesson.id, targetLesson.id])
  }

  return (
    <section className="container-page py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Admin</p>
          <h1 className="mt-2 text-4xl font-semibold text-gray-900">Контент Parento</h1>
          <p className="mt-3 text-gray-500">
            Управляйте курсами, уроками, порядком материалов и Premium-доступом.
          </p>
        </div>
        <Button onClick={startNewCourse}>
          <Plus size={18} aria-hidden="true" />
          Новый курс
        </Button>
      </div>

      {(message || error) && (
        <p
          className={`mt-6 rounded-lg px-4 py-3 text-sm ${
            error ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {error || message}
        </p>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Курсы</h2>
              <p className="mt-1 text-sm text-gray-500">{courses.length} всего</p>
            </div>
            <Layers className="size-6 text-emerald-600" aria-hidden="true" />
          </div>

          <div className="max-h-[42rem] divide-y divide-gray-100 overflow-y-auto">
            {coursesLoading && <p className="p-5 text-sm text-gray-500">Загружаем курсы...</p>}
            {!coursesLoading && courses.length === 0 && (
              <p className="p-5 text-sm text-gray-500">Курсов пока нет. Создайте первый курс справа.</p>
            )}
            {courses.map((course) => {
              const isSelected = course.id === selectedCourseId

              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => startEditCourse(course)}
                  className={`block w-full p-5 text-left transition ${
                    isSelected ? 'bg-emerald-50' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{course.title}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {stageLabels[course.stage]} · {course.is_premium ? 'Premium' : 'Free'}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          course.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {course.is_published ? 'Опубликован' : 'Черновик'}
                      </span>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-600 shadow-sm">
                      {lessonCounts[course.id] ?? 0}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {editingCourseId ? 'Редактирование курса' : 'Новый курс'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Изменения сразу сохраняются в Supabase после нажатия кнопки.
                </p>
              </div>
              {selectedCourse && editingCourseId && (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => deleteCourse(selectedCourse)}>
                    <Trash2 size={16} aria-hidden="true" />
                    Удалить
                  </Button>
                </div>
              )}
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleCourseSubmit}>
              <CourseCover
                src={courseForm.cover_url}
                alt={courseForm.title || 'Предпросмотр обложки курса'}
                className="rounded-lg border border-gray-100"
              />

              <label className="block space-y-2">
                <span className="form-label">Название</span>
                <input
                  className="form-input"
                  value={courseForm.title}
                  onChange={(event) => setCourseForm((form) => ({ ...form, title: event.target.value }))}
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="form-label">Описание</span>
                <textarea
                  className="form-input min-h-24"
                  value={courseForm.description ?? ''}
                  onChange={(event) => setCourseForm((form) => ({ ...form, description: event.target.value }))}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block space-y-2">
                  <span className="form-label">Этап</span>
                  <select
                    className="form-input"
                    value={courseForm.stage}
                    onChange={(event) =>
                      setCourseForm((form) => ({ ...form, stage: event.target.value as Stage | 'all' }))
                    }
                  >
                    {stageValues.map((stage) => (
                      <option key={stage} value={stage}>
                        {stageLabels[stage]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2 md:col-span-2">
                  <span className="form-label">Обложка URL</span>
                  <input
                    className="form-input"
                    value={courseForm.cover_url ?? ''}
                    onChange={(event) => setCourseForm((form) => ({ ...form, cover_url: event.target.value }))}
                    placeholder="https://..."
                  />
                  <span className="text-xs text-gray-400">Лучше всего выглядят изображения с пропорцией 16:9.</span>
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={courseForm.is_premium}
                  onChange={(event) => setCourseForm((form) => ({ ...form, is_premium: event.target.checked }))}
                  className="size-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Premium курс
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={courseForm.is_published}
                  onChange={(event) => setCourseForm((form) => ({ ...form, is_published: event.target.checked }))}
                  className="size-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                Опубликован
              </label>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" isLoading={savingCourse}>
                  <Save size={18} aria-hidden="true" />
                  {editingCourseId ? 'Сохранить курс' : 'Добавить курс'}
                </Button>
                {editingCourseId && (
                  <Button variant="secondary" onClick={startNewCourse}>
                    <X size={18} aria-hidden="true" />
                    Отменить
                  </Button>
                )}
              </div>
            </form>
          </Card>

          <div className="grid gap-6 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Card className="overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Уроки курса</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedCourse ? selectedCourse.title : 'Выберите курс слева'}
                  </p>
                </div>
                <Button size="sm" className="shrink-0 whitespace-nowrap" onClick={startNewLesson} disabled={!selectedCourseId}>
                  <Plus size={16} aria-hidden="true" />
                  Новый урок
                </Button>
              </div>

              <div className="divide-y divide-gray-100">
                {lessonsLoading && <p className="p-5 text-sm text-gray-500">Загружаем уроки...</p>}
                {!lessonsLoading && selectedCourseId && selectedLessons.length === 0 && (
                  <p className="p-5 text-sm text-gray-500">В этом курсе пока нет уроков.</p>
                )}
                {!selectedCourseId && <p className="p-5 text-sm text-gray-500">Сначала выберите или создайте курс.</p>}
                {selectedLessons.map((lesson, index) => {
                  const canMoveUp = index > 0
                  const canMoveDown = index < selectedLessons.length - 1

                  return (
                    <div key={lesson.id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm font-semibold text-emerald-700">
                              {lesson.order_index}
                            </span>
                            <div className="flex shrink-0 flex-col overflow-hidden rounded-md border border-gray-100">
                              <button
                                type="button"
                                onClick={() => moveLesson(lesson, 'up')}
                                disabled={!canMoveUp || movingLessonId !== null}
                                className="inline-flex size-4 items-center justify-center bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-300"
                                aria-label="Переместить урок выше"
                              >
                                <ArrowUp size={11} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveLesson(lesson, 'down')}
                                disabled={!canMoveDown || movingLessonId !== null}
                                className="inline-flex size-4 items-center justify-center border-t border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-300"
                                aria-label="Переместить урок ниже"
                              >
                                <ArrowDown size={11} aria-hidden="true" />
                              </button>
                            </div>
                            <p className="min-w-0 truncate font-medium text-gray-900">{lesson.title}</p>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                            {lesson.content || 'Контент еще не заполнен.'}
                          </p>
                          <p className="mt-2 text-xs font-medium text-gray-400">
                            {lesson.is_premium ? 'Premium урок' : 'Free урок'}
                          </p>
                          <span
                            className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              lesson.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {lesson.is_published ? 'Опубликован' : 'Черновик'}
                          </span>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button variant="secondary" size="sm" onClick={() => startEditLesson(lesson)} aria-label="Редактировать урок">
                            <Pencil size={16} aria-hidden="true" />
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => deleteLesson(lesson)} aria-label="Удалить урок">
                            <Trash2 size={16} aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {editingLessonId ? 'Редактирование урока' : 'Новый урок'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">Порядок задается числом: 1, 2, 3...</p>
                </div>
                {editingLessonId ? (
                  <FileText className="size-6 text-emerald-600" aria-hidden="true" />
                ) : (
                  <BookOpen className="size-6 text-emerald-600" aria-hidden="true" />
                )}
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleLessonSubmit}>
                <label className="block space-y-2">
                  <span className="form-label">Курс</span>
                  <select
                    className="form-input"
                    value={lessonForm.course_id}
                    onChange={(event) => {
                      const nextCourseId = event.target.value
                      setSelectedCourseId(nextCourseId)
                      setLessonForm((form) => ({
                        ...form,
                        course_id: nextCourseId,
                        order_index: nextCourseId === form.course_id
                          ? form.order_index
                          : getNextLessonOrder(lessons, nextCourseId),
                      }))
                    }}
                    required
                  >
                    <option value="">Выберите курс</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="form-label">Название</span>
                  <input
                    className="form-input"
                    value={lessonForm.title}
                    onChange={(event) => setLessonForm((form) => ({ ...form, title: event.target.value }))}
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="form-label">Контент</span>
                  <div className="inline-flex rounded-lg bg-gray-100 p-1">
                    <button
                      type="button"
                      onClick={() => setLessonMode('edit')}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                        lessonMode === 'edit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Редактирование
                    </button>
                    <button
                      type="button"
                      onClick={() => setLessonMode('preview')}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                        lessonMode === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Предпросмотр
                    </button>
                  </div>
                  {lessonMode === 'edit' ? (
                    <textarea
                      className="form-input min-h-56"
                      value={lessonForm.content ?? ''}
                      onChange={(event) => setLessonForm((form) => ({ ...form, content: event.target.value }))}
                      placeholder="Текст урока..."
                    />
                  ) : (
                    <div className="min-h-56 rounded-lg border border-gray-100 bg-white p-5">
                      <MarkdownContent content={lessonForm.content} />
                    </div>
                  )}
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="form-label">Порядок</span>
                    <select
                      className="form-input"
                      value={lessonForm.order_index}
                      onChange={(event) =>
                        setLessonForm((form) => ({ ...form, order_index: Number(event.target.value) }))
                      }
                      disabled={!lessonForm.course_id}
                    >
                      {lessonOrderOptions.map((order) => (
                        <option key={order} value={order}>
                          {order}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-gray-400">
                      Занятые номера скрыты. Для перестановки созданных уроков используйте стрелки в списке.
                    </span>
                  </label>

                  <label className="flex items-end gap-2 pb-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={lessonForm.is_premium}
                      onChange={(event) => setLessonForm((form) => ({ ...form, is_premium: event.target.checked }))}
                      className="size-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Premium урок
                  </label>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={lessonForm.is_published}
                    onChange={(event) => setLessonForm((form) => ({ ...form, is_published: event.target.checked }))}
                    className="size-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Опубликован
                </label>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" isLoading={savingLesson} disabled={!selectedCourseId}>
                    <Save size={18} aria-hidden="true" />
                    {editingLessonId ? 'Сохранить урок' : 'Добавить урок'}
                  </Button>
                  {editingLessonId && (
                    <Button variant="secondary" onClick={startNewLesson}>
                      <X size={18} aria-hidden="true" />
                      Отменить
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
