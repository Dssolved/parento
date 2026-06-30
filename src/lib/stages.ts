import { Baby, HeartPulse, Sprout, type LucideIcon } from 'lucide-react'
import type { Stage } from '../types/database'

interface StageOption {
  value: Stage
  label: string
  shortLabel: string
  description: string
  Icon: LucideIcon
  tone: string
}

export const stageLabels: Record<Stage | 'all', string> = {
  all: 'Все',
  planning: 'Планирование',
  pregnancy: 'Беременность',
  newborn: 'До года',
}

export const stageOptions: StageOption[] = [
  {
    value: 'planning',
    label: 'Планируем ребёнка',
    shortLabel: 'Планирование',
    description: 'Подготовка, здоровье, разговоры в паре и первые решения.',
    Icon: Sprout,
    tone: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  {
    value: 'pregnancy',
    label: 'Ждём малыша',
    shortLabel: 'Беременность',
    description: 'Триместры, питание, сон, тревоги и подготовка к родам.',
    Icon: HeartPulse,
    tone: 'bg-rose-50 text-rose-700 border-rose-100',
  },
  {
    value: 'newborn',
    label: 'Малыш до года',
    shortLabel: 'До года',
    description: 'Уход, режим, развитие, привязанность и спокойные рутины.',
    Icon: Baby,
    tone: 'bg-amber-50 text-amber-700 border-amber-100',
  },
]

export function getStageLabel(stage: Stage | 'all' | null | undefined) {
  return stage ? stageLabels[stage] : 'Не выбрана'
}
