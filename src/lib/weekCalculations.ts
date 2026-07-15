/**
 * Гестационная неделя беременности (1-42) на основе предполагаемой даты родов.
 * Стандартная беременность = 280 дней (40 недель) от зачатия до ПДР.
 */
export function getPregnancyWeek(dueDate: string): number {
  const due = new Date(dueDate)
  const conception = new Date(due)
  conception.setDate(conception.getDate() - 280)

  const today = new Date()
  const diffDays = Math.floor((today.getTime() - conception.getTime()) / (1000 * 60 * 60 * 24))
  const week = Math.floor(diffDays / 7) + 1

  return Math.min(Math.max(week, 1), 42)
}

/**
 * Возраст малыша в неделях (0-52) на основе даты рождения.
 */
export function getBabyAgeWeeks(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  const diffDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24))
  const week = Math.floor(diffDays / 7)

  return Math.min(Math.max(week, 0), 52)
}

/**
 * Универсальная функция: возвращает текущую "неделю" пользователя
 * в зависимости от его стадии, либо null если неделя неприменима
 * (стадия planning, либо не заполнена нужная дата).
 */
export function getCurrentUserWeek(profile: {
  stage: string | null
  due_date: string | null
  birth_date: string | null
}): number | null {
  if (profile.stage === 'pregnancy' && profile.due_date) {
    return getPregnancyWeek(profile.due_date)
  }
  if (profile.stage === 'newborn' && profile.birth_date) {
    return getBabyAgeWeeks(profile.birth_date)
  }
  return null
}

/**
 * Проверяет, попадает ли текущая неделя пользователя в диапазон курса.
 * Если у курса week_from/week_to не заданы — считается всегда актуальным.
 */
export function isRelevantForWeek(
  course: { week_from: number | null; week_to: number | null },
  currentWeek: number | null
): boolean {
  if (course.week_from == null || course.week_to == null) return true
  if (currentWeek == null) return true
  return currentWeek >= course.week_from && currentWeek <= course.week_to
}

/**
 * Строгая проверка «именно на этой неделе»: курс должен иметь заданный
 * диапазон недель и текущая неделя должна в него попадать. В отличие от
 * isRelevantForWeek, курсы без диапазона (null) сюда НЕ попадают — они
 * остаются в общем каталоге, но не в секции «Актуально сейчас».
 */
export function isTimelyForWeek(
  course: { week_from: number | null; week_to: number | null },
  currentWeek: number | null
): boolean {
  if (currentWeek == null) return false
  if (course.week_from == null || course.week_to == null) return false
  return currentWeek >= course.week_from && currentWeek <= course.week_to
}

/**
 * Человекочитаемая плашка диапазона недель для карточки курса.
 * Возвращает undefined, если диапазон не задан или неприменим к стадии.
 */
export function getWeekRangeLabel(course: {
  stage: string
  week_from: number | null
  week_to: number | null
}): string | undefined {
  if (course.week_from == null || course.week_to == null) return undefined
  if (course.stage === 'pregnancy') return `Неделя ${course.week_from}–${course.week_to}`
  if (course.stage === 'newborn') return `${course.week_from}–${course.week_to} нед. малышу`
  return undefined
}
