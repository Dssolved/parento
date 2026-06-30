import type { Stage } from '../../types/database'

type BadgeVariant = Stage | 'all' | 'premium' | 'free' | 'completed'

const labels: Record<BadgeVariant, string> = {
  all: 'Все',
  planning: 'Планирование',
  pregnancy: 'Беременность',
  newborn: 'До года',
  premium: 'Premium',
  free: 'Free',
  completed: 'Пройдено',
}

const colors: Record<BadgeVariant, string> = {
  all: 'bg-gray-100 text-gray-600',
  planning: 'bg-blue-100 text-blue-700',
  pregnancy: 'bg-rose-100 text-rose-700',
  newborn: 'bg-amber-100 text-amber-700',
  premium: 'bg-emerald-100 text-emerald-700',
  free: 'bg-gray-100 text-gray-600',
  completed: 'bg-teal-100 text-teal-700',
}

export default function Badge({ variant }: { variant: BadgeVariant }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[variant]}`}>
      {labels[variant]}
    </span>
  )
}
