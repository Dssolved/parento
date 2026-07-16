import {
  ArrowRight,
  BookOpenCheck,
  CalendarHeart,
  CheckCircle2,
  Library,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import heroImage from '../assets/parento-hero.png'
import WeekDemo from '../components/landing/WeekDemo'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { logEvent } from '../lib/analytics'
import { stageOptions } from '../lib/stages'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { WaitlistSignupInsert } from '../types/database'

const benefits = [
  {
    title: 'Персонализация по неделям',
    text: 'Показываем курсы, актуальные именно на вашей неделе беременности или возрасте малыша, а не общий список для всех.',
    Icon: CalendarHeart,
  },
  { title: 'Структурированные знания', text: 'Курсы идут по шагам, без хаоса и бесконечных вкладок.', Icon: Library },
  { title: 'Проверенные источники', text: 'Уроки опираются на книги, исследования и бережный здравый смысл.', Icon: ShieldCheck },
  { title: 'Удобный формат', text: 'Короткие текстовые уроки легко проходить в своем темпе.', Icon: BookOpenCheck },
]

const freeFeatures = ['Базовые курсы', 'Выбор этапа', 'Отслеживание прогресса']
const premiumFeatures = ['Все курсы и уроки', 'Глубокие материалы', 'Приоритет новых программ']

export default function Landing() {
  const { user } = useAuth()
  const ctaPath = user ? '/dashboard' : '/register'

  const [email, setEmail] = useState('')
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [waitlistError, setWaitlistError] = useState('')

  const handleWaitlistSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setWaitlistError('')

    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setWaitlistError('Введите email.')
      return
    }

    if (!isSupabaseConfigured) {
      setWaitlistError('Supabase не настроен.')
      return
    }

    setWaitlistStatus('submitting')

    const payload: WaitlistSignupInsert = { email: trimmedEmail, source: '/landing' }
    const { error } = await supabase.from('waitlist_signups').insert(payload)

    if (error && error.code !== '23505') {
      setWaitlistError(
        error.message.includes('waitlist_signups')
          ? 'Форма пока не подключена. Нужно выполнить supabase/add-waitlist.sql.'
          : error.message,
      )
      setWaitlistStatus('idle')
      return
    }

    setWaitlistStatus('success')
    setEmail('')
  }

  return (
    <div className="bg-gray-50">
      <section className="relative isolate overflow-hidden bg-gray-950">
        <img
          src={heroImage}
          alt="Родитель читает материалы Parento в уютной детской комнате"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gray-950/55" />
        <div className="container-page relative flex min-h-[76svh] items-center py-20">
          <div className="max-w-2xl text-white">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
              <Sparkles size={16} aria-hidden="true" />
              От планирования до года — один маршрут
            </p>
            <h1 className="mt-6 text-5xl font-semibold leading-tight sm:text-6xl lg:text-7xl">Parento</h1>
            <p className="mt-2 text-lg font-medium text-emerald-300">Ваш путь родителя</p>
            <p className="mt-5 max-w-xl text-xl leading-8 text-white/90">
              Не знаете, что важно именно сейчас?
              <br />
              Parento показывает, что важно на вашей неделе, — и ведёт дальше шаг за шагом.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={ctaPath}
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-emerald-600 px-6 text-base font-medium text-white hover:bg-emerald-700"
              >
                Начать бесплатно
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                to={user ? '/profile' : '/login'}
                className="inline-flex min-h-12 items-center rounded-lg border border-white/70 px-6 text-base font-medium text-white hover:bg-white/10"
              >
                {user ? 'Моё обучение' : 'Войти'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Для кого</p>
          <h2 className="mt-2 text-3xl font-semibold text-gray-900 sm:text-4xl">Поддержка на каждом этапе</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {stageOptions.map(({ value, label, description, Icon, tone }) => (
            <Card key={value} className="p-6">
              <div className={`inline-flex size-12 items-center justify-center rounded-lg border ${tone}`}>
                <Icon size={24} aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-gray-900">{label}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Почему Parento</p>
            <h2 className="mt-2 text-3xl font-semibold text-gray-900 sm:text-4xl">Меньше тревоги, больше ясности</h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ title, text, Icon }) => (
              <div key={title} className="rounded-lg border border-gray-100 bg-gray-50 p-5">
                <Icon className="size-7 text-emerald-600" aria-hidden="true" />
                <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Как это работает</p>
            <h2 className="mt-2 text-3xl font-semibold text-gray-900 sm:text-4xl">Попробуйте прямо сейчас</h2>
            <p className="mt-4 leading-7 text-gray-500">
              Выберите этап и передвиньте ползунок недели — увидите, как каталог сам подсвечивает то, что важно именно на этом сроке, и убирает лишнее.
            </p>
          </div>
          <WeekDemo />
        </div>
      </section>

      <section className="container-page py-16">
        <div className="rounded-lg bg-emerald-950 p-6 text-white shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-300">
                <Mail size={16} aria-hidden="true" />
                Не готовы начать сейчас?
              </p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Оставьте email — сообщим о новых курсах</h2>
              <p className="mt-3 max-w-2xl leading-7 text-emerald-100">
                Пришлём короткое письмо, когда добавим новые курсы и функции вроде персонализации по неделям. Без спама.
              </p>
            </div>

            {waitlistStatus === 'success' ? (
              <p className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-3 text-sm font-medium text-white">
                <CheckCircle2 size={18} aria-hidden="true" />
                Спасибо! Вы в списке.
              </p>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <label className="sr-only" htmlFor="waitlist-email">
                  Email
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="min-h-11 w-full rounded-lg border border-white/20 bg-white/10 px-4 text-white placeholder:text-emerald-200/70 outline-none focus:border-white/50 focus:ring-4 focus:ring-white/10 sm:w-64"
                />
                <Button type="submit" isLoading={waitlistStatus === 'submitting'} className="shrink-0">
                  Подписаться
                </Button>
              </form>
            )}
          </div>
          {waitlistError && (
            <p className="mt-3 max-w-2xl rounded-lg bg-rose-500/15 px-4 py-2 text-sm text-rose-100">{waitlistError}</p>
          )}
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Тарифы</p>
            <h2 className="mt-2 text-3xl font-semibold text-gray-900 sm:text-4xl">Начните бесплатно, расширяйтесь когда нужно</h2>
            <p className="mt-4 leading-7 text-gray-500">Откройте расширенную библиотеку курсов, когда почувствуете, что базового доступа уже мало.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <p className="text-sm font-semibold text-gray-500">Free</p>
              <p className="mt-3 text-3xl font-semibold text-gray-900">0</p>
              <ul className="mt-5 space-y-3">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="border-emerald-200 p-6 shadow-soft">
              <p className="text-sm font-semibold text-emerald-700">Premium</p>
              <p className="mt-3 text-3xl font-semibold text-gray-900">Расширенный доступ</p>
              <ul className="mt-5 space-y-3">
                {premiumFeatures.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                to={user ? '/subscribe' : '/register'}
                onClick={() => logEvent('premium_cta_clicked', { source: 'landing_pricing' }, user?.id ?? null)}
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 font-medium text-white hover:bg-emerald-700"
              >
                Смотреть тариф
              </Link>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
