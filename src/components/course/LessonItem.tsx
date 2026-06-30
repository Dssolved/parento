import { CheckCircle2, ChevronRight, Lock, PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import type { Lesson } from '../../types/database'

interface LessonItemProps {
  lesson: Lesson
  isCompleted: boolean
  isLocked: boolean
}

export default function LessonItem({ lesson, isCompleted, isLocked }: LessonItemProps) {
  return (
    <Card className="transition hover:shadow-soft">
      <Link
        to={isLocked ? '/subscribe' : `/lesson/${lesson.id}`}
        className="flex items-center justify-between gap-4 p-4"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${
              isCompleted ? 'bg-teal-50 text-teal-700' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {isLocked ? (
              <Lock size={20} aria-hidden="true" />
            ) : isCompleted ? (
              <CheckCircle2 size={20} aria-hidden="true" />
            ) : (
              <PlayCircle size={20} aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">{lesson.title}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {isCompleted && <Badge variant="completed" />}
              {lesson.is_premium && <Badge variant="premium" />}
            </div>
          </div>
        </div>
        <ChevronRight className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
      </Link>
    </Card>
  )
}
