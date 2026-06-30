import type { Course, Lesson, Subscription } from '../types/database'

export interface AccessState {
  canAccess: boolean
  label: string
  description: string
  ctaLabel: string
  ctaTo: string
}

function hasPremium(subscription: Subscription) {
  return subscription === 'premium'
}

export function canAccessCourse(course: Course, subscription: Subscription) {
  return hasPremium(subscription) || !course.is_premium
}

export function canAccessLesson(course: Course | null | undefined, lesson: Lesson, subscription: Subscription) {
  return hasPremium(subscription) || (!course?.is_premium && !lesson.is_premium)
}

export function getCourseAccessState(course: Course, subscription: Subscription): AccessState {
  if (canAccessCourse(course, subscription)) {
    return {
      canAccess: true,
      label: course.is_premium ? 'Premium открыт' : 'Доступ открыт',
      description: course.is_premium
        ? 'Этот курс входит в вашу Premium-подписку.'
        : 'Этот курс доступен на базовом тарифе.',
      ctaLabel: 'Открыть курс',
      ctaTo: `/course/${course.id}`,
    }
  }

  return {
    canAccess: false,
    label: 'Premium доступ',
    description: 'Откройте Premium, чтобы получить доступ ко всем урокам курса.',
    ctaLabel: 'Открыть Premium',
    ctaTo: '/subscribe',
  }
}

export function getLessonAccessState(
  course: Course | null | undefined,
  lesson: Lesson,
  subscription: Subscription,
): AccessState {
  if (canAccessLesson(course, lesson, subscription)) {
    return {
      canAccess: true,
      label: lesson.is_premium || course?.is_premium ? 'Premium открыт' : 'Доступ открыт',
      description: lesson.is_premium || course?.is_premium
        ? 'Этот урок входит в вашу Premium-подписку.'
        : 'Этот урок доступен на базовом тарифе.',
      ctaLabel: 'Открыть урок',
      ctaTo: `/lesson/${lesson.id}`,
    }
  }

  return {
    canAccess: false,
    label: course?.is_premium ? 'Урок Premium-курса' : 'Premium урок',
    description: course?.is_premium
      ? 'Этот урок входит в Premium-курс. Откройте Premium, чтобы продолжить обучение.'
      : 'Этот урок доступен после перехода на Premium.',
    ctaLabel: 'Открыть Premium',
    ctaTo: '/subscribe',
  }
}
