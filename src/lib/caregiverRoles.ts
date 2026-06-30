import { HeartHandshake, Shield, UserRound, UsersRound, type LucideIcon } from 'lucide-react'
import type { CaregiverRole } from '../types/database'

interface CaregiverRoleOption {
  value: CaregiverRole
  label: string
  shortLabel: string
  description: string
  Icon: LucideIcon
  tone: string
}

export const caregiverRoleLabels: Record<CaregiverRole, string> = {
  mother: 'Мама',
  father: 'Папа',
  partner: 'Партнёр',
  caregiver: 'Близкий взрослый',
  prefer_not_to_say: 'Не указывать',
}

export const caregiverRoleOptions: CaregiverRoleOption[] = [
  {
    value: 'mother',
    label: 'Мама',
    shortLabel: 'Мама',
    description: 'Материалы о подготовке, заботе о себе, восстановлении и родительской устойчивости.',
    Icon: UserRound,
    tone: 'bg-rose-50 text-rose-700 border-rose-100',
  },
  {
    value: 'father',
    label: 'Папа',
    shortLabel: 'Папа',
    description: 'Фокус на участии, поддержке семьи, уходе за ребёнком и партнёрстве.',
    Icon: Shield,
    tone: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  {
    value: 'partner',
    label: 'Партнёр',
    shortLabel: 'Партнёр',
    description: 'Для тех, кто проходит этот путь рядом и хочет быть надёжной опорой.',
    Icon: HeartHandshake,
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    value: 'caregiver',
    label: 'Другой близкий взрослый',
    shortLabel: 'Близкий взрослый',
    description: 'Для родственников и взрослых, которые участвуют в заботе о ребёнке.',
    Icon: UsersRound,
    tone: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  {
    value: 'prefer_not_to_say',
    label: 'Предпочитаю не указывать',
    shortLabel: 'Не указано',
    description: 'Можно оставить без уточнения и пользоваться всеми материалами.',
    Icon: UserRound,
    tone: 'bg-gray-50 text-gray-700 border-gray-100',
  },
]

export function getCaregiverRoleLabel(role: CaregiverRole | null | undefined) {
  return role ? caregiverRoleLabels[role] : 'Не указана'
}
