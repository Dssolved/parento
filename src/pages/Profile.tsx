import { AlertTriangle, CalendarHeart, Crown, LogOut, MessageSquareText, Trash2, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import DatePicker from '../components/ui/DatePicker'
import { useAuth } from '../hooks/useAuth'
import { useProgress } from '../hooks/useProgress'
import { caregiverRoleOptions, getCaregiverRoleLabel } from '../lib/caregiverRoles'
import { getStageLabel, stageOptions } from '../lib/stages'
import { supabase } from '../lib/supabase'
import { getCurrentUserWeek } from '../lib/weekCalculations'
import type { CaregiverRole, Stage } from '../types/database'

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10)
}

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
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const canDeleteAccount = deleteConfirmation.trim().toUpperCase() === 'УДАЛИТЬ'

  const [dueDate, setDueDate] = useState(profile?.due_date ?? '')
  const [birthDate, setBirthDate] = useState(profile?.birth_date ?? '')
  const [savingDate, setSavingDate] = useState(false)
  const [dateError, setDateError] = useState('')

  useEffect(() => {
    setDueDate(profile?.due_date ?? '')
    setBirthDate(profile?.birth_date ?? '')
  }, [profile?.due_date, profile?.birth_date])

  const today = toISODate(new Date())
  const oneYearAgo = toISODate(new Date(new Date().setFullYear(new Date().getFullYear() - 1)))
  const dueDateMin = toISODate(new Date(new Date().setDate(new Date().getDate() - 21)))
  const dueDateMax = toISODate(new Date(new Date().setDate(new Date().getDate() + 294)))
  const currentWeek = profile ? getCurrentUserWeek(profile) : null

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

  const saveDate = async () => {
    if (!user || !profile) return

    setDateError('')
    setSavingDate(true)

    const payload =
      profile.stage === 'pregnancy'
        ? { due_date: dueDate || null }
        : profile.stage === 'newborn'
          ? { birth_date: birthDate || null }
          : {}

    const { error: updateError } = await supabase.from('profiles').update(payload).eq('id', user.id)

    if (updateError) {
      setDateError(updateError.message)
      setSavingDate(false)
      return
    }

    await refreshProfile()
    setSavingDate(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const handleDeleteAccount = async () => {
    if (!user || !canDeleteAccount || deletingAccount) return

    const confirmed = window.confirm('Аккаунт и данные профиля будут удалены без возможности восстановления. Продолжить?')
    if (!confirmed) return

    setDeleteError('')
    setDeletingAccount(true)

    const { error } = await supabase.rpc('delete_current_user')

    if (error) {
      setDeleteError(
        error.message.includes('Could not find the function')
          ? 'Функция удаления еще не добавлена в Supabase. Выполните supabase/add-account-deletion.sql.'
          : error.message,
      )
      setDeletingAccount(false)
      return
    }

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

          {(profile?.stage === 'pregnancy' || profile?.stage === 'newborn') && (
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-100">
                  <CalendarHeart size={20} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {profile.stage === 'pregnancy' ? 'Предполагаемая дата родов' : 'Дата рождения малыша'}
                  </h2>
                  <p className="mt-2 text-gray-500">
                    {currentWeek != null
                      ? profile.stage === 'pregnancy'
                        ? `Сейчас ${currentWeek}-я неделя беременности. Мы показываем актуальные для неё курсы.`
                        : `Малышу сейчас ${currentWeek} нед. Мы показываем актуальные для этого возраста курсы.`
                      : 'Укажите дату, чтобы видеть персональные рекомендации курсов по неделе.'}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-end gap-3">
                <div className="w-full space-y-2 sm:w-72">
                  <span className="form-label">
                    {profile.stage === 'pregnancy' ? 'ПДР' : 'Дата рождения'}
                  </span>
                  {profile.stage === 'pregnancy' ? (
                    <DatePicker
                      value={dueDate}
                      onChange={setDueDate}
                      min={dueDateMin}
                      max={dueDateMax}
                      placeholder="Когда ждёте малыша?"
                    />
                  ) : (
                    <DatePicker
                      value={birthDate}
                      onChange={setBirthDate}
                      min={oneYearAgo}
                      max={today}
                      placeholder="Когда родился малыш?"
                    />
                  )}
                </div>
                <Button onClick={saveDate} isLoading={savingDate}>
                  Сохранить
                </Button>
              </div>

              {dateError && <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{dateError}</p>}
            </Card>
          )}

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

          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <MessageSquareText size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Помочь улучшить Parento</h2>
                <p className="mt-2 text-gray-500">
                  Расскажите, что было удобно, где возникли сложности и чего не хватило.
                </p>
              </div>
            </div>
            <Link
              to="/feedback?from=/profile"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-gray-100 px-5 font-medium text-gray-800 hover:bg-gray-200"
            >
              Оставить отзыв
            </Link>
          </Card>

          <Card className="border-rose-100 p-6">
            <div className="flex items-start gap-3">
              <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                <AlertTriangle size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Удаление аккаунта</h2>
                <p className="mt-2 text-gray-500">
                  Будут удалены аккаунт, профиль, выбранный этап, роль, подписка и прогресс по урокам. Это действие нельзя отменить.
                </p>
              </div>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="form-label">Введите УДАЛИТЬ для подтверждения</span>
              <input
                className="form-input"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder="УДАЛИТЬ"
              />
            </label>

            {deleteError && <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{deleteError}</p>}

            <Button
              className="mt-4"
              variant="secondary"
              onClick={handleDeleteAccount}
              disabled={!canDeleteAccount}
              isLoading={deletingAccount}
            >
              <Trash2 size={17} aria-hidden="true" />
              Удалить аккаунт
            </Button>
          </Card>
        </div>
      </div>
    </section>
  )
}
