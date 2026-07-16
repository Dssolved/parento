import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import CourseCover from './CourseCover'
import { useAuth } from '../../hooks/useAuth'
import { getCourseAccessState } from '../../lib/access'
import { logEvent } from '../../lib/analytics'
import { getWeekRangeLabel } from '../../lib/weekCalculations'
import type { Course, Subscription } from '../../types/database'

interface CourseCardProps {
  course: Course
  userSubscription: Subscription
  /** Если задан, клик по карточке отправляет событие recommended_course_clicked с этим source. */
  analyticsSource?: string
}

export default function CourseCard({ course, userSubscription, analyticsSource }: CourseCardProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const access = getCourseAccessState(course, userSubscription)
  const weekRangeLabel = getWeekRangeLabel(course)

  const handleClick = () => {
    if (analyticsSource) {
      logEvent(
        'recommended_course_clicked',
        { source: analyticsSource, course_id: course.id, stage: course.stage },
        user?.id ?? null,
      )
    }
    navigate(`/course/${course.id}`)
  }

  return (
    <Card
      onClick={handleClick}
      className="group cursor-pointer overflow-hidden transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      <CourseCover src={course.cover_url} alt={course.title} />
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {course.stage !== 'all' && <Badge variant={course.stage} />}
          {course.is_premium && <Badge variant="premium" />}
          {weekRangeLabel && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {weekRangeLabel}
            </span>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
          {course.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">{course.description}</p>
          )}
        </div>
        {!access.canAccess && (
          <div className="flex items-center gap-1 text-sm font-medium text-emerald-700">
            <Lock size={15} aria-hidden="true" />
            {access.label}
          </div>
        )}
      </div>
    </Card>
  )
}
