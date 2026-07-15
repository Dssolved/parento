import { useMemo } from 'react'
import { useCourses } from './useCourses'
import { getCurrentUserWeek, isTimelyForWeek } from '../lib/weekCalculations'
import type { Course, Profile, Stage } from '../types/database'

function windowWidth(course: Course) {
  if (course.week_from == null || course.week_to == null) return Number.POSITIVE_INFINITY
  return course.week_to - course.week_from
}

export function useRecommendedCourses(profile: Profile | null, stage: Stage | 'all') {
  const { data: courses, ...rest } = useCourses(stage)

  const currentWeek = profile ? getCurrentUserWeek(profile) : null

  const recommended = useMemo(() => {
    if (!courses || currentWeek == null) return []
    return courses
      .filter((course) => isTimelyForWeek(course, currentWeek))
      // Более узкий диапазon = более «именно на этой неделе» → показываем выше.
      .sort((first, second) => windowWidth(first) - windowWidth(second))
  }, [courses, currentWeek])

  return { recommended, currentWeek, allCourses: courses, ...rest }
}
