import { CheckCircle2, Crown, LockKeyhole, Sparkles } from 'lucide-react'
import { useState } from 'react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const freeFeatures = [
  'Открытые курсы и уроки',
  'Персональный этап и роль',
  'Прогресс по урокам',
  'Продолжение обучения с дашборда',
]

const premiumFeatures = [
  'Premium курсы и уроки',
  'Глубокие материалы для сложных тем',
  'Полная библиотека по вашему этапу',
  'Доступ к будущим Premium-разделам',
]

export default function Subscribe() {
  const { user, profile, refreshProfile } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isPremium = profile?.subscription === 'premium'

  const activatePremium = async () => {
    if (!user) return

    setLoading(true)
    setError('')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscription: 'premium' })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    await refreshProfile()
    setLoading(false)
  }

  return (
    <section className="container-page py-12">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Подписка</p>
          <h1 className="mt-2 text-4xl font-semibold text-gray-900">Free или Premium</h1>
          <p className="mt-3 text-lg leading-8 text-gray-500">
            Premium открывает закрытые курсы и уроки, чтобы вы могли идти глубже там, где базовых материалов уже мало.
          </p>
        </div>

        <Card className="border-emerald-200 bg-emerald-50 p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
            <Sparkles size={17} aria-hidden="true" />
            Текущий статус
          </p>
          <p className="mt-3 text-3xl font-semibold text-emerald-950">{isPremium ? 'Premium' : 'Free'}</p>
          <p className="mt-2 text-sm leading-6 text-emerald-800">
            {isPremium
              ? 'Premium уже активен. Закрытые материалы открываются автоматически.'
              : 'Сейчас доступны базовые курсы и открытые уроки.'}
          </p>
        </Card>
      </div>

      <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        Оплата пока работает в демо-режиме: кнопка ниже просто переключает профиль на Premium без реального платежа.
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card className={`p-6 ${!isPremium ? 'border-emerald-200 shadow-soft' : ''}`}>
          <p className="text-sm font-semibold text-gray-500">Free</p>
          <h2 className="mt-3 text-3xl font-semibold text-gray-900">Базовый доступ</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Подходит, чтобы начать обучение, выбрать этап и проходить открытые материалы.
          </p>
          <ul className="mt-6 space-y-3">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex gap-2 text-gray-600">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
          {!isPremium && (
            <p className="mt-7 inline-flex min-h-11 items-center rounded-lg bg-gray-100 px-5 font-medium text-gray-700">
              Активен сейчас
            </p>
          )}
        </Card>

        <Card className={`p-6 ${isPremium ? 'border-emerald-200 bg-emerald-50 shadow-soft' : 'border-emerald-200 shadow-soft'}`}>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <Crown size={17} aria-hidden="true" />
            Premium
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-gray-900">Полная библиотека</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Нужен для закрытых курсов, Premium-уроков и расширенных материалов.
          </p>
          <ul className="mt-6 space-y-3">
            {premiumFeatures.map((feature) => (
              <li key={feature} className="flex gap-2 text-gray-600">
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
          <Button className="mt-7" onClick={activatePremium} isLoading={loading} disabled={isPremium}>
            {isPremium ? 'Premium активен' : 'Активировать Premium'}
          </Button>
        </Card>
      </div>

      <Card className="mt-8 p-6">
        <p className="flex items-center gap-2 font-semibold text-gray-900">
          <LockKeyhole className="size-5 text-emerald-600" aria-hidden="true" />
          Как работает доступ
        </p>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Если курс или урок отмечен как Premium, пользователь Free видит закрытое состояние и переход на эту страницу.
          После активации Premium те же материалы открываются без дополнительных действий.
        </p>
      </Card>

      {error && <p className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    </section>
  )
}
