import { Crown, LogOut, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useProgress } from '../hooks/useProgress'
import { caregiverRoleOptions, getCaregiverRoleLabel } from '../lib/caregiverRoles'
import { getStageLabel, stageOptions } from '../lib/stages'
import { supabase } from '../lib/supabase'
import type { CaregiverRole, Stage } from '../types/database'

function getInitials(fullName: string | null | undefined, email: string | null | undefined) {
  const nameParts = fullName
    ?.trim()
    .split(/\s+/)
    .filter(Boolean)

  if (nameParts?.length) {
    return nameParts
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }

  return email?.slice(0, 2).toUpperCase() ?? ''
}

export default function Profile() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const { data: progress = [] } = useProgress(user?.id ?? '')

  const updateStage = async (stage: Stage) => {
    if (!user) return
    await supabase.from('profiles').update({ stage }).eq('id', user.id)
    await refreshProfile()
  }

  const updateCaregiverRole = async (caregiverRole: CaregiverRole) => {
    if (!user) return
    await supabase.from('profiles').update({ caregiver_role: caregiverRole }).eq('id', user.id)
    await refreshProfile()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (!user) return null

  return (
    <section className="container-page py-10">
      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className="p-6">
          <div className="inline-flex size-16 items-center justify-center rounded-full bg-emerald-600 text-xl font-semibold text-white">
            {getInitials(profile?.full_name, user.email) || <UserRound size={24} aria-hidden="true" />}
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-gray-900">{profile?.full_name || 'Профиль Parento'}</h1>
          <p className="mt-1 break-all text-sm text-gray-500">{user.email}</p>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">Этап</span>
              <span className="font-medium text-gray-900">{getStageLabel(profile?.stage)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">Роль</span>
              <span className="font-medium text-gray-900">{getCaregiverRoleLabel(profile?.caregiver_role)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">Подписка</span>
              <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                <Crown size={15} aria-hidden="true" />
                {profile?.subscription === 'premium' ? 'Premium' : 'Free'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-500">Прогресс</span>
              <span className="font-medium text-gray-900">{progress.length} уроков</span>
            </div>
          </div>

          {profile?.subscription === 'free' && (
            <Link
              to="/subscribe"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-600 px-5 font-medium text-white hover:bg-emerald-700"
            >
              Перейти на Premium
            </Link>
          )}

          <Button variant="secondary" className="mt-3 w-full" onClick={handleSignOut}>
            <LogOut size={17} aria-hidden="true" />
            Выйти
          </Button>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900">Текущая стадия</h2>
            <p className="mt-2 text-gray-500">Можно изменить этап, если контекст семьи поменялся.</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {stageOptions.map(({ value, label, Icon, tone }) => (
                <button key={value} type="button" onClick={() => updateStage(value)} className="text-left">
                  <div
                    className={`h-full rounded-lg border p-4 transition hover:shadow-sm ${
                      profile?.stage === value ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className={`inline-flex size-10 items-center justify-center rounded-lg border ${tone}`}>
                      <Icon size={20} aria-hidden="true" />
                    </div>
                    <p className="mt-3 font-medium text-gray-900">{label}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900">Роль в семье</h2>
            <p className="mt-2 text-gray-500">
              Это не ограничивает доступ к материалам, а помогает точнее настраивать рекомендации.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {caregiverRoleOptions.map(({ value, label, Icon, tone }) => (
                <button key={value} type="button" onClick={() => updateCaregiverRole(value)} className="text-left">
                  <div
                    className={`h-full rounded-lg border p-4 transition hover:shadow-sm ${
                      profile?.caregiver_role === value
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className={`inline-flex size-10 items-center justify-center rounded-lg border ${tone}`}>
                      <Icon size={20} aria-hidden="true" />
                    </div>
                    <p className="mt-3 font-medium text-gray-900">{label}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900">Прогресс</h2>
            <p className="mt-2 text-gray-500">Количество уроков, которые вы отметили как пройденные.</p>
            <p className="mt-6 text-5xl font-semibold text-emerald-700">{progress.length}</p>
          </Card>
        </div>
      </div>
    </section>
  )
}
